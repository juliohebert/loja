-- Script de migração para traduzir tabelas e colunas para português
-- Execute este script ANTES de reiniciar o servidor com os novos models

BEGIN;

-- 1. Renomear tabela users para usuarios
ALTER TABLE IF EXISTS users RENAME TO usuarios;

-- 2. Renomear colunas da tabela usuarios
ALTER TABLE IF EXISTS usuarios RENAME COLUMN name TO nome;
ALTER TABLE IF EXISTS usuarios RENAME COLUMN password TO senha;
ALTER TABLE IF EXISTS usuarios RENAME COLUMN role TO funcao;
ALTER TABLE IF EXISTS usuarios RENAME COLUMN active TO ativo;
ALTER TABLE IF EXISTS usuarios RENAME COLUMN reset_token TO token_recuperacao;
ALTER TABLE IF EXISTS usuarios RENAME COLUMN reset_token_expires TO token_recuperacao_expira;
ALTER TABLE IF EXISTS usuarios RENAME COLUMN last_login TO ultimo_login;
ALTER TABLE IF EXISTS usuarios RENAME COLUMN created_at TO criado_em;
ALTER TABLE IF EXISTS usuarios RENAME COLUMN updated_at TO atualizado_em;

-- Atualizar ENUM de role
ALTER TABLE IF EXISTS usuarios ALTER COLUMN funcao TYPE VARCHAR(20);
UPDATE usuarios SET funcao = CASE 
  WHEN funcao = 'admin' THEN 'admin'
  WHEN funcao = 'manager' THEN 'gerente'
  WHEN funcao = 'user' THEN 'usuario'
  ELSE 'usuario'
END;

-- 3. Renomear tabela products para produtos
ALTER TABLE IF EXISTS products RENAME TO produtos;

-- 4. Renomear colunas da tabela produtos
ALTER TABLE IF EXISTS produtos RENAME COLUMN name TO nome;
ALTER TABLE IF EXISTS produtos RENAME COLUMN description TO descricao;
ALTER TABLE IF EXISTS produtos RENAME COLUMN brand TO marca;
ALTER TABLE IF EXISTS produtos RENAME COLUMN category TO categoria;
ALTER TABLE IF EXISTS produtos RENAME COLUMN price_cost TO preco_custo;
ALTER TABLE IF EXISTS produtos RENAME COLUMN price_sale TO preco_venda;
ALTER TABLE IF EXISTS produtos RENAME COLUMN images TO imagens;
ALTER TABLE IF EXISTS produtos RENAME COLUMN active TO ativo;
ALTER TABLE IF EXISTS produtos RENAME COLUMN created_at TO criado_em;
ALTER TABLE IF EXISTS produtos RENAME COLUMN updated_at TO atualizado_em;

-- 5. Renomear tabela variations para variacoes
ALTER TABLE IF EXISTS variations RENAME TO variacoes;

-- 6. Renomear colunas da tabela variacoes
ALTER TABLE IF EXISTS variacoes RENAME COLUMN product_id TO produto_id;
ALTER TABLE IF EXISTS variacoes RENAME COLUMN size TO tamanho;
ALTER TABLE IF EXISTS variacoes RENAME COLUMN color TO cor;
ALTER TABLE IF EXISTS variacoes RENAME COLUMN barcode TO codigo_barras;
ALTER TABLE IF EXISTS variacoes RENAME COLUMN active TO ativo;
ALTER TABLE IF EXISTS variacoes RENAME COLUMN created_at TO criado_em;
ALTER TABLE IF EXISTS variacoes RENAME COLUMN updated_at TO atualizado_em;

-- 7. Renomear tabela stocks para estoques
ALTER TABLE IF EXISTS stocks RENAME TO estoques;

-- 8. Renomear colunas da tabela estoques
ALTER TABLE IF EXISTS estoques RENAME COLUMN variation_id TO variacao_id;
ALTER TABLE IF EXISTS estoques RENAME COLUMN quantity TO quantidade;
ALTER TABLE IF EXISTS estoques RENAME COLUMN min_limit TO limite_minimo;
ALTER TABLE IF EXISTS estoques RENAME COLUMN location TO localizacao;
ALTER TABLE IF EXISTS estoques RENAME COLUMN created_at TO criado_em;
ALTER TABLE IF EXISTS estoques RENAME COLUMN updated_at TO atualizado_em;

-- 9. Renomear tabela customers para clientes (já em português, apenas renomear active)
ALTER TABLE IF EXISTS customers RENAME TO clientes;
ALTER TABLE IF EXISTS clientes RENAME COLUMN active TO ativo;
ALTER TABLE IF EXISTS clientes RENAME COLUMN created_at TO criado_em;
ALTER TABLE IF EXISTS clientes RENAME COLUMN updated_at TO atualizado_em;

-- 10. Renomear tabela customer_transactions para transacoes_clientes
ALTER TABLE IF EXISTS customer_transactions RENAME TO transacoes_clientes;

-- 11. Renomear colunas da tabela transacoes_clientes
ALTER TABLE IF EXISTS transacoes_clientes RENAME COLUMN customer_id TO cliente_id;
-- data_hora já está em português
ALTER TABLE IF EXISTS transacoes_clientes RENAME COLUMN created_at TO criado_em;
ALTER TABLE IF EXISTS transacoes_clientes RENAME COLUMN updated_at TO atualizado_em;

COMMIT;

-- Mensagem de sucesso
SELECT 'Migração concluída com sucesso! Todas as tabelas e colunas foram traduzidas para português.' AS status;
