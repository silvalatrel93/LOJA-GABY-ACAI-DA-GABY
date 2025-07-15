# 🔍 Diagnóstico: Bug de Preços no Sistema de Mesa

## 📋 Descrição do Problema

Ao selecionar um produto base no sistema de mesa, o botão está mostrando um valor diferente do esperado. Este guia irá ajudar a identificar e corrigir o problema.

## 🎯 Possíveis Causas

### 1. **Preços de Mesa não Configurados**

- Os produtos não têm preços específicos para mesa configurados
- Sistema está usando preços de delivery em vez de preços de mesa

### 2. **Cache de Dados**

- Componentes React estão usando dados cached/antigos
- LocalStorage ou estado do componente não foi atualizado

### 3. **Erro na Lógica de Aplicação**

- Preços de mesa não estão sendo aplicados corretamente
- `selectedSizeInfo` está pegando dados errados

### 4. **Problemas de Estado do Componente**

- `useAdditionalsLogic` ou contextos estão interferindo
- Estado do produto não está sincronizado

### 5. **⚠️ NaN em Cálculos (CORRIGIDO)**

- Adicionais com preços `null`, `undefined` ou inválidos
- Problema na função `calculateAdditionalsTotal`
- **STATUS**: ✅ Corrigido com validações robustas

## 🔧 Etapas de Diagnóstico

### **Etapa 1: Executar Diagnóstico Automático**

1. Acesse uma página de mesa (ex: `/mesa/1`)
2. Abra o console do navegador (F12)
3. Cole e execute este script:

```javascript
// Cole este código no console
const script = document.createElement("script");
script.src = "./debug-mesa-precos.js";
document.head.appendChild(script);
```

**O que verificar nos logs:**

- ✅ Produtos COM preços de mesa configurados
- ❌ Produtos SEM preços de mesa configurados
- 🔄 Se preços de mesa foram aplicados corretamente

### **Etapa 2: Verificar Configuração no Admin**

1. Acesse `/admin`
2. Clique para editar qualquer produto
3. Role até a seção **"Preços para Mesa"**
4. Verificar se há preços configurados:

**Se VAZIO:**

- ✅ **PROBLEMA IDENTIFICADO:** Produtos sem preços de mesa
- 📝 **SOLUÇÃO:** Configure preços de mesa (ver Etapa 4)

**Se PREENCHIDO:**

- 🔄 Continue para Etapa 3

### **Etapa 3: Testar Produto Específico**

No console da página de mesa, execute:

```javascript
// Testar um produto específico (substitua pelo nome real)
testProductPricing("Açaí 500ml");

// Comparar todos os preços
compareExpectedVsActualPrices();
```

**Resultados esperados:**

- ✅ Preço no modal = Preço de mesa configurado
- ❌ Preço no modal = Preço de delivery → **PROBLEMA CONFIRMADO**

### **Etapa 4: Configurar Preços de Mesa**

1. No admin, edite um produto
2. Na seção "Preços para Mesa":
   - Clique **"Adicionar"**
   - Configure o mesmo tamanho do delivery
   - Defina um preço menor (ex: 15% desconto)
   - Clique **"Salvar"**

**Exemplo:**

```
Delivery: 500ml = R$ 18,00
Mesa: 500ml = R$ 15,30 (15% desconto)
```

### **Etapa 5: Forçar Atualização**

1. Na página de mesa, clique no botão de atualização (⟲)
2. Ou use Ctrl+Shift+R para recarregar completamente
3. Teste novamente o produto configurado

## 🚨 Problemas Comuns e Soluções

### **Problema A: Migração não Executada**

**Sintomas:** Erro "column table_sizes does not exist"

**Solução:**

```sql
-- Execute no painel do Supabase
ALTER TABLE products ADD COLUMN IF NOT EXISTS table_sizes JSONB;
```

### **Problema B: Cache do Navegador**

**Sintomas:** Preços não mudam mesmo após configuração

**Soluções:**

1. Usar botão de atualização na página de mesa
2. Limpar cache: Ctrl+Shift+R
3. Limpar localStorage: `localStorage.clear()`

### **Problema C: Estado React Desatualizado**

**Sintomas:** Componente não reflete mudanças do banco

**Solução Temporária:**

```javascript
// No console, forçar recarregamento do estado
window.location.reload();
```

### **Problema D: Preços Iguais**

**Sintomas:** Preços de mesa = preços de delivery

**Verificação:**

- Confirme se configurou preços DIFERENTES no admin
- Verifique se não copiou os mesmos valores

## 🎯 Teste de Validação Final

Após aplicar as correções:

1. **Configure** preços de mesa para 1 produto
2. **Acesse** `/mesa/1`
3. **Abra** o produto configurado
4. **Verifique** se o botão mostra o preço de mesa
5. **Compare** com a página principal (delivery)

**Resultado Esperado:**

- 🍽️ **Mesa:** R$ 15,30
- 📦 **Delivery:** R$ 18,00
- ✅ **Diferença visível**

## 📊 Debug Avançado

### **Interceptar selectedSizeInfo**

```javascript
// Adicionar logs ao componente ProductCard
const originalLog = console.log;
console.log = function (...args) {
  if (
    args.some(
      (arg) =>
        typeof arg === "string" &&
        (arg.includes("selectedSizeInfo") || arg.includes("calculateTotal"))
    )
  ) {
    console.warn("🎯 INTERCEPTED:", ...args);
  }
  originalLog.apply(console, args);
};
```

### **Verificar Contexto de Mesa**

```javascript
// Verificar se está em contexto de mesa
console.log("Mesa localStorage:", localStorage.getItem("mesa_atual"));
console.log("Pathname:", window.location.pathname);
console.log("Context:", window.location.pathname.includes("/mesa/"));
```

## 🔄 Fluxo de Dados Correto

```
1. Banco: product.table_sizes (JSONB)
    ↓
2. API: ProductService.getActiveProducts()
    ↓
3. Mesa Page: aplica tableSizes → sizes
    ↓
4. ProductCard: product.sizes[0] → selectedSizeInfo
    ↓
5. Button: calculateTotal() → formatCurrency()
```

## ⚠️ Checklist Pré-Implementação

- [ ] Migração executada (`table_sizes` existe)
- [ ] Pelo menos 1 produto com preços de mesa configurados
- [ ] Preços de mesa DIFERENTES dos preços de delivery
- [ ] Cache do navegador limpo
- [ ] Página de mesa acessada corretamente

---

## ✅ Correções Aplicadas

### **Correção do NaN nos Adicionais**

**Problema:** Botão exibindo "R$ NaN" ao adicionar adicionais.

**Causa:** Adicionais com preços `null`, `undefined` ou valores inválidos causavam `NaN` nos cálculos.

**Solução implementada:**

- Adicionada validação robusta em `calculateAdditionalsTotal()`
- Conversão segura de valores com `Number()` e fallback para `0`
- Logs de warning para identificar adicionais problemáticos
- Validação em ambos os hooks: `use-additionals-logic.ts` e `use-product-additionals.ts`

**Arquivos modificados:**

- `lib/hooks/use-additionals-logic.ts`
- `lib/hooks/use-product-additionals.ts`
- `components/product-card.tsx`

**💡 Dica:** Se o problema persistir após todas as etapas, pode ser necessário verificar se há múltiplas instâncias do componente ProductCard ou problemas de re-renderização React.
