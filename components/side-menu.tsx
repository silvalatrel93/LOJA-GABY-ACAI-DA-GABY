"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import Link from "next/link"
import StoreStatus from "./store-status"

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  // Impedir o scroll da página quando o menu estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  // Fechar o menu ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay de fundo escuro */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Menu lateral */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-lg transform transition-transform duration-300 ease-in-out">
        <div className="p-4 flex justify-end">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Fechar menu">
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 py-2">
          {/* Status da loja */}
          <div className="mb-6 p-3 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Status da Loja</h3>
            <StoreStatus inSideMenu={true} />
          </div>

          <ul className="space-y-6">
            <li>
              <Link href="/" className="text-lg font-medium text-gray-900 hover:text-purple-700" onClick={onClose}>
                Cardápio
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="text-lg font-medium text-gray-900 hover:text-purple-700" onClick={onClose}>
                Sobre Nós
              </Link>
            </li>
            <li>
              <Link
                href="/delivery"
                className="text-lg font-medium text-gray-900 hover:text-purple-700"
                onClick={onClose}
              >
                Delivery
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  )
}
