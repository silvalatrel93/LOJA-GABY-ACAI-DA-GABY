-- Adicionar coluna number à tabela delivery_addresses
-- Esta coluna permitirá armazenar o número do endereço separadamente da rua

ALTER TABLE delivery_addresses 
ADD COLUMN IF NOT EXISTS number TEXT;

-- Comentário explicativo
COMMENT ON COLUMN delivery_addresses.number IS 'Número do endereço de entrega';

-- Verificar se a coluna foi criada corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'delivery_addresses' 
AND column_name = 'number'
ORDER BY column_name;