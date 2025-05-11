"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"

export default function SupabaseStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const supabase = createSupabaseClient()
        const { data, error } = await supabase.from("categories").select("count")

        if (error) {
          console.error("Erro ao conectar com Supabase:", error)
          setStatus("error")
          setErrorMessage(error.message)
          return
        }

        setStatus("connected")
      } catch (error) {
        console.error("Erro ao conectar com Supabase:", error)
        setStatus("error")
        setErrorMessage(error instanceof Error ? error.message : String(error))
      }
    }

    checkConnection()
  }, [])

  if (status === "loading") {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 p-2 rounded shadow">
        Conectando ao Supabase...
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 text-red-800 p-2 rounded shadow">
        Erro ao conectar: {errorMessage}
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 p-2 rounded shadow">Conectado ao Supabase</div>
  )
}
