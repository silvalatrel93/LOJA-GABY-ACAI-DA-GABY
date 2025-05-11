"use client"

import { useEffect, useState } from "react"
import { getStoreConfig } from "@/lib/db"

export default function StoreConfigInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        // Apenas verificar se as configurações da loja existem
        await getStoreConfig()
        setInitialized(true)
        localStorage.setItem("store_config_initialized", "true")
      } catch (error) {
        console.error("Erro ao inicializar configurações da loja:", error)
      }
    }

    // Verificar se já foi inicializado antes
    const wasInitialized = localStorage.getItem("store_config_initialized") === "true"

    if (!wasInitialized) {
      initialize()
    } else {
      console.log("Configurações da loja já foram inicializadas anteriormente, pulando inicialização")
      setInitialized(true)
    }
  }, [])

  // Este componente não renderiza nada visualmente
  return null
}
