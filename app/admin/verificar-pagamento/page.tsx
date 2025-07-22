"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'

interface PaymentCheckResult {
  message: string
  order_id?: number
  old_status?: string
  new_status?: string
  payment_status?: string
  payment_id?: string
  order?: {
    id: number
    status: string
    payment_status: string
    payment_id: string
  }
  payment?: {
    id: string
    status: string
    status_detail: string
    transaction_amount: number
  }
}

export default function VerificarPagamentoPage() {
  const [paymentId, setPaymentId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PaymentCheckResult | null>(null)
  const [error, setError] = useState('')

  const handleCheck = async () => {
    if (!paymentId && !orderId) {
      setError('Informe o ID do pagamento ou ID do pedido')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/mercado-pago/check-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId || undefined,
          order_id: orderId ? parseInt(orderId) : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar pagamento')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pending':
      case 'pending_payment':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'rejected':
      case 'cancelled':
      case 'payment_failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'approved': 'Aprovado',
      'paid': 'Pago',
      'pending': 'Pendente',
      'pending_payment': 'Aguardando Pagamento',
      'rejected': 'Rejeitado',
      'cancelled': 'Cancelado',
      'payment_failed': 'Falha no Pagamento',
      'new': 'Novo'
    }
    return statusMap[status] || status
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Verificar Status de Pagamento</h1>
        <p className="text-gray-600 mt-2">
          Verifique e atualize manualmente o status de pagamentos PIX
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Buscar Pagamento</CardTitle>
          <CardDescription>
            Informe o ID do pagamento (Mercado Pago) ou ID do pedido para verificar o status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">ID do Pagamento (Mercado Pago)</label>
              <Input
                type="text"
                placeholder="Ex: 1234567890"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ID do Pedido</label>
              <Input
                type="number"
                placeholder="Ex: 102"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleCheck} 
            disabled={loading || (!paymentId && !orderId)}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              'Verificar Status'
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-4">
          {result.old_status && result.new_status && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                <strong>Status atualizado com sucesso!</strong><br />
                De: {getStatusText(result.old_status)} → Para: {getStatusText(result.new_status)}
              </AlertDescription>
            </Alert>
          )}

          {result.order && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(result.order.status)}
                  Pedido #{result.order.id}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status do Pedido</h4>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.order.status)}
                      <span>{getStatusText(result.order.status)}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status do Pagamento</h4>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.order.payment_status)}
                      <span>{getStatusText(result.order.payment_status)}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">ID do Pagamento</h4>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {result.order.payment_id || 'N/A'}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {result.payment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(result.payment.status)}
                  Pagamento Mercado Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.payment.status)}
                      <span>{getStatusText(result.payment.status)}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Detalhe</h4>
                    <span className="text-sm text-gray-600">{result.payment.status_detail}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Valor</h4>
                    <span className="font-mono">R$ {result.payment.transaction_amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}