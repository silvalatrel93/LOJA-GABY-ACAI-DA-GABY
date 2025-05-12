import type React from "react"
import type { Metadata } from "next"
import AdminPWAInstaller from "@/components/admin-pwa-installer"

export const metadata: Metadata = {
  title: "Painel Admin - Açaí Online",
  description: "Painel administrativo para gerenciar sua loja de açaí",
  // Adicionar link para o manifesto apenas na área admin
  manifest: "/admin-manifest.json",
  themeColor: "#9333ea",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <AdminPWAInstaller />
    </>
  )
}
