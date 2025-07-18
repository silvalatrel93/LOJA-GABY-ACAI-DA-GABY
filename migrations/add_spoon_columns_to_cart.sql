-- Adiciona colunas relacionadas a colher na tabela cart
ALTER TABLE cart ADD COLUMN IF NOT EXISTS needs_spoon BOOLEAN DEFAULT false;
ALTER TABLE cart ADD COLUMN IF NOT EXISTS spoon_quantity INTEGER DEFAULT 1;

-- Atualiza o schema cache do PostgREST
NOTIFY pgrst, 'reload schema'; 