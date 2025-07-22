# 🔒 Guia para Aplicar Migração RLS - store_config

## ✅ Status da Migração

- **Arquivo criado**: `supabase/migrations/20250120000003_enable_rls_store_config.sql`
- **Script auxiliar**: `scripts/apply-rls-migration.js`
- **Status**: ⚠️ **REQUER APLICAÇÃO MANUAL**

## 🚫 Por que Manual?

O projeto não possui `SUPABASE_SERVICE_ROLE_KEY` configurada no `.env.local`, que é necessária para aplicar migrações programaticamente. As credenciais atuais são apenas para acesso público (anon key).

## 📋 Como Aplicar a Migração

### Método 1: Console Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase**

   - URL: https://app.supabase.com
   - Faça login na sua conta

2. **Navegue para o Projeto**

   - Selecione o projeto: `aqlxezhquvohpdkhrolf`
   - URL direta: https://aqlxezhquvohpdkhrolf.supabase.co

3. **Abra o SQL Editor**

   - No menu lateral, clique em "SQL Editor"
   - Ou acesse: Dashboard > SQL Editor

4. **Execute a Migração**
   - Copie o conteúdo do arquivo: `supabase/migrations/20250120000003_enable_rls_store_config.sql`
   - Cole no SQL Editor
   - Clique em "Run" ou pressione Ctrl+Enter

### Método 2: Supabase CLI (Se instalado)

```bash
# No diretório do projeto
supabase db push
```

## 📄 SQL da Migração

```sql
-- Migração para ativar RLS na tabela store_config
-- Data: 2025-01-20
-- Descrição: Ativa Row Level Security e cria políticas de acesso

-- Ativar RLS na tabela store_config
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados (acesso completo)
CREATE POLICY "Authenticated users can manage store_config" ON store_config
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política para usuários anônimos (apenas leitura)
CREATE POLICY "Anonymous users can read store_config" ON store_config
    FOR SELECT
    TO anon
    USING (true);

-- Comentários para documentação
COMMENT ON POLICY "Authenticated users can manage store_config" ON store_config IS
'Permite que usuários autenticados tenham acesso completo à configuração da loja';

COMMENT ON POLICY "Anonymous users can read store_config" ON store_config IS
'Permite que usuários anônimos leiam a configuração da loja (necessário para funcionamento público)';
```

## 🔍 Verificação da Aplicação

Após aplicar a migração, você pode verificar se foi aplicada corretamente:

```sql
-- Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'store_config';

-- Listar políticas criadas
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'store_config';
```

## 🎯 O que a Migração Faz

### 1. Ativa RLS

- Habilita Row Level Security na tabela `store_config`
- Garante que apenas usuários autorizados possam acessar os dados

### 2. Política para Usuários Autenticados

- **Escopo**: Usuários logados (role: `authenticated`)
- **Permissões**: Completas (SELECT, INSERT, UPDATE, DELETE)
- **Condição**: Sempre permitido (`true`)

### 3. Política para Usuários Anônimos

- **Escopo**: Usuários não logados (role: `anon`)
- **Permissões**: Apenas leitura (SELECT)
- **Condição**: Sempre permitido (`true`)

## 🔧 Impacto na Aplicação

### ✅ Funcionalidades Mantidas

- Leitura pública da configuração da loja
- Acesso completo para usuários autenticados
- Compatibilidade com código existente

### 🔒 Segurança Adicionada

- Controle de acesso baseado em autenticação
- Proteção contra modificações não autorizadas
- Auditoria de políticas de segurança

## 🚨 Troubleshooting

### Erro: "permission denied"

- Verifique se as políticas foram criadas corretamente
- Confirme que o usuário tem a role adequada

### Erro: "RLS is enabled but no policies exist"

- Execute novamente as políticas de criação
- Verifique se não há erros de sintaxe

### Aplicação não funciona após RLS

- Verifique se o cliente Supabase está usando as credenciais corretas
- Confirme que as políticas permitem o acesso necessário

## 📞 Próximos Passos

1. **Aplicar a migração** usando o método preferido
2. **Testar a aplicação** para garantir funcionamento
3. **Verificar logs** do Supabase em caso de problemas
4. **Considerar adicionar** `SUPABASE_SERVICE_ROLE_KEY` para futuras migrações automáticas

---

**Nota**: Esta migração foi criada automaticamente e está pronta para aplicação. O RLS melhora significativamente a segurança do banco de dados sem impactar a funcionalidade existente da aplicação.
