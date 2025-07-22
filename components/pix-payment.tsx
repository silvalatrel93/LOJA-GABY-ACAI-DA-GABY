"use client"

import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PixPaymentProps {
  amount: number
  description: string
  customerEmail: string
  customerName: string
  orderId: string
  onPaymentSuccess: (paymentId: string) => void
  onPaymentError: (error: string) => void
}

interface PaymentData {
  id: string
  status: string
  qr_code: string
  qr_code_base64: string
  ticket_url: string
  date_of_expiration: string
}

export function PixPayment({
  amount,
  description,
  customerEmail,
  customerName,
  orderId,
  onPaymentSuccess,
  onPaymentError
}: PixPaymentProps) {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected' | 'expired'>('pending')
  const [checkingPayment, setCheckingPayment] = useState(false)

  // Criar pagamento PIX
  useEffect(() => {
    createPixPayment()
  }, [])

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (!paymentData?.id) return

    const interval = setInterval(() => {
      checkPaymentStatus()
    }, 5000) // Verificar a cada 5 segundos

    return () => clearInterval(interval)
  }, [paymentData?.id])

  // Countdown timer
  useEffect(() => {
    if (!paymentData?.date_of_expiration) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const expiration = new Date(paymentData.date_of_expiration).getTime()
      const difference = expiration - now

      if (difference > 0) {
        setTimeLeft(Math.floor(difference / 1000))
      } else {
        setTimeLeft(0)
        setPaymentStatus('expired')
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [paymentData?.date_of_expiration])

  const createPixPayment = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/mercado-pago/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_amount: amount,
          description,
          payment_method_id: 'pix',
          payer: {
            email: customerEmail,
            first_name: customerName.split(' ')[0],
            last_name: customerName.split(' ').slice(1).join(' ') || customerName.split(' ')[0]
          },
          external_reference: orderId,
          notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercado-pago/webhook`
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
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (!paymentData?.id || checkingPayment) return

    try {
      setCheckingPayment(true)
      
      const response = await fetch(`/api/mercado-pago/pix?payment_id=${paymentData.id}`)
      
      if (!response.ok) {
        throw new Error('Erro ao verificar status do pagamento')
      }

      const data = await response.json()
      
      if (data.status === 'approved') {
        setPaymentStatus('approved')
        onPaymentSuccess(data.id)
      } else if (data.status === 'rejected' || data.status === 'cancelled') {
        setPaymentStatus('rejected')
        onPaymentError('Pagamento rejeitado ou cancelado')
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
    } finally {
      setCheckingPayment(false)
    }
  }

  const copyPixCode = async () => {
    if (!paymentData?.qr_code) return

    try {
      await navigator.clipboard.writeText(paymentData.qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (error) {
      console.error('Erro ao copiar código PIX:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Gerando PIX...</p>
      </div>
    )
  }

  if (paymentStatus === 'approved') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold text-green-700 mb-2">Pagamento Aprovado!</h3>
        <p className="text-gray-600">Seu pedido foi confirmado e está sendo preparado.</p>
      </div>
    )
  }

  if (paymentStatus === 'rejected') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-700 mb-2">Pagamento Rejeitado</h3>
        <p className="text-gray-600 mb-4">Houve um problema com o pagamento. Tente novamente.</p>
        <button
          onClick={createPixPayment}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  if (paymentStatus === 'expired') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Clock className="w-16 h-16 text-orange-500 mb-4" />
        <h3 className="text-xl font-semibold text-orange-700 mb-2">PIX Expirado</h3>
        <p className="text-gray-600 mb-4">O tempo para pagamento expirou. Gere um novo PIX.</p>
        <button
          onClick={createPixPayment}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Gerar Novo PIX
        </button>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-700 mb-2">Erro ao Gerar PIX</h3>
        <p className="text-gray-600 mb-4">Nao foi possivel gerar o codigo PIX. Tente novamente.</p>
        <button
          onClick={createPixPayment}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pagamento PIX</h2>
        <p className="text-3xl font-bold text-green-600">{formatCurrency(amount)}</p>
        {timeLeft > 0 && (
          <div className="flex items-center justify-center mt-2 text-orange-600">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">Expira em {formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <QRCodeSVG
            value={paymentData.qr_code}
            size={200}
            level="M"
            includeMargin={true}
          />
        </div>
      </div>

      {/* Código PIX */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Codigo PIX (Copia e Cola)
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={paymentData.qr_code}
            readOnly
            className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
          />
          <button
            onClick={copyPixCode}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Copiar codigo PIX"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        {copied && (
          <p className="text-sm text-green-600 mt-1">Codigo copiado!</p>
        )}
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-blue-800 mb-2">Como pagar:</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Abra o app do seu banco</li>
          <li>2. Escolha a opcao PIX</li>
          <li>3. Escaneie o QR Code ou cole o codigo</li>
          <li>4. Confirme o pagamento</li>
        </ol>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center space-x-2 text-gray-600">
        {checkingPayment ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
        <span className="text-sm">
          {checkingPayment ? 'Verificando pagamento...' : 'Aguardando pagamento'}
        </span>
      </div>
    </div>
  )
}