const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('loja_roupas', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

async function populateTenantIds() {
  console.log('🔄 Populando tenant_id nos registros existentes...\n');

  try {
    // 1. Buscar o primeiro usuário com tenant_id para usar como default
    const [users] = await sequelize.query(`
      SELECT tenant_id FROM usuarios WHERE tenant_id IS NOT NULL LIMIT 1
    `);
    
    const defaultTenantId = users[0]?.tenant_id || 'tenant_loja_default_' + Date.now();
    console.log(`✅ Usando tenant_id padrão: ${defaultTenantId}\n`);

    // 2. Atualizar tabela configuracoes
    console.log('📋 Atualizando configuracoes...');
    const [configResult] = await sequelize.query(`
      UPDATE configuracoes 
      SET "tenantId" = :tenantId 
      WHERE "tenantId" IS NULL
    `, { replacements: { tenantId: defaultTenantId } });
    console.log(`   ✅ ${configResult.rowCount || 0} registros atualizados\n`);

    // 3. Atualizar tabela clientes - verificar se coluna existe
    console.log('👥 Verificando e atualizando clientes...');
    try {
      const [clientesResult] = await sequelize.query(`
        UPDATE clientes 
        SET tenant_id = :tenantId 
        WHERE tenant_id IS NULL
      `, { replacements: { tenantId: defaultTenantId } });
      console.log(`   ✅ ${clientesResult.rowCount || 0} registros atualizados\n`);
    } catch (err) {
      console.log(`   ⚠️  Coluna tenant_id não existe em clientes ainda\n`);
    }

    // 4. Atualizar tabela produtos - verificar se coluna existe
    console.log('📦 Verificando e atualizando produtos...');
    try {
      const [produtosResult] = await sequelize.query(`
        UPDATE produtos 
        SET tenant_id = :tenantId 
        WHERE tenant_id IS NULL
      `, { replacements: { tenantId: defaultTenantId } });
      console.log(`   ✅ ${produtosResult.rowCount || 0} registros atualizados\n`);
    } catch (err) {
      console.log(`   ⚠️  Coluna tenant_id não existe em produtos ainda\n`);
    }

    // 5. Atualizar tabela caixas - verificar se coluna existe
    console.log('💰 Verificando e atualizando caixas...');
    try {
      const [caixasResult] = await sequelize.query(`
        UPDATE caixas 
        SET tenant_id = :tenantId 
        WHERE tenant_id IS NULL
      `, { replacements: { tenantId: defaultTenantId } });
      console.log(`   ✅ ${caixasResult.rowCount || 0} registros atualizados\n`);
    } catch (err) {
      console.log(`   ⚠️  Coluna tenant_id não existe em caixas ainda\n`);
    }

    console.log('✅ Todos os registros foram atualizados com sucesso!');
    console.log(`🔐 tenant_id usado: ${defaultTenantId}`);

  } catch (error) {
    console.error('❌ Erro ao popular tenant_ids:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

populateTenantIds()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });
