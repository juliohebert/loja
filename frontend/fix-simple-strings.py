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
            has_import = 'import API_URL from' in content
            
            # SOMENTE substituir strings literais simples, NÃO template literals
            # Padrão: 'http://localhost:3001/api/xxx' (aspas simples, string completa)
            content = re.sub(
                r"'http://localhost:3001/api/([^']+)'",
                r"API_URL + '/api/\1'",
                content
            )
            
            # Padrão: "http://localhost:3001/api/xxx" (aspas duplas, string completa)
            content = re.sub(
                r'"http://localhost:3001/api/([^"]+)"',
                r'API_URL + "/api/\1"',
                content
            )
            
            # Se fez substituições e não tem o import, adicionar
            if content != original and not has_import:
                # Adicionar import após o último import
                import_match = re.search(r"(import .*?;\n)+", content)
                if import_match:
                    last_import_end = import_match.end()
                    content = content[:last_import_end] + "import API_URL from '../config/apiUrl';\n" + content[last_import_end:]
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'✅ Atualizado: {filepath}')

print('\n✅ Concluído!')
