"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useCart, CartProvider } from '@/lib/cart-context'
import { formatCurrency } from '@/lib/utils'
import MercadoPagoCheckout from '@/components/mercado-pago-checkout'
import Link from 'next/link'
import { Suspense } from 'react'

// Componente interno que usa o useCart
function PagamentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { cart, isTableOrder, tableInfo } = useCart()
  const [isClient, setIsClient] = useState(false)
  
  // Dados do cliente vindos da URL
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    document: ''
  })
  
  // Dados do pedido vindos da URL
  const [orderData, setOrderData] = useState<any>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    // Recuperar dados da URL ou localStorage
    const urlCustomerData = {
      name: searchParams.get('name') || '',
      email: searchParams.get('email') || '',
      phone: searchParams.get('phone') || '',
      document: searchParams.get('document') || '11111111111'
    }
    
    const urlTotal = parseFloat(searchParams.get('total') || '0')
    
    // Se não há dados na URL, tentar localStorage
    if (!urlCustomerData.name && typeof window !== 'undefined') {
      const savedData = localStorage.getItem('checkout_data')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        setCustomerData(parsed.customerData || urlCustomerData)
        setOrderData(parsed.orderData)
        setTotal(parsed.total || urlTotal)
      }
    } else {
      setCustomerData(urlCustomerData)
      setTotal(urlTotal)
    }

    // Dados do pedido
    const orderInfo = {
      items: cart,
      deliveryInfo: isTableOrder ? tableInfo : {
        address: searchParams.get('address') || '',
        neighborhood: searchParams.get('neighborhood') || '',
        number: searchParams.get('number') || '',
        complement: searchParams.get('complement') || '',
        city: searchParams.get('city') || ''
      },
      isTableOrder,
      tableInfo
    }
    
    setOrderData(orderInfo)
  }, [isClient, searchParams, cart, isTableOrder, tableInfo])

  // Loading state durante hidratação
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não há dados suficientes, redirecionar para checkout
  if (!customerData.name || !total || cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Dados do pedido não encontrados
          </h2>
          <p className="text-gray-600 mb-6">
            Parece que você chegou aqui diretamente. Vamos te redirecionar para o checkout.
          </p>
          <Link 
            href="/checkout"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Ir para Checkout
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Voltar</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              💳 Pagamento Online
            </h1>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Resumo do Pedido - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resumo do Pedido
              </h2>
              
              {/* Itens */}
              <div className="space-y-3 mb-4">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.size && (
                        <p className="text-gray-500">{item.size}</p>
                      )}
                      <p className="text-gray-500">Qtd: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-purple-600">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Dados do Cliente */}
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Dados do Cliente</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Nome:</strong> {customerData.name}</p>
                  <p><strong>Telefone:</strong> {customerData.phone}</p>
                  {!isTableOrder && orderData?.deliveryInfo && (
                    <div className="mt-2">
                      <p><strong>Endereço:</strong></p>
                      <p className="text-xs">
                        {orderData.deliveryInfo.address}, {orderData.deliveryInfo.number}
                        <br />
                        {orderData.deliveryInfo.neighborhood} - {orderData.deliveryInfo.city}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Formulário de Pagamento - Conteúdo Principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Finalize seu Pagamento
              </h2>
              
              <MercadoPagoCheckout
                total={total}
                customerData={{
                  name: customerData.name,
                  email: customerData.email || customerData.name + "@pedifacil.com",
                  phone: customerData.phone,
                  document: customerData.document
                }}
                orderData={orderData}
                onSuccess={(paymentData) => {
                  console.log('🎉 Pagamento aprovado:', paymentData)
                  router.push(`/checkout/success?payment_id=${paymentData.id}`)
                }}
                onError={(error) => {
                  console.error('❌ Erro no pagamento:', error)
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente principal que envolve o conteúdo com CartProvider
export default function PagamentoPage() {
  return (
    <CartProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      }>
        <PagamentoContent />
      </Suspense>
    </CartProvider>
  )
}
