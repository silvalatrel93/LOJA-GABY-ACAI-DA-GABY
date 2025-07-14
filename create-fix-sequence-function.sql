-- Função para corrigir automaticamente a sequência da tabela categories
-- Execute este SQL no painel do Supabase (SQL Editor)

CREATE OR REPLACE FUNCTION fix_categories_sequence()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    max_id INTEGER;
    seq_name TEXT := 'categories_id_seq';
BEGIN
    -- Obter o maior ID atual da tabela
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM categories;
    
    -- Definir a sequência para o próximo valor após o maior ID
    EXECUTE format('ALTER SEQUENCE %I RESTART WITH %s', seq_name, max_id + 1);
    
    -- Log da operação
    RAISE NOTICE 'Sequência % redefinida para iniciar em %', seq_name, max_id + 1;
    RAISE NOTICE 'Maior ID atual na tabela categories: %', max_id;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro ao corrigir sequência: %', SQLERRM;
        RETURN false;
END $$;

-- Executar a função uma vez para corrigir a sequência atual
SELECT fix_categories_sequence();

-- Verificar o resultado
SELECT 
    'categories_id_seq' as sequence_name,
    last_value as current_value,
    (SELECT MAX(id) FROM categories) as max_table_id,
    (SELECT COUNT(*) FROM categories) as total_categories
FROM categories_id_seq;