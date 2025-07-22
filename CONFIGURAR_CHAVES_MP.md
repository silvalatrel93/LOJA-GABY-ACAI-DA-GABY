# 🔑 Configure suas Chaves do Mercado Pago

## ✅ Já Configurado:
- ✅ `NEXT_PUBLIC_APP_URL` = https://pedi-facil-loja-2.vercel.app

## 🔑 Faltam 2 Chaves:

### **1️⃣ Obter Chaves do Mercado Pago:**
1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Faça login na sua conta
3. Vá em "Suas integrações" → "Criar aplicação"
4. Copie as chaves de **TESTE**:
   - **Public Key** (começa com TEST-)
   - **Access Token** (começa com TEST-)

### **2️⃣ Configurar via Terminal:**

Execute estes comandos **um por vez** no terminal:

```bash
# Comando 1: Configurar Public Key
vercel env add NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY

# Quando perguntar o valor, cole sua Public Key (TEST-xxxx...)
# Selecione: Production, Preview, Development (todas)
```

```bash
# Comando 2: Configurar Access Token  
vercel env add MERCADO_PAGO_ACCESS_TOKEN

# Quando perguntar o valor, cole seu Access Token (TEST-xxxx...)
# Selecione: Production, Preview, Development (todas)
```

```bash
# Comando 3: Fazer redeploy
vercel --prod
```

## 🎯 **Exemplo de Chaves de Teste:**
```
Public Key: TEST-12345678-1234-1234-1234-123456789012
Access Token: TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789
```

## ✅ **Após Configurar:**
1. Aguarde o deploy terminar
2. Acesse: https://pedi-facil-loja-2.vercel.app
3. Teste o pagamento online - deve funcionar!

---

**💡 Dica:** Use sempre chaves de TESTE primeiro para testar. Depois pode trocar por chaves reais.
