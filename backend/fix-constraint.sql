-- Remove constraint antiga
ALTER TABLE pedidos_catalogo 
DROP CONSTRAINT IF EXISTS pedidos_catalogo_numero_pedido_key;

-- Cria constraint composta (tenant_id + numero_pedido)
ALTER TABLE pedidos_catalogo 
ADD CONSTRAINT pedidos_catalogo_tenant_numero_unique 
UNIQUE (tenant_id, numero_pedido);
