# Guia de Diagnóstico - Preços de Mesa não Atualizando

## Problema Identificado

Os preços na página da Mesa não refletem as alterações feitas no painel administrativo, enquanto o sistema de Delivery funciona corretamente.

## 🔍 Diagnóstico Step-by-Step

### 1. Verificar se os Preços de Mesa estão Configurados

**Passo 1.1:** Acesse o painel administrativo:

- Vá para `/admin`
- Clique em qualquer produto para editar
- Role até a seção **"Preços para Mesa"**

**Passo 1.2:** Verificar se há preços configurados:

- Se a seção estiver vazia, **esse é o problema principal**
- Se houver preços, prossiga para o próximo passo

### 2. Configurar Preços de Mesa (se necessário)

**Passo 2.1:** Na seção "Preços para Mesa":

- Clique em **"Adicionar Preço"**
- Configure o mesmo tamanho que existe nos preços padrão
- Defina um preço diferente (exemplo: 15% menor que o delivery)
- Clique em **"Salvar"**

**Exemplo:**

- Delivery: 300ml = R$ 18,00
- Mesa: 300ml = R$ 15,30 (15% desconto)

### 3. Testar no Console do Browser

**Passo 3.1:** No painel administrativo, abra o console (F12)

**Passo 3.2:** Execute este código:

```javascript
// Cole este código no console e pressione Enter
async function verificarPrecosMesa() {
  const { ProductService } = await import("/lib/services/product-service.js");
  const products = await ProductService.getActiveProducts();

  console.log("📋 Produtos e seus preços:");
  products.forEach((product) => {
    console.log(`${product.name}:`);
    console.log(`  Delivery: R$ ${product.sizes[0]?.price}`);
    console.log(
      `  Mesa: R$ ${product.tableSizes?.[0]?.price || "NÃO CONFIGURADO"}`
    );
  });
}
verificarPrecosMesa();
```

### 4. Verificar se a Migração foi Executada

**Passo 4.1:** Acesse o painel do Supabase

- Vá para a aba **SQL Editor**
- Execute esta consulta:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'table_sizes';
```

**Passo 4.2:** Se não retornar resultados, execute a migração:

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS table_sizes JSONB;
```

### 5. Forçar Atualização na Página da Mesa

**Passo 5.1:** Acesse qualquer página de mesa (`/mesa/1`, `/mesa/2`, etc.)

**Passo 5.2:** Clique no botão de atualização (⟲) no canto superior direito

**Passo 5.3:** Verifique os logs no console:

- Abra o console (F12)
- Deve aparecer logs detalhados sobre o carregamento dos produtos
- Procure por linhas como: `🍽️ ✅ APLICANDO preços de mesa para: [nome do produto]`

### 6. Verificar Logs Detalhados

Os logs mostrarão:

```
🔍 Carregados X produtos para verificar preços de mesa
📋 Analisando produto: [Nome]
🍽️ Preços de mesa (tableSizes): [dados]
✅ Tem tableSizes definido: true/false
```

Se aparecer `❌ SEM preços de mesa`, o produto não tem preços configurados.

## 🔧 Soluções por Cenário

### Cenário 1: Nenhum Produto tem Preços de Mesa

**Problema:** Produtos não foram configurados com preços de mesa
**Solução:** Configure preços de mesa para pelo menos um produto (ver Passo 2)

### Cenário 2: Migração não foi Executada

**Problema:** Coluna `table_sizes` não existe no banco
**Solução:** Execute a migração SQL (ver Passo 4)

### Cenário 3: Cache do Browser

**Problema:** Browser está usando dados em cache
**Solução:**

- Use o botão de atualização na página da mesa
- Ou limpe o cache do browser (Ctrl+Shift+R)

### Cenário 4: Erro no Carregamento

**Problema:** Erro ao buscar produtos do banco
**Solução:** Verifique os logs no console e a conectividade com o Supabase

## ✅ Validação Final

Após aplicar as correções:

1. **Configure preços de mesa** para pelo menos um produto
2. **Acesse a página da mesa** (`/mesa/1`)
3. **Verifique os preços exibidos** - devem ser diferentes do delivery
4. **Compare com a página principal** (delivery) - devem ter preços diferentes

## 📋 Checklist de Verificação

- [ ] Coluna `table_sizes` existe no banco de dados
- [ ] Pelo menos um produto tem preços de mesa configurados
- [ ] Logs no console mostram aplicação de preços de mesa
- [ ] Preços na página da mesa são diferentes do delivery
- [ ] Sistema funciona após forçar atualização

## 🎯 Resultado Esperado

- **Delivery:** Exibe preços da coluna `sizes`
- **Mesa:** Exibe preços da coluna `table_sizes` (quando configurados)
- **Diferença visível** entre os dois sistemas de preços

---

**Nota:** O sistema de preços de mesa é opcional. Se um produto não tiver preços de mesa configurados, ele usará os preços padrão (delivery) automaticamente.
