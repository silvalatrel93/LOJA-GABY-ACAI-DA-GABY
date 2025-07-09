-- Adicionar colunas para configuração de taxa de entrega de picolés
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS picole_delivery_fee NUMERIC DEFAULT 5.0;
ALTER TABLE store_config ADD COLUMN IF NOT EXISTS minimum_picole_order NUMERIC DEFAULT 20.0;
