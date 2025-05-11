"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2, Calendar, Clock, AlertCircle } from "lucide-react"
import { getStoreConfig, saveStoreConfig, backupData, type StoreConfig } from "@/lib/db"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function OperatingHoursPage() {
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [isAddingSpecialDate, setIsAddingSpecialDate] = useState(false)
  const [newSpecialDate, setNewSpecialDate] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    isOpen: false,
    note: "",
  })

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

  const handleAddSpecialDate = () => {
    if (!storeConfig) return

    // Verificar se a data já existe
    const dateExists = storeConfig.specialDates.some((date) => date.date === newSpecialDate.date)

    if (dateExists) {
      alert("Esta data já está cadastrada. Remova-a primeiro se quiser alterá-la.")
      return
    }

    setStoreConfig({
      ...storeConfig,
      specialDates: [...storeConfig.specialDates, newSpecialDate],
    })

    // Resetar o formulário
    setNewSpecialDate({
      date: format(new Date(), "yyyy-MM-dd"),
      isOpen: false,
      note: "",
    })
    setIsAddingSpecialDate(false)
  }

  const handleRemoveSpecialDate = (date: string) => {
    if (!storeConfig) return
    setStoreConfig({
      ...storeConfig,
      specialDates: storeConfig.specialDates.filter((d) => d.date !== date),
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
                {Object.entries(storeConfig.operatingHours).map(([day, config]) => (
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
                ))}
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <p>Formato: HH:MM - HH:MM (24 horas)</p>
                <p>Exemplo: 10:00 - 22:00</p>
              </div>
            </div>

            {/* Datas Especiais */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-purple-900 flex items-center">
                  <Calendar size={20} className="mr-2" />
                  Datas Especiais
                </h2>

                <button
                  onClick={() => setIsAddingSpecialDate(true)}
                  className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded-md text-sm flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Adicionar Data
                </button>
              </div>

              {isAddingSpecialDate ? (
                <div className="bg-purple-50 p-4 rounded-md mb-4">
                  <h3 className="font-medium text-purple-900 mb-3">Nova Data Especial</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                      <input
                        type="date"
                        value={newSpecialDate.date}
                        onChange={(e) => setNewSpecialDate({ ...newSpecialDate, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="special-date-open"
                        checked={newSpecialDate.isOpen}
                        onChange={(e) => setNewSpecialDate({ ...newSpecialDate, isOpen: e.target.checked })}
                        className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="special-date-open" className="ml-2 block text-sm text-gray-700">
                        Loja aberta nesta data
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                      <input
                        type="text"
                        value={newSpecialDate.note}
                        onChange={(e) => setNewSpecialDate({ ...newSpecialDate, note: e.target.value })}
                        placeholder="Ex: Feriado, Evento especial, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={() => setIsAddingSpecialDate(false)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-gray-700"
                      >
                        Cancelar
                      </button>
                      <button onClick={handleAddSpecialDate} className="px-3 py-1 bg-purple-700 text-white rounded-md">
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {storeConfig.specialDates.length === 0 ? (
                <p className="text-gray-500 text-center py-6">
                  Nenhuma data especial cadastrada. Adicione datas em que a loja estará fechada ou com horário
                  diferente.
                </p>
              ) : (
                <div className="space-y-3">
                  {storeConfig.specialDates
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((specialDate) => (
                      <div key={specialDate.date} className="flex justify-between items-center border-b pb-3">
                        <div>
                          <div className="flex items-center">
                            <span
                              className={`w-3 h-3 rounded-full mr-2 ${specialDate.isOpen ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            <span className="font-medium">{formatDate(specialDate.date)}</span>
                          </div>
                          <p className="text-sm text-gray-600 ml-5">
                            {specialDate.isOpen ? "Aberto" : "Fechado"}
                            {specialDate.note ? ` • ${specialDate.note}` : ""}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRemoveSpecialDate(specialDate.date)}
                          className="text-red-500 p-1"
                          title="Remover data"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Função auxiliar para obter o nome do dia em português
function getDayName(day: string): string {
  const dayNames = {
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
