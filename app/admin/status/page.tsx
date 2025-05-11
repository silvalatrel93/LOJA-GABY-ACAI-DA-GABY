"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import SupabaseStatus from "@/components/supabase-status"
import DataMigration from "@/components/data-migration"

export default function StatusPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
        <div className="container mx-auto flex items-center">
          <Link href="/admin" className="mr-4">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">Status do Sistema</h1>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <SupabaseStatus />

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Migração de Dados</h2>
          <DataMigration />
        </div>
      </div>
    </div>
  )
}
