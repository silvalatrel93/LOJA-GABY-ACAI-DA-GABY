"use client"

import { useState } from "react"
import { Share2, Check, Copy } from "lucide-react"

export default function ShareVitrineButton() {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    const vitrineUrl = `${window.location.origin}/vitrine`
    navigator.clipboard.writeText(vitrineUrl)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
      <h3 className="text-lg font-medium text-purple-800 flex items-center">
        <Share2 size={20} className="mr-2" />
        Compartilhar Vitrine
      </h3>

      <p className="mt-2 text-gray-600">Compartilhe sua vitrine de produtos no Instagram e outras redes sociais.</p>

      <div className="mt-3 flex items-center">
        <div className="flex-1 bg-white border border-gray-300 rounded-l-md px-3 py-2 text-sm truncate">
          {typeof window !== "undefined" ? `${window.location.origin}/vitrine` : "/vitrine"}
        </div>
        <button
          onClick={handleCopyLink}
          className={`px-3 py-2 rounded-r-md flex items-center ${
            copied ? "bg-green-600 text-white" : "bg-purple-600 text-white"
          }`}
        >
          {copied ? (
            <>
              <Check size={16} className="mr-1" />
              Copiado
            </>
          ) : (
            <>
              <Copy size={16} className="mr-1" />
              Copiar
            </>
          )}
        </button>
      </div>

      <p className="mt-3 text-sm text-gray-500">
        Este link mostra apenas seus produtos em uma página otimizada para compartilhamento.
      </p>
    </div>
  )
}
