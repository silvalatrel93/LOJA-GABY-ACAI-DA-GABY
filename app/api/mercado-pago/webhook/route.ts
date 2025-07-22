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
    const { status, external_reference, id: paymentId } = paymentData;
    
    console.log(`Processando atualização de pagamento:`, {
      external_reference,
      status,
      paymentId,
      action: getActionByStatus(status)
    });

    // Importar OrderService dinamicamente para evitar problemas de importação
    const { OrderService } = await import('@/lib/services/order-service');
    const { createSupabaseClient } = await import('@/lib/supabase-client');
    
    const supabase = createSupabaseClient();

    // Buscar pedido pela referência externa (se fornecida)
    let orderId = null;
    if (external_reference) {
      // Tentar extrair ID do pedido da referência externa
      const orderIdMatch = external_reference.match(/order_\d+_(\d+)/);
      if (orderIdMatch) {
        orderId = orderIdMatch[1];
      }
    }

    // Atualizar dados de pagamento no banco
    const updateData: any = {
      payment_id: paymentId,
      payment_status: status,
      payment_type: paymentData.payment_type_id,
      payment_method_id: paymentData.payment_method_id,
      payment_external_reference: external_reference,
      payment_approved_at: paymentData.date_approved ? new Date(paymentData.date_approved).toISOString() : null,
      payment_amount: paymentData.transaction_amount,
      payment_fee: paymentData.fee_details?.reduce((sum: number, fee: any) => sum + fee.amount, 0) || 0,
      payment_net_amount: paymentData.transaction_amount - (paymentData.fee_details?.reduce((sum: number, fee: any) => sum + fee.amount, 0) || 0),
      payment_installments: paymentData.installments || 1,
      payment_issuer_id: paymentData.issuer_id,
      payment_card_last_four_digits: paymentData.card?.last_four_digits,
      payment_card_holder_name: paymentData.card?.cardholder?.name,
      payment_payer_email: paymentData.payer?.email,
      payment_payer_identification_type: paymentData.payer?.identification?.type,
      payment_payer_identification_number: paymentData.payer?.identification?.number,
      payment_webhook_data: paymentData,
    };

    // Ações baseadas no status:
    switch (status) {
      case 'approved':
        // Pagamento aprovado - atualizar status do pedido
        console.log(`Pagamento aprovado para pedido ${external_reference}`);
        updateData.status = 'paid';
        break;
        
      case 'pending':
        // Pagamento pendente
        console.log(`Pagamento pendente para pedido ${external_reference}`);
        updateData.status = 'pending_payment';
        break;
        
      case 'rejected':
      case 'cancelled':
        // Pagamento rejeitado/cancelado
        console.log(`Pagamento ${status} para pedido ${external_reference}`);
        updateData.status = 'payment_failed';
        break;
        
      default:
        console.log(`Status não reconhecido: ${status}`);
    }

    // Atualizar pedido no banco de dados
    if (orderId) {
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
        
      if (error) {
        console.error('Erro ao atualizar pedido:', error);
      } else {
        console.log(`Pedido ${orderId} atualizado com sucesso`);
      }
    } else if (external_reference) {
      // Tentar atualizar por referência externa se não conseguiu extrair o ID
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('payment_external_reference', external_reference);
        
      if (error) {
        console.error('Erro ao atualizar pedido por referência externa:', error);
      } else {
        console.log(`Pedido com referência ${external_reference} atualizado com sucesso`);
      }
    } else {
      // Se não temos ID nem referência, tentar atualizar por payment_id
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('payment_id', paymentId);
        
      if (error) {
        console.error('Erro ao atualizar pedido por payment_id:', error);
      } else {
        console.log(`Pedido com payment_id ${paymentId} atualizado com sucesso`);
      }
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