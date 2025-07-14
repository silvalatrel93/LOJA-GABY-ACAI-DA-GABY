-- Script para corrigir a sequência da tabela categories
-- Este script sincroniza a sequência categories_id_seq com o maior ID existente

-- Verificar o maior ID atual na tabela categories
DO $$
DECLARE
    max_id INTEGER;
    seq_name TEXT := 'categories_id_seq';
BEGIN
    -- Obter o maior ID atual da tabela
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM categories;
    
    -- Definir a sequência para o próximo valor após o maior ID
    EXECUTE format('ALTER SEQUENCE %I RESTART WITH %s', seq_name, max_id + 1);
    
    RAISE NOTICE 'Sequência % redefinida para iniciar em %', seq_name, max_id + 1;
    RAISE NOTICE 'Maior ID atual na tabela categories: %', max_id;
END $$;

-- Verificar o valor atual da sequência após a correção
SELECT 
    'categories_id_seq' as sequence_name,
    last_value as current_value,
    (SELECT MAX(id) FROM categories) as max_table_id
FROM categories_id_seq;