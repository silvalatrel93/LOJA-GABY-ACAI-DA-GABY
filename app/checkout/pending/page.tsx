"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Clock, Home, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PaymentInfo {
  id: string
  status: string
  status_detail: string
  transaction_amount: number
  date_created: string
  payment_method_id: string
  external_reference?: string
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string
      qr_code_base64?: string
      ticket_url?: string
    }
  }
}

function PendingContent() {
  const searchParams = useSearchParams()
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const paymentId = searchParams?.get('payment_id')

  const fetchPaymentInfo = async () => {
    if (!paymentId) {
      setError('ID do pagamento não encontrado')
      setLoading(false)
      return
    }

    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/mercado-pago/process-payment?id=${paymentId}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar informações do pagamento')
      }

      const data = await response.json()
      setPaymentInfo(data)

      // Se o pagamento foi aprovado, redirecionar para success
      if (data.status === 'approved') {
        window.location.href = `/checkout/success?payment_id=${paymentId}`
        return
      }

      // Se o pagamento foi rejeitado ou cancelado, redirecionar para failure
      if (data.status === 'rejected' || data.status === 'cancelled') {
        window.location.href = `/checkout/failure?payment_id=${paymentId}`
        return
      }

    } catch (err) {
      console.error('Erro ao buscar pagamento:', err)
      setError('Erro ao carregar informações do pagamento')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPaymentInfo()
  }, [paymentId])

  // Auto refresh a cada 10 segundos
  useEffect(() => {
    if (paymentInfo?.status === 'pending') {
      const interval = setInterval(() => {
        fetchPaymentInfo()
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [paymentInfo?.status])

  const getStatusMessage = (status: string, statusDetail: string) => {
    switch (statusDetail) {
      case 'pending_waiting_payment':
        return 'Aguardando o pagamento ser processado'
      case 'pending_waiting_transfer':
        return 'Aguardando confirmação da transferência'
      case 'pending_review_manual':
        return 'Pagamento em análise manual'
      case 'pending_contingency':
        return 'Processando pagamento'
      default:
        return 'Pagamento em processamento'
    }
  }

  const getInstructions = (paymentMethodId: string) => {
    switch (paymentMethodId) {
      case 'pix':
        return [
          'Abra o aplicativo do seu banco',
          'Escaneie o código QR ou cole o código Pix',
          'Confirme o pagamento',
          'Aguarde a confirmação automática'
        ]
      case 'bolbradesco':
      case 'boleto':
        return [
          'Use o código de barras para pagar em qualquer banco',
          'Ou pague online no site do seu banco',
          'O pagamento pode levar até 2 dias úteis para ser confirmado'
        ]
      default:
        return [
          'Siga as instruções do seu método de pagamento',
          'Aguarde a confirmação automática'
        ]
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Verificando pagamento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Erro</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link 
              href="/" 
              className="inline-flex items-center justify-center w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            {/* Ícone de pendente */}
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pagamento Pendente
            </h1>
            <p className="text-gray-600 mb-8">
              {paymentInfo && getStatusMessage(paymentInfo.status, paymentInfo.status_detail)}
            </p>

            {/* Informações do pagamento */}
            {paymentInfo && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Detalhes do Pagamento
                </h2>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID do Pagamento:</span>
                    <span className="font-mono text-sm">{paymentInfo.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-semibold text-yellow-600">
                      {formatCurrency(paymentInfo.transaction_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método:</span>
                    <span className="capitalize">{paymentInfo.payment_method_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-yellow-600 font-medium">Pendente</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span>
                      {new Date(paymentInfo.date_created).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {paymentInfo.external_reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Referência:</span>
                      <span className="font-mono text-sm">{paymentInfo.external_reference}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Código PIX */}
            {paymentInfo && paymentInfo.payment_method_id === 'pix' && paymentInfo.point_of_interaction?.transaction_data && (
              <div className="bg-green-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-green-900 mb-4">
                  💳 Código PIX para Pagamento
                </h3>
                
                {/* QR Code */}
                {paymentInfo.point_of_interaction.transaction_data.qr_code_base64 && (
                  <div className="text-center mb-6">
                    <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
                      <img 
                        src={`data:image/png;base64,${paymentInfo.point_of_interaction.transaction_data.qr_code_base64}`}
                        alt="QR Code PIX"
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      Escaneie este QR Code com o app do seu banco
                    </p>
                  </div>
                )}
                
                {/* Código PIX para copiar */}
                {paymentInfo.point_of_interaction.transaction_data.qr_code && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-green-900 mb-2">
                      Ou copie o código PIX:
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={paymentInfo.point_of_interaction.transaction_data.qr_code}
                        readOnly
                        className="flex-1 p-3 border border-green-300 rounded-lg bg-white font-mono text-sm"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(paymentInfo.point_of_interaction?.transaction_data?.qr_code || '')
                          alert('Código PIX copiado!')
                        }}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="bg-green-100 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    ⏰ <strong>Atenção:</strong> O código PIX expira em 30 minutos. Após o pagamento, a confirmação é automática e instantânea.
                  </p>
                </div>
              </div>
            )}

            {/* Instruções */}
            {paymentInfo && (
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Como completar o pagamento
                </h3>
                <div className="text-left space-y-2 text-blue-800">
                  {getInstructions(paymentInfo.payment_method_id).map((instruction, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status automático */}
            <div className="bg-yellow-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                Verificação Automática
              </h3>
              <div className="text-left space-y-2 text-yellow-800">
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>Esta página verifica o status automaticamente a cada 10 segundos</span>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>Você será redirecionado automaticamente quando o pagamento for confirmado</span>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>Não é necessário atualizar a página manualmente</span>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={fetchPaymentInfo}
                disabled={isRefreshing}
                className="flex-1 inline-flex items-center justify-center bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Verificando...' : 'Verificar Status'}
              </button>
              <Link 
                href="/" 
                className="flex-1 inline-flex items-center justify-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Voltar ao início
              </Link>
            </div>

            {/* Informações de contato */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Em caso de dúvidas sobre o pagamento, entre em contato conosco pelo WhatsApp
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações do pagamento...</p>
        </div>
      </div>
    }>
      <PendingContent />
    </Suspense>
  )
} 