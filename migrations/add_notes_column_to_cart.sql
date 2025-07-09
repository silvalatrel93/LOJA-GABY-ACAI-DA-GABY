-- Adiciona a coluna notes à tabela cart
ALTER TABLE cart ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Atualiza o schema cache do PostgREST
NOTIFY pgrst, 'reload schema'; 