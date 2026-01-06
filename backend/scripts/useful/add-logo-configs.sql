-- Script para adicionar configurações de nome da loja e logo

-- Para cada tenant existente, criar as configurações se não existirem
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

-- Verificar resultado
SELECT chave, valor, tenant_id 
FROM configuracoes 
WHERE chave IN ('nome_loja', 'logo_url')
ORDER BY tenant_id, chave;
