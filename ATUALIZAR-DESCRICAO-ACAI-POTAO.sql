-- ========================================
-- ATUALIZAR DESCRIÇÃO DO AÇAÍ NO POTÃO
-- Data: 2025-01-20
-- Descrição: Formatar a descrição com quebras de linha organizadas
-- ========================================

-- Atualizar a descrição do produto "Açaí no Potão" com quebras de linha
UPDATE products 
SET description = '1L - ESCOLHA 5 ADICIONAIS GRÁTIS (1 CAMADA DE COMPLEMENTOS).

2L - ESCOLHA 5 ADICIONAIS GRÁTIS (2 CAMADAS DE COMPLEMENTOS).'
WHERE name ILIKE '%açaí no potão%' OR name ILIKE '%acai no potao%';

-- Verificar a atualização
SELECT 
    'DESCRIÇÃO ATUALIZADA' as status,
    id,
    name,
    description
FROM products 
WHERE name ILIKE '%açaí no potão%' OR name ILIKE '%acai no potao%';

-- ========================================
-- RESULTADO ESPERADO:
-- ✅ Linha 1: 1L - ESCOLHA 5 ADICIONAIS GRÁTIS (1 CAMADA DE COMPLEMENTOS).
-- ✅ Linha 2: (linha em branco)
-- ✅ Linha 3: 2L - ESCOLHA 5 ADICIONAIS GRÁTIS (2 CAMADAS DE COMPLEMENTOS).
-- ========================================