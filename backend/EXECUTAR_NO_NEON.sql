-- ============================================
-- SCRIPT PARA ADICIONAR CONFIGURAÇÕES DE LOGO E NOME
-- Execute este script no Neon SQL Editor
-- ============================================

-- 1. Verificar tenants existentes
SELECT DISTINCT tenant_id, COUNT(*) as usuarios
FROM usuarios
WHERE tenant_id IS NOT NULL AND tenant_id != 'default'
GROUP BY tenant_id;

-- 2. Adicionar configuração "nome_loja" para cada tenant
INSERT INTO configuracoes (id, chave, valor, tipo, descricao, tenant_id, criado_em, atualizado_em)
SELECT 
    gen_random_uuid(),
    'nome_loja',
    'ModaStore',
    'texto',
    'Nome da loja exibido no menu sidebar',
    tenant_id,
    NOW(),
    NOW()
FROM usuarios
WHERE tenant_id IS NOT NULL 
AND tenant_id != 'default'
AND NOT EXISTS (
    SELECT 1 FROM configuracoes c 
    WHERE c.chave = 'nome_loja' 
    AND c.tenant_id = usuarios.tenant_id
)
GROUP BY tenant_id;

-- 3. Adicionar configuração "logo_url" para cada tenant
INSERT INTO configuracoes (id, chave, valor, tipo, descricao, tenant_id, criado_em, atualizado_em)
SELECT 
    gen_random_uuid(),
    'logo_url',
    '',
    'texto',
    'URL da logo da loja exibida no menu sidebar',
    tenant_id,
    NOW(),
    NOW()
FROM usuarios
WHERE tenant_id IS NOT NULL 
AND tenant_id != 'default'
AND NOT EXISTS (
    SELECT 1 FROM configuracoes c 
    WHERE c.chave = 'logo_url' 
    AND c.tenant_id = usuarios.tenant_id
)
GROUP BY tenant_id;

-- 4. Verificar resultado
SELECT 
    chave, 
    valor, 
    tenant_id,
    criado_em
FROM configuracoes 
WHERE chave IN ('nome_loja', 'logo_url')
ORDER BY tenant_id, chave;

-- 5. Verificar quantas configurações foram criadas
SELECT 
    chave,
    COUNT(*) as total_tenants
FROM configuracoes 
WHERE chave IN ('nome_loja', 'logo_url')
GROUP BY chave;
