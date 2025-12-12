/**
 * Script de migração para criar tabelas padrão para um novo tenant
 * Executa: node src/migrations/create-tenant-tables.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const createTenantDatabase = require('../config/database').createTenantDatabase;

async function runMigration() {
  const dbName = process.argv[2];

  if (!dbName) {
    console.error('❌ Nome do banco de dados não fornecido. Execute com: node src/migrations/create-tenant-tables.js <dbName>');
    process.exit(1);
  }

  const tenantDb = createTenantDatabase(dbName);

  try {
    console.log(`🔄 Criando tabelas para o banco de dados: ${dbName}`);

    await tenantDb.authenticate();

    // Exemplo de criação de tabelas padrão
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        preco DECIMAL(10, 2) NOT NULL,
        estoque INT NOT NULL DEFAULT 0,
        criado_em TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS vendas (
        id SERIAL PRIMARY KEY,
        produto_id INT REFERENCES produtos(id),
        quantidade INT NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Tabelas criadas com sucesso!');
    await tenantDb.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar tabelas para o tenant:', error);
    await tenantDb.close();
    process.exit(1);
  }
}

runMigration();