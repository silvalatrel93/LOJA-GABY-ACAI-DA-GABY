"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/utils"

export default function FloatingCartButton() {
  const { cart, isLoading } = useCart()
  const [isVisible, setIsVisible] = useState(true)
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollTimer, setScrollTimer] = useState<NodeJS.Timeout | null>(null)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Calcular o total de itens e o valor total
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

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
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isVisible || isScrolling ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
      }`}
    >
      <Link href="/carrinho">
        {/* Versão para telas maiores (md e acima) */}
        <button className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white rounded-full shadow-lg flex items-center transition-all duration-200 group">
          {/* Ícone do carrinho sempre visível */}
          <div className="relative flex items-center justify-center p-3">
            <ShoppingCart size={20} className="transition-transform group-hover:scale-110" />
            {/* Badge com contador de itens */}
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount}
            </div>
          </div>
          
          {/* Texto que se adapta ao tamanho da tela */}
          <div className="pr-4 pl-1">
            {/* Em telas pequenas, só mostra o valor */}
            <span className="hidden sm:inline font-medium">
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </span>
            <span className="hidden sm:inline mx-2">•</span>
            <span className="font-medium">{formatCurrency(totalValue)}</span>
          </div>
        </button>
      </Link>
    </div>
  )
}
