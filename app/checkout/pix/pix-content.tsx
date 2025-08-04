"use client"

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PixPayment } from '@/components/pix-payment'
import { getStoreConfig, type StoreConfig } from '@/lib/services/store-config-service'

export default function PixPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  // Parâmetros da URL
  const amount = searchParams?.get('amount')
  const description = searchParams?.get('description')
  const customerEmail = searchParams?.get('email')
  const customerName = searchParams?.get('name')
  const orderId = searchParams?.get('order_id')

  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        const config = await getStoreConfig()
        setStoreConfig(config)
      } catch (error) {
        console.error('Erro ao carregar configurações da loja:', error)
      }
    }

    loadStoreConfig()
  }, [])

  // Verificar se todos os parâmetros necessários estão presentes
  useEffect(() => {
    if (!amount || !description || !customerEmail || !customerName || !orderId) {
      router.push('/checkout')
    }
  }, [amount, description, customerEmail, customerName, orderId, router])

  const handlePaymentSuccess = () => {
    setPaymentCompleted(true)
    // Redirecionar para página de sucesso após 3 segundos
    setTimeout(() => {
      router.push(`/checkout/success?order_id=${orderId}`)
    }, 3000)
  }

  const handlePaymentError = (error: string) => {
    console.error('Erro no pagamento:', error)
    // Redirecionar para página de falha
    router.push(`/checkout/failure?error=${encodeURIComponent(error)}&order_id=${orderId}`)
  }

  if (!amount || !description || !customerEmail || !customerName || !orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Carregando...</h2>
          <p className="text-gray-500">Preparando pagamento PIX</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header 
        className="text-white p-4 sticky top-0 z-10 shadow-lg" 
        style={{ 
          background: `linear-gradient(to right, ${storeConfig?.storeColor || '#8B5CF6'}, ${storeConfig?.storeColor || '#8B5CF6'}dd)`,
          boxShadow: `0 4px 6px -1px ${storeConfig?.storeColor || '#8B5CF6'}20`
        }}
      >
        <div className="container mx-auto flex items-center">
          <Link href="/checkout" className="mr-4">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">Pagamento PIX</h1>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 container mx-auto p-4 max-w-lg">
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Detalhes do Pedido</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Pedido:</span>
              <span className="font-medium">#{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">E-mail:</span>
              <span className="font-medium">{customerEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Descrição:</span>
              <span className="font-medium">{description}</span>
            </div>
          </div>
        </div>

        {/* Componente de pagamento PIX */}
        {!paymentCompleted && (
          <PixPayment
            amount={parseFloat(amount)}
            customerEmail={customerEmail}
            customerName={customerName}
            customerPhone=""
            customerDocument=""
            orderId={orderId}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        )}

        {paymentCompleted && (
          <div className="text-center p-8">
            <div className="animate-pulse">
              <h3 className="text-xl font-semibold text-green-700 mb-2">Pagamento Confirmado!</h3>
              <p className="text-gray-600">Redirecionando...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer 
        className="text-white p-4 mt-auto shadow-lg" 
        style={{ 
          background: `linear-gradient(to right, ${storeConfig?.storeColor || '#8B5CF6'}, ${storeConfig?.storeColor || '#8B5CF6'}dd)`,
          boxShadow: `0 -4px 6px -1px ${storeConfig?.storeColor || '#8B5CF6'}20`
        }}
      >
        <div className="text-center">
          <p>
            © {new Date().getFullYear()} {storeConfig?.name || "Açaí Delícia"} - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}