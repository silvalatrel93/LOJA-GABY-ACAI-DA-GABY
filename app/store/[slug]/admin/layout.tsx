"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Home, ShoppingBag, Layers, PlusCircle, MessageSquare, Settings, Bell, Clock } from "lucide-react"
import AuthGuard from "@/components/auth-guard"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const params = useParams()
  const slug = params?.slug as string

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Sidebar para navegação */}
        <aside className="bg-purple-900 text-white w-full md:w-64 md:min-h-screen">
          <div className="p-4 border-b border-purple-800">
            <Link href={`/store/${slug}`} className="flex items-center text-white hover:text-purple-200">
              <ArrowLeft size={20} className="mr-2" />
              <span>Voltar para a loja</span>
            </Link>
          </div>

          <nav className="p-4">
            <h2 className="text-lg font-bold mb-4">Painel Administrativo</h2>
            <ul className="space-y-2">
              <li>
                <Link href={`/store/${slug}/admin`} className="flex items-center p-2 rounded hover:bg-purple-800">
                  <Home size={18} className="mr-2" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/store/${slug}/admin/pedidos`}
                  className="flex items-center p-2 rounded hover:bg-purple-800"
                >
                  <ShoppingBag size={18} className="mr-2" />
                  <span>Pedidos</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/store/${slug}/admin/produtos`}
                  className="flex items-center p-2 rounded hover:bg-purple-800"
                >
                  <PlusCircle size={18} className="mr-2" />
                  <span>Produtos</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/store/${slug}/admin/categorias`}
                  className="flex items-center p-2 rounded hover:bg-purple-800"
                >
                  <Layers size={18} className="mr-2" />
                  <span>Categorias</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/store/${slug}/admin/adicionais`}
                  className="flex items-center p-2 rounded hover:bg-purple-800"
                >
                  <PlusCircle size={18} className="mr-2" />
                  <span>Adicionais</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/store/${slug}/admin/frases`}
                  className="flex items-center p-2 rounded hover:bg-purple-800"
                >
                  <MessageSquare size={18} className="mr-2" />
                  <span>Frases</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/store/${slug}/admin/notificacoes`}
                  className="flex items-center p-2 rounded hover:bg-purple-800"
                >
                  <Bell size={18} className="mr-2" />
                  <span>Notificações</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/store/${slug}/admin/horarios`}
                  className="flex items-center p-2 rounded hover:bg-purple-800"
                >
                  <Clock size={18} className="mr-2" />
                  <span>Horários</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/store/${slug}/admin/configuracoes`}
                  className="flex items-center p-2 rounded hover:bg-purple-800"
                >
                  <Settings size={18} className="mr-2" />
                  <span>Configurações</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>
    </AuthGuard>
  )
}
