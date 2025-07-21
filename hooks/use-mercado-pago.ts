'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface MercadoPagoCredentials {
  id?: string;
  public_key: string;
  has_pix_key: boolean;
  webhook_url?: string;
  is_sandbox: boolean;
  is_active: boolean;
}

interface PaymentData {
  transaction_amount: number;
  description: string;
  external_reference: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
}

interface PaymentResult {
  id: string;
  status: string;
  status_detail: string;
  payment_method_id: string;
  transaction_amount: number;
  pix?: {
    qr_code: string;
    qr_code_base64: string;
    ticket_url?: string;
  };
}

interface Transaction {
  id: string;
  payment_id: string;
  payment_method_id: string;
  transaction_amount: number;
  status: string;
  status_detail: string;
  external_reference: string;
  date_created: string;
  payer_email?: string;
}

interface TransactionStats {
  total: { count: number; amount: number };
  approved: { count: number; amount: number; rate: number };
  pending: { count: number; amount: number; rate: number };
  rejected: { count: number; amount: number; rate: number };
  by_method: {
    pix: { count: number; amount: number };
    card: { count: number; amount: number };
  };
}

/**
 * Hook personalizado para integração com Mercado Pago
 */
export function useMercadoPago(lojaId: string) {
  const [credentials, setCredentials] = useState<MercadoPagoCredentials | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar credenciais
  const loadCredentials = useCallback(async () => {
    if (!lojaId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/mercado-pago/credentials?loja_id=${lojaId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCredentials(data);
      } else if (response.status === 404) {
        setCredentials(null);
      } else {
        throw new Error('Erro ao carregar credenciais');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar credenciais:', err);
    } finally {
      setLoading(false);
    }
  }, [lojaId]);

  // Salvar credenciais
  const saveCredentials = useCallback(async (
    publicKey: string,
    accessToken: string,
    chavePix?: string,
    webhookUrl?: string,
    isSandbox: boolean = true
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mercado-pago/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loja_id: lojaId,
          public_key: publicKey,
          access_token: accessToken,
          chave_pix: chavePix,
          webhook_url: webhookUrl,
          is_sandbox: isSandbox,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Credenciais salvas com sucesso!');
        await loadCredentials();
        return true;
      } else {
        throw new Error(result.error || 'Erro ao salvar credenciais');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [lojaId, loadCredentials]);

  // Remover credenciais
  const removeCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/mercado-pago/credentials?loja_id=${lojaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Credenciais removidas com sucesso!');
        setCredentials(null);
        return true;
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao remover credenciais');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [lojaId]);

  // Criar pagamento PIX
  const createPixPayment = useCallback(async (paymentData: PaymentData): Promise<PaymentResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mercado-pago/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loja_id: lojaId,
          payment_method_id: 'pix',
          ...paymentData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Pagamento PIX criado com sucesso!');
        return result;
      } else {
        throw new Error(result.error || 'Erro ao criar pagamento PIX');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lojaId]);

  // Criar pagamento com cartão
  const createCardPayment = useCallback(async (
    paymentData: PaymentData & { 
      payment_method_id: string;
      token: string;
      installments: number;
    }
  ): Promise<PaymentResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mercado-pago/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loja_id: lojaId,
          ...paymentData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.status === 'approved') {
          toast.success('Pagamento aprovado!');
        } else if (result.status === 'pending') {
          toast.info('Pagamento pendente de aprovação');
        } else {
          toast.error('Pagamento rejeitado');
        }
        return result;
      } else {
        throw new Error(result.error || 'Erro ao processar pagamento');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lojaId]);

  // Carregar transações
  const loadTransactions = useCallback(async (filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    if (!lojaId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ loja_id: lojaId });
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`/api/mercado-pago/transactions?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setStats(data.stats);
      } else {
        throw new Error('Erro ao carregar transações');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar transações:', err);
    } finally {
      setLoading(false);
    }
  }, [lojaId]);

  // Buscar transações de um pedido específico
  const getTransactionsByOrder = useCallback(async (orderId: string) => {
    if (!lojaId || !orderId) return [];

    try {
      const response = await fetch(
        `/api/mercado-pago/transactions?loja_id=${lojaId}&order_id=${orderId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.transactions;
      } else {
        throw new Error('Erro ao buscar transações do pedido');
      }
    } catch (err) {
      console.error('Erro ao buscar transações do pedido:', err);
      return [];
    }
  }, [lojaId]);

  // Verificar se Mercado Pago está configurado
  const isConfigured = credentials?.is_active || false;

  // Verificar se está em modo sandbox
  const isSandbox = credentials?.is_sandbox || false;

  // Carregar dados iniciais
  useEffect(() => {
    if (lojaId) {
      loadCredentials();
      loadTransactions();
    }
  }, [lojaId, loadCredentials, loadTransactions]);

  return {
    // Estados
    credentials,
    transactions,
    stats,
    loading,
    error,
    isConfigured,
    isSandbox,

    // Funções de credenciais
    loadCredentials,
    saveCredentials,
    removeCredentials,

    // Funções de pagamento
    createPixPayment,
    createCardPayment,

    // Funções de transações
    loadTransactions,
    getTransactionsByOrder,

    // Utilitários
    refresh: () => {
      loadCredentials();
      loadTransactions();
    },
    clearError: () => setError(null),
  };
}

export default useMercadoPago;
