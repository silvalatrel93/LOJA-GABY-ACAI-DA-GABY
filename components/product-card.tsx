"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Maximize2, ChevronDown, ChevronUp, Filter, ShoppingCart, X, Check } from "lucide-react"
import { useCart } from "@/lib/cart-context"
// Importe a função cleanSizeDisplay
import { formatCurrency, cleanSizeDisplay } from "@/lib/utils"
import ImageViewer from "@/components/image-viewer"
import { getActiveAdditionalsByProduct, getActiveAdditionalsByProductGroupedByCategory } from "@/lib/db"
import { getStoreStatus } from "@/lib/store-utils"
import type { Product } from "@/lib/services/product-service"
import type { Additional } from "@/lib/services/additional-service"
import type { AdditionalCategory } from "@/lib/services/additional-category-service"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]?.size || "")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [additionals, setAdditionals] = useState<Additional[]>([])
  const [additionalsByCategory, setAdditionalsByCategory] = useState<{category: AdditionalCategory, additionals: Additional[]}[]>([])
  // Armazenar complementos premium selecionados para cada tamanho
  const [additionalsBySize, setAdditionalsBySize] = useState<{
    [size: string]: {
      [additionalId: number]: { additional: Additional; quantity: number }
    }
  }>({})  
  
  // Complementos Premium selecionados para o tamanho atual
  const selectedAdditionals = additionalsBySize[selectedSize] || {}
  // Adicionais sempre carregados e expandidos por padrão
  const [isAdditionalsExpanded, setIsAdditionalsExpanded] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [storeStatus, setStoreStatus] = useState({ isOpen: true, statusText: "", statusClass: "" })
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  
  // Constantes para limites de complementos premium gratuitos
  const FREE_ADDITIONALS_LIMIT = 5
  const SIZES_WITH_FREE_ADDITIONALS = ["1 Litro", "2 Litros", "2 Litro"]

  const selectedSizeInfo = product.sizes.find((s) => s.size === selectedSize)
  
  // Verificar se o tamanho selecionado tem direito a complementos premium gratuitos
  const hasFreeAdditionals = SIZES_WITH_FREE_ADDITIONALS.includes(selectedSize)
  
  // Contar quantos complementos premium foram selecionados para o tamanho atual
  const selectedAdditionalsCount = Object.keys(selectedAdditionals).length
  
  // Verificar se atingiu o limite de complementos premium gratuitos para o tamanho atual
  const reachedFreeAdditionalsLimit = hasFreeAdditionals && selectedAdditionalsCount >= FREE_ADDITIONALS_LIMIT

  // Resetar estados quando o modal é fechado
  useEffect(() => {
    if (!isModalOpen) {
      // Quando o modal é fechado, não precisamos fazer nada especial
      // pois os dados já estão pré-carregados
    }
  }, [isModalOpen])

  // Carregar complementos premium disponíveis quando o componente é montado
  useEffect(() => {
    const loadAdditionals = async () => {
      try {
        // Carregar complementos premium agrupados por categoria
        const [activeAdditionals, groupedAdditionals] = await Promise.all([
          getActiveAdditionalsByProduct(product.id),
          getActiveAdditionalsByProductGroupedByCategory(product.id)
        ])
        
        // Atualizar os estados com os dados carregados
        setAdditionals(activeAdditionals)
        setAdditionalsByCategory(groupedAdditionals)
        
        // Selecionar a primeira categoria por padrão se houver categorias
        if (groupedAdditionals.length > 0) {
          setSelectedCategoryId(groupedAdditionals[0].category.id)
        }
        
        // Marcar os dados como carregados
        setIsDataLoaded(true)
      } catch (error) {
        console.error("Erro ao carregar complementos premium:", error)
      }
    }
    
    // Carregar adicionais imediatamente quando o componente é montado
    loadAdditionals()
  }, [product.id])

  useEffect(() => {
    const loadStoreStatus = async () => {
      const status = await getStoreStatus()
      setStoreStatus(status)
    }

    loadStoreStatus()
  }, [])

  const handleAddToCart = () => {
    if (!selectedSize || !selectedSizeInfo) {
      return
    }

    // Preparar os complementos premium selecionados para o formato do carrinho
    const cartAdditionals: { id: number; name: string; price: number; categoryName?: string; quantity: number }[] = []

    // Para cada tamanho com complementos premium selecionados
    Object.entries(additionalsBySize).forEach(([size, sizeAdditionals]) => {
      // Encontrar o tamanho correspondente nos tamanhos do produto
      const sizeInfo = product.sizes.find(s => s.size === size)
      if (!sizeInfo) return // Se o tamanho não for encontrado, pular

      // Calcular o preço total dos complementos premium
      const additionalsPriceForSize = Object.values(sizeAdditionals).reduce(
        (sum, { additional, quantity }) => sum + additional.price * quantity,
        0
      )

      // Calcular o preço base para este tamanho
      const basePrice = sizeInfo.price

      // Converter os complementos premium selecionados para o formato do carrinho
      const additionals = Object.values(sizeAdditionals).map(({ additional, quantity }) => ({
        id: additional.id,
        name: additional.name,
        price: additional.price,
        categoryName: additional.categoryName,
        quantity
      }))

      // Adicionar ao carrinho
      addToCart({
        productId: product.id,
        name: product.name,
        price: basePrice,
        size: size,
        image: product.image || "",
        quantity: 1,
        additionals,
        additionalsTotalPrice: additionalsPriceForSize,
        categoryName: product.categoryName
      })
    })

    // Se não houver complementos premium selecionados, adicionar apenas o produto com o tamanho selecionado
    if (Object.keys(additionalsBySize).length === 0) {
      addToCart({
        productId: product.id,
        name: product.name,
        price: selectedSizeInfo.price,
        size: selectedSize,
        image: product.image || "",
        quantity: 1,
        additionals: [],
        additionalsTotalPrice: 0,
        categoryName: product.categoryName
      })
    }

    // Fechar o modal após adicionar ao carrinho
    setIsModalOpen(false)
  }

  // Função para abrir o visualizador de imagem
  const handleOpenImageViewer = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsImageViewerOpen(true)
  }

  // Função para alternar a seleção de um adicional (selecionar ou remover)
  const toggleAdditional = (additional: Additional) => {
    // Verificar se este adicional já está selecionado para o tamanho atual
    const isSelected = !!selectedAdditionals[additional.id]
    
    // Se estiver selecionado, remover
    if (isSelected) {
      setAdditionalsBySize(prev => {
        const newState = { ...prev }
        const newSizeAdditionals = { ...newState[selectedSize] }
        delete newSizeAdditionals[additional.id]
        
        // Se não houver mais complementos premium para este tamanho, remover o tamanho
        if (Object.keys(newSizeAdditionals).length === 0) {
          delete newState[selectedSize]
        } else {
          newState[selectedSize] = newSizeAdditionals
        }
        
        return newState
      })
    } 
    // Se não estiver selecionado e não atingiu o limite, adicionar
    else if (!hasFreeAdditionals || !reachedFreeAdditionalsLimit || additional.price > 0) {
      setAdditionalsBySize(prev => {
        const newState = { ...prev }
        if (!newState[selectedSize]) {
          newState[selectedSize] = {}
        }
        
        newState[selectedSize][additional.id] = { 
          additional, 
          quantity: 1 
        }
        
        return newState
      })
    }
  }

  // Função para remover um adicional
  const removeAdditional = (additionalId: number) => {
    setAdditionalsBySize(prev => {
      const newState = { ...prev }
      const newSizeAdditionals = { ...newState[selectedSize] }
      delete newSizeAdditionals[additionalId]
      
      // Se não houver mais complementos premium para este tamanho, remover o tamanho
      if (Object.keys(newSizeAdditionals).length === 0) {
        delete newState[selectedSize]
      } else {
        newState[selectedSize] = newSizeAdditionals
      }
      
      return newState
    })
  }

  // Calcular o preço total incluindo complementos premium para todos os tamanhos selecionados
  const calculateTotal = () => {
    let total = 0
    
    // Se não houver complementos premium, retornar apenas o preço do tamanho atual
    if (Object.keys(additionalsBySize).length === 0 && selectedSizeInfo) {
      return selectedSizeInfo.price
    }
    
    // Para cada tamanho com complementos premium selecionados
    Object.entries(additionalsBySize).forEach(([size, sizeAdditionals]) => {
      // Encontrar o tamanho correspondente nos tamanhos do produto
      const sizeInfo = product.sizes.find(s => s.size === size)
      if (!sizeInfo) return // Se o tamanho não for encontrado, pular
      
      // Calcular o preço total dos complementos premium
      const additionalsPriceForSize = Object.values(sizeAdditionals).reduce(
        (sum, { additional, quantity }) => sum + additional.price * quantity,
        0
      )
      
      // Adicionar o preço base para este tamanho
      const basePrice = sizeInfo.price
      
      // Adicionar ao total
      total += basePrice + additionalsPriceForSize
    })
    
    return total
  }

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-md overflow-hidden"
        onClick={() => setIsModalOpen(true)}
        data-component-name="ProductCard"
      >
        {/* Imagem do produto em tamanho reduzido */}
        <div className="relative h-36 group">
          <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          <button 
            onClick={handleOpenImageViewer} 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-70 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Maximize2 size={18} />
          </button>
        </div>
        
        {/* Informações do produto */}
        <div className="p-3">
          {product.categoryName && (
            <p className="text-xs bg-gradient-to-r from-purple-400 to-purple-700 text-transparent bg-clip-text font-medium mb-1" data-component-name="ProductCard">{product.categoryName}</p>
          )}
          <h3 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-purple-900 text-transparent bg-clip-text" data-component-name="ProductCard">{product.name}</h3>
          <p className="text-sm bg-gradient-to-r from-gray-800 to-black text-transparent bg-clip-text font-medium mt-1 line-clamp-2 md:line-clamp-3 hover:line-clamp-none transition-all duration-300" data-component-name="ProductCard">{product.description}</p>
          <div className="mt-2 flex justify-between items-center">
            <div className="font-medium" data-component-name="ProductCard">
              <span className="text-xs bg-gradient-to-r from-purple-600 to-purple-900 text-transparent bg-clip-text font-bold block">A PARTIR DE</span>
              <span className="bg-gradient-to-r from-green-500 to-green-700 text-transparent bg-clip-text font-bold">
                {formatCurrency(product.sizes[0]?.price || 0)}
              </span>
            </div>
            <button className="text-white bg-gradient-to-r from-purple-800 to-purple-950 hover:from-purple-700 hover:to-purple-900 flex items-center p-1.5 rounded-full shadow-md" data-component-name="ProductCard">
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de detalhes do produto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()} data-component-name="ProductCard">
            <div className="flex justify-between items-center border-b sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-xl p-4">{product.name}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 p-4">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              {/* Imagem do produto */}
              <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                <button 
                  onClick={handleOpenImageViewer} 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-60 p-2 rounded-full shadow-md hover:bg-opacity-80 transition-all"
                  data-component-name="ProductCard"
                >
                  <Maximize2 size={18} className="text-purple-700" />
                </button>
              </div>
              
              {/* Categoria e descrição */}
              {product.categoryName && (
                <p className="text-sm text-purple-700 mb-1">{product.categoryName}</p>
              )}
              <p className={`text-gray-700 mb-4 ${product.description ? 'border-b pb-4' : ''}`}>{product.description}</p>
              
              {/* Seleção de tamanho */}
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-2">Escolha o tamanho:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {product.sizes.map((sizeOption) => (
                    <button
                      key={sizeOption.size}
                      onClick={() => setSelectedSize(sizeOption.size)}
                      className={`border rounded-md flex flex-col items-center justify-center p-3 ${
                        selectedSize === sizeOption.size
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{cleanSizeDisplay(sizeOption.size)}</div>
                      <div className="text-sm bg-gradient-to-r from-green-500 to-green-700 text-transparent bg-clip-text font-bold" data-component-name="ProductCard">{formatCurrency(sizeOption.price)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seção de complementos premium - sempre exibida se houver complementos premium confirmados */}
              {additionalsByCategory.length > 0 && isDataLoaded && (
                <div className="mt-6">
                  <div className="flex items-center justify-between w-full text-left mb-3">
                    <h4 className="font-semibold text-gray-700">Complementos Premium (opcional):</h4>
                  </div>
                  <div className="mt-2">
                      <div className="space-y-4">
                        {/* Abas de categorias */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedCategoryId(null)}
                            className={`px-3 py-1 text-xs rounded-full ${selectedCategoryId === null
                              ? 'bg-purple-700 text-white'
                              : 'bg-gray-100 text-gray-700'}`}
                            data-component-name="ProductCard"
                          >
                            TODOS
                          </button>
                          {additionalsByCategory.map((group) => (
                            <button
                              key={group.category.id}
                              onClick={() => setSelectedCategoryId(group.category.id)}
                              className={`px-3 py-1 text-xs rounded-full ${selectedCategoryId === group.category.id
                                ? 'bg-purple-700 text-white'
                                : 'bg-gray-100 text-gray-700'}`}
                              data-component-name="ProductCard"
                            >
                              {group.category.name}
                            </button>
                          ))}
                        </div>
                        
                        {/* Lista de complementos premium filtrada por categoria */}
                        {/* Grid de 2 colunas para adicionais */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-component-name="ProductCard">
                          {(selectedCategoryId === null 
                            ? additionals // Mostrar todos os complementos premium
                            : (additionalsByCategory
                                .find(group => group.category.id === selectedCategoryId)?.additionals || [])
                          ).map((additional) => {
                            // Verificar se este adicional já foi selecionado
                            const isSelected = !!selectedAdditionals[additional.id];
                            // Botão de adicionar deve ser desabilitado se já atingiu o limite e este adicional não está selecionado
                            const isDisabled = hasFreeAdditionals && reachedFreeAdditionalsLimit && !isSelected;
                            
                            return (
                              <div key={additional.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50" data-component-name="ProductCard">
                                <div className="flex items-center flex-1 pr-2">
                                  <div className="w-8 h-8 relative mr-2 bg-purple-100 rounded-md overflow-hidden flex-shrink-0">
                                    {additional.image ? (
                                      <Image
                                        src={additional.image || "/placeholder.svg"}
                                        alt={additional.name}
                                        fill
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center h-full text-purple-300">
                                        <Plus size={14} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm bg-gradient-to-r from-gray-700 to-black text-transparent bg-clip-text" data-component-name="ProductCard">{additional.name}</p>
                                    <p className="text-xs bg-gradient-to-r from-green-500 to-green-700 text-transparent bg-clip-text font-bold" data-component-name="ProductCard">
                                      {additional.price > 0 ? formatCurrency(additional.price) : "Gratuito"}
                                    </p>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => toggleAdditional(additional)}
                                  disabled={!isSelected && isDisabled}
                                  className={`p-2 rounded-md flex items-center justify-center transition-colors shadow-sm ${
                                    isSelected 
                                      ? 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700' 
                                      : isDisabled 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-purple-400 to-purple-700 text-white hover:from-purple-500 hover:to-purple-800'
                                  }`}
                                  title={isDisabled && !isSelected ? `Limite de ${FREE_ADDITIONALS_LIMIT} complementos premium grátis atingido` : isSelected ? "Remover" : "Adicionar"}
                                  data-component-name="ProductCard"
                                >
                                  {isSelected ? (
                                    <Check size={18} className="text-green-700" />
                                  ) : (
                                    <ShoppingCart size={18} />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                  </div>
                </div>
              )}
              
              {/* Resumo dos complementos premium selecionados */}
              {Object.keys(additionalsBySize).length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded-md">
                  <h5 className="font-medium text-lg text-purple-900 mb-3">
                    Resumo dos complementos premium selecionados
                  </h5>
                  
                  {Object.keys(additionalsBySize).map(size => {
                    const sizeAdditionals = additionalsBySize[size] || {};
                    const additionalCount = Object.keys(sizeAdditionals).length;
                    
                    // Pular tamanhos sem complementos premium
                    if (additionalCount === 0) return null;
                    
                    const isFreeSize = SIZES_WITH_FREE_ADDITIONALS.includes(size);
                    const reachedLimit = isFreeSize && additionalCount >= FREE_ADDITIONALS_LIMIT;
                    
                    return (
                      <div key={size} className="mb-4">
                        <h6 className="font-medium text-sm text-purple-900 border-b pb-1 mb-2 flex justify-between">
                          <span>Tamanho: {size}</span>
                          {isFreeSize && (
                            <span className="text-xs text-purple-700">
                              ({additionalCount}/{FREE_ADDITIONALS_LIMIT} grátis)
                            </span>
                          )}
                        </h6>
                        
                        <ul className="space-y-1" data-component-name="ProductCard">
                          {/* Agrupar complementos premium por categoria */}
                          {(() => {
                            // Agrupar complementos premium por categoria
                            const groupedByCategory: Record<string, { additional: Additional; quantity: number }[]> = {};
                            
                            Object.values(sizeAdditionals).forEach(({ additional, quantity }) => {
                              const categoryName = additional.categoryName || "Outros";
                              if (!groupedByCategory[categoryName]) {
                                groupedByCategory[categoryName] = [];
                              }
                              groupedByCategory[categoryName].push({ additional, quantity });
                            });
                            
                            // Renderizar os grupos de categorias
                            return Object.entries(groupedByCategory).map(([categoryName, items]) => (
                              <div key={`${size}-${categoryName}`} className="mb-2">
                                <div className="text-xs font-medium text-purple-700 mb-1">{categoryName}</div>
                                {items.map(({ additional, quantity }) => (
                                  <li key={`${size}-${additional.id}`} className="flex justify-between text-sm">
                                    <span>
                                      {quantity}x {additional.name}
                                    </span>
                                    <span>{additional.price === 0 ? "Grátis" : formatCurrency(additional.price * quantity)}</span>
                                  </li>
                                ))}
                              </div>
                            ));
                          })()}
                        </ul>
                        
                        {isFreeSize && reachedLimit && (
                          <p className="text-xs text-purple-700 mt-1 font-medium">
                            Você atingiu o limite de {FREE_ADDITIONALS_LIMIT} complementos premium grátis para este tamanho.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={handleAddToCart}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3 rounded-lg font-semibold mt-6"
                disabled={!storeStatus.isOpen || !selectedSize}
              >
                {storeStatus.isOpen ? (
                  <>
                    Adicionar ao Carrinho • {formatCurrency(calculateTotal())}
                    {Object.keys(additionalsBySize).filter(size => 
                      Object.keys(additionalsBySize[size] || {}).length > 0
                    ).length > 1 && (
                      <div className="text-xs mt-1 font-normal">
                        (Total de {Object.keys(additionalsBySize).filter(size => 
                          Object.keys(additionalsBySize[size] || {}).length > 0
                        ).length} tamanhos com complementos premium)
                      </div>
                    )}
                  </>
                ) : (
                  "Loja fechada - Não é possível adicionar"
                )}
              </button>
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
