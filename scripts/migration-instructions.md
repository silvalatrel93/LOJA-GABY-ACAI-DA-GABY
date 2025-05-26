# 🔧 Instruções para Aplicar a Migração do Campo `additionals_limit`

## ❌ Problema Identificado

O erro "Erro ao salvar produto" está ocorrendo porque a coluna `additionals_limit` não existe na tabela `products` do banco de dados.

## ✅ Solução

### Passo 1: Acessar o Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral

### Passo 2: Executar a Migração

Copie e cole o seguinte código SQL no editor e execute:

```sql
-- Migração para adicionar campo de limite de adicionais por produto
-- Data: 2025-01-20
-- Descrição: Adiciona campo additionals_limit na tabela products

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'additionals_limit'
    ) THEN
        -- Adicionar coluna additionals_limit
        ALTER TABLE products 
        ADD COLUMN additionals_limit INTEGER DEFAULT 5 CHECK (additionals_limit >= 0);
        
        -- Adicionar comentário
        COMMENT ON COLUMN products.additionals_limit IS 'Limite máximo de adicionais permitidos para este produto (0 = sem limite)';
        
        -- Atualizar produtos existentes
        UPDATE products 
        SET additionals_limit = 5 
        WHERE additionals_limit IS NULL;
        
        -- Tornar a coluna NOT NULL
        ALTER TABLE products 
        ALTER COLUMN additionals_limit SET NOT NULL;
        
        RAISE NOTICE 'Coluna additionals_limit adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna additionals_limit já existe!';
    END IF;
END $$;
```

### Passo 3: Verificar a Migração

Execute esta query para verificar se a migração foi aplicada corretamente:

```sql
-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'additionals_limit';

-- Verificar alguns produtos
SELECT id, name, additionals_limit 
FROM products 
LIMIT 5;
```

### Passo 4: Testar a Funcionalidade

1. Volte para o painel administrativo
2. Tente criar ou editar um produto
3. Configure o limite de adicionais
4. Salve o produto

## 🎯 O que a Migração Faz

- ✅ Adiciona a coluna `additionals_limit` na tabela `products`
- ✅ Define valor padrão de 5 adicionais
- ✅ Adiciona validação para aceitar apenas valores >= 0
- ✅ Atualiza produtos existentes com o valor padrão
- ✅ Torna a coluna obrigatória (NOT NULL)

## 🔍 Verificação de Problemas

Se ainda houver erros após a migração, verifique:

1. **Console do navegador**: Pressione F12 e veja se há erros JavaScript
2. **Network tab**: Verifique se as requisições estão falhando
3. **Logs do Supabase**: Vá para Logs > API no dashboard do Supabase

## 📞 Suporte

Se o problema persistir, compartilhe:
- Screenshot do erro
- Logs do console do navegador
- Resultado da query de verificação acima 