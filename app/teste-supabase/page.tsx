"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"

export default function TestSupabase() {
  const [status, setStatus] = useState("Testando conexão...")
  const [error, setError] = useState("")

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createSupabaseClient()
        const { data, error } = await supabase.from("categories").select("count()", { count: "exact" })
        
        if (error) throw error
        
        setStatus(`Conexão bem-sucedida! Contagem: ${data[0].count}`)
      } catch (err) {
        console.error("Erro ao conectar:", err)
        setError(String(err))
        setStatus("Falha na conexão")
      }
    }
    
    testConnection()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Teste de Conexão Supabase</h1>
      <div className={`p-3 rounded ${status.includes("sucedida") ? "bg-green-100" : "bg-yellow-100"}`}>
        {status}
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-100 rounded">
          <p className="font-bold">Erro:</p>
          <pre className="text-sm overflow-auto">{error}</pre>
        </div>
      )}
    </div>
  )
}
