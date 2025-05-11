"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { getStoreStatus } from "@/lib/store-utils"

export default function StoreClosedNotice() {
  const [storeStatus, setStoreStatus] = useState({
    isOpen: true,
    statusText: "Carregando...",
    statusClass: "text-gray-500",
  })

  useEffect(() => {
    const loadStoreStatus = async () => {
      const status = await getStoreStatus()
      setStoreStatus(status)
    }

    loadStoreStatus()
  }, [])

  if (storeStatus.isOpen) {
    return null
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-md">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Clock className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-red-800">Loja Fechada</h3>
          <div className="mt-2 text-red-700">
            <p>Nossa loja está fechada no momento. {storeStatus.statusText.split("•")[1] || ""}</p>
            <p className="mt-2">
              Você pode navegar pelos produtos, mas novos pedidos só poderão ser realizados quando a loja estiver
              aberta.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
