# Solução para Webhook em Desenvolvimento

## Problema Identificado

O pedido PIX não aparecia no painel administrativo porque:

1. **Webhook não funciona em localhost**: O Mercado Pago não consegue enviar notificações para `localhost:3002`
2. **URL configurada para produção**: A variável `NEXT_PUBLIC_APP_URL` está configurada para `https://pedifacilloja2.vercel.app`
3. **Pedido ficou com status `pending_payment`**: Sem o webhook, o status nunca foi atualizado para `new`

## Solução Implementada

### 1. Logs Detalhados no Webhook
Adicionamos logs detalhados em `/app/api/mercado-pago/webhook/route.ts` para debug:
- 🔔 Webhook recebido
- 💳 Processando pagamento ID
- 📋 Informações do pagamento
- 🔄 Mudança de status
- ✅ Sucesso na atualização

### 2. Script de Simulação
Criamos `simulate-webhook.js` para simular o webhook em desenvolvimento:
```bash
node simulate-webhook.js
```

### 3. Script de Debug
Criamos `debug-orders.js` para verificar pedidos no banco:
```bash
node debug-orders.js
```

## Para Desenvolvimento Local

### Opção 1: Simular Webhook Manualmente
```bash
# Verificar pedidos pendentes
node debug-orders.js

# Simular webhook para pedido específico
node simulate-webhook.js
```

### Opção 2: Usar ngrok (Recomendado)
1. Instalar ngrok: `npm install -g ngrok`
2. Expor localhost: `ngrok http 3002`
3. Atualizar `.env.local`:
   ```
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```
4. Reiniciar servidor

### Opção 3: Polling de Status
Implementar verificação periódica do status do pagamento no frontend (já existe no componente PIX).

## Para Produção

Em produção, o webhook funciona normalmente porque:
- URL é acessível publicamente
- Mercado Pago consegue enviar notificações
- Processo automático funciona corretamente

## Verificação

Para verificar se está funcionando:
1. Fazer um pedido PIX
2. Verificar logs do servidor
3. Verificar se pedido aparece no painel após pagamento
4. Usar scripts de debug se necessário