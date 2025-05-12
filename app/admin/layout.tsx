import type React from "react"
import type { Metadata } from "next"
import AdminPWAInstaller from "@/components/admin-pwa-installer"

export const metadata: Metadata = {
  title: "Painel Admin - Açaí Online",
  description: "Painel administrativo para gerenciar sua loja de açaí",
  manifest: "/admin-manifest.json",
  themeColor: "#9333ea",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Açaí Admin",
  },
  formatDetection: {
    telephone: false,
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Açaí Admin" />
      </head>
      {children}
      <AdminPWAInstaller />
    </>
  )
}
