#!/bin/bash

# Script para testar se o middleware do Render foi atualizado

echo "🧪 Testando middleware do Render..."
echo ""

# Pegar o token do navegador (você precisa colar aqui)
read -p "Cole seu token JWT aqui: " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Token não fornecido"
    exit 1
fi

echo ""
echo "📡 Testando endpoint /api/configurations..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    https://loja-tovh.onrender.com/api/configurations)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Status: $HTTP_STATUS"
echo ""
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

echo ""
if [ "$HTTP_STATUS" = "400" ]; then
    echo "❌ Ainda retornando 400 - Deploy pode não ter finalizado"
    echo "   Aguarde alguns minutos e tente novamente"
elif [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Middleware funcionando! Agora faça logout/login para novo token"
else
    echo "⚠️  Status inesperado: $HTTP_STATUS"
fi
