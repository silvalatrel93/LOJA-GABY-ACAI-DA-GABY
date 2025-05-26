"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react"
import { getAllPhrases, savePhrase, deletePhrase, backupData, type Phrase } from "@/lib/db"

export default function PhrasesAdminPage() {
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteStatus, setDeleteStatus] = useState<{ id: number; status: "pending" | "success" | "error" } | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [updatingPhraseId, setUpdatingPhraseId] = useState<number | null>(null)

  // Função para carregar frases
  const loadPhrases = useCallback(async () => {
    try {
      setIsLoading(true)
      const phrasesList = await getAllPhrases()
      setPhrases(phrasesList)
    } catch (error) {
      console.error("Erro ao carregar frases:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Carregar frases na montagem do componente
  useEffect(() => {
    loadPhrases()
  }, [loadPhrases])

  const handleEditPhrase = (phrase: Phrase) => {
    setEditingPhrase({ ...phrase })
    setIsModalOpen(true)
    setSaveStatus("idle")
  }

  const handleAddPhrase = () => {
    // Encontrar o maior ID e ordem para a nova frase
    const maxId = phrases.length > 0 ? Math.max(...phrases.map((p) => p.id)) : 0
    const maxOrder = phrases.length > 0 ? Math.max(...phrases.map((p) => p.order)) : 0

    setEditingPhrase({
      id: 0, // Usar 0 para indicar nova frase
      text: "",
      order: maxOrder + 1,
      active: true,
    })
    setIsModalOpen(true)
    setSaveStatus("idle")
  }

  const handleDeletePhrase = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta frase?")) {
      try {
        setDeleteStatus({ id, status: "pending" })

        // Atualização otimista da UI
        setPhrases((currentPhrases) => currentPhrases.filter((p) => p.id !== id))

        // Executar a operação no banco de dados
        await deletePhrase(id)
        setDeleteStatus({ id, status: "success" })

        // Fazer backup após exclusão (em segundo plano)
        backupData().catch(console.error)
      } catch (error) {
        console.error("Erro ao excluir frase:", error)
        setDeleteStatus({ id, status: "error" })
        alert("Erro ao excluir frase. Tente novamente.")

        // Recarregar frases em caso de erro
        loadPhrases()
      }
    }
  }

  const handleSavePhrase = async () => {
    if (!editingPhrase) return

    if (!editingPhrase.text) {
      alert("O texto da frase é obrigatório")
      return
    }

    try {
      setSaveStatus("saving")

      // Cópia da frase sendo editada
      const phraseToSave = { ...editingPhrase }

      // Atualização otimista da UI
      if (phraseToSave.id > 0) {
        // Atualizar frase existente
        setPhrases((currentPhrases) => currentPhrases.map((p) => (p.id === phraseToSave.id ? phraseToSave : p)))
      } else {
        // Adicionar nova frase com ID temporário
        const tempId = -Date.now() // ID negativo temporário
        setPhrases((currentPhrases) => [...currentPhrases, { ...phraseToSave, id: tempId }])
      }

      // Fechar o modal imediatamente após atualização otimista
      setIsModalOpen(false)

      // Executar a operação no banco de dados
      const savedPhrase = await savePhrase(phraseToSave)

      if (!savedPhrase) {
        throw new Error("Falha ao salvar frase")
      }

      // Atualizar a lista com o ID correto (em caso de nova frase)
      setPhrases((currentPhrases) => {
        if (phraseToSave.id === 0) {
          // Nova frase - substituir a versão com ID temporário pela versão com ID real
          return currentPhrases
            .filter((p) => p.id > 0) // Remover a versão temporária
            .concat(savedPhrase) // Adicionar a versão com ID real
        } else {
          // Frase existente - garantir que temos os dados mais recentes
          return currentPhrases.map((p) => (p.id === savedPhrase.id ? savedPhrase : p))
        }
      })

      setSaveStatus("success")

      // Fazer backup após salvar (em segundo plano)
      backupData().catch(console.error)
    } catch (error) {
      console.error("Erro ao salvar frase:", error)
      setSaveStatus("error")
      alert("Erro ao salvar frase. Tente novamente.")

      // Recarregar frases em caso de erro
      loadPhrases()

      // Reabrir o modal em caso de erro
      setIsModalOpen(true)
    }
  }

  const handleToggleActive = async (phrase: Phrase) => {
    try {
      setUpdatingPhraseId(phrase.id)

      // Atualização otimista da UI
      const updatedPhrase = { ...phrase, active: !phrase.active }
      setPhrases((currentPhrases) => currentPhrases.map((p) => (p.id === phrase.id ? updatedPhrase : p)))

      // Executar a operação no banco de dados
      await savePhrase(updatedPhrase)

      // Fazer backup após atualização (em segundo plano)
      backupData().catch(console.error)
    } catch (error) {
      console.error("Erro ao atualizar status da frase:", error)
      alert("Erro ao atualizar status da frase. Tente novamente.")

      // Recarregar frases em caso de erro
      loadPhrases()
    } finally {
      setUpdatingPhraseId(null)
    }
  }

  const handleMoveUp = async (phrase: Phrase) => {
    // Encontrar a frase anterior na ordem
    const prevPhrase = phrases.filter((p) => p.order < phrase.order).sort((a, b) => b.order - a.order)[0]

    if (!prevPhrase) return // Já está no topo

    try {
      setUpdatingPhraseId(phrase.id)

      // Trocar as ordens
      const updatedPhrase = { ...phrase, order: prevPhrase.order }
      const updatedPrevPhrase = { ...prevPhrase, order: phrase.order }

      // Atualização otimista da UI
      setPhrases((currentPhrases) =>
        currentPhrases.map((p) => {
          if (p.id === phrase.id) return updatedPhrase
          if (p.id === prevPhrase.id) return updatedPrevPhrase
          return p
        }),
      )

      // Executar as operações no banco de dados
      await Promise.all([savePhrase(updatedPhrase), savePhrase(updatedPrevPhrase)])

      // Fazer backup após atualização (em segundo plano)
      backupData().catch(console.error)
    } catch (error) {
      console.error("Erro ao mover frase para cima:", error)
      alert("Erro ao reordenar frases. Tente novamente.")

      // Recarregar frases em caso de erro
      loadPhrases()
    } finally {
      setUpdatingPhraseId(null)
    }
  }

  const handleMoveDown = async (phrase: Phrase) => {
    // Encontrar a próxima frase na ordem
    const nextPhrase = phrases.filter((p) => p.order > phrase.order).sort((a, b) => a.order - b.order)[0]

    if (!nextPhrase) return // Já está no final

    try {
      setUpdatingPhraseId(phrase.id)

      // Trocar as ordens
      const updatedPhrase = { ...phrase, order: nextPhrase.order }
      const updatedNextPhrase = { ...nextPhrase, order: phrase.order }

      // Atualização otimista da UI
      setPhrases((currentPhrases) =>
        currentPhrases.map((p) => {
          if (p.id === phrase.id) return updatedPhrase
          if (p.id === nextPhrase.id) return updatedNextPhrase
          return p
        }),
      )

      // Executar as operações no banco de dados
      await Promise.all([savePhrase(updatedPhrase), savePhrase(updatedNextPhrase)])

      // Fazer backup após atualização (em segundo plano)
      backupData().catch(console.error)
    } catch (error) {
      console.error("Erro ao mover frase para baixo:", error)
      alert("Erro ao reordenar frases. Tente novamente.")

      // Recarregar frases em caso de erro
      loadPhrases()
    } finally {
      setUpdatingPhraseId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-3 sm:p-4 sticky top-0 z-10">
          <div className="container mx-auto">
            <div className="flex items-center">
              <Link href="/admin" className="mr-2 sm:mr-4">
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <h1 className="text-lg sm:text-xl font-bold">Gerenciar Frases</h1>
            </div>
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
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link 
                href="/admin" 
                className="p-1.5 rounded-full hover:bg-purple-700 transition-colors duration-200 flex-shrink-0"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap">
                Gerenciar Frases
              </h1>
            </div>
            <div className="w-full sm:w-auto">
              <button
                onClick={handleAddPhrase}
                className="w-full bg-white hover:bg-gray-50 text-purple-900 px-4 py-2.5 sm:py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Nova Frase</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Frases Promocionais</h2>
          <p className="text-sm text-gray-600 mb-4">
            Estas frases são exibidas no carrossel de texto abaixo do banner principal na página inicial.
          </p>

          {phrases.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma frase cadastrada. Clique em "Nova Frase" para começar.
            </p>
          ) : (
            <div className="space-y-4">
              {phrases.map((phrase) => (
                <div key={phrase.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="flex-1">
                        <h3 className={`font-semibold text-lg ${!phrase.active ? "text-gray-400" : ""}`}>
                          {phrase.text}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Ordem: {phrase.order}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggleActive(phrase)}
                          className={`p-2 rounded-full ${
                            phrase.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}
                          title={phrase.active ? "Desativar frase" : "Ativar frase"}
                          disabled={updatingPhraseId === phrase.id}
                        >
                          {updatingPhraseId === phrase.id ? (
                            <span className="animate-pulse">...</span>
                          ) : phrase.active ? (
                            <Eye size={18} />
                          ) : (
                            <EyeOff size={18} />
                          )}
                        </button>

                        <button
                          onClick={() => handleMoveUp(phrase)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-full"
                          title="Mover para cima"
                          disabled={
                            updatingPhraseId === phrase.id || phrases.filter((p) => p.order < phrase.order).length === 0
                          }
                        >
                          {updatingPhraseId === phrase.id ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            <ArrowUp size={18} />
                          )}
                        </button>

                        <button
                          onClick={() => handleMoveDown(phrase)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-full"
                          title="Mover para baixo"
                          disabled={
                            updatingPhraseId === phrase.id || phrases.filter((p) => p.order > phrase.order).length === 0
                          }
                        >
                          {updatingPhraseId === phrase.id ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            <ArrowDown size={18} />
                          )}
                        </button>

                        <button
                          onClick={() => handleEditPhrase(phrase)}
                          className="p-2 bg-purple-100 text-purple-700 rounded-full"
                          title="Editar frase"
                          disabled={updatingPhraseId === phrase.id}
                        >
                          {updatingPhraseId === phrase.id ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeletePhrase(phrase.id)}
                          className="p-2 bg-red-100 text-red-700 rounded-full"
                          title="Excluir frase"
                          disabled={deleteStatus?.id === phrase.id && deleteStatus.status === "pending"}
                        >
                          {deleteStatus?.id === phrase.id && deleteStatus.status === "pending" ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Phrase Modal */}
      {isModalOpen && editingPhrase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-purple-900">
                {editingPhrase.id > 0 ? "Editar Frase" : "Nova Frase"}
              </h2>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto da Frase</label>
                <textarea
                  value={editingPhrase.text}
                  onChange={(e) => setEditingPhrase({ ...editingPhrase, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Digite a frase promocional"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dica: Você pode adicionar emojis para deixar as frases mais atrativas! 🍇 ✨ 🚚 ⏱️ 🥄
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                <input
                  type="number"
                  value={editingPhrase.order}
                  onChange={(e) => setEditingPhrase({ ...editingPhrase, order: Number.parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ordem da frase"
                  min="1"
                  inputMode="numeric"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingPhrase.active}
                  onChange={(e) => setEditingPhrase({ ...editingPhrase, active: e.target.checked })}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  Frase ativa
                </label>
              </div>
            </div>

            <div className="p-4 border-t flex justify-between items-center">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                disabled={saveStatus === "saving"}
              >
                Cancelar
              </button>

              <div className="flex items-center">
                {saveStatus === "saving" && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-700 mr-3"></div>
                )}
                {saveStatus === "success" && <div className="text-green-600 mr-3">✓ Salvo!</div>}
                {saveStatus === "error" && <div className="text-red-600 mr-3">Erro!</div>}
                <button
                  onClick={handleSavePhrase}
                  className="px-4 py-2 bg-purple-700 text-white rounded-md flex items-center"
                  disabled={saveStatus === "saving"}
                >
                  <Save size={18} className="mr-1" />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
