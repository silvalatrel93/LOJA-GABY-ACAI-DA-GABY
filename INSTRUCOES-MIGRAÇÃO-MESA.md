# 🔧 Migração: Ocultar Produtos do Sistema de Mesa

## 🎯 O que foi implementado

### **Nova Funcionalidade**

- ✅ **Botão específico para mesa**: Ícone de grupo de usuários (verde/laranja)
- ✅ **Controle independente**: Ocultar produtos apenas do sistema de mesa
- ✅ **Badge visual**: "Mesa: Oculto" para produtos ocultados de mesa
- ✅ **Checkbox no modal**: "Produto visível no sistema de mesa"

### **Como Funciona**

1. **Visibilidade geral** (olho azul): Controla se o produto aparece para clientes normais
2. **Visibilidade de mesa** (grupo laranja): Controla se o produto aparece no sistema de mesa

## 🚀 Aplicar Migração no Banco

### **Passo 1: Acessar Console Supabase**

1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Clique em **SQL Editor**

### **Passo 2: Executar SQL**

```sql
-- Adiciona colunas relacionadas à visibilidade no sistema de mesa
ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden_from_table BOOLEAN DEFAULT false;

-- Atualiza produtos existentes para serem visíveis em mesa por padrão
UPDATE products SET hidden_from_table = false WHERE hidden_from_table IS NULL;

-- Atualiza o schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
```

### **Passo 3: Verificar se Funcionou**

```sql
-- Este comando deve mostrar a nova coluna
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'hidden_from_table';
```

**Resultado esperado:**

```
column_name      | data_type | column_default
hidden_from_table| boolean   | false
```

## 🎯 Funcionalidades Implementadas

### **1. Interface Admin (/admin)**

#### **Botões de Controle:**

- 🔵 **Olho azul**: Visibilidade geral (clientes normais)
- 🟢 **Grupo verde**: Produto visível em mesa
- 🟠 **Grupo laranja**: Produto oculto em mesa

#### **Badges Visuais:**

- `Oculto` (cinza): Produto oculto para todos
- `Mesa: Oculto` (laranja): Produto oculto apenas para mesa

#### **Modal de Edição:**

- ✅ "Produto visível para clientes"
- ✅ "Produto visível no sistema de mesa"
- ✅ "Precisa de Colher?"

### **2. Sistema de Mesa**

- Produtos marcados como `hidden_from_table = true` não aparecerão nas páginas de mesa
- Funciona independente da visibilidade geral
- Fallback automático se a migração não foi aplicada

## 🧪 Como Testar

### **1. Após Aplicar a Migração**

```
1. Acesse /admin
2. Veja dois botões por produto:
   - Olho azul (visibilidade geral)
   - Grupo de usuários (visibilidade mesa)
3. Clique no grupo de usuários → deve ficar laranja
4. Badge "Mesa: Oculto" deve aparecer
5. Acesse uma página de mesa → produto não deve aparecer
```

### **2. Testando Combinações**

- **Ambos visíveis**: Produto aparece em mesa e clientes normais
- **Geral oculto, mesa visível**: Produto não aparece em lugar nenhum
- **Geral visível, mesa oculto**: Produto aparece para clientes, mas não em mesa
- **Ambos ocultos**: Produto não aparece em lugar nenhum

## 💡 Casos de Uso

### **Exemplos Práticos:**

1. **Produtos só para delivery**: Ocultar de mesa, manter para clientes
2. **Produtos só para mesa**: Manter em mesa, ocultar para clientes
3. **Produtos sazonais**: Controle independente por contexto
4. **Teste de produtos**: Mostrar apenas em mesa antes de liberar geral

## 🔧 Arquivos Modificados

### **Novos Arquivos:**

- `components/admin/table-visibility-toggle.tsx` - Componente do botão
- `migrations/add_hidden_from_table_column.sql` - Migração SQL

### **Arquivos Atualizados:**

- `lib/types.ts` - Adicionada propriedade `hiddenFromTable`
- `lib/services/product-service.ts` - Novo método `getVisibleProductsForTable()`
- `app/admin/page.tsx` - Interface com novos controles

## ⚡ Próximos Passos

### **Após Aplicar a Migração:**

1. **Reinicie o servidor** de desenvolvimento
2. **Teste os botões** na página admin
3. **Verifique as páginas de mesa** para confirmar filtros
4. **Configure produtos** conforme necessário

### **Integração com Sistema de Mesa:**

- As páginas de mesa (`/mesa/[numero]`) automaticamente usarão `getVisibleProductsForTable()`
- Produtos ocultos de mesa não aparecerão na listagem
- Fallback automático se a migração não estiver aplicada

---

**Data:** 2025-01-18  
**Status:** ✅ Implementado (Aguardando migração)  
**Impacto:** Controle independente de visibilidade para sistema de mesa  
**Migração:** `migrations/add_hidden_from_table_column.sql`
