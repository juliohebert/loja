// Script para executar migration de slug_catalogo e gerar slugs para tenants existentes
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Função para gerar slug único
function gerarSlug(texto) {
  if (!texto) return null;
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
}

async function runMigration() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conectado com sucesso!\n');

    console.log('🔄 Verificando se coluna slug_catalogo já existe...');
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'configuracoes' AND column_name = 'slug_catalogo';
    `);

    if (columns.length > 0) {
      console.log('⚠️  Coluna slug_catalogo já existe. Pulando criação...\n');
    } else {
      console.log('🔄 Executando migration: add-slug-catalogo-configuracoes...');
      
      // Adicionar coluna slug_catalogo
      await sequelize.query(`
        ALTER TABLE configuracoes 
        ADD COLUMN IF NOT EXISTS slug_catalogo VARCHAR(100);
      `);
      console.log('✅ Coluna slug_catalogo adicionada');

      // Criar índice
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_configuracoes_slug_catalogo 
        ON configuracoes(slug_catalogo);
      `);
      console.log('✅ Índice idx_configuracoes_slug_catalogo criado\n');
    }

    // Buscar todos os tenants únicos
    console.log('🔄 Buscando tenants existentes...');
    const [tenants] = await sequelize.query(`
      SELECT DISTINCT tenant_id 
      FROM usuarios 
      WHERE tenant_id IS NOT NULL 
      ORDER BY tenant_id;
    `);

    console.log(`📊 Encontrados ${tenants.length} tenants:\n`);

    // Gerar slug para cada tenant que não tem
    for (const tenant of tenants) {
      const tenantId = tenant.tenant_id;
      
      // Verificar se já tem slug configurado
      const [existing] = await sequelize.query(`
        SELECT slug_catalogo 
        FROM configuracoes 
        WHERE tenant_id = :tenantId AND chave = 'slug_catalogo'
        LIMIT 1;
      `, {
        replacements: { tenantId }
      });

      if (existing.length > 0 && existing[0].slug_catalogo) {
        console.log(`  ✓ Tenant "${tenantId}" já tem slug: ${existing[0].slug_catalogo}`);
        continue;
      }

      // Buscar nome da loja para gerar slug
      const [config] = await sequelize.query(`
        SELECT valor 
        FROM configuracoes 
        WHERE tenant_id = :tenantId AND chave = 'nome_loja'
        LIMIT 1;
      `, {
        replacements: { tenantId }
      });

      let slug = gerarSlug(tenantId);
      
      if (config.length > 0 && config[0].valor) {
        const nomeLoja = config[0].valor;
        slug = gerarSlug(nomeLoja);
      }

      // Garantir unicidade do slug
      let slugFinal = slug;
      let contador = 1;
      let slugExiste = true;

      while (slugExiste) {
        const [check] = await sequelize.query(`
          SELECT slug_catalogo 
          FROM configuracoes 
          WHERE slug_catalogo = :slug
          LIMIT 1;
        `, {
          replacements: { slug: slugFinal }
        });

        if (check.length === 0) {
          slugExiste = false;
        } else {
          slugFinal = `${slug}-${contador}`;
          contador++;
        }
      }

      // Inserir ou atualizar configuração do slug
      await sequelize.query(`
        INSERT INTO configuracoes (id, chave, valor, slug_catalogo, tipo, tenant_id, criado_em, atualizado_em)
        VALUES (
          gen_random_uuid(),
          'slug_catalogo',
          :slug,
          :slug,
          'texto',
          :tenantId,
          NOW(),
          NOW()
        )
        ON CONFLICT (chave, tenant_id) 
        DO UPDATE SET 
          slug_catalogo = :slug,
          valor = :slug,
          atualizado_em = NOW();
      `, {
        replacements: { slug: slugFinal, tenantId }
      });

      console.log(`  ✅ Tenant "${tenantId}" → slug: "${slugFinal}"`);
    }

    console.log('\n✅ Migration executada com sucesso!');
    console.log('\n📋 Links dos catálogos gerados:');
    
    const [slugs] = await sequelize.query(`
      SELECT tenant_id, slug_catalogo 
      FROM configuracoes 
      WHERE chave = 'slug_catalogo' AND slug_catalogo IS NOT NULL
      ORDER BY tenant_id;
    `);

    slugs.forEach(row => {
      console.log(`   ${row.tenant_id}: /catalogo/${row.slug_catalogo}`);
    });

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Conexão fechada');
  }
}

runMigration();
