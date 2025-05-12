"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Smartphone, X } from "lucide-react"

export default function PWAFallback() {
  const [showTip, setShowTip] = useState(false)

  if (!showTip)
    return (
      <Button
        onClick={() => setShowTip(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-40 bg-white shadow-md"
      >
        <Smartphone className="w-4 h-4 mr-2" />
        Adicionar à tela inicial
      </Button>
    )

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-[280px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-sm">Como instalar o app</h3>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowTip(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ol className="text-xs space-y-2 text-gray-700">
        <li className="flex items-start gap-2">
          <span className="bg-purple-100 text-purple-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
            1
          </span>
          <span>
            Toque no botão de compartilhamento <Share2 className="inline h-4 w-4" />
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="bg-purple-100 text-purple-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
            2
          </span>
          <span>Role para baixo e selecione "Adicionar à tela inicial"</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="bg-purple-100 text-purple-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
            3
          </span>
          <span>Confirme adicionando o app</span>
        </li>
      </ol>
    </div>
  )
}
