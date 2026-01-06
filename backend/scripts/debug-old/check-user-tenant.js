require('dotenv').config();
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');

async function checkUserTenant() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Buscar todos os usuários
    const users = await User.findAll({
      attributes: ['id', 'nome', 'email', 'funcao', 'tenant_id']
    });

    console.log('\n📋 Usuários no sistema:');
    console.log('----------------------------------------');
    
    for (const user of users) {
      console.log(`ID: ${user.id}`);
      console.log(`Nome: ${user.nome}`);
      console.log(`Email: ${user.email}`);
      console.log(`Função: ${user.funcao}`);
      console.log(`Tenant ID: ${user.tenant_id || 'NULL'}`);
      console.log('----------------------------------------');
    }

    // Contar usuários sem tenant_id
    const usersWithoutTenant = users.filter(u => !u.tenant_id);
    console.log(`\n⚠️  Usuários sem tenant_id: ${usersWithoutTenant.length}`);

    // Contar por função
    const countByRole = users.reduce((acc, user) => {
      acc[user.funcao] = (acc[user.funcao] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Contagem por função:');
    Object.entries(countByRole).forEach(([funcao, count]) => {
      console.log(`  ${funcao}: ${count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkUserTenant();
