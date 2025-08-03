# 💰 Documentação do Sistema de Troco - Pagamento em Dinheiro

## 📌 Visão Geral
O sistema de troco do PediFacil permite o cálculo automático do valor do troco quando o cliente opta por pagar em dinheiro. Esta funcionalidade está integrada ao fluxo de checkout e oferece uma experiência intuitiva tanto para clientes quanto para administradores.

## 🏗️ Estrutura de Arquivos

```
app/
  checkout/
    page.tsx            # Página principal de checkout
    components/
      money-payment.tsx # Componente de pagamento em dinheiro
      
lib/
  utils/
    currency.ts        # Funções de formatação monetária
  types/
    order.ts           # Tipos relacionados a pedidos e pagamentos
```

## 📋 Funcionalidades Principais

### 1. Cálculo Automático de Troco
- Cálculo em tempo real do valor do troco
- Validação do valor pago (deve ser maior ou igual ao total)
- Formatação monetária automática

### 2. Interface do Usuário
- Campo para inserção do valor pago
- Exibição do troco calculado
- Feedback visual para valores inválidos

### 3. Integração com Pedido
- Armazenamento do valor pago e troco no pedido
- Histórico de transações
- Relatórios financeiros

## 🛠️ Implementação Técnica

### 1. Estados do Componente

```typescript
// Estados para controle do pagamento em dinheiro
const [valorPago, setValorPago] = useState<number | ''>('')
const [mostrarCampoTroco, setMostrarCampoTroco] = useState(false)
const [troco, setTroco] = useState<number>(0)
const [erroTroco, setErroTroco] = useState<string>('')
```

### 2. Cálculo do Troco

```typescript
const calcularTroco = (valorPago: number, valorTotal: number): number => {
  // Arredonda para 2 casas decimais para evitar problemas de ponto flutuante
  return Math.round((valorPago - valorTotal) * 100) / 100
}
```

### 3. Validação do Valor Pago

```typescript
const validarValorPago = (valor: string): boolean => {
  const valorNumerico = parseFloat(valor)
  
  if (isNaN(valorNumerico)) {
    setErroTroco('Por favor, insira um valor numérico válido')
    return false
  }
  
  if (valorNumerico < valorTotal) {
    setErroTroco('O valor pago deve ser maior ou igual ao total')
    return false
  }
  
  setErroTroco('')
  return true
}
```

### 4. Componente de Pagamento em Dinheiro

```tsx
function MoneyPayment({
  valorTotal,
  onPaymentChange,
}: {
  valorTotal: number
  onPaymentChange: (valor: number, troco: number) => void
}) {
  const [valorPago, setValorPago] = useState<number | ''>('')
  const [troco, setTroco] = useState<number>(0)
  const [erro, setErro] = useState('')

  const handleValorPagoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setValorPago(valor === '' ? '' : parseFloat(valor))
    
    if (valor === '') {
      setTroco(0)
      setErro('')
      return
    }
    
    const valorNumerico = parseFloat(valor)
    
    if (isNaN(valorNumerico)) {
      setErro('Por favor, insira um valor numérico válido')
      return
    }
    
    if (valorNumerico < valorTotal) {
      setErro('O valor pago deve ser maior ou igual ao total')
      setTroco(0)
      onPaymentChange(valorNumerico, 0)
      return
    }
    
    const trocoCalculado = calcularTroco(valorNumerico, valorTotal)
    setTroco(trocoCalculado)
    setErro('')
    onPaymentChange(valorNumerico, trocoCalculado)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="valorPago">Valor pago em dinheiro</Label>
        <Input
          id="valorPago"
          type="number"
          min={valorTotal}
          step="0.01"
          value={valorPago}
          onChange={handleValorPagoChange}
          placeholder={`Mínimo: ${formatCurrency(valorTotal)}`}
          className={erro ? 'border-red-500' : ''}
        />
        {erro && <p className="text-sm text-red-500 mt-1">{erro}</p>}
      </div>
      
      {troco > 0 && (
        <div className="bg-green-50 p-3 rounded-md">
          <p className="text-green-700 font-medium">
            Troco: {formatCurrency(troco)}
          </p>
        </div>
      )}
    </div>
  )
}
```

## 🎨 Interface do Usuário

### 1. Seleção de Pagamento em Dinheiro

```tsx
<RadioGroupItem value="money" id="money" className="peer sr-only" />
<Label
  htmlFor="money"
  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
>
  <DollarSign className="mb-3 h-6 w-6" />
  <span>Dinheiro</span>
  <span className="text-xs text-muted-foreground mt-1">
    Informe o valor pago
  </span>
</Label>
```

### 2. Campo de Valor Pago

```tsx
<div className="mt-4">
  <Label htmlFor="valorPago">Valor pago em dinheiro</Label>
  <Input
    id="valorPago"
    type="number"
    min={valorTotal}
    step="0.01"
    value={valorPago}
    onChange={handleValorPagoChange}
    placeholder={`Mínimo: ${formatCurrency(valorTotal)}`}
    className={erroTroco ? 'border-red-500' : ''}
  />
  {erroTroco && (
    <p className="text-sm text-red-500 mt-1">{erroTroco}</p>
  )}
</div>
```

### 3. Exibição do Troco

```tsx
{troco > 0 && (
  <div className="bg-green-50 p-3 rounded-md mt-4">
    <p className="text-green-700 font-medium">
      Troco: {formatCurrency(troco)}
    </p>
  </div>
)}
```

## 🔄 Fluxo de Funcionamento

1. **Seleção do Método de Pagamento**
   - Cliente seleciona "Dinheiro" como forma de pagamento
   - O campo para inserir o valor pago é exibido

2. **Inserção do Valor Pago**
   - Cliente digita o valor que irá pagar
   - O sistema valida se o valor é numérico e maior ou igual ao total
   - O troco é calculado e exibido automaticamente

3. **Finalização do Pedido**
   - Ao confirmar o pedido, os valores são salvos
   - O troco é registrado junto com os dados do pedido
   - O pedido é enviado para preparo

## 🔒 Validações

1. **Valor Mínimo**
   - O valor pago não pode ser menor que o total do pedido
   - Mensagem de erro é exibida caso o valor seja insuficiente

2. **Formato do Valor**
   - Apenas valores numéricos são aceitos
   - Valores negativos são bloqueados
   - Duas casas decimais são suportadas

3. **Feedback Visual**
   - Borda vermelha para valores inválidos
   - Mensagens de erro claras
   - Confirmação visual quando o troco é calculado

## 📊 Armazenamento dos Dados

Os dados do pagamento são armazenados no objeto do pedido:

```typescript
interface Order {
  // ... outros campos
  payment: {
    method: 'money' | 'pix' | 'card'
    amount: number      // Valor pago
    change?: number     // Troco (apenas para pagamento em dinheiro)
    status: 'pending' | 'paid' | 'canceled'
  }
}
```

## 📱 Experiência do Usuário

### Mobile
- Teclado numérico otimizado para dispositivos móveis
- Máscara de formatação monetária
- Botões de incremento/decremento para facilitar a digitação

### Desktop
- Foco automático no campo de valor pago
- Navegação por teclado
- Dicas visuais para melhor usabilidade

## 🛠️ Manutenção

### Atualizações Recomendadas
- Atualizar bibliotecas de formatação monetária
- Revisar taxas e arredondamentos
- Manter documentação atualizada

### Monitoramento
- Logs de erros de validação
- Métricas de uso do pagamento em dinheiro
- Feedback dos usuários

## 📝 Conclusão

O sistema de troco do PediFacil oferece uma solução completa para gerenciar pagamentos em dinheiro, com cálculo automático de troco e validações robustas. Sua implementação é flexível o suficiente para atender diferentes necessidades de negócio, mantendo uma experiência de usuário simples e intuitiva.

Para suporte técnico ou dúvidas adicionais, entre em contato com a equipe de desenvolvimento.

---
*Documentação atualizada em: 30/07/2025*
*Versão: 1.0.0*
