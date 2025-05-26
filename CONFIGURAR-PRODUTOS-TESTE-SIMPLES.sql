-- ========================================
-- CONFIGURAR PRODUTOS PARA TESTE DE LIMITES (VERSÃO SIMPLES)
-- Data: 2025-01-20
-- Descrição: Script SQL corrigido para configurar produtos com limites
-- ========================================

-- PRIMEIRO: Verificar produtos existentes
SELECT 
    'PRODUTOS DISPONÍVEIS' as info,
    id, 
    name, 
    jsonb_pretty(sizes::jsonb) as tamanhos_atuais
FROM products 
ORDER BY id;

-- ========================================
-- CONFIGURAÇÕES MANUAIS POR ID
-- (Substitua os IDs pelos IDs reais dos seus produtos)
-- ========================================

-- Exemplo 1: Configurar produto ID 1 (substitua pelo ID da sua Marmita)
-- UPDATE products 
-- SET sizes = '[
--     {"size": "Marmita P", "price": 33.00, "additionalsLimit": 3},
--     {"size": "Marmita G", "price": 43.99, "additionalsLimit": 6}
-- ]'::jsonb
-- WHERE id = 1;

-- Exemplo 2: Configurar produto ID 2 (substitua pelo ID do seu Açaí)
-- UPDATE products 
-- SET sizes = '[
--     {"size": "300ml", "price": 12.00, "additionalsLimit": 2},
--     {"size": "500ml", "price": 15.00, "additionalsLimit": 4},
--     {"size": "1L", "price": 25.00, "additionalsLimit": 7}
-- ]'::jsonb
-- WHERE id = 2;

-- Exemplo 3: Configurar produto ID 3 (mix de limitado e ilimitado)
-- UPDATE products 
-- SET sizes = '[
--     {"size": "Pequeno", "price": 10.00, "additionalsLimit": 1},
--     {"size": "Médio", "price": 15.00},
--     {"size": "Grande", "price": 20.00, "additionalsLimit": 5}
-- ]'::jsonb
-- WHERE id = 3;

-- ========================================
-- INSTRUÇÕES DE USO:
-- ========================================
-- 1. Execute a primeira query para ver os produtos disponíveis
-- 2. Anote os IDs dos produtos que quer configurar
-- 3. Descomente e ajuste os UPDATEs acima com os IDs corretos
-- 4. Execute os UPDATEs um por vez
-- 5. Execute a query de verificação abaixo
-- ========================================

-- VERIFICAÇÃO FINAL: Ver produtos configurados
SELECT 
    'PRODUTOS COM LIMITES CONFIGURADOS' as status,
    id, 
    name, 
    jsonb_pretty(sizes::jsonb) as tamanhos_e_limites
FROM products 
WHERE sizes::text LIKE '%additionalsLimit%'
ORDER BY id;

-- ANÁLISE DETALHADA DOS LIMITES
SELECT 
    'ANÁLISE DOS LIMITES' as info,
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