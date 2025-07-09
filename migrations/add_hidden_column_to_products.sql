-- Adiciona a coluna hidden à tabela products se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'hidden'
    ) THEN
        ALTER TABLE products ADD COLUMN hidden BOOLEAN DEFAULT FALSE;
    END IF;
END $$; 