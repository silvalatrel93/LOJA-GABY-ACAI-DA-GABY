"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, BellRing, BellOff } from "lucide-react"
import { NotificationService } from "@/lib/services/notification-service"
import type { Notification } from "@/lib/types"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { createSafeKey } from "@/lib/key-utils"

// Contexto global para notificações
let notificationListeners: (() => void)[] = []

// Função para notificar todos os componentes sobre novas notificações
export function notifyNewNotification() {
  notificationListeners.forEach((listener) => listener())
}

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isPushSupported, setIsPushSupported] = useState(false)
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const { permission, isSubscribed, subscribeToPushNotifications, unsubscribeFromPushNotifications } = usePushNotifications()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [newNotification, setNewNotification] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const prevUnreadCountRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Criar elemento de áudio para notificação
  useEffect(() => {
    audioRef.current = new Audio("/notification-sound.mp3")
    
    return () => {
      audioRef.current = null
    }
  }, [])

  const loadNotifications = async () => {
    if (isLoading) return
    
    try {
      setIsLoading(true)
      const activeNotifications = await NotificationService.getActiveNotifications()
      
      setNotifications(activeNotifications)
      const newUnreadCount = activeNotifications.filter((n) => !n.read).length

      // Verificar se há novas notificações não lidas
      if (newUnreadCount > prevUnreadCountRef.current) {
        setNewNotification(true)
        
        // Tocar som de notificação
        if (audioRef.current) {
          try {
            await audioRef.current.play().catch((e) => {
              if (e.name === 'NotAllowedError') {
                console.log("Reprodução automática bloqueada pelo navegador. Isso é normal.")
              } else {
                console.warn("Erro ao tocar som de notificação:", e)
              }
            })
          } catch (error) {
            console.warn("Erro ao tocar som de notificação:", error)
          }
        }

        // Remover animação após 2 segundos
        setTimeout(() => {
          setNewNotification(false)
        }, 2000)
      }

      setUnreadCount(newUnreadCount)
      prevUnreadCountRef.current = newUnreadCount
    } catch (error) {
      console.error("Erro ao carregar notificações:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    let hasCheckedPushNotifications = false
    
    const safeLoadNotifications = async () => {
      if (!isMounted) return
      await loadNotifications()
    }
    
    const checkPushSupport = () => {
      if (!hasCheckedPushNotifications) {
        hasCheckedPushNotifications = true
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
        setIsPushSupported(isSupported)
        
        if (isSupported) {
          setIsPushEnabled(isSubscribed)
        }
      }
    }
    
    // Carregar notificações iniciais
    safeLoadNotifications()
    checkPushSupport()

    // Adicionar listener para novas notificações
    notificationListeners.push(safeLoadNotifications)

    // Configurar polling para atualizações (mais frequente para o admin)
    const interval = setInterval(safeLoadNotifications, 10000) // 10 segundos

    return () => {
      isMounted = false
      notificationListeners = notificationListeners.filter(
        (listener) => listener !== safeLoadNotifications
      )
      clearInterval(interval)
      
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isPushSupported) {
      setIsPushEnabled(isSubscribed)
    }
  }, [isPushSupported, isSubscribed])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleBellClick = () => {
    setIsOpen(!isOpen)
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        setNotifications((prev) => prev.map((n) => 
          n.id === notification.id ? { ...n, read: true } : n
        ))
        setUnreadCount((prev) => Math.max(0, prev - 1))
        prevUnreadCountRef.current = Math.max(0, prevUnreadCountRef.current - 1)
        
        await NotificationService.markAsRead(notification.id)
      } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error)
        
        toast({
          title: "Erro",
          description: "Não foi possível marcar a notificação como lida. Tente novamente.",
          variant: "destructive",
        })
        
        loadNotifications()
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setIsLoading(true)
      
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })))
      const previousUnreadCount = unreadCount
      setUnreadCount(0)
      prevUnreadCountRef.current = 0
      
      const unreadNotifications = notifications.filter(n => !n.read)
      await Promise.all(
        unreadNotifications.map(notification => 
          NotificationService.markAsRead(notification.id)
        )
      )
      
      toast({
        title: "Notificações lidas",
        description: `${previousUnreadCount} notificação(ões) marcada(s) como lida(s).`,
      })
      
      await loadNotifications()
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações como lidas.",
        variant: "destructive",
      })
      
      await loadNotifications()
    } finally {
      setIsLoading(false)
    }
  }

  const togglePushNotifications = async () => {
    try {
      toast({
        title: isPushEnabled ? "Desativando notificações..." : "Ativando notificações...",
        description: "Aguarde enquanto processamos sua solicitação.",
      })
      
      if (isPushEnabled) {
        const success = await unsubscribeFromPushNotifications()
        
        if (success) {
          toast({
            title: "Notificações desativadas",
            description: "Você não receberá mais notificações no navegador.",
          })
        } else {
          throw new Error("Falha ao desativar notificações")
        }
      } else {
        if (permission === 'denied') {
          toast({
            title: "Permissão bloqueada",
            description: "Você bloqueou as notificações neste site. Por favor, altere as configurações do navegador para permitir notificações.",
            variant: "destructive",
          })
          return
        }
        
        const result = await subscribeToPushNotifications()
        
        if (result) {
          toast({
            title: "Notificações ativadas!",
            description: "Você receberá notificações de novos pedidos no painel admin.",
          })
        } else {
          toast({
            title: "Permissão necessária",
            description: "Por favor, permita as notificações para receber atualizações.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Erro ao alternar notificações:", error)
      toast({
        title: "Erro",
        description: typeof error === 'object' && error !== null && 'message' in error
          ? `Falha: ${(error as Error).message}`
          : "Não foi possível atualizar as configurações de notificação.",
        variant: "destructive",
      })
    }
  }

  const getNotificationTypeStyles = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return "bg-yellow-50 border-yellow-300"
      case "alert":
        return "bg-red-50 border-red-300"
      case "success":
        return "bg-green-50 border-green-300"
      default:
        return "bg-blue-50 border-blue-300"
    }
  }

  const getNotificationTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return "⚠️"
      case "alert":
        return "🚨"
      case "success":
        return "✅"
      default:
        return "ℹ️"
    }
  }

  // Determinar qual animação usar
  const bellAnimation = newNotification ? "animate-pulse" : ""

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center space-x-2">
        {isPushSupported && (
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePushNotifications}
            title={isPushEnabled ? "Desativar notificações" : "Ativar notificações"}
            className="text-white hover:text-white hover:bg-white/10 p-1.5 sm:p-2"
          >
            {isPushEnabled ? (
              <BellRing className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 transition-all duration-200" />
            ) : (
              <BellOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-all duration-200" />
            )}
          </Button>
        )}
        <button
          onClick={handleBellClick}
          className={`relative p-1.5 sm:p-2 text-white hover:text-white hover:bg-white/10 focus:outline-none transition-all duration-300 rounded-lg ${bellAnimation}`}
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-xs font-bold text-white bg-red-500 rounded-full transition-all duration-300"
            >
              <span className="text-[10px] sm:text-xs">
                {unreadCount > 99 ? "99+" : unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-xl z-50 overflow-hidden border border-gray-200">
          <div className="p-3 bg-purple-700 text-white flex justify-between items-center">
            <h3 className="font-semibold">Notificações Admin</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs bg-purple-600 hover:bg-purple-800 px-2 py-1 rounded transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma notificação no momento</p>
                <p className="text-xs mt-1">Você receberá notificações de novos pedidos aqui</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification, index) => (
                  <div
                    key={createSafeKey(notification.id, 'notification-item', index)}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-all duration-200 ${!notification.read ? "bg-purple-50" : ""}`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${getNotificationTypeStyles(notification.type)}`}
                      >
                        <span>{getNotificationTypeIcon(notification.type)}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${!notification.read ? "text-purple-900" : "text-gray-800"}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.startDate).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {!notification.read && <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer com informações */}
          <div className="p-2 bg-gray-50 border-t text-xs text-gray-600 text-center">
            Sistema ativo para pedidos de delivery e mesa
          </div>
        </div>
      )}
      
      {/* Elemento de áudio para o som de notificação */}
      <audio id="admin-notification-sound" src="/notification-sound.mp3" preload="auto" />
    </div>
  )
} 