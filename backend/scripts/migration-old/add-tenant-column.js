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

async function addTenantColumn() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida');

    // Adicionar coluna tenantId à tabela configuracoes
    await sequelize.query(`
      ALTER TABLE configuracoes 
      ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(255) NOT NULL DEFAULT 'default';
    `);
    console.log('✅ Coluna tenantId adicionada à tabela configuracoes');

    // Verificar se a coluna foi criada
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'configuracoes' AND column_name = 'tenantId';
    `);
    
    if (results.length > 0) {
      console.log('✅ Coluna tenantId confirmada na tabela configuracoes');
    } else {
      console.log('❌ Coluna tenantId não foi criada');
    }

    await sequelize.close();
    console.log('✅ Script concluído com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error);
    process.exit(1);
  }
}

addTenantColumn();
