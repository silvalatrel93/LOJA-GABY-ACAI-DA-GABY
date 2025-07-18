# 🐛 Correção: Bug no ProductList - Produtos de Mesa Não Sendo Filtrados

## ❌ **Problema Identificado**

### **Sintoma:**

- Produtos marcados como "Mesa: Oculto" no admin continuavam aparecendo nas páginas de mesa
- Badge "Mesa: Oculto" aparecia corretamente no admin
- Migração `hidden_from_table` aplicada corretamente

### **Causa Raiz:**

O componente `ProductList` estava **ignorando** os produtos passados como props e sempre fazendo sua própria query interna.

## 🔍 **Análise Técnica**

### **Fluxo Problemático:**

1. **Página de mesa** (`app/mesa/[numero]/page.tsx`):

   - ✅ Chamava `getVisibleProductsForTable()` corretamente
   - ✅ Filtrava produtos com `hidden_from_table = false`
   - ✅ Passava produtos filtrados para `<ProductList products={products} />`

2. **ProductList** (`components/product-list.tsx`):
   - ❌ **IGNORAVA** produtos passados como props
   - ❌ Sempre fazia query própria com `getVisibleProductsWithContext()`
   - ❌ `getVisibleProductsWithContext()` NÃO filtra `hidden_from_table`

### **Resultado:**

Produtos ocultos de mesa apareciam porque o ProductList usava sua própria query sem filtro de mesa.

## ✅ **Solução Implementada**

### **Mudança no ProductList:**

#### **❌ Antes:**

```typescript
// SEMPRE fazia query própria, ignorando props
const allProductsList = await getVisibleProductsWithContext();
setAllProducts(allProductsList);
```

#### **✅ Depois:**

```typescript
// Usa produtos passados como props (ex: página de mesa) SE disponíveis
// Caso contrário, faz query própria (ex: página principal)
if (_initialProducts && _initialProducts.length > 0) {
  setAllProducts(_initialProducts); // ← Usa produtos da página de mesa
} else {
  const allProductsList = await getVisibleProductsWithContext();
  setAllProducts(allProductsList); // ← Usa query própria para página principal
}
```

### **Benefícios:**

1. **Página principal:** Continua funcionando igual (usa query própria)
2. **Página de mesa:** Agora respeita os produtos filtrados passados como props
3. **Flexibilidade:** Suporta ambos os casos de uso

## 🎯 **Comparação de Comportamento**

### **Página Principal (`/`):**

- Usa `getActiveProductsWithContext()`
- Filtra: `active = true` (não filtra `hidden` nem `hidden_from_table`)
- ProductList faz query própria com `getVisibleProductsWithContext()`
- Resultado: Produtos ativos e não ocultos geralmente

### **Página de Mesa (`/mesa/1`):**

- Usa `getVisibleProductsForTable()`
- Filtra: `active = true` AND `hidden = false` AND `hidden_from_table = false`
- ProductList agora USA os produtos passados
- Resultado: Produtos visíveis em mesa (filtro correto!)

## 🧪 **Como Testar a Correção**

### **1. Ocultar Produto de Mesa:**

1. Acesse `/admin`
2. Clique no ícone de grupo (usuários) de um produto
3. Verifique que fica laranja e aparece badge "Mesa: Oculto"

### **2. Verificar Página de Mesa:**

1. Acesse `/mesa/1`
2. **Produto oculto NÃO deve aparecer** ✅
3. Produtos normais continuam visíveis ✅

### **3. Verificar Página Principal:**

1. Acesse `/`
2. **Produto oculto de mesa DEVE aparecer** ✅
3. (Apenas ocultos gerais não aparecem)

## 📋 **Arquivos Modificados**

### **`components/product-list.tsx`:**

- **Linha ~160:** Condição para usar produtos passados como props
- **Dependência:** Adicionado `[_initialProducts]` no useEffect
- **Novo useEffect:** Atualiza produtos quando props mudam

### **Commits Relacionados:**

- ✅ `getVisibleProductsForTable()` implementado
- ✅ Página de mesa usando função correta
- ✅ **ProductList respeitando props** ← **ESTE COMMIT**

## 💡 **Lições Aprendidas**

### **1. Props vs Query Interna:**

Componentes que recebem dados via props devem priorizar esses dados sobre queries internas.

### **2. Contexto Específico:**

Páginas com filtros específicos (mesa) devem passar dados pré-filtrados, não confiar em queries genéricas.

### **3. Debug de Fluxo:**

Importante acompanhar o fluxo completo: Página → Service → Component → Renderização.

## 🎉 **Resultado Final**

### **✅ Funcionamento Correto:**

- **Admin:** Controle independente de visibilidade (geral + mesa)
- **Página principal:** Mostra produtos não ocultos geralmente
- **Página de mesa:** Mostra apenas produtos visíveis em mesa
- **Performance:** Sem queries desnecessárias

### **✅ Compatibilidade:**

- Página principal não afetada
- Páginas de mesa funcionam corretamente
- Sistema de props flexível para futuros casos

---

**Data:** 2025-01-18  
**Status:** ✅ Resolvido  
**Impacto:** Filtro de produtos de mesa funcionando 100%  
**Arquivo Principal:** `components/product-list.tsx`
