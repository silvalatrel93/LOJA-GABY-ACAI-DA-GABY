"use client"

import Link from "next/link"
import { Mail } from "lucide-react"

export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
          <Mail className="h-8 w-8 text-purple-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifique seu email</h1>
        <p className="text-gray-600 mb-6">
          Enviamos um link de confirmação para o seu email. Por favor, verifique sua caixa de entrada e clique no link
          para ativar sua conta.
        </p>

        <div className="bg-purple-50 p-4 rounded-md mb-6">
          <p className="text-sm text-purple-700">
            Se você não receber o email em alguns minutos, verifique sua pasta de spam ou solicite um novo link de
            confirmação.
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/register/resend-confirmation">
            <button className="w-full py-2 px-4 border border-purple-600 rounded-md shadow-sm text-sm font-medium text-purple-600 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              Reenviar email de confirmação
            </button>
          </Link>

          <Link href="/login">
            <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              Voltar para o login
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
