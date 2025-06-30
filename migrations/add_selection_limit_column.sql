-- Adiciona a coluna selection_limit à tabela additional_categories se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'additional_categories'
        AND column_name = 'selection_limit'
    ) THEN
        ALTER TABLE additional_categories ADD COLUMN selection_limit INTEGER;
    END IF;
END $$;
