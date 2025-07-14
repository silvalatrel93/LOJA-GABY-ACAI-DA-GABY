# Guia de Implementação - Preços Diferenciados para Mesa

## Resumo
Este sistema permite configurar preços específicos para produtos consumidos na mesa, diferentes dos preços de delivery.

## Arquivos Modificados

### 1. Migração do Banco de Dados
- **Arquivo**: `migrations/add_table_pricing.sql`
- **Arquivo SQL**: `EXECUTAR-MIGRACAO-TABLE-PRICING.sql`
- **Descrição**: Adiciona coluna `table_sizes` do tipo JSONB à tabela `products`

### 2. Tipos TypeScript
- **Arquivo**: `lib/types.ts`
- **Modificação**: Adicionado campo opcional `tableSizes?: ProductSize[]` à interface `Product`

### 3. Serviço de Produtos
- **Arquivo**: `lib/services/product-service.ts`
- **Modificações**:
  - Todas as consultas incluem o campo `table_sizes`
  - Mapeamento de dados inclui `tableSizes`
  - Funções de salvamento incluem `table_sizes`

### 4. Página da Mesa
- **Arquivo**: `app/mesa/[numero]/page.tsx`
- **Modificação**: Aplica preços da mesa quando disponíveis, substituindo os preços padrão

### 5. Componente de Administração
- **Arquivo**: `components/admin/table-pricing-manager.tsx`
- **Descrição**: Interface para gerenciar preços específicos da mesa

## Como Usar

### 1. Executar a Migração
```sql
-- Execute no painel do Supabase
ALTER TABLE products ADD COLUMN IF NOT EXISTS table_sizes JSONB;
```

### 2. Configurar Preços da Mesa
1. Acesse o painel administrativo
2. Edite um produto
3. Use o componente `TablePricingManager` para configurar preços específicos
4. Salve as alterações

### 3. Funcionamento Automático
- **Mesa**: Se `tableSizes` estiver configurado, usa esses preços
- **Mesa**: Se `tableSizes` estiver vazio/null, usa preços padrão (`sizes`)
- **Delivery**: Sempre usa preços padrão (`sizes`)

## Estrutura de Dados

### Coluna `table_sizes`
```json
[
  {"name": "Pequeno", "price": 15.00},
  {"name": "Médio", "price": 18.00},
  {"name": "Grande", "price": 22.00}
]
```

### Interface TypeScript
```typescript
interface Product {
  // ... outros campos
  sizes: ProductSize[]        // Preços padrão (delivery)
  tableSizes?: ProductSize[]  // Preços específicos da mesa (opcional)
}
```

## Lógica de Aplicação

### Na Página da Mesa
```typescript
productsData = productsData.map(product => {
  if (product.tableSizes && product.tableSizes.length > 0) {
    return {
      ...product,
      sizes: product.tableSizes  // Substitui preços padrão pelos da mesa
    }
  }
  return product  // Mantém preços padrão
})
```

## Vantagens

1. **Flexibilidade**: Cada produto pode ter preços diferentes para mesa
2. **Opcional**: Se não configurado, usa preços padrão
3. **Compatibilidade**: Não afeta o sistema de delivery existente
4. **Fácil Gestão**: Interface administrativa dedicada

## Próximos Passos

1. **Executar a migração** no banco de dados
2. **Integrar o componente** `TablePricingManager` na página de edição de produtos
3. **Testar** o funcionamento na página da mesa
4. **Configurar preços** específicos para os produtos desejados

## Exemplo de Uso

### Produto: Açaí 500ml
- **Delivery**: R$ 18,00
- **Mesa**: R$ 15,00 (sem taxa de entrega)

### Configuração
```json
{
  "sizes": [{"name": "500ml", "price": 18.00}],
  "tableSizes": [{"name": "500ml", "price": 15.00}]
}
```

### Resultado
- **Página de delivery**: Mostra R$ 18,00
- **Página da mesa**: Mostra R$ 15,00