-- ========================================
-- MIGRAÇÃO: Adicionar campo additionals_limit
-- Data: 2025-01-20
-- Descrição: Limitador de adicionais manual por produto
-- ========================================

-- Passo 1: Verificar se a coluna já existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'additionals_limit'
    ) THEN
        -- Adicionar coluna additionals_limit
        ALTER TABLE products 
        ADD COLUMN additionals_limit INTEGER DEFAULT 5 CHECK (additionals_limit >= 0);
        
        -- Adicionar comentário
        COMMENT ON COLUMN products.additionals_limit IS 'Limite máximo de adicionais permitidos para este produto (0 = sem limite)';
        
        RAISE NOTICE '✅ Coluna additionals_limit adicionada com sucesso!';
    ELSE
        RAISE NOTICE '⚠️  Coluna additionals_limit já existe!';
    END IF;
END $$;

-- Passo 2: Atualizar produtos existentes que não têm limite definido
UPDATE products 
SET additionals_limit = 5 
WHERE additionals_limit IS NULL;

-- Passo 3: Tornar a coluna NOT NULL
ALTER TABLE products 
ALTER COLUMN additionals_limit SET NOT NULL;

-- Passo 4: Verificar se a migração foi aplicada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    CASE 
        WHEN column_name = 'additionals_limit' THEN '✅ Campo criado com sucesso!'
        ELSE ''
    END as status
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'additionals_limit';

-- Passo 5: Mostrar alguns produtos com o novo campo
SELECT 
    id, 
    name, 
    additionals_limit,
    '✅ Produto atualizado' as status
FROM products 
LIMIT 5;

-- ========================================
-- RESULTADO ESPERADO:
-- - Coluna additionals_limit criada
-- - Valor padrão: 5
-- - Validação: >= 0
-- - Todos os produtos atualizados
-- ======================================== 