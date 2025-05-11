"use client"

import { Menu } from "lucide-react"
import { useState } from "react"
import SideMenu from "./side-menu"

export default function HamburgerMenuButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <>
      <button
        onClick={toggleMenu}
        className="p-2 rounded-md hover:bg-purple-100 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={24} className="text-purple-900" />
      </button>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}
