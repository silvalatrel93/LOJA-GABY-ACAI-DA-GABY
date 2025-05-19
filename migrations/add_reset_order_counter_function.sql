-- Função para redefinir o contador de pedidos
-- Esta função permite redefinir o contador de pedidos de forma segura

-- Criar a função reset_order_counter
CREATE OR REPLACE FUNCTION reset_order_counter()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Executar com privilégios do criador
AS $$
DECLARE
  success boolean := false;
  seq_name text;
BEGIN
  -- Verificar se a tabela orders existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    -- Encontrar o nome da sequência associada à coluna id da tabela orders
    SELECT pg_get_serial_sequence('public.orders', 'id') INTO seq_name;
    
    IF seq_name IS NOT NULL THEN
      -- Redefinir a sequência para 1
      EXECUTE 'ALTER SEQUENCE ' || seq_name || ' RESTART WITH 1';
      success := true;
    ELSE
      -- Se não encontrar a sequência pelo método padrão, tentar outro método
      SELECT c.relname INTO seq_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'S' AND n.nspname = 'public' AND c.relname LIKE '%orders%id%seq%'
      LIMIT 1;
      
      IF seq_name IS NOT NULL THEN
        -- Redefinir a sequência encontrada
        EXECUTE 'ALTER SEQUENCE public.' || seq_name || ' RESTART WITH 1';
        success := true;
      END IF;
    END IF;
  END IF;
  
  RETURN success;
END;
$$;

-- Criar uma view/tabela para permitir redefinir o contador via API REST
CREATE OR REPLACE VIEW _reset_order_counter AS
SELECT 'dummy' AS dummy;

-- Criar uma trigger para a view que chama a função reset_order_counter
CREATE OR REPLACE FUNCTION trigger_reset_order_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM reset_order_counter();
  RETURN NEW;
END;
$$;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS reset_order_counter_trigger ON _reset_order_counter;

-- Adicionar trigger à view
CREATE TRIGGER reset_order_counter_trigger
INSTEAD OF INSERT ON _reset_order_counter
FOR EACH ROW
EXECUTE FUNCTION trigger_reset_order_counter();

-- Comentários para documentação
COMMENT ON FUNCTION reset_order_counter() IS 'Função para redefinir o contador de pedidos para 1';
COMMENT ON VIEW _reset_order_counter IS 'View para permitir redefinir o contador de pedidos via API REST';
