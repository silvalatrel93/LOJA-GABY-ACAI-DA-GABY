import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createSupabaseClient } from '@/lib/supabase-client';

// Configurar cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
});

const payment = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    
    console.log('🔄 Iniciando verificação automática de pagamentos...');
    
    // Buscar pedidos com pagamento pendente dos últimos 30 minutos
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: pendingOrders, error } = await supabase
      .from('orders')
      .select('*')
      .in('payment_status', ['pending', 'pending_payment'])
      .not('payment_id', 'is', null)
      .gte('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Erro ao buscar pedidos pendentes:', error);
      return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
    }
    
    if (!pendingOrders || pendingOrders.length === 0) {
      console.log('✅ Nenhum pedido pendente encontrado');
      return NextResponse.json({ 
        message: 'Nenhum pedido pendente encontrado',
        checked: 0,
        updated: 0
      });
    }
    
    console.log(`📋 Encontrados ${pendingOrders.length} pedidos pendentes para verificar`);
    
    let updatedCount = 0;
    const results = [];
    
    for (const order of pendingOrders) {
      try {
        console.log(`🔍 Verificando pagamento ${order.payment_id} do pedido #${order.id}`);
        
        // Buscar status atual do pagamento no Mercado Pago
        const paymentResult = await payment.get({ id: order.payment_id });
        
        console.log(`📊 Status atual: ${paymentResult.status} (era: ${order.payment_status})`);
        
        // Se o status mudou, atualizar o pedido
        if (paymentResult.status !== order.payment_status) {
          const updateData: any = {
            payment_status: paymentResult.status,
            payment_approved_at: paymentResult.date_approved ? new Date(paymentResult.date_approved).toISOString() : null,
            updated_at: new Date().toISOString()
          };
          
          // Atualizar status do pedido baseado no status do pagamento
          switch (paymentResult.status) {
            case 'approved':
              updateData.status = 'paid';
              console.log(`✅ Pagamento aprovado para pedido #${order.id}`);
              break;
            case 'pending':
              updateData.status = 'pending_payment';
              console.log(`⏳ Pagamento ainda pendente para pedido #${order.id}`);
              break;
            case 'rejected':
            case 'cancelled':
              updateData.status = 'payment_failed';
              console.log(`❌ Pagamento ${paymentResult.status} para pedido #${order.id}`);
              break;
          }
          
          // Atualizar no banco de dados
          const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', order.id);
          
          if (updateError) {
            console.error(`Erro ao atualizar pedido #${order.id}:`, updateError);
            results.push({
              order_id: order.id,
              payment_id: order.payment_id,
              old_status: order.payment_status,
              new_status: paymentResult.status,
              updated: false,
              error: updateError.message
            });
          } else {
            updatedCount++;
            console.log(`✅ Pedido #${order.id} atualizado com sucesso`);
            results.push({
              order_id: order.id,
              payment_id: order.payment_id,
              old_status: order.payment_status,
              new_status: paymentResult.status,
              updated: true
            });
          }
        } else {
          console.log(`➡️ Status inalterado para pedido #${order.id}`);
          results.push({
            order_id: order.id,
            payment_id: order.payment_id,
            status: paymentResult.status,
            updated: false,
            reason: 'Status inalterado'
          });
        }
        
      } catch (paymentError) {
        console.error(`Erro ao verificar pagamento ${order.payment_id}:`, paymentError);
        results.push({
          order_id: order.id,
          payment_id: order.payment_id,
          updated: false,
          error: paymentError instanceof Error ? paymentError.message : 'Erro desconhecido'
        });
      }
    }
    
    console.log(`🎯 Verificação concluída: ${updatedCount} pedidos atualizados de ${pendingOrders.length} verificados`);
    
    return NextResponse.json({
      message: `Verificação concluída: ${updatedCount} pedidos atualizados`,
      checked: pendingOrders.length,
      updated: updatedCount,
      results
    });
    
  } catch (error) {
    console.error('Erro na verificação automática:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// Método GET para verificação manual
export async function GET() {
  return POST(new NextRequest('http://localhost/api/mercado-pago/auto-check-payments', { method: 'POST' }));
}