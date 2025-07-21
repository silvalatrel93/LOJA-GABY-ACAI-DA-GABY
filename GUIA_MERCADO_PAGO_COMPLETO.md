# 🚀 Guia Completo - Integração Mercado Pago PediFacil

## 📋 Visão Geral

O PediFacil agora possui integração completa com o **Mercado Pago**, permitindo que cada lojista configure suas próprias credenciais e receba pagamentos diretamente em sua conta via **PIX** e **Cartão de Crédito**.

---

## 🔐 Como Obter suas Credenciais do Mercado Pago

### 1. **Criar Conta no Mercado Pago**
- Acesse: [https://www.mercadopago.com.br](https://www.mercadopago.com.br)
- Crie sua conta empresarial
- Complete a verificação de identidade

### 2. **Acessar o Painel de Desenvolvedores**
- Vá para: [https://www.mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
- Faça login com sua conta
- Clique em **"Suas integrações"**

### 3. **Obter as Credenciais**
- Clique em **"Credenciais"**
- Você verá duas seções:
  - **Teste (Sandbox)**: Para testes
  - **Produção**: Para vendas reais

#### 📝 **Credenciais Necessárias:**
- **Public Key**: Começa com `APP_USR-` (produção) ou `TEST-` (teste)
- **Access Token**: Começa com `APP_USR-` (produção) ou `TEST-` (teste)

### 4. **Configurar Chave PIX (Opcional)**
- No app do Mercado Pago ou site
- Vá em **"Pix"** → **"Minhas chaves"**
- Cadastre uma chave PIX (CPF, CNPJ, email ou chave aleatória)

---

## ⚙️ Como Configurar no PediFacil

### 1. **Acessar o Painel Admin**
- Entre no painel administrativo do PediFacil
- Vá em **"Mercado Pago"** no menu lateral

### 2. **Configurar Credenciais**
- Clique na aba **"Configurações"**
- Preencha os campos:
  - **Public Key**: Cole sua chave pública
  - **Access Token**: Cole seu token de acesso
  - **Chave PIX**: Cole sua chave PIX (opcional)
  - **Ambiente**: Escolha "Teste" ou "Produção"

### 3. **Validar e Salvar**
- Clique em **"Validar Credenciais"**
- Se válidas, clique em **"Salvar Credenciais"**
- ✅ Pronto! Mercado Pago configurado

---

## 💳 Formas de Pagamento Disponíveis

### 🔵 **PIX**
- **Instantâneo**: Pagamento aprovado em segundos
- **24/7**: Funciona todos os dias, qualquer horário
- **Sem taxas adicionais**: Para o cliente
- **QR Code**: Cliente escaneia ou copia código

### 💳 **Cartão de Crédito**
- **Principais bandeiras**: Visa, Mastercard, Elo, etc.
- **Parcelamento**: Até 12x sem juros (configurável)
- **Aprovação**: Instantânea ou pendente
- **Segurança**: Tokenização e criptografia

---

## 🔄 Fluxo de Pagamento

### **Para o Cliente:**
1. Finaliza pedido no PediFacil
2. Escolhe: PIX ou Cartão
3. **PIX**: Escaneia QR Code ou copia código
4. **Cartão**: Preenche dados do cartão
5. Confirma pagamento
6. Recebe confirmação

### **Para o Lojista:**
1. Cliente faz pedido
2. Pagamento processado automaticamente
3. Status atualizado em tempo real
4. Dinheiro cai na conta do Mercado Pago
5. Transferência automática para conta bancária

---

## 📊 Monitoramento e Relatórios

### **Dashboard Mercado Pago**
- **Transações em tempo real**
- **Estatísticas de aprovação**
- **Volume de vendas**
- **Métodos de pagamento mais usados**

### **Informações Disponíveis:**
- ✅ **Aprovadas**: Pagamentos confirmados
- ⏳ **Pendentes**: Aguardando confirmação
- ❌ **Rejeitadas**: Pagamentos negados
- 💰 **Valores**: Total e por status

---

## 🛡️ Segurança

### **Criptografia de Dados**
- Credenciais criptografadas no banco
- Tokens seguros para comunicação
- Dados sensíveis mascarados

### **Validação de Credenciais**
- Teste automático antes de salvar
- Verificação de formato
- Ambiente sandbox para testes

### **Webhook Seguro**
- Notificações automáticas
- Validação de origem
- Atualização de status em tempo real

---

## 🧪 Modo Teste (Sandbox)

### **Para que serve:**
- Testar a integração sem cobranças reais
- Validar fluxos de pagamento
- Treinar equipe

### **Como usar:**
1. Configure credenciais de **TESTE**
2. Ative **"Modo Sandbox"**
3. Use cartões de teste do Mercado Pago
4. PIX de teste funciona normalmente

### **Cartões de Teste:**
```
Visa: 4509 9535 6623 3704
Mastercard: 5031 7557 3453 0604
CVV: 123
Validade: Qualquer data futura
```

---

## 💰 Taxas e Tarifas

### **PIX:**
- **Taxa Mercado Pago**: ~0,99% por transação
- **Sem taxa adicional**: Para o cliente
- **Recebimento**: D+1 (dia seguinte)

### **Cartão de Crédito:**
- **Taxa Mercado Pago**: ~2,99% a 4,99%
- **Parcelamento**: Taxas adicionais conforme prazo
- **Recebimento**: D+14 ou D+30

### **Transferência:**
- **Automática**: Para conta bancária cadastrada
- **Manual**: Disponível no app/site MP
- **Sem taxa**: Para transferências acima de R$ 1,00

---

## 🔧 Solução de Problemas

### **Credenciais Inválidas**
- ✅ Verifique se copiou corretamente
- ✅ Confirme se é produção ou teste
- ✅ Verifique se conta está ativa

### **Pagamento Não Aprovado**
- ✅ Verifique dados do cartão
- ✅ Confirme limite disponível
- ✅ Tente outro método de pagamento

### **PIX Não Funciona**
- ✅ Confirme se tem chave PIX cadastrada
- ✅ Verifique se conta está verificada
- ✅ Teste com valor menor

### **Webhook Não Atualiza**
- ✅ Verifique URL do webhook
- ✅ Confirme se servidor está acessível
- ✅ Teste conectividade

---

## 📞 Suporte

### **Mercado Pago:**
- **Central de Ajuda**: [https://www.mercadopago.com.br/ajuda](https://www.mercadopago.com.br/ajuda)
- **Chat**: Disponível no painel
- **WhatsApp**: (11) 4003-4031

### **PediFacil:**
- **Documentação**: Este guia
- **Suporte Técnico**: Via sistema
- **Atualizações**: Automáticas

---

## 🚀 Próximos Passos

### **Após Configurar:**
1. ✅ Teste com pagamento real pequeno
2. ✅ Configure transferências automáticas
3. ✅ Monitore primeiras transações
4. ✅ Treine equipe no novo fluxo

### **Otimizações:**
- Configure parcelamento sem juros
- Ative notificações por email/SMS
- Analise relatórios semanalmente
- Ajuste métodos conforme demanda

---

## 📈 Benefícios da Integração

### **Para o Lojista:**
- 💰 **Mais vendas**: PIX + Cartão
- ⚡ **Recebimento rápido**: D+1 para PIX
- 🛡️ **Segurança**: Dados protegidos
- 📊 **Relatórios**: Análises detalhadas

### **Para o Cliente:**
- 🔵 **PIX instantâneo**: Pagamento em segundos
- 💳 **Parcelamento**: Até 12x sem juros
- 🛡️ **Segurança**: Mercado Pago confiável
- 📱 **Facilidade**: Interface simples

---

## ✅ Checklist de Implementação

- [ ] Conta Mercado Pago criada e verificada
- [ ] Credenciais obtidas (Public Key + Access Token)
- [ ] Chave PIX cadastrada (opcional)
- [ ] Credenciais configuradas no PediFacil
- [ ] Teste realizado em ambiente sandbox
- [ ] Pagamento real de teste executado
- [ ] Equipe treinada no novo fluxo
- [ ] Monitoramento ativo no dashboard

---

## 🎯 Conclusão

A integração com o Mercado Pago transforma o PediFacil em uma solução completa de pagamentos, oferecendo:

- **Autonomia**: Cada lojista controla suas credenciais
- **Flexibilidade**: PIX e Cartão de Crédito
- **Segurança**: Dados criptografados e protegidos
- **Facilidade**: Interface intuitiva e documentação completa

**🚀 Comece hoje mesmo e aumente suas vendas com pagamentos digitais!**

---

*Última atualização: Janeiro 2025*
*Versão: 1.0*
