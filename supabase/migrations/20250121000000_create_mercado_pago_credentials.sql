-- Criar tabela para armazenar credenciais do Mercado Pago por loja
CREATE TABLE IF NOT EXISTS mercado_pago_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id VARCHAR(50) NOT NULL REFERENCES store_config(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  access_token TEXT NOT NULL,
  chave_pix TEXT,
  webhook_url TEXT,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Garantir que cada loja tenha apenas uma configuração ativa
  UNIQUE(loja_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_mercado_pago_credentials_loja_id ON mercado_pago_credentials(loja_id);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_credentials_active ON mercado_pago_credentials(loja_id, is_active) WHERE is_active = true;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_mercado_pago_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER trigger_update_mercado_pago_credentials_updated_at
  BEFORE UPDATE ON mercado_pago_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_mercado_pago_credentials_updated_at();

-- Criar tabela para armazenar transações do Mercado Pago
CREATE TABLE IF NOT EXISTS mercado_pago_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id VARCHAR(255) NOT NULL UNIQUE,
  order_id UUID,
  loja_id VARCHAR(50) NOT NULL REFERENCES store_config(id),
  payment_method_id VARCHAR(50) NOT NULL, -- 'pix', 'credit_card', etc
  transaction_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'pending', 'approved', 'rejected', 'cancelled', 'refunded'
  status_detail VARCHAR(100),
  external_reference VARCHAR(255),
  pix_qr_code TEXT, -- Para pagamentos PIX
  pix_qr_code_base64 TEXT, -- QR Code em base64
  card_token VARCHAR(255), -- Para pagamentos com cartão
  installments INTEGER DEFAULT 1,
  payer_email VARCHAR(255),
  payer_identification_type VARCHAR(10),
  payer_identification_number VARCHAR(50),
  date_created TIMESTAMP WITH TIME ZONE,
  date_approved TIMESTAMP WITH TIME ZONE,
  date_last_updated TIMESTAMP WITH TIME ZONE,
  webhook_data JSONB, -- Dados completos do webhook
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para a tabela de transações
CREATE INDEX IF NOT EXISTS idx_mercado_pago_transactions_payment_id ON mercado_pago_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_transactions_order_id ON mercado_pago_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_transactions_loja_id ON mercado_pago_transactions(loja_id);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_transactions_status ON mercado_pago_transactions(status);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_transactions_external_ref ON mercado_pago_transactions(external_reference);

-- Criar trigger para atualizar updated_at na tabela de transações
CREATE OR REPLACE FUNCTION update_mercado_pago_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mercado_pago_transactions_updated_at
  BEFORE UPDATE ON mercado_pago_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_mercado_pago_transactions_updated_at();

-- Comentários para documentação
COMMENT ON TABLE mercado_pago_credentials IS 'Armazena as credenciais do Mercado Pago para cada loja';
COMMENT ON COLUMN mercado_pago_credentials.public_key IS 'Chave pública do Mercado Pago (criptografada)';
COMMENT ON COLUMN mercado_pago_credentials.access_token IS 'Token de acesso do Mercado Pago (criptografado)';
COMMENT ON COLUMN mercado_pago_credentials.chave_pix IS 'Chave PIX da loja (criptografada)';
COMMENT ON COLUMN mercado_pago_credentials.is_sandbox IS 'Indica se está usando ambiente de teste';

COMMENT ON TABLE mercado_pago_transactions IS 'Armazena todas as transações do Mercado Pago';
COMMENT ON COLUMN mercado_pago_transactions.payment_id IS 'ID único do pagamento no Mercado Pago';
COMMENT ON COLUMN mercado_pago_transactions.external_reference IS 'Referência externa (ID do pedido no sistema)';
