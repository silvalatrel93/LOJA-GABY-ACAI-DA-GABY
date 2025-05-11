"use client"

import { useEffect, useState } from "react"
import { getAllProducts, initializeDefaultProducts, type Product } from "@/lib/db"

interface ProductsInitializerProps {
  defaultProducts: Product[]
}

export default function ProductsInitializer({ defaultProducts }: ProductsInitializerProps) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        // Verificar se já existem produtos no banco de dados
        const existingProducts = await getAllProducts()

        // Apenas inicializar com produtos padrão se não houver nenhum produto
        // E se ainda não tiver sido inicializado antes
        if (existingProducts.length === 0) {
          console.log("Nenhum produto encontrado, inicializando com produtos padrão")
          await initializeDefaultProducts(defaultProducts)

          // Armazenar flag no localStorage para indicar que já foi inicializado
          localStorage.setItem("products_initialized", "true")
        } else {
          console.log(`${existingProducts.length} produtos encontrados, pulando inicialização`)
        }

        setInitialized(true)
      } catch (error) {
        console.error("Erro ao inicializar produtos:", error)
      }
    }

    // Verificar se já foi inicializado antes
    const wasInitialized = localStorage.getItem("products_initialized") === "true"

    if (!wasInitialized) {
      initialize()
    } else {
      console.log("Sistema já foi inicializado anteriormente, pulando inicialização")
      setInitialized(true)
    }
  }, [defaultProducts])

  // Este componente não renderiza nada visualmente
  return null
}
