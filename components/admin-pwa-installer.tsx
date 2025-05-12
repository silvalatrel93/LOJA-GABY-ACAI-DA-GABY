"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function AdminPWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Registrar o service worker apenas se estamos na área admin
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.location.pathname.startsWith("/admin")
    ) {
      navigator.serviceWorker
        .register("/admin-sw.js")
        .then((registration) => {
          console.log("Service Worker registrado com sucesso:", registration)
        })
        .catch((error) => {
          console.error("Erro ao registrar Service Worker:", error)
        })
    }

    // Capturar o evento beforeinstallprompt para mostrar o botão de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Verificar se o app já está instalado
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      console.log("PWA instalado com sucesso")
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = () => {
    if (!installPrompt) return

    // Mostrar o prompt de instalação
    installPrompt.prompt()

    // Esperar pela resposta do usuário
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === "accepted") {
        console.log("Usuário aceitou a instalação")
      } else {
        console.log("Usuário recusou a instalação")
      }
      setInstallPrompt(null)
    })
  }

  if (!installPrompt || isInstalled) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button onClick={handleInstallClick} className="bg-purple-600 hover:bg-purple-700 text-white">
        Instalar App Admin
      </Button>
    </div>
  )
}
