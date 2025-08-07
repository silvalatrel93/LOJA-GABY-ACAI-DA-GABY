-- Desativar temporariamente o RLS para redefinir as políticas
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes na tabela 'orders'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.orders;';
    END LOOP;
END;
$$;

-- Criar uma política única e permissiva para todos os usuários (anon e authenticated)
CREATE POLICY "Allow all operations for all users" 
ON public.orders
FOR ALL
USING (true)
WITH CHECK (true);

-- Reativar o RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Forçar a aplicação das novas políticas
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;