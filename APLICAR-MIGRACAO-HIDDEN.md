# 🚀 Migração Rápida - Coluna Hidden

## ⚡ Aplicação Rápida

### 1. Acesse o Console do Supabase

- Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Selecione seu projeto
- Vá em **SQL Editor**

### 2. Execute este SQL:

```sql
-- Adiciona coluna hidden para ocultar produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;

-- Garante que todos os produtos existentes sejam visíveis por padrão
UPDATE products SET hidden = FALSE WHERE hidden IS NULL;
```

### 3. Verificar se Funcionou:

```sql
-- Este comando deve mostrar a nova coluna
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'hidden';
```

## ✅ Resultado Esperado

```
column_name | data_type | column_default
hidden      | boolean   | false
```

## 🎯 Após Aplicar

1. **Reinicie o servidor** de desenvolvimento
2. **Acesse `/admin`**
3. **Teste o botão de olho** nos produtos
4. **Verifique** que produtos ocultos não aparecem na listagem do cliente

---

**📄 Para instruções detalhadas**: `CORRECAO-OCULTAR-PRODUTOS.md`
**🧪 Para testar**: `scripts/test-hidden-products.js`
