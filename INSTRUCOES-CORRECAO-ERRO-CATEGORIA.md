# Correção do Erro "duplicate key value violates unique constraint"

## Problema Identificado
O código está tentando usar uma coluna `store_id` na tabela `categories` que não existe no banco de dados, causando o erro de chave duplicada.

## Solução
Execute o seguinte SQL no painel do Supabase (SQL Editor):

```sql
-- Adicionar coluna store_id na tabela categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'default-store';

-- Atualizar categorias existentes com o store_id padrão
UPDATE categories 
SET store_id = 'default-store' 
WHERE store_id IS NULL;

-- Tornar a coluna NOT NULL após definir valores padrão
ALTER TABLE categories 
ALTER COLUMN store_id SET NOT NULL;

-- Criar índice para melhor performance nas consultas por loja
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);

-- Criar constraint única para nome + store_id (evitar categorias duplicadas por loja)
ALTER TABLE categories 
ADD CONSTRAINT IF NOT EXISTS categories_name_store_id_unique 
UNIQUE (name, store_id);
```

## Como Aplicar
1. Acesse o painel do Supabase
2. Vá para "SQL Editor"
3. Cole o código SQL acima
4. Execute o script
5. Reinicie a aplicação

## Arquivos Corrigidos
- ✅ `category-service.ts` - Substituído `.single()` por `.maybeSingle()`
- ✅ `additional-category-service.ts` - Substituído `.single()` por `.maybeSingle()`
- ✅ `page-content-service.ts` - Substituído `.single()` por `.maybeSingle()`
- ✅ `.env.local` - Removida vírgula inválida
- ✅ `lib/supabase-schema.sql` - Adicionada coluna `store_id`
- ✅ Criada migração: `supabase/migrations/20250120000002_add_store_id_to_categories.sql`

## Resultado Esperado
Após aplicar a migração, o erro de chave duplicada será resolvido e as categorias funcionarão corretamente.