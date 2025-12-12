require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');

const createSuperAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida');

    // Verificar se já existe um super-admin
    const existingSuperAdmin = await User.findOne({
      where: { funcao: 'super-admin' }
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Já existe um super-administrador cadastrado:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Nome: ${existingSuperAdmin.nome}`);
      return;
    }

    // Criar super-admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt); // Senha padrão

    const superAdmin = await User.create({
      nome: 'Super Administrador',
      email: 'admin@sistema.com',
      senha: hashedPassword,
      funcao: 'super-admin',
      tenantId: null, // Super-admin não pertence a nenhum tenant
      ativo: true,
      permissoes: {
        accessAllTenants: true,
        manageUsers: true,
        viewReports: true
      }
    });

    console.log('\n✅ Super-administrador criado com sucesso!');
    console.log('📧 Email: admin@sistema.com');
    console.log('🔑 Senha: admin123');
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');

  } catch (error) {
    console.error('❌ Erro ao criar super-administrador:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
};

createSuperAdmin();
