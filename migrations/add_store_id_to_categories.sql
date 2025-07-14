-- Migração para adicionar coluna store_id à tabela categories
-- Data: 2025-01-20
-- Descrição: Adiciona campo store_id na tabela categories para suporte multi-loja

-- Adicionar coluna store_id na tabela categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'default-store';

-- Comentário na coluna
COMMENT ON COLUMN categories.store_id IS 'ID da loja à qual a categoria pertence';

-- Atualizar categorias existentes com o store_id padrão
UPDATE categories 
SET store_id = 'default-store' 
WHERE store_id IS NULL;

-- Tornar a coluna NOT NULL após definir valores padrão
ALTER TABLE categories 
ALTER COLUMN store_id SET NOT NULL;

-- Criar índice para melhor performance nas consultas por loja
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);

-- Criar constraint única para nome + store_id (evitar categorias duplicadas por loja)
ALTER TABLE categories 
ADD CONSTRAINT IF NOT EXISTS categories_name_store_id_unique 
UNIQUE (name, store_id);