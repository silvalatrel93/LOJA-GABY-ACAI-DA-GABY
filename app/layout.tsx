import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import ClientLayout from "./client-layout"
import { homeMetadata } from "./metadata"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  ...homeMetadata,
  manifest: "/manifest.json",
  themeColor: "#6B21A8",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Heai Açaí e Sorvetes"
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: [
    { rel: "apple-touch-icon", sizes: "180x180", url: "/icons/icon-192x192.png" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/icons/icon-72x72.png" },
    { rel: "icon", type: "image/png", sizes: "16x16", url: "/icons/icon-72x72.png" },
    { rel: "mask-icon", url: "/icons/icon-192x192.png", color: "#6B21A8" }
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <ClientLayout>{children}</ClientLayout>
    </html>
  )
}


import './globals.css'