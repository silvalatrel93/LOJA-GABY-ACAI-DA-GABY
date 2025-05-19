-- Criar tabela para configurações de administrador
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar índice para buscas rápidas por chave
CREATE INDEX IF NOT EXISTS admin_settings_key_idx ON admin_settings (key);

-- Comentários para documentação
COMMENT ON TABLE admin_settings IS 'Tabela para armazenar configurações do administrador, incluindo senha com hash';
COMMENT ON COLUMN admin_settings.key IS 'Chave única para identificar a configuração';
COMMENT ON COLUMN admin_settings.value IS 'Valor da configuração, como hash de senha';
