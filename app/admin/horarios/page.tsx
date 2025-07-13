"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2, Calendar, Clock, AlertCircle } from "lucide-react"
import { getStoreConfig, saveStoreConfig, backupData, type StoreConfig } from "@/lib/db"
import type { SpecialDate } from "@/lib/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function OperatingHoursPage() {
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")


  // Função para normalizar os horários de funcionamento
  const normalizeOperatingHours = (operatingHours: any): Record<string, { open: boolean; hours: string }> => {
    // Verificar se operatingHours existe e é um objeto
    if (!operatingHours || typeof operatingHours !== 'object') {
      // Retornar horários padrão se não existir
      return {
        monday: { open: false, hours: "10:00 - 22:00" },
        tuesday: { open: false, hours: "10:00 - 22:00" },
        wednesday: { open: false, hours: "10:00 - 22:00" },
        thursday: { open: false, hours: "10:00 - 22:00" },
        friday: { open: false, hours: "10:00 - 22:00" },
        saturday: { open: false, hours: "10:00 - 22:00" },
        sunday: { open: false, hours: "10:00 - 22:00" }
      }
    }

    const dayMapping: Record<string, string> = {
      'segunda-feira': 'monday',
      'terça-feira': 'tuesday',
      'quarta-feira': 'wednesday',
      'quinta-feira': 'thursday',
      'sexta-feira': 'friday',
      'sábado': 'saturday',
      'domingo': 'sunday'
    }

    const normalizedHours: Record<string, { open: boolean; hours: string }> = {}

    // Primeiro, copiar qualquer chave que já esteja em inglês
    const weekdays: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    weekdays.forEach((day: string) => {
      if (operatingHours[day]) {
        normalizedHours[day] = operatingHours[day]
      } else {
        normalizedHours[day] = { open: false, hours: "10:00 - 22:00" }
      }
    })

    // Depois, mapear as chaves em português para inglês
    Object.entries(dayMapping).forEach(([ptKey, enKey]) => {
      if (operatingHours[ptKey]) {
        normalizedHours[enKey] = operatingHours[ptKey]
      }
    })

    return normalizedHours
  }

  // Carregar configurações da loja
  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        setIsLoading(true)
        const config = await getStoreConfig()

        // Normalizar os horários de funcionamento
        if (config && config.operatingHours) {
          config.operatingHours = normalizeOperatingHours(config.operatingHours)
        }

        setStoreConfig(config)
      } catch (error) {
        console.error("Erro ao carregar configurações da loja:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStoreConfig()
  }, [])

  // Função para converter horários de volta para português (para salvar no banco)
  const convertOperatingHoursToPortuguese = (operatingHours: Record<string, { open: boolean; hours: string }>): Record<string, { open: boolean; hours: string }> => {
    const dayMapping: Record<string, string> = {
      'monday': 'segunda-feira',
      'tuesday': 'terça-feira',
      'wednesday': 'quarta-feira',
      'thursday': 'quinta-feira',
      'friday': 'sexta-feira',
      'saturday': 'sábado',
      'sunday': 'domingo'
    }

    const convertedHours: Record<string, { open: boolean; hours: string }> = {}

    Object.entries(dayMapping).forEach(([enKey, ptKey]) => {
      if (operatingHours[enKey]) {
        convertedHours[ptKey] = operatingHours[enKey]
      }
    })

    return convertedHours
  }

  const handleSaveConfig = async () => {
    if (!storeConfig) return

    try {
      setIsSaving(true)

      // Converter os horários de volta para português antes de salvar
      const configToSave = {
        ...storeConfig,
        operatingHours: convertOperatingHoursToPortuguese(storeConfig.operatingHours)
      }

      await saveStoreConfig(configToSave)

      // Fazer backup após salvar
      await backupData()

      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Erro ao salvar configurações da loja:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStoreOpen = () => {
    if (!storeConfig) return
    setStoreConfig({
      ...storeConfig,
      isOpen: !storeConfig.isOpen,
    })
  }

  const handleDayToggle = (day: string) => {
    if (!storeConfig) return
    const currentConfig = storeConfig.operatingHours[day] || { open: false, hours: "10:00 - 22:00" }
    setStoreConfig({
      ...storeConfig,
      operatingHours: {
        ...storeConfig.operatingHours,
        [day]: {
          ...currentConfig,
          open: !currentConfig.open,
        },
      },
    })
  }

  const handleHoursChange = (day: string, hours: string) => {
    if (!storeConfig) return
    const currentConfig = storeConfig.operatingHours[day] || { open: false, hours: "10:00 - 22:00" }
    setStoreConfig({
      ...storeConfig,
      operatingHours: {
        ...storeConfig.operatingHours,
        [day]: {
          ...currentConfig,
          hours,
        },
      },
    })
  }



  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/admin" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Horários de Funcionamento</h1>
          </div>
        </header>
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-purple-800 to-purple-900 text-white p-3 sm:p-4 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Link
                href="/admin"
                className="p-1.5 rounded-full hover:bg-purple-700 transition-colors duration-200 flex-shrink-0"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap">
                Horários de Funcionamento
              </h1>
            </div>

            <div className="w-full sm:w-auto">
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-200 ${isSaving
                    ? 'bg-gray-500 cursor-not-allowed'
                    : saveStatus === 'success'
                      ? 'bg-green-600 hover:bg-green-700 shadow-lg transform hover:scale-105'
                      : saveStatus === 'error'
                        ? 'bg-red-600 hover:bg-red-700 shadow-lg transform hover:scale-105'
                        : 'bg-purple-600 hover:bg-purple-700 shadow-lg transform hover:scale-105'
                  }`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                    <span>Salvando...</span>
                  </>
                ) : saveStatus === 'success' ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Salvo!
                  </span>
                ) : saveStatus === 'error' ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Erro
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="w-4 h-4 mr-1.5" />
                    Salvar Alterações
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        {storeConfig && (
          <div className="space-y-6">
            {/* Status da Loja */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <AlertCircle size={20} className="mr-2" />
                Status da Loja
              </h2>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-gray-700">
                    Status atual:
                    <span className={"ml-2 font-medium " + (storeConfig.isOpen ? "text-green-600" : "text-red-600")}>
                      {storeConfig.isOpen ? "Loja Aberta" : "Loja Fechada"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {storeConfig.isOpen
                      ? "A loja está marcada como aberta e estará disponível para pedidos independentemente dos horários configurados abaixo."
                      : "A loja está marcada como fechada, independentemente dos horários configurados."}
                  </p>
                  <p className="text-sm font-medium text-purple-700 mt-2">
                    Este status tem prioridade sobre os horários configurados.
                  </p>
                </div>

                <div className="w-full sm:w-auto">
                  <button
                    onClick={handleToggleStoreOpen}
                    className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center space-x-2 transition-all duration-200 ${storeConfig.isOpen
                        ? 'bg-red-600 hover:bg-red-700 shadow-lg transform hover:scale-105'
                        : 'bg-green-600 hover:bg-green-700 shadow-lg transform hover:scale-105'
                      }`}
                  >
                    {storeConfig.isOpen ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Fechar Loja</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Abrir Loja</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Horários Regulares */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <Clock size={20} className="mr-2" />
                Horários Regulares
              </h2>

              <div className="space-y-4">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                  const config = storeConfig.operatingHours[day] || { open: false, hours: "10:00 - 22:00" };
                  return (
                    <div key={day} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`day-${day}`}
                          checked={config.open}
                          onChange={() => handleDayToggle(day)}
                          className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`day-${day}`} className="ml-2 block text-gray-700">
                          {getDayName(day)}
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="text"
                          value={config.hours}
                          onChange={(e) => handleHoursChange(day, e.target.value)}
                          placeholder="10:00 - 22:00"
                          className={`px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${!config.open ? "bg-gray-100 text-gray-500" : ""
                            }`}
                          disabled={!config.open}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informações de formato removidas */}
            </div>


          </div>
        )}
      </div>
    </div>
  )
}

// Função auxiliar para obter o nome do dia em português
function getDayName(day: string): string {
  const dayNames: Record<string, string> = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo",
  }
  return dayNames[day]
}

// Função para formatar a data
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}
