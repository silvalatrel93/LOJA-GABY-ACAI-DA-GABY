"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function NewStorePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a página de ação com o parâmetro "new"
    router.push("/admin/stores/action?action=new")
  }, [router])

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
    </div>
  )
}
