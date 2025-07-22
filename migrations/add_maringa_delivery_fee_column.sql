-- Adicionar coluna maringa_delivery_fee à tabela store_config
ALTER TABLE store_config 
ADD COLUMN IF NOT EXISTS maringa_delivery_fee NUMERIC(10, 2) DEFAULT 8.0;

-- Comentário explicativo
COMMENT ON COLUMN store_config.maringa_delivery_fee IS 'Taxa de entrega específica para Maringá';