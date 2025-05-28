# Teste de Normalização para Impressão Térmica

## Problema: Letras Erradas na Impressão

### 🔍 Caracteres Problemáticos Comuns:

| Original | Normalizado | Motivo |
|----------|-------------|--------|
| á, à, â, ã, ä | A | Acentos podem não ser suportados |
| é, è, ê, ë | E | Codificação UTF-8 não reconhecida |
| í, ì, î, ï | I | Caracteres especiais |
| ó, ò, ô, õ, ö | O | Impressoras térmicas antigas |
| ú, ù, û, ü | U | Limitação do driver |
| ç | C | Cedilha pode aparecer como ? |
| • · ‧ ∙ | - | Bullet points aparecem como acentos |
| " " | " | Aspas especiais |
| ' ' | ' | Apóstrofos especiais |
| – — | - | Hífens especiais |
| … | ... | Reticências especiais |
| ° ² ³ | o 2 3 | Símbolos matemáticos |

### ✅ Função de Normalização Implementada:

```typescript
const normalizeForThermalPrint = (text: string): string => {
  return text
    .replace(/[áàâãä]/gi, 'A')
    .replace(/[éèêë]/gi, 'E') 
    .replace(/[íìîï]/gi, 'I')
    .replace(/[óòôõö]/gi, 'O')
    .replace(/[úùûü]/gi, 'U')
    .replace(/ç/gi, 'C')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, '-')
    // ... outros caracteres
};
```

### 🧪 Teste com Nome da Loja:

**Exemplos de Normalização:**
- `HEAI AÇAÍ E SORVETES` → `HEAI ACAI E SORVETES`
- `Açaí Delícia` → `ACAI DELICIA`
- `Café & Cia` → `CAFE & CIA`
- `Doçura Açúcar` → `DOCURA ACUCAR`

### 📋 Checklist de Verificação:

- [x] ✅ Função de normalização criada
- [x] ✅ Aplicada na visualização da etiqueta
- [x] ✅ Aplicada no HTML de impressão
- [x] ✅ Aplicada na geração de PDF
- [x] ✅ Caracteres de controle removidos
- [x] ✅ Espaços múltiplos normalizados

### 🔧 Como Testar:

1. **Acesse** `/admin/pedidos`
2. **Clique** "Imprimir Etiqueta"
3. **Verifique** se o nome da loja aparece sem acentos
4. **Compare** com a versão original na tela
5. **Imprima** para confirmar na MP-4200 TH

### 📊 Resultados Esperados:

| Antes | Depois |
|-------|--------|
| Letras com acentos aparecem como `?` ou símbolos | Letras sem acentos aparecem corretamente |
| Caracteres especiais causam problemas | Caracteres normalizados são imprimíveis |
| Nome da loja ilegível | Nome da loja legível e claro |

### 🛠️ Se Ainda Houver Problemas:

1. **Verificar** se o nome da loja no banco tem caracteres especiais
2. **Limpar** cabeça da impressora
3. **Atualizar** driver da Bematech
4. **Testar** com papel original
5. **Verificar** configuração de charset no Windows

---

**Status**: ✅ **IMPLEMENTADO** - Normalização ativa na impressão 