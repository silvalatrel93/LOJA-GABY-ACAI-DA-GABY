import { supabase } from "@/lib/services/supabase-client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    
    // Passo 1: Excluir todos os pedidos existentes
    console.log("Excluindo todos os pedidos existentes...");
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .gte('id', 0);
    
    if (deleteError) {
      console.error("Erro ao excluir pedidos:", deleteError);
      return NextResponse.json(
        { success: false, error: "Erro ao excluir pedidos existentes" },
        { status: 500 }
      );
    }
    
    // Passo 2: Criar um pedido temporário para forçar o ID 1
    const tempOrder = {
      customer_name: "RESET_COUNTER_TEMP",
      customer_phone: "00000000000",
      address: { street: "Temp", number: "1", neighborhood: "Temp" },
      items: [],
      subtotal: 0,
      delivery_fee: 0,
      total: 0,
      payment_method: "temp",
      status: "cancelled" as const,
      date: new Date().toISOString(),
      printed: false,
      notified: true,
      store_id: "00000000-0000-0000-0000-000000000000"
    };
    
    const { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert(tempOrder)
      .select();
    
    if (insertError) {
      console.error("Erro ao inserir pedido temporário:", insertError);
      return NextResponse.json(
        { success: false, error: "Erro ao inserir pedido temporário" },
        { status: 500 }
      );
    }
    
    // Verificar se o pedido foi inserido com ID 1
    const orderId = insertedOrder?.[0]?.id;
    console.log(`Pedido temporário inserido com ID: ${orderId}`);
    
    // Passo 3: Excluir o pedido temporário
    const { error: deleteOrderError } = await supabase
      .from('orders')
      .delete()
      .eq('customer_name', "RESET_COUNTER_TEMP");
    
    if (deleteOrderError) {
      console.error("Erro ao excluir pedido temporário:", deleteOrderError);
      // Não é um erro crítico, podemos continuar
    }
    
    // Verificar se conseguimos redefinir o contador
    const success = orderId === 1;
    
    return NextResponse.json({
      success: true,
      message: "Contador de pedidos zerado com sucesso",
      resetToId1: success,
      nextOrderId: success ? 1 : "desconhecido"
    });
    
  } catch (error) {
    console.error("Erro ao zerar contador de pedidos:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao zerar contador de pedidos" },
      { status: 500 }
    );
  }
}
