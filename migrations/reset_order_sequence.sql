-- Função para redefinir a sequência da tabela orders
CREATE OR REPLACE FUNCTION reset_order_sequence()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seq_name text;
  success boolean := false;
BEGIN
  -- Encontrar o nome da sequência associada à coluna id da tabela orders
  SELECT pg_get_serial_sequence('public.orders', 'id') INTO seq_name;
  
  IF seq_name IS NOT NULL THEN
    -- Redefinir a sequência para 1
    EXECUTE 'ALTER SEQUENCE ' || seq_name || ' RESTART WITH 1';
    success := true;
    RAISE NOTICE 'Sequência % redefinida com sucesso', seq_name;
  ELSE
    -- Tentar encontrar a sequência pelo nome padrão
    SELECT c.relname INTO seq_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S' 
      AND n.nspname = 'public' 
      AND c.relname LIKE '%orders_id_seq%';
    
    IF seq_name IS NOT NULL THEN
      -- Redefinir a sequência encontrada
      EXECUTE 'ALTER SEQUENCE public.' || seq_name || ' RESTART WITH 1';
      success := true;
      RAISE NOTICE 'Sequência % redefinida com sucesso (método alternativo)', seq_name;
    ELSE
      RAISE NOTICE 'Não foi possível encontrar a sequência da tabela orders';
    END IF;
  END IF;
  
  RETURN success;
END;
$$;
