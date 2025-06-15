"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Check, Minus, Plus } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/utils"
import ImageViewer from "@/components/image-viewer"
import { getStoreStatus } from "@/lib/store-utils"
import type { Product } from "@/lib/services/product-service"

// Contexto e hooks personalizados
import { AdditionalsProvider } from "@/lib/contexts/additionals-context"
import { useAdditionalsLogic } from "@/lib/hooks/use-additionals-logic"

// Componentes modulares
import { ProductImage } from "@/components/product-card/product-image"
import { ProductInfo } from "@/components/product-card/product-info"
import { SizeSelector } from "@/components/product-card/size-selector"
import { AdditionalSelector } from "@/components/product-card/additional-selector"
import { AcaiPattern } from "@/components/ui/acai-pattern"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <AdditionalsProvider 
      maxAdditionalsLimit={999} // Não usar limite geral, apenas limites por tamanho
      productSizes={product.sizes}
    >
      <ProductCardContent product={product} />
    </AdditionalsProvider>
  )
}

function ProductCardContent({ product }: ProductCardProps) {
  // Estado local do componente
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [storeStatus, setStoreStatus] = useState({ isOpen: true, statusText: "", statusClass: "" })
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Acesso ao contexto do carrinho
  const { addToCart } = useCart()
  
  // Acesso ao contexto de adicionais (incluindo selectedSize e setSelectedSize)
  const { 
    selectedSize, 
    setSelectedSize,
    selectedAdditionals,
    additionalsTotalPrice,
    isDataLoaded,
    hasFreeAdditionals,
    selectedAdditionalsCount,
    reachedFreeAdditionalsLimit,
    reachedMaxAdditionalsLimit,
    setSelectedCategoryId,
    toggleAdditional,
    removeAdditional,
    resetAdditionalsBySize,
    loadAdditionalsData,
    isAdditionalSelected,
    maxAdditionalsPerSize,
    FREE_ADDITIONALS_LIMIT,
    SIZES_WITH_FREE_ADDITIONALS
  } = useAdditionalsLogic(product)

  // Efeito para selecionar automaticamente o primeiro tamanho disponível quando o produto for aberto
  useEffect(() => {
    if (product?.sizes?.length > 0 && !selectedSize) {
      // Seleciona o primeiro tamanho disponível
      setSelectedSize(product.sizes[0].size)
    }
    
    // Redefine a quantidade para 1 quando o produto for alterado
    setQuantity(1)
  }, [product?.id, product?.sizes, selectedSize, setSelectedSize])

  // Carregar status da loja quando o modal é aberto
  useEffect(() => {
    const loadStoreStatus = async () => {
      try {
        const status = await getStoreStatus()
        setStoreStatus(status)
      } catch (error) {
        console.error("Erro ao carregar status da loja:", error)
      }
    }

    if (isModalOpen) {
      loadStoreStatus()
    }
  }, [isModalOpen])

  // Informações do tamanho selecionado
  const selectedSizeInfo = selectedSize 
    ? product.sizes.find((s) => s.size === selectedSize)
    : product.sizes.length > 0 ? product.sizes[0] : undefined

  // Estado para controlar a quantidade do produto
  const [quantity, setQuantity] = useState(1)
  
  // Buscar configurações da loja para obter o limite de picolés
  const [maxPicolesPerOrder, setMaxPicolesPerOrder] = useState(20)

  useEffect(() => {
    // Função assíncrona para buscar as configurações da loja
    const fetchStoreConfig = async () => {
      try {
        const { getStoreConfig } = await import('@/lib/services/store-config-service')
        const config = await getStoreConfig()
        if (config?.maxPicolesPerOrder) {
          setMaxPicolesPerOrder(config.maxPicolesPerOrder)
        }
      } catch (error) {
        console.error('Erro ao buscar configurações da loja:', error)
      }
    }

    fetchStoreConfig()
  }, [])

  // Função para incrementar a quantidade
  const incrementQuantity = () => {
    setQuantity(prev => {
      // Se for um picolé, respeita o limite máximo
      if (isPicolé(product.categoryName)) {
        return Math.min(prev + 1, maxPicolesPerOrder)
      }
      // Para outros produtos, mantém o limite de 100
      return Math.min(prev + 1, 100)
    })
  }

  // Função para decrementar a quantidade
  const decrementQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1)) // Mínimo de 1 item
  }

  // Função para adicionar ao carrinho
  const handleAddToCart = () => {
    if (!selectedSize || !selectedSizeInfo) return
    
    // Preparar lista de adicionais para o carrinho
    const selectedAdditionalsArray = Object.values(selectedAdditionals).map(({ additional, quantity }) => ({
      id: additional.id,
      name: additional.name,
      price: additional.price,
      quantity,
      categoryId: additional.categoryId,
      categoryName: additional.categoryName,
      active: additional.active || true // Garantir que a propriedade active esteja presente
    }))
    
    // Criar objeto do item para adicionar ao carrinho
    const cartItem = {
      productId: product.id,
      name: product.name,
      price: selectedSizeInfo.price,
      image: product.image || "",
      size: selectedSize,
      quantity: product.categoryName?.includes("PICOLÉ") ? quantity : 1, // Usar quantidade para Picolé, senão 1
      additionals: selectedAdditionalsArray,
      originalPrice: selectedSizeInfo.price + additionalsTotalPrice,
      categoryName: product.categoryName
    }
    
    // Adicionar ao carrinho
    addToCart(cartItem)
    
    // Mostrar feedback visual
    setShowSuccess(true)
    const timer = setTimeout(() => {
      setShowSuccess(false)
    }, 2000)

    return () => clearTimeout(timer)
  }

  // Função para abrir o visualizador de imagem
  const handleOpenImageViewer = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsImageViewerOpen(true)
  }

  // Calcular o preço total
  const calculateTotal = () => {
    if (!selectedSizeInfo) return 0
    return selectedSizeInfo.price + additionalsTotalPrice
  }
  
  // Função para verificar se o produto é da categoria Picolé
  const isPicolé = (categoryName: string | null | undefined): boolean => {
    if (!categoryName) return false
    
    const picoléTerms = [
      "PICOLÉ", 
      "PICOLÉ AO LEITE", 
      "PICOLE", 
      "PICOLE AO LEITE", 
      "PICOLÉ AO LEITÉ", 
      "PICOLE AO LEITÉ"
    ]
    
    return picoléTerms.some(term => 
      categoryName.toUpperCase().includes(term)
    )
  }

  // Função para obter o texto do botão
  const getButtonText = () => {
    if (!storeStatus.isOpen) return "Loja fechada - Não é possível adicionar"
    if (!selectedSize || selectedSize === '') return "Selecione um tamanho"
    
    const total = calculateTotal()
    const isPicoléProduct = isPicolé(product.categoryName)
    const totalPrice = isPicoléProduct ? total * quantity : total
    
    if (isPicoléProduct && quantity > 1) {
      return `Adicionar ${quantity} un. • ${formatCurrency(totalPrice)}`
    }
    
    return `Adicionar ao Carrinho • ${formatCurrency(totalPrice)}`
  }

  return (
    <>
      <div 
        className="relative bg-gradient-to-br from-purple-50 via-white to-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        onClick={() => setIsModalOpen(true)}
        data-component-name="ProductCard"
      >
        {/* Padrão de açaí sutil no fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-white/80 to-white/80 rounded-xl z-0" />
        <AcaiPattern className="text-purple-200" />
        <div className="relative z-10">
        {/* Componente de imagem do produto */}
        <ProductImage 
          image={product.image || "/placeholder.svg"} 
          alt={product.name} 
          onOpenViewer={handleOpenImageViewer} 
          size="small" 
        />
        
          {/* Componente de informações do produto */}
          <ProductInfo product={product} />
        </div>
      </div>

      {/* Modal de detalhes do produto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-white rounded-xl" />
            <div className="relative z-10">
              <div className="flex justify-between items-center border-b sticky top-0 bg-white z-10">
                <h2 className="font-semibold text-lg sm:text-xl p-3 sm:p-4 break-words leading-tight">{product.name}</h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-gray-500 hover:text-gray-700 p-3 sm:p-4 flex-shrink-0"
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-3 sm:p-4">
                {/* Componente de imagem do produto */}
                <ProductImage 
                  image={product.image || "/placeholder.svg"} 
                  alt={product.name} 
                  onOpenViewer={handleOpenImageViewer} 
                  size="large" 
                />
                
                {/* Categoria e descrição */}
                {product.categoryName && (
                  <p className="text-sm text-purple-700 mb-1">{product.categoryName}</p>
                )}
                {product.description && (
                  <div className="text-gray-700 mb-4 border-b pb-4 text-sm sm:text-base leading-relaxed">
                    <p className="whitespace-pre-line break-words">{product.description}</p>
                  </div>
                )}
              
                {/* Componente de seleção de tamanho */}
                <SizeSelector 
                  sizes={product.sizes} 
                  selectedSize={selectedSize || ""} 
                  onSizeSelect={setSelectedSize} 
                />

                {/* Componentes de adicionais usando o contexto - não exibir para TOPS HEAI AÇAI COPO PRONTO */}
                {product.categoryName !== "TOPS HEAI AÇAI COPO PRONTO" && product.hasAdditionals && (
                  <>
                    <AdditionalSelector product={product} />
                  </>
                )}

                <div className="relative">
                  <div className={`flex items-center gap-4 mt-6 ${showSuccess ? 'opacity-0' : 'opacity-100'}`}>
                    {/* Seletor de quantidade apenas para as categorias de Picolé */}
                    {isPicolé(product.categoryName) && (
                      <div className="flex-shrink-0">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={decrementQuantity}
                            disabled={quantity <= 1}
                            className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-10 text-center font-medium">{quantity}</span>
                          <button
                            type="button"
                            onClick={incrementQuantity}
                            disabled={isPicolé(product.categoryName) ? quantity >= maxPicolesPerOrder : quantity >= 100}
                            className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Aumentar quantidade"
                            title={isPicolé(product.categoryName) && quantity >= maxPicolesPerOrder ? `Limite de ${maxPicolesPerOrder} itens atingido` : ''}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        {isPicolé(product.categoryName) && quantity >= maxPicolesPerOrder - 2 && (
                          <p className="text-xs text-center mt-1 text-amber-600">
                            {quantity >= maxPicolesPerOrder 
                              ? `Limite de ${maxPicolesPerOrder} itens atingido`
                              : `Restam ${maxPicolesPerOrder - quantity} itens disponíveis`}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={handleAddToCart}
                      className={`flex-1 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed`}
                      disabled={!storeStatus.isOpen || !selectedSize}
                    >
                      {getButtonText()}
                    </button>
                  </div>
                  
                  {showSuccess && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-lg mt-6">
                      <span className="text-white font-semibold flex items-center">
                        <Check className="mr-2" size={20} /> Adicionado ao carrinho!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualizador de imagem ampliada */}
      {isImageViewerOpen && (
        <ImageViewer
          imageUrl={product.image || "/placeholder.svg"}
          alt={product.name}
          onClose={() => setIsImageViewerOpen(false)}
        />
      )}

    </>
  )
}
