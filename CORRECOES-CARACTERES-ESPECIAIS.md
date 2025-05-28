# Correções de Caracteres Especiais na Impressão

## ❌ Problemas Reportados:

1. **Bullet point (•)** aparecia com acento/símbolo errado na impressão
2. **Letra ê** em "preferência" causava bug na impressão

## ✅ Correções Implementadas:

### **1. Bullet Point Corrigido:**
```
Antes: • 1x Banana               (aparecia com acento)
Depois: - 1x Banana              (hífen simples e limpo)
```

### **2. Palavra "Preferência" Corrigida:**
```
Antes: "Obrigado pela preferência!"  (ê causava bug)
Depois: "Obrigado pela preferencia!" (sem acento)
```

### **3. Normalização Expandida:**
Adicionei na função `normalizeForThermalPrint`:
```typescript
// Substituir bullet points e símbolos especiais
.replace(/[•·‧∙]/g, '-') // Bullet points viram hífen
.replace(/[★☆]/g, '*') // Estrelas viram asterisco
```

## 📊 Resultado Antes vs Depois:

### **Adicionais:**
| Antes | Depois |
|-------|--------|
| `• 1x Banana` (com acento estranho) | `- 1x Banana                       R$ 1,00` |
| `• 2x Leite Condensado` (símbolos) | `- 2x Leite Condensado             R$ 3,00` |

### **Rodapé:**
| Antes | Depois |
|-------|--------|
| `Obrigado pela preferência!` (bug no ê) | `Obrigado pela preferencia!` |

## 🔧 Caracteres Problemáticos Corrigidos:

| Símbolo Original | Substituído Por | Onde Aparece |
|------------------|-----------------|--------------|
| • (bullet point) | - (hífen) | Lista de adicionais |
| ê (e com acento) | e (sem acento) | "preferencia" |
| · ‧ ∙ | - | Outros bullet points |
| ★ ☆ | * | Símbolos de estrela |

## ✅ Aplicado em:

- [x] **Visualização** da etiqueta (prévia)
- [x] **Impressão térmica** (HTML)
- [x] **Geração de PDF**
- [x] **Função de normalização** expandida

## 🎯 Exemplo Completo:

```
ITENS DO PEDIDO
1x Açai Tradicional (300ml)       R$ 8,00

Adicionais Complementos
- 1x Banana                       R$ 1,00
- 2x Leite Condensado             R$ 3,00
- 1x Granola                      R$ 2,50

TOTAL:                            R$ 14,50

Obrigado pela preferencia!
```

## 🔧 Como Testar:

1. **Acesse** `/admin/pedidos`
2. **Clique** "Imprimir Etiqueta" em um pedido com adicionais
3. **Verifique** se:
   - Os adicionais têm hífen (-) em vez de bullet point (•)
   - A frase "preferencia" não tem acento no ê
   - Não há mais símbolos estranhos na impressão
4. **Imprima** na MP-4200 TH para confirmar

---

**Status**: ✅ **CORRIGIDO** - Caracteres especiais normalizados para impressão térmica 