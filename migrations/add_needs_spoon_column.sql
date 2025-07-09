-- Adiciona a coluna needs_spoon à tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS needs_spoon BOOLEAN DEFAULT false;

-- Atualiza o schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
