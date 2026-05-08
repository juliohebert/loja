/**
 * Script para adicionar coluna imagens_backup na tabela produtos
 * 
 * Execute este script para criar a coluna de backup no banco de dados.
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

async function addImagensBackupColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    // Adicionar coluna
    await client.query(`
      ALTER TABLE produtos 
      ADD COLUMN IF NOT EXISTS imagens_backup JSON DEFAULT '[]';
    `);
    
    console.log('✅ Coluna imagens_backup adicionada com sucesso!');
    
    // Verificar
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'produtos' AND column_name = 'imagens_backup';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verificação: Coluna existe no banco!', result.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addImagensBackupColumn()
  .then(() => {
    console.log('\n✨ Migration concluída com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Falha na migration:', error);
    process.exit(1);
  });
