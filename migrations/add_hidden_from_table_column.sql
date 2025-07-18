-- Adiciona colunas relacionadas à visibilidade no sistema de mesa
ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden_from_table BOOLEAN DEFAULT false;

-- Atualiza produtos existentes para serem visíveis em mesa por padrão
UPDATE products SET hidden_from_table = false WHERE hidden_from_table IS NULL;

-- Atualiza o schema cache do PostgREST
NOTIFY pgrst, 'reload schema'; 