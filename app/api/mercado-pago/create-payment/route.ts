import { NextRequest, NextResponse } from 'next/server';
import MercadoPagoService from '@/lib/services/mercado-pago-service';

const mercadoPagoService = new MercadoPagoService();

/**
 * POST - Cria um pagamento (PIX ou Cartão)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      loja_id,
      payment_method_id,
      transaction_amount,
      description,
      payer,
      external_reference,
      installments = 1,
      token, // Para pagamentos com cartão
    } = body;

    // Validação dos campos obrigatórios
    if (!loja_id || !payment_method_id || !transaction_amount || !description || !payer || !external_reference) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: loja_id, payment_method_id, transaction_amount, description, payer, external_reference' },
        { status: 400 }
      );
    }

    // Validar email do pagador
    if (!payer.email || !payer.email.includes('@')) {
      return NextResponse.json(
        { error: 'Email do pagador é obrigatório e deve ser válido' },
        { status: 400 }
      );
    }

    // Validar valor da transação
    if (transaction_amount <= 0) {
      return NextResponse.json(
        { error: 'Valor da transação deve ser maior que zero' },
        { status: 400 }
      );
    }

    // Para pagamentos com cartão, token é obrigatório
    if (payment_method_id !== 'pix' && !token) {
      return NextResponse.json(
        { error: 'Token do cartão é obrigatório para pagamentos com cartão' },
        { status: 400 }
      );
    }

    // Construir URL de notificação
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const notification_url = `${baseUrl}/api/mercado-pago/webhook`;

    const paymentData = {
      transaction_amount,
      description,
      payment_method_id,
      payer,
      external_reference,
      notification_url,
      installments,
      token,
    };

    let paymentResponse;

    // Criar pagamento baseado no método
    if (payment_method_id === 'pix') {
      paymentResponse = await mercadoPagoService.createPixPayment(loja_id, paymentData);
    } else {
      paymentResponse = await mercadoPagoService.createCardPayment(loja_id, paymentData);
    }

    if (!paymentResponse) {
      return NextResponse.json(
        { error: 'Falha ao criar pagamento' },
        { status: 400 }
      );
    }

    // Preparar resposta baseada no tipo de pagamento
    const response: any = {
      id: paymentResponse.id,
      status: paymentResponse.status,
      status_detail: paymentResponse.status_detail,
      payment_method_id: paymentResponse.payment_method_id,
      transaction_amount: paymentResponse.transaction_amount,
      date_created: paymentResponse.date_created,
      external_reference: paymentResponse.external_reference,
    };

    // Para PIX, incluir QR Code
    if (payment_method_id === 'pix' && paymentResponse.point_of_interaction?.transaction_data) {
      response.pix = {
        qr_code: paymentResponse.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: paymentResponse.point_of_interaction.transaction_data.qr_code_base64,
        ticket_url: paymentResponse.point_of_interaction.transaction_data.ticket_url,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET - Busca informações de um pagamento
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lojaId = searchParams.get('loja_id');
    const paymentId = searchParams.get('payment_id');

    if (!lojaId || !paymentId) {
      return NextResponse.json(
        { error: 'loja_id e payment_id são obrigatórios' },
        { status: 400 }
      );
    }

    const payment = await mercadoPagoService.getPayment(lojaId, paymentId);

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
