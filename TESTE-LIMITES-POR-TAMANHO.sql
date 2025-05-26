-- ========================================
-- TESTE: Sistema de Limites por Tamanho
-- Data: 2025-01-20
-- Descrição: Testar e configurar limites específicos por tamanho
-- ========================================

-- 1. Verificar a estrutura atual dos produtos
SELECT 
    'PRODUTOS ATUAIS' as teste,
    id, 
    name, 
    jsonb_pretty(sizes::jsonb) as tamanhos,
    additionals_limit as limite_produto
FROM products 
ORDER BY id
LIMIT 3;

-- 2. Exemplo: Atualizar um produto com limites específicos por tamanho
-- Produto pequeno = menos adicionais, produto grande = mais adicionais
UPDATE products 
SET sizes = '[
    {"size": "300ml", "price": 12.00, "additionalsLimit": 2},
    {"size": "500ml", "price": 15.00, "additionalsLimit": 4},
    {"size": "1L", "price": 25.00, "additionalsLimit": 7}
]'::jsonb
WHERE id = (SELECT id FROM products ORDER BY id LIMIT 1);

-- 3. Exemplo: Produto com alguns tamanhos tendo limite específico e outros usando o padrão
UPDATE products 
SET sizes = '[
    {"size": "300ml", "price": 10.00, "additionalsLimit": 1},
    {"size": "500ml", "price": 14.00},
    {"size": "1L", "price": 22.00, "additionalsLimit": 6}
]'::jsonb
WHERE id = (SELECT id FROM products ORDER BY id LIMIT 1 OFFSET 1);

-- 4. Verificar as atualizações
SELECT 
    'PRODUTOS ATUALIZADOS' as teste,
    id, 
    name, 
    jsonb_pretty(sizes::jsonb) as tamanhos_com_limites,
    additionals_limit as limite_produto_padrao
FROM products 
WHERE id IN (
    SELECT id FROM products ORDER BY id LIMIT 2
)
ORDER BY id;

-- 5. Consulta para extrair limites por tamanho de forma estruturada
SELECT 
    'ANÁLISE DE LIMITES' as teste,
    p.id,
    p.name,
    size_data.size,
    (size_data.price)::numeric as preco,
    COALESCE((size_data.additionalsLimit)::integer, p.additionals_limit) as limite_efetivo,
    CASE 
        WHEN size_data.additionalsLimit IS NOT NULL THEN 'Específico do tamanho'
        ELSE 'Padrão do produto'
    END as tipo_limite
FROM products p
CROSS JOIN LATERAL jsonb_array_elements(p.sizes::jsonb) as size_data
WHERE p.id IN (SELECT id FROM products ORDER BY id LIMIT 2)
ORDER BY p.id, size_data.size;

-- 6. Exemplo de como o frontend deve interpretar os limites
-- Lógica: Se o tamanho tem additionalsLimit, usar esse valor
--         Caso contrário, usar o additionals_limit do produto
SELECT 
    'LÓGICA DO FRONTEND' as info,
    'Para cada tamanho selecionado:' as instrucao_1,
    '1. Verificar se size.additionalsLimit existe' as instrucao_2,
    '2. Se sim, usar size.additionalsLimit' as instrucao_3,
    '3. Se não, usar product.additionals_limit' as instrucao_4,
    '4. Aplicar validação no frontend' as instrucao_5;

-- ========================================
-- RESULTADO ESPERADO:
-- ✅ Produtos com limites específicos por tamanho
-- ✅ Alguns tamanhos com limite próprio, outros usando padrão
-- ✅ Sistema flexível e compatível
-- ✅ Frontend pode aplicar limites dinamicamente
-- ======================================== 