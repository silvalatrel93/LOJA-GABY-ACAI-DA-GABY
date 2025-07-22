import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

// Configurar o cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000
  }
})

const payment = new Payment(client)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      transaction_amount, 
      description, 
      payment_method_id, 
      payer, 
      external_reference,
      notification_url 
    } = body

    // Validar dados obrigatórios
    if (!transaction_amount || !description || !payer?.email) {
      return NextResponse.json(
        { error: 'Dados obrigatorios nao fornecidos' },
        { status: 400 }
      )
    }

    // Criar o pagamento PIX
    const paymentData = {
      transaction_amount: Number(transaction_amount),
      description,
      payment_method_id: payment_method_id || 'pix',
      payer: {
        email: payer.email,
        first_name: payer.first_name || '',
        last_name: payer.last_name || '',
        identification: {
          type: payer.identification?.type || 'CPF',
          number: payer.identification?.number || ''
        }
      },
      external_reference,
      notification_url,
      date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
    }

    // Gerar chave de idempotência única
    const idempotencyKey = `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const result = await payment.create({ 
      body: paymentData,
      requestOptions: {
        idempotencyKey
      }
    })

    return NextResponse.json({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      qr_code: result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: result.point_of_interaction?.transaction_data?.ticket_url,
      external_reference: result.external_reference,
      date_created: result.date_created,
      date_of_expiration: result.date_of_expiration
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
    const paymentId = searchParams.get('payment_id')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento nao fornecido' },
        { status: 400 }
      )
    }

    const result = await payment.get({ id: paymentId })

    return NextResponse.json({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      transaction_amount: result.transaction_amount,
      payment_method_id: result.payment_method_id,
      external_reference: result.external_reference,
      date_created: result.date_created,
      date_approved: result.date_approved
    })

  } catch (error) {
    console.error('Erro ao consultar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}