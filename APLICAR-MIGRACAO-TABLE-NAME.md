# 🚀 Aplicar Migração - Coluna table_name

## ❌ Problema Identificado

O erro "Could not find the 'table_name' column of 'orders' in the schema cache" indica que a migração para adicionar a coluna `table_name` à tabela `orders` ainda não foi aplicada no banco de dados.

## ✅ Solução

### Passo 1: Acessar o Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor**

### Passo 2: Executar a Migração

Copie e cole o seguinte SQL no editor:

```sql
-- Migração para adicionar coluna table_name à tabela orders
-- Esta coluna armazenará o nome da mesa para facilitar a exibição nas etiquetas

-- Adicionar coluna table_name
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS table_name TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN orders.table_name IS 'Nome da mesa para pedidos presenciais (copiado da tabela tables)';

-- Criar índice para melhor performance nas consultas por nome da mesa
CREATE INDEX IF NOT EXISTS idx_orders_table_name ON orders(table_name);

-- Atualizar o cache do schema
NOTIFY pgrst, 'reload schema';
```

### Passo 3: Executar

1. Clique em **Run** para executar a migração
2. Aguarde a confirmação de sucesso
3. A aplicação deve funcionar normalmente após isso

## 🔧 Verificação

Após aplicar a migração, você pode verificar se funcionou executando:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'table_name';
```

## 📝 Nota

Esta migração é necessária para que os pedidos de mesa possam armazenar o nome da mesa diretamente, facilitando a exibição nas etiquetas de impressão sem necessidade de fazer JOIN com a tabela `tables`.