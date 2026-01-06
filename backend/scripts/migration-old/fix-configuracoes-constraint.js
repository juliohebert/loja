const { sequelize } = require('./src/config/database');

async function fixConfiguracoesConstraint() {
  console.log('🔧 Corrigindo constraint da tabela configuracoes...\n');

  try {
    // 1. Verificar constraints existentes
    const [constraints] = await sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'configuracoes' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%chave%'
    `);

    console.log('📋 Constraints existentes:', constraints);

    // 2. Remover constraints antigos de chave única
    for (const constraint of constraints) {
      console.log(`🗑️  Removendo constraint: ${constraint.constraint_name}`);
      await sequelize.query(`
        ALTER TABLE configuracoes DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}"
      `);
    }

    // 3. Adicionar constraint correto (chave + tenantId)
    console.log('\n✅ Adicionando constraint UNIQUE (chave, "tenantId")...');
    await sequelize.query(`
      ALTER TABLE configuracoes 
      ADD CONSTRAINT configuracoes_chave_tenant_unique 
      UNIQUE (chave, "tenantId")
    `);

    console.log('✅ Constraint corrigido com sucesso!');

    // 4. Verificar configurações duplicadas
    const [duplicatas] = await sequelize.query(`
      SELECT chave, "tenantId", COUNT(*) as total
      FROM configuracoes
      GROUP BY chave, "tenantId"
      HAVING COUNT(*) > 1
    `);

    if (duplicatas.length > 0) {
      console.log('\n⚠️  Configurações duplicadas encontradas:');
      duplicatas.forEach(dup => {
        console.log(`   - ${dup.chave} (tenant: ${dup.tenantId}): ${dup.total} registros`);
      });
      
      // Manter apenas o mais recente de cada duplicata
      console.log('\n🧹 Removendo duplicatas (mantendo apenas o mais recente)...');
      for (const dup of duplicatas) {
        await sequelize.query(`
          DELETE FROM configuracoes
          WHERE id IN (
            SELECT id 
            FROM configuracoes 
            WHERE chave = :chave AND "tenantId" = :tenantId
            ORDER BY criado_em ASC
            LIMIT (
              SELECT COUNT(*) - 1 
              FROM configuracoes 
              WHERE chave = :chave AND "tenantId" = :tenantId
            )
          )
        `, {
          replacements: { chave: dup.chave, tenantId: dup.tenantId }
        });
      }
      console.log('✅ Duplicatas removidas!');
    }

    console.log('\n✅ Correção finalizada com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao corrigir constraints:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

fixConfiguracoesConstraint()
  .then(() => {
    console.log('\n✅ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });
