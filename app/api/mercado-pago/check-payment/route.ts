import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createSupabaseClient } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { payment_id, order_id } = await request.json();
    
    if (!payment_id && !order_id) {
      return NextResponse.json(
        { error: 'payment_id ou order_id é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se as credenciais estão configuradas
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Credenciais do Mercado Pago não configuradas' },
        { status: 400 }
      );
    }

    // Configurar cliente do Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: { timeout: 5000 }
    });

    const payment = new Payment(client);
    const supabase = createSupabaseClient();

    let paymentData = null;
    let orderData = null;

    // Se temos payment_id, buscar no Mercado Pago
    if (payment_id) {
      try {
        paymentData = await payment.get({ id: payment_id });
        console.log('Dados do pagamento MP:', {
          id: paymentData.id,
          status: paymentData.status,
          status_detail: paymentData.status_detail,
          external_reference: paymentData.external_reference,
          transaction_amount: paymentData.transaction_amount
        });
      } catch (error) {
        console.error('Erro ao buscar pagamento no MP:', error);
        return NextResponse.json(
          { error: 'Pagamento não encontrado no Mercado Pago' },
          { status: 404 }
        );
      }
    }

    // Buscar pedido no banco de dados
    let query = supabase.from('orders').select('*');
    
    if (order_id) {
      query = query.eq('id', order_id);
    } else if (payment_id) {
      query = query.eq('payment_id', payment_id);
    }

    const { data: orders, error: orderError } = await query;
    
    if (orderError) {
      console.error('Erro ao buscar pedido:', orderError);
      return NextResponse.json(
        { error: 'Erro ao buscar pedido no banco de dados' },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    orderData = orders[0];

    // Se temos dados do pagamento e o status está diferente, atualizar
    if (paymentData && paymentData.status !== orderData.payment_status) {
      console.log(`Status divergente - MP: ${paymentData.status}, DB: ${orderData.payment_status}`);
      
      const updateData: any = {
        payment_id: paymentData.id,
        payment_status: paymentData.status,
        payment_type: paymentData.payment_type_id,
        payment_method_id: paymentData.payment_method_id,
        payment_external_reference: paymentData.external_reference,
        payment_approved_at: paymentData.date_approved ? new Date(paymentData.date_approved).toISOString() : null,
        payment_amount: paymentData.transaction_amount,
        payment_webhook_data: paymentData,
      };

      // Atualizar status do pedido baseado no status do pagamento
      switch (paymentData.status) {
        case 'approved':
          updateData.status = 'paid';
          break;
        case 'pending':
          updateData.status = 'pending_payment';
          break;
        case 'rejected':
        case 'cancelled':
          updateData.status = 'payment_failed';
          break;
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderData.id);

      if (updateError) {
        console.error('Erro ao atualizar pedido:', updateError);
        return NextResponse.json(
          { error: 'Erro ao atualizar pedido' },
          { status: 500 }
        );
      }

      console.log(`Pedido ${orderData.id} atualizado com sucesso`);
      
      return NextResponse.json({
        message: 'Status atualizado com sucesso',
        order_id: orderData.id,
        old_status: orderData.status,
        new_status: updateData.status,
        payment_status: paymentData.status,
        payment_id: paymentData.id
      });
    }

    // Retornar status atual
    return NextResponse.json({
      message: 'Status verificado',
      order: {
        id: orderData.id,
        status: orderData.status,
        payment_status: orderData.payment_status,
        payment_id: orderData.payment_id
      },
      payment: paymentData ? {
        id: paymentData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        transaction_amount: paymentData.transaction_amount
      } : null
    });

  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}