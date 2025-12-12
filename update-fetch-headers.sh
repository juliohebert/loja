#!/bin/bash

# Script para atualizar todas as requisições fetch para usar getAuthHeaders()

find frontend/src/components -name "*.jsx" -type f -exec sed -i "s/headers: {\s*'Authorization': \`Bearer \${token}\`\s*}/headers: getAuthHeaders()/g" {} \;

echo "✅ Requisições atualizadas com sucesso!"
