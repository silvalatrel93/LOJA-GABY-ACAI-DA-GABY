# Scripts de Automação - Mercado Pago

Esta pasta contém scripts automatizados para facilitar a configuração, teste e manutenção da integração do Mercado Pago no PediFacil.

## 📁 Scripts Disponíveis

### 🚀 `mercado-pago-setup.js` - Script Principal
**O script mais importante - execute este primeiro!**

```bash
# Setup completo (recomendado)
node scripts/mercado-pago-setup.js full

# Verificação rápida do status
node scripts/mercado-pago-setup.js status

# Executar testes
node scripts/mercado-pago-setup.js test
```

**O que faz:**
- ✅ Verifica estrutura de arquivos
- ✅ Instala dependências necessárias
- ✅ Configura variáveis de ambiente
- ✅ Aplica migração do banco de dados
- ✅ Executa verificações de integridade
- ✅ Fornece relatório completo do status

---

### 🔧 `setup-mercado-pago-env.js` - Configuração de Ambiente

```bash
# Configurar variáveis de ambiente
node scripts/setup-mercado-pago-env.js setup

# Mostrar configuração atual
node scripts/setup-mercado-pago-env.js show

# Verificar se configuração está completa
node scripts/setup-mercado-pago-env.js check
```

**O que faz:**
- 🔐 Gera chave de criptografia automática
- 🔔 Gera webhook secret
- 🌐 Configura URL da aplicação
- 📝 Cria/atualiza arquivo `.env.local`
- ✅ Valida configuração

---

### 🗄️ `apply-mercado-pago-migration.js` - Migração do Banco

```bash
# Aplicar migração
node scripts/apply-mercado-pago-migration.js apply

# Verificar status da migração
node scripts/apply-mercado-pago-migration.js status
```

**O que faz:**
- 📊 Cria tabelas `mercado_pago_credentials` e `mercado_pago_transactions`
- 🔧 Aplica triggers e índices
- ✅ Verifica integridade das tabelas
- 🔍 Fornece status detalhado

---

### 🧪 `test-mercado-pago-integration.js` - Testes Automatizados

```bash
# Executar todos os testes
node scripts/test-mercado-pago-integration.js

# Definir URL personalizada
TEST_BASE_URL=https://meusite.com node scripts/test-mercado-pago-integration.js
```

**O que testa:**
- 💾 Salvar/buscar credenciais
- 💰 Criar pagamento PIX
- 📊 Buscar transações
- 🔔 Webhook de notificações
- 🗑️ Limpeza de dados de teste

---

### 🌱 `seed-mercado-pago-data.js` - Dados de Teste

```bash
# Gerar dados de teste
node scripts/seed-mercado-pago-data.js
```

**O que faz:**
- 📊 Gera credenciais de teste
- 💰 Cria transações de exemplo
- 📄 Gera arquivo SQL para aplicar no banco
- 📈 Calcula estatísticas dos dados

---

### 🧪 `test-mercado-pago-mcp.js` - Testes via MCP

```bash
# Executar testes simulados
node scripts/test-mercado-pago-mcp.js test

# Ver status da migração
node scripts/test-mercado-pago-mcp.js status
```

**O que testa:**
- 🗄️ Estrutura do banco de dados
- 📊 Simulação de operações
- ⚡ Performance dos índices
- ✅ Validação da migração

---

### 🎯 `final-test-integration.js` - Teste Final Completo

```bash
# Teste final end-to-end
node scripts/final-test-integration.js
```

**O que testa:**
- 🔑 Credenciais configuradas
- 📊 APIs de transações
- 🔍 Filtros e paginação
- 🔔 Webhooks funcionando
- ⚡ Performance básica
- 📈 Estatísticas completas

---

## 🚀 Guia de Uso Rápido

### Para Primeira Configuração:

```bash
# 1. Execute o setup completo
node scripts/mercado-pago-setup.js full

# 2. Edite o .env.local com suas credenciais reais
# (Consulte GUIA_MERCADO_PAGO_COMPLETO.md)

# 3. Inicie o servidor
npm run dev

# 4. Execute os testes
node scripts/test-mercado-pago-integration.js
```

### Para Verificação Rápida:

```bash
# Verificar status atual
node scripts/mercado-pago-setup.js status
```

### Para Resolução de Problemas:

```bash
# Verificar configuração
node scripts/setup-mercado-pago-env.js check

# Verificar banco de dados
node scripts/apply-mercado-pago-migration.js status

# Testar integração
node scripts/test-mercado-pago-integration.js
```

---

## 📋 Pré-requisitos

- ✅ Node.js instalado
- ✅ Projeto PediFacil configurado
- ✅ Credenciais do Supabase
- ✅ Conta no Mercado Pago (para credenciais reais)

---

## 🔧 Variáveis de Ambiente Necessárias

O script de setup criará automaticamente estas variáveis no `.env.local`:

```env
# Criptografia (gerada automaticamente)
ENCRYPTION_KEY=sua_chave_de_32_caracteres_hex

# Mercado Pago
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=TEST-sua-chave-publica
MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret

# Aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (configure manualmente)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

---

## 🐛 Solução de Problemas Comuns

### ❌ "Arquivo de migração não encontrado"
**Solução:** Certifique-se de que o arquivo `supabase/migrations/20250121000000_create_mercado_pago_credentials.sql` existe.

### ❌ "SUPABASE_URL não encontrada"
**Solução:** Configure suas credenciais do Supabase no `.env.local`.

### ❌ "Servidor não está acessível"
**Solução:** Inicie o servidor com `npm run dev` antes de executar os testes.

### ❌ "Credenciais do Mercado Pago inválidas"
**Solução:** Substitua as credenciais de teste pelas suas credenciais reais do Mercado Pago.

---

## 📊 Códigos de Saída

- `0` - Sucesso
- `1` - Erro fatal
- Scripts individuais podem ter códigos específicos

---

## 🔗 Arquivos Relacionados

- 📖 `../GUIA_MERCADO_PAGO_COMPLETO.md` - Guia completo para lojistas
- 📖 `../RESUMO_INTEGRACAO_MERCADO_PAGO.md` - Resumo técnico
- 🗄️ `../supabase/migrations/20250121000000_create_mercado_pago_credentials.sql` - Migração do banco
- ⚙️ `../.env.local` - Variáveis de ambiente (criado automaticamente)

---

## 💡 Dicas

1. **Execute sempre o script principal primeiro:** `mercado-pago-setup.js full`
2. **Use verificação rápida para debug:** `mercado-pago-setup.js status`
3. **Teste regularmente:** Execute os testes após mudanças
4. **Mantenha credenciais seguras:** Nunca commite o `.env.local`
5. **Consulte os logs:** Scripts fornecem feedback detalhado

---

## 🆘 Suporte

Se encontrar problemas:

1. 📖 Consulte `GUIA_MERCADO_PAGO_COMPLETO.md`
2. 🔍 Execute `node scripts/mercado-pago-setup.js status`
3. 🧪 Execute os testes para identificar o problema
4. 📝 Verifique os logs detalhados dos scripts

---

**✨ Scripts criados para automatizar e simplificar a integração do Mercado Pago no PediFacil!**
