#!/usr/bin/env python3
import os
import re

base_path = 'src/components'

for root, dirs, files in os.walk(base_path):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original = content
            
            # Corrigir o padrão quebrado: "http://localhost:3001'}  ou '}/
            content = re.sub(r'"http://localhost:3001\'', r'"http://localhost:3001"', content)
            content = re.sub(r'\'http://localhost:3001"', r'"http://localhost:3001"', content)
            content = re.sub(r"'\}", r'"}', content)
            content = re.sub(r'"\}', r'"}', content)
            
            # Substituir ', { por `, {
            content = re.sub(r"'/api([^']*)', \{", r'`/api\1`, {', content)
            
            if content != original:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'✅ Corrigido: {filepath}')

print('\n✅ Concluído!')
