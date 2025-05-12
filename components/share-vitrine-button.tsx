"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Check } from "lucide-react"

export default function ShareVitrineButton() {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    // Construir a URL completa da vitrine
    const vitrineUrl = `${window.location.origin}/vitrine`

    // Copiar para a área de transferência
    navigator.clipboard
      .writeText(vitrineUrl)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err) => {
        console.error("Erro ao copiar link:", err)
      })
  }

  return (
    <Button
      onClick={handleCopyLink}
      className={`flex items-center gap-2 ${copied ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"}`}
    >
      {copied ? (
        <>
          <Check size={16} />
          Link Copiado!
        </>
      ) : (
        <>
          <Share2 size={16} />
          Copiar Link da Vitrine
        </>
      )}
    </Button>
  )
}
