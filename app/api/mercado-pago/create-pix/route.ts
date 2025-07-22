import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Recebendo requisição PIX...');
    const body = await request.json();
    console.log('📦 Body recebido:', JSON.stringify(body, null, 2));
    
    const {
      transaction_amount,
      payer,
      external_reference,
      description,
      metadata
    } = body;

    // Validar dados obrigatórios
    if (!transaction_amount || !payer) {
      console.error('❌ Dados obrigatórios faltando:', { transaction_amount, payer });
      return NextResponse.json(
        { error: 'Dados obrigatórios: transaction_amount, payer' },
        { status: 400 }
      );
    }

    // Verificar se as credenciais estão configuradas
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    console.log('🔑 Access Token presente:', !!accessToken);
    
    if (!accessToken) {
      console.error('❌ Access Token não configurado');
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

    // Criar payment request para PIX
    const paymentRequest = {
      transaction_amount: parseFloat(transaction_amount.toString()),
      payment_method_id: 'pix',
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
      description: description || 'Pedido PediFacil',
      statement_descriptor: 'PEDIFACIL',
      metadata: metadata || {},
      // Só inclui notification_url se estivermos em produção
      ...(process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost') ? {
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercado-pago/webhook`
      } : {}),
      capture: true,
      binary_mode: false
    };

    console.log('📤 Criando pagamento PIX:', {
      transaction_amount: paymentRequest.transaction_amount,
      payer_email: paymentRequest.payer.email,
      external_reference: paymentRequest.external_reference
    });
    console.log('📋 Request completo:', JSON.stringify(paymentRequest, null, 2));
    
    const result = await payment.create({ body: paymentRequest });
    
    console.log('📥 Resposta PIX do Mercado Pago:', {
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
    console.error('❌ Erro ao criar pagamento PIX:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
    
    // Se for erro de validação do MP, retornar 400
    if (error instanceof Error && (error.message.includes('validation') || error.message.includes('invalid'))) {
      return NextResponse.json(
        { error: 'Dados inválidos para criação do PIX', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}