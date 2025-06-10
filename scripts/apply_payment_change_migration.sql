-- ========================================
-- MIGRAÇÃO: Adicionar campo payment_change
-- Data: 2024-06-10
-- Descrição: Adiciona campo para armazenar o troco em pagamentos em dinheiro
-- ========================================

-- Passo 1: Verificar se a coluna já existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'orders' 
        AND column_name = 'payment_change'
    ) THEN
        -- Adicionar coluna payment_change
        ALTER TABLE public.orders 
        ADD COLUMN payment_change TEXT NULL;
        
        -- Adicionar comentário
        COMMENT ON COLUMN public.orders.payment_change IS 'Armazena o valor do troco para pagamentos em dinheiro';
        
        RAISE NOTICE 'Coluna payment_change adicionada com sucesso à tabela orders.';
    ELSE
        RAISE NOTICE 'A coluna payment_change já existe na tabela orders.';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao adicionar a coluna payment_change: %', SQLERRM;
END $$;
