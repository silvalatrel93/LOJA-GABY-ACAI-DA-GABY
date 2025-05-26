-- Migração para adicionar campo de limite de adicionais por produto
-- Data: 2025-01-20
-- Descrição: Adiciona campo additionals_limit na tabela products para permitir limite personalizado de adicionais por produto

-- Adicionar coluna additionals_limit na tabela products
ALTER TABLE products 
ADD COLUMN additionals_limit INTEGER DEFAULT 5 CHECK (additionals_limit >= 0);

-- Comentário na coluna
COMMENT ON COLUMN products.additionals_limit IS 'Limite máximo de adicionais permitidos para este produto (0 = sem limite)';

-- Atualizar produtos existentes com o limite padrão de 5
UPDATE products 
SET additionals_limit = 5 
WHERE additionals_limit IS NULL;

-- Tornar a coluna NOT NULL após definir valores padrão
ALTER TABLE products 
ALTER COLUMN additionals_limit SET NOT NULL; 