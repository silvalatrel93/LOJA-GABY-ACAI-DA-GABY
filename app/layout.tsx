import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import ClientLayout from "./client-layout"
import { homeMetadata } from "./metadata"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  ...homeMetadata,
  icons: [
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/icons/icon-72x72.png" },
    { rel: "icon", type: "image/png", sizes: "16x16", url: "/icons/icon-72x72.png" },
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