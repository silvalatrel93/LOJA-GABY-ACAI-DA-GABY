-- Migração para adicionar suporte multi-loja à tabela cart
-- Data: 2025-01-20
-- Descrição: Cria tabela stores e adiciona coluna store_id à tabela cart

-- Criar tabela stores se não existir
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir loja padrão se não existir
INSERT INTO stores (id, name, is_active) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Loja Principal', true)
ON CONFLICT (id) DO NOTHING;

-- Adicionar coluna store_id à tabela cart
ALTER TABLE cart 
ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT '00000000-0000-0000-0000-000000000000';

-- Atualizar registros existentes com o store_id padrão
UPDATE cart 
SET store_id = '00000000-0000-0000-0000-000000000000' 
WHERE store_id IS NULL;

-- Tornar a coluna NOT NULL após definir valores padrão
ALTER TABLE cart 
ALTER COLUMN store_id SET NOT NULL;

-- Adicionar chave estrangeira
ALTER TABLE cart 
ADD CONSTRAINT cart_store_id_fkey 
FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_cart_store_id ON cart(store_id);

-- Atualizar a constraint UNIQUE para incluir store_id
ALTER TABLE cart DROP CONSTRAINT IF EXISTS cart_session_id_product_id_size_key;
ALTER TABLE cart ADD CONSTRAINT cart_session_id_product_id_size_store_id_key 
UNIQUE(session_id, product_id, size, store_id);

-- Comentários para documentação
COMMENT ON TABLE stores IS 'Tabela de lojas para suporte multi-loja';
COMMENT ON COLUMN cart.store_id IS 'ID da loja à qual o item do carrinho pertence';

-- Atualizar schema cache do PostgREST
NOTIFY pgrst, 'reload schema';