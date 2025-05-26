-- ========================================
-- TESTE PÓS-MIGRAÇÃO
-- Verificar se o limitador de adicionais está funcionando
-- ========================================

-- 1. Verificar se a coluna foi criada corretamente
SELECT 
    'ESTRUTURA DA TABELA' as teste,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'additionals_limit';

-- 2. Verificar produtos existentes
SELECT 
    'PRODUTOS ATUALIZADOS' as teste,
    id, 
    name, 
    additionals_limit,
    CASE 
        WHEN additionals_limit IS NOT NULL THEN '✅ OK'
        ELSE '❌ ERRO'
    END as status
FROM products 
ORDER BY id
LIMIT 10;

-- 3. Testar inserção de novo produto (simulação)
-- Este comando mostra como seria inserir um produto com limite personalizado
SELECT 
    'EXEMPLO DE INSERÇÃO' as teste,
    'INSERT INTO products (name, description, image, sizes, category_id, active, allowed_additionals, additionals_limit, store_id) VALUES (''Teste'', ''Produto teste'', ''/test.jpg'', ''[{"size":"500ml","price":15}]'', 1, true, ''{1,2,3}'', 3, 1);' as comando_sql;

-- 4. Verificar constraint de validação
SELECT 
    'VALIDAÇÃO' as teste,
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%additionals_limit%';

-- 5. Contar produtos por limite
SELECT 
    'DISTRIBUIÇÃO DE LIMITES' as teste,
    additionals_limit,
    COUNT(*) as quantidade_produtos
FROM products 
GROUP BY additionals_limit
ORDER BY additionals_limit;

-- ========================================
-- RESULTADO ESPERADO:
-- ✅ Coluna additionals_limit existe
-- ✅ Todos os produtos têm limite definido
-- ✅ Constraint de validação ativa
-- ✅ Maioria dos produtos com limite 5
-- ======================================== 