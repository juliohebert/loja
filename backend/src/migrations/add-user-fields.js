/**
 * Script de migração para adicionar campos telefone e permissoes ao modelo User
 * Executa: node src/migrations/add-user-fields.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'loja_roupas',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function runMigration() {
  try {
    console.log('🔄 Iniciando migração...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Adicionar coluna telefone
    await sequelize.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
    `);
    console.log('✅ Coluna telefone adicionada');

    // Adicionar coluna permissoes (JSONB)
    await sequelize.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('✅ Coluna permissoes adicionada');

    // Atualizar ENUM funcao para incluir 'vendedor' em vez de 'usuario'
    // Primeiro verificar se o tipo existe
    const [types] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'enum_usuarios_funcao'
      );
    `);

    if (types[0].exists) {
      // Adicionar valor 'vendedor' ao ENUM se não existir
      await sequelize.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'vendedor' 
            AND enumtypid = 'enum_usuarios_funcao'::regtype
          ) THEN
            ALTER TYPE enum_usuarios_funcao ADD VALUE 'vendedor';
          END IF;
        END $$;
      `);
      console.log('✅ Valor "vendedor" adicionado ao ENUM funcao');

      // Atualizar registros antigos de 'usuario' para 'vendedor'
      await sequelize.query(`
        UPDATE usuarios 
        SET funcao = 'vendedor' 
        WHERE funcao = 'usuario';
      `);
      console.log('✅ Registros de "usuario" atualizados para "vendedor"');
    }

    // Inicializar permissoes padrão para usuários existentes que não têm
    await sequelize.query(`
      UPDATE usuarios 
      SET permissoes = 
        CASE 
          WHEN funcao = 'admin' THEN '{
            "produtos": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
            "estoque": {"editar": true, "visualizar": true},
            "vendas": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
            "financeiro": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
            "clientes": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
            "usuarios": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
            "relatorios": {"visualizar": true},
            "configuracoes": {"editar": true, "visualizar": true},
            "caixa": {"abrir": true, "fechar": true, "visualizar": true}
          }'::jsonb
          WHEN funcao = 'gerente' THEN '{
            "produtos": {"criar": true, "editar": true, "visualizar": true},
            "estoque": {"editar": true, "visualizar": true},
            "vendas": {"criar": true, "editar": true, "visualizar": true},
            "financeiro": {"criar": true, "editar": true, "visualizar": true},
            "clientes": {"criar": true, "editar": true, "visualizar": true},
            "relatorios": {"visualizar": true},
            "configuracoes": {"visualizar": true},
            "caixa": {"abrir": true, "fechar": true, "visualizar": true}
          }'::jsonb
          WHEN funcao = 'vendedor' THEN '{
            "produtos": {"visualizar": true},
            "estoque": {"visualizar": true},
            "vendas": {"criar": true, "visualizar": true},
            "clientes": {"visualizar": true},
            "caixa": {"visualizar": true}
          }'::jsonb
          ELSE '{}'::jsonb
        END
      WHERE permissoes IS NULL OR permissoes = '{}'::jsonb;
    `);
    console.log('✅ Permissões padrão inicializadas para usuários existentes');

    await sequelize.close();
    console.log('✅ Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration();
