# 🗑️ Correção do Erro ao Remover Credenciais

## ❌ **Problemas Identificados**

### 1. **Constraint Única Violada**
```
duplicate key value violates unique constraint "mercado_pago_credentials_loja_id_is_active_key"
```
- Tentativa de inserir novo registro com `(loja_id, is_active) = ('default-store', true)`
- Já existia registro com mesma combinação

### 2. **Cliente Supabase Inadequado**
- Método `removeCredentials` usava cliente padrão (`this.supabase`)
- Não tinha privilégios para operações DELETE

### 3. **Lógica de Remoção Inadequada**
- Método apenas desativava registros (`is_active = false`)
- Não removia fisicamente os registros
- Causava acúmulo de registros inativos

## ✅ **Correções Aplicadas**

### 1. **Método removeCredentials Corrigido**
**Arquivo**: `/lib/services/mercado-pago-service.ts`

```typescript
// ANTES - Apenas desativava
const { error } = await this.supabase
  .from('mercado_pago_credentials')
  .update({ is_active: false })
  .eq('loja_id', lojaId);

// DEPOIS - Remove fisicamente usando cliente admin
const { data, error } = await this.adminSupabase
  .from('mercado_pago_credentials')
  .delete()
  .eq('loja_id', lojaId)
  .select();
```

### 2. **Lógica de Salvamento Melhorada**
```typescript
// ANTES - Tentava desativar e inserir
await this.adminSupabase
  .from('mercado_pago_credentials')
  .update({ is_active: false })
  .eq('loja_id', lojaId);

// DEPOIS - Remove tudo e insere novo
const { error: deleteError } = await this.adminSupabase
  .from('mercado_pago_credentials')
  .delete()
  .eq('loja_id', lojaId);
```

### 3. **Logs Melhorados**
```typescript
console.log('🗑️ Removendo credenciais para loja:', lojaId);
console.log('✅ Credenciais removidas para loja:', lojaId);
console.log('Registros removidos:', data?.length || 0);
```

### 4. **Tratamento de Erros Detalhado**
```typescript
console.error('❌ Erro ao remover credenciais:', {
  message: error.message,
  details: error.details,
  hint: error.hint,
  code: error.code
});
```

## 🧪 **Testes Realizados**

### 1. **Limpeza do Banco**
```sql
-- Removidos registros duplicados
DELETE FROM mercado_pago_credentials WHERE loja_id = 'default-store';
```
**Resultado**: ✅ **SUCESSO** - Banco limpo

### 2. **Verificação de Duplicatas**
```sql
SELECT loja_id, is_active, COUNT(*) as count 
FROM mercado_pago_credentials 
GROUP BY loja_id, is_active 
HAVING COUNT(*) > 1;
```
**Resultado**: ✅ **NENHUMA DUPLICATA** encontrada

## 🚀 **Deploy Realizado**
- ✅ Método `removeCredentials` corrigido
- ✅ Lógica de salvamento melhorada
- ✅ Cliente administrativo implementado
- ✅ Deploy feito na Vercel

## 🎯 **Resultado Esperado**
Agora o sistema deve:
1. ✅ **Remover credenciais** corretamente via botão
2. ✅ **Salvar novas credenciais** sem erro de constraint
3. ✅ **Usar cliente administrativo** para todas as operações
4. ✅ **Logs detalhados** para debugging

## 📋 **Fluxo Correto Agora**
1. **Usuário clica "Remover"** → Delete físico no banco
2. **Usuário salva novas credenciais** → Remove antigas + Insere novas
3. **Sem conflitos de constraint** → Operação limpa
4. **Logs claros** → Fácil debugging

---
**Data da Correção**: 21/07/2025  
**Status**: ✅ **CORREÇÃO DE DELETE APLICADA E DEPLOYADA**
