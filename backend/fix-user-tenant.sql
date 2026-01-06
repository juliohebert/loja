-- Script SQL para corrigir usuários sem tenant_id no banco de produção

-- 1. Verificar quantos usuários não têm tenant_id
SELECT 
    id, 
    nome, 
    email, 
    funcao, 
    tenant_id 
FROM usuarios 
WHERE tenant_id IS NULL;

-- 2. Atualizar usuários sem tenant_id para 'default'
UPDATE usuarios 
SET tenant_id = 'default' 
WHERE tenant_id IS NULL;

-- 3. Verificar resultado
SELECT 
    id, 
    nome, 
    email, 
    funcao, 
    tenant_id 
FROM usuarios 
ORDER BY criado_em DESC 
LIMIT 10;
