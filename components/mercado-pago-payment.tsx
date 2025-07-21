'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, QrCode, CheckCircle, XCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

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

interface MercadoPagoPaymentProps {
  lojaId: string;
  paymentData: PaymentData;
  onPaymentSuccess?: (paymentResult: any) => void;
  onPaymentError?: (error: string) => void;
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

export function MercadoPagoPayment({ 
  lojaId, 
  paymentData, 
  onPaymentSuccess, 
  onPaymentError 
}: MercadoPagoPaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [credentials, setCredentials] = useState<any>(null);
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry_month: '',
    expiry_year: '',
    security_code: '',
    cardholder_name: '',
    installments: 1,
  });
  const [documentForm, setDocumentForm] = useState({
    type: 'CPF',
    number: '',
  });

  // Carregar credenciais da loja
  useEffect(() => {
    loadCredentials();
  }, [lojaId]);

  const loadCredentials = async () => {
    try {
      const response = await fetch(`/api/mercado-pago/credentials?loja_id=${lojaId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCredentials(data);
      } else {
        toast.error('Credenciais do Mercado Pago não configuradas para esta loja');
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
      toast.error('Erro ao carregar configurações de pagamento');
    }
  };

  const createPixPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mercado-pago/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loja_id: lojaId,
          payment_method_id: 'pix',
          transaction_amount: paymentData.transaction_amount,
          description: paymentData.description,
          external_reference: paymentData.external_reference,
          payer: {
            ...paymentData.payer,
            identification: documentForm.number ? {
              type: documentForm.type,
              number: documentForm.number,
            } : undefined,
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPaymentResult(result);
        toast.success('Pagamento PIX criado com sucesso!');
        onPaymentSuccess?.(result);
      } else {
        toast.error(result.error || 'Erro ao criar pagamento PIX');
        onPaymentError?.(result.error || 'Erro ao criar pagamento PIX');
      }
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      toast.error('Erro ao processar pagamento');
      onPaymentError?.('Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const createCardPayment = async () => {
    if (!cardForm.number || !cardForm.expiry_month || !cardForm.expiry_year || 
        !cardForm.security_code || !cardForm.cardholder_name) {
      toast.error('Preencha todos os dados do cartão');
      return;
    }

    setLoading(true);
    try {
      // Em uma implementação real, você criaria o token do cartão usando o SDK do MP
      // Por agora, vamos simular
      const cardToken = 'simulated_card_token';

      const response = await fetch('/api/mercado-pago/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loja_id: lojaId,
          payment_method_id: 'visa', // ou detectar automaticamente
          transaction_amount: paymentData.transaction_amount,
          description: paymentData.description,
          external_reference: paymentData.external_reference,
          token: cardToken,
          installments: cardForm.installments,
          payer: {
            ...paymentData.payer,
            identification: documentForm.number ? {
              type: documentForm.type,
              number: documentForm.number,
            } : undefined,
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPaymentResult(result);
        if (result.status === 'approved') {
          toast.success('Pagamento aprovado!');
          onPaymentSuccess?.(result);
        } else if (result.status === 'pending') {
          toast.info('Pagamento pendente de aprovação');
          onPaymentSuccess?.(result);
        } else {
          toast.error('Pagamento rejeitado');
          onPaymentError?.('Pagamento rejeitado');
        }
      } else {
        toast.error(result.error || 'Erro ao processar pagamento');
        onPaymentError?.(result.error || 'Erro ao processar pagamento');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento');
      onPaymentError?.('Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if (paymentResult?.pix?.qr_code) {
      navigator.clipboard.writeText(paymentResult.pix.qr_code);
      toast.success('Código PIX copiado!');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = (status: string, statusDetail: string) => {
    switch (status) {
      case 'approved':
        return 'Pagamento aprovado com sucesso!';
      case 'pending':
        return 'Aguardando confirmação do pagamento...';
      case 'rejected':
        return `Pagamento rejeitado: ${statusDetail}`;
      default:
        return `Status: ${status}`;
    }
  };

  if (!credentials) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Carregando configurações de pagamento...
        </CardContent>
      </Card>
    );
  }

  if (!credentials.is_active) {
    return (
      <Alert>
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Pagamentos via Mercado Pago não estão disponíveis para esta loja.
        </AlertDescription>
      </Alert>
    );
  }

  // Mostrar resultado do pagamento
  if (paymentResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {getStatusIcon(paymentResult.status)}
            <span className="ml-2">Pagamento {paymentResult.payment_method_id.toUpperCase()}</span>
          </CardTitle>
          <CardDescription>
            {getStatusMessage(paymentResult.status, paymentResult.status_detail)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>ID do Pagamento:</strong> {paymentResult.id}
            </div>
            <div>
              <strong>Valor:</strong> R$ {paymentResult.transaction_amount.toFixed(2)}
            </div>
          </div>

          {/* QR Code PIX */}
          {paymentResult.pix && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">Escaneie o QR Code ou copie o código PIX:</h3>
                {paymentResult.pix.qr_code_base64 && (
                  <div className="flex justify-center mb-4">
                    <Image
                      src={`data:image/png;base64,${paymentResult.pix.qr_code_base64}`}
                      alt="QR Code PIX"
                      width={200}
                      height={200}
                      className="border rounded"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Código PIX (Copia e Cola):</Label>
                <div className="flex">
                  <Input
                    value={paymentResult.pix.qr_code}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    onClick={copyPixCode}
                    variant="outline"
                    size="sm"
                    className="ml-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {paymentResult.status === 'pending' && (
                <Alert>
                  <AlertDescription>
                    Após realizar o pagamento, o status será atualizado automaticamente.
                    Mantenha esta página aberta para acompanhar.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Button
            onClick={() => {
              setPaymentResult(null);
              setPaymentMethod('pix');
            }}
            variant="outline"
            className="w-full"
          >
            Fazer Novo Pagamento
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamento via Mercado Pago</CardTitle>
        <CardDescription>
          Escolha a forma de pagamento: PIX ou Cartão de Crédito
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção do método de pagamento */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={paymentMethod === 'pix' ? 'default' : 'outline'}
            onClick={() => setPaymentMethod('pix')}
            className="h-16 flex flex-col items-center justify-center"
          >
            <QrCode className="h-6 w-6 mb-1" />
            PIX
          </Button>
          <Button
            variant={paymentMethod === 'credit_card' ? 'default' : 'outline'}
            onClick={() => setPaymentMethod('credit_card')}
            className="h-16 flex flex-col items-center justify-center"
          >
            <CreditCard className="h-6 w-6 mb-1" />
            Cartão
          </Button>
        </div>

        {/* Dados do documento (comum para ambos) */}
        <div className="space-y-4">
          <h3 className="font-medium">Dados do Pagador</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="doc_type">Tipo de Documento</Label>
              <Select value={documentForm.type} onValueChange={(value) => 
                setDocumentForm(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="doc_number">Número do Documento</Label>
              <Input
                id="doc_number"
                value={documentForm.number}
                onChange={(e) => setDocumentForm(prev => ({ ...prev, number: e.target.value }))}
                placeholder={documentForm.type === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
              />
            </div>
          </div>
        </div>

        {/* Formulário do cartão */}
        {paymentMethod === 'credit_card' && (
          <div className="space-y-4">
            <h3 className="font-medium">Dados do Cartão</h3>
            
            <div>
              <Label htmlFor="card_number">Número do Cartão</Label>
              <Input
                id="card_number"
                value={cardForm.number}
                onChange={(e) => setCardForm(prev => ({ ...prev, number: e.target.value }))}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
              />
            </div>

            <div>
              <Label htmlFor="cardholder_name">Nome no Cartão</Label>
              <Input
                id="cardholder_name"
                value={cardForm.cardholder_name}
                onChange={(e) => setCardForm(prev => ({ ...prev, cardholder_name: e.target.value }))}
                placeholder="Nome como está no cartão"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="expiry_month">Mês</Label>
                <Select value={cardForm.expiry_month} onValueChange={(value) => 
                  setCardForm(prev => ({ ...prev, expiry_month: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {String(i + 1).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expiry_year">Ano</Label>
                <Select value={cardForm.expiry_year} onValueChange={(value) => 
                  setCardForm(prev => ({ ...prev, expiry_year: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="AAAA" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="security_code">CVV</Label>
                <Input
                  id="security_code"
                  value={cardForm.security_code}
                  onChange={(e) => setCardForm(prev => ({ ...prev, security_code: e.target.value }))}
                  placeholder="000"
                  maxLength={4}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="installments">Parcelas</Label>
              <Select value={String(cardForm.installments)} onValueChange={(value) => 
                setCardForm(prev => ({ ...prev, installments: parseInt(value) }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {i + 1}x de R$ {(paymentData.transaction_amount / (i + 1)).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Resumo do pagamento */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-medium">
            <span>Total a pagar:</span>
            <span>R$ {paymentData.transaction_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Botão de pagamento */}
        <Button
          onClick={paymentMethod === 'pix' ? createPixPayment : createCardPayment}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processando...
            </>
          ) : (
            <>
              {paymentMethod === 'pix' ? (
                <QrCode className="h-4 w-4 mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Pagar com {paymentMethod === 'pix' ? 'PIX' : 'Cartão'}
            </>
          )}
        </Button>

        {/* Informações de segurança */}
        <div className="text-xs text-muted-foreground text-center">
          {credentials.is_sandbox && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
              <strong>Modo Teste:</strong> Este é um ambiente de testes. Nenhuma cobrança real será feita.
            </div>
          )}
          Pagamento processado com segurança pelo Mercado Pago
        </div>
      </CardContent>
    </Card>
  );
}
