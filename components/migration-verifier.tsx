"use client"

import { useEffect, useState } from "react"
import { isSupabaseMigrationCompleted } from "@/lib/db-supabase"

export default function MigrationVerifier() {
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const verifyMigration = async () => {
      try {
        // Verificar se a migração foi concluída
        const migrationCompleted = await isSupabaseMigrationCompleted()

        // Se a migração foi concluída, atualizar o localStorage
        if (migrationCompleted) {
          localStorage.setItem("supabase_migration_completed", "true")
          console.log("Migração para o Supabase verificada e confirmada")
        } else {
          console.log("Migração para o Supabase não foi concluída")
        }
      } catch (error) {
        console.error("Erro ao verificar migração:", error)
      } finally {
        setChecking(false)
      }
    }

    verifyMigration()
  }, [])

  // Este componente não renderiza nada visualmente
  return null
}
