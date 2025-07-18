-- =====================================================
-- CORREÇÃO: Visibilidade Independente Delivery e Mesa
-- =====================================================
-- Este script adiciona as colunas necessárias para permitir
-- visibilidade independente entre os sistemas de Delivery e Mesa.

-- 1. Adicionar coluna para controlar visibilidade no delivery
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'hidden_from_delivery'
    ) THEN
        ALTER TABLE products ADD COLUMN hidden_from_delivery BOOLEAN DEFAULT false;
        UPDATE products SET hidden_from_delivery = false WHERE hidden_from_delivery IS NULL;
        RAISE NOTICE 'Coluna hidden_from_delivery adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna hidden_from_delivery já existe';
    END IF;
END $$;

-- 2. Adicionar coluna para controlar visibilidade em mesa
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'hidden_from_table'
    ) THEN
        ALTER TABLE products ADD COLUMN hidden_from_table BOOLEAN DEFAULT false;
        UPDATE products SET hidden_from_table = false WHERE hidden_from_table IS NULL;
        RAISE NOTICE 'Coluna hidden_from_table adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna hidden_from_table já existe';
    END IF;
END $$;

-- 3. Adicionar comentários para documentação
COMMENT ON COLUMN products.hidden_from_delivery IS 'Controla se o produto está oculto especificamente no sistema de delivery. Quando true, produto não aparece no delivery mas pode aparecer na mesa.';
COMMENT ON COLUMN products.hidden_from_table IS 'Controla se o produto está oculto especificamente no sistema de mesa. Quando true, produto não aparece na mesa mas pode aparecer no delivery.';

-- 4. Verificar se as migrações foram aplicadas
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('hidden', 'hidden_from_delivery', 'hidden_from_table')
ORDER BY column_name;

-- 5. Teste de funcionalidade
SELECT 
    id, 
    name, 
    active,
    hidden,
    hidden_from_delivery,
    hidden_from_table,
    CASE 
        WHEN hidden = true THEN 'Oculto Geral'
        WHEN hidden_from_delivery = true AND hidden_from_table = false THEN 'Oculto apenas do Delivery'
        WHEN hidden_from_table = true AND hidden_from_delivery = false THEN 'Oculto apenas da Mesa'
        WHEN hidden_from_delivery = true AND hidden_from_table = true THEN 'Oculto de Delivery e Mesa'
        ELSE 'Visível em todos os sistemas'
    END as status_visibilidade
FROM products 
WHERE active = true
LIMIT 5;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Execute este script no Console do Supabase (SQL Editor)
-- 2. Verifique se não há erros na execução
-- 3. Confirme que as colunas foram criadas na consulta de verificação
-- 4. Teste a funcionalidade nos painéis de administração
-- ===================================================== 