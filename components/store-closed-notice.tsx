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

    // Carregar status inicial
    loadStoreStatus()

    // Configurar intervalo para atualizar o status a cada 30 segundos
    const interval = setInterval(loadStoreStatus, 30000)

    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(interval)
  }, [router])

  // Efeito para injetar o estilo CSS
  useEffect(() => {
    if (showNotice) {
      // Adiciona o estilo ao documento
      const styleElement = document.createElement("style")
      styleElement.innerHTML = pulseAnimationStyle
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
      className="bg-red-500 text-white py-2 sticky top-0 z-10 w-screen left-0 right-0 mt-0"
      style={{ marginLeft: "-1rem", marginRight: "-1rem", width: "100vw" }}
    >
      <div className="pulse-container">
        <div className="pulse-content">
          <div className="pulse-icon">
            <Clock size={16} />
          </div>
          <div className="pulse-text">{storeStatus.statusText}</div>
        </div>
      </div>
    </div>
  )
}

// Estilo para a animação de pulso
const pulseAnimationStyle = `
  .pulse-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    overflow: hidden;
    height: 24px;
  }
  
  .pulse-content {
    display: flex;
    align-items: center;
    justify-content: center;
    animation: slide-in 0.5s ease-out forwards;
  }
  
  .pulse-icon {
    margin-right: 8px;
    animation: pulse 2s infinite;
  }
  
  .pulse-text {
    font-size: 0.875rem;
    font-weight: 500;
    animation: glow 2s infinite alternate;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  @keyframes glow {
    from {
      text-shadow: 0 0 0px rgba(255, 255, 255, 0.5);
    }
    to {
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
    }
  }
  
  @keyframes slide-in {
    0% {
      transform: translateY(-100%);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @media (min-width: 768px) {
    .pulse-text {
      font-size: 1rem;
    }
    .pulse-container {
      height: 28px;
    }
  }
`
