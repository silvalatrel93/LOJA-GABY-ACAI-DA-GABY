"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Download } from "lucide-react"

export default function AdminPWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Verificar se estamos em um ambiente que suporta PWA
  const isPWASupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    window.matchMedia("(display-mode: browser)").matches

  useEffect(() => {
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

  // Instruções manuais para instalação
  const renderManualInstructions = () => (
    <div className="mt-2 p-3 bg-purple-50 rounded-md border border-purple-200 text-sm">
      <h4 className="font-medium mb-1">Instalação manual:</h4>
      <ol className="list-decimal pl-5 text-xs space-y-1">
        <li>Toque no menu do navegador (três pontos)</li>
        <li>Selecione "Adicionar à tela inicial" ou "Instalar aplicativo"</li>
        <li>Siga as instruções na tela</li>
      </ol>
    </div>
  )

  // Se o app já estiver instalado, não mostrar nada
  if (isInstalled) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-64 shadow-lg rounded-lg bg-white p-3 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">App Admin</h3>
        {serviceWorkerStatus === "error" && (
          <div className="text-amber-500">
            <AlertCircle size={16} />
          </div>
        )}
      </div>

      {installPrompt ? (
        <Button onClick={handleInstallClick} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
          <Download size={16} className="mr-2" />
          Instalar App Admin
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
            <div className="text-xs text-gray-600 mb-2">Aguardando disponibilidade para instalação...</div>
          )}
          {renderManualInstructions()}
        </div>
      )}
    </div>
  )
}
