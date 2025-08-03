import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

const payment = new Payment(client)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_amount, description, payment_method_id, payer, external_reference, notification_url } = body

    if (!transaction_amount || !description) {
      return NextResponse.json(
        { error: 'Transaction amount and description are required' },
        { status: 400 }
      )
    }

    const paymentData = {
      transaction_amount: parseFloat(transaction_amount),
      description,
      payment_method_id: payment_method_id || 'pix',
      payer: payer || {
        email: 'test@test.com',
      },
      external_reference,
      ...(notification_url && { notification_url }),
      date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
    }

    const paymentResponse = await payment.create({ body: paymentData })

    return NextResponse.json({
      id: paymentResponse.id,
      status: paymentResponse.status,
      qr_code: paymentResponse.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: paymentResponse.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: paymentResponse.point_of_interaction?.transaction_data?.ticket_url,
      expiration_date: paymentResponse.date_of_expiration,
    })
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id') || searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    const paymentResponse = await payment.get({ id: paymentId })

    return NextResponse.json({
      id: paymentResponse.id,
      status: paymentResponse.status,
      status_detail: paymentResponse.status_detail,
    })
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}