#!/bin/bash

# Script de Build para Produção - Frontend
# Execute antes de fazer deploy

echo "🔨 Iniciando build do frontend..."

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
  echo "❌ Erro: package.json não encontrado. Execute na pasta frontend/"
  exit 1
fi

# Verificar se existe arquivo .env.production
if [ ! -f ".env.production" ]; then
  echo "⚠️  Aviso: .env.production não encontrado"
  echo "📝 Crie um arquivo .env.production com:"
  echo "   VITE_API_URL=https://sua-api.onrender.com"
fi

# Limpar módulos e cache
echo "🧹 Limpando cache..."
rm -rf node_modules dist .vite

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Build para produção
echo "🏗️  Gerando build de produção..."
npm run build

# Verificar se há erros
if [ $? -eq 0 ]; then
  echo "✅ Build do frontend concluído com sucesso!"
  echo "📂 Arquivos gerados em: dist/"
  echo ""
  echo "📊 Tamanho do build:"
  du -sh dist/
else
  echo "❌ Erro no build do frontend"
  exit 1
fi

echo ""
echo "📋 Próximos passos:"
echo "1. Configure VITE_API_URL no Vercel (variável de ambiente)"
echo "2. Faça push para o repositório Git"
echo "3. Importe o projeto no Vercel"
echo "4. O Vercel irá fazer o deploy automaticamente"
