-- ========================================
-- MIGRAÇÃO: Suporte a limites de adicionais por tamanho
-- Data: 2025-01-20
-- Descrição: Permite configurar limites específicos para cada tamanho
-- ========================================

-- Esta migração não requer alterações na estrutura da tabela
-- Os limites por tamanho serão armazenados no campo JSON 'sizes'
-- Cada tamanho pode ter um campo 'additionalsLimit' opcional

-- Exemplo da estrutura JSON atualizada:
-- sizes: [
--   {"size": "300ml", "price": 12.00, "additionalsLimit": 3},
--   {"size": "500ml", "price": 15.00, "additionalsLimit": 5},
--   {"size": "1L", "price": 25.00, "additionalsLimit": 8}
-- ]

-- Verificar produtos existentes
SELECT 
    'PRODUTOS ATUAIS' as info,
    id, 
    name, 
    sizes,
    additionals_limit as limite_produto
FROM products 
ORDER BY id
LIMIT 5;

-- Exemplo de como atualizar um produto específico com limites por tamanho
-- (Execute apenas se quiser testar com um produto específico)
/*
UPDATE products 
SET sizes = '[
    {"size": "300ml", "price": 12.00, "additionalsLimit": 2},
    {"size": "500ml", "price": 15.00, "additionalsLimit": 4},
    {"size": "1L", "price": 25.00, "additionalsLimit": 6}
]'::jsonb
WHERE id = 1; -- Substitua pelo ID do produto que deseja testar
*/

-- Verificar a estrutura atual dos tamanhos
SELECT 
    'ESTRUTURA DOS TAMANHOS' as info,
    id,
    name,
    jsonb_pretty(sizes::jsonb) as tamanhos_formatados
FROM products 
WHERE id <= 3
ORDER BY id;

-- ========================================
-- RESULTADO ESPERADO:
-- ✅ Estrutura JSON dos tamanhos visualizada
-- ✅ Pronto para adicionar limites por tamanho
-- ✅ Compatível com sistema existente
-- ======================================== 