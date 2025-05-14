"use client"

import { useState, useEffect } from "react"
import { getStoreStatus } from "@/lib/store-utils"
import { StoreConfigService } from "@/lib/services/store-config-service"
import { Clock } from "lucide-react"
import type { RealtimeChannel } from '@supabase/supabase-js'

interface StoreStatusProps {
  inSideMenu?: boolean
}

export default function StoreStatus({ inSideMenu = false }: StoreStatusProps) {
  const [status, setStatus] = useState<{
    isOpen: boolean
    statusText: string
    statusClass: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const loadStatus = async () => {
      try {
        setIsLoading(true)
        const storeStatus = await getStoreStatus()
        setStatus(storeStatus)
      } catch (error) {
        console.error("Erro ao carregar status da loja:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStatus()

    // Configurar subscrição em tempo real
    const channel = StoreConfigService.subscribeToStoreStatus(
      (isOpen) => {
        setStatus((prevStatus) => {
          if (prevStatus) {
            return {
              ...prevStatus,
              isOpen,
              statusText: isOpen ? "Aberto" : "Fechado",
              statusClass: isOpen ? "text-green-600" : "text-red-600"
            }
          }
          return prevStatus
        })
      },
      (error) => console.error('Erro na subscrição em tempo real:', error)
    )

    setRealtimeChannel(channel)

    // Atualizar o status a cada minuto
    const interval = setInterval(loadStatus, 60000)
    
    return () => {
      clearInterval(interval)
      if (channel) {
        StoreConfigService.unsubscribeFromStoreStatus(channel)
      }
    }
  }, [])

  // Se não estiver no menu lateral e não for explicitamente solicitado para aparecer no cabeçalho, não renderize nada
  if (!inSideMenu && !window.location.pathname.includes("/admin")) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center text-sm">
        <Clock size={16} className="mr-1 text-gray-400" />
        <span className="animate-pulse">Verificando horário...</span>
      </div>
    )
  }

  if (!status) return null

  return (
    <div className="flex items-center text-sm animate-float">
      <Clock size={16} className={`mr-1 ${status.isOpen ? "text-green-600" : "text-red-600"}`} />
      <span className={status.statusClass}>{status.statusText}</span>
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
