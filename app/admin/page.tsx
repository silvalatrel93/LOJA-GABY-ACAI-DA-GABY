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
  const [searchTerm, setSearchTerm] = useState("")

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
      additionalsLimit: 5, // Limite padrão de 5 adicionais
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
    } else if (field === "additionalsLimit") {
      const numValue = parseInt(value) || undefined;
      updatedSizes[index].additionalsLimit = numValue && numValue > 0 ? numValue : undefined;
    }
    setEditingProduct({ ...editingProduct, sizes: updatedSizes });
  };

  // Função para adicionar um novo tamanho
  const handleAddSize = () => {
    if (!editingProduct) return;
    
    const updatedSizes = [...editingProduct.sizes, { size: "", price: 0, additionalsLimit: undefined }];
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
      <header className="bg-gradient-to-r from-purple-800 to-purple-900 text-white p-3 sm:p-4 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link 
                href="/" 
                className="p-1.5 rounded-full hover:bg-purple-700 transition-colors duration-200 flex-shrink-0"
                aria-label="Voltar para a página inicial"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap">
                Painel Administrativo
              </h1>
            </div>
            
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Botão Novo Produto */}
              <button
                onClick={handleAddProduct}
                className="flex-1 bg-white hover:bg-gray-50 text-purple-900 px-3 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Novo Produto</span>
                <span className="sm:hidden">Novo</span>
              </button>
              
              {/* Botão Sair */}
              <button
                onClick={() => {
                  localStorage.removeItem("admin_authenticated")
                  window.location.href = "/admin/login"
                }}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                title="Sair do painel"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-3 sm:p-4">
        {/* Cards de navegação */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Link
            href="/admin/pedidos"
            className="bg-white rounded-xl shadow-sm hover:shadow-md p-4 sm:p-5 flex items-center hover:bg-[#f0f7e6] transition-all duration-300 hover:translate-y-[-2px] group border border-transparent hover:border-[#e8f5d3]"
          >
            <div className="bg-[#e8f5d3] p-3 rounded-full mr-4 transition-all duration-300 group-hover:scale-110">
              <ShoppingBag size={22} className="text-[#5a7c1e]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#5a7c1e] mb-0.5">Gerenciar Pedidos</h2>
              <p className="text-sm text-gray-600">Visualize, atualize status e imprima etiquetas</p>
            </div>
          </Link>

          <Link
            href="/admin/carrossel"
            className="bg-white rounded-xl shadow-sm hover:shadow-md p-4 sm:p-5 flex items-center hover:bg-blue-50 transition-all duration-300 hover:translate-y-[-2px] group border border-transparent hover:border-blue-200"
          >
            <div className="bg-blue-100 p-3 rounded-full mr-4 transition-all duration-300 group-hover:scale-110">
              <ImageIcon size={22} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-600 mb-0.5">Gerenciar Carrossel</h2>
              <p className="text-sm text-gray-600">Adicione e edite imagens do carrossel da página inicial</p>
            </div>
          </Link>

          <Link
            href="/admin/categorias"
            className="bg-white rounded-xl shadow-sm hover:shadow-md p-4 sm:p-5 flex items-center hover:bg-orange-50 transition-all duration-300 hover:translate-y-[-2px] group border border-transparent hover:border-orange-200"
          >
            <div className="bg-orange-100 p-3 rounded-full mr-4 transition-all duration-300 group-hover:scale-110">
              <Layers size={22} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-orange-600 mb-0.5">Gerenciar Categorias</h2>
              <p className="text-sm text-gray-600">Organize seus produtos em categorias</p>
            </div>
          </Link>

          <Link
            href="/admin/adicionais"
            className="bg-white rounded-xl shadow-sm hover:shadow-md p-4 sm:p-5 flex items-center hover:bg-pink-50 transition-all duration-300 hover:translate-y-[-2px] group border border-transparent hover:border-pink-200"
          >
            <div className="bg-pink-100 p-3 rounded-full mr-4 transition-all duration-300 group-hover:scale-110">
              <PlusCircle size={22} className="text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-pink-600 mb-0.5">Gerenciar Adicionais</h2>
              <p className="text-sm text-gray-600">Configure adicionais para os açaís</p>
            </div>
          </Link>

          <Link
            href="/admin/frases"
            className="bg-white rounded-xl shadow-sm hover:shadow-md p-4 sm:p-5 flex items-center hover:bg-indigo-50 transition-all duration-300 hover:translate-y-[-2px] group border border-transparent hover:border-indigo-200"
          >
            <div className="bg-indigo-100 p-3 rounded-full mr-4 transition-all duration-300 group-hover:scale-110">
              <MessageSquare size={22} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-indigo-600 mb-0.5">Gerenciar Frases</h2>
              <p className="text-sm text-gray-600">Edite as frases promocionais do carrossel</p>
            </div>
          </Link>

          <Link
            href="/admin/notificacoes"
            className="bg-white rounded-xl shadow-sm hover:shadow-md p-4 sm:p-5 flex items-center hover:bg-red-50 transition-all duration-300 hover:translate-y-[-2px] group border border-transparent hover:border-red-200"
          >
            <div className="bg-red-100 p-3 rounded-full mr-4 transition-all duration-300 group-hover:scale-110">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 transition-all duration-200 group-hover:animate-[wiggle_0.5s_ease-in-out]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-600 mb-0.5">Gerenciar Notificações</h2>
              <p className="text-sm text-gray-600">Configure avisos e notificações para os clientes</p>
            </div>
          </Link>

          <Link
            href="/admin/configuracoes"
            className="bg-white rounded-xl shadow-sm hover:shadow-md p-4 sm:p-5 flex items-center hover:bg-teal-50 transition-all duration-300 hover:translate-y-[-2px] group border border-transparent hover:border-teal-200"
          >
            <div className="bg-teal-100 p-3 rounded-full mr-4 transition-all duration-300 group-hover:scale-110">
              <Settings size={22} className="text-teal-600 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-teal-600 mb-0.5">Configurações da Loja</h2>
              <p className="text-sm text-gray-600">Personalize o logo e o nome da sua loja</p>
            </div>
          </Link>

          <Link
            href="/admin/configuracoes/senha"
            className="bg-white rounded-xl shadow-sm hover:shadow-md p-4 sm:p-5 flex items-center hover:bg-gray-50 transition-all duration-300 hover:translate-y-[-2px] group border border-transparent hover:border-gray-200"
          >
            <div className="bg-gray-100 p-3 rounded-full mr-4 transition-all duration-300 group-hover:scale-110">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-600 mb-0.5">Configuração de Senha</h2>
              <p className="text-sm text-gray-600">Defina ou altere a senha do painel administrativo</p>
            </div>
          </Link>

          <Link
            href="/admin/horarios"
            className="bg-white rounded-xl shadow-sm hover:shadow-md p-4 sm:p-5 flex items-center hover:bg-amber-50 transition-all duration-300 hover:translate-y-[-2px] group border border-transparent hover:border-amber-200"
          >
            <div className="bg-amber-100 p-3 rounded-full mr-4 transition-all duration-300 group-hover:scale-110">
              <Clock size={22} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-amber-600 mb-0.5">Horários de Funcionamento</h2>
              <p className="text-sm text-gray-600">Configure os horários de funcionamento da loja</p>
            </div>
          </Link>

          <Link
            href="/admin/paginas"
            className="bg-white rounded-xl shadow-sm hover:shadow-md p-4 sm:p-5 flex items-center hover:bg-purple-50 transition-all duration-300 hover:translate-y-[-2px] group border border-transparent hover:border-purple-200"
          >
            <div className="bg-purple-100 p-3 rounded-full mr-4 transition-all duration-300 group-hover:scale-110">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
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
              <h2 className="text-lg font-semibold text-purple-700 mb-0.5">Gerenciar Páginas</h2>
              <p className="text-sm text-gray-600">Edite o conteúdo das páginas do site</p>
            </div>
          </Link>
        </div>

        <div className="bg-gradient-to-br from-white via-white to-purple-50 rounded-xl shadow-sm hover:shadow-lg p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 border border-transparent hover:border-purple-100/50 transition-all duration-500 relative overflow-hidden group/container">
          {/* Efeitos de fundo */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-[#92c730] rounded-t-xl group-hover/container:h-1.5 transition-all duration-500"></div>
          <div className="absolute -top-16 sm:-top-20 -right-16 sm:-right-20 w-32 sm:w-40 h-32 sm:h-40 bg-gradient-to-br from-purple-200/20 to-transparent rounded-full blur-xl sm:blur-2xl group-hover/container:scale-110 transition-transform duration-1000"></div>
          <div className="absolute -bottom-16 sm:-bottom-20 -left-16 sm:-left-20 w-32 sm:w-40 h-32 sm:h-40 bg-gradient-to-tr from-[#92c730]/10 to-transparent rounded-full blur-xl sm:blur-2xl group-hover/container:scale-110 transition-transform duration-1000 group-hover/container:rotate-12"></div>
          <div className="absolute top-1/2 -right-8 sm:right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-tl from-purple-100/5 to-transparent rounded-full blur-lg sm:blur-xl opacity-0 group-hover/container:opacity-100 transition-opacity duration-700 group-hover/container:translate-x-3 sm:group-hover/container:translate-x-6"></div>
          
          {/* Cabeçalho */}
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-purple-800 to-[#5a7c1e]">
                  Gerenciar Produtos
                </span>
              </h2>
              <div className="flex items-center bg-gradient-to-r from-purple-100 to-[#e8f5d3] text-xs sm:text-sm text-purple-800 px-3 py-1.5 rounded-full font-medium self-start sm:self-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 flex-shrink-0">
                  <path d="m7.5 4.27 9 5.15"></path>
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                  <path d="m3.3 7 8.7 5 8.7-5"></path>
                  <path d="M12 22V12"></path>
                </svg>
                <span>{products.length} {products.length === 1 ? 'produto' : 'produtos'}</span>
              </div>
            </div>
            <div className="w-full h-0.5 bg-gradient-to-r from-purple-100 via-[#e8f5d3] to-transparent mb-3 sm:mb-4"></div>
          
          {/* Barra de pesquisa */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
            <input 
              type="text" 
              className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-purple-200 rounded-lg bg-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-300" 
              placeholder="Pesquisar produtos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                onClick={() => setSearchTerm("")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          </div>

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
                  // Filtrar produtos desta categoria e aplicar filtro de pesquisa
                  const categoryProducts = products.filter(product => 
                    product.categoryId === category.id && 
                    (searchTerm === "" || 
                     product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                     product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     product.sizes.some(size => size.size.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                  );
                  
                  // Não mostrar categorias vazias
                  if (categoryProducts.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="mb-6">
                      <h3 className="text-lg font-medium mb-4 pb-2 flex items-center relative">
                        <span className="bg-gradient-to-r from-purple-400 to-[#92c730] w-1.5 h-6 rounded-full mr-3"></span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-[#5a7c1e] font-semibold">
                          {category.name}
                        </span> 
                        <span className="text-xs bg-gradient-to-r from-purple-50 to-[#f0f7e6] text-purple-700 px-2 py-0.5 rounded-full ml-2 font-normal border border-purple-100/30 shadow-sm">
                          {categoryProducts.length} {categoryProducts.length === 1 ? 'produto' : 'produtos'}
                        </span>
                        <div className="absolute -bottom-1 left-6 right-0 h-px bg-gradient-to-r from-purple-200/50 to-transparent"></div>
                      </h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        {categoryProducts.map((product) => (
                          <div 
                            key={product.id} 
                            className="border border-gray-100 rounded-xl overflow-hidden flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] group bg-white max-w-full"
                          >
                            <div className="w-full h-48 xs:h-40 sm:h-28 sm:w-28 md:w-32 md:h-32 lg:w-36 lg:h-36 relative overflow-hidden sm:rounded-l-xl rounded-t-xl sm:rounded-tr-none">
                              <Image 
                                src={product.image || "/placeholder.svg"} 
                                alt={product.name} 
                                fill 
                                sizes="(max-width: 480px) 100vw, (max-width: 640px) 40vw, (max-width: 768px) 28rem, (max-width: 1024px) 32rem, 36rem"
                                priority={true}
                                className="object-cover transition-transform duration-500 group-hover:scale-110" 
                                loading="eager"
                                onError={(e) => {
                                  // Fallback para imagem padrão em caso de erro
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder.svg';
                                }}
                              />
                              {!product.image && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                                </div>
                              )}
                            </div>
                            <div className="p-4 flex-1">
                              <div className="flex justify-between flex-wrap gap-2">
                                <div>
                                  <h3 className="font-semibold text-purple-900">{product.name}</h3>
                                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full inline-block mt-1 border border-blue-100">
                                    Adicionais: {getAdditionalCount(product)}
                                  </span>
                                </div>
                                <div className="flex space-x-1">
                                  <button 
                                    onClick={() => handleEditProduct(product)} 
                                    className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                    aria-label="Editar produto"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                    disabled={deleteStatus?.id === product.id && deleteStatus.status === "pending"}
                                    aria-label="Excluir produto"
                                  >
                                    {deleteStatus?.id === product.id && deleteStatus.status === "pending" ? (
                                      <span className="animate-pulse">...</span>
                                    ) : (
                                      <Trash2 size={18} />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 line-clamp-2 mt-2">{product.description}</p>
                              <div className="mt-2 text-sm flex flex-wrap gap-2">
                                {product.sizes.map((size) => (
                                  <span key={size.size} className="mr-3 bg-gray-50 px-2 py-1 rounded-md text-gray-700 border border-gray-100">
                                    {size.size}: <span className="font-medium text-purple-700">{formatCurrency(size.price)}</span>
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
                  <div key={createSafeKey(index, 'size-item')} className="border border-gray-200 rounded-lg p-3 mb-3 hover:border-purple-300 transition-colors">
                    <div className="flex flex-wrap md:flex-nowrap gap-3 items-center">
                      {/* Tamanho */}
                      <div className="w-full md:w-1/4 lg:w-1/5">
                        <label className="block text-xs text-gray-500 mb-1 font-medium">Tamanho</label>
                        <input
                          type="text"
                          value={size.size}
                          onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Ex: 500ml"
                        />
                      </div>
                      
                      {/* Preço */}
                      <div className="w-full md:w-1/4 lg:w-1/5">
                        <label className="block text-xs text-gray-500 mb-1 font-medium">Preço</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">R$</span>
                          </div>
                          <input
                            type="number"
                            value={size.price}
                            onChange={(e) => handleSizeChange(index, "price", e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="0,00"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                          />
                        </div>
                      </div>
                      
                      {/* Limite de adicionais */}
                      <div className="w-full md:w-1/3 lg:w-2/5">
                        <label className="block text-xs text-gray-500 mb-1 font-medium">Limite de adicionais</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={size.additionalsLimit || ''}
                            onChange={(e) => handleSizeChange(index, "additionalsLimit", e.target.value)}
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Vazio = sem limite"
                            min="0"
                            max="20"
                          />
                          <span className="text-xs whitespace-nowrap text-gray-500 hidden md:inline-block">
                            vazio = sem limite
                          </span>
                        </div>
                      </div>
                      
                      {/* Botão remover */}
                      <div className="w-auto md:w-auto flex items-end justify-end md:justify-center md:pb-0.5 md:ml-auto">
                        <button 
                          type="button"
                          onClick={() => handleRemoveSize(index)}
                          disabled={editingProduct.sizes.length <= 1}
                          className={`p-2 rounded-full transition-colors ${editingProduct.sizes.length <= 1 ? 'bg-gray-100 text-gray-400' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                          title="Remover tamanho"
                          aria-label="Remover tamanho"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Mensagem para telas pequenas */}
                    <div className="mt-1 md:hidden">
                      <span className="text-xs text-gray-500">
                        vazio = sem limite
                      </span>
                    </div>
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h4 className="text-sm font-medium text-blue-800">Sistema de Limites por Tamanho</h4>
                </div>
                <p className="text-xs text-blue-700">
                  Configure o limite de adicionais individualmente para cada tamanho acima. 
                  Deixe vazio para permitir adicionais ilimitados naquele tamanho.
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
