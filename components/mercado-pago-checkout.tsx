"use client"

import React, { useState, useEffect } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import dynamic from 'next/dynamic'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { LoaderIcon, CheckCircle, AlertCircle } from 'lucide-react'

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

interface PixPaymentData {
  id: string
  status: string
  qr_code_base64: string
  qr_code: string
  ticket_url?: string
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
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [pixPaymentData, setPixPaymentData] = useState<PixPaymentData | null>(null)
  const [showPixQR, setShowPixQR] = useState(false)

  // Carregar credenciais e inicializar Mercado Pago
  useEffect(() => {
    const initializeMercadoPago = async () => {
      try {
        console.log('🚀 Inicializando Mercado Pago...')
        
        // Carregar credenciais do admin
        const response = await fetch('/api/mercado-pago/credentials?loja_id=default-store')
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao carregar credenciais')
        }
        
        if (!result.public_key) {
          throw new Error('Public Key não encontrada. Configure as credenciais no admin.')
        }
        
        console.log('🔑 Public Key carregada, inicializando SDK...')
        
        // Inicializar Mercado Pago com a chave do admin
        if (typeof window !== 'undefined') {
          initMercadoPago(result.public_key)
          setIsInitialized(true)
          console.log('✅ Mercado Pago inicializado com sucesso!')
        }
        
      } catch (error) {
        console.error('❌ Erro ao inicializar Mercado Pago:', error)
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
        setInitError(errorMsg)
        setPaymentStatus({
          status: 'error',
          message: errorMsg
        })
      }
    }
    
    initializeMercadoPago()
  }, [])

  // Configuração de inicialização do Payment Brick
  const initialization = {
    amount: total,
    preferenceId: undefined // Para pagamentos diretos
  }

  // Função para criar pagamento PIX
  const createPixPayment = async () => {
    try {
      setIsProcessing(true)
      setPaymentStatus({
        status: 'processing',
        message: 'Gerando QR Code PIX...'
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
      const externalReference = `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Criar pagamento PIX
      const response = await fetch('/api/mercado-pago/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loja_id: 'default-store',
          payment_method_id: 'pix',
          transaction_amount: total,
          description: `Pedido PediFacil - ${externalReference}`,
          payer: payerData,
          external_reference: externalReference
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar pagamento PIX')
      }

      // Salvar dados do PIX
      setPixPaymentData({
        id: result.id,
        status: result.status,
        qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64 || '',
        qr_code: result.point_of_interaction?.transaction_data?.qr_code || '',
        ticket_url: result.point_of_interaction?.transaction_data?.ticket_url
      })

      setShowPixQR(true)
      setPaymentStatus({
        status: 'pending',
        message: 'QR Code PIX gerado! Escaneie para pagar.',
        paymentId: result.id
      })

    } catch (error) {
      console.error('❌ Erro ao criar pagamento PIX:', error)
      setPaymentStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao gerar PIX'
      })
    } finally {
      setIsProcessing(false)
    }
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
    },
    callbacks: {
      onReady: () => {
        console.log('💳 Payment Brick carregado')
      },
      onSubmit: async ({ selectedPaymentMethod, formData }: any) => {
        console.log('💳 Método selecionado:', selectedPaymentMethod, formData)
        
        // Se for PIX, interceptar e criar pagamento customizado
        if (selectedPaymentMethod === 'pix' || formData?.payment_method_id === 'pix') {
          console.log('💳 Interceptando pagamento PIX')
          await createPixPayment()
          return { status: 'success' } // Retornar sucesso para o brick
        }
        
        // Para outros métodos, continuar com o fluxo normal
        console.log('💳 Processando pagamento normal:', selectedPaymentMethod)
        return onSubmit({ selectedPaymentMethod, formData })
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
          description: `Pedido PediFácil - ${orderData.items?.length || 0} item(s)`,
          loja_id: 'default-store',
          metadata: {
            order_data: JSON.stringify(orderData),
            customer_phone: customerData.phone
          }
        }

        console.log('💳 Dados de pagamento detalhados:', {
          transaction_amount: paymentData.transaction_amount,
          payment_method_id: paymentData.payment_method_id,
          has_token: !!paymentData.token,
          token_length: paymentData.token ? paymentData.token.length : 0,
          token_preview: paymentData.token ? paymentData.token.substring(0, 10) + '...' : 'N/A',
          installments: paymentData.installments,
          payer_email: paymentData.payer.email,
          external_reference: paymentData.external_reference
        })

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
          console.error('❌ Erro na API:', {
            status: response.status,
            error: result.error,
            details: result.details
          })
          
          // Mensagens de erro mais específicas
          let errorMessage = result.error || 'Erro ao processar pagamento'
          
          if (result.details && result.details.includes('token')) {
            errorMessage = 'Erro no token do cartão. Verifique os dados e tente novamente.'
          } else if (result.details && result.details.includes('credentials')) {
            errorMessage = 'Erro nas credenciais do Mercado Pago. Entre em contato com o suporte.'
          } else if (response.status === 500) {
            errorMessage = 'Erro interno do servidor. Tente novamente em alguns instantes.'
          }
          
          throw new Error(errorMessage)
        }

        console.log('Resposta do pagamento:', result)

        // Verificar status do pagamento
        console.log('Status recebido:', result.status, 'Status detail:', result.status_detail);
        
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

        } else if (result.status === 'in_process') {
          setPaymentStatus({
            status: 'processing',
            message: 'Pagamento em processamento. Aguarde a confirmação.',
            paymentId: result.id
          })

          onSuccess?.(result)
          
          setTimeout(() => {
            router.push('/checkout/pending?payment_id=' + result.id)
          }, 2000)

          resolve(result)

        } else if (result.status === 'rejected') {
          setPaymentStatus({
            status: 'error',
            message: `Pagamento rejeitado: ${result.status_detail || 'Verifique os dados e tente novamente.'}`
          })

          onError?.(new Error(`Pagamento rejeitado: ${result.status_detail}`))
          reject(new Error(`Pagamento rejeitado: ${result.status_detail}`))

        } else {
          // Log para debug de status não tratados
          console.warn('Status não tratado:', result.status, result.status_detail);
          
          setPaymentStatus({
            status: 'error',
            message: `Status inesperado: ${result.status}. Entre em contato com o suporte.`
          })

          onError?.(new Error(`Status inesperado: ${result.status}`))
          reject(new Error(`Status inesperado: ${result.status}`))
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
          
          {/* QR Code PIX */}
          {showPixQR && pixPaymentData && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 text-center">
                📱 Escaneie o QR Code para pagar
              </h4>
              
              {pixPaymentData.qr_code_base64 && (
                <div className="flex justify-center mb-4">
                  <img 
                    src={`data:image/png;base64,${pixPaymentData.qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
              
              {pixPaymentData.qr_code && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 text-center">
                    Ou copie e cole o código PIX:
                  </p>
                  <div className="bg-gray-50 p-3 rounded border">
                    <code className="text-xs break-all text-gray-700">
                      {pixPaymentData.qr_code}
                    </code>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixPaymentData.qr_code)
                      alert('Código PIX copiado!')
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors"
                  >
                    📋 Copiar Código PIX
                  </button>
                </div>
              )}
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-700 text-center">
                  ℹ️ O pagamento será confirmado automaticamente após a transferência.
                </p>
              </div>
            </div>
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
        
        {!isInitialized || isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoaderIcon className="w-6 h-6 animate-spin text-purple-500" />
            <span className="ml-2 text-gray-600">
              {!isInitialized ? 'Inicializando Mercado Pago...' : 'Carregando...'}
            </span>
          </div>
        ) : initError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="font-medium text-red-700">Erro na inicialização</p>
            </div>
            <p className="text-red-600 mt-1">{initError}</p>
            <p className="text-sm text-red-500 mt-2">
              Verifique se as credenciais estão configuradas em <strong>/admin/mercado-pago</strong>
            </p>
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
