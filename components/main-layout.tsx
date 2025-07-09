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
import { useEffect, useState, useCallback } from "react"
import { getStoreConfig } from "@/lib/services/store-config-service"

interface MainLayoutProps {
  children: ReactNode
  carouselSlides?: CarouselSlide[]
  showCart?: boolean
}

export default function MainLayout({ children, carouselSlides = [], showCart = false }: MainLayoutProps) {
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Função para detectar rolagem da página
  const handleScroll = useCallback(() => {
    const offset = window.scrollY
    // Aplicar efeito quando rolar mais de 10px
    if (offset > 10) {
      setScrolled(true)
    } else {
      setScrolled(false)
    }
  }, [])

  useEffect(() => {
    // Carregar configuração da loja
    const loadStoreConfig = async () => {
      try {
        const config = await getStoreConfig()
        setStoreConfig(config)
      } catch (error) {
        console.error("Erro ao carregar configuração da loja:", error)
      }
    }

    loadStoreConfig()

    // Adicionar listener para detectar rolagem
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Verificar posição inicial da rolagem
    handleScroll()
    
    // Limpar listener ao desmontar o componente
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden w-full">
        {/* Cabeçalho com efeito de transição e glassmorphism */}
        <header
          className={`text-white fixed top-0 left-0 right-0 w-full z-30 transition-all duration-300 ease-in-out header-animation py-3 ${
            scrolled 
              ? 'bg-gradient-to-r from-purple-800 to-purple-950 backdrop-blur-md shadow-lg shadow-purple-900/30' 
              : 'bg-gradient-to-r from-purple-800 to-purple-950'
          }`}
          style={{ 
            width: "100vw", 
            marginLeft: "calc(-50vw + 50%)", 
            marginRight: "calc(-50vw + 50%)",
            height: "56px",
          }}
          data-component-name="MainLayout"
        >
          <div className="w-full max-w-screen-xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={toggleMenu}
                className="mr-3 p-1 rounded-md hover:bg-purple-800 transition-all duration-300"
                aria-label="Abrir menu"
              >
                <Menu size={24} className="transition-all duration-300" />
              </button>
              <Link href="/" className="flex items-center">
                {storeConfig?.logoUrl && (
                  <div className="relative w-10 h-10 mr-2 transition-all duration-300 ease-in-out transform hover:scale-110">
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-sm">
                      <Image
                        src={storeConfig.logoUrl || "/placeholder.svg"}
                        alt={`Logo ${storeConfig.name || "Açaí Online"}`}
                        fill
                        className="object-cover rounded-full"
                        priority
                      />
                    </div>
                  </div>
                )}
                <span className="text-xl font-bold transition-all duration-300">
                  {storeConfig?.name || "Açaí Online"}
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Menu lateral */}
        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        {/* Espaçador mínimo para compensar o cabeçalho fixo */}
        <div className="h-[56px]"></div>
        
        {/* Carrossel */}
        {carouselSlides.length > 0 && <HeroCarousel slides={carouselSlides} />}
        
        {/* Estilo global para animações */}
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideInDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          .header-animation {
            animation: slideInDown 0.4s ease-out;
          }
          
          /* Efeito de vidro para o cabeçalho quando rolado */
          .backdrop-blur-md {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
        `}</style>
        
        {/* Conteúdo principal */}
        <main className="flex-1 flex flex-col overflow-x-hidden w-full">{children}</main>

        {/* Rodapé */}
        <footer
          className="bg-gradient-to-r from-purple-800 to-purple-950 text-white p-4 shadow-lg"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", marginRight: "calc(-50vw + 50%)" }}
          data-component-name="MainLayout"
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
