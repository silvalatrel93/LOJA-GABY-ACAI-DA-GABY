-- Migração para criar a tabela tables
-- Data: 2025-01-20
-- Descrição: Cria a tabela para gerenciar mesas do estabelecimento

-- Criar tabela tables
CREATE TABLE IF NOT EXISTS tables (
  id BIGSERIAL PRIMARY KEY,
  number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  qr_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar comentários para documentação
COMMENT ON TABLE tables IS 'Tabela para gerenciar mesas do estabelecimento';
COMMENT ON COLUMN tables.number IS 'Número da mesa (único)';
COMMENT ON COLUMN tables.name IS 'Nome/descrição da mesa';
COMMENT ON COLUMN tables.active IS 'Se a mesa está ativa/disponível';
COMMENT ON COLUMN tables.qr_code IS 'Código QR único da mesa';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tables_number ON tables(number);
CREATE INDEX IF NOT EXISTS idx_tables_active ON tables(active);
CREATE INDEX IF NOT EXISTS idx_tables_qr_code ON tables(qr_code);

-- Adicionar trigger para atualizar updated_at
CREATE TRIGGER update_tables_updated_at 
  BEFORE UPDATE ON tables 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Adicionar foreign key constraint na tabela orders se ela existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    ALTER TABLE orders 
    ADD CONSTRAINT fk_orders_table_id 
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Inserir algumas mesas de exemplo (opcional)
INSERT INTO tables (number, name, qr_code) VALUES 
  (1, 'Mesa 01', 'mesa-1-' || extract(epoch from now())::bigint),
  (2, 'Mesa 02', 'mesa-2-' || extract(epoch from now())::bigint),
  (3, 'Mesa 03', 'mesa-3-' || extract(epoch from now())::bigint),
  (4, 'Mesa 04', 'mesa-4-' || extract(epoch from now())::bigint),
  (5, 'Mesa 05', 'mesa-5-' || extract(epoch from now())::bigint)
ON CONFLICT (number) DO NOTHING;

-- Verificar se a tabela foi criada corretamente
SELECT 'Tabela tables criada com sucesso!' as status;