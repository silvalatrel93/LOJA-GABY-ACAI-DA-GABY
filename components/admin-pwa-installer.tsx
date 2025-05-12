"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone, Info } from "lucide-react"

export default function AdminPWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAndroid, setIsAndroid] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  // Verificar se estamos em um ambiente que suporta PWA
  const isPWASupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    window.matchMedia("(display-mode: browser)").matches

  useEffect(() => {
    // Detectar se é Android
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent.toLowerCase()
      setIsAndroid(/android/.test(userAgent))
    }

    // Não tentar registrar o service worker se não estamos em um ambiente compatível
    if (!isPWASupported) {
      setServiceWorkerStatus("error")
      setErrorMessage("Este navegador não suporta PWA")
      return
    }

    // Verificar se estamos na área admin
    if (window.location.pathname.startsWith("/admin")) {
      // Tentar registrar o service worker com retry e timeout
      const registerServiceWorker = async () => {
        try {
          // Adicionar um parâmetro de versão para evitar cache
          const registration = await navigator.serviceWorker.register(`/admin-sw.js?v=${new Date().getTime()}`, {
            scope: "/admin/",
          })
          console.log("Service Worker registrado com sucesso:", registration)
          setServiceWorkerStatus("success")
          setErrorMessage(null)
        } catch (error: any) {
          console.error("Erro ao registrar Service Worker:", error)
          setServiceWorkerStatus("error")
          setErrorMessage(error.message)
        }
      }

      // Tentar registrar o service worker
      registerServiceWorker()
    }
  }, [isPWASupported])

  useEffect(() => {
    if (!isPWASupported) return

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

    // Verificar se já estamos em modo standalone (já instalado)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [isPWASupported])

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

  // Instruções específicas para Android
  const renderAndroidInstructions = () => (
    <div className="mt-2 p-3 bg-purple-50 rounded-md border border-purple-200 text-sm">
      <h4 className="font-medium mb-1 flex items-center">
        <Smartphone size={16} className="mr-1" /> Instalação no Android:
      </h4>
      <ol className="list-decimal pl-5 text-xs space-y-1">
        <li>Toque no menu do Chrome (três pontos no canto superior direito)</li>
        <li>Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"</li>
        <li>Na caixa de diálogo que aparece, toque em "Instalar"</li>
        <li>Após a instalação, o app aparecerá na sua lista de aplicativos</li>
      </ol>
      <div className="mt-2 text-xs text-purple-700">
        <p>
          <strong>Importante:</strong> Para instalação completa, certifique-se de estar usando o Chrome em um
          dispositivo Android.
        </p>
      </div>
    </div>
  )

  // Se o app já estiver instalado, não mostrar nada
  if (isInstalled) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 shadow-lg rounded-lg bg-white p-3 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">Instalar App Admin</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          <Info size={16} />
        </Button>
      </div>

      {installPrompt ? (
        <Button onClick={handleInstallClick} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
          <Download size={16} className="mr-2" />
          Instalar App Completo
        </Button>
      ) : (
        <div>
          {serviceWorkerStatus === "error" ? (
            <div className="text-xs text-amber-600 mb-2">
              <p>Não foi possível habilitar o modo offline.</p>
              {errorMessage && (
                <p className="text-[10px] mt-1 opacity-70">
                  Erro: {errorMessage.substring(0, 100)}
                  {errorMessage.length > 100 ? "..." : ""}
                </p>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-600 mb-2">
              {isAndroid
                ? "Siga as instruções abaixo para instalar o app completo no seu Android"
                : "Aguardando disponibilidade para instalação..."}
            </div>
          )}
          {showInstructions || !installPrompt ? renderAndroidInstructions() : null}
        </div>
      )}
    </div>
  )
}
