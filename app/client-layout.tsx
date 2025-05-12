"use client"

import type React from "react"

import "./globals.css"
import { Inter } from "next/font/google"
import { useEffect } from "react"
import AutoInitializer from "@/components/auto-initializer"
import SupabaseInitializer from "@/components/supabase-initializer"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // Adicionar classe para remover margens e preenchimentos padrão
  useEffect(() => {
    document.body.classList.add("overflow-x-hidden")
    document.documentElement.classList.add("overflow-x-hidden")

    const style = document.createElement("style")
    style.innerHTML = `
      body, html {
        margin: 0;
        padding: 0;
        width: 100%;
        max-width: 100vw;
        overflow-x: hidden;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <body className={`${inter.className} overflow-x-hidden`}>
      <AutoInitializer />
      <SupabaseInitializer />
      {children}
    </body>
  )
}
