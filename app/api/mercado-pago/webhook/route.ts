import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

// Configurar o cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

const payment = new Payment(client)

// Configurar Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔔 Webhook recebido:', JSON.stringify(body, null, 2))
    
    // Verificar se é uma notificação de pagamento
    if (body.type !== 'payment') {
      console.log('❌ Tipo de notificação não suportado:', body.type)
      return NextResponse.json({ message: 'Tipo de notificacao nao suportado' })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      console.log('❌ ID do pagamento não encontrado no webhook')
      return NextResponse.json({ error: 'ID do pagamento nao encontrado' }, { status: 400 })
    }
    
    console.log('💳 Processando pagamento ID:', paymentId)

    // Buscar informações do pagamento no Mercado Pago
    console.log('🔍 Buscando informações do pagamento no Mercado Pago...')
    const paymentInfo = await payment.get({ id: paymentId })
    console.log('📋 Informações do pagamento:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference,
      transaction_amount: paymentInfo.transaction_amount
    })
    
    if (!paymentInfo.external_reference) {
      console.log('❌ Pagamento sem referencia externa:', paymentId)
      return NextResponse.json({ message: 'Pagamento sem referencia externa' })
    }

    // Atualizar status do pedido no banco de dados
    const orderId = paymentInfo.external_reference
    console.log('🆔 Order ID encontrado:', orderId)
    
    let newStatus = 'new'
    if (paymentInfo.status === 'approved') {
      newStatus = 'new' // Pedido aprovado vira 'new' para aparecer no painel
    } else if (paymentInfo.status === 'rejected' || paymentInfo.status === 'cancelled') {
      newStatus = 'cancelled'
    } else if (paymentInfo.status === 'pending') {
      newStatus = 'pending_payment'
    }
    
    console.log(`🔄 Mudando status do pedido ${orderId} de '${paymentInfo.status}' para '${newStatus}'`)

    // Atualizar o pedido no Supabase
    console.log('💾 Atualizando pedido no Supabase...')
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        payment_id: paymentId,
        payment_status: paymentInfo.status,
        payment_method: 'mercado_pago_pix',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (error) {
      console.error('❌ Erro ao atualizar pedido:', error)
      return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
    }

    console.log(`✅ Pedido ${orderId} atualizado com sucesso para status: ${newStatus}`)
    
    return NextResponse.json({ message: 'Webhook processado com sucesso' })

  } catch (error) {
    console.error('Erro no webhook do Mercado Pago:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Webhook do Mercado Pago ativo' })
}