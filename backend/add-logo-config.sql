-- Adicionar configurações de logo e nome da loja
INSERT INTO "Configuracoes" (chave, valor, tipo, descricao, tenant_id, criado_em, atualizado_em)
VALUES 
  ('logo_url', '', 'texto', 'URL ou caminho da logo da loja exibida no menu', 'tenant_loja_3tec_1765500122876', NOW(), NOW()),
  ('nome_loja', 'Minha Loja', 'texto', 'Nome da loja exibido ao lado da logo', 'tenant_loja_3tec_1765500122876', NOW(), NOW())
ON CONFLICT (chave, tenant_id) DO NOTHING;
