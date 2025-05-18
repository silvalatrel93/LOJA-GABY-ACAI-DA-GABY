"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2, Eye, EyeOff } from "lucide-react"
import {
  AdditionalCategoryService,
  backupData,
} from "@/lib/db"
import type { AdditionalCategory } from "@/lib/services/additional-category-service"
import { createSafeKey } from "@/lib/key-utils";

export default function AdditionalCategoriesAdminPage() {
  const [categories, setCategories] = useState<AdditionalCategory[]>([])
  const [editingCategory, setEditingCategory] = useState<AdditionalCategory | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteStatus, setDeleteStatus] = useState<{ id: number; status: "pending" | "success" | "error" } | null>(null)

  // Função para carregar categorias
  const loadData = async () => {
    try {
      setIsLoading(true)
      const categoriesList = await AdditionalCategoryService.getAllAdditionalCategories()
      setCategories(categoriesList)
    } catch (error) {
      console.error("Erro ao carregar categorias de adicionais:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar categorias na montagem do componente
  useEffect(() => {
    loadData()
  }, [])

  const handleEditCategory = (category: AdditionalCategory) => {
    setEditingCategory({ ...category })
    setIsModalOpen(true)
  }

  const handleAddCategory = () => {
    // Encontrar o maior ID para a nova categoria
    const maxId = categories.length > 0 ? Math.max(...categories.map((c) => c.id)) : 0
    // Encontrar a maior ordem para a nova categoria
    const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.order)) : 0

    setEditingCategory({
      id: maxId + 1,
      name: "",
      order: maxOrder + 1,
      active: true,
    })
    setIsModalOpen(true)
  }

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita e pode afetar adicionais associados a esta categoria.")) {
      try {
        setDeleteStatus({ id, status: "pending" })
        await AdditionalCategoryService.deleteAdditionalCategory(id)

        // Atualizar a lista de categorias após excluir
        await loadData()
        setDeleteStatus({ id, status: "success" })

        // Fazer backup após exclusão
        await backupData()
      } catch (error) {
        console.error("Erro ao excluir categoria:", error)
        setDeleteStatus({ id, status: "error" })
        alert("Erro ao excluir categoria. Tente novamente.")
      }
    }
  }

  const handleSaveCategory = async () => {
    if (!editingCategory) return

    if (!editingCategory.name) {
      alert("O nome da categoria é obrigatório")
      return
    }

    try {
      await AdditionalCategoryService.saveAdditionalCategory(editingCategory)

      // Atualizar a lista de categorias após salvar
      await loadData()
      setIsModalOpen(false)

      // Fazer backup após salvar
      await backupData()
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
      alert("Erro ao salvar categoria. Tente novamente.")
    }
  }

  const handleToggleActive = async (category: AdditionalCategory) => {
    try {
      const updatedCategory = { ...category, active: !category.active }
      await AdditionalCategoryService.saveAdditionalCategory(updatedCategory)
      await loadData()
      await backupData()
    } catch (error) {
      console.error("Erro ao atualizar status da categoria:", error)
      alert("Erro ao atualizar status da categoria. Tente novamente.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/admin" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Gerenciar Categorias de Adicionais</h1>
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
            <h1 className="text-xl font-bold">Gerenciar Categorias de Adicionais</h1>
          </div>
          <button
            onClick={handleAddCategory}
            className="bg-white text-purple-900 px-4 py-2 rounded-md font-medium flex items-center"
          >
            <Plus size={18} className="mr-1" />
            Nova Categoria
          </button>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Categorias de Adicionais</h2>
          <p className="text-sm text-gray-600 mb-4">
            Gerencie as categorias para organizar os adicionais disponíveis no sistema.
          </p>

          {categories.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma categoria cadastrada. Clique em "Nova Categoria" para começar.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category, index) => (
                <div key={createSafeKey(category.id, 'admin-additional-category-item', index)} className="border rounded-lg overflow-hidden flex flex-col sm:flex-row">
                  <div className="p-3 flex-1">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-gray-500">Ordem: {category.order}</p>
                        <p className="text-sm text-gray-500">
                          Status: <span className={category.active ? "text-green-600" : "text-red-600"}>
                            {category.active ? "Ativo" : "Inativo"}
                          </span>
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleActive(category)}
                          className={`p-2 rounded-full ${
                            category.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}
                          title={category.active ? "Desativar categoria" : "Ativar categoria"}
                        >
                          {category.active ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>

                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-2 bg-purple-100 text-purple-700 rounded-full"
                          title="Editar categoria"
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
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 bg-red-100 text-red-700 rounded-full"
                          title="Excluir categoria"
                          disabled={deleteStatus?.id === category.id && deleteStatus.status === "pending"}
                        >
                          {deleteStatus?.id === category.id && deleteStatus.status === "pending" ? (
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

      {/* Edit Category Modal */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-purple-900">
                {categories.some((c) => c.id === editingCategory.id) ? "Editar Categoria" : "Nova Categoria"}
              </h2>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nome da categoria"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                <input
                  type="number"
                  value={editingCategory.order}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      order: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ordem de exibição"
                  min="0"
                  step="1"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingCategory.active}
                  onChange={(e) => setEditingCategory({ ...editingCategory, active: e.target.checked })}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  Categoria ativa
                </label>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCategory}
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
