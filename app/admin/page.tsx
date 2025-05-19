"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ShoppingBag,
  RefreshCw,
  ImageIcon,
  Layers,
  PlusCircle,
  Check,
  MessageSquare,
  Settings,
  Clock,
  Bell,
} from "lucide-react"
import SocialShare from "@/components/social-share"
import {
  getAllProducts,
  getAllCategories,
  getAllAdditionals,
  saveProduct,
  deleteProduct,
  AdditionalCategoryService,
  type Product,
  type Category,
  type Additional,
} from "@/lib/db"
import type { AdditionalCategory } from "@/lib/services/additional-category-service"
import { formatCurrency } from "@/lib/utils"
import { createSafeKey } from "@/lib/key-utils";

export default function AdminPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [additionals, setAdditionals] = useState<Additional[]>([])
  const [additionalCategories, setAdditionalCategories] = useState<AdditionalCategory[]>([])
  const [additionalsByCategory, setAdditionalsByCategory] = useState<{[key: number]: Additional[]}>({})
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdditionalsModalOpen, setIsAdditionalsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteStatus, setDeleteStatus] = useState<{ id: number; status: "pending" | "success" | "error" } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Função para carregar produtos, categorias e adicionais
  const loadData = async () => {
    try {
      setIsLoading(true)
      const [productsList, categoriesList, additionalsList, additionalCategoriesList] = await Promise.all([
        getAllProducts(),
        getAllCategories(),
        getAllAdditionals(),
        AdditionalCategoryService.getAllAdditionalCategories()
      ])
      console.log("Produtos carregados no admin:", productsList.length)
      console.log("Categorias carregadas no admin:", categoriesList.length)
      console.log("Adicionais carregados no admin:", additionalsList.length)
      console.log("Categorias de adicionais carregadas no admin:", additionalCategoriesList.length)
      
      // Associar o nome da categoria a cada adicional
      const additionalsWithCategoryName = additionalsList.map(additional => {
        const category = additionalCategoriesList.find(cat => cat.id === additional.categoryId);
        return {
          ...additional,
          categoryName: category ? category.name : "Sem categoria",
          categoryOrder: category ? category.order : 999 // Usar um valor alto para itens sem categoria
        };
      });
      
      // Ordenar adicionais por ordem de categoria e depois por nome
      const sortedAdditionals = [...additionalsWithCategoryName].sort((a, b) => {
        // Primeiro ordenar por ordem de categoria
        if (a.categoryOrder !== b.categoryOrder) {
          return a.categoryOrder - b.categoryOrder;
        }
        // Se mesma categoria, ordenar por nome
        return a.name.localeCompare(b.name);
      });
      
      setProducts(productsList)
      setCategories(categoriesList)
      setAdditionals(sortedAdditionals)
      setAdditionalCategories(additionalCategoriesList)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar autenticação e carregar produtos na montagem do componente
  useEffect(() => {
    // Verificar se o usuário está autenticado
    const isAuthenticated = localStorage.getItem("admin_authenticated") === "true"
    
    if (!isAuthenticated) {
      // Redirecionar para a página de login se não estiver autenticado
      window.location.href = "/admin/login"
      return
    }
    
    // Se estiver autenticado, carregar os dados
    setIsAuthenticated(true)
    loadData()
  }, [])

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product })
    setIsModalOpen(true)
  }

  // Modificar a função handleAddProduct para usar um ID seguro em vez de Date.now()

  const handleAddProduct = () => {
    // Usar a primeira categoria disponível como padrão
    const defaultCategoryId = categories.length > 0 ? categories[0].id : 1

    setEditingProduct({
      id: Math.floor(Math.random() * 1000000) + 1, // Gerar um ID seguro dentro do intervalo do PostgreSQL
      name: "",
      description: "",
      image: "/placeholder.svg?key=5xlcq",
      sizes: [
        { size: "300ml", price: 0 },
      ],
      categoryId: defaultCategoryId,
      allowedAdditionals: [], // Inicialmente sem adicionais permitidos
      active: true, // Adicionar a propriedade active que estava faltando
    })
    setIsModalOpen(true)
  }

  const handleDeleteProduct = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        setDeleteStatus({ id, status: "pending" })
        await deleteProduct(id)

        // Verificar se o produto foi realmente excluído
        const updatedProducts = await getAllProducts()
        const stillExists = updatedProducts.some((p) => p.id === id)

        if (stillExists) {
          console.error(`Produto com ID ${id} ainda existe após tentativa de exclusão`)
          setDeleteStatus({ id, status: "error" })
          alert("Erro ao excluir produto. O produto ainda existe no banco de dados.")
        } else {
          setProducts(updatedProducts)
          setDeleteStatus({ id, status: "success" })
          console.log(`Produto com ID ${id} excluído com sucesso`)
        }
      } catch (error) {
        console.error("Erro ao excluir produto:", error)
        setDeleteStatus({ id, status: "error" })
        alert("Erro ao excluir produto. Tente novamente.")
      }
    }
  }

  const handleSaveProduct = async () => {
    if (!editingProduct) return

    if (!editingProduct.name) {
      alert("O nome do produto é obrigatório")
      return
    }

    try {
      await saveProduct(editingProduct)

      // Atualizar a lista de produtos após salvar
      const updatedProducts = await getAllProducts()
      setProducts(updatedProducts)
      setIsModalOpen(false)
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      alert("Erro ao salvar produto. Tente novamente.")
    }
  }

  const handleSizeChange = (index: number, field: string, value: string) => {
    if (!editingProduct) return;
    
    const updatedSizes = [...editingProduct.sizes];
    if (field === "size") {
      updatedSizes[index].size = value;
    } else if (field === "price") {
      updatedSizes[index].price = parseFloat(value) || 0;
    }
    setEditingProduct({ ...editingProduct, sizes: updatedSizes });
  };

  // Função para adicionar um novo tamanho
  const handleAddSize = () => {
    if (!editingProduct) return;
    
    const updatedSizes = [...editingProduct.sizes, { size: "", price: 0 }];
    setEditingProduct({ ...editingProduct, sizes: updatedSizes });
  };

  // Função para remover um tamanho
  const handleRemoveSize = (index: number) => {
    if (!editingProduct) return;
    
    // Não permitir remover se só houver um tamanho
    if (editingProduct.sizes.length <= 1) {
      return;
    }
    
    const updatedSizes = editingProduct.sizes.filter((_, i) => i !== index);
    setEditingProduct({ ...editingProduct, sizes: updatedSizes });
  };

  // Função para abrir o modal de seleção de adicionais
  const handleManageAdditionals = () => {
    // Agrupar adicionais por categoria
    const groupedAdditionals: {[key: number]: Additional[]} = {};
    
    // Primeiro, garantir que todas as categorias tenham uma entrada, mesmo que vazia
    additionalCategories.forEach(category => {
      groupedAdditionals[category.id] = [];
    });
    
    // Adicionar categoria "Sem categoria" com ID 0 se houver adicionais sem categoria
    if (additionals.some(add => !add.categoryId)) {
      groupedAdditionals[0] = [];
    }
    
    // Agrupar os adicionais por categoria
    additionals.forEach(additional => {
      const categoryId = additional.categoryId || 0;
      if (!groupedAdditionals[categoryId]) {
        groupedAdditionals[categoryId] = [];
      }
      groupedAdditionals[categoryId].push(additional);
    });
    
    setAdditionalsByCategory(groupedAdditionals);
    setIsAdditionalsModalOpen(true);
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
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
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
        <div className="container mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={loadData}
              className="bg-purple-800 text-white px-4 py-2 rounded-md font-medium flex items-center"
              title="Atualizar dados"
            >
              <RefreshCw size={18} className="mr-1" />
              Atualizar
            </button>
            <button
              onClick={handleAddProduct}
              className="bg-white text-purple-900 px-4 py-2 rounded-md font-medium flex items-center"
            >
              <Plus size={18} className="mr-1" />
              Novo Produto
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("admin_authenticated")
                window.location.href = "/admin/login"
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md font-medium flex items-center"
              title="Sair do painel"
            >
              <ArrowLeft size={18} className="mr-1" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        {/* Cards de navegação */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Link
            href="/admin/pedidos"
            className="bg-white rounded-lg shadow-md p-6 flex items-center hover:bg-purple-50 transition-colors"
          >
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <ShoppingBag size={24} className="text-purple-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-purple-900">Gerenciar Pedidos</h2>
              <p className="text-gray-600">Visualize, atualize status e imprima etiquetas</p>
            </div>
          </Link>

          <Link
            href="/admin/carrossel"
            className="bg-white rounded-lg shadow-md p-6 flex items-center hover:bg-purple-50 transition-colors"
          >
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <ImageIcon size={24} className="text-purple-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-purple-900">Gerenciar Carrossel</h2>
              <p className="text-gray-600">Adicione e edite imagens do carrossel da página inicial</p>
            </div>
          </Link>

          <Link
            href="/admin/categorias"
            className="bg-white rounded-lg shadow-md p-6 flex items-center hover:bg-purple-50 transition-colors"
          >
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <Layers size={24} className="text-purple-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-purple-900">Gerenciar Categorias</h2>
              <p className="text-gray-600">Organize seus produtos em categorias</p>
            </div>
          </Link>

          <Link
            href="/admin/adicionais"
            className="bg-white rounded-lg shadow-md p-6 flex items-center hover:bg-purple-50 transition-colors"
          >
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <PlusCircle size={24} className="text-purple-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-purple-900">Gerenciar Adicionais</h2>
              <p className="text-gray-600">Configure adicionais para os açaís</p>
            </div>
          </Link>

          <Link
            href="/admin/frases"
            className="bg-white rounded-lg shadow-md p-6 flex items-center hover:bg-purple-50 transition-colors"
          >
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <MessageSquare size={24} className="text-purple-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-purple-900">Gerenciar Frases</h2>
              <p className="text-gray-600">Edite as frases promocionais do carrossel</p>
            </div>
          </Link>

          <Link
            href="/admin/notificacoes"
            className="bg-white rounded-lg shadow-md p-6 flex items-center hover:bg-purple-50 transition-colors"
          >
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700 transition-all duration-200" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-purple-900">Gerenciar Notificações</h2>
              <p className="text-gray-600">Configure avisos e notificações para os clientes</p>
            </div>
          </Link>

          <Link
            href="/admin/configuracoes"
            className="bg-white rounded-lg shadow-md p-6 flex items-center hover:bg-purple-50 transition-colors"
          >
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <Settings size={24} className="text-purple-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-purple-900">Configurações da Loja</h2>
              <p className="text-gray-600">Personalize o logo e o nome da sua loja</p>
            </div>
          </Link>

          <Link
            href="/admin/configuracoes/senha"
            className="bg-white rounded-lg shadow-md p-6 flex items-center hover:bg-purple-50 transition-colors"
          >
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-purple-700"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-purple-900">Configuração de Senha</h2>
              <p className="text-gray-600">Defina ou altere a senha do painel administrativo</p>
            </div>
          </Link>

          <Link
            href="/admin/horarios"
            className="bg-white rounded-lg shadow-md p-6 flex items-center hover:bg-purple-50 transition-colors"
          >
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <Clock size={24} className="text-purple-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-purple-900">Horários de Funcionamento</h2>
              <p className="text-gray-600">Gerencie os dias e horários de abertura da loja</p>
            </div>
          </Link>

          <Link
            href="/admin/paginas"
            className="bg-white rounded-lg shadow-md p-6 flex items-center hover:bg-purple-50 transition-colors"
          >
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-purple-700"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M10 13v-1h4v1" />
                <path d="M10 17v-1h4v1" />
                <path d="M10 9v1" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-purple-900">Gerenciar Páginas</h2>
              <p className="text-gray-600">Edite o conteúdo das páginas do site</p>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Gerenciar Produtos</h2>

          {products.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum produto cadastrado. Clique em "Novo Produto" para começar.
            </p>
          ) : (
            <div className="space-y-6">
              {/* Agrupar produtos por categoria */}
              {categories
                .sort((a, b) => a.order - b.order) // Ordenar categorias pela ordem definida
                .map((category) => {
                  // Filtrar produtos desta categoria
                  const categoryProducts = products.filter(product => product.categoryId === category.id);
                  
                  // Não mostrar categorias vazias
                  if (categoryProducts.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="mb-6">
                      <h3 className="text-md font-medium text-purple-800 mb-3 pb-1 border-b border-purple-200">
                        {category.name} <span className="text-xs text-gray-500">({categoryProducts.length} produtos)</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoryProducts.map((product) => (
                          <div key={product.id} className="border rounded-lg overflow-hidden flex flex-col sm:flex-row">
                            <div className="w-full sm:w-24 h-24 relative">
                              <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                            </div>
                            <div className="p-3 flex-1">
                              <div className="flex justify-between flex-wrap gap-2">
                                <div>
                                  <h3 className="font-semibold">{product.name}</h3>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                    Adicionais: {getAdditionalCount(product)}
                                  </span>
                                </div>
                                <div className="flex space-x-2">
                                  <button onClick={() => handleEditProduct(product)} className="text-blue-600 p-1">
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="text-red-600 p-1"
                                    disabled={deleteStatus?.id === product.id && deleteStatus.status === "pending"}
                                  >
                                    {deleteStatus?.id === product.id && deleteStatus.status === "pending" ? (
                                      <span className="animate-pulse">...</span>
                                    ) : (
                                      <Trash2 size={18} />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 line-clamp-1 mt-1">{product.description}</p>
                              <div className="mt-1 text-sm flex flex-wrap gap-2">
                                {product.sizes.map((size) => (
                                  <span key={size.size} className="mr-3">
                                    {size.size}: {formatCurrency(size.price)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-purple-900">
                {products.some((p) => p.id === editingProduct.id) ? "Editar Produto" : "Novo Produto"}
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

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Tamanhos e Preços</label>
                  <button 
                    type="button"
                    onClick={handleAddSize}
                    className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-md flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Adicionar Tamanho
                  </button>
                </div>

                {editingProduct.sizes.map((size, index) => (
                  <div key={createSafeKey(index, 'size-item')} className="flex items-center space-x-2 mb-2">
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
                    <button 
                      type="button"
                      onClick={() => handleRemoveSize(index)}
                      disabled={editingProduct.sizes.length <= 1}
                      className={`p-2 rounded-full ${editingProduct.sizes.length <= 1 ? 'bg-gray-100 text-gray-400' : 'bg-red-100 text-red-600'}`}
                      title="Remover tamanho"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {editingProduct.sizes.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Adicione pelo menos um tamanho para o produto.</p>
                )}
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
              <div className="flex flex-col space-y-2 mb-4">
                <div className="flex justify-between">
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
                <div className="text-xs text-gray-500 italic">
                  Cada adicional mostra a categoria a qual pertence
                </div>
              </div>

              {additionals.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Nenhum adicional cadastrado. Adicione adicionais na página de gerenciamento de adicionais.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Renderizar adicionais agrupados por categoria */}
                  {additionalCategories
                    .sort((a, b) => a.order - b.order)
                    .map((category) => {
                      // Obter adicionais desta categoria
                      const categoryAdditionals = additionalsByCategory[category.id] || [];
                      
                      // Não mostrar categorias vazias
                      if (categoryAdditionals.length === 0) return null;
                      
                      return (
                        <div key={createSafeKey(category.id, 'admin-additional-category')} className="mb-4">
                          <h3 className="text-md font-medium text-purple-800 mb-2 pb-1 border-b border-purple-200">
                            {category.name} <span className="text-xs text-gray-500">({categoryAdditionals.length})</span>
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {categoryAdditionals.map((additional, index) => (
                              <div
                                key={createSafeKey(additional.id, 'admin-additional-option', index)}
                                className={`flex items-center justify-between p-3 border rounded-md ${
                                  editingProduct.allowedAdditionals?.includes(additional.id) ? "border-purple-500 bg-purple-50" : "border-gray-200"
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
                                    <p className="text-sm text-purple-700">{additional.price > 0 ? formatCurrency(additional.price) : "Grátis"}</p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => toggleAdditionalSelection(additional.id)}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    editingProduct.allowedAdditionals?.includes(additional.id) ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-600"
                                  }`}
                                >
                                  {editingProduct.allowedAdditionals?.includes(additional.id) ? <Check size={16} /> : <Plus size={16} />}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    
                  {/* Renderizar adicionais sem categoria */}
                  {additionalsByCategory[0] && additionalsByCategory[0].length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-md font-medium text-gray-600 mb-2 pb-1 border-b border-gray-200">
                        Sem categoria <span className="text-xs text-gray-500">({additionalsByCategory[0].length})</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {additionalsByCategory[0].map((additional, index) => (
                          <div
                            key={createSafeKey(additional.id, 'admin-additional-option-no-category', index)}
                            className={`flex items-center justify-between p-3 border rounded-md ${
                              editingProduct.allowedAdditionals?.includes(additional.id) ? "border-purple-500 bg-purple-50" : "border-gray-200"
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
                                <p className="text-sm text-purple-700">{additional.price > 0 ? formatCurrency(additional.price) : "Grátis"}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => toggleAdditionalSelection(additional.id)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                editingProduct.allowedAdditionals?.includes(additional.id) ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {editingProduct.allowedAdditionals?.includes(additional.id) ? <Check size={16} /> : <Plus size={16} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
      
      {/* Botão de compartilhamento social para o PWA */}
      <SocialShare title="Heai Açaí e Sorvetes - Admin" message="Acesse o painel administrativo da Heai Açaí e Sorvetes!" />
    </div>
  )
}
