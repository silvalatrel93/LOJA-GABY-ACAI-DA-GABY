import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { CartProvider } from "@/lib/cart-context"
import MainLayout from "@/components/main-layout"
import SupabaseInitializer from "@/components/supabase-initializer"
import AutoMigration from "@/components/auto-migration"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Açaí Online",
  description: "Sistema de pedidos online para açaí",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <CartProvider>
          <SupabaseInitializer />
          <AutoMigration />
          <MainLayout>{children}</MainLayout>
        </CartProvider>
      </body>
    </html>
  )
}
