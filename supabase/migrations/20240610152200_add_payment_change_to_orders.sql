-- Adiciona a coluna payment_change à tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_change TEXT NULL;

-- Comentário para documentar a coluna
COMMENT ON COLUMN public.orders.payment_change IS 'Armazena o valor do troco para pagamentos em dinheiro';
