import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import AutoInitializer from "@/components/auto-initializer"
import SupabaseInitializer from "@/components/supabase-initializer"
import SupabaseSchemaInitializer from "@/components/supabase-schema-initializer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Açaí Online",
  description: "Sistema de pedidos online para açaí",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AutoInitializer />
        <SupabaseInitializer />
        <SupabaseSchemaInitializer />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
