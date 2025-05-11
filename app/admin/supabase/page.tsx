"use client"

import SupabaseDiagnostics from "@/components/supabase-diagnostics"

export default function SupabasePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico do Supabase</h1>
      <SupabaseDiagnostics />

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Instruções</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Verifique se as variáveis de ambiente <code className="bg-gray-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
              <code className="bg-gray-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> estão configuradas corretamente.
            </li>
            <li>Verifique se o banco de dados Supabase está acessível.</li>
            <li>Se as tabelas não existirem, clique no botão "Criar Tabelas" para criá-las.</li>
            <li>Após criar as tabelas, você pode inicializar os dados padrão na página de administração.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
