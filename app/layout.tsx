import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import ClientLayout from "./client-layout"
import { homeMetadata } from "./metadata"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  ...homeMetadata,
  icons: [
    { rel: "icon", type: "image/x-icon", url: "/icons/favicon.ico" },
    { rel: "icon", type: "image/png", sizes: "96x96", url: "/icons/favicon-96x96.png" },
    { rel: "apple-touch-icon", sizes: "180x180", url: "/icons/apple-touch-icon.png" },
    { rel: "manifest", url: "/manifest.json" }
  ]
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <ClientLayout>{children}</ClientLayout>
    </html>
  )
}

import './globals.css'