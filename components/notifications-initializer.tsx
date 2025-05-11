"use client"

import { useEffect } from "react"
import { initializeDefaultNotifications } from "@/lib/db"

export default function NotificationsInitializer() {
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await initializeDefaultNotifications()
        console.log("Notificações inicializadas com sucesso")
      } catch (error) {
        console.error("Erro ao inicializar notificações:", error)
      }
    }

    initNotifications()
  }, [])

  return null
}
