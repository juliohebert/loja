#!/bin/bash

# Script de Build para Produção - Backend
# Execute antes de fazer deploy

echo "🔨 Iniciando build do backend..."

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
  echo "❌ Erro: package.json não encontrado. Execute na pasta backend/"
  exit 1
fi

# Limpar módulos antigos
echo "🧹 Limpando node_modules..."
rm -rf node_modules

# Instalar dependências de produção
echo "📦 Instalando dependências..."
npm ci --only=production

# Verificar se há erros
if [ $? -eq 0 ]; then
  echo "✅ Build do backend concluído com sucesso!"
else
  echo "❌ Erro no build do backend"
  exit 1
fi

echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis de ambiente no Render.com"
echo "2. Faça push para o repositório Git"
echo "3. O Render irá fazer o deploy automaticamente"
