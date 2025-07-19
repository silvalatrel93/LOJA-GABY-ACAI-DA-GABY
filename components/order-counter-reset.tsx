"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export default function OrderCounterReset() {
  const [isResetting, setIsResetting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showInfoMessage, setShowInfoMessage] = useState(false)

  // Função para abrir o diálogo de confirmação
  const openConfirmDialog = () => {
    setShowConfirmDialog(true)
  }

  // Função para fechar o diálogo de confirmação
  const closeConfirmDialog = () => {
    setShowConfirmDialog(false)
  }

  // Função para redefinir o contador de pedidos usando a API
  const resetOrderCounter = async () => {
    setIsResetting(true)
    closeConfirmDialog()

    try {
      toast.loading("Zerando contador de pedidos...")
      console.log("Iniciando processo de zerar contador de pedidos...")

      // Chamar a API que exclui todos os pedidos e reseta o contador
      console.log("Chamando API /api/admin/reset-order-counter...")
      const response = await fetch('/api/admin/reset-order-counter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error("Erro na API de reset:", result)
        toast.dismiss()
        toast.error(`Erro ao zerar contador: ${result.error || 'Erro desconhecido'}`)
        setIsResetting(false)
        return
      }

      console.log("Reset executado com sucesso:", result)
      toast.dismiss()

      toast.success("Contador de pedidos zerado com sucesso!")
      toast.info("Todos os pedidos foram excluídos e o próximo pedido começará com o ID #1")

      // Recarregar a página após um breve intervalo
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("Erro inesperado:", {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error
      })
      toast.dismiss()
      toast.error(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      <div className="w-full">
        <div className="flex flex-col items-end">
          <Button
            onClick={openConfirmDialog}
            disabled={isResetting}
            variant="outline"
            className="flex items-center gap-2 bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 w-full sm:w-auto justify-center sm:justify-start px-3 sm:px-4"
          >
            {isResetting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Redefinindo contador...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  <span className="hidden sm:inline">Zerar contador de pedidos</span>
                  <span className="sm:hidden">Zerar contador</span>
                </span>
              </>
            )}
          </Button>
          {showInfoMessage && (
            <p className="text-xs text-gray-500 mt-1 text-right w-full animate-fade-in">
              Isso redefinirá o contador para que o próximo pedido comece com o ID #1
            </p>
          )}
        </div>
      </div>

      {/* Diálogo de confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zerar contador de pedidos</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja zerar o contador de pedidos?
              O próximo pedido começará com o ID #1.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={closeConfirmDialog}
              className="sm:flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={resetOrderCounter}
              disabled={isResetting}
              className="bg-amber-600 hover:bg-amber-700 sm:flex-1"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Redefinindo...
                </>
              ) : (
                "Sim, zerar contador"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>

  )
}
