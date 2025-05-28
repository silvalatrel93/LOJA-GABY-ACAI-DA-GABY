# Espaçamento Adicional na Etiqueta - Entre Adicionais e Subtotal

## ✅ Implementação Realizada:

### **Problema:**
Não havia espaçamento suficiente entre o último adicional e a seção de subtotal, causando layout congestionado.

### **Solução:**
Adicionado espaçamento de **1 linha** entre os itens do pedido (incluindo adicionais) e a seção de totais.

## 🔧 Alterações Implementadas:

### **1. HTML/CSS da Visualização:**
```tsx
{/* Espaçamento adicional de 1 linha após todos os itens */}
<div className="items-spacing"></div>
```

### **2. CSS para Impressão Térmica:**
```css
.items-spacing {
  margin-bottom: 4mm;
}
```

### **3. PDF (jsPDF):**
```javascript
// Espaçamento adicional de 1 linha após todos os itens (equivalente ao HTML)
yPos += 5
```

## 📊 Resultado Visual:

### **Antes:**
```
- 2x Leite Condensado          R$  3,00
Subtotal:                      R$ 35,98
Taxa de entrega:               R$  0,00
TOTAL:                         R$ 35,98
```

### **Depois:**
```
- 2x Leite Condensado          R$  3,00

Subtotal:                      R$ 35,98
Taxa de entrega:               R$  0,00
TOTAL:                         R$ 35,98
```

## 🎯 Benefícios:

1. **Layout Organizado** - Separação visual clara entre seções
2. **Melhor Legibilidade** - Easier de identificar onde terminam os itens
3. **Profissionalismo** - Aparência mais limpa e profissional
4. **Consistência** - Mesmo espaçamento na tela, impressão e PDF

## 🔍 Como Testar:

### **1. Visualização:**
1. Ir em `/admin/pedidos`
2. Clicar "Imprimir Etiqueta" em qualquer pedido com adicionais
3. Verificar espaçamento na prévia

### **2. Impressão:**
1. Imprimir na MP-4200 TH
2. Confirmar espaçamento visual entre adicionais e subtotal

### **3. PDF:**
1. Gerar PDF da etiqueta
2. Verificar mesmo espaçamento no arquivo gerado

## 📏 Especificações Técnicas:

- **Visualização Web**: `margin-bottom: 12px` (equivalente a 1 linha)
- **Impressão Térmica**: `margin-bottom: 4mm` (otimizado para 80mm)
- **PDF**: `yPos += 5` (5 pontos = aproximadamente 1 linha)

---

**Status**: ✅ **IMPLEMENTADO** - Espaçamento de 1 linha entre adicionais e subtotal 