# Guia para Ativar RLS na Tabela store_config

## 📋 Objetivo

Ativar Row Level Security (RLS) na tabela `store_config` para melhorar a segurança dos dados da configuração da loja.

## 🔧 Como Aplicar

### Método 1: Via Dashboard Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase**

   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login na sua conta
   - Selecione o projeto "PediFacil loja 2"

2. **Navegue até o Editor SQL**

   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute a Migração**
   - Copie o conteúdo do arquivo `migrations/enable_rls_store_config.sql`
   - Cole no editor SQL
   - Clique em "Run" para executar

### Método 2: Via Supabase CLI

```bash
# Navegue até o diretório do projeto
cd "c:\Users\Usuário\PROJETOS JA CRIADO E FUNCIONANDO\PediFacil loja 2"

# Execute a migração
supabase db push
```

## 🛡️ Políticas de Segurança Criadas

### 1. Usuários Autenticados

- **Permissões**: SELECT, INSERT, UPDATE, DELETE
- **Descrição**: Acesso completo para administradores logados

### 2. Usuários Anônimos

- **Permissões**: SELECT apenas
- **Descrição**: Permite que a aplicação pública leia configurações da loja

## ✅ Verificação

Após aplicar a migração, você pode verificar se o RLS foi ativado:

```sql
-- Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'store_config';

-- Listar políticas criadas
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'store_config';
```

## 🔍 Impacto na Aplicação

- ✅ **Usuários logados**: Continuarão com acesso completo
- ✅ **Aplicação pública**: Continuará funcionando normalmente (apenas leitura)
- ✅ **Segurança**: Dados protegidos contra acesso não autorizado

## 📝 Notas Importantes

1. **Backup**: Sempre faça backup antes de aplicar migrações
2. **Teste**: Teste a aplicação após aplicar para garantir funcionamento
3. **Reversão**: Para desativar RLS, execute: `ALTER TABLE store_config DISABLE ROW LEVEL SECURITY;`

## 🚨 Solução de Problemas

Se encontrar erros:

1. **Erro de permissão**: Verifique se está logado como administrador
2. **Política não aplicada**: Verifique se as políticas foram criadas corretamente
3. **Aplicação não funciona**: Verifique se o usuário anônimo tem permissão de leitura

---

**Data de criação**: 21/01/2025  
**Arquivo de migração**: `migrations/enable_rls_store_config.sql`
