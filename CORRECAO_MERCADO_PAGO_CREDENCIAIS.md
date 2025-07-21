# 🔧 Correção do Erro de Credenciais Mercado Pago

## ❌ **Problema Identificado**
O erro "Falha ao salvar credenciais. Verifique se são válidas." estava ocorrendo devido a dois problemas principais:

### 1. **Foreign Key Constraint Violation**
- A tabela `mercado_pago_credentials` possui uma foreign key para `store_config.id`
- O frontend estava tentando usar `loja_id = 'loja-1'`
- Mas na tabela `store_config` só existe o ID `'default-store'`
- **Erro SQL**: `insert or update on table "mercado_pago_credentials" violates foreign key constraint`

### 2. **Problemas na Criptografia AES-256-GCM**
- Uso incorreto de métodos deprecated `crypto.createCipher` e `crypto.createDecipher`
- Implementação inadequada do algoritmo AES-256-GCM

## ✅ **Correções Aplicadas**

### 1. **Correção do ID da Loja**
**Arquivo**: `/app/admin/mercado-pago/page.tsx`
```typescript
// ANTES
const [lojaId] = useState('loja-1');

// DEPOIS  
const [lojaId] = useState('default-store'); // ID da loja padrão existente no banco
```

### 2. **Correção da Criptografia**
**Arquivo**: `/lib/services/encryption-service.ts`

**Método encrypt():**
```typescript
// ANTES
const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);

// DEPOIS
const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
```

**Método decrypt():**
```typescript
// ANTES
const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);

// DEPOIS
const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
```

### 3. **Melhoria na Validação de Credenciais**
**Arquivo**: `/lib/services/mercado-pago-service.ts`

- ✅ Validação básica do formato das chaves
- ✅ Verificação de sandbox vs produção
- ✅ Timeout aumentado para 10 segundos
- ✅ Tratamento de erros de rede mais robusto
- ✅ Logs mais detalhados para debugging

## 🧪 **Testes Realizados**

### 1. **Teste de Inserção Direta no Banco**
```sql
INSERT INTO mercado_pago_credentials (
  loja_id, public_key, access_token, chave_pix, 
  webhook_url, is_sandbox, is_active
) VALUES (
  'default-store', 
  'TEST-abcdef12-3456-7890-abcd-ef1234567890', 
  'TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789', 
  'test@pix.com', 'https://test.com/webhook', true, true
);
```
**Resultado**: ✅ **SUCESSO** - Inserção funcionou perfeitamente

### 2. **Verificação da Estrutura do Banco**
- ✅ Tabelas `mercado_pago_credentials` e `mercado_pago_transactions` existem
- ✅ Foreign key para `store_config.id` configurada corretamente
- ✅ Loja padrão `'default-store'` existe na tabela `store_config`

## 🚀 **Deploy Realizado**
- ✅ Correções aplicadas no código
- ✅ Deploy feito na Vercel em produção
- ✅ Arquivos de teste removidos

## 🎯 **Resultado Esperado**
Agora o sistema deve:
1. ✅ Aceitar credenciais de teste do Mercado Pago
2. ✅ Criptografar corretamente os dados sensíveis
3. ✅ Salvar no banco sem erros de foreign key
4. ✅ Validar credenciais adequadamente
5. ✅ Exibir mensagem de sucesso

## 📋 **Próximos Passos**
1. Testar novamente com credenciais de teste
2. Verificar se a mensagem de sucesso aparece
3. Confirmar se os dados são salvos corretamente no banco
4. Testar funcionalidades de PIX e Cartão

---
**Data da Correção**: 21/07/2025  
**Status**: ✅ **CORREÇÕES APLICADAS E DEPLOYADAS**
