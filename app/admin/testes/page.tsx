"use client"

import DataMigrationTool from "@/components/data-migration-tool"
import { useState } from "react"

const TestesPage = () => {
  const [activeTest, setActiveTest] = useState<"integration" | "migration" | "performance">("integration")

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Página de Testes</h1>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded-md ${activeTest === "integration" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setActiveTest("integration")}
        >
          Teste de Integração
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTest === "migration" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setActiveTest("migration")}
        >
          Teste de Migração de Dados
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTest === "performance" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setActiveTest("performance")}
        >
          Teste de Performance
        </button>
      </div>

      {activeTest === "integration" && (
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h3 className="font-medium mb-2">Teste de Integração</h3>
          <p className="text-gray-600">Funcionalidade em desenvolvimento.</p>
        </div>
      )}

      {activeTest === "migration" && <DataMigrationTool />}

      {activeTest === "performance" && (
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h3 className="font-medium mb-2">Teste de Performance</h3>
          <p className="text-gray-600">Funcionalidade em desenvolvimento.</p>
        </div>
      )}
    </div>
  )
}

export default TestesPage
