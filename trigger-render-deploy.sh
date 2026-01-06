#!/bin/bash

# Script para forçar redeploy no Render via Deploy Hook
# O Render permite criar um webhook que dispara um novo deploy

echo "🚀 Forçando redeploy no Render..."
echo ""

# Verificar se há RENDER_DEPLOY_HOOK configurado
if [ -z "$RENDER_DEPLOY_HOOK" ]; then
    echo "⚠️  Variável RENDER_DEPLOY_HOOK não configurada"
    echo ""
    echo "📋 Para configurar o Deploy Hook:"
    echo ""
    echo "1. Acesse: https://dashboard.render.com"
    echo "2. Clique no serviço 'loja-api'"
    echo "3. Vá em 'Settings' > 'Deploy Hook'"
    echo "4. Copie a URL do Deploy Hook"
    echo "5. Execute:"
    echo "   export RENDER_DEPLOY_HOOK='https://api.render.com/deploy/srv-xxxxx?key=xxxxx'"
    echo ""
    echo "Ou crie o arquivo .env com:"
    echo "   RENDER_DEPLOY_HOOK=https://api.render.com/deploy/srv-xxxxx?key=xxxxx"
    echo ""
    echo "🔗 Atalho direto para settings:"
    echo "   https://dashboard.render.com/web/loja-api/settings"
    echo ""
    exit 1
fi

echo "📡 Disparando deploy hook..."

RESPONSE=$(curl -s -X POST "$RENDER_DEPLOY_HOOK")

if [ $? -eq 0 ]; then
    echo "✅ Deploy iniciado com sucesso!"
    echo ""
    echo "📊 Response: $RESPONSE"
    echo ""
    echo "⏱️  O deploy pode levar alguns minutos..."
    echo "🌐 Acompanhe em: https://dashboard.render.com"
    echo ""
    echo "💡 Dica: Após o deploy concluir, faça logout e login novamente"
    echo "   na aplicação para obter um token JWT atualizado!"
else
    echo "❌ Erro ao disparar deploy"
    exit 1
fi
