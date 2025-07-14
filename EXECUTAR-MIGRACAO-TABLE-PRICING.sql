-- Migração para adicionar preços específicos da mesa
-- Execute este SQL no painel do Supabase ou via psql

-- Adicionar coluna table_sizes para preços específicos da mesa
ALTER TABLE products ADD COLUMN IF NOT EXISTS table_sizes JSONB;

-- Comentário sobre o uso:
-- A coluna table_sizes armazenará um array JSON com os preços específicos para consumo na mesa
-- Formato: [{"name": "Pequeno", "price": 15.00}, {"name": "Médio", "price": 18.00}]
-- Se table_sizes for null ou vazio, o sistema usará os preços padrão da coluna sizes

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'table_sizes';