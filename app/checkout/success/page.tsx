"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Home, FileText, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PaymentInfo {
  id: string
  status: string
  transaction_amount: number
  date_created: string
  payment_method_id: string
  external_reference?: string
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const paymentId = searchParams?.get('payment_id')

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      if (!paymentId) {
        setError('ID do pagamento não encontrado')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/mercado-pago/process-payment?id=${paymentId}`)
        
        if (!response.ok) {
          throw new Error('Erro ao buscar informações do pagamento')
        }

        const data = await response.json()
        setPaymentInfo(data)
      } catch (err) {
        console.error('Erro ao buscar pagamento:', err)
        setError('Erro ao carregar informações do pagamento')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentInfo()
  }, [paymentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
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
              <CheckCircle className="w-8 h-8 text-red-500" />
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
            {/* Ícone de sucesso */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pagamento Aprovado!
            </h1>
            <p className="text-gray-600 mb-8">
              Seu pedido foi confirmado e está sendo preparado.
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
                    <span className="font-semibold text-green-600">
                      {formatCurrency(paymentInfo.transaction_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método:</span>
                    <span className="capitalize">{paymentInfo.payment_method_id}</span>
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

            {/* Próximos passos */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Próximos Passos
              </h3>
              <div className="text-left space-y-2 text-blue-800">
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Seu pedido está sendo preparado</span>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Você receberá atualizações sobre o status do pedido</span>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>O tempo estimado de entrega é de 30-45 minutos</span>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/" 
                className="flex-1 inline-flex items-center justify-center bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Voltar ao início
              </Link>
              <button 
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FileText className="w-5 h-5 mr-2" />
                Imprimir Recibo
              </button>
            </div>

            {/* Informações de contato */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Em caso de dúvidas, entre em contato conosco pelo WhatsApp
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações do pagamento...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
} 