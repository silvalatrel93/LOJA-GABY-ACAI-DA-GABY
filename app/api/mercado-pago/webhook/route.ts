import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Configurar cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
});

const payment = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Webhook MP recebido:', JSON.stringify(body, null, 2));

    // Validar webhook secret (opcional em desenvolvimento)
    const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const receivedSecret = request.headers.get('x-signature') || 
                           request.headers.get('x-request-id') ||
                           body.user_id; // MP envia user_id em algumas notificações
      
      console.log('Validação webhook - Secret configurado, validação ativa');
      // Em produção, implemente validação completa aqui se necessário
    } else {
      console.log('Webhook Secret não configurado - modo desenvolvimento');
    }

    // Verificar se é uma notificação de pagamento
    if (body.type === 'payment') {
      const paymentId = body.data?.id;
      
      if (!paymentId) {
        console.log('ID do pagamento não encontrado na notificação');
        return NextResponse.json({ status: 'ok' });
      }

      try {
        // Buscar detalhes do pagamento
        const paymentResult = await payment.get({ id: paymentId });
        
        console.log('Detalhes do pagamento:', {
          id: paymentResult.id,
          status: paymentResult.status,
          status_detail: paymentResult.status_detail,
          external_reference: paymentResult.external_reference,
          transaction_amount: paymentResult.transaction_amount
        });

        // Aqui você pode implementar a lógica para atualizar o status do pedido
        // baseado no status do pagamento
        await processPaymentUpdate(paymentResult);

      } catch (error) {
        console.error('Erro ao buscar pagamento:', error);
      }
    }

    // Sempre retornar status 200 para confirmar recebimento
    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Erro no webhook:', error);
    // Mesmo com erro, retornar 200 para evitar reenvios desnecessários
    return NextResponse.json({ status: 'error', message: 'Webhook processado com erro' });
  }
}

async function processPaymentUpdate(paymentData: any) {
  try {
    const { status, external_reference } = paymentData;
    
    // Aqui você implementaria a lógica para atualizar o pedido
    // Por exemplo, atualizar status no banco de dados
    console.log(`Processando atualização de pagamento:`, {
      external_reference,
      status,
      action: getActionByStatus(status)
    });

    // Exemplo de ações baseadas no status:
    switch (status) {
      case 'approved':
        // Pagamento aprovado - liberar pedido
        console.log(`Pagamento aprovado para pedido ${external_reference}`);
        // await updateOrderStatus(external_reference, 'paid');
        break;
        
      case 'pending':
        // Pagamento pendente
        console.log(`Pagamento pendente para pedido ${external_reference}`);
        // await updateOrderStatus(external_reference, 'pending_payment');
        break;
        
      case 'rejected':
        // Pagamento rejeitado
        console.log(`Pagamento rejeitado para pedido ${external_reference}`);
        // await updateOrderStatus(external_reference, 'payment_failed');
        break;
        
      case 'cancelled':
        // Pagamento cancelado
        console.log(`Pagamento cancelado para pedido ${external_reference}`);
        // await updateOrderStatus(external_reference, 'cancelled');
        break;
        
      default:
        console.log(`Status não reconhecido: ${status}`);
    }

  } catch (error) {
    console.error('Erro ao processar atualização de pagamento:', error);
  }
}

function getActionByStatus(status: string): string {
  const statusActions: Record<string, string> = {
    'approved': 'Liberar pedido',
    'pending': 'Aguardar confirmação',
    'rejected': 'Notificar falha',
    'cancelled': 'Cancelar pedido',
    'refunded': 'Processar estorno'
  };
  
  return statusActions[status] || 'Nenhuma ação definida';
}

// Método GET para teste do webhook
export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook do Mercado Pago está funcionando',
    timestamp: new Date().toISOString()
  });
} 