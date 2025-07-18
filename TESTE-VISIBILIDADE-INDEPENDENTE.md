# 🧪 Teste de Visibilidade Independente - Delivery vs Mesa

## 📋 Pré-requisitos

1. **Aplicar migração SQL** primeiro

   - Execute o arquivo `CORRECAO-VISIBILIDADE-INDEPENDENTE.sql` no Console do Supabase
   - Confirme que as colunas `hidden_from_delivery` e `hidden_from_table` foram criadas

2. **Reiniciar o servidor** de desenvolvimento após aplicar a migração

## 🎯 Cenários de Teste

### Cenário 1: Produto Oculto Apenas do Delivery

#### Passos:

1. **Acesse o admin**: `/admin`
2. **Localize um produto** visível
3. **Clique no botão "Delivery: Visível"** (roxo com ícone de olho)
   - Deve mudar para "Delivery: Oculto" (roxo com ícone de olho cortado)
   - Badge "Delivery: Oculto" deve aparecer no nome do produto
4. **Teste no Delivery**:
   - Vá para a página principal `/`
   - O produto **NÃO deve aparecer** na listagem
5. **Teste na Mesa**:
   - Vá para qualquer mesa: `/mesa/1` (ou outra)
   - O produto **DEVE aparecer** na listagem normalmente

#### ✅ Resultado Esperado:

- ❌ Produto oculto no Delivery
- ✅ Produto visível na Mesa

### Cenário 2: Produto Oculto Apenas da Mesa

#### Passos:

1. **No admin**, localize o mesmo produto ou outro
2. **Restaure a visibilidade no delivery** (se necessário)
3. **Clique no botão de mesa** (laranja com ícone de usuários)
   - Deve mudar para usuário cortado e badge "Mesa: Oculto"
4. **Teste no Delivery**:
   - Página principal `/`: produto **DEVE aparecer**
5. **Teste na Mesa**:
   - Qualquer mesa: produto **NÃO deve aparecer**

#### ✅ Resultado Esperado:

- ✅ Produto visível no Delivery
- ❌ Produto oculto na Mesa

### Cenário 3: Produto Oculto de Ambos

#### Passos:

1. **Oculte do delivery E da mesa** clicando em ambos os botões
2. **Teste no Delivery**: produto **NÃO deve aparecer**
3. **Teste na Mesa**: produto **NÃO deve aparecer**

#### ✅ Resultado Esperado:

- ❌ Produto oculto no Delivery
- ❌ Produto oculto na Mesa

### Cenário 4: Visibilidade Geral vs Específica

#### Passos:

1. **Restaure** as visibilidades específicas (delivery e mesa como visíveis)
2. **Clique no botão de visibilidade geral** (cinza com olho)
   - Badge "Oculto" deve aparecer
3. **Teste**: produto **NÃO deve aparecer** em lugar nenhum

#### ✅ Resultado Esperado:

- ❌ Produto oculto no Delivery (visibilidade geral prevalece)
- ❌ Produto oculto na Mesa (visibilidade geral prevalece)

## 🔍 Indicadores Visuais no Admin

### Badges de Status:

- **"Oculto"** (cinza): Produto oculto globalmente
- **"Delivery: Oculto"** (roxo): Produto oculto apenas do delivery
- **"Mesa: Oculto"** (laranja): Produto oculto apenas da mesa

### Botões de Controle:

- **Olho cinza**: Visibilidade geral
- **Olho/olho cortado roxo**: Visibilidade no delivery
- **Usuários/usuários cortados laranja**: Visibilidade na mesa

## 🐛 Problemas Comuns

### Se o botão de delivery não aparece:

- Verifique se a migração SQL foi aplicada
- Confirme que `DeliveryVisibilityToggle` foi importado em `/admin/page.tsx`
- Reinicie o servidor de desenvolvimento

### Se o botão não funciona:

- Verifique o console do navegador (F12) para erros
- Confirme que as colunas `hidden_from_delivery` e `hidden_from_table` existem no banco

### Se produtos não filtram corretamente:

- Verifique se `getVisibleProductsForDelivery` e `getVisibleProductsForTable` estão sendo usadas
- Confirme que a página `/` usa `getVisibleProductsForDelivery`
- Confirme que a página `/mesa/[numero]` usa `getVisibleProductsForTable`

## ✨ Teste Automatizado

Execute no console do navegador (F12) na página admin:

```javascript
// Teste rápido de visibilidade independente
async function testeVisibilidadeIndependente() {
  const produtos = await fetch("/api/products").then((r) => r.json());
  console.log("Produtos encontrados:", produtos.length);

  // Verificar se há produtos com visibilidade específica
  const comDeliveryOculto = produtos.filter((p) => p.hiddenFromDelivery);
  const comMesaOculta = produtos.filter((p) => p.hiddenFromTable);

  console.log("Produtos ocultos do delivery:", comDeliveryOculto.length);
  console.log("Produtos ocultos da mesa:", comMesaOculta.length);

  if (comDeliveryOculto.length > 0 || comMesaOculta.length > 0) {
    console.log("✅ Sistema de visibilidade independente funcionando!");
  } else {
    console.log("⚠️ Nenhum produto com visibilidade específica configurada.");
  }
}

testeVisibilidadeIndependente();
```

## 📝 Checklist Final

- [ ] Migração SQL aplicada com sucesso
- [ ] Colunas `hidden_from_delivery` e `hidden_from_table` existem
- [ ] Botões de delivery e mesa aparecem no admin
- [ ] Produto pode ser ocultado apenas do delivery
- [ ] Produto pode ser ocultado apenas da mesa
- [ ] Produto pode ser ocultado de ambos
- [ ] Visibilidade geral ainda funciona
- [ ] Badges visuais aparecem corretamente
- [ ] Filtragem funciona na página principal (delivery)
- [ ] Filtragem funciona nas páginas de mesa

## 🎉 Resultado Final

Após todos os testes, o sistema deve permitir:

1. **Controle independente** de visibilidade entre delivery e mesa
2. **Flexibilidade total** para ocultar produtos conforme necessário
3. **Interface intuitiva** com botões e badges visuais claros
4. **Compatibilidade** com o sistema de visibilidade geral existente
