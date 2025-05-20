"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react"
import { useCart, CartProvider } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/utils"
import { getStoreConfig } from "@/lib/services/store-config-service"
import { getProductById } from "@/lib/services/product-service"
import type { Additional } from "@/lib/types"

// Componente para exibir um item com nome à esquerda e valor à direita
function ItemRow({ name, value, className }: { name: string; value: string; className?: string }) {
  return (
    <div className={`flex items-center w-full ${className || ''}`}>
      <div className="flex-grow">{name}</div>
      <div className="flex-shrink-0 w-20 text-right tabular-nums bg-gradient-to-r from-green-500 to-green-700 text-transparent bg-clip-text font-bold" data-component-name="ItemRow">{value}</div>
    </div>
  )
}

// Componente interno que usa o hook useCart
function CartPageContent() {
  const { cart, removeFromCart, updateQuantity, isLoading } = useCart()
  const router = useRouter()
  const [deliveryFee, setDeliveryFee] = useState(5.0)
  const [isUpdating, setIsUpdating] = useState<Record<number, boolean>>({})
  const [productCategories, setProductCategories] = useState<Record<number, string>>({})

  // Calcular subtotal e total
  const subtotal = cart.reduce((sum, item) => {
    // Usar o preço original (já com adicionais) se disponível, senão calcular
    if (item.originalPrice) {
      return sum + (item.originalPrice * item.quantity)
    }
    
    // Cálculo para compatibilidade com itens antigos
    const itemTotal = item.price * item.quantity
    const additionalsTotal = (item.additionals || []).reduce(
      (sum, additional) => sum + additional.price * (additional.quantity || 1), 
      0
    )
    
    return sum + (itemTotal + additionalsTotal)
  }, 0)
  const total = subtotal + deliveryFee

  // Carregar taxa de entrega da configuração da loja
  useEffect(() => {
    const loadDeliveryFee = async () => {
      try {
        const storeConfig = await getStoreConfig()
        if (storeConfig && storeConfig.deliveryFee !== undefined) {
          setDeliveryFee(storeConfig.deliveryFee)
        }
      } catch (error) {
        console.error("Erro ao carregar taxa de entrega:", error)
      }
    }

    loadDeliveryFee()
  }, [])
  
  // Carregar categorias dos produtos no carrinho
  useEffect(() => {
    const loadProductCategories = async () => {
      const categories: Record<number, string> = {}
      
      // Processar apenas produtos que não têm categoria definida
      const productsToLoad = cart.filter(item => !item.categoryName && item.productId)
      
      if (productsToLoad.length === 0) return
      
      try {
        // Buscar informações de categoria para cada produto
        for (const item of productsToLoad) {
          if (item.productId) {
            const product = await getProductById(item.productId)
            if (product && product.categoryName) {
              categories[item.id] = product.categoryName
            }
          }
        }
        
        setProductCategories(categories)
      } catch (error) {
        console.error("Erro ao carregar categorias dos produtos:", error)
      }
    }
    
    if (cart.length > 0) {
      loadProductCategories()
    }
  }, [cart])

  const handleQuantityChange = async (id: number, newQuantity: number) => {
    if (newQuantity < 1) return

    // Marcar este item como atualizando
    setIsUpdating((prev) => ({ ...prev, [id]: true }))

    try {
      await updateQuantity(id, newQuantity)
    } finally {
      // Desmarcar este item como atualizando
      setIsUpdating((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleRemoveItem = async (id: number) => {
    await removeFromCart(id)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-gradient-to-r from-purple-800 to-purple-950 text-white p-4 sticky top-0 z-10 shadow-lg" data-component-name="CartPageContent">
          <div className="container mx-auto flex items-center">
            <Link href="/" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Carrinho</h1>
          </div>
        </header>
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-gradient-to-r from-purple-800 to-purple-950 text-white p-4 sticky top-0 z-10 shadow-lg" data-component-name="CartPageContent">
          <div className="container mx-auto flex items-center">
            <Link href="/" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Carrinho</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Seu carrinho está vazio</h2>
          <p className="text-gray-500 mb-6 text-center">Adicione alguns produtos antes de finalizar o pedido</p>
          <Link href="/">
            <button className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2 rounded-full">
              Ver produtos
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-purple-800 to-purple-950 text-white p-4 sticky top-0 z-10 shadow-lg" data-component-name="CartPageContent">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Carrinho</h1>
          </div>
          <div>
            <span className="text-sm bg-white text-purple-900 px-2 py-1 rounded-full">
              {cart.length} {cart.length === 1 ? "item" : "itens"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-3 sm:p-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <div className="p-3 sm:p-4 border-b">
            <h2 className="text-base sm:text-lg font-semibold text-purple-900">Itens do Carrinho</h2>
          </div>

          <ul className="divide-y divide-gray-200">
            {cart.map((item) => (
              <li key={`${item.id}`} className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start">
                  {/* Primeira linha: imagem e informações principais */}
                  <div className="flex w-full mb-3 sm:mb-0">
                    {item.image && (
                      <div className="w-16 h-16 sm:w-18 sm:h-18 relative flex-shrink-0 mr-3 sm:mr-4 rounded-md overflow-hidden">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="space-y-1">
                        {/* Nome do produto e preço base */}
                        <div className="flex flex-col">
                          {/* Categoria do produto */}
                          {(item.categoryName || productCategories[item.id]) && (
                            <span className="text-xs text-purple-600 font-medium mb-0.5">
                              {item.categoryName || productCategories[item.id]}
                            </span>
                          )}
                          
                          {/* Nome e preço do produto */}
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-sm sm:text-base truncate pr-2 leading-tight">
                              {item.quantity}x {item.name} <span className="text-xs text-gray-500 block sm:inline mt-0.5 sm:mt-0">({item.size})</span>
                            </span>
                            <span className="text-sm sm:text-base whitespace-nowrap ml-2 mt-0.5 bg-gradient-to-r from-green-500 to-green-700 text-transparent bg-clip-text font-bold" data-component-name="CartPageContent">{formatCurrency(item.price)}</span>
                          </div>
                        </div>
                        
                        {/* Lista de adicionais */}
                        {item.additionals && item.additionals.length > 0 && (
                          <div className="ml-2 sm:ml-4 mt-2">
                            {/* Agrupamento de adicionais por categoria */}
                            {(() => {
                              // Agrupar adicionais por categoria
                              const groupedByCategory: Record<string, Additional[]> = {};
                              
                              item.additionals.forEach((additional) => {
                                const categoryName = additional.categoryName || "Outros";
                                if (!groupedByCategory[categoryName]) {
                                  groupedByCategory[categoryName] = [];
                                }
                                groupedByCategory[categoryName].push(additional);
                              });
                              
                              // Renderizar os grupos de categorias
                              return Object.entries(groupedByCategory).map(([categoryName, additionals]) => (
                                <div key={`${item.id}-${categoryName}`} className="mb-3">
                                  <div className="text-sm text-purple-600 font-medium mb-1">{categoryName}</div>
                                  <ul className="text-xs text-gray-600 space-y-1.5" data-component-name="CartPageContent">
                                    {additionals.map((additional, index) => (
                                      <li key={index} className="flex justify-between items-baseline" data-component-name="CartPageContent">
                                        <span className="truncate pr-2 leading-tight" data-component-name="CartPageContent">
                                          + {additional.quantity}x {additional.name}
                                        </span>
                                        <span className="whitespace-nowrap ml-1">{additional.price === 0 ? "Grátis" : `+ ${formatCurrency(additional.price * (additional.quantity || 1))}`}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                        
                        {/* Espaço para separação visual */}
                        <div className="mt-1"></div>
                      </div>
                    </div>
                  </div>

                  {/* Segunda linha: controles de quantidade e botão remover */}
                  <div className="flex justify-end items-center gap-2 mt-3 w-full">
                    {/* Controles de quantidade */}
                    <div className="flex" data-component-name="CartPageContent">
                      <div className="flex items-center bg-gray-50 border border-purple-200 rounded-full h-8 shadow-sm transition-all duration-200 hover:shadow-md touch-manipulation scale-90 origin-right" data-component-name="CartPageContent">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="px-1.5 py-0.5 text-purple-700 hover:bg-purple-100 h-full w-9 sm:w-8 flex items-center justify-center rounded-l-full transition-colors duration-200 active:bg-purple-200 touch-manipulation"
                          disabled={isUpdating[item.id]}
                          aria-label="Diminuir quantidade"
                          data-component-name="CartPageContent"
                        >
                          <Minus size={14} className={`${isUpdating[item.id] ? 'opacity-50' : ''}`} />
                        </button>
                        <div className="relative px-2 min-w-[2rem] text-center">
                          <span className="text-xs font-medium">{item.quantity}</span>
                          {isUpdating[item.id] && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="px-1.5 py-0.5 text-purple-700 hover:bg-purple-100 h-full w-9 sm:w-8 flex items-center justify-center rounded-r-full transition-colors duration-200 active:bg-purple-200 touch-manipulation"
                          disabled={isUpdating[item.id]}
                          aria-label="Aumentar quantidade"
                        >
                          <Plus size={14} className={`${isUpdating[item.id] ? 'opacity-50' : ''}`} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Botão remover */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className={`
                        group relative overflow-hidden text-red-500 flex items-center justify-center
                        bg-white border border-red-200 p-1.5 rounded-full shadow-sm
                        transition-all duration-300 hover:shadow-md hover:bg-red-50 hover:border-red-300
                        active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-opacity-50
                        touch-manipulation w-8 h-8 scale-90 origin-right
                        ${isUpdating[item.id] ? 'opacity-70 cursor-not-allowed' : ''}
                      `}
                      disabled={isUpdating[item.id]}
                      aria-label="Remover item"
                      data-component-name="CartPageContent"
                      title="Remover do carrinho"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        <Trash2 size={15} />
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 group-hover:opacity-20" data-component-name="CartPageContent"></span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-purple-900 mb-3 sm:mb-4">Resumo do Pedido</h2>

          <div className="space-y-3">
            <ItemRow name="Subtotal" value={formatCurrency(subtotal)} />
            <ItemRow name="Taxa de entrega" value={formatCurrency(deliveryFee)} />
            <div className="pt-3 mt-1 border-t">
              <ItemRow 
                name="Total" 
                value={formatCurrency(total)} 
                className="text-base sm:text-lg font-bold text-purple-900"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mt-6 mb-8 sm:mb-6">
          <Link href="/" className="sm:flex-1 order-2 sm:order-1">
            <button 
              className="
                w-full relative overflow-hidden group
                border-2 border-purple-700 text-purple-700 
                py-4 sm:py-3 px-4 rounded-xl sm:rounded-lg 
                font-semibold text-sm sm:text-base
                shadow-sm hover:shadow-md
                transition-all duration-300 ease-in-out
                hover:bg-purple-50 active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50
                touch-manipulation
              "
            >
              <span className="relative z-10 flex items-center justify-center">
                <ArrowLeft size={18} className="mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
                Continuar Comprando
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          </Link>
          <Link href="/checkout" className="sm:flex-1 order-1 sm:order-2">
            <button 
              className="
                w-full relative overflow-hidden group
                bg-gradient-to-r from-purple-600 to-purple-800 
                hover:from-purple-700 hover:to-purple-900 
                text-white py-4 sm:py-3 px-4 rounded-xl sm:rounded-lg 
                font-semibold text-sm sm:text-base
                shadow-md hover:shadow-lg
                transition-all duration-300 ease-in-out
                active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50
                touch-manipulation
              "
            >
              <span className="relative z-10 flex items-center justify-center">
                Finalizar Pedido
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent to-purple-950 opacity-0 group-hover:opacity-30 transition-opacity duration-300" data-component-name="CartPageContent"></span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Componente principal que envolve o conteúdo com CartProvider
export default function CartPage() {
  return (
    <CartProvider>
      <CartPageContent />
    </CartProvider>
  )
}


