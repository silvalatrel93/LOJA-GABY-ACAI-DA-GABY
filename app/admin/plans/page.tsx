"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import AuthGuard from "@/components/auth-guard"
import { getActivePlans, getUserSubscription } from "@/lib/services/plan-service"
import { formatCurrency } from "@/lib/utils"
import type { Plan, Subscription } from "@/lib/types"

export default function PlansPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar planos e assinatura do usuário
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [plansData, subscriptionData] = await Promise.all([getActivePlans(), getUserSubscription()])
        setPlans(plansData)
        setSubscription(subscriptionData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const getCurrentPlanName = () => {
    if (!subscription) {
      return "Plano Gratuito"
    }

    const currentPlan = plans.find((p) => p.id === subscription.planId)
    return currentPlan ? currentPlan.name : "Plano Desconhecido"
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-purple-900 text-white p-4">
            <div className="container mx-auto flex items-center">
              <Link href="/admin" className="mr-4">
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-xl font-bold">Planos e Assinaturas</h1>
            </div>
          </header>

          <main className="container mx-auto p-4">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-purple-900 text-white p-4">
          <div className="container mx-auto flex items-center">
            <Link href="/admin" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Planos e Assinaturas</h1>
          </div>
        </header>

        <main className="container mx-auto p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Seu Plano Atual</h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium text-purple-700">{getCurrentPlanName()}</p>
                  {subscription && subscription.isCanceled ? (
                    <p className="text-sm text-red-500">
                      Sua assinatura será cancelada em {new Date(subscription.cancelAt).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Assinatura ativa</p>
                  )}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4">Escolha um Plano</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <p className="text-2xl font-semibold text-purple-700">{formatCurrency(plan.price)} / mês</p>

                  <ul className="list-disc pl-5 mt-4 text-gray-700">
                    {plan.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>

                  <Link
                    href={`/checkout/${plan.id}`}
                    className="block bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-4 rounded mt-4"
                  >
                    {subscription?.planId === plan.id ? "Plano Atual" : "Assinar"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
