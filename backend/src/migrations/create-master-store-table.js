const { sequelize } = require('../config/database');

async function runMigration() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS lojas_master (
        id SERIAL PRIMARY KEY,
        nome_loja VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        senha VARCHAR(255) NOT NULL,
        cnpj VARCHAR(32),
        telefone VARCHAR(32),
        endereco VARCHAR(255),
        responsavel VARCHAR(255),
        plano VARCHAR(32),
        db_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela lojas_master criada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar tabela lojas_master:', error);
    process.exit(1);
  }
}

runMigration();
