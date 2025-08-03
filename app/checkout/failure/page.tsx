"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { XCircle, Home, RotateCcw, AlertCircle, ArrowRight, Phone } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// Força dynamic rendering para evitar problemas de prerendering
export const dynamic = 'force-dynamic'

interface PaymentInfo {
  id: string
  status: string
  status_detail: string
  transaction_amount: number
  date_created: string
  payment_method_id: string
  external_reference?: string
}

function FailureContent() {
  const searchParams = useSearchParams()
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
        const data = {
          id: paymentId,
          status: 'rejected',
          status_detail: 'rejected_insufficient_amount',
          transaction_amount: 0,
          date_created: new Date().toISOString(),
          payment_method_id: 'pix'
        }
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

  const getStatusMessage = (status: string, statusDetail: string) => {
    switch (statusDetail) {
      case 'cc_rejected_insufficient_amount':
        return 'Cartão sem limite suficiente'
      case 'cc_rejected_bad_filled_card_number':
        return 'Número do cartão inválido'
      case 'cc_rejected_bad_filled_date':
        return 'Data de vencimento inválida'
      case 'cc_rejected_bad_filled_other':
        return 'Dados do cartão incorretos'
      case 'cc_rejected_bad_filled_security_code':
        return 'Código de segurança inválido'
      case 'cc_rejected_blacklist':
        return 'Cartão bloqueado'
      case 'cc_rejected_call_for_authorize':
        return 'Transação rejeitada pelo banco'
      case 'cc_rejected_card_disabled':
        return 'Cartão desabilitado'
      case 'cc_rejected_duplicated_payment':
        return 'Pagamento duplicado'
      case 'cc_rejected_high_risk':
        return 'Transação de alto risco'
      case 'cc_rejected_max_attempts':
        return 'Muitas tentativas com dados incorretos'
      case 'cc_rejected_other_reason':
        return 'Transação rejeitada pelo emissor'
      default:
        return status === 'cancelled' ? 'Pagamento cancelado' : 'Pagamento rejeitado'
    }
  }

  const getSuggestions = (statusDetail: string) => {
    switch (statusDetail) {
      case 'cc_rejected_insufficient_amount':
        return [
          'Verifique o limite disponível no seu cartão',
          'Tente usar outro cartão',
          'Entre em contato com seu banco'
        ]
      case 'cc_rejected_bad_filled_card_number':
      case 'cc_rejected_bad_filled_date':
      case 'cc_rejected_bad_filled_security_code':
        return [
          'Verifique os dados do cartão digitados',
          'Confirme o número, validade e CVV',
          'Tente novamente com os dados corretos'
        ]
      case 'cc_rejected_call_for_authorize':
        return [
          'Entre em contato com seu banco',
          'Informe que está tentando fazer uma compra online',
          'Solicite a liberação da transação'
        ]
      case 'cc_rejected_card_disabled':
        return [
          'Verifique se o cartão está ativo',
          'Entre em contato com seu banco',
          'Tente usar outro cartão'
        ]
      case 'cc_rejected_duplicated_payment':
        return [
          'Verifique se o pagamento já foi processado',
          'Aguarde alguns minutos antes de tentar novamente',
          'Use um método de pagamento diferente'
        ]
      case 'cc_rejected_max_attempts':
        return [
          'Aguarde alguns minutos antes de tentar novamente',
          'Verifique todos os dados do cartão',
          'Use outro método de pagamento'
        ]
      default:
        return [
          'Verifique os dados do seu cartão',
          'Tente outro método de pagamento',
          'Entre em contato conosco se o problema persistir'
        ]
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
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
            {/* Ícone de erro */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pagamento Recusado
            </h1>
            <p className="text-gray-600 mb-8">
              {paymentInfo && getStatusMessage(paymentInfo.status, paymentInfo.status_detail)}
            </p>

            {/* Informações do pagamento */}
            {paymentInfo && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Detalhes da Tentativa
                </h2>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID da Tentativa:</span>
                    <span className="font-mono text-sm">{paymentInfo.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(paymentInfo.transaction_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método:</span>
                    <span className="capitalize">{paymentInfo.payment_method_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-red-600 font-medium">
                      {paymentInfo.status === 'cancelled' ? 'Cancelado' : 'Rejeitado'}
                    </span>
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

            {/* Sugestões */}
            {paymentInfo && (
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  O que fazer agora?
                </h3>
                <div className="text-left space-y-2 text-blue-800">
                  {getSuggestions(paymentInfo.status_detail).map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <ArrowRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Métodos alternativos */}
            <div className="bg-green-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                Métodos de Pagamento Alternativos
              </h3>
              <div className="text-left space-y-2 text-green-800">
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Pix - Transferência instantânea</span>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Boleto bancário - Pague em qualquer banco</span>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Outro cartão de crédito ou débito</span>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Pagamento na entrega (dinheiro, cartão ou Pix)</span>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/checkout"
                className="flex-1 inline-flex items-center justify-center bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Tentar Novamente
              </Link>
              <Link 
                href="/" 
                className="flex-1 inline-flex items-center justify-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Voltar ao início
              </Link>
            </div>

            {/* Suporte */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Phone className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-900">Precisa de ajuda?</span>
                </div>
                <p className="text-sm text-yellow-800">
                  Entre em contato conosco pelo WhatsApp e nosso atendimento te ajudará a finalizar seu pedido
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações do pagamento...</p>
        </div>
      </div>
    }>
      <FailureContent />
    </Suspense>
  )
}