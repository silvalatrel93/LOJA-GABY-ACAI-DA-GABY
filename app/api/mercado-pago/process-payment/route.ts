import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Configurar cliente do Mercado Pago com variáveis de ambiente
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      transaction_amount,
      payment_method_id,
      token,
      installments,
      payer,
      external_reference,
      description,
      metadata,
      loja_id = 'default-store'
    } = body;

    // Validar dados obrigatórios
    if (!transaction_amount || !payment_method_id || !payer) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: transaction_amount, payment_method_id, payer' },
        { status: 400 }
      );
    }

    // Verificar se as credenciais estão configuradas
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Credenciais do Mercado Pago não configuradas' },
        { status: 400 }
      );
    }

    const payment = new Payment(client);

    // Criar payment request
    const paymentRequest = {
      transaction_amount: parseFloat(transaction_amount.toString()),
      payment_method_id,
      token: token || undefined,
      installments: installments || 1,
      payer: {
        email: payer.email,
        identification: payer.identification ? {
          type: payer.identification.type,
          number: payer.identification.number
        } : undefined,
        first_name: payer.first_name,
        last_name: payer.last_name
      },
      external_reference: external_reference,
      description: description || 'Pedido HEAI AÇAÍ',
      statement_descriptor: 'HEAI ACAI',
      metadata: metadata || {},
      // Só inclui notification_url se estivermos em produção (URL pública)
      ...(process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost') ? {
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercado-pago/webhook`
      } : {}),
      capture: true,
      binary_mode: false
    };

    console.log('📤 Enviando request para Mercado Pago:', {
      transaction_amount: paymentRequest.transaction_amount,
      payment_method_id: paymentRequest.payment_method_id,
      payer_email: paymentRequest.payer.email
    });
    
    const result = await payment.create({ body: paymentRequest });
    
    console.log('📥 Resposta do Mercado Pago:', {
      id: result.id,
      status: result.status,
      status_detail: result.status_detail
    });

    return NextResponse.json({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      external_reference: result.external_reference,
      payment_method_id: result.payment_method_id,
      transaction_amount: result.transaction_amount,
      date_created: result.date_created,
      date_approved: result.date_approved,
      point_of_interaction: result.point_of_interaction
    });

  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');
    const loja_id = searchParams.get('loja_id') || 'default-store';

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se as credenciais estão configuradas
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Credenciais do Mercado Pago não configuradas' },
        { status: 400 }
      );
    }

    const payment = new Payment(client);
    const result = await payment.get({ id: paymentId });

    return NextResponse.json({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      external_reference: result.external_reference,
      payment_method_id: result.payment_method_id,
      transaction_amount: result.transaction_amount,
      date_created: result.date_created,
      date_approved: result.date_approved,
      point_of_interaction: result.point_of_interaction
    });

  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pagamento', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 