# 🎯 Guia de Teste - COMBO 2 COPOS (Compre 1 Leve 2)

## ✨ **Funcionalidade Implementada**

A promoção "COMBO 2 COPOS" permite que o cliente compre 1 copo e leve outro GRÁTIS. O cliente pode escolher tamanho e adicionais para cada copo separadamente.

## 🚀 **Como Testar:**

### **1. Criar o Produto (Execute o SQL)**

```sql
-- Execute o arquivo TESTE-COMBO-2-COPOS.sql no seu banco Supabase
-- Isso criará a categoria "PROMOÇÃO DIA" e o produto "COMBO 2 COPOS"
```

### **2. Acesse o Frontend**

- Abra `http://localhost:3000` no navegador
- Procure pela categoria "PROMOÇÃO DIA"
- Clique no produto "COMBO 2 COPOS"

### **3. Teste o Fluxo Completo**

#### **Passo 1: Configure o 1º Copo (PAGO)**

- ✅ **Indicador Visual**: Deve aparecer "🎉 Compre 1 Leve 2!"
- ✅ **Status**: "Configurando 1º Copo" com círculo roxo no número 1
- ✅ **Tamanho**: Escolha 300ml ou 500ml
- ✅ **Adicionais**: Adicione os complementos desejados
- ✅ **Colher**: Selecione se precisa de colher
- ✅ **Botão**: "Adicionar 1º Copo • R$ [valor]"

#### **Passo 2: Configure o 2º Copo (GRÁTIS)**

Após clicar no botão do 1º copo:

- ✅ **Status Muda**: "Configurando 2º Copo (GRÁTIS)" com círculo roxo no número 2
- ✅ **Resumo do 1º**: Aparece resumo do primeiro copo escolhido
- ✅ **Tamanho**: Escolha qualquer tamanho (independente do primeiro)
- ✅ **Adicionais**: Adicione complementos (só paga os adicionais)
- ✅ **Botão**: "Adicionar 2º Copo GRÁTIS • R$ [apenas adicionais]"

#### **Passo 3: Verificar no Carrinho**

Após adicionar o 2º copo:

- ✅ **2 Itens no Carrinho**: "COMBO 2 COPOS - 1º Copo" e "COMBO 2 COPOS - 2º Copo (GRÁTIS)"
- ✅ **Preço Correto**: 1º copo com valor normal, 2º copo com R$ 0,00
- ✅ **Adicionais**: Cada copo com seus respectivos adicionais
- ✅ **Modal Fechado**: Automaticamente fecha após o 2º copo

## 🎨 **Visual Esperado:**

### **Durante a Configuração:**

```
┌─────────────────────────────────────────┐
│ 🎉 Compre 1 Leve 2!                    │
│ ● ○ Configurando 1º Copo               │
│                                         │
│ Escolha o tamanho:                      │
│ ○ 300ml - R$ 48,00                     │
│ ● 500ml - R$ 68,00                     │
│                                         │
│ [Adicionais...]                         │
│                                         │
│ [Adicionar 1º Copo • R$ 68,00]         │
└─────────────────────────────────────────┘
```

### **No Carrinho Final:**

```
Carrinho (2 itens):
├── COMBO 2 COPOS - 1º Copo
│   └── 500ml - R$ 68,00
│   └── + Morango - R$ 4,50
│
└── COMBO 2 COPOS - 2º Copo (GRÁTIS)
    └── 300ml - R$ 0,00
    └── + Banana - R$ 3,00

Total: R$ 75,50
```

## ✅ **Checklist de Validação:**

- [ ] **Detecção**: Sistema detecta produto "COMBO 2 COPOS" automaticamente
- [ ] **Interface**: Aparece indicador visual da promoção
- [ ] **Fluxo em 2 Etapas**: Primeiro copo → segundo copo
- [ ] **Preço Correto**: 1º copo pago, 2º copo grátis (R$ 0,00)
- [ ] **Tamanhos Independentes**: Cada copo pode ter tamanho diferente
- [ ] **Adicionais Independentes**: Cada copo pode ter adicionais diferentes
- [ ] **Reset do Combo**: Após completar, permite nova compra do combo
- [ ] **Carrinho**: Dois itens separados aparecem corretamente

## 🎉 **Funcionalidades Especiais:**

- ✅ **Tamanhos Independentes**: 1º copo 500ml, 2º copo 300ml
- ✅ **Adicionais Separados**: Cada copo tem seus próprios complementos
- ✅ **Preço Justo**: Cliente só paga adicionais do 2º copo
- ✅ **Interface Intuitiva**: Fluxo guiado passo a passo
- ✅ **Reset Automático**: Permite comprar múltiplos combos

## 🔧 **Para Desenvolvedores:**

### **Estados Controlados:**

- `isCombo2Copos`: Detecta se é o produto especial
- `currentCupStep`: "first" ou "second"
- `firstCupAdded`: Controla se primeiro copo foi adicionado
- `firstCupSize` + `firstCupAdditionals`: Dados do primeiro copo

### **Lógica Principal:**

```typescript
// No handleAddToCart()
if (isCombo2Copos) {
  if (currentCupStep === "first") {
    // Adiciona 1º copo (pago) e vai para step "second"
  } else if (currentCupStep === "second") {
    // Adiciona 2º copo (grátis) e reseta o combo
  }
}
```
