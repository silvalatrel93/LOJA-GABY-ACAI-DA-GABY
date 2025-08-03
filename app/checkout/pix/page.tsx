"use client"

import dynamic from 'next/dynamic'

// Força dynamic rendering para evitar problemas de prerendering
const dynamicConfig = 'force-dynamic'

// Carrega o componente dinamicamente para evitar SSR
const PixPaymentContent = dynamic(() => import('./pix-content'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Carregando...</h2>
        <p className="text-gray-500">Preparando pagamento PIX</p>
      </div>
    </div>
  )
})

export default function PixPaymentPage() {
  return <PixPaymentContent />
}