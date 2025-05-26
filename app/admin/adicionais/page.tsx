"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Save, Plus, Trash2, Eye, EyeOff, FolderPlus } from "lucide-react"
import {
  getAllAdditionals,
  saveAdditional,
  deleteAdditional,
  backupData,
  getAllCategories,
  AdditionalCategoryService,
  type Additional,
  type Category,
} from "@/lib/db"
import type { AdditionalCategory } from "@/lib/services/additional-category-service"
import { formatCurrency } from "@/lib/utils"
import { createSafeKey } from "@/lib/key-utils";

export default function AdditionalsAdminPage() {
  const [additionals, setAdditionals] = useState<Additional[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [additionalCategories, setAdditionalCategories] = useState<AdditionalCategory[]>([])
  const [editingAdditional, setEditingAdditional] = useState<Additional | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteStatus, setDeleteStatus] = useState<{ id: number; status: "pending" | "success" | "error" } | null>(null)
  
  // Função para obter o nome da categoria de um adicional
  const getCategoryName = (categoryId: number): string => {
    const category = additionalCategories.find(c => c.id === categoryId);
    return category ? category.name : "Sem categoria";
  }

  // Função para carregar adicionais e categorias
  const loadData = async () => {
    try {
      setIsLoading(true)
      const [additionalsList, categoriesList, additionalCategoriesList] = await Promise.all([
        getAllAdditionals(), 
        getAllCategories(),
        AdditionalCategoryService.getAllAdditionalCategories()
      ])
      setAdditionals(additionalsList)
      setCategories(categoriesList)
      setAdditionalCategories(additionalCategoriesList)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar adicionais na montagem do componente
  useEffect(() => {
    loadData()
  }, [])

  const handleEditAdditional = (additional: Additional) => {
    // Verificar se o adicional tem preço definido ou não
    const hasPricing = additional.price > 0;
    
    setEditingAdditional({ 
      ...additional,
      hasPricing // Adicionar propriedade para controlar se tem preço ou não
    })
    setIsModalOpen(true)
  }

  const handleAddAdditional = () => {
    // Usar a primeira categoria de adicionais disponível ou 0 se não houver nenhuma
    const defaultCategoryId = additionalCategories.length > 0 ? additionalCategories[0].id : 0

    // Não gerar um ID temporário, deixar que o banco de dados gere o ID
    setEditingAdditional({
      id: 0, // ID temporário que será ignorado pelo backend
      name: "",
      price: 0,
      hasPricing: false, // Inicialmente sem preço definido
      categoryId: defaultCategoryId,
      active: true,
      image: "",
    })
    setIsModalOpen(true)
  }

  const handleDeleteAdditional = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este adicional?")) {
      try {
        setDeleteStatus({ id, status: "pending" })
        await deleteAdditional(id)

        // Atualizar a lista de adicionais após excluir
        await loadData()
        setDeleteStatus({ id, status: "success" })

        // Fazer backup após exclusão
        await backupData()
      } catch (error) {
        console.error("Erro ao excluir adicional:", error)
        setDeleteStatus({ id, status: "error" })
        alert("Erro ao excluir adicional. Tente novamente.")
      }
    }
  }

  const handleSaveAdditional = async () => {
    if (!editingAdditional) return

    if (!editingAdditional.name) {
      alert("O nome do adicional é obrigatório")
      return
    }
    
    // Se não tem preço definido, garantir que o preço seja zero
    const additionalToSave = {
      ...editingAdditional,
      price: editingAdditional.hasPricing ? editingAdditional.price : 0
    };
    
    // Remover a propriedade hasPricing antes de salvar no banco
    delete (additionalToSave as any).hasPricing;

    try {
      await saveAdditional(additionalToSave)

      // Atualizar a lista de adicionais após salvar
      await loadData()
      setIsModalOpen(false)

      // Fazer backup após salvar
      await backupData()
    } catch (error) {
      console.error("Erro ao salvar adicional:", error)
      alert("Erro ao salvar adicional. Tente novamente.")
    }
  }

  const handleToggleActive = async (additional: Additional) => {
    try {
      const updatedAdditional = { ...additional, active: !additional.active }
      await saveAdditional(updatedAdditional)
      await loadData()
      await backupData()
    } catch (error) {
      console.error("Erro ao atualizar status do adicional:", error)
      alert("Erro ao atualizar status do adicional. Tente novamente.")
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
              <h1 className="text-lg sm:text-xl font-bold">Gerenciar Adicionais</h1>
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
                Gerenciar Adicionais
              </h1>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:space-x-3 w-full sm:w-auto">
              <Link 
                href="/admin/categorias-adicionais"
                className="w-full bg-purple-700 hover:bg-purple-600 text-white px-4 py-2.5 sm:py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <FolderPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Categorias</span>
              </Link>
              <button
                onClick={handleAddAdditional}
                className="w-full bg-white hover:bg-gray-50 text-purple-900 px-4 py-2.5 sm:py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Novo Adicional</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Adicionais para Açaí</h2>
          <p className="text-sm text-gray-600 mb-4">
            Gerencie os adicionais que os clientes podem incluir nos seus pedidos de açaí.
          </p>

          {additionals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum adicional cadastrado. Clique em "Novo Adicional" para começar.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {additionals.map((additional, index) => (
                <div key={createSafeKey(additional.id, 'admin-additional-item', index)} className="border rounded-lg overflow-hidden flex flex-col sm:flex-row">
                  <div className="w-full sm:w-24 h-24 relative bg-purple-50">
                    {additional.image ? (
                      <Image
                        src={additional.image || "/placeholder.svg"}
                        alt={additional.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <span className="text-xs text-center">Sem imagem</span>
                      </div>
                    )}
                    {!additional.active && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Inativo</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex-1">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{additional.name}</h3>
                        <p className="text-sm text-gray-500">
                          {additional.price > 0 ? formatCurrency(additional.price) : "Grátis"} • {getCategoryName(additional.categoryId)}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleActive(additional)}
                          className={`p-2 rounded-full ${
                            additional.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}
                          title={additional.active ? "Desativar adicional" : "Ativar adicional"}
                        >
                          {additional.active ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>

                        <button
                          onClick={() => handleEditAdditional(additional)}
                          className="p-2 bg-purple-100 text-purple-700 rounded-full"
                          title="Editar adicional"
                        >
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
                        </button>

                        <button
                          onClick={() => handleDeleteAdditional(additional.id)}
                          className="p-2 bg-red-100 text-red-700 rounded-full"
                          title="Excluir adicional"
                          disabled={deleteStatus?.id === additional.id && deleteStatus.status === "pending"}
                        >
                          {deleteStatus?.id === additional.id && deleteStatus.status === "pending" ? (
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

      {/* Edit Additional Modal */}
      {isModalOpen && editingAdditional && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-purple-900">
                {additionals.some((a) => a.id === editingAdditional.id) ? "Editar Adicional" : "Novo Adicional"}
              </h2>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Adicional</label>
                <input
                  type="text"
                  value={editingAdditional.name}
                  onChange={(e) => setEditingAdditional({ ...editingAdditional, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nome do adicional"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Preço</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasPricing"
                      checked={editingAdditional.hasPricing}
                      onChange={(e) => {
                        const hasPricing = e.target.checked;
                        setEditingAdditional({
                          ...editingAdditional,
                          hasPricing,
                          // Se desmarcar a opção de preço, zera o valor
                          price: hasPricing ? editingAdditional.price : 0
                        });
                      }}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasPricing" className="ml-2 text-sm text-gray-700">
                      Adicional com preço
                    </label>
                  </div>
                </div>
                
                {editingAdditional.hasPricing ? (
                  <input
                    type="number"
                    value={editingAdditional.price}
                    onChange={(e) =>
                      setEditingAdditional({
                        ...editingAdditional,
                        price: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Preço do adicional"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                  />
                ) : (
                  <div className="text-sm text-gray-500 italic py-2 px-3 bg-gray-50 rounded-md">
                    Este adicional será gratuito
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={editingAdditional.categoryId}
                  onChange={(e) => setEditingAdditional({ ...editingAdditional, categoryId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {additionalCategories.length === 0 ? (
                    <option value="0">Nenhuma categoria disponível</option>
                  ) : (
                    additionalCategories.map((category, index) => (
                      <option key={createSafeKey(category.id, 'admin-additional-category-option', index)} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem (opcional)</label>
                <input
                  type="text"
                  value={editingAdditional.image || ""}
                  onChange={(e) => setEditingAdditional({ ...editingAdditional, image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="URL da imagem"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingAdditional.active}
                  onChange={(e) => setEditingAdditional({ ...editingAdditional, active: e.target.checked })}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  Adicional ativo
                </label>
              </div>

              {editingAdditional.image && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Prévia da imagem:</p>
                  <div className="mt-2 relative h-40 bg-purple-100 rounded">
                    <Image
                      src={editingAdditional.image || "/placeholder.svg"}
                      alt="Prévia do adicional"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAdditional}
                className="px-4 py-2 bg-purple-700 text-white rounded-md flex items-center"
              >
                <Save size={18} className="mr-1" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
