'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MercadoPagoCredentialsForm } from '@/components/mercado-pago-credentials-form';
import { 
  CreditCard, 
  QrCode, 
  Settings, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  payment_id: string;
  payment_method_id: string;
  transaction_amount: number;
  status: string;
  status_detail: string;
  external_reference: string;
  date_created: string;
  date_approved?: string;
  payer_email?: string;
}

interface Stats {
  total_transactions: number;
  total_amount: number;
  approved_transactions: number;
  approved_amount: number;
  pending_transactions: number;
  pending_amount: number;
  rejected_transactions: number;
}

export default function MercadoPagoAdminPage() {
  const [lojaId] = useState('default-store'); // ID da loja padrão existente no banco
  const [credentials, setCredentials] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCredentials(),
        loadTransactions(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = async () => {
    try {
      const response = await fetch(`/api/mercado-pago/credentials?loja_id=${lojaId}`);
      if (response.ok) {
        const data = await response.json();
        setCredentials(data);
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      // Implementar endpoint para buscar transações
      // const response = await fetch(`/api/mercado-pago/transactions?loja_id=${lojaId}`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setTransactions(data);
      // }
      
      // Mock data para demonstração
      setTransactions([
        {
          id: '1',
          payment_id: '12345678901',
          payment_method_id: 'pix',
          transaction_amount: 25.50,
          status: 'approved',
          status_detail: 'accredited',
          external_reference: 'pedido-001',
          date_created: '2024-01-21T10:30:00Z',
          date_approved: '2024-01-21T10:31:00Z',
          payer_email: 'cliente@email.com'
        },
        {
          id: '2',
          payment_id: '12345678902',
          payment_method_id: 'visa',
          transaction_amount: 45.00,
          status: 'pending',
          status_detail: 'pending_waiting_payment',
          external_reference: 'pedido-002',
          date_created: '2024-01-21T11:00:00Z',
          payer_email: 'cliente2@email.com'
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Calcular estatísticas das transações
      const approved = transactions.filter(t => t.status === 'approved');
      const pending = transactions.filter(t => t.status === 'pending');
      const rejected = transactions.filter(t => t.status === 'rejected');

      setStats({
        total_transactions: transactions.length,
        total_amount: transactions.reduce((sum, t) => sum + t.transaction_amount, 0),
        approved_transactions: approved.length,
        approved_amount: approved.reduce((sum, t) => sum + t.transaction_amount, 0),
        pending_transactions: pending.length,
        pending_amount: pending.reduce((sum, t) => sum + t.transaction_amount, 0),
        rejected_transactions: rejected.length,
      });
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Dados atualizados');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'pix':
        return <QrCode className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Carregando dados do Mercado Pago...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mercado Pago</h1>
          <p className="text-muted-foreground">
            Gerencie pagamentos via PIX e Cartão de Crédito
          </p>
        </div>
        <Button onClick={refreshData} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Status das Credenciais */}
      {credentials ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Mercado Pago configurado e ativo. 
            Ambiente: <strong>{credentials.is_sandbox ? 'Teste (Sandbox)' : 'Produção'}</strong>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Mercado Pago não configurado. Configure suas credenciais na aba "Configurações".
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_transactions}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.total_amount)} em volume
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.approved_transactions}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.approved_amount)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending_transactions}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.pending_amount)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.rejected_transactions}</div>
                  <p className="text-xs text-muted-foreground">
                    Taxa de rejeição: {stats.total_transactions > 0 ? 
                      ((stats.rejected_transactions / stats.total_transactions) * 100).toFixed(1) : 0}%
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transações Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>
                Últimas transações processadas via Mercado Pago
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getPaymentMethodIcon(transaction.payment_method_id)}
                        <div>
                          <p className="font-medium">
                            Pedido {transaction.external_reference}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.payer_email} • {formatDate(transaction.date_created)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(transaction.transaction_amount)}</p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma transação encontrada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transações */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações</CardTitle>
              <CardDescription>
                Histórico completo de transações do Mercado Pago
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getPaymentMethodIcon(transaction.payment_method_id)}
                        <div>
                          <p className="font-medium">
                            {transaction.payment_id}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Pedido: {transaction.external_reference}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.payer_email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(transaction.transaction_amount)}</p>
                        {getStatusBadge(transaction.status)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(transaction.date_created)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma transação encontrada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings">
          <MercadoPagoCredentialsForm 
            lojaId={lojaId}
            onCredentialsSaved={() => {
              loadCredentials();
              toast.success('Configurações atualizadas!');
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
