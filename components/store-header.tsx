"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu } from "lucide-react"
import { getStoreConfig, type StoreConfig } from "@/lib/db"
import SideMenu from "./side-menu"
import StoreStatus from "./store-status"
import NotificationBell from "./notification-bell"

export default function StoreHeader() {
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        setIsLoading(true)
        const config = await getStoreConfig()
        setStoreConfig(config)
      } catch (error) {
        console.error("Erro ao carregar configurações da loja:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStoreConfig()
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  if (isLoading) {
    return (
      <header className="bg-white py-2 px-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-start px-2 h-16">
          <div className="w-8 h-8 bg-gray-200 animate-pulse rounded mr-4"></div>
          <div className="w-32 h-8 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="bg-white py-2 px-4 shadow-sm">
        <div className="container mx-auto flex flex-col px-2">
          <div className="flex items-center">
            <button
              onClick={toggleMenu}
              className="mr-3 text-gray-700 hover:text-purple-700 focus:outline-none"
              aria-label="Menu"
            >
              <Menu size={24} />
            </button>

            <Link href="/" className="flex items-center">
              <div className="relative w-12 h-12 mr-3">
                <Image
                  src={storeConfig?.logoUrl || "/placeholder.svg?key=logo&text=Açaí+Delícia"}
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-xl font-bold text-purple-900">{storeConfig?.name || "Açaí Delícia"}</h1>
            </Link>

            <div className="ml-auto flex items-center space-x-3">
              <StoreStatus />
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}
