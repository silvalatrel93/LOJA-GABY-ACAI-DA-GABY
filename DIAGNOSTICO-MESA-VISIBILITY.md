# 🔧 Diagnóstico: Produtos Não Ocultos em Mesa

## ❌ **Problema Relatado**

"o produto no sistema de mesa nao ocultou"

## 🔍 **Diagnóstico Necessário**

### **Causa Mais Provável**

A **migração da coluna `hidden_from_table`** ainda não foi aplicada no banco de dados.

### **Verificação Rápida**

#### **1. Verificar se a Migração Foi Aplicada**

**Acesse o Console Supabase:**

1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Clique em **SQL Editor**
4. Execute esta consulta:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'hidden_from_table';
```

**Resultados possíveis:**

#### ✅ **Se retornar uma linha:**

```
column_name      | data_type | column_default
hidden_from_table| boolean   | false
```

✅ **Migração aplicada** → Vá para "Passo 2"

#### ❌ **Se não retornar nada:**

❌ **Migração NÃO aplicada** → **APLICAR MIGRAÇÃO AGORA**

---

## 🚀 **APLICAR MIGRAÇÃO (Se Necessário)**

**Execute no SQL Editor do Supabase:**

```sql
-- Adiciona coluna para ocultar produtos do sistema de mesa
ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden_from_table BOOLEAN DEFAULT false;

-- Atualiza produtos existentes para serem visíveis em mesa por padrão
UPDATE products SET hidden_from_table = false WHERE hidden_from_table IS NULL;

-- Atualiza o schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
```

**Após executar, aguarde ~30 segundos e prossiga.**

---

## 🔄 **PASSO 2: Reiniciar Aplicação**

**No terminal/prompt de comando:**

```bash
# Pare o servidor (Ctrl+C)
# Depois execute:
npm run dev
```

**Aguarde o servidor inicializar completamente.**

---

## 🧪 **PASSO 3: Testar Funcionalidade**

### **3.1 Testar Interface Admin**

1. **Acesse:** `http://localhost:3000/admin`
2. **Procure pelos botões:** Cada produto deve ter 2 botões:
   - 🔵 **Olho azul** (visibilidade geral)
   - 🟢 **Grupo verde** (visibilidade mesa) ← **NOVO**

### **3.2 Ocultar Produto de Mesa**

1. **Clique no ícone de grupo** (usuários) de um produto
2. **Deve ficar laranja** 🟠 quando oculto
3. **Badge deve aparecer:** "Mesa: Oculto" (laranja)

### **3.3 Verificar Página de Mesa**

1. **Acesse:** `http://localhost:3000/mesa/1`
2. **Produto oculto** não deve aparecer na listagem
3. **Produtos normais** continuam visíveis

---

## 🐛 **Se Ainda Não Funcionar**

### **Problema 1: Botões Não Aparecem**

- ✅ Migração aplicada?
- ✅ Servidor reiniciado?
- ✅ Cache do navegador limpo?

### **Problema 2: Erro no Console**

Abra **F12 → Console** e procure por:

- `hidden_from_table` errors
- `ProductService` errors
- `TableVisibilityToggle` errors

### **Problema 3: Interface Não Atualiza**

```bash
# Force refresh do navegador:
Ctrl + F5 (Windows)
Cmd + Shift + R (Mac)
```

---

## 📋 **Checklist de Verificação**

### **Backend (Banco de Dados):**

- [ ] Coluna `hidden_from_table` existe na tabela `products`
- [ ] Migração SQL executada com sucesso
- [ ] `NOTIFY pgrst, 'reload schema'` executado

### **Frontend (Aplicação):**

- [ ] Servidor reiniciado após migração
- [ ] Dois botões aparecendo por produto no admin
- [ ] Badge "Mesa: Oculto" aparece quando ativado
- [ ] Página de mesa filtra produtos corretamente

### **Funcionalidade:**

- [ ] Clicar no grupo muda cor (verde → laranja)
- [ ] Produto some da página `/mesa/[numero]`
- [ ] Produto continua na página principal (se não oculto geral)

---

## 🎯 **Resultado Esperado**

### **Admin Interface:**

```
[👁️ Azul] [👥 Verde] [✏️] [🗑️] Produto Normal
[👁️ Azul] [👥 Laranja] [✏️] [🗑️] Produto Oculto Mesa: Oculto
```

### **Sistema de Mesa:**

- ✅ **Produtos normais**: Aparecem normalmente
- ❌ **Produtos ocultos de mesa**: NÃO aparecem
- ✅ **Produtos ocultos gerais**: NÃO aparecem (como antes)

---

## 📞 **Suporte**

### **Se o problema persistir:**

1. **Verificar migração novamente:**

   ```sql
   SELECT id, name, hidden, hidden_from_table
   FROM products
   LIMIT 5;
   ```

2. **Testar filtro manual:**

   ```sql
   SELECT count(*) as total_products FROM products WHERE active = true;
   SELECT count(*) as visible_in_table FROM products
   WHERE active = true AND hidden = false AND hidden_from_table = false;
   ```

3. **Verificar logs do servidor** no terminal

---

**Siga este guia passo a passo e a funcionalidade deve funcionar perfeitamente!** 🎉
