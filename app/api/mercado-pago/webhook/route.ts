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
    
    // Verificar se é uma notificação de pagamento
    if (body.type === 'payment') {
      const paymentId = body.data.id
      
      // Buscar detalhes do pagamento
      const paymentData = await payment.get({ id: paymentId })
      
      console.log('Webhook recebido:', {
        paymentId,
        status: payment.status,
        statusDetail: payment.status_detail
      })
      
      // Aqui você pode adicionar lógica para atualizar o status do pedido
      // Por exemplo, marcar como pago se status === 'approved'
      
      return NextResponse.json({ received: true })
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Webhook endpoint ativo' })
}