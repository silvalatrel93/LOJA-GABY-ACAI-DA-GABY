-- Migração para adicionar preços específicos para mesa
-- Data: 2025-01-20
-- Descrição: Adiciona campos para permitir preços diferentes entre delivery e mesa

-- Adicionar coluna para armazenar preços específicos de mesa
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS table_sizes JSONB;

-- Adicionar comentário para documentação
COMMENT ON COLUMN products.table_sizes IS 'Preços específicos para pedidos de mesa (formato igual ao campo sizes). Se NULL, usa os preços padrão do campo sizes.';

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_products_table_sizes ON products USING GIN (table_sizes);

-- Exemplo de estrutura do campo table_sizes:
-- [
--   {"size": "300ml", "price": 12.00, "additionalsLimit": 3},
--   {"size": "500ml", "price": 18.00, "additionalsLimit": 5}
-- ]

-- Se table_sizes for NULL, o sistema usará os preços do campo 'sizes' (delivery)
-- Se table_sizes tiver dados, o sistema usará esses preços para pedidos de mesa