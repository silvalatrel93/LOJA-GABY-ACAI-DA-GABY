# Guia de Visibilidade de Produtos no Delivery

## Visão Geral

Este sistema permite controlar quais produtos são exibidos especificamente no sistema de delivery, independentemente da visibilidade geral do produto ou da visibilidade no sistema de mesa.

## Estrutura do Sistema

### Nova Coluna no Banco de Dados
- **Coluna**: `hidden_from_delivery` (boolean)
- **Valor padrão**: `false`
- **Localização**: Tabela `products`
- **Propósito**: Controlar visibilidade específica para o sistema de delivery

### Hierarquia de Visibilidade

Para um produto aparecer no delivery, ele deve atender a TODOS os critérios:
1. `active = true` (produto ativo)
2. `hidden = false` (não oculto globalmente)
3. `hidden_from_delivery = false` (não oculto especificamente do delivery)

## Arquivos Criados/Modificados

### 1. Migração do Banco de Dados
**Arquivo**: `migrations/add_hidden_from_delivery_column.sql`
```sql
-- Adicionar coluna hidden_from_delivery à tabela products
ALTER TABLE products 
ADD COLUMN hidden_from_delivery BOOLEAN DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN products.hidden_from_delivery IS 'Indica se o produto deve ser ocultado especificamente no sistema de delivery';
```

### 2. Componente de Toggle para Admin
**Arquivo**: `components/admin/delivery-visibility-toggle.tsx`
- Permite alternar visibilidade do produto no delivery
- Interface visual com ícones Eye/EyeOff
- Estados de loading e feedback visual
- Integração com Supabase para atualizações em tempo real

### 3. Atualização do Serviço de Produtos
**Arquivo**: `lib/services/product-service.ts`

#### Novas Funções:
- `getVisibleProductsForDelivery()`: Busca produtos visíveis no delivery
- `toggleDeliveryVisibility(productId)`: Alterna visibilidade no delivery

#### Atualizações:
- Todas as funções de busca agora incluem `hidden_from_delivery`
- Mapeamento de dados atualizado para incluir `hiddenFromDelivery`
- Fallback para compatibilidade com bancos sem a nova coluna

### 4. Atualização de Tipos
**Arquivo**: `lib/types.ts`
```typescript
export interface Product {
  // ... outras propriedades
  hiddenFromDelivery?: boolean // Nova propriedade
}
```

### 5. Atualização da Página Principal
**Arquivo**: `app/page.tsx`
- Alterado de `getActiveProductsWithContext()` para `getVisibleProductsForDelivery()`
- Agora filtra produtos especificamente para o delivery

## Como Usar

### 1. Aplicar a Migração
```sql
-- Execute no Supabase SQL Editor
ALTER TABLE products 
ADD COLUMN hidden_from_delivery BOOLEAN DEFAULT false;

COMMENT ON COLUMN products.hidden_from_delivery IS 'Indica se o produto deve ser ocultado especificamente no sistema de delivery';
```

### 2. Usar o Componente de Toggle no Admin
```tsx
import { DeliveryVisibilityToggle } from '@/components/admin/delivery-visibility-toggle'

// No painel administrativo
<DeliveryVisibilityToggle
  productId={product.id}
  isHidden={product.hiddenFromDelivery || false}
  onToggle={(productId, newHiddenState) => {
    // Lógica para atualizar o estado local
  }}
/>
```

### 3. Buscar Produtos para Delivery
```typescript
import { getVisibleProductsForDelivery } from '@/lib/services/product-service'

// Buscar produtos visíveis no delivery
const deliveryProducts = await getVisibleProductsForDelivery()
```

### 4. Alternar Visibilidade Programaticamente
```typescript
import { toggleDeliveryVisibility } from '@/lib/services/product-service'

// Alternar visibilidade de um produto no delivery
const success = await toggleDeliveryVisibility(productId)
```

## Diferenças entre Sistemas

| Sistema | Função de Busca | Filtros Aplicados |
|---------|----------------|-------------------|
| **Delivery** | `getVisibleProductsForDelivery()` | `active=true`, `hidden=false`, `hidden_from_delivery=false` |
| **Mesa** | `getVisibleProductsForTable()` | `active=true`, `hidden=false`, `hidden_from_table=false` |
| **Geral** | `getVisibleProducts()` | `active=true`, `hidden=false` |

## Compatibilidade

- **Fallback automático**: Se a coluna `hidden_from_delivery` não existir, o sistema usa apenas os filtros `active=true` e `hidden=false`
- **Retrocompatibilidade**: Produtos existentes terão `hidden_from_delivery=false` por padrão
- **Logs informativos**: Avisos no console quando a migração ainda não foi aplicada

## Verificação

Para verificar se o sistema está funcionando:

1. **Verificar coluna no banco**:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name LIKE '%hidden%';
```

2. **Testar busca de produtos**:
```typescript
const products = await getVisibleProductsForDelivery()
console.log('Produtos visíveis no delivery:', products.length)
```

3. **Verificar toggle de visibilidade**:
- Acessar painel administrativo
- Localizar produto
- Usar o toggle "Delivery: Visível/Oculto"
- Verificar se o produto aparece/desaparece na página principal

## Logs e Debugging

O sistema inclui logs detalhados:
- Erros de busca de produtos
- Avisos sobre colunas inexistentes
- Confirmações de alterações de visibilidade
- Fallbacks automáticos

Todos os logs são prefixados com contexto específico para facilitar o debugging.