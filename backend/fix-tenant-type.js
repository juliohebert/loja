const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
  }
);

async function fixTenantType() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida');

    // Alterar tipo da coluna tenant_id de UUID para VARCHAR
    await sequelize.query(`
      ALTER TABLE usuarios 
      ALTER COLUMN tenant_id TYPE VARCHAR(255);
    `);
    console.log('✅ Tipo da coluna tenant_id alterado para VARCHAR na tabela usuarios');

    await sequelize.close();
    console.log('✅ Script concluído com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao alterar tipo da coluna:', error);
    process.exit(1);
  }
}

fixTenantType();
