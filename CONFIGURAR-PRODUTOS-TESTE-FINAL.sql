-- ========================================
-- CONFIGURAR PRODUTOS PARA TESTE DE LIMITES (VERSÃO FINAL)
-- Data: 2025-01-20
-- Descrição: Script SQL simplificado e funcional
-- ========================================

-- PASSO 1: Ver produtos disponíveis
SELECT 
    id, 
    name,
    jsonb_pretty(sizes::jsonb) as tamanhos_atuais
FROM products 
ORDER BY id;

-- ========================================
-- PASSO 2: CONFIGURAR PRODUTOS
-- Descomente e ajuste os UPDATEs abaixo com os IDs corretos
-- ========================================

-- EXEMPLO: Configurar produto ID 1 com limites por tamanho
-- UPDATE products 
-- SET sizes = '[
--     {"size": "Marmita P", "price": 33.00, "additionalsLimit": 3},
--     {"size": "Marmita G", "price": 43.99, "additionalsLimit": 6}
-- ]'::jsonb
-- WHERE id = 1;

-- EXEMPLO: Configurar produto ID 2 com diferentes limites
-- UPDATE products 
-- SET sizes = '[
--     {"size": "300ml", "price": 12.00, "additionalsLimit": 2},
--     {"size": "500ml", "price": 15.00, "additionalsLimit": 4},
--     {"size": "1L", "price": 25.00, "additionalsLimit": 7}
-- ]'::jsonb
-- WHERE id = 2;

-- EXEMPLO: Configurar produto ID 3 (mix limitado/ilimitado)
-- UPDATE products 
-- SET sizes = '[
--     {"size": "Pequeno", "price": 10.00, "additionalsLimit": 1},
--     {"size": "Médio", "price": 15.00},
--     {"size": "Grande", "price": 20.00, "additionalsLimit": 5}
-- ]'::jsonb
-- WHERE id = 3;

-- ========================================
-- PASSO 3: VERIFICAR CONFIGURAÇÕES
-- ========================================

-- Ver produtos que têm limites configurados
SELECT 
    id, 
    name, 
    jsonb_pretty(sizes::jsonb) as tamanhos_e_limites
FROM products 
WHERE sizes::text LIKE '%additionalsLimit%'
ORDER BY id;

-- Análise detalhada dos limites
SELECT 
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
-- INSTRUÇÕES:
-- 1. Execute o PASSO 1 para ver os produtos
-- 2. Anote os IDs dos produtos que quer configurar
-- 3. Descomente e ajuste um UPDATE do PASSO 2
-- 4. Execute o UPDATE
-- 5. Execute o PASSO 3 para verificar
-- 6. Teste no frontend: http://localhost:3002
-- ======================================== 