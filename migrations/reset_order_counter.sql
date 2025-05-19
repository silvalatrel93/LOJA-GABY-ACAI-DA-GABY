-- Redefinir o contador de sequência da tabela orders
-- Esta migração zera o contador de pedidos, fazendo com que o próximo pedido comece com o ID 1

-- Primeiro, verificamos se a sequência existe
DO $$
DECLARE
    sequence_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'orders_id_seq'
    ) INTO sequence_exists;

    IF sequence_exists THEN
        -- Redefinir a sequência para começar do 1 novamente
        EXECUTE 'ALTER SEQUENCE orders_id_seq RESTART WITH 1';
        RAISE NOTICE 'Contador de pedidos redefinido com sucesso. Próximo pedido será #1';
    ELSE
        RAISE NOTICE 'A sequência orders_id_seq não foi encontrada. Verificando nome alternativo...';
        
        -- Verificar outros possíveis nomes de sequência
        SELECT EXISTS(
            SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename LIKE '%orders%id%seq%'
        ) INTO sequence_exists;
        
        IF sequence_exists THEN
            -- Obter o nome exato da sequência
            DECLARE
                seq_name TEXT;
            BEGIN
                SELECT sequencename INTO seq_name FROM pg_sequences 
                WHERE schemaname = 'public' AND sequencename LIKE '%orders%id%seq%' 
                LIMIT 1;
                
                EXECUTE 'ALTER SEQUENCE ' || seq_name || ' RESTART WITH 1';
                RAISE NOTICE 'Contador de pedidos redefinido com sucesso usando sequência %', seq_name;
            END;
        ELSE
            RAISE EXCEPTION 'Não foi possível encontrar a sequência para a tabela orders';
        END IF;
    END IF;
END $$;

-- Adicionar comentário para documentação
COMMENT ON TABLE orders IS 'Tabela de pedidos com contador redefinido';
