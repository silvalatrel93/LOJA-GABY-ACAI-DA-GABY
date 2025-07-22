# 🔧 Configuração Manual das Variáveis

## Execute estes comandos um por vez:

### 1. Chave Pública:
```bash
vercel env add NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY
```
**Valor:** `APP_USR-437a54b5-6505-4818-810d-ba940abbcfdf`
**Ambientes:** Production, Preview, Development (todos)

### 2. Access Token:
```bash
vercel env add MERCADO_PAGO_ACCESS_TOKEN  
```
**Valor:** `APP_USR-2948657089177648-072209-a5258db660a5157153e8dc81ca772eb9-244845124`
**Ambientes:** Production, Preview, Development (todos)

### 3. URL da App:
```bash
vercel env add NEXT_PUBLIC_APP_URL
```
**Valor:** `https://pedifacilloja2.vercel.app`
**Ambientes:** Production, Preview, Development (todos)

### 4. Redeploy:
```bash
vercel --prod
```

## ✅ Verificar:
Após configurar, acesse: https://pedifacilloja2.vercel.app/checkout
