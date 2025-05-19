-- Verificar se a coluna user_id existe na tabela push_subscriptions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'push_subscriptions'
        AND column_name = 'user_id'
    ) THEN
        -- Adicionar a coluna user_id se não existir
        ALTER TABLE public.push_subscriptions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Adicionar restrição de unicidade
        ALTER TABLE public.push_subscriptions ADD CONSTRAINT unique_user_id UNIQUE (user_id);
    END IF;
END
$$;
