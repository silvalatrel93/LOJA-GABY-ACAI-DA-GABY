"use client"

import { useEffect } from "react"

export default function AdminPWAHead() {
  useEffect(() => {
    // Registrar o service worker apenas no ambiente de produção
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/admin-sw.js").then(
          (registration) => {
            console.log("Admin Service Worker registrado com sucesso:", registration.scope)
          },
          (err) => {
            console.log("Falha ao registrar Admin Service Worker:", err)
          },
        )
      })
    }
  }, [])

  return (
    <>
      <meta name="application-name" content="Açaí Online Admin" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Açaí Admin" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#6b21a8" />

      <link rel="manifest" href="/admin-manifest.json" />
      <link rel="apple-touch-icon" href="/icons/admin-icon-192.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/icons/admin-icon-192.png" />
    </>
  )
}
