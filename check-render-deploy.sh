#!/bin/bash

# Script para verificar o status do deploy no Render
# Requer que você tenha uma API key do Render configurada

echo "🔍 Verificando status do deploy no Render..."
echo ""

# Verificar se há API key configurada
if [ -z "$RENDER_API_KEY" ]; then
    echo "⚠️  Variável RENDER_API_KEY não configurada"
    echo ""
    echo "Para usar este script, você precisa:"
    echo "1. Obter uma API key em: https://dashboard.render.com/u/settings#api-keys"
    echo "2. Exportar a variável: export RENDER_API_KEY='sua-api-key'"
    echo ""
    echo "Ou acesse manualmente: https://dashboard.render.com"
    echo ""
    exit 1
fi

# Buscar serviços
echo "📡 Buscando serviços no Render..."
SERVICES=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
    "https://api.render.com/v1/services")

# Extrair informações do serviço loja-api
SERVICE_ID=$(echo "$SERVICES" | grep -A 20 '"name":"loja-api"' | grep '"id":' | head -1 | cut -d'"' -f4)

if [ -z "$SERVICE_ID" ]; then
    echo "❌ Serviço 'loja-api' não encontrado"
    echo ""
    echo "Serviços disponíveis:"
    echo "$SERVICES" | grep '"name":' | cut -d'"' -f4
    exit 1
fi

echo "✅ Serviço encontrado: $SERVICE_ID"
echo ""

# Buscar deploys recentes
echo "📋 Últimos deploys:"
DEPLOYS=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
    "https://api.render.com/v1/services/$SERVICE_ID/deploys?limit=5")

echo "$DEPLOYS" | jq -r '.[] | "\(.status) - \(.createdAt) - \(.commit.message // "N/A")"' 2>/dev/null || echo "$DEPLOYS"

echo ""
echo "🌐 Dashboard: https://dashboard.render.com"
