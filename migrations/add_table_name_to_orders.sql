-- Migração para adicionar coluna table_name à tabela orders
-- Esta coluna armazenará o nome da mesa para facilitar a exibição nas etiquetas

-- Adicionar coluna table_name
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS table_name TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN orders.table_name IS 'Nome da mesa para pedidos presenciais (copiado da tabela tables)';

-- Criar índice para melhor performance nas consultas por nome da mesa
CREATE INDEX IF NOT EXISTS idx_orders_table_name ON orders(table_name);

-- Nota: Os nomes das mesas serão preenchidos quando novos pedidos de mesa forem criados
-- Para pedidos existentes, o nome pode ser obtido através de JOIN com a tabela tables usando table_id