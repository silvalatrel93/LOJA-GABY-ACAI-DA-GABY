"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import FloatingCartButton from "./floating-cart-button"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()

  // Lista de caminhos onde o botão flutuante NÃO deve aparecer
  const excludedPaths = [
    "/carrinho",
    "/checkout",
    "/admin",
    "/admin/pedidos",
    "/admin/categorias",
    "/admin/adicionais",
    "/admin/frases",
    "/admin/carrossel",
    "/admin/paginas",
    "/admin/configuracoes",
    "/admin/horarios",
    "/admin/notificacoes",
    "/admin/status",
    "/admin/supabase",
  ]

  // Verifica se o caminho atual começa com algum dos caminhos excluídos
  const shouldShowFloatingButton = !excludedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  return (
    <>
      {children}
      {shouldShowFloatingButton && <FloatingCartButton />}
    </>
  )
}
