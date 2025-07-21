import { NextRequest, NextResponse } from 'next/server';
import MercadoPagoService from '@/lib/services/mercado-pago-service';
import { createSupabaseClient } from '@/lib/supabase-client';

const mercadoPagoService = new MercadoPagoService();

/**
 * GET - Busca transações de uma loja
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lojaId = searchParams.get('loja_id');
    const orderId = searchParams.get('order_id');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!lojaId) {
      return NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      );
    }

    let transactions = [];

    if (orderId) {
      // Buscar transações de um pedido específico
      transactions = await mercadoPagoService.getTransactionsByOrderId(orderId);
    } else {
      // Buscar todas as transações da loja
      transactions = await getTransactionsByLoja(lojaId, status, limit, offset, dateFrom, dateTo);
    }

    // Calcular estatísticas
    const stats = calculateStats(transactions);

    return NextResponse.json({
      transactions,
      stats,
      pagination: {
        limit,
        offset,
        total: transactions.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Busca transações por loja com consulta real ao Supabase
 */
async function getTransactionsByLoja(
  lojaId: string, 
  status?: string | null, 
  limit: number = 50, 
  offset: number = 0,
  dateFrom?: string | null,
  dateTo?: string | null
) {
  const supabase = createSupabaseClient();

  // Construir query base
  let query = supabase
    .from('mercado_pago_transactions')
    .select('*')
    .eq('loja_id', lojaId)
    .order('created_at', { ascending: false });

  // Aplicar filtros opcionais
  if (status) {
    query = query.eq('status', status);
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  // Executar query com paginação
  const { data: transactions, error } = await query
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }

  return transactions || [];
}

/**
 * Calcula estatísticas das transações
 */
function calculateStats(transactions: any[]) {
  const approved = transactions.filter(t => t.status === 'approved');
  const pending = transactions.filter(t => t.status === 'pending');
  const rejected = transactions.filter(t => t.status === 'rejected');

  const pixTransactions = transactions.filter(t => t.payment_method_id === 'pix');
  const cardTransactions = transactions.filter(t => t.payment_method_id !== 'pix');

  return {
    total: {
      count: transactions.length,
      amount: transactions.reduce((sum, t) => sum + t.transaction_amount, 0)
    },
    approved: {
      count: approved.length,
      amount: approved.reduce((sum, t) => sum + t.transaction_amount, 0),
      rate: transactions.length > 0 ? (approved.length / transactions.length) * 100 : 0
    },
    pending: {
      count: pending.length,
      amount: pending.reduce((sum, t) => sum + t.transaction_amount, 0),
      rate: transactions.length > 0 ? (pending.length / transactions.length) * 100 : 0
    },
    rejected: {
      count: rejected.length,
      amount: rejected.reduce((sum, t) => sum + t.transaction_amount, 0),
      rate: transactions.length > 0 ? (rejected.length / transactions.length) * 100 : 0
    },
    by_method: {
      pix: {
        count: pixTransactions.length,
        amount: pixTransactions.reduce((sum, t) => sum + t.transaction_amount, 0)
      },
      card: {
        count: cardTransactions.length,
        amount: cardTransactions.reduce((sum, t) => sum + t.transaction_amount, 0)
      }
    },
    recent_activity: transactions
      .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
      .slice(0, 10)
  };
}
