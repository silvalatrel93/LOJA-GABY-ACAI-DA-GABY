"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Check, Minus, Plus, CheckCircle, ShoppingCart, Loader2 } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/utils"
import ImageViewer from "@/components/image-viewer"
import { getStoreStatus } from "@/lib/store-utils"
import type { Product } from "@/lib/services/product-service"
import type { Additional } from "@/lib/types"

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
  priority?: boolean
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  return (
    <AdditionalsProvider
      maxAdditionalsLimit={999} // Não usar limite geral, apenas limites por tamanho
      productSizes={product.sizes}
    >
      <ProductCardContent product={product} priority={priority} />
    </AdditionalsProvider>
  )
}

function ProductCardContent({ product, priority = false }: ProductCardProps) {
  // Estado local do componente
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [storeStatus, setStoreStatus] = useState({ isOpen: true, statusText: "", statusClass: "" })
  const [showSuccess, setShowSuccess] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false) // Novo estado para loading
  const [needsSpoon, setNeedsSpoon] = useState<boolean | null>(null)
  const [spoonQuantity, setSpoonQuantity] = useState(1)

  // Estados específicos para COMBO 2 COPOS
  const [isCombo2Copos, setIsCombo2Copos] = useState(false)
  const [firstCupAdded, setFirstCupAdded] = useState(false)
  const [firstCupSize, setFirstCupSize] = useState<string>("")
  const [firstCupAdditionals, setFirstCupAdditionals] = useState<{
    [additionalId: number]: { additional: Additional; quantity: number }
  }>({})
  const [secondCupAdditionals, setSecondCupAdditionals] = useState<{
    [additionalId: number]: { additional: Additional; quantity: number }
  }>({})
  const [currentCupStep, setCurrentCupStep] = useState<"first" | "second">("first")

  // Acesso ao contexto do carrinho
  const { addToCart } = useCart()

  // Acesso ao contexto de adicionais
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

  // Efeito para detectar se é um produto combo (primeiro pago, segundo grátis)
  useEffect(() => {
    const productNameUpper = product.name.toUpperCase()
    const isCombo = productNameUpper.includes("COMBO 2 COPOS") ||
      productNameUpper.includes("2 MARMITA MINI")
    // Excluir especificamente o produto "2 Copos 300ml de açaí com: leite em pó + leite condensado."
    // que não deve ter sistema combo
    setIsCombo2Copos(isCombo)
    if (isCombo) {
      console.log("Produto combo detectado:", product.name)
    }
  }, [product.name])

  // Efeito para selecionar automaticamente o primeiro tamanho disponível quando o produto for aberto
  useEffect(() => {
    if (product?.sizes?.length > 0 && !selectedSize) {
      setSelectedSize(product.sizes[0].size)
    }
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

  // Buscar configurações da loja
  const [maxPicolesPerOrder, setMaxPicolesPerOrder] = useState(20)
  const [picoleDeliveryFee, setPicoleDeliveryFee] = useState(5.0)
  const [minimumPicoleOrder, setMinimumPicoleOrder] = useState(20.0)

  useEffect(() => {
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
      if (isPicolé(product.categoryName)) {
        return Math.min(prev + 1, maxPicolesPerOrder)
      }
      return Math.min(prev + 1, 100)
    })
  }

  // Função para decrementar a quantidade
  const decrementQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1))
  }

  // Função para adicionar ao carrinho com loading state
  const handleAddToCart = async () => {
    if (!selectedSize || !selectedSizeInfo) return

    setIsAddingToCart(true)

    try {
      // Simular um pequeno delay para mostrar o loading (opcional)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Lógica especial para produtos combo (primeiro pago, segundo grátis)
      if (isCombo2Copos) {
        if (currentCupStep === "first") {
          // Adicionar o primeiro copo (pago)
          const selectedAdditionalsArray = Object.values(selectedAdditionals).map(({ additional, quantity }) => ({
            id: additional.id,
            name: additional.name,
            price: additional.price,
            quantity,
            categoryId: additional.categoryId,
            categoryName: additional.categoryName,
            active: additional.active || true
          }))

          const firstCupItem = {
            productId: product.id,
            name: product.name,
            price: selectedSizeInfo.price,
            image: product.image || "",
            size: selectedSize,
            quantity: 1,
            additionals: selectedAdditionalsArray,
            originalPrice: selectedSizeInfo.price + additionalsTotalPrice,
            categoryName: product.categoryName,
            needsSpoon: needsSpoon === null ? undefined : needsSpoon,
            spoonQuantity: needsSpoon === true ? spoonQuantity : undefined
          }

          // Adicionar primeiro copo ao carrinho
          addToCart(firstCupItem)

          // Salvar dados do primeiro copo
          setFirstCupAdded(true)
          setFirstCupSize(selectedSize)
          setFirstCupAdditionals(selectedAdditionals)
          setCurrentCupStep("second")

          // Limpar seleções para o segundo copo
          resetAdditionalsBySize()

        } else if (currentCupStep === "second") {
          // Adicionar o segundo copo (grátis)
          const selectedAdditionalsArray = Object.values(selectedAdditionals).map(({ additional, quantity }) => ({
            id: additional.id,
            name: additional.name,
            price: additional.price,
            quantity,
            categoryId: additional.categoryId,
            categoryName: additional.categoryName,
            active: additional.active || true
          }))

          const secondCupItem = {
            productId: product.id,
            name: product.name,
            price: 0, // Segundo copo é grátis
            image: product.image || "",
            size: selectedSize,
            quantity: 1,
            additionals: selectedAdditionalsArray,
            originalPrice: additionalsTotalPrice, // Apenas o preço dos adicionais
            categoryName: product.categoryName,
            needsSpoon: needsSpoon === null ? undefined : needsSpoon,
            spoonQuantity: needsSpoon === true ? spoonQuantity : undefined
          }

          // Adicionar segundo copo ao carrinho
          addToCart(secondCupItem)

          // Resetar o combo para permitir nova compra
          setFirstCupAdded(false)
          setFirstCupSize("")
          setFirstCupAdditionals({})
          setSecondCupAdditionals({})
          setCurrentCupStep("first")
          resetAdditionalsBySize()

          // Fechar o modal
          setIsModalOpen(false)
        }
      } else {
        // Lógica normal para outros produtos
        const selectedAdditionalsArray = Object.values(selectedAdditionals).map(({ additional, quantity }) => ({
          id: additional.id,
          name: additional.name,
          price: additional.price,
          quantity,
          categoryId: additional.categoryId,
          categoryName: additional.categoryName,
          active: additional.active || true
        }))

        const cartItem = {
          productId: product.id,
          name: product.name,
          price: selectedSizeInfo.price,
          image: product.image || "",
          size: selectedSize,
          quantity: (isPicolé(product.categoryName) || isMoreninha(product.categoryName)) ? quantity : 1,
          additionals: selectedAdditionalsArray,
          originalPrice: selectedSizeInfo.price + additionalsTotalPrice,
          categoryName: product.categoryName,
          needsSpoon: needsSpoon === null ? undefined : needsSpoon,
          spoonQuantity: needsSpoon === true ? spoonQuantity : undefined
        }

        // Debug removido para limpar console

        addToCart(cartItem)
        resetAdditionalsBySize()
      }

      // Mostrar feedback visual
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
      }, 2000)

    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Função para abrir o visualizador de imagem
  const handleOpenImageViewer = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsImageViewerOpen(true)
  }

  // Função para calcular o total
  const calculateTotal = () => {
    const basePrice = Number(selectedSizeInfo?.price) || 0
    const additionalsPrice = Number(additionalsTotalPrice) || 0
    
    // Validar se os valores são números válidos
    if (isNaN(basePrice) || isNaN(additionalsPrice)) {
      console.warn('⚠️ Valores inválidos em calculateTotal:', {
        selectedSizeInfo: selectedSizeInfo,
        basePrice: basePrice,
        additionalsTotalPrice: additionalsTotalPrice,
        additionalsPrice: additionalsPrice
      })
      return 0
    }
    
    return basePrice + additionalsPrice
  }

  // Função para verificar se é picolé
  const isPicolé = (categoryName: string | null | undefined): boolean => {
    if (!categoryName) return false
    const picoleCategoryKeywords = [
      "picolé", "picole", "picolés", "picoles",
      "popsicle", "gelinho", "geladinho", "din din",
      "sacolé", "dindin"
    ]
    return picoleCategoryKeywords.some(keyword =>
      categoryName.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  // Função para verificar se é moreninha
  const isMoreninha = (categoryName: string | null | undefined): boolean => {
    if (!categoryName) return false
    return categoryName.toLowerCase().includes("moreninha")
  }

  // Função para gerar o texto do botão
  const getButtonText = () => {
    if (isAddingToCart) return "Adicionando..."
    if (!storeStatus.isOpen) return "Loja fechada - Não é possível adicionar"
    if (!selectedSize || selectedSize === '') return "Selecione um tamanho"
    if (product.needsSpoon && needsSpoon === undefined) return "Selecione se precisa de colher"

    const total = calculateTotal()
    const isPicoléProduct = isPicolé(product.categoryName)
    const isMoreninhaProduct = isMoreninha(product.categoryName)
    const hasQuantitySelector = isPicoléProduct || isMoreninhaProduct
    const totalPrice = hasQuantitySelector ? total * quantity : total

    // Texto especial para produtos combo (primeiro pago, segundo grátis)
    if (isCombo2Copos) {
      if (currentCupStep === "first") {
        return `Adicionar ao Carrinho • ${formatCurrency(totalPrice)}`
      } else if (currentCupStep === "second") {
        return `Adicionar ao Carrinho • ${formatCurrency(additionalsTotalPrice)}`
      }
    }

    if (hasQuantitySelector && quantity > 1) {
      return `Adicionar ${quantity} un. • ${formatCurrency(totalPrice)}`
    }

    return `Adicionar ao Carrinho • ${formatCurrency(totalPrice)}`
  }

  // Função para verificar se o botão deve estar desabilitado
  const isButtonDisabled = () => {
    return !storeStatus.isOpen ||
      !selectedSize ||
      (product.needsSpoon && needsSpoon === null) ||
      isAddingToCart
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
            priority={priority}
            loading={priority ? "eager" : "lazy"}
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
                    <p className="whitespace-pre-line break-words text-sm sm:text-base leading-snug sm:leading-normal">{product.description}</p>
                  </div>
                )}

                {/* Componente de seleção de tamanho */}
                <SizeSelector
                  sizes={product.sizes}
                  selectedSize={selectedSize || ""}
                  onSizeSelect={setSelectedSize}
                />


                {/* Opção de colher */}
                {product.needsSpoon && (
                  <div className="mt-3 sm:mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Precisa de colher? <span className="text-red-500">*</span>
                    </label>

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

                {/* Componentes de adicionais */}
                {product.categoryName !== "TOPS HEAI AÇAI COPO PRONTO" && product.hasAdditionals && (
                  <>
                    <AdditionalSelector product={product} />
                  </>
                )}

                <div className="relative">
                  <div className={`flex items-center gap-1.5 sm:gap-4 mt-3 sm:mt-6 transition-opacity duration-300 ${showSuccess ? 'opacity-0' : 'opacity-100'}`}>
                    {/* Seletor de quantidade */}
                    {(isPicolé(product.categoryName) || isMoreninha(product.categoryName)) && (
                      <div className="flex-shrink-0">
                        <div className="flex items-center border rounded-md overflow-hidden h-full">
                          <button
                            onClick={decrementQuantity}
                            disabled={quantity <= 1}
                            className="px-1.5 py-1.5 sm:px-2 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-2 sm:px-3 py-1 sm:py-2 text-center min-w-[30px] sm:min-w-[40px] text-xs sm:text-sm font-medium">{quantity}</span>
                          <button
                            onClick={incrementQuantity}
                            disabled={isPicolé(product.categoryName) ? quantity >= maxPicolesPerOrder : quantity >= 100}
                            className="px-1.5 py-1.5 sm:px-2 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            aria-label="Aumentar quantidade"
                            title={isPicolé(product.categoryName) && quantity >= maxPicolesPerOrder ? `Limite de ${maxPicolesPerOrder} itens atingido` : ''}
                          >
                            <Plus size={14} />
                          </button>
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

                    {/* Botão melhorado de adicionar ao carrinho */}
                    <button
                      onClick={handleAddToCart}
                      disabled={isButtonDisabled()}
                      className={`
                        flex-1 relative overflow-hidden
                        bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800
                        hover:from-purple-700 hover:via-purple-800 hover:to-purple-900
                        active:from-purple-800 active:via-purple-900 active:to-purple-950
                        text-white py-2.5 sm:py-3.5 px-3 sm:px-4 
                        rounded-lg sm:rounded-xl 
                        font-semibold text-sm sm:text-base
                        transition-all duration-300 ease-out
                        shadow-lg hover:shadow-xl hover:shadow-purple-500/25
                        transform hover:scale-[1.02] active:scale-[0.98]
                        disabled:opacity-60 disabled:cursor-not-allowed 
                        disabled:hover:scale-100 disabled:hover:shadow-lg
                        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                        group
                      `}
                      aria-label={getButtonText()}
                    >
                      {/* Gradiente animado de fundo */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-x" />

                      {/* Conteúdo do botão */}
                      <div className="relative flex items-center justify-center gap-2">
                        {isAddingToCart ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Adicionando...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} className="transition-transform duration-200 group-hover:scale-110" />
                            <span>{getButtonText()}</span>
                          </>
                        )}
                      </div>

                      {/* Efeito de brilho */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    </button>
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

                  {/* Feedback de sucesso melhorado */}
                  {showSuccess && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`
                        bg-gradient-to-r from-green-500 to-green-600 
                        text-white px-4 sm:px-6 py-2 sm:py-3 
                        rounded-lg shadow-lg 
                        transition-all duration-500 ease-out
                        ${showSuccess ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}
                      `}>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="animate-bounce" />
                          <span className="text-sm sm:text-base font-semibold">Adicionado ao carrinho!</span>
                        </div>
                      </div>
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
