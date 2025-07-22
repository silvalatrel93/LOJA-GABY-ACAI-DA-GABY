"use client"

import { useEffect, useRef } from 'react'

interface AutoPaymentCheckerProps {
  enabled?: boolean
  intervalMs?: number
}

export default function AutoPaymentChecker({ 
  enabled = true, 
  intervalMs = 30000 // 30 segundos por padrão
}: AutoPaymentCheckerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isCheckingRef = useRef(false)

  const checkPayments = async () => {
    // Evitar múltiplas verificações simultâneas
    if (isCheckingRef.current) {
      console.log('🔄 Verificação já em andamento, pulando...')
      return
    }

    try {
      isCheckingRef.current = true
      console.log('🔍 Verificando status de pagamentos automaticamente...')
      
      const response = await fetch('/api/mercado-pago/auto-check-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.updated > 0) {
          console.log(`✅ ${result.updated} pagamentos atualizados automaticamente`)
          
          // Recarregar a página se houver atualizações para mostrar os novos status
          if (typeof window !== 'undefined') {
            window.location.reload()
          }
        } else {
          console.log('ℹ️ Nenhum pagamento precisou ser atualizado')
        }
      } else {
        console.error('❌ Erro na verificação automática:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Erro ao verificar pagamentos:', error)
    } finally {
      isCheckingRef.current = false
    }
  }

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Verificar imediatamente ao montar o componente
    checkPayments()

    // Configurar verificação periódica
    intervalRef.current = setInterval(checkPayments, intervalMs)

    console.log(`🚀 Verificação automática de pagamentos iniciada (intervalo: ${intervalMs/1000}s)`)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        console.log('🛑 Verificação automática de pagamentos parada')
      }
    }
  }, [enabled, intervalMs])

  // Verificar quando a página ganha foco (usuário volta para a aba)
  useEffect(() => {
    if (!enabled) return

    const handleFocus = () => {
      console.log('👁️ Página ganhou foco, verificando pagamentos...')
      checkPayments()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [enabled])

  // Este componente não renderiza nada visível
  return null
}