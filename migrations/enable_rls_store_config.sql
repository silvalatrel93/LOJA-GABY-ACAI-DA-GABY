-- Migração para ativar Row Level Security na tabela store_config
-- Data: 2025-01-21
-- Descrição: Ativa RLS para melhorar a segurança da tabela store_config

-- Ativar Row Level Security na tabela store_config
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso completo a usuários autenticados
CREATE POLICY "Permitir acesso completo para usuários autenticados" ON store_config
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Criar política para permitir apenas leitura para usuários anônimos
CREATE POLICY "Permitir leitura para usuários anônimos" ON store_config
    FOR SELECT
    TO anon
    USING (true);

-- Comentários sobre as políticas criadas
COMMENT ON POLICY "Permitir acesso completo para usuários autenticados" ON store_config IS 
'Permite que usuários autenticados tenham acesso completo (SELECT, INSERT, UPDATE, DELETE) à tabela store_config';

COMMENT ON POLICY "Permitir leitura para usuários anônimos" ON store_config IS 
'Permite que usuários anônimos apenas leiam dados da tabela store_config, necessário para exibir configurações da loja publicamente';