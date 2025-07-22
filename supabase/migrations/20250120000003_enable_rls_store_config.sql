-- Migração para ativar RLS na tabela store_config
-- Data: 2025-01-20
-- Descrição: Ativa Row Level Security e cria políticas de acesso

-- Ativar RLS na tabela store_config
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados (acesso completo)
CREATE POLICY "Authenticated users can manage store_config" ON store_config
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política para usuários anônimos (apenas leitura)
CREATE POLICY "Anonymous users can read store_config" ON store_config
    FOR SELECT
    TO anon
    USING (true);

-- Comentários para documentação
COMMENT ON POLICY "Authenticated users can manage store_config" ON store_config IS 
'Permite que usuários autenticados tenham acesso completo à configuração da loja';

COMMENT ON POLICY "Anonymous users can read store_config" ON store_config IS 
'Permite que usuários anônimos leiam a configuração da loja (necessário para funcionamento público)';