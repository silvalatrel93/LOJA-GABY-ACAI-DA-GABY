-- ========================================
-- TESTE: Sistema APENAS com Limites por Tamanho
-- Data: 2025-01-20
-- Descrição: Testar sistema que ignora limite geral e usa apenas limites específicos
-- ========================================

-- 1. Verificar produtos atuais
SELECT 
    'PRODUTOS ANTES DA ATUALIZAÇÃO' as teste,
    id, 
    name, 
    jsonb_pretty(sizes::jsonb) as tamanhos_atuais
FROM products 
ORDER BY id
LIMIT 3;

-- 2. Configurar produto de teste com limites específicos por tamanho
-- Exemplo: Marmita de Açaí com diferentes limites por tamanho
UPDATE products 
SET sizes = '[
    {"size": "Marmita P", "price": 33.00, "additionalsLimit": 3},
    {"size": "Marmita G", "price": 43.99, "additionalsLimit": 6}
]'::jsonb
WHERE name ILIKE '%marmita%' 
LIMIT 1;

-- 3. Configurar outro produto com alguns tamanhos sem limite
UPDATE products 
SET sizes = '[
    {"size": "300ml", "price": 12.00, "additionalsLimit": 2},
    {"size": "500ml", "price": 15.00},
    {"size": "1L", "price": 25.00, "additionalsLimit": 8}
]'::jsonb
WHERE id = (SELECT id FROM products WHERE name NOT ILIKE '%marmita%' ORDER BY id LIMIT 1);

-- 4. Verificar as configurações aplicadas
SELECT 
    'PRODUTOS CONFIGURADOS' as teste,
    id, 
    name, 
    jsonb_pretty(sizes::jsonb) as tamanhos_com_limites
FROM products 
WHERE id IN (
    SELECT id FROM products ORDER BY id LIMIT 2
)
ORDER BY id;

-- 5. Análise detalhada dos limites por tamanho
SELECT 
    'ANÁLISE DETALHADA' as teste,
    p.id,
    p.name,
    size_data.size as tamanho,
    (size_data.price)::numeric as preco,
    (size_data.additionalsLimit)::integer as limite_especifico,
    CASE 
        WHEN size_data.additionalsLimit IS NOT NULL THEN 'Limite: ' || size_data.additionalsLimit
        ELSE 'SEM LIMITE (ilimitado)'
    END as status_limite
FROM products p
CROSS JOIN LATERAL jsonb_array_elements(p.sizes::jsonb) as size_data
WHERE p.id IN (SELECT id FROM products ORDER BY id LIMIT 2)
ORDER BY p.id, size_data.size;

-- 6. Verificar comportamento esperado
SELECT 
    'COMPORTAMENTO ESPERADO' as info,
    'Tamanho com additionalsLimit definido = usar esse limite' as regra_1,
    'Tamanho sem additionalsLimit = sem limite (999 adicionais)' as regra_2,
    'Limite geral do produto = IGNORADO completamente' as regra_3,
    'Frontend deve aplicar apenas limites específicos' as regra_4;

-- ========================================
-- RESULTADO ESPERADO:
-- ✅ Marmita P: máximo 3 adicionais
-- ✅ Marmita G: máximo 6 adicionais  
-- ✅ 300ml: máximo 2 adicionais
-- ✅ 500ml: sem limite (ilimitado)
-- ✅ 1L: máximo 8 adicionais
-- ✅ Sistema ignora limite geral do produto
-- ======================================== 