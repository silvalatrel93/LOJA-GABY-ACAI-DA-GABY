"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ShoppingBag,
  RefreshCw,
  Download,
  Upload,
  ImageIcon,
  Layers,
  PlusCircle,
  Check,
  MessageSquare,
  Settings,
  Clock,
  Bell,
} from "lucide-react"
import {
  getAllProducts,
  getAllCategories,
  getAllAdditionals,
  saveProduct,
  deleteProduct,
  exportAllData,
  importData,
  backupData,
  restoreFromBackup,
  type Product,
  type Category,
  type Additional,
} from "@/lib/db"
import { formatCurrency } from "@/lib/utils"

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [additionals, setAdditionals] = useState<Additional[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdditionalsModalOpen, setIsAdditionalsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteStatus, setDeleteStatus] = useState<{ id: number; status: "pending" | "success" | "error" } | null>(null)
  const [backupStatus, setBackupStatus] = useState<"idle" | "backing-up" | "success" | "error">("idle")
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "restoring" | "success" | "error">("idle")
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null)
  const [isBackupSectionExpanded, setIsBackupSectionExpanded] = useState(false)

  // Função para carregar produtos, categorias e adicionais
  const loadData = async () => {
    try {
      setIsLoading(true)
      const [productsList, categoriesList, additionalsList] = await Promise.all([
        getAllProducts(),
        getAllCategories(),
        getAllAdditionals(),
      ])
      console.log("Produtos carregados no admin:", productsList.length)
      console.log("Categorias carregadas no admin:", categoriesList.length)
      console.log("Adicionais carregados no admin:", additionalsList.length)
      setProducts(productsList)
      setCategories(categoriesList)
      setAdditionals(additionalsList)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar produtos na montagem do componente
  useEffect(() => {
    loadData()

    // Verificar se existe data do último backup
    const backupDate = localStorage.getItem("acai_backup_date")
    if (backupDate) {
      setLastBackupDate(backupDate)
    }

    // Fazer backup automático a cada 5 minutos
    const backupInterval = setInterval(
      () => {
        backupData()
          .then(() => {
            setLastBackupDate(new Date().toISOString())
          })
          .catch(console.error)
      },
      5 * 60 * 1000,
    )

    return () => clearInterval(backupInterval)
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
        { size: "500ml", price: 0 },
        { size: "700ml", price: 0 },
      ],
      categoryId: defaultCategoryId,
      allowedAdditionals: [], // Inicialmente sem adicionais permitidos
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

          // Fazer backup após exclusão
          await backupData()
          setLastBackupDate(new Date().toISOString())
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

      // Fazer backup após salvar
      await backupData()
      setLastBackupDate(new Date().toISOString())
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

  // Função para fazer backup manual
  const handleBackup = async () => {
    try {
      setBackupStatus("backing-up")
      await backupData()
      setLastBackupDate(new Date().toISOString())
      setBackupStatus("success")

      setTimeout(() => {
        setBackupStatus("idle")
      }, 3000)
    } catch (error) {
      console.error("Erro ao fazer backup:", error)
      setBackupStatus("error")

      setTimeout(() => {
        setBackupStatus("idle")
      }, 3000)
    }
  }

  // Função para restaurar backup
  const handleRestore = async () => {
    if (confirm("Tem certeza que deseja restaurar o último backup? Isso substituirá todos os dados atuais.")) {
      try {
        setRestoreStatus("restoring")
        const success = await restoreFromBackup()

        if (success) {
          await loadData()
          setRestoreStatus("success")
        } else {
          setRestoreStatus("error")
          alert("Nenhum backup encontrado para restaurar.")
        }

        setTimeout(() => {
          setRestoreStatus("idle")
        }, 3000)
      } catch (error) {
        console.error("Erro ao restaurar backup:", error)
        setRestoreStatus("error")
        alert("Erro ao restaurar backup. Tente novamente.")

        setTimeout(() => {
          setRestoreStatus("idle")
        }, 3000)
      }
    }
  }

  // Função para exportar dados
  const handleExportData = async () => {
    try {
      const data = await exportAllData()
      const dataStr = JSON.stringify(data, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const a = document.createElement("a")
      a.href = url
      a.download = `acai-system-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao exportar dados:", error)
      alert("Erro ao exportar dados. Tente novamente.")
    }
  }

  // Função para importar dados
  const handleImportData = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json"

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const data = JSON.parse(event.target?.result as string)

            if (
              confirm(
                `Tem certeza que deseja importar ${data.products?.length || 0} produtos, ${data.categories?.length || 0} categorias e ${data.orders?.length || 0} pedidos? Isso substituirá todos os dados atuais.`,
              )
            ) {
              await importData(data)
              await loadData()
              alert("Dados importados com sucesso!")

              // Atualizar backup após importação
              await backupData()
              setLastBackupDate(new Date().toISOString())
            }
          } catch (error) {
            console.error("Erro ao processar arquivo:", error)
            alert("Erro ao processar arquivo. Verifique se é um arquivo JSON válido.")
          }
        }
        reader.readAsText(file)
      } catch (error) {
        console.error("Erro ao ler arquivo:", error)
        alert("Erro ao ler arquivo. Tente novamente.")
      }
    }

    input.click()
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
          <div className="flex space-x-2 flex-wrap gap-2">
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
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        {/* Seção de backup e restauração */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsBackupSectionExpanded(!isBackupSectionExpanded)}
          >
            <h2 className="text-lg font-semibold text-purple-900">Backup e Restauração</h2>
            <div className={`transition-transform duration-300 ${isBackupSectionExpanded ? "rotate-180" : ""}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-purple-700"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          {isBackupSectionExpanded && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-3">
                {lastBackupDate
                  ? `Último backup: ${new Date(lastBackupDate).toLocaleString()}`
                  : "Nenhum backup realizado ainda"}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleBackup}
                  disabled={backupStatus === "backing-up"}
                  className={`px-4 py-2 rounded-md text-white flex items-center ${
                    backupStatus === "backing-up"
                      ? "bg-gray-400"
                      : backupStatus === "success"
                        ? "bg-green-600"
                        : backupStatus === "error"
                          ? "bg-red-600"
                          : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {backupStatus === "backing-up" ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                      Salvando...
                    </>
                  ) : backupStatus === "success" ? (
                    "Backup Concluído!"
                  ) : backupStatus === "error" ? (
                    "Erro ao Fazer Backup"
                  ) : (
                    <>
                      <Save size={18} className="mr-1" />
                      Fazer Backup
                    </>
                  )}
                </button>

                <button
                  onClick={handleRestore}
                  disabled={restoreStatus === "restoring"}
                  className={`px-4 py-2 rounded-md text-white flex items-center ${
                    restoreStatus === "restoring"
                      ? "bg-gray-400"
                      : restoreStatus === "success"
                        ? "bg-green-600"
                        : restoreStatus === "error"
                          ? "bg-red-600"
                          : "bg-yellow-600 hover:bg-yellow-700"
                  }`}
                >
                  {restoreStatus === "restoring" ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                      Restaurando...
                    </>
                  ) : restoreStatus === "success" ? (
                    "Restauração Concluída!"
                  ) : restoreStatus === "error" ? (
                    "Erro ao Restaurar"
                  ) : (
                    <>
                      <RefreshCw size={18} className="mr-1" />
                      Restaurar Backup
                    </>
                  )}
                </button>

                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
                >
                  <Download size={18} className="mr-1" />
                  Exportar Dados
                </button>

                <button
                  onClick={handleImportData}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md flex items-center"
                >
                  <Upload size={18} className="mr-1" />
                  Importar Dados
                </button>
              </div>
            </div>
          )}
        </div>

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
              <Bell size={24} className="text-purple-700" />
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

          {/* Adicionar um novo card para a página de status */}
          <Link
            href="/admin/status"
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
                <path d="M20 7h-9"></path>
                <path d="M14 17H5"></path>
                <circle cx="17" cy="17" r="3"></circle>
                <circle cx="7" cy="7" r="3"></circle>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-purple-900">Status do Sistema</h2>
              <p className="text-gray-600">Verificar status do banco de dados e migração</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg overflow-hidden flex flex-col sm:flex-row">
                  <div className="w-full sm:w-24 h-24 relative">
                    <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                  </div>
                  <div className="p-3 flex-1">
                    <div className="flex justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          {getCategoryName(product.categoryId)}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full ml-1">
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
