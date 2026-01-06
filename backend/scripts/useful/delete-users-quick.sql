-- ============================================
-- SCRIPT RÁPIDO: VER E DELETAR USUÁRIOS DE TESTE
-- ============================================

-- 1. VER TODOS OS USUÁRIOS (execute primeiro)
SELECT 
    email, 
    nome, 
    funcao, 
    tenant_id,
    TO_CHAR(criado_em, 'DD/MM/YYYY HH24:MI') as criado
FROM usuarios
ORDER BY criado_em DESC;

-- ============================================
-- 2. DELETAR USUÁRIOS ESPECÍFICOS
-- ============================================
-- Copie os emails da consulta acima e cole aqui:

DELETE FROM usuarios WHERE email IN (
    -- Cole os emails aqui, um por linha
    -- Exemplo:
    -- 'teste1@email.com',
    -- 'teste2@email.com',
    -- 'julio03@email.com'
);

-- ============================================
-- 3. VERIFICAR O QUE RESTOU
-- ============================================
SELECT 
    email, 
    nome, 
    funcao, 
    COUNT(*) OVER() as total_usuarios
FROM usuarios
ORDER BY criado_em DESC;
