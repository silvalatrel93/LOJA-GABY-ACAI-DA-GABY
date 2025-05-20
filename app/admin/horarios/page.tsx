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


  // Carregar configurações da loja
  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        setIsLoading(true)
        const config = await getStoreConfig()
        setStoreConfig(config)
      } catch (error) {
        console.error("Erro ao carregar configurações da loja:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStoreConfig()
  }, [])

  const handleSaveConfig = async () => {
    if (!storeConfig) return

    try {
      setIsSaving(true)
      await saveStoreConfig(storeConfig)

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
    setStoreConfig({
      ...storeConfig,
      operatingHours: {
        ...storeConfig.operatingHours,
        [day]: {
          ...storeConfig.operatingHours[day],
          open: !storeConfig.operatingHours[day].open,
        },
      },
    })
  }

  const handleHoursChange = (day: string, hours: string) => {
    if (!storeConfig) return
    setStoreConfig({
      ...storeConfig,
      operatingHours: {
        ...storeConfig.operatingHours,
        [day]: {
          ...storeConfig.operatingHours[day],
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
      <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/admin" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Horários de Funcionamento</h1>
          </div>
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className={`px-4 py-2 rounded-md text-white flex items-center ${
              isSaving
                ? "bg-gray-400"
                : saveStatus === "success"
                  ? "bg-green-600"
                  : saveStatus === "error"
                    ? "bg-red-600"
                    : "bg-purple-700 hover:bg-purple-800"
            }`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                Salvando...
              </>
            ) : saveStatus === "success" ? (
              "Salvo com Sucesso!"
            ) : saveStatus === "error" ? (
              "Erro ao Salvar"
            ) : (
              <>
                <Save size={18} className="mr-1" />
                Salvar Alterações
              </>
            )}
          </button>
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

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700">
                    Status atual:
                    <span className={`ml-2 font-medium ${storeConfig.isOpen ? "text-green-600" : "text-red-600"}`}>
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

                <button
                  onClick={handleToggleStoreOpen}
                  className={`px-4 py-2 rounded-md text-white ${
                    storeConfig.isOpen ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {storeConfig.isOpen ? "Fechar Loja" : "Abrir Loja"}
                </button>
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
                  const config = storeConfig.operatingHours[day];
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
                          className={`px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            !config.open ? "bg-gray-100 text-gray-500" : ""
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
