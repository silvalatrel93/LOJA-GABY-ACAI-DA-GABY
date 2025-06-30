-- Adiciona a coluna selection_limit à tabela additional_categories
ALTER TABLE additional_categories ADD COLUMN IF NOT EXISTS selection_limit INTEGER;
