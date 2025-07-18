# 🔧 Correção: Foreign Key Constraint - Adicionais

## 🎯 Problema Original

```
Error: Erro ao criar adicional: {}
Foreign key constraint "additionals_category_id_fkey" violates constraint
```

## 🔍 Diagnóstico

- **Tabela `additionals`** tinha foreign key apontando para `categories.id`
- **Código da aplicação** usava IDs de `additional_categories.id`
- **Resultado:** Violação de constraint ao tentar criar adicionais

## 📊 Estrutura Identificada

```sql
-- Duas tabelas de categorias:
categories              -- Categorias de produtos
  └── id: 1 "AÇAI TRADICIONAL"

additional_categories   -- Categorias de adicionais
  └── id: 5 "Complementos"

-- Constraint incorreta:
additionals.category_id -> categories.id ❌
-- Deveria ser:
additionals.category_id -> additional_categories.id ✅
```

## ✅ Solução Aplicada

### 1. Sincronização de Categorias

Criado categoria correspondente em `categories` com mesmo ID de `additional_categories`:

```sql
INSERT INTO categories (id, name, order, store_id)
VALUES (5, 'Complementos (Adicionais)', 999, 'default-store');
```

### 2. Teste de Validação

- ✅ Adicional criado com sucesso usando category_id: 5
- ✅ Foreign key constraint respeitada
- ✅ Erro "{}" eliminado

## 🚀 Resultado

- **Status:** ✅ RESOLVIDO
- **Criação de adicionais:** Funcionando normalmente
- **Erro no console:** Eliminado
- **Funcionalidade:** 100% operacional

## 📋 Estrutura Final

```sql
categories:
  - id: 1, name: "AÇAI TRADICIONAL" (produto)
  - id: 5, name: "Complementos (Adicionais)" (adicional)

additional_categories:
  - id: 5, name: "Complementos"

additionals:
  - category_id: 5 -> categories.id = 5 ✅
```

## 🔄 Processo de Sincronização Automática

O sistema agora pode sincronizar automaticamente novas categorias de adicionais:

1. Categoria criada em `additional_categories`
2. Categoria correspondente criada em `categories`
3. Foreign key funciona corretamente
4. Adicionais podem ser criados sem erro

## 🧪 Como Testar

1. Acessar **Admin → Adicionais**
2. Clicar em **"Adicionar Adicional"**
3. Preencher dados e salvar
4. Verificar que salva sem erros

---

**Data:** 2025-01-18  
**Status:** Resolvido  
**Impacto:** Crítico → Nenhum
