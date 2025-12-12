require('dotenv').config();
const { Client } = require('pg');

const updateEnumType = async () => {
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

    // Adicionar novo valor ao ENUM
    await client.query(`
      ALTER TYPE enum_usuarios_funcao ADD VALUE IF NOT EXISTS 'super-admin';
    `);

    console.log('✅ Tipo ENUM atualizado com sucesso!');
    console.log('   Valores: super-admin, admin, vendedor, gerente');

  } catch (error) {
    console.error('❌ Erro ao atualizar ENUM:', error.message);
  } finally {
    await client.end();
  }
};

updateEnumType();
