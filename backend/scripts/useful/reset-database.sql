-- ============================================
-- SCRIPT PARA LIMPAR BANCO DE DADOS
-- ============================================
-- ATENÇÃO: Este script APAGA TODOS OS DADOS!
-- Use apenas quando quiser resetar o sistema
-- ============================================

-- Desabilitar verificação de chave estrangeira temporariamente
SET session_replication_role = replica;

-- ============================================
-- 1. LIMPAR VENDAS
-- ============================================
DELETE FROM itens_venda;
DELETE FROM vendas;

-- ============================================
-- 2. LIMPAR PRODUTOS E ESTOQUE
-- ============================================
DELETE FROM estoques;
DELETE FROM variacoes;
DELETE FROM produtos;

-- ============================================
-- 3. LIMPAR FORNECEDORES E COMPRAS
-- ============================================
DELETE FROM itens_ordem_compra;
DELETE FROM ordens_compra;
DELETE FROM fornecedores;

-- ============================================
-- 4. LIMPAR FINANCEIRO
-- ============================================
DELETE FROM contas_pagar;
DELETE FROM contas_receber;

-- ============================================
-- 5. LIMPAR CLIENTES
-- ============================================
DELETE FROM clientes;

-- ============================================
-- 6. LIMPAR CAIXAS
-- ============================================
DELETE FROM caixas;

-- ============================================
-- 7. LIMPAR ASSINATURAS
-- ============================================
DELETE FROM assinaturas;

-- ============================================
-- 8. LIMPAR USUÁRIOS (OPCIONAL - CUIDADO!)
-- ============================================
-- Descomente a linha abaixo se quiser remover usuários também
-- DELETE FROM usuarios WHERE funcao != 'super-admin';

-- Reabilitar verificação de chave estrangeira
SET session_replication_role = DEFAULT;

-- ============================================
-- VERIFICAR O QUE RESTOU
-- ============================================
SELECT 'vendas' as tabela, COUNT(*) as total FROM vendas
UNION ALL
SELECT 'produtos', COUNT(*) FROM produtos
UNION ALL
SELECT 'variacoes', COUNT(*) FROM variacoes
UNION ALL
SELECT 'estoques', COUNT(*) FROM estoques
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'fornecedores', COUNT(*) FROM fornecedores
UNION ALL
SELECT 'ordens_compra', COUNT(*) FROM ordens_compra
UNION ALL
SELECT 'contas_pagar', COUNT(*) FROM contas_pagar
UNION ALL
SELECT 'contas_receber', COUNT(*) FROM contas_receber
UNION ALL
SELECT 'caixas', COUNT(*) FROM caixas
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'configuracoes', COUNT(*) FROM configuracoes
UNION ALL
SELECT 'planos', COUNT(*) FROM planos
UNION ALL
SELECT 'assinaturas', COUNT(*) FROM assinaturas
ORDER BY tabela;
