-- Migração para adicionar a coluna needs_spoon na tabela products
-- Esta coluna indica se o produto precisa de colher (pergunta ao cliente)

ALTER TABLE products ADD COLUMN IF NOT EXISTS needs_spoon BOOLEAN DEFAULT false;

-- Verificar se a coluna foi criada com sucesso
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'needs_spoon';