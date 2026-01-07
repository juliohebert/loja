// Script para executar a migration 20260106000002-add-exibir-catalogo-produtos
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Usar DATABASE_URL se disponível, caso contrário usar variáveis individuais
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      logging: console.log,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: console.log
    });

async function runMigration() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conectado com sucesso!\n');

    console.log('🔄 Executando migration: add-exibir-catalogo-produtos...');
    
    // Adicionar coluna exibir_catalogo
    await sequelize.query(`
      ALTER TABLE produtos 
      ADD COLUMN IF NOT EXISTS exibir_catalogo BOOLEAN DEFAULT false NOT NULL;
    `);
    console.log('✅ Coluna exibir_catalogo adicionada');

    // Criar índice
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_produtos_exibir_catalogo 
      ON produtos(exibir_catalogo, tenant_id);
    `);
    console.log('✅ Índice idx_produtos_exibir_catalogo criado');

    // Verificar estrutura da coluna
    const [result] = await sequelize.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'produtos' AND column_name = 'exibir_catalogo';
    `);
    console.log('\n📊 Estrutura da coluna:', result);

    console.log('\n✅ Migration executada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
  } finally {
    await sequelize.close();
    console.log('🔒 Conexão fechada');
  }
}

runMigration();
