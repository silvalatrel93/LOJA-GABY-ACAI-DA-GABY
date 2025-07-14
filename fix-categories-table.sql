-- Script para corrigir a tabela categories adicionando store_id
-- Execute este script no seu banco Supabase

-- Adicionar coluna store_id se não existir
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'default-store';

-- Atualizar registros existentes
UPDATE categories 
SET store_id = 'default-store' 
WHERE store_id IS NULL;

-- Tornar a coluna NOT NULL
ALTER TABLE categories 
ALTER COLUMN store_id SET NOT NULL;

-- Criar constraint única para evitar categorias duplicadas por loja
ALTER TABLE categories 
ADD CONSTRAINT IF NOT EXISTS categories_name_store_id_unique 
UNIQUE (name, store_id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);