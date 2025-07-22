-- Adicionar coluna de cor da loja na tabela store_config
ALTER TABLE store_config 
ADD COLUMN IF NOT EXISTS store_color TEXT DEFAULT '#8B5CF6';

-- Comentário explicativo
COMMENT ON COLUMN store_config.store_color IS 'Cor principal da loja em formato hexadecimal (ex: #8B5CF6 para roxo)';