"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function MercadoPagoTest() {
  const [credentials, setCredentials] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testCredentials = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🧪 Testando carregamento de credenciais...')
      
      const response = await fetch('/api/mercado-pago/credentials?loja_id=default-store')
      const result = await response.json()
      
      console.log('📝 Resposta da API:', result)
      
      if (response.ok) {
        setCredentials(result)
        console.log('✅ Credenciais carregadas:', result)
      } else {
        setError(result.error || 'Erro ao carregar credenciais')
        console.error('❌ Erro:', result)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMsg)
      console.error('❌ Erro ao testar:', err)
    } finally {
      setLoading(false)
    }
  }

  const testPublicKey = () => {
    const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY
    console.log('🔑 NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY:', publicKey ? 'Configurada' : 'NÃO configurada')
    console.log('🔑 Valor:', publicKey)
  }

  useEffect(() => {
    testPublicKey()
  }, [])

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">🧪 Teste Mercado Pago</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Variável de Ambiente:</h3>
          <p className="text-sm text-gray-600">
            NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY: {
              process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ? 
              '✅ Configurada' : 
              '❌ NÃO configurada'
            }
          </p>
        </div>

        <Button 
          onClick={testCredentials} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testando...' : 'Testar Credenciais do Admin'}
        </Button>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {credentials && (
          <div className="p-3 bg-green-100 border border-green-300 rounded">
            <strong>✅ Credenciais encontradas:</strong>
            <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(credentials, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-semibold text-blue-800">📋 Instruções:</h4>
        <ol className="text-sm text-blue-700 mt-2 space-y-1">
          <li>1. Configure credenciais em <code>/admin/mercado-pago</code></li>
          <li>2. Teste o carregamento clicando no botão</li>
          <li>3. Verifique se a variável de ambiente está configurada</li>
          <li>4. Abra o console (F12) para ver logs detalhados</li>
        </ol>
      </div>
    </div>
  )
}
