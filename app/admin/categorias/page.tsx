"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react"
import { getAllCategories, saveCategory, deleteCategory, type Category } from "@/lib/services/category-service"

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteStatus, setDeleteStatus] = useState<{ id: number; status: "pending" | "success" | "error" } | null>(null)

  // Função para carregar categorias
  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const categoriesList = await getAllCategories()
      setCategories(categoriesList)
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar categorias na montagem do componente
  useEffect(() => {
    loadCategories()
  }, [])

  const handleEditCategory = (category: Category) => {
    setEditingCategory({ ...category })
    setIsModalOpen(true)
  }

  const handleAddCategory = () => {
    // Encontrar o maior ID e ordem para a nova categoria
    const maxId = categories.length > 0 ? Math.max(...categories.map((c) => c.id)) : 0
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
    if (confirm("Tem certeza que deseja excluir esta categoria? Isso pode afetar os produtos associados a ela.")) {
      try {
        setDeleteStatus({ id, status: "pending" })
        await deleteCategory(id)

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
    if (!editingCategory) return

    if (!editingCategory.name) {
      alert("O nome da categoria é obrigatório")
      return
    }

    try {
      await saveCategory(editingCategory)

      // Atualizar a lista de categorias após salvar
      await loadCategories()
      setIsModalOpen(false)
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
      alert("Erro ao salvar categoria. Tente novamente.")
    }
  }

  const handleToggleActive = async (category: Category) => {
    try {
      const updatedCategory = { ...category, active: !category.active }
      await saveCategory(updatedCategory)
      await loadCategories()
    } catch (error) {
      console.error("Erro ao atualizar status da categoria:", error)
      alert("Erro ao atualizar status da categoria. Tente novamente.")
    }
  }

  const handleMoveUp = async (category: Category) => {
    // Encontrar a categoria anterior na ordem
    const prevCategory = categories.filter((c) => c.order < category.order).sort((a, b) => b.order - a.order)[0]

    if (!prevCategory) return // Já está no topo

    try {
      // Trocar as ordens
      const updatedCategory = { ...category, order: prevCategory.order }
      const updatedPrevCategory = { ...prevCategory, order: category.order }

      await saveCategory(updatedCategory)
      await saveCategory(updatedPrevCategory)

      await loadCategories()
    } catch (error) {
      console.error("Erro ao mover categoria para cima:", error)
      alert("Erro ao reordenar categorias. Tente novamente.")
    }
  }

  const handleMoveDown = async (category: Category) => {
    // Encontrar a próxima categoria na ordem
    const nextCategory = categories.filter((c) => c.order > category.order).sort((a, b) => a.order - b.order)[0]

    if (!nextCategory) return // Já está no final

    try {
      // Trocar as ordens
      const updatedCategory = { ...category, order: nextCategory.order }
      const updatedNextCategory = { ...nextCategory, order: category.order }

      await saveCategory(updatedCategory)
      await saveCategory(updatedNextCategory)

      await loadCategories()
    } catch (error) {
      console.error("Erro ao mover categoria para baixo:", error)
      alert("Erro ao reordenar categorias. Tente novamente.")
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
              <h1 className="text-lg sm:text-xl font-bold">Gerenciar Categorias</h1>
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
                Gerenciar Categorias
              </h1>
            </div>
            <div className="w-full sm:w-auto">
              <button
                onClick={handleAddCategory}
                className="w-full sm:w-auto bg-white hover:bg-gray-50 text-purple-900 px-4 py-2.5 sm:py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Nova Categoria</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Categorias de Produtos</h2>
          <p className="text-sm text-gray-600 mb-4">
            Organize seus produtos em categorias para facilitar a navegação dos clientes.
          </p>

          {categories.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma categoria cadastrada. Clique em &quot;Nova Categoria&quot; para começar.
            </p>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">Ordem: {category.order}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggleActive(category)}
                          className={`p-2 rounded-full ${category.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
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
