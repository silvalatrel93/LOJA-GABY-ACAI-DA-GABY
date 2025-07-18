# 📋 Instruções: Migração das Colunas de Colher na Tabela Cart

## 🎯 Problema

Quando o usuário seleciona "Precisa de colher: Sim" ao adicionar um produto ao carrinho, essa informação não aparece no carrinho porque as colunas `needs_spoon` e `spoon_quantity` não existem na tabela `cart`.

## ✅ Solução Temporária Aplicada

O sistema foi configurado para funcionar **sem as colunas de colher** temporariamente:

- Os dados de colher são mantidos no frontend (em memória)
- Avisos no console ao invés de erros críticos
- Sistema continua funcionando normalmente

## 🔧 Como Aplicar a Migração Permanente

### Opção 1: Via Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard**

   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione seu projeto

2. **Abra o SQL Editor**

   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o SQL**

   ```sql
   -- Adiciona colunas relacionadas a colher na tabela cart
   ALTER TABLE cart ADD COLUMN IF NOT EXISTS needs_spoon BOOLEAN DEFAULT false;
   ALTER TABLE cart ADD COLUMN IF NOT EXISTS spoon_quantity INTEGER DEFAULT 1;

   -- Verificar se as colunas foram criadas
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'cart' AND column_name IN ('needs_spoon', 'spoon_quantity');
   ```

4. **Clique em "Run"** para executar

### Opção 2: Via Linha de Comando (se tiver acesso ao banco)

```bash
# Conectar ao PostgreSQL e executar
psql "sua-connection-string-aqui" -c "
  ALTER TABLE cart ADD COLUMN IF NOT EXISTS needs_spoon BOOLEAN DEFAULT false;
  ALTER TABLE cart ADD COLUMN IF NOT EXISTS spoon_quantity INTEGER DEFAULT 1;
"
```

## 🧪 Como Verificar se Funcionou

Após aplicar a migração:

1. **Reinicie o servidor de desenvolvimento**

   ```bash
   npm run dev
   # ou
   yarn dev
   ```

2. **Teste a funcionalidade**

   - Vá para a loja principal
   - Selecione um produto que pergunta sobre colher (ex: Açaí)
   - Selecione "Sim" para colher e quantidade
   - Adicione ao carrinho
   - Vá para o carrinho
   - Verifique se aparece: "✅ Precisa de colher: Sim (1 colher)"

3. **Verifique o console**
   - Não deve haver mais avisos sobre colunas ausentes
   - As informações de colher devem persistir corretamente

## 📋 Estrutura das Colunas

### `needs_spoon` (BOOLEAN)

- **Propósito:** Indica se o cliente precisa de colher
- **Valores:** `true` (sim), `false` (não)
- **Padrão:** `false`

### `spoon_quantity` (INTEGER)

- **Propósito:** Quantidade de colheres necessárias
- **Valores:** 1, 2, 3, etc.
- **Padrão:** `1`
- **Relevância:** Só importa quando `needs_spoon = true`

## 📁 Arquivo de Migração

O arquivo SQL da migração está em: `migrations/add_spoon_columns_to_cart.sql`

## 🚨 Importante

- **Faça backup** do banco antes de aplicar qualquer migração
- **Teste em ambiente de desenvolvimento** primeiro
- A migração usa `IF NOT EXISTS` então é segura de executar múltiplas vezes

## ✅ Após a Migração

Uma vez que as colunas estiverem criadas, o sistema automaticamente:

- Parará de mostrar avisos sobre colunas ausentes
- Salvará informações de colher no banco de dados
- Exibirá "Precisa de colher" corretamente no carrinho
- Manterá essas informações em pedidos e relatórios

## 🔄 Funcionalidade Completa

Com a migração aplicada, a funcionalidade funcionará assim:

1. **No produto:** Cliente seleciona "Sim" + quantidade de colheres
2. **No carrinho:** Mostra "✅ Precisa de colher: Sim (X colheres)"
3. **No pedido:** Informação preservada para preparação
4. **Na impressão:** Etiqueta inclui informação de colher

---

**Data:** 2025-01-18  
**Status:** Aguardando migração  
**Impacto:** Funcionalidade → Completa
