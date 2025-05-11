"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart-context"

export default function FloatingCartButton() {
  const { cart } = useCart()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Esconde o botão quando rola para baixo e mostra quando rola para cima
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

  if (cartItemCount === 0) return null

  return (
    <Link
      href="/carrinho"
      className={`fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50 animate-float ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
      }`}
      aria-label="Ver carrinho"
    >
      <div className="relative">
        <ShoppingCart size={24} />
        <span className="absolute -top-2 -right-2 bg-white text-purple-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          {cartItemCount}
        </span>
      </div>
    </Link>
  )
}
