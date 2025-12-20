#!/usr/bin/env node

/**
 * Script de inicialização para produção
 * Usa variáveis de ambiente do sistema (Render, PM2, etc)
 */

const path = require('path');

// Se houver arquivo .env.production local, carrega (para PM2 local)
if (require('fs').existsSync(path.resolve(__dirname, '../.env.production'))) {
  const dotenv = require('dotenv');
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
} else {
  console.log('📋 Usando variáveis de ambiente do sistema (Render/Docker)');
  console.log('   - NODE_ENV:', process.env.NODE_ENV);
  console.log('   - PORT:', process.env.PORT);
  console.log('   - DATABASE_URL:', process.env.DATABASE_URL ? '✓ Configurado' : '✗ Não configurado');
}

// Iniciar o servidor
require('./src/server');
