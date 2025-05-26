-- ========================================
-- TESTE DE FORMATAÇÃO - SCRIPT SEGURO
-- Data: 2025-01-20
-- Descrição: Script para testar formatação sem erros
-- ========================================

-- PASSO 1: Ver produtos disponíveis primeiro
SELECT 
    'PRODUTOS DISPONÍVEIS' as info,
    id,
    name,
    LEFT(description, 50) as descricao_atual
FROM products 
ORDER BY id
LIMIT 10;

-- PASSO 2: Atualizar apenas o "Açaí no Potão" (script seguro)
UPDATE products 
SET description = '1L - ESCOLHA 5 ADICIONAIS GRÁTIS (1 CAMADA DE COMPLEMENTOS).

2L - ESCOLHA 5 ADICIONAIS GRÁTIS (2 CAMADAS DE COMPLEMENTOS).'
WHERE name ILIKE '%açaí no potão%' 
   OR name ILIKE '%acai no potao%'
   OR name ILIKE '%açai no potão%';

-- PASSO 3: Verificar se a atualização funcionou
SELECT 
    'RESULTADO DA ATUALIZAÇÃO' as status,
    id,
    name,
    description
FROM products 
WHERE name ILIKE '%açaí no potão%' 
   OR name ILIKE '%acai no potao%'
   OR name ILIKE '%açai no potão%';

-- PASSO 4: Contar quantos produtos foram atualizados
SELECT 
    'PRODUTOS ATUALIZADOS' as info,
    COUNT(*) as quantidade
FROM products 
WHERE description LIKE '%1L - ESCOLHA 5 ADICIONAIS%';

-- ========================================
-- INSTRUÇÕES DE USO:
-- 1. Execute o PASSO 1 para ver os produtos
-- 2. Execute o PASSO 2 para atualizar a descrição
-- 3. Execute o PASSO 3 para verificar o resultado
-- 4. Execute o PASSO 4 para confirmar a atualização
-- 5. Teste no frontend: http://localhost:3002
-- ========================================

-- EXEMPLO para outros produtos (NÃO EXECUTE, apenas referência):
/*
-- Para atualizar outro produto específico:
UPDATE products 
SET description = 'Nova descrição com quebra.

Segunda linha da descrição.'
WHERE id = 123; -- Substitua 123 pelo ID real

-- Para buscar um produto específico:
SELECT id, name FROM products WHERE name ILIKE '%nome do produto%';
*/ 