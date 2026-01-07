// Script para criar usuário de teste
const bcrypt = require('bcryptjs');
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

async function createTestUser() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conectado!\n');

    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);
    
    console.log('🔄 Criando usuário de teste...');
    
    // Criar usuário
    const [result] = await sequelize.query(`
      INSERT INTO usuarios (id, nome, email, senha, funcao, ativo, tenant_id, criado_em, atualizado_em)
      VALUES (
        gen_random_uuid(),
        'Usuário Teste',
        'teste@loja.com',
        :senha,
        'admin',
        true,
        'default',
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE
      SET senha = :senha, ativo = true
      RETURNING id, nome, email, funcao, tenant_id;
    `, {
      replacements: { senha: hashedPassword }
    });

    console.log('✅ Usuário criado/atualizado:');
    console.log('   Email: teste@loja.com');
    console.log('   Senha: 123456');
    console.log('   Função: admin');
    console.log('   Tenant: default\n');
    console.log('📊 Dados:', result[0]);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Conexão fechada');
  }
}

createTestUser();
