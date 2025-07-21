'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MercadoPagoPayment } from '@/components/mercado-pago-payment';
import { useMercadoPago } from '@/hooks/use-mercado-pago';
import { 
  CreditCard, 
  QrCode, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  document?: string;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    zipCode: string;
  };
}

interface CheckoutWithMercadoPagoProps {
  lojaId: string;
  items: CheckoutItem[];
  customerData: CustomerData;
  deliveryFee?: number;
  onOrderComplete?: (orderData: any) => void;
}

export function CheckoutWithMercadoPago({
  lojaId,
  items,
  customerData,
  deliveryFee = 0,
  onOrderComplete
}: CheckoutWithMercadoPagoProps) {
  const [paymentMethod, setPaymentMethod] = useState<'traditional' | 'mercado_pago'>('traditional');
  const [orderStatus, setOrderStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [orderData, setOrderData] = useState<any>(null);

  const { isConfigured, isSandbox, loading: mpLoading } = useMercadoPago(lojaId);

  // Calcular totais
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + deliveryFee;

  // Gerar ID único para o pedido
  const generateOrderId = () => {
    return `pedido-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Processar pedido tradicional (dinheiro)
  const handleTraditionalOrder = async () => {
    setOrderStatus('processing');
    
    try {
      const orderId = generateOrderId();
      const order = {
        id: orderId,
        items,
        customer: customerData,
        subtotal,
        deliveryFee,
        total,
        paymentMethod: 'money',
        status: 'new',
        createdAt: new Date().toISOString(),
      };

      // Aqui você salvaria o pedido no banco de dados
      // await saveOrder(order);

      setOrderData(order);
      setOrderStatus('completed');
      onOrderComplete?.(order);
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      setOrderStatus('failed');
    }
  };

  // Callback para sucesso do pagamento MP
  const handleMercadoPagoSuccess = (paymentResult: any) => {
    const orderId = generateOrderId();
    const order = {
      id: orderId,
      items,
      customer: customerData,
      subtotal,
      deliveryFee,
      total,
      paymentMethod: 'mercado_pago',
      paymentData: paymentResult,
      status: paymentResult.status === 'approved' ? 'paid' : 'pending_payment',
      createdAt: new Date().toISOString(),
    };

    setOrderData(order);
    setOrderStatus('completed');
    onOrderComplete?.(order);
  };

  // Callback para erro do pagamento MP
  const handleMercadoPagoError = (error: string) => {
    console.error('Erro no pagamento Mercado Pago:', error);
    setOrderStatus('failed');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Mostrar resultado do pedido
  if (orderStatus === 'completed' && orderData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            Pedido Realizado com Sucesso!
          </CardTitle>
          <CardDescription>
            Seu pedido foi processado e será preparado em breve.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Número do Pedido:</strong> {orderData.id}
            </div>
            <div>
              <strong>Total:</strong> {formatCurrency(orderData.total)}
            </div>
            <div>
              <strong>Forma de Pagamento:</strong> 
              {orderData.paymentMethod === 'mercado_pago' ? (
                <Badge className="ml-2">
                  {orderData.paymentData?.payment_method_id === 'pix' ? 'PIX' : 'Cartão'}
                </Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">Dinheiro</Badge>
              )}
            </div>
            <div>
              <strong>Status:</strong> 
              <Badge 
                className="ml-2"
                variant={orderData.status === 'paid' ? 'default' : 'secondary'}
              >
                {orderData.status === 'paid' ? 'Pago' : 
                 orderData.status === 'pending_payment' ? 'Aguardando Pagamento' : 'Novo'}
              </Badge>
            </div>
          </div>

          {orderData.paymentMethod === 'mercado_pago' && orderData.paymentData?.pix && (
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                {orderData.paymentData.status === 'pending' ? 
                  'Complete o pagamento PIX para confirmar seu pedido.' :
                  'Pagamento PIX confirmado com sucesso!'
                }
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={() => window.location.reload()} 
            className="w-full"
          >
            Fazer Novo Pedido
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Mostrar erro
  if (orderStatus === 'failed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            Erro ao Processar Pedido
          </CardTitle>
          <CardDescription>
            Ocorreu um erro ao processar seu pedido. Tente novamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setOrderStatus('pending')} 
            className="w-full"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Itens */}
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Totais */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>Taxa de Entrega:</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Forma de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Forma de Pagamento</CardTitle>
          <CardDescription>
            Escolha como deseja pagar seu pedido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="traditional">
                <DollarSign className="h-4 w-4 mr-2" />
                Dinheiro
              </TabsTrigger>
              <TabsTrigger value="mercado_pago" disabled={!isConfigured}>
                <CreditCard className="h-4 w-4 mr-2" />
                PIX / Cartão
                {!isConfigured && <span className="ml-1 text-xs">(Indisponível)</span>}
              </TabsTrigger>
            </TabsList>

            {/* Pagamento Tradicional */}
            <TabsContent value="traditional" className="space-y-4">
              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription>
                  Pagamento em dinheiro na entrega. Tenha o valor exato ou próximo.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleTraditionalOrder}
                disabled={orderStatus === 'processing'}
                className="w-full"
                size="lg"
              >
                {orderStatus === 'processing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processando Pedido...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Finalizar Pedido - {formatCurrency(total)}
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Mercado Pago */}
            <TabsContent value="mercado_pago" className="space-y-4">
              {!isConfigured ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Pagamentos digitais não estão disponíveis no momento. 
                    Entre em contato com a loja para mais informações.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {isSandbox && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Modo Teste:</strong> Este é um ambiente de testes. 
                        Nenhuma cobrança real será feita.
                      </AlertDescription>
                    </Alert>
                  )}

                  <MercadoPagoPayment
                    lojaId={lojaId}
                    paymentData={{
                      transaction_amount: total,
                      description: `Pedido PediFacil - ${items.length} item(s)`,
                      external_reference: generateOrderId(),
                      payer: {
                        email: customerData.email,
                        first_name: customerData.name.split(' ')[0],
                        last_name: customerData.name.split(' ').slice(1).join(' '),
                      }
                    }}
                    onPaymentSuccess={handleMercadoPagoSuccess}
                    onPaymentError={handleMercadoPagoError}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Informações do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><strong>Nome:</strong> {customerData.name}</div>
          <div><strong>Email:</strong> {customerData.email}</div>
          <div><strong>Telefone:</strong> {customerData.phone}</div>
          {customerData.address && (
            <div>
              <strong>Endereço:</strong> {customerData.address.street}, {customerData.address.number} - {customerData.address.neighborhood}, {customerData.address.city}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
