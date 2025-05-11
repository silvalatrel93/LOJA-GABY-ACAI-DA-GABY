"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function DebugPage() {
  const [layoutStructure, setLayoutStructure] = useState<string[]>([])

  useEffect(() => {
    // Analisar a estrutura do DOM para identificar duplicações
    const analyzeDOM = () => {
      const headers = document.querySelectorAll("header")
      const footers = document.querySelectorAll("footer")
      const structure = []

      structure.push(`Headers encontrados: ${headers.length}`)
      headers.forEach((header, i) => {
        structure.push(`Header ${i + 1}: ${header.textContent?.trim()}`)
      })

      structure.push(`Footers encontrados: ${footers.length}`)
      footers.forEach((footer, i) => {
        structure.push(`Footer ${i + 1}: ${footer.textContent?.trim()}`)
      })

      setLayoutStructure(structure)
    }

    // Executar após o DOM estar completamente carregado
    setTimeout(analyzeDOM, 1000)
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Página de Depuração</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Estrutura do Layout</h2>
        <div className="bg-gray-100 p-4 rounded">
          {layoutStructure.map((line, i) => (
            <p key={i} className="mb-1">
              {line}
            </p>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Links Úteis</h2>
        <ul className="list-disc pl-5">
          <li>
            <Link href="/" className="text-blue-600 hover:underline">
              Página Inicial
            </Link>
          </li>
          <li>
            <Link href="/admin" className="text-blue-600 hover:underline">
              Painel Admin
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
