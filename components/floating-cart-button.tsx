"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/utils"

export default function FloatingCartButton() {
  const { cart, isLoading } = useCart()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Calcular o total de itens e o valor total
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Controlar a visibilidade do botão com base na rolagem
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Esconder o botão quando rolar para baixo, mostrar quando rolar para cima
      if (currentScrollY > lastScrollY) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  // Não mostrar o botão se o carrinho estiver vazio ou carregando
  if (isLoading || itemCount === 0) {
    return null
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "translate-y-20"
      }`}
    >
      <Link href="/carrinho">
        <button className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-3 rounded-full shadow-lg flex items-center">
          <ShoppingCart size={20} className="mr-2" />
          <div>
            <span className="font-medium">
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </span>
            <span className="mx-2">•</span>
            <span>{formatCurrency(totalValue)}</span>
          </div>
        </button>
      </Link>
    </div>
  )
}
