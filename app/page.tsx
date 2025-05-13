"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createSupabaseClient } from "@/lib/supabase-client"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        setIsLoading(true)
        const supabase = createSupabaseClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("Erro ao verificar usuário:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-purple-900 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Açaí Online</h1>
          <nav>
            <ul className="flex space-x-4">
              {user ? (
                <>
                  <li>
                    <Link href="/admin/stores" className="hover:underline">
                      Minhas Lojas
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin" className="hover:underline">
                      Painel Admin
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="hover:underline">
                      Entrar
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="hover:underline">
                      Registrar
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-purple-900 to-purple-700 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">Sistema de Pedidos Online para Lojas de Açaí</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Gerencie sua loja de açaí online, receba pedidos e aumente suas vendas com nossa plataforma completa.
            </p>
            <Link href="/register">
              <button className="bg-white text-purple-900 px-6 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors">
                Comece Agora
              </button>
            </Link>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Recursos Principais</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-3 text-purple-900">Gerenciamento de Produtos</h3>
                <p className="text-gray-700">
                  Cadastre seus produtos, categorias e adicionais de forma simples e rápida.
                </p>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-3 text-purple-900">Pedidos Online</h3>
                <p className="text-gray-700">Receba pedidos online e gerencie o status de cada pedido em tempo real.</p>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-3 text-purple-900">Múltiplas Lojas</h3>
                <p className="text-gray-700">Gerencie várias lojas de açaí com um único painel administrativo.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Pronto para começar?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-700">
              Crie sua conta agora e comece a vender açaí online em minutos.
            </p>
            <Link href="/register">
              <button className="bg-purple-700 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-purple-800 transition-colors">
                Criar Conta Grátis
              </button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-purple-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Açaí Online</h3>
              <p className="text-purple-200">Sistema de pedidos para lojas de açaí</p>
            </div>
            <div>
              <p>&copy; {new Date().getFullYear()} Açaí Online - Todos os direitos reservados</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
