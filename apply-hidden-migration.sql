
-- Migração: Adicionar coluna hidden à tabela products
-- Execute no Console do Supabase: SQL Editor

-- 1. Adiciona a coluna se não existir
ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;

-- 2. Atualiza produtos existentes para serem visíveis por padrão
UPDATE products SET hidden = FALSE WHERE hidden IS NULL;

-- 3. Verifica se a migração funcionou
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'hidden';

-- 4. Testa a funcionalidade
SELECT 
  id, 
  name, 
  active, 
  hidden,
  CASE 
    WHEN hidden = true THEN 'Produto Oculto'
    WHEN hidden = false THEN 'Produto Visível'
    ELSE 'Status Indefinido'
  END as status_visibilidade
FROM products 
LIMIT 5;
