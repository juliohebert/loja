#!/usr/bin/env python3
import os
import re

# Definir o caminho base
base_path = 'src/components'

# Função para corrigir as URLs
def fix_urls(content):
    # Substituir todos os casos de localhost:3001 por usar variável de ambiente
    # Padrão: 'http://localhost:3001/api... ou "http://localhost:3001/api...
    
    # Para strings com aspas simples
    content = re.sub(
        r"'http://localhost:3001/api([^']*)'",
        r'`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api\1`',
        content
    )
    
    # Para strings com aspas duplas
    content = re.sub(
        r'"http://localhost:3001/api([^"]*)"',
        r'`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api\1`',
        content
    )
    
    # Para template literals já existentes (consertar aspas dentro)
    content = re.sub(
        r"`http://localhost:3001/api([^`]*)`",
        r'`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api\1`',
        content
    )
    
    return content

# Percorrer todos os arquivos .jsx
for root, dirs, files in os.walk(base_path):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Aplicar correções
            original = content
            content = fix_urls(content)
            
            # Salvar se houver mudanças
            if content != original:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'✅ Atualizado: {filepath}')

print('\n✅ Todas as URLs foram corrigidas!')
