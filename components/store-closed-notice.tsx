"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { getStoreStatus } from "@/lib/store-utils"
import { useRouter } from "next/navigation"

export default function StoreClosedNotice() {
  const [storeStatus, setStoreStatus] = useState<{
    isOpen: boolean
    statusText: string
    statusClass: string
  } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadStoreStatus = async () => {
      try {
        const status = await getStoreStatus()
        setStoreStatus(status)

        // Se a loja estiver fechada e não estiver na página inicial ou admin, redirecionar
        if (!status.isOpen) {
          const path = window.location.pathname
          if (path !== "/" && !path.includes("/admin") && !path.includes("/sobre")) {
            // Redirecionar para a página inicial com uma mensagem
            router.push("/?closed=true")
          }
        }
      } catch (error) {
        console.error("Erro ao verificar status da loja:", error)
      }
    }

    loadStoreStatus()

    // Atualizar o status a cada minuto
    const interval = setInterval(loadStoreStatus, 60000)
    return () => clearInterval(interval)
  }, [router])

  // Se a loja estiver aberta, não mostrar nada
  if (!storeStatus || storeStatus.isOpen) {
    return null
  }

  return (
    <div
      className="bg-red-500 text-white py-2 sticky top-12 z-10 w-screen left-0 right-0"
      style={{ marginLeft: "-1rem", marginRight: "-1rem", width: "100vw" }}
    >
      <div className="container mx-auto flex items-center justify-center px-4">
        <Clock size={18} className="mr-2" />
        <p className="text-sm font-medium">{storeStatus.statusText}</p>
      </div>
    </div>
  )
}
