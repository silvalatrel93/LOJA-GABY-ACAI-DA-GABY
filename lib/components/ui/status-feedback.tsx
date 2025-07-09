"use client"

import { ReactNode } from "react"
import { AlertCircle, CheckCircle, Loader } from "lucide-react"

interface StatusFeedbackProps {
  loading: boolean
  error: string | null
  success?: boolean
  successMessage?: string
  children?: ReactNode
}

export function StatusFeedback({
  loading,
  error,
  success = false,
  successMessage = "Operação realizada com sucesso!",
  children
}: StatusFeedbackProps) {
  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="flex items-center">
          <Loader className="animate-spin h-5 w-5 mr-2 text-purple-600" />
          <span className="text-gray-700">Carregando...</span>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    )
  }
  
  if (success) {
    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}
