# 🧪 Guia de Teste - Limitação de Adicionais por Tamanho

## 🚀 **Preparação do Teste**

### **1. Execute o Script SQL**
No Supabase Dashboard, execute o arquivo `CONFIGURAR-PRODUTOS-TESTE.sql` para configurar produtos de teste.

### **2. Acesse o Frontend**
Abra `http://localhost:3002` no navegador.

### **3. Abra o Console do Navegador**
Pressione `F12` → aba `Console` para ver os logs de debug.

## 🎯 **Cenários de Teste**

### **Teste 1: Marmita de Açaí**
1. **Clique na Marmita de Açaí**
2. **Selecione "Marmita G"**
3. **Adicione adicionais um por um**
4. **Resultado esperado:**
   - ✅ Permite até 6 adicionais
   - ✅ No 7º adicional, botão fica desabilitado
   - ✅ Mensagem: "Limite de 6 adicionais atingido para este tamanho"

### **Teste 2: Troca de Tamanho**
1. **Na mesma Marmita, selecione "Marmita P"**
2. **Resultado esperado:**
   - ✅ Limite muda para 3 adicionais
   - ✅ Se já tinha mais de 3, alguns são mantidos
   - ✅ Não permite adicionar mais que 3

### **Teste 3: Produto com Tamanho Ilimitado**
1. **Clique em outro produto configurado**
2. **Selecione tamanho "Médio" (sem limite)**
3. **Resultado esperado:**
   - ✅ Permite adicionar muitos adicionais
   - ✅ Não há limite prático

### **Teste 4: Diferentes Limites por Tamanho**
1. **Teste tamanhos: 300ml (2), 500ml (4), 1L (7)**
2. **Resultado esperado:**
   - ✅ Cada tamanho respeita seu limite específico
   - ✅ Troca de tamanho atualiza limite instantaneamente

## 🔍 **Logs de Debug Esperados**

No console do navegador, você deve ver:

```
🔍 DEBUG - Tamanhos atualizados no hook: [...]
🔍 DEBUG - selectedSize mudou no hook: Marmita G
🔍 DEBUG - getCurrentSizeLimit: {
  selectedSize: "Marmita G",
  sizeLimits: [...],
  currentSizeInfo: {...},
  limit: 6
}
🔍 DEBUG - toggleAdditional: {
  additionalName: "Mousse de Maracujá",
  selectedSize: "Marmita G",
  isSelected: false,
  selectedAdditionalsCount: 5,
  currentLimit: 6,
  reachedMaxAdditionalsLimit: false
}
➕ Adicionando adicional: Mousse de Maracujá
```

## ✅ **Checklist de Validação**

### **Funcionalidades Básicas:**
- [ ] Limite específico por tamanho funciona
- [ ] Troca de tamanho atualiza limite
- [ ] Botões desabilitam quando limite atingido
- [ ] Mensagens de feedback aparecem
- [ ] Tamanhos sem limite são ilimitados

### **Logs de Debug:**
- [ ] `getCurrentSizeLimit` mostra limite correto
- [ ] `toggleAdditional` mostra validação
- [ ] `selectedSize` sincroniza corretamente
- [ ] `sizeLimits` contém dados corretos

### **Casos Extremos:**
- [ ] Produto sem limites configurados
- [ ] Tamanho com limite 0 (deve ser ilimitado)
- [ ] Tamanho com limite 1 (deve permitir apenas 1)
- [ ] Múltiplos produtos com limites diferentes

## 🚨 **Problemas Possíveis**

### **Se não estiver limitando:**
1. **Verifique os logs:** `getCurrentSizeLimit` retorna 999?
2. **Verifique sincronização:** `selectedSize` está correto?
3. **Verifique dados:** `sizeLimits` contém os tamanhos?

### **Se logs não aparecem:**
1. **Console aberto:** F12 → Console
2. **Filtros:** Remova filtros do console
3. **Refresh:** Recarregue a página

## 🎉 **Resultado Esperado**

Após os testes, você deve ter:
- ✅ **Marmita G**: Máximo 6 adicionais
- ✅ **Marmita P**: Máximo 3 adicionais
- ✅ **300ml**: Máximo 2 adicionais
- ✅ **500ml**: Máximo 4 adicionais
- ✅ **1L**: Máximo 7 adicionais
- ✅ **Médio**: Ilimitado
- ✅ **Sistema funcionando para todos os produtos**

**Execute os testes e me informe os resultados!** 🚀 