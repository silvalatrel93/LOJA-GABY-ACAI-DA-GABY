"use client"

import { useState, useEffect, useRef } from "react"
import { Clock } from "lucide-react"
import { getStoreStatus } from "@/lib/store-utils"
import { useRouter } from "next/navigation"

export default function StoreClosedNotice() {
  const [storeStatus, setStoreStatus] = useState<{
    isOpen: boolean
    statusText: string
    statusClass: string
  } | null>(null)
  const router = useRouter()
  const [showNotice, setShowNotice] = useState(false)
  const styleElementRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => {
    const loadStoreStatus = async () => {
      try {
        const status = await getStoreStatus()
        setStoreStatus(status)
        setShowNotice(!status.isOpen)

        // Se a loja estiver fechada e não estiver na página inicial ou admin, redirecionar
        if (!status.isOpen) {
          const path = window.location.pathname
          if (path !== "/" && !path.includes("/admin") && !path.includes("/sobre")) {
            // Redirecionar para a página inicial com uma mensagem
            router.push("/?closed=true")
          }
        }
      } catch (error) {
        console.error("Erro ao verificar status da loja:", error)
      }
    }

    loadStoreStatus()

    // Atualizar o status a cada minuto
    const interval = setInterval(loadStoreStatus, 60000)
    return () => clearInterval(interval)
  }, [router])

  // Efeito para injetar o estilo CSS
  useEffect(() => {
    if (showNotice) {
      // Adiciona o estilo ao documento
      const styleElement = document.createElement("style")
      styleElement.innerHTML = marqueeStyle
      document.head.appendChild(styleElement)
      styleElementRef.current = styleElement
    }

    // Limpa o estilo quando o componente é desmontado
    return () => {
      if (styleElementRef.current) {
        document.head.removeChild(styleElementRef.current)
      }
    }
  }, [showNotice])

  // Se a loja estiver aberta, não mostrar nada
  if (!storeStatus || storeStatus.isOpen) {
    return null
  }

  return (
    <div
      className="bg-red-500 text-white py-1 sticky top-0 z-10 w-screen left-0 right-0 mt-0"
      style={{ marginLeft: "-1rem", marginRight: "-1rem", width: "100vw" }}
    >
      <div className="ticker-wrap">
        <div className="ticker">
          <div className="ticker__item">
            <Clock size={16} className="mr-2 flex-shrink-0" />
            <span className="text-sm font-medium md:text-base">{storeStatus.statusText}</span>
          </div>
          <div className="ticker__item">
            <Clock size={16} className="mr-2 flex-shrink-0" />
            <span className="text-sm font-medium md:text-base">{storeStatus.statusText}</span>
          </div>
          <div className="ticker__item">
            <Clock size={16} className="mr-2 flex-shrink-0" />
            <span className="text-sm font-medium md:text-base">{storeStatus.statusText}</span>
          </div>
          <div className="ticker__item">
            <Clock size={16} className="mr-2 flex-shrink-0" />
            <span className="text-sm font-medium md:text-base">{storeStatus.statusText}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Estilo para a animação de ticker (letreiro) com loop infinito perfeito
const marqueeStyle = `
  .ticker-wrap {
    width: 100%;
    overflow: hidden;
    height: 20px;
    padding-left: 100%;
    box-sizing: content-box;
  }

  .ticker {
    display: inline-flex;
    height: 100%;
    line-height: 20px;
    white-space: nowrap;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    animation-name: ticker;
    animation-duration: 20s;
  }

  .ticker__item {
    display: inline-flex;
    align-items: center;
    padding: 0 2rem;
  }

  @keyframes ticker {
    0% {
      transform: translate3d(0, 0, 0);
    }
    
    100% {
      transform: translate3d(-100%, 0, 0);
    }
  }

  @media (max-width: 640px) {
    .ticker-wrap {
      height: 18px;
    }
    .ticker {
      line-height: 18px;
    }
  }
  
  @media (min-width: 768px) {
    .ticker-wrap {
      height: 22px;
    }
    .ticker {
      line-height: 22px;
    }
  }
`
