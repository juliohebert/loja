require('dotenv').config();
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');

async function fixUserTenant() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Buscar todos os usuários sem tenant_id
    const usersWithoutTenant = await User.findAll({
      where: { tenant_id: null },
      attributes: ['id', 'nome', 'email', 'funcao', 'tenant_id']
    });

    console.log(`\n📋 Usuários sem tenant_id: ${usersWithoutTenant.length}`);
    
    if (usersWithoutTenant.length === 0) {
      console.log('✅ Todos os usuários já têm tenant_id definido!');
      process.exit(0);
    }

    console.log('\n⚠️  Usuários que precisam de correção:');
    for (const user of usersWithoutTenant) {
      console.log(`  - ${user.nome} (${user.email}) - Função: ${user.funcao}`);
    }

    console.log('\n🔧 Atualizando usuários sem tenant_id para "default"...');
    
    const [updatedCount] = await User.update(
      { tenant_id: 'default' },
      { where: { tenant_id: null } }
    );

    console.log(`✅ ${updatedCount} usuário(s) atualizado(s) com sucesso!`);
    
    // Verificar resultado
    const verifyUsers = await User.findAll({
      where: { id: usersWithoutTenant.map(u => u.id) },
      attributes: ['id', 'nome', 'email', 'tenant_id']
    });

    console.log('\n📊 Resultado após atualização:');
    for (const user of verifyUsers) {
      console.log(`  ✅ ${user.nome} - tenant_id: ${user.tenant_id}`);
    }

    console.log('\n🎉 Correção concluída! Agora faça logout e login novamente na aplicação.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

fixUserTenant();
