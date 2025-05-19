"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createSupabaseClient } from "@/lib/supabase-client"
import { RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export default function OrderCounterReset() {
  const [isResetting, setIsResetting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Função para abrir o diálogo de confirmação
  const openConfirmDialog = () => {
    setShowConfirmDialog(true)
  }

  // Função para fechar o diálogo de confirmação
  const closeConfirmDialog = () => {
    setShowConfirmDialog(false)
  }

  // Função para redefinir o contador de pedidos usando a função RPC do Supabase
  const resetOrderCounter = async () => {
    setIsResetting(true)
    closeConfirmDialog()
    
    try {
      const supabase = createSupabaseClient()
      toast.loading("Zerando contador de pedidos...")
      console.log("Iniciando processo de zerar contador de pedidos...")
      
      // Chamar a função RPC reset_order_counter no Supabase
      console.log("Chamando função RPC reset_order_counter...")
      const { data, error } = await supabase.rpc('reset_order_counter')
      
      if (error) {
        console.error("Erro ao chamar função RPC reset_order_counter:", error)
        toast.dismiss()
        toast.error("Erro ao zerar contador de pedidos")
        setIsResetting(false)
        return
      }
      
      console.log("Resultado da função RPC:", data)
      toast.dismiss()
      
      if (data === true) {
        console.log("Contador de pedidos zerado com sucesso! Próximo pedido será #1")
      } else {
        console.log("Houve um problema ao zerar o contador de pedidos")
        toast.error("Houve um problema ao zerar o contador de pedidos")
        setIsResetting(false)
        return
      }
      
      toast.success("Contador de pedidos zerado com sucesso!")
      toast.info("O próximo pedido começará com o ID #1")
      
      // Recarregar a página após um breve intervalo
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("Erro inesperado:", error)
      toast.error("Ocorreu um erro ao redefinir o contador")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      <div className="mt-4">
        <Button
          onClick={openConfirmDialog}
          disabled={isResetting}
          variant="outline"
          className="flex items-center gap-2 bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
        >
          {isResetting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Redefinindo contador...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Zerar contador de pedidos
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 mt-1">
          Isso redefinirá o contador para que o próximo pedido comece com o ID #1
        </p>
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
