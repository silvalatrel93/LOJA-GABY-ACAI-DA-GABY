-- Adiciona a coluna max_picoles_per_order à tabela store_config
ALTER TABLE store_config 
ADD COLUMN IF NOT EXISTS max_picoles_per_order INTEGER DEFAULT 20;

-- Atualiza a coluna para o valor padrão 20 onde for NULL
UPDATE store_config 
SET max_picoles_per_order = 20 
WHERE max_picoles_per_order IS NULL;
