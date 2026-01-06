const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
  }
);

async function addTenantColumn() {
  try {
    console.log('🔄 Adicionando coluna tenant_id...');
    
    await sequelize.query('ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);');
    await sequelize.query('ALTER TABLE caixas ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);');
    await sequelize.query('ALTER TABLE produtos ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);');
    
    console.log('🔄 Populando registros existentes...');
    
    const [clientes] = await sequelize.query("UPDATE clientes SET tenant_id = 'default' WHERE tenant_id IS NULL;");
    const [caixas] = await sequelize.query("UPDATE caixas SET tenant_id = 'default' WHERE tenant_id IS NULL;");
    const [produtos] = await sequelize.query("UPDATE produtos SET tenant_id = 'default' WHERE tenant_id IS NULL;");
    
    console.log(`✅ ${clientes[1]} clientes atualizados`);
    console.log(`✅ ${caixas[1]} caixas atualizados`);
    console.log(`✅ ${produtos[1]} produtos atualizados`);
    console.log('✨ Migração concluída!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addTenantColumn();
