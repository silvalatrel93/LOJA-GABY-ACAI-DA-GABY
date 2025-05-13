"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Plus, Trash2, Save, Check } from "lucide-react"
import { useStore } from "@/lib/store-context"
import { getAllProducts, saveProduct, deleteProduct } from "@/lib/services/product-service"
import { getAllCategories } from "@/lib/services/category-service"
import { getAllAdditionals } from "@/lib/services/additional-service"
import { formatCurrency } from "@/lib/utils"
import type { Product, Category, Additional } from "@/lib/types"

export default function ProductsPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { store } = useStore()
  const storeId = store?.id

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [additionals, setAdditionals] = useState<Additional[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdditionalsModalOpen, setIsAdditionalsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteStatus, setDeleteStatus] = useState<{ id: number; status: "pending" | "success" | "error" } | null>(null)

  // Função para carregar produtos, categorias e adicionais
  const loadData = async () => {
    if (!storeId) return

    try {
      setIsLoading(true)
      const [productsList, categoriesList, additionalsList] = await Promise.all([
        getAllProducts(storeId),
        getAllCategories(storeId),
        getAllAdditionals(storeId),
      ])
      setProducts(productsList)
      setCategories(categoriesList)
      setAdditionals(additionalsList)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar produtos quando o storeId estiver disponível
  useEffect(() => {
    if (storeId) {
      loadData()
    }
  }, [storeId])

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product })
    setIsModalOpen(true)
  }

  const handleAddProduct = () => {
    // Usar a primeira categoria disponível como padrão
    const defaultCategoryId = categories.length > 0 ? categories[0].id : 1

    setEditingProduct({
      id: 0, // Será gerado pelo banco de dados
      name: "",
      description: "",
      image: "/placeholder.svg?key=product",
      sizes: [
        { size: "300ml", price: 0 },
        { size: "500ml", price: 0 },
        { size: "700ml", price: 0 },
      ],
      categoryId: defaultCategoryId,
      active: true,
      allowedAdditionals: [],
      storeId: storeId || "",
    })
    setIsModalOpen(true)
  }

  const handleDeleteProduct = async (id: number) => {
    if (!storeId) return

    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        setDeleteStatus({ id, status: "pending" })
        await deleteProduct(id, storeId)

        // Atualizar a lista de produtos após excluir
        await loadData()
        setDeleteStatus({ id, status: "success" })
      } catch (error) {
        console.error("Erro ao excluir produto:", error)
        setDeleteStatus({ id, status: "error" })
        alert("Erro ao excluir produto. Tente novamente.")
      }
    }
  }

  const handleSaveProduct = async () => {
    if (!editingProduct || !storeId) return

    if (!editingProduct.name) {
      alert("O nome do produto é obrigatório")
      return
    }

    try {
      // Garantir que o produto tenha o storeId correto
      const productToSave = {
        ...editingProduct,
        storeId,
      }

      await saveProduct(productToSave, storeId)

      // Atualizar a lista de produtos após salvar
      await loadData()
      setIsModalOpen(false)
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      alert("Erro ao salvar produto. Tente novamente.")
    }
  }

  const handleSizeChange = (index: number, field: string, value: string) => {
    if (!editingProduct) return

    const updatedSizes = [...editingProduct.sizes]
    updatedSizes[index] = {
      ...updatedSizes[index],
      [field]: field === "price" ? Number.parseFloat(value) || 0 : value,
    }

    setEditingProduct({ ...editingProduct, sizes: updatedSizes })
  }

  // Função para abrir o modal de seleção de adicionais
  const handleManageAdditionals = () => {
    if (!editingProduct) return
    setIsAdditionalsModalOpen(true)
  }

  // Função para alternar a seleção de um adicional
  const toggleAdditionalSelection = (additionalId: number) => {
    if (!editingProduct) return

    const allowedAdditionals = editingProduct.allowedAdditionals || []

    // Verificar se o adicional já está selecionado
    const isSelected = allowedAdditionals.includes(additionalId)

    // Atualizar a lista de adicionais permitidos
    if (isSelected) {
      // Remover o adicional da lista
      setEditingProduct({
        ...editingProduct,
        allowedAdditionals: allowedAdditionals.filter((id) => id !== additionalId),
      })
    } else {
      // Adicionar o adicional à lista
      setEditingProduct({
        ...editingProduct,
        allowedAdditionals: [...allowedAdditionals, additionalId],
      })
    }
  }

  // Função para selecionar todos os adicionais
  const selectAllAdditionals = () => {
    if (!editingProduct) return

    setEditingProduct({
      ...editingProduct,
      allowedAdditionals: additionals.map((a) => a.id),
    })
  }

  // Função para desselecionar todos os adicionais
  const deselectAllAdditionals = () => {
    if (!editingProduct) return

    setEditingProduct({
      ...editingProduct,
      allowedAdditionals: [],
    })
  }

  // Função para obter o nome da categoria pelo ID
  const getCategoryName = (categoryId: number): string => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "Sem categoria"
  }

  // Função para verificar quantos adicionais estão permitidos para um produto
  const getAdditionalCount = (product: Product): string => {
    if (!product.allowedAdditionals || product.allowedAdditionals.length === 0) {
      return "Nenhum"
    }

    if (product.allowedAdditionals.length === additionals.length) {
      return "Todos"
    }

    return `${product.allowedAdditionals.length} selecionados`
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
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Produtos</h1>
        <button
          onClick={handleAddProduct}
          className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Novo Produto
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">Nenhum produto cadastrado ainda.</p>
          <button
            onClick={handleAddProduct}
            className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md inline-flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Adicionar Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-40 relative">
                <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                {!product.active && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-medium px-3 py-1 bg-red-600 rounded-full">Inativo</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        {getCategoryName(product.categoryId)}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Adicionais: {getAdditionalCount(product)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                      title="Editar produto"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
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
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                      title="Excluir produto"
                      disabled={deleteStatus?.id === product.id && deleteStatus.status === "pending"}
                    >
                      {deleteStatus?.id === product.id && deleteStatus.status === "pending" ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
                <div className="mt-3 space-y-1">
                  {product.sizes.map((size) => (
                    <div key={size.size} className="flex justify-between text-sm">
                      <span>{size.size}</span>
                      <span className="font-medium">{formatCurrency(size.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-purple-900">
                {editingProduct.id ? "Editar Produto" : "Novo Produto"}
              </h2>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nome do produto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={editingProduct.categoryId}
                  onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Descrição do produto"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                <input
                  type="text"
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="URL da imagem"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingProduct.active}
                  onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.checked })}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  Produto ativo
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tamanhos e Preços</label>

                {editingProduct.sizes.map((size, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={size.size}
                      onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                      className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Tamanho"
                    />
                    <input
                      type="number"
                      value={size.price}
                      onChange={(e) => handleSizeChange(index, "price", e.target.value)}
                      className="w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Preço"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                    />
                  </div>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Adicionais Permitidos</label>
                  <button
                    onClick={handleManageAdditionals}
                    className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-md"
                  >
                    Gerenciar Adicionais
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {!editingProduct.allowedAdditionals || editingProduct.allowedAdditionals.length === 0
                    ? "Nenhum adicional selecionado"
                    : editingProduct.allowedAdditionals.length === additionals.length
                      ? "Todos os adicionais selecionados"
                      : `${editingProduct.allowedAdditionals.length} adicionais selecionados`}
                </p>
              </div>
            </div>

            <div className="p-4 border-t sticky bottom-0 bg-white flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-4 py-2 bg-purple-700 text-white rounded-md flex items-center"
              >
                <Save size={18} className="mr-1" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de seleção de adicionais */}
      {isAdditionalsModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-purple-900">Adicionais para {editingProduct.name}</h2>
            </div>

            <div className="p-4">
              <div className="flex justify-between mb-4">
                <button
                  onClick={selectAllAdditionals}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                >
                  Selecionar Todos
                </button>
                <button
                  onClick={deselectAllAdditionals}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm"
                >
                  Limpar Seleção
                </button>
              </div>

              {additionals.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Nenhum adicional cadastrado. Adicione adicionais na página de gerenciamento de adicionais.
                </p>
              ) : (
                <div className="space-y-2">
                  {additionals.map((additional) => {
                    const isSelected = editingProduct.allowedAdditionals?.includes(additional.id) || false

                    return (
                      <div
                        key={additional.id}
                        className={`flex items-center justify-between p-3 border rounded-md ${
                          isSelected ? "border-purple-500 bg-purple-50" : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 relative mr-3 bg-purple-100 rounded-md overflow-hidden">
                            {additional.image ? (
                              <Image
                                src={additional.image || "/placeholder.svg"}
                                alt={additional.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-purple-300">
                                <Plus size={16} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{additional.name}</p>
                            <p className="text-sm text-purple-700">{formatCurrency(additional.price)}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleAdditionalSelection(additional.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isSelected ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {isSelected ? <Check size={16} /> : <Plus size={16} />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t sticky bottom-0 bg-white flex justify-end space-x-2">
              <button
                onClick={() => setIsAdditionalsModalOpen(false)}
                className="px-4 py-2 bg-purple-700 text-white rounded-md"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
