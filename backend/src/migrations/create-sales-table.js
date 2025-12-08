/**
 * Script de migração para criar tabela de vendas
 * Executa: node src/migrations/create-sales-table.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'loja_roupas',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function runMigration() {
  try {
    console.log('🔄 Iniciando migração de vendas...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Criar tabela vendas
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS vendas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        numero_venda VARCHAR(50) NOT NULL,
        usuario_id UUID NOT NULL REFERENCES usuarios(id),
        vendedor VARCHAR(255),
        cliente_id UUID REFERENCES clientes(id),
        caixa_id UUID REFERENCES caixas(id),
        itens JSONB NOT NULL DEFAULT '[]'::jsonb,
        forma_pagamento VARCHAR(50) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
        desconto DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        troco DECIMAL(10, 2) DEFAULT 0,
        observacoes TEXT,
        data DATE NOT NULL,
        data_hora TIMESTAMP NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela vendas criada');

    // Criar índices para melhor performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_vendas_usuario_id ON vendas(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_vendas_cliente_id ON vendas(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data);
      CREATE INDEX IF NOT EXISTS idx_vendas_data_hora ON vendas(data_hora);
      CREATE INDEX IF NOT EXISTS idx_vendas_vendedor ON vendas(vendedor);
    `);
    console.log('✅ Índices criados');

    console.log('✅ Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

runMigration();
