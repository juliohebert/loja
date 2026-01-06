#!/usr/bin/env python3
import re
import os

files = [
    'src/controllers/supplierController.js',
    'src/controllers/purchaseOrderController.js',
    'src/controllers/accountPayableController.js',
    'src/controllers/accountReceivableController.js'
]

base_path = '/home/julio/Documentos/www/loja_v2/backend'

for file in files:
    filepath = os.path.join(base_path, file)
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Substituir findByPk(req.params.id) por findOne com tenantId
    content = re.sub(
        r'\.findByPk\(req\.params\.id\)',
        r'.findOne({\n      where: { \n        id: req.params.id,\n        tenant_id: req.tenantId \n      }\n    })',
        content
    )
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"✅ {file} corrigido")

print("\n✨ Todos os arquivos foram corrigidos com sucesso!")
