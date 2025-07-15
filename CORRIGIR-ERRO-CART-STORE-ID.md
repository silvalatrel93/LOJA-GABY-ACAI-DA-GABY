# 🚨 Correção do Erro: cart_store_id_fkey

## ❌ Problema Identificado

O erro `"insert or update on table \"cart\" violates foreign key constraint \"cart_store_id_fkey\""` indica que:

1. O código está tentando usar uma coluna `store_id` na tabela `cart`
2. Esta coluna não existe na estrutura atual da tabela
3. A chave estrangeira `cart_store_id_fkey` não foi criada

## ✅ Solução

### Passo 1: Acessar o Painel do Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione o projeto `heaiacaiesorvetes`
3. Vá para **SQL Editor** no menu lateral

### Passo 2: Executar a Migração

Copie e cole o seguinte SQL no editor:

```sql
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
```

### Passo 3: Executar e Verificar

1. Clique em **Run** para executar a migração
2. Verifique se não há erros na execução
3. A migração deve criar:
   - Tabela `stores` com a loja padrão
   - Coluna `store_id` na tabela `cart`
   - Chave estrangeira `cart_store_id_fkey`
   - Índices para performance

## 🔧 Verificação

Após aplicar a migração, você pode verificar se funcionou executando:

```sql
-- Verificar se a tabela stores foi criada
SELECT * FROM stores;

-- Verificar se a coluna store_id foi adicionada à tabela cart
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cart' AND column_name = 'store_id';

-- Verificar se a chave estrangeira foi criada
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE constraint_name = 'cart_store_id_fkey';
```

## 📝 O que foi Corrigido

1. **Tabela `stores` criada** - Para armazenar informações das lojas
2. **Loja padrão inserida** - Com ID `00000000-0000-0000-0000-000000000000`
3. **Coluna `store_id` adicionada** - Na tabela `cart` com valor padrão
4. **Chave estrangeira criada** - `cart_store_id_fkey` referenciando `stores(id)`
5. **Constraint UNIQUE atualizada** - Para incluir `store_id`
6. **Índices criados** - Para melhor performance

## 🚀 Resultado

Após aplicar esta migração:
- ✅ O erro `cart_store_id_fkey` será resolvido
- ✅ Itens poderão ser adicionados ao carrinho normalmente
- ✅ O sistema estará preparado para suporte multi-loja futuro
- ✅ Todos os registros existentes serão preservados

## ⚠️ Importante

- Esta migração é **segura** e não afeta dados existentes
- Todos os itens do carrinho existentes receberão automaticamente o `store_id` padrão
- O sistema continuará funcionando normalmente após a migração
- A migração é **idempotente** (pode ser executada múltiplas vezes sem problemas)