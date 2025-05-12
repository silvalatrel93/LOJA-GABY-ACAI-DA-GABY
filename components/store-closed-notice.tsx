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
  const marqueeTrackRef = useRef<HTMLDivElement>(null)
  const [animationDuration, setAnimationDuration] = useState(15)

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

  // Efeito para calcular a duração da animação com base na largura da tela
  useEffect(() => {
    if (!showNotice) return

    const calculateAnimationDuration = () => {
      // Base duration in seconds (smaller screens = faster animation)
      const baseWidth = 1200 // Base width in pixels
      const baseSpeed = 15 // Base duration in seconds
      const currentWidth = window.innerWidth

      // Calculate proportional duration (wider screens = slower animation)
      // This ensures the text moves at a consistent speed across different screen sizes
      let newDuration = (currentWidth / baseWidth) * baseSpeed

      // Clamp duration between 8 and 20 seconds
      newDuration = Math.max(8, Math.min(20, newDuration))

      setAnimationDuration(newDuration)
    }

    // Calculate initially
    calculateAnimationDuration()

    // Recalculate on resize
    window.addEventListener("resize", calculateAnimationDuration)
    return () => window.removeEventListener("resize", calculateAnimationDuration)
  }, [showNotice])

  // Efeito para injetar o estilo CSS com a duração calculada
  useEffect(() => {
    if (showNotice) {
      // Adiciona o estilo ao documento com a duração calculada
      const styleElement = document.createElement("style")
      styleElement.innerHTML = getMarqueeStyle(animationDuration)
      document.head.appendChild(styleElement)
      styleElementRef.current = styleElement
    }

    // Limpa o estilo quando o componente é desmontado
    return () => {
      if (styleElementRef.current) {
        document.head.removeChild(styleElementRef.current)
      }
    }
  }, [showNotice, animationDuration])

  // Se a loja estiver aberta, não mostrar nada
  if (!storeStatus || storeStatus.isOpen) {
    return null
  }

  return (
    <div
      className="bg-red-500 text-white py-1 sticky top-0 z-10 w-screen left-0 right-0 mt-0"
      style={{ marginLeft: "-1rem", marginRight: "-1rem", width: "100vw" }}
    >
      <div className="w-full overflow-hidden">
        <div className="marquee-wrapper">
          <div className="marquee-track" ref={marqueeTrackRef}>
            {/* Primeiro item */}
            <div className="marquee-item">
              <Clock size={16} className="mr-2 flex-shrink-0" />
              <p className="text-sm font-medium md:text-base">{storeStatus.statusText}</p>
            </div>
            {/* Segundo item (duplicado para criar efeito contínuo) */}
            <div className="marquee-item">
              <Clock size={16} className="mr-2 flex-shrink-0" />
              <p className="text-sm font-medium md:text-base">{storeStatus.statusText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Função para gerar o estilo do marquee com duração dinâmica
const getMarqueeStyle = (duration: number) => `
  .marquee-wrapper {
    position: relative;
    width: 100%;
    height: 20px;
    overflow: hidden;
  }
  
  .marquee-track {
    display: flex;
    position: absolute;
    white-space: nowrap;
    will-change: transform;
    animation: marquee-continuous ${duration}s linear infinite;
  }
  
  .marquee-item {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    padding-right: 50px;
  }
  
  @keyframes marquee-continuous {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
  
  @media (max-width: 640px) {
    .marquee-wrapper {
      height: 18px;
    }
  }
  
  @media (min-width: 768px) {
    .marquee-wrapper {
      height: 22px;
    }
    .marquee-item {
      padding-right: 80px;
    }
  }
`
