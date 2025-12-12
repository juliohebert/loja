#!/usr/bin/env python3
import re
import os

# Arquivos a corrigir
files_to_fix = [
    'src/controllers/supplierController.js',
    'src/controllers/cashRegisterController.js',
    'src/controllers/purchaseOrderController.js',
    'src/controllers/accountPayableController.js',
    'src/controllers/accountReceivableController.js',
    'src/controllers/saleController.js'
]

base_path = '/home/julio/Documentos/www/loja_v2/backend'

def fix_findByPk_to_findOne(content, model_name):
    """Substitui findByPk por findOne com tenantId"""
    pattern = rf'{model_name}\.findByPk\((\w+)'
    
    def replace_func(match):
        id_var = match.group(1)
        return f'''{model_name}.findOne({{
      where: {{ 
        id: {id_var},
        tenantId: req.tenantId 
      }}'''
    
    content = re.sub(pattern, replace_func, content)
    return content

def fix_findAll_add_tenant(content, model_name):
    """Adiciona tenantId no where do findAll"""
    # Padrão: Model.findAll({ where: { ... }
    pattern = rf'{model_name}\.findAll\(\{{\s*where:\s*\{{'
    
    def replace_func(match):
        return f'''{model_name}.findAll({{
      where: {{ 
        tenantId: req.tenantId,'''
    
    content = re.sub(pattern, replace_func, content, flags=re.MULTILINE)
    return content

def fix_findOne_add_tenant(content, model_name):
    """Adiciona tenantId no where do findOne (se não tiver tenantId)"""
    # Apenas corrige se não tiver tenantId já
    pattern = rf'{model_name}\.findOne\(\{{\s*where:\s*\{{\s*(?!.*tenantId)'
    
    def replace_func(match):
        return f'''{model_name}.findOne({{
      where: {{ 
        tenantId: req.tenantId,'''
    
    content = re.sub(pattern, replace_func, content, flags=re.MULTILINE | re.DOTALL)
    return content

def fix_create_add_tenant(content, model_name):
    """Adiciona tenantId no create (procura por { sem tenantId)"""
    # Padrão: Model.create({ ... }) - adiciona tenantId se não existir
    if 'tenantId: req.tenantId' not in content:
        pattern = rf'{model_name}\.create\(\{{'
        content = re.sub(pattern, f'{model_name}.create({{\n      tenantId: req.tenantId,', content)
    return content

def process_file(filepath):
    """Processa um arquivo e aplica as correções"""
    full_path = os.path.join(base_path, filepath)
    
    if not os.path.exists(full_path):
        print(f"❌ Arquivo não encontrado: {full_path}")
        return False
    
    # Extrair o nome do modelo do nome do controller
    filename = os.path.basename(filepath)
    # Ex: supplierController.js -> Supplier
    model_name = filename.replace('Controller.js', '').capitalize()
    
    # Alguns modelos têm nomes específicos
    model_map = {
        'Accountpayable': 'AccountPayable',
        'Accountreceivable': 'AccountReceivable',
        'Cashregister': 'CashRegister',
        'Purchaseorder': 'PurchaseOrder'
    }
    model_name = model_map.get(model_name, model_name)
    
    print(f"\n📝 Processando {filepath} (Modelo: {model_name})...")
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Aplicar correções
    content = fix_findByPk_to_findOne(content, model_name)
    content = fix_findAll_add_tenant(content, model_name)
    content = fix_findOne_add_tenant(content, model_name)
    content = fix_create_add_tenant(content, model_name)
    
    if content != original_content:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Arquivo corrigido: {filepath}")
        return True
    else:
        print(f"ℹ️  Nenhuma alteração necessária: {filepath}")
        return False

def main():
    print("🔧 Iniciando correção de filtros de tenantId...\n")
    
    fixed_count = 0
    for filepath in files_to_fix:
        if process_file(filepath):
            fixed_count += 1
    
    print(f"\n✨ Concluído! {fixed_count} arquivo(s) corrigido(s).")

if __name__ == '__main__':
    main()
