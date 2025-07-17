"use client"

import React, { useState, useEffect } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import dynamic from 'next/dynamic'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { LoaderIcon, CheckCircle, AlertCircle } from 'lucide-react'

// Inicializar Mercado Pago
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
  initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY)
}

interface MercadoPagoCheckoutProps {
  total: number
  customerData: {
    name: string
    email: string
    phone: string
    document?: string
  }
  orderData: any
  onSuccess?: (paymentData: any) => void
  onError?: (error: any) => void
  isLoading?: boolean
}

interface PaymentStatus {
  status: 'pending' | 'processing' | 'success' | 'error' | null
  message: string
  paymentId?: string
}

function MercadoPagoCheckoutComponent({
  total,
  customerData,
  orderData,
  onSuccess,
  onError,
  isLoading = false
}: MercadoPagoCheckoutProps) {
  const router = useRouter()
  const { clearCart } = useCart()
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: null,
    message: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)

  // Configuração de inicialização do Payment Brick
  const initialization = {
    amount: total,
    preferenceId: undefined // Para pagamentos diretos
  }

  // Customização dos métodos de pagamento
  const customization = {
    paymentMethods: {
      ticket: "all" as const,
      bankTransfer: "all" as const, 
      creditCard: "all" as const,
      debitCard: "all" as const,
      mercadoPago: "all" as const,
    },
    visual: {
      style: {
        theme: 'default' as const
      }
    }
  }

  // Callback quando formulário é submetido
  const onSubmit = async ({ selectedPaymentMethod, formData }: any) => {
    return new Promise(async (resolve, reject) => {
      try {
        setIsProcessing(true)
        setPaymentStatus({
          status: 'processing',
          message: 'Processando pagamento...'
        })

        // Preparar dados do pagador
        const payerData = {
          email: customerData.email,
          first_name: customerData.name.split(' ')[0],
          last_name: customerData.name.split(' ').slice(1).join(' ') || customerData.name,
          identification: customerData.document ? {
            type: 'CPF',
            number: customerData.document.replace(/\D/g, '')
          } : undefined
        }

        // Gerar referência externa única
        const externalReference = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Preparar dados para a API
        const paymentData = {
          transaction_amount: total,
          payment_method_id: formData.payment_method_id,
          token: formData.token,
          installments: formData.installments || 1,
          payer: payerData,
          external_reference: externalReference,
          description: `Pedido HEAI AÇAÍ - ${orderData.items?.length || 0} item(s)`,
          metadata: {
            order_data: JSON.stringify(orderData),
            customer_phone: customerData.phone
          }
        }

        console.log('Enviando dados de pagamento:', paymentData)

        // Enviar para API
        const response = await fetch('/api/mercado-pago/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData)
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao processar pagamento')
        }

        console.log('Resposta do pagamento:', result)

        // Verificar status do pagamento
        if (result.status === 'approved') {
          setPaymentStatus({
            status: 'success',
            message: 'Pagamento aprovado! Seu pedido foi confirmado.',
            paymentId: result.id
          })

          // Limpar carrinho e chamar callback de sucesso
          await clearCart()
          onSuccess?.(result)
          
          // Redirecionar após delay
          setTimeout(() => {
            router.push('/checkout/success?payment_id=' + result.id)
          }, 2000)

          resolve(result)

        } else if (result.status === 'pending') {
          setPaymentStatus({
            status: 'pending',
            message: 'Pagamento pendente. Você receberá uma confirmação em breve.',
            paymentId: result.id
          })

          // Para pagamentos pendentes, também considerar como sucesso
          onSuccess?.(result)
          
          setTimeout(() => {
            router.push('/checkout/pending?payment_id=' + result.id)
          }, 2000)

          resolve(result)

        } else {
          // Mapear códigos de erro para mensagens amigáveis
          const getErrorMessage = (status: string, detail: string) => {
            const errorMessages: Record<string, string> = {
              'cc_rejected_high_risk': 'Cartão rejeitado por segurança. Tente outro cartão ou entre em contato com seu banco.',
              'cc_rejected_insufficient_amount': 'Cartão rejeitado por fundos insuficientes. Verifique seu limite disponível.',
              'cc_rejected_bad_filled_card_number': 'Número do cartão inválido. Verifique os dados digitados.',
              'cc_rejected_bad_filled_date': 'Data de validade inválida. Verifique a data do cartão.',
              'cc_rejected_bad_filled_security_code': 'Código de segurança inválido. Verifique o CVV do cartão.',
              'cc_rejected_call_for_authorize': 'Cartão rejeitado. Entre em contato com seu banco para autorizar o pagamento.',
              'cc_rejected_card_disabled': 'Cartão desabilitado. Entre em contato com seu banco.',
              'cc_rejected_duplicated_payment': 'Pagamento duplicado. Aguarde alguns minutos antes de tentar novamente.',
              'cc_rejected_max_attempts': 'Número máximo de tentativas excedido. Tente novamente mais tarde.',
              'rejected': 'Pagamento rejeitado. Verifique os dados ou tente outro cartão.'
            }
            
            return errorMessages[detail] || errorMessages[status] || `Pagamento ${status}: ${detail}`
          }
          
          throw new Error(getErrorMessage(result.status, result.status_detail || ''))
        }

      } catch (error) {
        console.error('Erro no pagamento:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        
        setPaymentStatus({
          status: 'error',
          message: errorMessage
        })

        onError?.(error)
        reject(error)
      } finally {
        setIsProcessing(false)
      }
    })
  }

  // Callback para quando o brick está pronto
  const onReady = async () => {
    console.log('Payment Brick está pronto')
  }

  // Callback para erros do brick
  const onBrickError = async (error: any) => {
    console.error('Erro no Payment Brick:', error)
    setPaymentStatus({
      status: 'error',
      message: 'Erro ao carregar formulário de pagamento'
    })
    onError?.(error)
  }

  // Se não tiver chave pública, mostrar erro
  if (!process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">
            Chave pública do Mercado Pago não configurada
          </p>
        </div>
      </div>
    )
  }

  // Mostrar status do pagamento se houver
  if (paymentStatus.status) {
    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-lg border ${
          paymentStatus.status === 'success' ? 'bg-green-50 border-green-200' :
          paymentStatus.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
          paymentStatus.status === 'processing' ? 'bg-blue-50 border-blue-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {paymentStatus.status === 'processing' && (
              <LoaderIcon className="w-5 h-5 animate-spin text-blue-500" />
            )}
            {paymentStatus.status === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {paymentStatus.status === 'pending' && (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            {paymentStatus.status === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <p className={`font-medium ${
              paymentStatus.status === 'success' ? 'text-green-700' :
              paymentStatus.status === 'pending' ? 'text-yellow-700' :
              paymentStatus.status === 'processing' ? 'text-blue-700' :
              'text-red-700'
            }`}>
              {paymentStatus.message}
            </p>
          </div>
          {paymentStatus.paymentId && (
            <p className="text-sm text-gray-600 mt-2">
              ID do pagamento: {paymentStatus.paymentId}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Resumo do Pagamento</h3>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total a pagar:</span>
          <span className="font-bold text-lg text-purple-600">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Escolha a forma de pagamento
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoaderIcon className="w-6 h-6 animate-spin text-purple-500" />
            <span className="ml-2 text-gray-600">Carregando...</span>
          </div>
        ) : (
          <Payment
            initialization={initialization}
            customization={customization}
            onSubmit={onSubmit}
            onReady={onReady}
            onError={onBrickError}
          />
        )}
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <LoaderIcon className="w-6 h-6 animate-spin text-purple-500" />
              <span className="text-gray-900">Processando pagamento...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Exportar com dynamic import para evitar SSR
const MercadoPagoCheckout = dynamic(
  () => Promise.resolve(MercadoPagoCheckoutComponent),
  { ssr: false }
)

export default MercadoPagoCheckout 