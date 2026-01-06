const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
});

async function renameColumn() {
  try {
    await client.connect();
    
    console.log('🔧 Renomeando coluna "tenantId" para "tenant_id" na tabela configuracoes...');
    
    // Renomear coluna
    await client.query(`ALTER TABLE configuracoes RENAME COLUMN "tenantId" TO tenant_id;`);
    
    console.log('✅ Coluna renomeada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao renomear coluna:', error.message);
  } finally {
    await client.end();
  }
}

renameColumn();
