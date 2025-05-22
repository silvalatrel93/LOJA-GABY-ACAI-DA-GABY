"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Check } from "lucide-react"
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
import { AdditionalSummary } from "@/components/product-card/additional-summary"
import { AcaiPattern } from "@/components/ui/acai-pattern"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  // Estado local do componente
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [storeStatus, setStoreStatus] = useState({ isOpen: true, statusText: "", statusClass: "" })
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Acesso ao contexto do carrinho
  const { addToCart } = useCart()
  
  // Acesso ao contexto de adicionais
  const { 
    selectedAdditionals, 
    additionalsTotalPrice 
  } = useAdditionalsLogic(product)

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
    : undefined

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
      size: selectedSize, // Agora temos certeza que não é null aqui
      quantity: 1,
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
  
  // Obter o texto do botão
  const getButtonText = () => {
    if (!storeStatus.isOpen) return "Loja fechada - Não é possível adicionar"
    if (!selectedSize || selectedSize === '') return "Selecione um tamanho"
    return `Adicionar ao Carrinho • ${formatCurrency(calculateTotal())}`
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-white rounded-xl" />
            <div className="relative z-10">
              <div className="flex justify-between items-center border-b sticky top-0 bg-white z-10">
                <h2 className="font-semibold text-xl p-4">{product.name}</h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-gray-500 hover:text-gray-700 p-4"
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>
              
              <AdditionalsProvider initialSize={selectedSize}>
                <div className="p-4">
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
                    <p className="text-gray-700 mb-4 border-b pb-4">{product.description}</p>
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
                      <AdditionalSummary />
                    </>
                  )}

                  <div className="relative">
                    <button
                      onClick={handleAddToCart}
                      className={`w-full bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 text-white py-3 rounded-lg font-semibold mt-6 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed ${
                        showSuccess ? 'opacity-0' : 'opacity-100'
                      }`}
                      disabled={!storeStatus.isOpen || !selectedSize}
                    >
                      {getButtonText()}
                    </button>
                    {showSuccess && (
                      <div className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-lg mt-6">
                        <span className="text-white font-semibold flex items-center">
                          <Check className="mr-2" size={20} /> Adicionado ao carrinho!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </AdditionalsProvider>
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
