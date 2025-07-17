# Guia de Configuração - Mercado Pago

## 📋 Visão Geral

Este guia explica como configurar o sistema de pagamento online do Mercado Pago que foi implementado no sistema HEAI AÇAÍ.

## 🚀 Funcionalidades Implementadas

### ✅ APIs Backend

- **Create Preference**: `/api/mercado-pago/create-preference`
- **Process Payment**: `/api/mercado-pago/process-payment`
- **Webhook**: `/api/mercado-pago/webhook`

### ✅ Frontend

- **Payment Brick**: Componente completo de pagamento
- **Páginas de resultado**: Success, Pending, Failure
- **Integração no checkout**: Nova opção "Pagamento Online"

### ✅ Métodos de Pagamento Suportados

- 💳 Cartão de Crédito/Débito
- 🏦 Pix
- 📄 Boleto Bancário
- 💰 Saldo Mercado Pago

## ⚙️ Configuração

### 1. Criar Conta no Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma conta ou faça login
3. Vá para "Suas integrações" > "Criar aplicação"
4. Escolha "Pagamentos online"
5. Preencha os dados da aplicação

### 2. Obter Credenciais

**🧪 IMPORTANTE: Use SEMPRE chaves de TESTE primeiro!**

No painel do Mercado Pago (https://www.mercadopago.com.br/developers/panel):

#### **🧪 Ambiente de TESTE (para desenvolvimento):**

- Procure por **"Credenciais de teste"** ou **"Test credentials"**
- Public Key: `TEST-xxxxxxxx`
- Access Token: `TEST-xxxxxxxx`
- ✅ Permite usar cartões fictícios
- ✅ Sem cobrança real

#### **🚀 Ambiente de PRODUÇÃO (apenas para loja funcionando):**

- Procure por **"Credenciais de produção"**
- Public Key: `APP_USR-xxxxxxxx`
- Access Token: `APP_USR-xxxxxxxx`
- ⚠️ Cartões reais, cobrança real!

### 3. Configurar Variáveis de Ambiente

**Para DESENVOLVIMENTO, copie `.env.example` para `.env.local`:**

```env
# 🧪 MERCADO PAGO - AMBIENTE DE TESTE
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=TEST-sua-public-key-de-teste
MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-access-token-de-teste

# Webhook Secret (opcional para teste, obrigatório para produção)
MERCADO_PAGO_WEBHOOK_SECRET=meu_secret_de_teste_123

# URL (deixe vazio para localhost)
NEXT_PUBLIC_APP_URL=
```

**Para PRODUÇÃO (hospedagem):**

```env
# 🚀 MERCADO PAGO - AMBIENTE DE PRODUÇÃO
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=APP_USR-sua-public-key-real
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-seu-access-token-real
MERCADO_PAGO_WEBHOOK_SECRET=seu-webhook-secret

# URL pública da sua loja
NEXT_PUBLIC_APP_URL=https://seudominio.com
```

### 4. Configurar Webhook Secret

#### **🧪 Para DESENVOLVIMENTO:**

Use qualquer string ou deixe vazio:

```env
MERCADO_PAGO_WEBHOOK_SECRET=meu_secret_de_teste_123
```

#### **🚀 Para PRODUÇÃO:**

1. **Acesse:** https://www.mercadopago.com.br/developers/panel
2. **Vá em:** "Webhooks" ou "Notificações"
3. **Clique:** "Criar webhook"
4. **Configure:**
   - **URL:** `https://seudominio.com/api/mercado-pago/webhook`
   - **Eventos:** Selecione "Pagamentos" (`payment`)
5. **Copie o Secret** gerado automaticamente
6. **Adicione no `.env`:**
   ```env
   MERCADO_PAGO_WEBHOOK_SECRET=wh_secret_gerado_pelo_mp
   ```

> ⚠️ **Importante:** O webhook só funciona com URLs públicas (HTTPS). Em localhost, as notificações não chegam, mas o pagamento funciona normalmente.

### 5. URLs de Webhook

Configure no painel do Mercado Pago:

- **URL do Webhook**: `https://seu-dominio.com/api/mercado-pago/webhook`
- **Eventos**: `payment`

## 🧪 Como Testar

### 1. Testar em Desenvolvimento

```bash
# Instalar dependências (se ainda não instalou)
pnpm install

# Iniciar servidor de desenvolvimento
pnpm dev
```

### 2. Cartões de Teste

Use estes cartões **específicos do Mercado Pago Brasil** para testar:

#### **✅ CARTÕES QUE APROVAM:**

**Visa:**

- Número: `4235 6477 2802 5682`
- CVV: `123`
- Validade: `11/25`
- Nome: `APRO`

**Mastercard:**

- Número: `5031 4332 1540 6351`
- CVV: `123`
- Validade: `11/25`
- Nome: `APRO`

#### **❌ CARTÕES QUE REJEITAM (para testar erros):**

**Fundos Insuficientes:**

- Número: `4013 5406 8274 6260`
- Nome: `OTHE`

**Rejeitado por Fraude:**

- Número: `4509 9535 6623 3704`
- Nome: `OTHE`

> ⚠️ **Importante**: Use exatamente estes números e nomes. Outros cartões podem causar erro de "alto risco".

### 3. Fluxo de Teste

1. Adicione produtos ao carrinho
2. Vá para checkout
3. Preencha dados obrigatórios
4. Selecione "💳 Pagamento Online"
5. Use um cartão de teste
6. Verifique as páginas de resultado

## 📱 Como Usar

### Para o Cliente

1. **Selecionar Pagamento Online**: No checkout, escolher a opção "💳 Pagamento Online"
2. **Preencher Dados**: O formulário do Mercado Pago aparece automaticamente
3. **Escolher Método**: Cartão, Pix, Boleto, etc.
4. **Confirmar Pagamento**: Seguir as instruções na tela
5. **Acompanhar Status**: Páginas automáticas de resultado

### Para o Administrador

1. **Webhook**: Recebe notificações automáticas de pagamento
2. **Logs**: Verificar logs no console para debug
3. **Status**: Acompanhar status dos pagamentos no painel MP

## 🔧 Estrutura dos Arquivos

```
├── app/api/mercado-pago/
│   ├── create-preference/route.ts    # Criar preferências
│   ├── process-payment/route.ts      # Processar pagamentos
│   └── webhook/route.ts              # Receber notificações
├── app/checkout/
│   ├── success/page.tsx              # Página de sucesso
│   ├── pending/page.tsx              # Página de pendente
│   └── failure/page.tsx              # Página de falha
├── components/
│   └── mercado-pago-checkout.tsx     # Componente principal
└── env.example                       # Variáveis de ambiente
```

## 🐛 Troubleshooting

### Erro: Chave pública não configurada

```
Erro: NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY não está definido
```

**Solução**: Verificar se a variável está no `.env.local`

### Erro: Access Token inválido

```
Erro: Invalid access token
```
