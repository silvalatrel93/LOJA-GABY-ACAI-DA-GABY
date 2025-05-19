"use client"

import { ReactNode, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"

interface AdminAuthProviderProps {
  children: ReactNode
}

export default function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Ignorar verificação se não estiver em uma rota de admin
    if (!pathname?.startsWith("/admin")) {
      return
    }

    // Verificar se o usuário está na página de login do admin
    const isLoginPage = pathname === "/admin/login"
    
    // Se já estiver na página de login, não verificar autenticação
    if (isLoginPage) {
      return
    }

    try {
      // Verificar se o usuário está autenticado
      const isAuthenticated = localStorage.getItem("admin_authenticated") === "true"

      // Se não estiver autenticado, redirecionar para a página de login
      if (!isAuthenticated) {
        toast.error("Você precisa fazer login para acessar o painel administrativo")
        router.push("/admin/login")
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error)
      // Em caso de erro, redirecionar para a página de login por segurança
      router.push("/admin/login")
    }
  }, [pathname, router])

  return <>{children}</>
}
