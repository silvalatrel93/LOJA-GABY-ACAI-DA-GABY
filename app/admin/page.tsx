"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import {
  getAllProducts,
  getAllCategories,
  getAllAdditionals,
  saveProduct,
  deleteProduct,
  type Product,
  type Category,
  type Additional,
} from "@/lib/db"
import ShareVitrineButton from "@/components/share-vitrine-button"

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [additionals, setAdditionals] = useState<Additional[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdditionalsModalOpen, setIsAdditionalsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteStatus, setDeleteStatus] = useState<{ id: number; status: "pending" | "success" | "error" } | null>(null)

  const menuItems = [
    { title: "Produtos", href: "/admin/produtos", icon: "🍨" },
    { title: "Categorias", href: "/admin/categorias", icon: "📋" },
    { title: "Adicionais", href: "/admin/adicionais", icon: "🍌" },
    { title: "Carrossel", href: "/admin/carrossel", icon: "🎠" },
    { title: "Frases", href: "/admin/frases", icon: "💬" },
    { title: "Pedidos", href: "/admin/pedidos", icon: "📦" },
    { title: "Horários", href: "/admin/horarios", icon: "🕒" },
    { title: "Notificações", href: "/admin/notificacoes", icon: "🔔" },
    { title: "Páginas", href: "/admin/paginas", icon: "📄" },
    { title: "Configurações", href: "/admin/configuracoes", icon: "⚙️" },
    { title: "Status", href: "/admin/status", icon: "📊" },
  ]

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
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-gray-600 mb-4">Gerencie sua loja de açaí</p>

        {/* Botão para compartilhar a vitrine */}
        <div className="mb-6">
          <ShareVitrineButton />
          <p className="text-sm text-gray-500 mt-2">
            Copie o link da vitrine para compartilhar no Instagram e outras redes sociais
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center transition-colors"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="font-medium">{item.title}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
