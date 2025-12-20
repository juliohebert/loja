#!/usr/bin/env python3
import os
import re

# Definir o caminho base
base_path = 'src/components'

# Padrões a substituir
patterns = [
    (r"'http://localhost:3001/api", r"`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api"),
    (r'"http://localhost:3001/api', r'`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api'),
    (r"`http://localhost:3001/api", r"`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api"),
]

# Percorrer todos os arquivos .jsx
for root, dirs, files in os.walk(base_path):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Aplicar substituições
            original = content
            for pattern, replacement in patterns:
                content = re.sub(pattern, replacement, content)
            
            # Salvar se houver mudanças
            if content != original:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'✅ Atualizado: {filepath}')

print('\n✅ Todas as URLs foram atualizadas!')
