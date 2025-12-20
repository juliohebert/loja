#!/usr/bin/env node

/**
 * Script de inicialização para produção
 * Usa variáveis de ambiente do sistema (Render, PM2, etc)
 */

console.log('📋 Iniciando servidor em modo produção...');
console.log('   - NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('   - PORT:', process.env.PORT || '3001');
console.log('   - DATABASE_URL:', process.env.DATABASE_URL ? '✓ Configurado' : '✗ Não configurado');

// Iniciar o servidor
require('./src/server');
