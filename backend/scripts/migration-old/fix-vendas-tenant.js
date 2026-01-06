const { sequelize } = require('./src/config/database');

async function fixVendasTenant() {
  console.log('🔄 Corrigindo tenant_id das vendas antigas...\n');

  try {
    // 1. Atualizar vendas com base no tenant_id do usuário
    console.log('📊 Atualizando vendas com base no usuário...');
    const [result] = await sequelize.query(`
      UPDATE vendas v
      SET tenant_id = u.tenant_id
      FROM usuarios u
      WHERE v.usuario_id = u.id
        AND (v.tenant_id IS NULL 
             OR v.tenant_id = '00000000-0000-0000-0000-000000000000'
             OR v.tenant_id = '')
    `);
    
    console.log(`✅ ${result.rowCount || 0} vendas atualizadas com tenant_id do usuário\n`);

    // 2. Verificar se ainda há vendas sem tenant_id válido
    const [vendasSemTenant] = await sequelize.query(`
      SELECT COUNT(*) as total 
      FROM vendas 
      WHERE tenant_id IS NULL 
         OR tenant_id = '00000000-0000-0000-0000-000000000000'
         OR tenant_id = ''
    `);

    if (vendasSemTenant[0].total > 0) {
      console.log(`⚠️  Ainda há ${vendasSemTenant[0].total} vendas sem tenant_id válido`);
      console.log('   Essas vendas serão associadas ao tenant padrão\n');
      
      const [defaultUser] = await sequelize.query(`
        SELECT tenant_id 
        FROM usuarios 
        WHERE tenant_id IS NOT NULL 
          AND tenant_id != '00000000-0000-0000-0000-000000000000'
          AND tenant_id != ''
        LIMIT 1
      `);
      
      if (defaultUser[0]) {
        await sequelize.query(`
          UPDATE vendas 
          SET tenant_id = :tenantId
          WHERE tenant_id IS NULL 
             OR tenant_id = '00000000-0000-0000-0000-000000000000'
             OR tenant_id = ''
        `, { replacements: { tenantId: defaultUser[0].tenant_id } });
        
        console.log(`✅ Vendas sem tenant associadas ao tenant: ${defaultUser[0].tenant_id}\n`);
      }
    }

    // 3. Mostrar resumo
    const [resumo] = await sequelize.query(`
      SELECT 
        v.tenant_id,
        COUNT(*) as total_vendas,
        MIN(v.data_hora) as primeira_venda,
        MAX(v.data_hora) as ultima_venda
      FROM vendas v
      GROUP BY v.tenant_id
      ORDER BY total_vendas DESC
    `);

    console.log('📈 Resumo por Tenant:');
    resumo.forEach(r => {
      console.log(`   Tenant: ${r.tenant_id}`);
      console.log(`   - Total de vendas: ${r.total_vendas}`);
      console.log(`   - Período: ${new Date(r.primeira_venda).toLocaleDateString()} a ${new Date(r.ultima_venda).toLocaleDateString()}\n`);
    });

    console.log('✅ Correção finalizada com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao corrigir vendas:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

fixVendasTenant()
  .then(() => {
    console.log('\n✅ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });
