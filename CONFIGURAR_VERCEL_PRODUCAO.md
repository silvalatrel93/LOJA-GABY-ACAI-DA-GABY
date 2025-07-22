# 🚀 Configurar Variáveis de Ambiente na Vercel - PASSO A PASSO

## ❌ Problema Atual
```
"Chave pública do Mercado Pago não configurada"
```

## ✅ Solução Completa

### 🔐 **PASSO 1: Login na Vercel**
1. Acesse: https://vercel.com/login
2. Faça login com sua conta (GitHub, GitLab, Bitbucket ou Email)
3. Após login, você será redirecionado para o dashboard

### 📁 **PASSO 2: Encontrar o Projeto**
1. No dashboard da Vercel, procure por: **`pedi-facil-loja-2`**
2. Clique no nome do projeto para abrir

### ⚙️ **PASSO 3: Acessar Configurações**
1. No projeto, clique na aba **"Settings"** (no topo)
2. No menu lateral esquerdo, clique em **"Environment Variables"**

### 🔑 **PASSO 4: Adicionar Variáveis**

Adicione estas **3 variáveis** uma por uma:

#### **Variável 1:**
- **Name:** `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`
- **Value:** Sua chave pública do Mercado Pago (começa com TEST- para teste)
- **Environment:** Selecione **Production, Preview, Development**
- Clique **"Save"**

#### **Variável 2:**
- **Name:** `MERCADO_PAGO_ACCESS_TOKEN`
- **Value:** Seu access token do Mercado Pago (começa com TEST- para teste)
- **Environment:** Selecione **Production, Preview, Development**
- Clique **"Save"**

#### **Variável 3:**
- **Name:** `NEXT_PUBLIC_APP_URL`
- **Value:** `https://pedi-facil-loja-2.vercel.app`
- **Environment:** Selecione **Production, Preview, Development**
- Clique **"Save"**

### 🔄 **PASSO 5: Redeploy**
1. Vá para a aba **"Deployments"**
2. Clique nos **3 pontinhos (...)** do último deployment
3. Clique **"Redeploy"**
4. Aguarde o deploy terminar (1-2 minutos)

## 🎯 **Onde Obter as Chaves do Mercado Pago**

### **Para Teste (Recomendado):**
1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Faça login na sua conta Mercado Pago
3. Vá em **"Suas integrações"**
4. Clique em **"Criar aplicação"** (se não tiver)
5. Copie as chaves de **TESTE**:
   - **Public Key** (TEST-xxxx-xxxx-xxxx)
   - **Access Token** (TEST-xxxx-xxxx-xxxx)

### **Exemplo de Chaves de Teste:**
```
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=TEST-12345678-1234-1234-1234-123456789012
MERCADO_PAGO_ACCESS_TOKEN=TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789
NEXT_PUBLIC_APP_URL=https://pedi-facil-loja-2.vercel.app
```

## ✅ **Verificar se Funcionou**

1. Aguarde 2-3 minutos após o redeploy
2. Acesse: https://pedi-facil-loja-2.vercel.app
3. Vá para o checkout
4. Selecione **"💳 Pagamento Online"**
5. O modal deve abrir **SEM ERRO**

## 🔧 **Configuração do Webhook (Opcional)**

No painel do Mercado Pago, configure o webhook:
- **URL:** `https://pedi-facil-loja-2.vercel.app/api/mercado-pago/webhook`
- **Eventos:** payment

## 🆘 **Se Ainda Não Funcionar**

1. Verifique se as chaves estão corretas (sem espaços extras)
2. Confirme que selecionou todos os ambientes (Production, Preview, Development)
3. Aguarde alguns minutos após salvar as variáveis
4. Tente um hard refresh (Ctrl+F5) no navegador

---

## 📞 **Precisa de Ajuda?**

Se tiver dificuldades:
1. Tire print da tela de Environment Variables
2. Confirme que as 3 variáveis estão salvas
3. Verifique se o redeploy foi concluído com sucesso

**🎉 Após seguir estes passos, o pagamento online funcionará perfeitamente em produção!**
