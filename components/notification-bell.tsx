"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, BellRing, BellOff } from "lucide-react"
import { getActiveNotifications, markNotificationAsRead, markAllNotificationsAsRead, type Notification } from "@/lib/db"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

// Adicione este estilo para a animação flutuante
const floatAnimation = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-3px); }
    100% { transform: translateY(0px); }
  }

  .animate-float {
    animation: float 4s ease-in-out infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  .animate-pulse-custom {
    animation: pulse 0.5s ease-in-out;
  }

  @keyframes shake {
    0% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    50% { transform: rotate(0deg); }
    75% { transform: rotate(5deg); }
    100% { transform: rotate(0deg); }
  }

  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
`

// Contexto global para notificações
let notificationListeners: (() => void)[] = []

// Função para notificar todos os componentes sobre novas notificações
export function notifyNewNotification() {
  notificationListeners.forEach((listener) => listener())
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isPushSupported, setIsPushSupported] = useState(false)
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const { permission, isSubscribed, subscribeToPushNotifications, unsubscribeFromPushNotifications } = usePushNotifications()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [newNotification, setNewNotification] = useState(false)
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
    try {
      const activeNotifications = await getActiveNotifications()
      setNotifications(activeNotifications)
      const newUnreadCount = activeNotifications.filter((n) => !n.read).length

      // Verificar se há novas notificações não lidas
      if (newUnreadCount > prevUnreadCountRef.current) {
        setNewNotification(true)
        // Tocar som de notificação
        if (audioRef.current) {
          try {
            audioRef.current.play().catch((e) => console.log("Erro ao tocar som:", e))
          } catch (error) {
            console.log("Erro ao tocar som:", error)
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
    }
  }

  useEffect(() => {
    loadNotifications()

    // Adicionar listener para novas notificações
    notificationListeners.push(loadNotifications)

    // Configurar polling para atualizações a cada 10 segundos
    const interval = setInterval(loadNotifications, 10000)

    return () => {
      // Limpar listeners e intervalo
      notificationListeners = notificationListeners.filter(
        (listener) => listener !== loadNotifications
      )
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    // Fechar o dropdown quando clicar fora dele
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
        await markNotificationAsRead(notification.id)
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
        prevUnreadCountRef.current = Math.max(0, prevUnreadCountRef.current - 1)
      } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error)
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead()
    loadNotifications()
  }

  const togglePushNotifications = async () => {
    try {
      if (isPushEnabled) {
        await unsubscribeFromPushNotifications()
        toast({
          title: "Notificações desativadas",
          description: "Você não receberá mais notificações no navegador.",
        })
      } else {
        const result = await subscribeToPushNotifications()
        if (result) {
          toast({
            title: "Notificações ativadas!",
            description: "Você receberá notificações de novos pedidos.",
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
        description: "Não foi possível atualizar as configurações de notificação.",
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
  const bellAnimation = newNotification ? "animate-shake" : "animate-float"

  return (
    <>
      <style jsx>{floatAnimation}</style>
      <div className="relative">
        <div className="flex items-center space-x-2">
          {isPushSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePushNotifications}
              title={isPushEnabled ? "Desativar notificações" : "Ativar notificações"}
              className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {isPushEnabled ? (
                <BellRing className="h-5 w-5 text-green-500" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
            </Button>
          )}
          <button
            onClick={handleBellClick}
            className={`relative p-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none ${bellAnimation}`}
            aria-label="Notificações"
          >
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span
                className={`absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-500 rounded-full ${newNotification ? "animate-pulse-custom" : ""}`}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden">
            <div className="p-3 bg-purple-700 text-white flex justify-between items-center">
              <h3 className="font-semibold">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs bg-purple-600 hover:bg-purple-800 px-2 py-1 rounded"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Nenhuma notificação no momento</div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${!notification.read ? "bg-purple-50" : ""}`}
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
          </div>
        )}
      </div>
      {/* Elemento de áudio para o som de notificação */}
      <audio id="notification-sound" src="/notification-sound.mp3" preload="auto" />
    </>
  )
}
