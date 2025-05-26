-- ========================================
-- CONFIGURAR PRODUTOS PARA TESTE DE LIMITES
-- Data: 2025-01-20
-- Descrição: Configurar vários produtos com limites específicos por tamanho
-- ========================================

-- 1. Configurar Marmita de Açaí com limites específicos
UPDATE products 
SET sizes = '[
    {"size": "Marmita P", "price": 33.00, "additionalsLimit": 3},
    {"size": "Marmita G", "price": 43.99, "additionalsLimit": 6}
]'::jsonb
WHERE id = (SELECT id FROM products WHERE name ILIKE '%marmita%' LIMIT 1);

-- 2. Configurar um açaí tradicional com limites variados
UPDATE products 
SET sizes = '[
    {"size": "300ml", "price": 12.00, "additionalsLimit": 2},
    {"size": "500ml", "price": 15.00, "additionalsLimit": 4},
    {"size": "1L", "price": 25.00, "additionalsLimit": 7}
]'::jsonb
WHERE id = (
    SELECT id FROM products 
    WHERE name NOT ILIKE '%marmita%' 
    AND name NOT ILIKE '%copo pronto%'
    ORDER BY id 
    LIMIT 1
);

-- 3. Configurar outro produto com alguns tamanhos limitados e outros ilimitados
UPDATE products 
SET sizes = '[
    {"size": "Pequeno", "price": 10.00, "additionalsLimit": 1},
    {"size": "Médio", "price": 15.00},
    {"size": "Grande", "price": 20.00, "additionalsLimit": 5},
    {"size": "Família", "price": 30.00, "additionalsLimit": 10}
]'::jsonb
WHERE id = (
    SELECT id FROM products 
    WHERE name NOT ILIKE '%marmita%' 
    AND name NOT ILIKE '%copo pronto%'
    ORDER BY id 
    LIMIT 1 OFFSET 1
);

-- 4. Verificar as configurações aplicadas
SELECT 
    'PRODUTOS CONFIGURADOS PARA TESTE' as status,
    id, 
    name, 
    jsonb_pretty(sizes::jsonb) as tamanhos_e_limites
FROM products 
WHERE sizes::text LIKE '%additionalsLimit%'
ORDER BY id;

-- 5. Análise dos limites configurados
SELECT 
    'RESUMO DOS LIMITES' as info,
    p.id,
    p.name,
    size_data.size as tamanho,
    (size_data.price)::numeric as preco,
    COALESCE((size_data.additionalsLimit)::integer, 999) as limite_adicionais,
    CASE 
        WHEN size_data.additionalsLimit IS NOT NULL THEN 'LIMITADO'
        ELSE 'ILIMITADO'
    END as tipo
FROM products p
CROSS JOIN LATERAL jsonb_array_elements(p.sizes::jsonb) as size_data
WHERE sizes::text LIKE '%additionalsLimit%'
ORDER BY p.id, size_data.size;

-- ========================================
-- RESULTADO ESPERADO:
-- ✅ Marmita P: 3 adicionais
-- ✅ Marmita G: 6 adicionais
-- ✅ 300ml: 2 adicionais
-- ✅ 500ml: 4 adicionais
-- ✅ 1L: 7 adicionais
-- ✅ Pequeno: 1 adicional
-- ✅ Médio: ilimitado
-- ✅ Grande: 5 adicionais
-- ✅ Família: 10 adicionais
-- ======================================== 