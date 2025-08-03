'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import QRCode from 'qrcode.react'

interface PixPaymentProps {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  customerDocument: string
  onPaymentSuccess: () => void
  onPaymentError: (error: string) => void
}

interface PaymentData {
  id: string
  status: string
  qr_code: string
  qr_code_base64: string
  ticket_url: string
  expiration_date: string
}

export function PixPayment({
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  customerDocument,
  onPaymentSuccess,
  onPaymentError
}: PixPaymentProps) {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)
  const [copied, setCopied] = useState(false)

  // Criar pagamento PIX
  useEffect(() => {
    createPixPayment()
  }, [])

  // Timer para expiração
  useEffect(() => {
    if (paymentData?.expiration_date) {
      const expirationTime = new Date(paymentData.expiration_date).getTime()
      
      const timer = setInterval(() => {
        const now = new Date().getTime()
        const timeLeft = expirationTime - now
        
        if (timeLeft <= 0) {
          setIsExpired(true)
          setTimeLeft(0)
          clearInterval(timer)
        } else {
          setTimeLeft(Math.floor(timeLeft / 1000))
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [paymentData])

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (paymentData?.id && !isExpired) {
      const interval = setInterval(() => {
        checkPaymentStatus()
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [paymentData, isExpired])

  const createPixPayment = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/mercado-pago/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_amount: amount,
          description: `Pedido #${orderId}`,
          payment_method_id: 'pix',
          payer: {
            email: customerEmail,
            first_name: customerName.split(' ')[0],
            last_name: customerName.split(' ').slice(1).join(' ') || customerName.split(' ')[0],
            identification: {
              type: 'CPF',
              number: customerDocument
            }
          },
          external_reference: orderId
          // notification_url removida para desenvolvimento local
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao criar pagamento PIX')
      }

      const data = await response.json()
      setPaymentData(data)
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error)
      onPaymentError('Erro ao gerar PIX. Tente novamente.')
      setError('Erro ao gerar PIX. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (!paymentData?.id) return

    try {
      const response = await fetch(`/api/mercado-pago/pix?payment_id=${paymentData.id}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.status === 'approved') {
          onPaymentSuccess()
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const copyPixCode = async () => {
    if (paymentData?.qr_code) {
      try {
        await navigator.clipboard.writeText(paymentData.qr_code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Erro ao copiar código PIX:', error)
      }
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Gerando PIX...</p>
        </CardContent>
      </Card>
    )
  }

  if (error && !paymentData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={createPixPayment}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isExpired) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="text-orange-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-orange-700 mb-2">PIX Expirado</h3>
          <p className="text-gray-600 mb-4">O tempo para pagamento expirou. Gere um novo PIX.</p>
          <Button 
            onClick={createPixPayment}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Gerar Novo PIX
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-700 mb-2">Erro ao Gerar PIX</h3>
          <p className="text-gray-600 mb-4">Nao foi possivel gerar o codigo PIX. Tente novamente.</p>
          <Button 
            onClick={createPixPayment}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!paymentData) {
    return null
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <span className="text-2xl">💰</span>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pagamento PIX</h2>
        </CardTitle>
        {timeLeft > 0 && (
          <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
            <p className="text-orange-700 font-semibold">Tempo restante:</p>
            <p className="text-2xl font-bold text-orange-600">{formatTime(timeLeft)}</p>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* QR Code */}
        {paymentData.qr_code_base64 && (
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
              <img 
                src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                alt="QR Code PIX"
                className="w-48 h-48 mx-auto"
              />
            </div>
          </div>
        )}

        {/* Código PIX */}
        {paymentData.qr_code && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Codigo PIX (Copia e Cola)
            </label>
            <div className="relative">
              <textarea
                value={paymentData.qr_code}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50 resize-none"
                rows={3}
              />
              <Button
                onClick={copyPixCode}
                size="sm"
                className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-600 text-white"
                title="Copiar codigo PIX"
              >
                {copied ? '✓' : '📋'}
              </Button>
            </div>
            {copied && (
              <p className="text-green-600 text-sm mt-1">Código copiado!</p>
            )}
          </div>
        )}

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Como pagar:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Abra o app do seu banco</li>
            <li>2. Escolha a opcao PIX</li>
            <li>3. Escaneie o QR Code ou cole o codigo</li>
            <li>4. Confirme o pagamento</li>
          </ol>
        </div>

        {/* Status */}
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Aguardando pagamento...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}