-- ========================================
-- MIGRAÇÃO: Adicionar preço base para produtos sem tamanho
-- Data: 2025-01-20
-- Descrição: Adiciona campo price para produtos sem variações de tamanho
-- ========================================

-- Adicionar coluna price para preço base do produto
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0;

-- Adicionar comentário explicativo
COMMENT ON COLUMN products.price IS 'Preço base do produto. Usado para produtos sem variações de tamanho (quando sizes está vazio).';

-- Verificar se a coluna foi criada corretamente
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'price'
ORDER BY ordinal_position;

-- Exemplo de uso:
-- Para produtos COM tamanhos: usar preços do campo 'sizes'
-- Para produtos SEM tamanhos: usar preço do campo 'price'

-- ========================================
-- RESULTADO ESPERADO:
-- ✅ Coluna 'price' criada na tabela products
-- ✅ Produtos sem tamanho podem ter preço base
-- ✅ Sistema compatível com produtos existentes
-- ========================================