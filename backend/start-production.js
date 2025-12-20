#!/usr/bin/env node

/**
 * Script de inicialização para produção
 * Carrega variáveis de ambiente do .env.production e inicia o servidor
 */

const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente do .env.production
const envPath = path.resolve(__dirname, '../.env.production');
console.log('📋 Carregando variáveis de ambiente de:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Erro ao carregar .env.production:', result.error);
  process.exit(1);
}

console.log('✅ Variáveis de ambiente carregadas:');
console.log('   - NODE_ENV:', process.env.NODE_ENV);
console.log('   - PORT:', process.env.PORT);
console.log('   - DATABASE_URL:', process.env.DATABASE_URL ? '✓ Configurado' : '✗ Não configurado');
console.log('   - DB_HOST:', process.env.DB_HOST);
console.log('   - DB_NAME:', process.env.DB_NAME);
console.log('   - CORS_ORIGIN:', process.env.CORS_ORIGIN);

// Iniciar o servidor
require('./src/server');
