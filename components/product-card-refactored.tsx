"use client"

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

// Componentes reutilizáveis
import { ProductCard as ProductCardUI } from "@/lib/components/ui/product-card"
import { Button } from "@/lib/components/ui/button"
import { Card } from "@/lib/components/ui/card"

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
  const [needsSpoon, setNeedsSpoon] = useState<boolean | null>(null) // Estado para controlar se precisa de colher
  const [spoonQuantity, setSpoonQuantity] = useState(1) // Estado para controlar a quantidade de colheres
  
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
  
  // Buscar configurações da loja para obter o limite de picolés e informações de taxa de entrega
  const [maxPicolesPerOrder, setMaxPicolesPerOrder] = useState(20)
  const [picoleDeliveryFee, setPicoleDeliveryFee] = useState(5.0)
  const [minimumPicoleOrder, setMinimumPicoleOrder] = useState(20.0)

  useEffect(() => {
    // Função assíncrona para buscar as configurações da loja
    const fetchStoreConfig = async () => {
      try {
        const { getStoreConfig } = await import('@/lib/services/store-config-service')
        const config = await getStoreConfig()
        if (config) {
          if (config.maxPicolesPerOrder) {
            setMaxPicolesPerOrder(config.maxPicolesPerOrder)
          }
          if (config.picoleDeliveryFee !== undefined) {
            setPicoleDeliveryFee(config.picoleDeliveryFee)
          }
          if (config.minimumPicoleOrder !== undefined) {
            setMinimumPicoleOrder(config.minimumPicoleOrder)
          }
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
      quantity: (isPicolé(product.categoryName) || isMoreninha(product.categoryName)) ? quantity : 1, // Usar quantidade para Picolé e Moreninha, senão 1
      additionals: selectedAdditionalsArray,
      originalPrice: selectedSizeInfo.price + additionalsTotalPrice,
      categoryName: product.categoryName,
      needsSpoon: needsSpoon === null ? undefined : needsSpoon, // Usar o estado local para determinar se precisa de colher
      spoonQuantity: needsSpoon === true ? spoonQuantity : undefined // Quantidade só é relevante se precisa de colher
    };
    
    // Adicionar ao carrinho
    addToCart(cartItem)
    
    // Limpar os adicionais selecionados para permitir nova seleção
    resetAdditionalsBySize()
    
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

  const isMoreninha = (categoryName: string | null | undefined): boolean => {
    if (!categoryName) return false
    
    return categoryName.toUpperCase().includes("MORENINHA")
  }

  // Função para obter o texto do botão
  const getButtonText = () => {
    if (!storeStatus.isOpen) return "Loja fechada - Não é possível adicionar"
    if (product.sizes.length > 0 && (!selectedSize || selectedSize === '')) return "Selecione um tamanho"
    if (product.needsSpoon && needsSpoon === null) return "Selecione se precisa de colher"
    
    const total = calculateTotal()
    const isPicoléProduct = isPicolé(product.categoryName)
    const isMoreninhaProduct = isMoreninha(product.categoryName)
    const hasQuantitySelector = isPicoléProduct || isMoreninhaProduct
    const totalPrice = hasQuantitySelector ? total * quantity : total
    
    if (hasQuantitySelector && quantity > 1) {
      return `Adicionar ${quantity} un. • ${formatCurrency(totalPrice)}`
    }
    
    return `Adicionar ao Carrinho • ${formatCurrency(totalPrice)}`
  }

  // Badges para o produto
  const getBadges = () => {
    const badges = []
    if (product.categoryName) {
      badges.push(product.categoryName)
    }
    return badges
  }

  return (
    <>
      {/* Card do produto usando o componente reutilizável */}
      <ProductCardUI
        title={product.name}
        description={product.description || ""}
        price={product.sizes[0]?.price || 0}
        image={product.image || "/placeholder.svg"}
        badges={getBadges()}
        onClick={() => setIsModalOpen(true)}
        showAddToCartButton={false}
        className="relative bg-gradient-to-br from-purple-50 via-white to-white"
      >
        {/* Padrão de açaí sutil no fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-white/80 to-white/80 rounded-lg z-0" />
        <AcaiPattern className="text-purple-200" />
      </ProductCardUI>

      {/* Modal de detalhes do produto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-50 bg-white">
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
                priority={true} // Prioridade para imagens no modal
                loading="eager"
              />
              
              {/* Categoria e descrição */}
              {product.categoryName && (
                <p className="text-sm text-purple-700 mb-1">{product.categoryName}</p>
              )}
              {product.description && (
                <div className="text-gray-700 mb-4 border-b pb-4 text-sm sm:text-base leading-relaxed">
                  <p className="whitespace-pre-line break-words text-sm sm:text-base leading-snug sm:leading-normal">{product.description}</p>
                </div>
              )}
            
              {/* Componente de seleção de tamanho */}
              <SizeSelector 
                sizes={product.sizes} 
                selectedSize={selectedSize || ""} 
                onSizeSelect={setSelectedSize} 
              />
              
              {/* Opção de colher - só exibe se o produto tiver a propriedade needsSpoon */}
              {product.needsSpoon && (
                <div className="mt-3 sm:mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Precisa de colher? <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Radio buttons para Sim/Não */}
                  <div className="flex items-center space-x-4 mb-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="needsSpoon"
                        value="yes"
                        checked={needsSpoon === true}
                        onChange={() => setNeedsSpoon(true)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Sim</span>
                    </label>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="needsSpoon"
                        value="no"
                        checked={needsSpoon === false}
                        onChange={() => setNeedsSpoon(false)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Não</span>
                    </label>
                  </div>

                  {/* Seletor de quantidade - só aparece se escolher "Sim" */}
                  {needsSpoon === true && (
                    <div className="mt-3">
                      <label className="block text-xs sm:text-sm text-gray-700 mb-2">Quantidade de colheres</label>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border rounded-md overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setSpoonQuantity(Math.max(1, spoonQuantity - 1))}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50"
                            disabled={spoonQuantity <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 py-1 text-center min-w-[40px] text-sm font-medium">{spoonQuantity}</span>
                          <button
                            type="button"
                            onClick={() => setSpoonQuantity(Math.min(10, spoonQuantity + 1))}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50"
                            disabled={spoonQuantity >= 10}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-xs text-green-600">
                          {spoonQuantity === 1 ? "1 colher" : `${spoonQuantity} colheres`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mensagem de aviso se não selecionou */}
                  {needsSpoon === null && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-xs text-red-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Por favor, selecione se precisa de colher para continuar
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Componentes de adicionais usando o contexto - não exibir para TOPS HEAI AÇAI COPO PRONTO */}
              {product.categoryName !== "TOPS HEAI AÇAI COPO PRONTO" && product.hasAdditionals && (
                <AdditionalSelector product={product} />
              )}

              <div className="relative">
                <div className={`flex items-center gap-1.5 sm:gap-4 mt-3 sm:mt-6 ${showSuccess ? 'opacity-0' : 'opacity-100'}`}>
                  {/* Seletor de quantidade para categorias de Picolé e Moreninha */}
                  {(isPicolé(product.categoryName) || isMoreninha(product.categoryName)) && (
                    <div className="flex-shrink-0">
                      <div className="flex items-center border rounded-md overflow-hidden h-full">
                        <Button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            decrementQuantity()
                          }}
                          disabled={quantity <= 1}
                          variant="ghost"
                          size="sm"
                          icon={<Minus size={14} />}
                          aria-label="Diminuir quantidade"
                        />
                        <span className="px-2 sm:px-3 py-1 sm:py-2 text-center min-w-[30px] sm:min-w-[40px] text-xs sm:text-sm font-medium">{quantity}</span>
                        <Button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            incrementQuantity()
                          }}
                          disabled={isPicolé(product.categoryName) ? quantity >= maxPicolesPerOrder : quantity >= 100}
                          variant="ghost"
                          size="sm"
                          icon={<Plus size={14} />}
                          aria-label="Aumentar quantidade"
                          title={isPicolé(product.categoryName) && quantity >= maxPicolesPerOrder ? `Limite de ${maxPicolesPerOrder} itens atingido` : ''}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Mensagem sobre limite de picolés */}
                  {isPicolé(product.categoryName) && quantity >= maxPicolesPerOrder - 2 && (
                    <p className="text-[9px] sm:text-xs absolute -top-4 left-0 text-amber-600 leading-tight">
                      {quantity >= maxPicolesPerOrder 
                        ? `Limite de ${maxPicolesPerOrder} itens atingido`
                        : `Restam ${maxPicolesPerOrder - quantity} itens disponíveis`}
                    </p>
                  )}
                  
                  <Button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      handleAddToCart()
                    }}
                    disabled={!storeStatus.isOpen || !selectedSize || (product.needsSpoon && needsSpoon === undefined)}
                    variant="primary"
                    size="lg"
                    className="flex-1"
                  >
                    {getButtonText()}
                  </Button>
                </div>
                
                {/* Mensagem sobre taxa de entrega para picolés */}
                {isPicolé(product.categoryName) && picoleDeliveryFee > 0 && (
                  <div className="mt-2 p-1 bg-amber-50 border border-amber-200 rounded-md max-w-full overflow-hidden">
                    <div className="flex flex-row items-start gap-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mt-0.5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1 text-[10px] leading-none">
                        <p className="text-amber-700 mb-0.5">
                          <span className="font-medium">Taxa: {formatCurrency(picoleDeliveryFee)}</span> para pedidos abaixo de {formatCurrency(minimumPicoleOrder)}
                        </p>
                        <p className="text-green-700 font-medium flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 mr-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Grátis a partir de {formatCurrency(minimumPicoleOrder)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {showSuccess && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`bg-green-100 text-green-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md shadow-md transition-all duration-300 ${showSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                      <div className="flex items-center">
                        <Check className="mr-1.5 sm:mr-2" size={16} />
                        <span className="text-sm sm:text-base">Adicionado ao carrinho!</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Visualizador de imagem ampliada */}
      {isImageViewerOpen && (
        <ImageViewer
          imageUrl={product.image || "/placeholder.svg"}
          alt={product.name}
          onClose={() => setIsImageViewerOpen(false)}
          storeColor={storeColor}
        />
      )}
    </>
  )
}
