-- Script para aplicar a migração do campo additionals_limit
-- Execute este script diretamente no Supabase SQL Editor

-- Verificar se a coluna já existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'additionals_limit'
    ) THEN
        -- Adicionar a coluna additionals_limit
        ALTER TABLE products 
        ADD COLUMN additionals_limit INTEGER DEFAULT 5 CHECK (additionals_limit >= 0);
        
        -- Adicionar comentário
        COMMENT ON COLUMN products.additionals_limit IS 'Limite máximo de adicionais permitidos para este produto (0 = sem limite)';
        
        -- Atualizar produtos existentes
        UPDATE products 
        SET additionals_limit = 5 
        WHERE additionals_limit IS NULL;
        
        -- Tornar a coluna NOT NULL
        ALTER TABLE products 
        ALTER COLUMN additionals_limit SET NOT NULL;
        
        RAISE NOTICE 'Coluna additionals_limit adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna additionals_limit já existe!';
    END IF;
END $$; 