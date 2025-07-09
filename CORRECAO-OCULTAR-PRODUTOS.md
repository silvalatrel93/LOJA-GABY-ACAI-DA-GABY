# 🛠️ Correção da Funcionalidade de Ocultar Produtos

## 🎯 Problema Identificado

A funcionalidade de ocultar produtos não está funcionando porque a coluna `hidden` não existe na tabela `products` do banco de dados.

## 🔍 Diagnóstico

1. **Frontend**: O código está correto - usa `getVisibleProducts()` que filtra produtos com `hidden = false`
2. **Backend**: O `ProductService` tem todos os métodos necessários
3. **Banco de Dados**: Falta a coluna `hidden` na tabela `products`

## ✅ Solução

### Passo 1: Aplicar a Migração no Supabase

No **Console do Supabase** (SQL Editor), execute este comando:

```sql
-- Adiciona a coluna hidden à tabela products se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'hidden'
    ) THEN
        ALTER TABLE products ADD COLUMN hidden BOOLEAN DEFAULT FALSE;
        UPDATE products SET hidden = FALSE WHERE hidden IS NULL;
        RAISE NOTICE 'Coluna hidden adicionada com sucesso à tabela products';
    ELSE
        RAISE NOTICE 'Coluna hidden já existe na tabela products';
    END IF;
END $$;
```

### Passo 2: Verificar se a Migração foi Aplicada

Execute este comando para verificar:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'hidden';
```

Deve retornar:

```
column_name | data_type | is_nullable | column_default
hidden      | boolean   | YES         | false
```

### Passo 3: Testar a Funcionalidade

Após aplicar a migração:

1. **No Admin**: Acesse `/admin` e use o botão de olho/olho cortado nos produtos
2. **No Frontend**: Os produtos marcados como "ocultos" não aparecerão na listagem do cliente
3. **Verificação**: O badge "Oculto" aparecerá nos produtos ocultos na área admin

## 🔧 Arquivos Já Corrigidos

✅ **components/product-list.tsx**: Agora usa `getVisibleProducts()`
✅ **lib/services/product-service.ts**: Método `getVisibleProducts()` implementado
✅ **components/admin/product-visibility-toggle.tsx**: Botão de toggle implementado
✅ **app/admin/page.tsx**: Interface admin com controle de visibilidade

## 📋 Funcionalidades Implementadas

### Para Administradores:

- ✅ Botão de toggle (olho/olho cortado) em cada produto
- ✅ Badge "Oculto" nos produtos ocultados
- ✅ Checkbox "Produto visível para clientes" no modal de edição

### Para Clientes:

- ✅ Produtos ocultos não aparecem na listagem
- ✅ Apenas produtos ativos E visíveis são exibidos

## 🚀 Como Funciona

### 1. Filtro de Produtos Visíveis

```typescript
// Busca apenas produtos ativos E não ocultos
async getVisibleProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .eq("active", true)
    .eq("hidden", false)  // <-- Nova condição
    .order("name")
}
```

### 2. Toggle de Visibilidade

```typescript
// Alterna entre hidden = true/false
async toggleProductVisibility(id: number): Promise<boolean> {
  const newHiddenValue = !currentProduct.hidden
  await supabase
    .from("products")
    .update({ hidden: newHiddenValue })
    .eq("id", id)
}
```

## ⚡ Após Aplicar a Migração

A funcionalidade estará **100% operacional**:

1. **Ocultar produto**: Clique no ícone do olho → produto some da visualização do cliente
2. **Mostrar produto**: Clique no ícone do olho cortado → produto volta a aparecer
3. **Status visual**: Badge "Oculto" indica produtos não visíveis aos clientes

## 🧪 Como Testar a Funcionalidade

### Teste Automatizado

Execute este script no **console do navegador** (F12) na página `/admin`:

```javascript
// Copie e cole este código no console
fetch("/scripts/test-hidden-products.js")
  .then((response) => response.text())
  .then((script) => eval(script));
```

Ou acesse: `scripts/test-hidden-products.js` e execute no console.

### Teste Manual

1. **Acesse `/admin`** - Veja a lista de produtos
2. **Clique no ícone do olho** ao lado de um produto
3. **Verifique**: O produto deve mostrar badge "Oculto"
4. **Acesse a página do cliente** - O produto não deve aparecer
5. **Volte ao admin** e clique no olho cortado
6. **Verifique**: O produto volta a aparecer para clientes

## 🎯 Resultado Final

- ✅ Produtos podem ser ocultados/mostrados individualmente
- ✅ Interface intuitiva com ícones visuais
- ✅ Atualização em tempo real
- ✅ Compatível com sistema de categorias
- ✅ Não interfere com status "ativo/inativo"
- ✅ Script de teste automatizado disponível
