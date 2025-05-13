"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Plus, Trash2, Save, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react"
import { useStore } from "@/lib/store-context"
import { getAllCategories, saveCategory, deleteCategory } from "@/lib/services/category-service"
import type { Category } from "@/lib/types"

export default function CategoriesPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { store } = useStore()
  const storeId = store?.id

  const [categories, setCategories] = useState<Category[]>([])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteStatus, setDeleteStatus] = useState<{ id: number; status: "pending" | "success" | "error" } | null>(null)

  // Função para carregar categorias
  const loadCategories = async () => {
    if (!storeId) return

    try {
      setIsLoading(true)
      const categoriesList = await getAllCategories(storeId)
      setCategories(categoriesList)
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar categorias quando o storeId estiver disponível
  useEffect(() => {
    if (storeId) {
      loadCategories()
    }
  }, [storeId])

  const handleEditCategory = (category: Category) => {
    setEditingCategory({ ...category })
    setIsModalOpen(true)
  }

  const handleAddCategory = () => {
    // Encontrar o maior ID e ordem para a nova categoria
    const maxId = categories.length > 0 ? Math.max(...categories.map((c) => c.id)) : 0
    const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.order)) : 0

    setEditingCategory({
      id: 0, // Será gerado pelo banco de dados
      name: "",
      order: maxOrder + 1,
      active: true,
      storeId: storeId || "",
    })
    setIsModalOpen(true)
  }

  const handleDeleteCategory = async (id: number) => {
    if (!storeId) return

    if (confirm("Tem certeza que deseja excluir esta categoria? Isso pode afetar os produtos associados a ela.")) {
      try {
        setDeleteStatus({ id, status: "pending" })
        await deleteCategory(id, storeId)

        // Atualizar a lista de categorias após excluir
        await loadCategories()
        setDeleteStatus({ id, status: "success" })
      } catch (error) {
        console.error("Erro ao excluir categoria:", error)
        setDeleteStatus({ id, status: "error" })
        alert("Erro ao excluir categoria. Tente novamente.")
      }
    }
  }

  const handleSaveCategory = async () => {
    if (!editingCategory || !storeId) return

    if (!editingCategory.name) {
      alert("O nome da categoria é obrigatório")
      return
    }

    try {
      // Garantir que a categoria tenha o storeId correto
      const categoryToSave = {
        ...editingCategory,
        storeId,
      }

      await saveCategory(categoryToSave, storeId)

      // Atualizar a lista de categorias após salvar
      await loadCategories()
      setIsModalOpen(false)
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
      alert("Erro ao salvar categoria. Tente novamente.")
    }
  }

  const handleToggleActive = async (category: Category) => {
    if (!storeId) return

    try {
      const updatedCategory = {
        ...category,
        active: !category.active,
        storeId,
      }

      await saveCategory(updatedCategory, storeId)
      await loadCategories()
    } catch (error) {
      console.error("Erro ao atualizar status da categoria:", error)
      alert("Erro ao atualizar status da categoria. Tente novamente.")
    }
  }

  const handleMoveUp = async (category: Category) => {
    if (!storeId) return

    // Encontrar a categoria anterior na ordem
    const prevCategory = categories.filter((c) => c.order < category.order).sort((a, b) => b.order - a.order)[0]

    if (!prevCategory) return // Já está no topo

    try {
      // Trocar as ordens
      const updatedCategory = {
        ...category,
        order: prevCategory.order,
        storeId,
      }

      const updatedPrevCategory = {
        ...prevCategory,
        order: category.order,
        storeId,
      }

      await saveCategory(updatedCategory, storeId)
      await saveCategory(updatedPrevCategory, storeId)

      await loadCategories()
    } catch (error) {
      console.error("Erro ao mover categoria para cima:", error)
      alert("Erro ao reordenar categorias. Tente novamente.")
    }
  }

  const handleMoveDown = async (category: Category) => {
    if (!storeId) return

    // Encontrar a próxima categoria na ordem
    const nextCategory = categories.filter((c) => c.order > category.order).sort((a, b) => a.order - b.order)[0]

    if (!nextCategory) return // Já está no final

    try {
      // Trocar as ordens
      const updatedCategory = {
        ...category,
        order: nextCategory.order,
        storeId,
      }

      const updatedNextCategory = {
        ...nextCategory,
        order: category.order,
        storeId,
      }

      await saveCategory(updatedCategory, storeId)
      await saveCategory(updatedNextCategory, storeId)

      await loadCategories()
    } catch (error) {
      console.error("Erro ao mover categoria para baixo:", error)
      alert("Erro ao reordenar categorias. Tente novamente.")
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Categorias</h1>
        <button
          onClick={handleAddCategory}
          className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Nova Categoria
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">Nenhuma categoria cadastrada ainda.</p>
          <button
            onClick={handleAddCategory}
            className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md inline-flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Adicionar Primeira Categoria
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Nome
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Ordem
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{category.order}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          category.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {category.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
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
                          onClick={() => handleMoveUp(category)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-full"
                          title="Mover para cima"
                          disabled={categories.filter((c) => c.order < category.order).length === 0}
                        >
                          <ArrowUp size={18} />
                        </button>

                        <button
                          onClick={() => handleMoveDown(category)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-full"
                          title="Mover para baixo"
                          disabled={categories.filter((c) => c.order > category.order).length === 0}
                        >
                          <ArrowDown size={18} />
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-purple-900">
                {editingCategory.id ? "Editar Categoria" : "Nova Categoria"}
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
                    setEditingCategory({ ...editingCategory, order: Number.parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ordem da categoria"
                  min="1"
                  inputMode="numeric"
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
