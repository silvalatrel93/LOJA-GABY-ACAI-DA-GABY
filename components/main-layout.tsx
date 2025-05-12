"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu } from "lucide-react"
import { CartProvider } from "@/lib/cart-context"
import HeroCarousel from "@/components/hero-carousel"
import NotificationBell from "@/components/notification-bell"
import SideMenu from "@/components/side-menu"
import type { CarouselSlide } from "@/lib/services/carousel-service"
import type { StoreConfig } from "@/lib/types"
import { useEffect, useState } from "react"
import { getStoreConfig } from "@/lib/services/store-config-service"

interface MainLayoutProps {
  children: ReactNode
  carouselSlides?: CarouselSlide[]
}

export default function MainLayout({ children, carouselSlides = [] }: MainLayoutProps) {
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden w-full">
        {/* Cabeçalho */}
        <header
          className="bg-purple-600 text-white p-3 sticky top-0 z-20"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", marginRight: "calc(-50vw + 50%)" }}
        >
          <div className="w-full max-w-screen-xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={toggleMenu}
                className="mr-3 p-1 rounded-md hover:bg-purple-800 transition-colors"
                aria-label="Abrir menu"
              >
                <Menu size={24} />
              </button>
              <Link href="/" className="flex items-center">
                {storeConfig?.logoUrl && (
                  <div className="relative w-10 h-10 mr-2">
                    <Image
                      src={storeConfig.logoUrl || "/placeholder.svg"}
                      alt={`Logo ${storeConfig.name || "Açaí Online"}`}
                      fill
                      className="object-contain rounded-full bg-white p-1"
                    />
                  </div>
                )}
                <span className="text-xl font-bold">{storeConfig?.name || "Açaí Online"}</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Menu lateral */}
        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        {/* Carrossel */}
        {carouselSlides.length > 0 && <HeroCarousel slides={carouselSlides} />}

        {/* Conteúdo principal */}
        <main className="flex-1 flex flex-col overflow-x-hidden w-full">{children}</main>

        {/* Rodapé */}
        <footer
          className="bg-purple-600 text-white p-4"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", marginRight: "calc(-50vw + 50%)" }}
        >
          <div className="w-full max-w-screen-xl mx-auto px-4 text-center">
            <p>
              © {new Date().getFullYear()} {storeConfig?.name || "Açaí Online"} - Todos os direitos reservados
            </p>
          </div>
        </footer>
      </div>
    </CartProvider>
  )
}
