#!/usr/bin/env python3
import os
import re

# Lista de componentes para atualizar
componentes = [
    'NovoCliente.jsx',
    'CriarProduto.jsx', 
    'GerenciarDebitos.jsx',
    'Trocas.jsx',
    'OrdensCompra.jsx',
    'Fornecedores.jsx',
    'Usuarios.jsx',
    'Relatorios.jsx'
]

base_path = '/home/julio/Documentos/www/loja_v2/frontend/src/components'

for componente in componentes:
    filepath = os.path.join(base_path, componente)
    
    if not os.path.exists(filepath):
        print(f"❌ Arquivo não encontrado: {componente}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Verificar se já tem o import
    if "import { getAuthHeaders }" not in content:
        # Adicionar import após o import do Sidebar ou React Router
        patterns = [
            (r"(import Sidebar from './Sidebar';)", r"\1\nimport { getAuthHeaders } from '../utils/auth';"),
            (r"(import { useNavigate } from 'react-router-dom';)", r"\1\nimport { getAuthHeaders } from '../utils/auth';"),
        ]
        
        for pattern, replacement in patterns:
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content, count=1)
                break
    
    # Substituir padrões de fetch com headers manuais por getAuthHeaders()
    # Padrão 1: fetch com Authorization e Content-Type
    pattern1 = r"const token = localStorage\.getItem\('token'\);\s*const response = await fetch\((.*?), \{\s*headers: \{\s*'Authorization': `Bearer \$\{token\}`,\s*'Content-Type': 'application/json'\s*\}"
    replacement1 = r"const response = await fetch(\1, {\n        headers: getAuthHeaders()"
    content = re.sub(pattern1, replacement1, content, flags=re.DOTALL)
    
    # Padrão 2: fetch com apenas Authorization
    pattern2 = r"const token = localStorage\.getItem\('token'\);\s*const response = await fetch\((.*?), \{\s*headers: \{\s*'Authorization': `Bearer \$\{token\}`\s*\}"
    replacement2 = r"const response = await fetch(\1, {\n        headers: getAuthHeaders()"
    content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)
    
    # Padrão 3: Quando token já foi definido antes
    pattern3 = r"const response = await fetch\((.*?), \{\s*headers: \{\s*'Authorization': `Bearer \$\{token\}`,\s*'Content-Type': 'application/json'\s*\}"
    replacement3 = r"const response = await fetch(\1, {\n        headers: getAuthHeaders()"
    content = re.sub(pattern3, replacement3, content, flags=re.DOTALL)
    
    pattern4 = r"const response = await fetch\((.*?), \{\s*headers: \{\s*'Authorization': `Bearer \$\{token\}`\s*\}"
    replacement4 = r"const response = await fetch(\1, {\n        headers: getAuthHeaders()"
    content = re.sub(pattern4, replacement4, content, flags=re.DOTALL)
    
    # Padrão 5: com method
    pattern5 = r"const response = await fetch\((.*?), \{\s*method: '(.*?)',\s*headers: \{\s*'Authorization': `Bearer \$\{token\}`,\s*'Content-Type': 'application/json'\s*\},"
    replacement5 = r"const response = await fetch(\1, {\n        method: '\2',\n        headers: getAuthHeaders(),"
    content = re.sub(pattern5, replacement5, content, flags=re.DOTALL)
    
    # Escrever de volta
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Atualizado: {componente}")

print("\n✅ Script concluído!")
