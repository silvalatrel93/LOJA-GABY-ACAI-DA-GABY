-- Migração para adicionar colunas order_type e table_id à tabela orders
-- Essas colunas são necessárias para diferenciar pedidos de delivery e mesa

-- Adicionar coluna order_type
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'delivery';

-- Adicionar coluna table_id
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS table_id INTEGER;

-- Adicionar comentários para documentação
COMMENT ON COLUMN orders.order_type IS 'Tipo do pedido: delivery ou table';
COMMENT ON COLUMN orders.table_id IS 'ID da mesa para pedidos presenciais (referência à tabela tables)';

-- Criar índice para melhor performance nas consultas por tipo
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);

-- Atualizar pedidos existentes que têm endereço de mesa para order_type = 'table'
UPDATE orders 
SET order_type = 'table'
WHERE address->>'addressType' = 'mesa';

-- Nota: Os IDs das mesas serão preenchidos quando novos pedidos de mesa forem criados 