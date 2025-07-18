-- Adicionar coluna hidden_from_delivery à tabela products
-- Esta coluna permitirá ocultar produtos específicos do sistema de delivery
-- mantendo-os visíveis no sistema de mesa e na página principal

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS hidden_from_delivery BOOLEAN DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN products.hidden_from_delivery IS 'Indica se o produto está oculto especificamente do sistema de delivery. Quando true, o produto não aparece no delivery mas pode aparecer em outros contextos.';

-- Verificar se a coluna foi criada corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('hidden', 'hidden_from_table', 'hidden_from_delivery')
ORDER BY column_name;