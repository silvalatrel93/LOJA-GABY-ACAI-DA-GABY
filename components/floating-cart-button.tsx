"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/utils"
import { getStoreConfig } from "@/lib/services/store-config-service"
import type { StoreConfig } from "@/lib/types"

export default function FloatingCartButton() {
  const { cart, isLoading } = useCart()
  const [isVisible, setIsVisible] = useState(true)
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollTimer, setScrollTimer] = useState<NodeJS.Timeout | null>(null)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)

  // Carregar configuração da loja
  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        const config = await getStoreConfig()
        setStoreConfig(config)
      } catch (error) {
        console.error("Erro ao carregar configuração da loja:", error)
      }
    }
    loadStoreConfig()
  }, [])

  // Calcular o total de itens e o valor total
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = cart.reduce((sum, item) => {
    // Usar o preço original (já com adicionais) se disponível, senão calcular
    if (item.originalPrice) {
      return sum + (item.originalPrice * item.quantity)
    }
    
    // Cálculo para compatibilidade com itens antigos
    const itemTotal = item.price * item.quantity
    const additionalsTotal = (item.additionals || []).reduce(
      (addSum, additional) => addSum + additional.price * (additional.quantity || 1), 
      0
    ) * item.quantity
    
    return sum + itemTotal + additionalsTotal
  }, 0)

  // Controlar a visibilidade do botão com base na rolagem
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Sempre mostrar o botão durante a rolagem (para cima ou para baixo)
      setIsVisible(true)
      setIsScrolling(true)
      
      // Resetar o timer a cada evento de rolagem
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }
      
      // Definir um novo timer para manter o botão visível por um tempo após parar de rolar
      const newTimer = setTimeout(() => {
        setIsScrolling(false)
      }, 1500) // Botão permanece visível por 1.5 segundos após parar de rolar
      
      setScrollTimer(newTimer)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      // Limpar o timer quando o componente for desmontado
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }
    }
  }, [lastScrollY, scrollTimer])

  // Não renderizar o botão se o carrinho estiver vazio ou carregando
  if (isLoading || itemCount === 0) {
    return null
  }

  return (
    <div
      className={`fixed bottom-3 sm:bottom-4 right-3 sm:right-4 z-50 transition-all duration-300 ${
        isVisible || isScrolling ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
      }`}
    >
      <Link href="/carrinho">
        {/* Versão responsiva */}
        <button 
          className="text-white rounded-full shadow-lg flex items-center transition-all duration-200 group" 
          style={{
            background: storeConfig?.storeColor || '#8B5CF6',
            boxShadow: `0 4px 12px ${storeConfig?.storeColor || '#8B5CF6'}40`
          }}
          onMouseEnter={(e) => {
            const color = storeConfig?.storeColor || '#8B5CF6'
            // Escurecer a cor no hover
            const rgb = parseInt(color.slice(1), 16)
            const r = Math.max(0, (rgb >> 16) - 30)
            const g = Math.max(0, ((rgb >> 8) & 255) - 30)
            const b = Math.max(0, (rgb & 255) - 30)
            const darkerColor = `rgb(${r}, ${g}, ${b})`
            e.currentTarget.style.background = darkerColor
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = storeConfig?.storeColor || '#8B5CF6'
          }}
          data-component-name="FloatingCartButton"
        >
          {/* Ícone do carrinho sempre visível */}
          <div className="relative flex items-center justify-center p-2 sm:p-3">
            <ShoppingCart size={18} className="sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
            {/* Badge com contador de itens */}
            <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
              <span className="text-[10px] sm:text-xs">{itemCount}</span>
            </div>
          </div>
          
          {/* Texto que se adapta ao tamanho da tela */}
          <div className="pr-2 sm:pr-4 pl-1">
            {/* Em telas pequenas, só mostra o valor */}
            <span className="hidden sm:inline font-medium text-sm">
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </span>
            <span className="hidden sm:inline mx-1 sm:mx-2 text-sm">•</span>
            <span className="font-medium text-xs sm:text-sm">{formatCurrency(totalValue)}</span>
          </div>
        </button>
      </Link>
    </div>
  )
}
