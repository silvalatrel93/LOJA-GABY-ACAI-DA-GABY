# 🚀 Configuração Rápida do Mercado Pago - PediFacil

## ❌ Erro Atual
```
Error: Credenciais do Mercado Pago não configuradas para esta loja
```

## ✅ Solução Rápida

### 1️⃣ **Configurar Variáveis de Ambiente**

Abra o arquivo `.env.local` e adicione suas chaves do Mercado Pago:

```env
# Chaves do Mercado Pago (OBRIGATÓRIAS)
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=TEST-sua-chave-publica-aqui
MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-access-token-aqui

# URL da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2️⃣ **Obter Chaves do Mercado Pago**

1. **Acesse:** https://www.mercadopago.com.br/developers
2. **Faça login** na sua conta Mercado Pago
3. **Vá em:** Suas integrações → Criar aplicação
4. **Copie as chaves:**
   - **Public Key** (começa com `TEST-` para teste)
   - **Access Token** (começa com `TEST-` para teste)

### 3️⃣ **Exemplo de Configuração**

```env
# Exemplo com chaves de teste
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=TEST-12345678-1234-1234-1234-123456789012
MERCADO_PAGO_ACCESS_TOKEN=TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4️⃣ **Reiniciar o Servidor**

Após configurar as variáveis:

```bash
# Parar o servidor (Ctrl+C)
# Depois executar novamente:
npm run dev
```

## 🔧 Correções Aplicadas

### ✅ **API Simplificada Criada**
- Nova API: `/api/mercado-pago/process-payment-simple`
- Usa diretamente as variáveis de ambiente
- Não depende do banco de credenciais

### ✅ **Componente Atualizado**
- `MercadoPagoCheckout` agora usa a API simplificada
- Melhor tratamento de erros
- Mensagens mais claras

## 🎯 Próximos Passos

1. **Configure as chaves** no `.env.local`
2. **Reinicie o servidor** com `npm run dev`
3. **Teste o pagamento** no checkout
4. **Para produção:** Substitua chaves `TEST-` por chaves reais

## 🔍 Verificar se Funcionou

1. Acesse: http://localhost:3000
2. Adicione produtos ao carrinho
3. Vá para o checkout
4. Selecione "💳 Pagamento Online"
5. O modal deve abrir sem erro

## 📞 Suporte

Se ainda houver problemas:
1. Verifique se as chaves estão corretas
2. Confirme que não há espaços extras
3. Reinicie o servidor completamente
4. Verifique o console do navegador para mais detalhes

---

**🎉 Após configurar, o sistema estará 100% funcional para pagamentos online!**
