-- ========================================
-- VERIFICAR ESTRUTURA DA TABELA PRODUCTS
-- Data: 2025-01-20
-- Descrição: Script para identificar colunas disponíveis
-- ========================================

-- 1. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 2. Ver alguns produtos de exemplo (primeiros 3)
SELECT * FROM products LIMIT 3;

-- 3. Verificar se existe coluna de categoria
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'category_name'
        ) THEN 'COLUNA category_name EXISTE'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'categoryname'
        ) THEN 'COLUNA categoryname EXISTE'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'category_id'
        ) THEN 'COLUNA category_id EXISTE'
        ELSE 'NENHUMA COLUNA DE CATEGORIA ENCONTRADA'
    END as status_categoria;

-- 4. Listar produtos com informações básicas (sem category_name)
SELECT 
    'PRODUTOS DISPONÍVEIS (SEM CATEGORIA)' as info,
    id, 
    name,
    has_additionals,
    active,
    jsonb_pretty(sizes::jsonb) as tamanhos_atuais
FROM products 
WHERE active = true
ORDER BY id; 