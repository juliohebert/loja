require('dotenv').config();
const { Client } = require('pg');

const updateTenantIdColumn = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'loja_roupas'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Alterar coluna tenant_id para permitir NULL
    await client.query(`
      ALTER TABLE usuarios 
      ALTER COLUMN tenant_id DROP NOT NULL;
    `);

    console.log('✅ Coluna tenant_id atualizada para permitir NULL');
    console.log('   Isso permite a criação de super-administradores');

  } catch (error) {
    console.error('❌ Erro ao atualizar coluna:', error.message);
  } finally {
    await client.end();
  }
};

updateTenantIdColumn();
