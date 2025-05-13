"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { getStoreBySlug } from "./services/store-service"
import type { Store } from "./types"

interface StoreContextType {
  currentStore: Store | null
  setCurrentStore: (store: Store | null) => void
  isLoading: boolean
  error: string | null
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentStore, setCurrentStore] = useState<Store | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const loadStoreFromPath = async () => {
      try {
        // Verificar se o caminho contém /store/[slug]
        const storePathMatch = pathname?.match(/\/store\/([^/]+)/)

        if (storePathMatch && storePathMatch[1]) {
          const storeSlug = storePathMatch[1]
          setIsLoading(true)
          setError(null)

          const store = await getStoreBySlug(storeSlug)

          if (store) {
            setCurrentStore(store)
          } else {
            setError(`Loja "${storeSlug}" não encontrada`)
          }
        } else {
          // Não estamos em uma rota de loja específica
          setCurrentStore(null)
        }
      } catch (error) {
        console.error("Erro ao carregar loja:", error)
        setError("Erro ao carregar loja")
      } finally {
        setIsLoading(false)
      }
    }

    loadStoreFromPath()
  }, [pathname])

  return (
    <StoreContext.Provider
      value={{
        currentStore,
        setCurrentStore,
        isLoading,
        error,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error("useStore deve ser usado dentro de um StoreProvider")
  }
  return context
}
