-- ============================================
-- SCRIPT PARA REMOVER USUÁRIOS DE TESTE
-- ============================================
-- Remove apenas usuários que foram criados para testes
-- Mantém usuários reais e importantes
-- ============================================

-- Ver todos os usuários antes de deletar
SELECT 
    email, 
    nome, 
    funcao, 
    tenant_id,
    criado_em
FROM usuarios
ORDER BY criado_em DESC;

-- ============================================
-- OPÇÃO 1: Remover por emails específicos
-- ============================================
-- Descomente e adicione os emails que deseja remover:

-- DELETE FROM usuarios WHERE email IN (
--     'teste@email.com',
--     'test@test.com',
--     'usuario.teste@email.com',
--     'julio03@email.com',
--     'hebert@email.com'
-- );

-- ============================================
-- OPÇÃO 2: Remover usuários com 'test' no email
-- ============================================
-- DELETE FROM usuarios WHERE email LIKE '%test%' OR email LIKE '%teste%';

-- ============================================
-- OPÇÃO 3: Remover usuários criados hoje
-- ============================================
-- DELETE FROM usuarios WHERE DATE(criado_em) = CURRENT_DATE AND funcao != 'super-admin';

-- ============================================
-- OPÇÃO 4: Remover usuários criados nos últimos X dias (exceto super-admin)
-- ============================================
-- DELETE FROM usuarios 
-- WHERE criado_em >= NOW() - INTERVAL '7 days' 
-- AND funcao != 'super-admin';

-- ============================================
-- OPÇÃO 5: Remover usuários por tenant específico
-- ============================================
-- DELETE FROM usuarios WHERE tenant_id = 'tenant_teste_123456';

-- ============================================
-- OPÇÃO 6: Manter apenas o primeiro usuário de cada tenant
-- ============================================
-- DELETE FROM usuarios 
-- WHERE id NOT IN (
--     SELECT MIN(id) 
--     FROM usuarios 
--     GROUP BY tenant_id
-- );

-- ============================================
-- Verificar resultado após deletar
-- ============================================
SELECT 
    email, 
    nome, 
    funcao, 
    tenant_id,
    criado_em
FROM usuarios
ORDER BY criado_em DESC;
