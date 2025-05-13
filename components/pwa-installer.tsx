"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isChrome, setIsChrome] = useState(false)
  const [showDirectLink, setShowDirectLink] = useState(false)

  useEffect(() => {
    // Detectar Android e Chrome
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent.toLowerCase()
      setIsAndroid(/android/.test(userAgent))
      setIsChrome(/chrome/.test(userAgent) && !/edge/.test(userAgent) && !/edg/.test(userAgent))
    }

    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    // Capturar o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("Evento beforeinstallprompt capturado")
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Verificar quando o app é instalado
    window.addEventListener("appinstalled", () => {
      console.log("PWA instalado com sucesso")
      setIsInstalled(true)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = () => {
    if (!deferredPrompt) {
      console.log("Nenhum prompt de instalação disponível")
      setShowDirectLink(true)
      return
    }

    console.log("Mostrando prompt de instalação")
    deferredPrompt.prompt()

    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === "accepted") {
        console.log("Usuário aceitou a instalação")
      } else {
        console.log("Usuário recusou a instalação")
        setShowDirectLink(true)
      }
      setDeferredPrompt(null)
    })
  }

  const openPWADirectly = () => {
    window.open("/pwa.html", "_blank")
  }

  if (isInstalled) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 shadow-lg rounded-lg bg-white p-4 border border-purple-200">
      <h3 className="font-bold text-lg mb-2 text-purple-800">Instalar App Admin</h3>

      {isAndroid && isChrome ? (
        <>
          <p className="text-sm mb-3 text-gray-600">
            Instale o app completo no seu Android para acesso rápido e offline.
          </p>

          <Button onClick={handleInstallClick} className="w-full bg-purple-600 hover:bg-purple-700 text-white mb-2">
            <Download size={16} className="mr-2" />
            Instalar App Completo
          </Button>

          {showDirectLink && (
            <>
              <div className="text-xs text-gray-500 my-2 text-center">ou</div>
              <Button onClick={openPWADirectly} variant="outline" className="w-full border-purple-300">
                <ExternalLink size={16} className="mr-2" />
                Abrir Link de Instalação
              </Button>

              <div className="mt-2 text-xs text-gray-500">
                <p>Ao abrir o link, use a opção "Adicionar à tela inicial" no menu do Chrome.</p>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="text-sm text-amber-600">
          <p>Para instalar o app completo, abra esta página no Chrome em um dispositivo Android.</p>

          <Button onClick={openPWADirectly} variant="outline" className="w-full mt-2 border-purple-300">
            <ExternalLink size={16} className="mr-2" />
            Abrir Link de Instalação
          </Button>
        </div>
      )}
    </div>
  )
}
