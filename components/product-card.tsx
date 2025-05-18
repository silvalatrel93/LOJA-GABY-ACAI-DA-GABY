"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Maximize2, ChevronDown, ChevronUp, Filter, ShoppingCart, X } from "lucide-react"
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
  // Armazenar adicionais selecionados para cada tamanho
  const [additionalsBySize, setAdditionalsBySize] = useState<{
    [size: string]: {
      [additionalId: number]: { additional: Additional; quantity: number }
    }
  }>({})
  
  // Adicionais selecionados para o tamanho atual
  const selectedAdditionals = additionalsBySize[selectedSize] || {}
  const [isLoadingAdditionals, setIsLoadingAdditionals] = useState(false)
  const [isAdditionalsExpanded, setIsAdditionalsExpanded] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [storeStatus, setStoreStatus] = useState({ isOpen: true, statusText: "", statusClass: "" })
  
  // Constantes para limites de adicionais gratuitos
  const FREE_ADDITIONALS_LIMIT = 5
  const SIZES_WITH_FREE_ADDITIONALS = ["1 Litro", "2 Litros", "2 Litro"]

  const selectedSizeInfo = product.sizes.find((s) => s.size === selectedSize)
  
  // Verificar se o tamanho selecionado tem direito a adicionais gratuitos
  const hasFreeAdditionals = SIZES_WITH_FREE_ADDITIONALS.includes(selectedSize)
  
  // Contar quantos adicionais foram selecionados para o tamanho atual
  const selectedAdditionalsCount = Object.keys(selectedAdditionals).length
  
  // Verificar se atingiu o limite de adicionais gratuitos para o tamanho atual
  const reachedFreeAdditionalsLimit = hasFreeAdditionals && selectedAdditionalsCount >= FREE_ADDITIONALS_LIMIT

  // Resetar estados quando o modal é fechado
  useEffect(() => {
    if (!isModalOpen) {
      // Quando o modal é fechado, resetamos os estados relacionados aos adicionais
      setIsAdditionalsExpanded(false)
      setIsLoadingAdditionals(false)
    }
  }, [isModalOpen])

  // Carregar adicionais disponíveis
  useEffect(() => {
    if (isModalOpen) {
      const loadAdditionals = async () => {
        try {
          setIsLoadingAdditionals(true)
          // Carregar adicionais agrupados por categoria
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
          } else {
            // Se não houver categorias, não mostrar a seção expandida
            setIsAdditionalsExpanded(false)
          }
        } catch (error) {
          console.error("Erro ao carregar adicionais:", error)
          // Em caso de erro, não mostrar a seção expandida
          setIsAdditionalsExpanded(false)
        } finally {
          setIsLoadingAdditionals(false)
        }
      }

      loadAdditionals()
    }
  }, [isModalOpen, product.id])

  useEffect(() => {
    const loadStoreStatus = async () => {
      const status = await getStoreStatus()
      setStoreStatus(status)
    }

    loadStoreStatus()
  }, [])

  const handleAddToCart = async () => {
    if (!selectedSizeInfo) return
    
    // Verificar quais tamanhos têm adicionais selecionados
    const sizesWithAdditionals = Object.keys(additionalsBySize).filter(size => 
      Object.keys(additionalsBySize[size] || {}).length > 0
    );
    
    // Se não houver nenhum tamanho com adicionais, adicionar apenas o tamanho atual
    if (sizesWithAdditionals.length === 0) {
      sizesWithAdditionals.push(selectedSize);
    }
    
    // Adicionar cada tamanho selecionado ao carrinho
    for (const size of sizesWithAdditionals) {
      // Obter informações do tamanho
      const sizeInfo = product.sizes.find(s => s.size === size);
      if (!sizeInfo) continue; // Pular se o tamanho não for encontrado
      
      // Obter adicionais para este tamanho
      const sizeAdditionals = additionalsBySize[size] || {};
      
      // Converter os adicionais selecionados para o formato do carrinho
      const cartAdditionals = Object.values(sizeAdditionals).map(({ additional, quantity }) => ({
        ...additional,
        quantity,
      }));
      
      // Calcular o preço total dos adicionais
      const additionalsTotal = Object.values(sizeAdditionals).reduce(
        (sum, { additional, quantity }) => sum + additional.price * quantity,
        0,
      );
      
      // Preço base do produto para este tamanho
      const basePrice = sizeInfo.price;
      
      // Adicionar ao carrinho
      await addToCart({
        productId: product.id,
        name: product.name,
        price: basePrice,
        size: size,
        image: product.image || "",
        quantity: 1,
        additionals: cartAdditionals.length > 0 ? cartAdditionals : undefined,
        originalPrice: basePrice + additionalsTotal,
      });
    }
    
    setIsModalOpen(false);
    
    // Limpar todos os adicionais selecionados após adicionar ao carrinho
    setAdditionalsBySize({});
  }

  // Função para abrir o visualizador de imagem
  const handleOpenImageViewer = (e: React.MouseEvent) => {
    e.stopPropagation() // Impedir que o evento se propague para outros elementos
    setIsImageViewerOpen(true)
  }

  // Função para alternar a seleção de um adicional (selecionar ou remover)
  const toggleAdditional = (additional: Additional) => {
    setAdditionalsBySize((prev) => {
      // Criar um novo objeto para não modificar o estado diretamente
      const newState = { ...prev };
      
      // Garantir que existe um objeto para o tamanho selecionado
      if (!newState[selectedSize]) {
        newState[selectedSize] = {};
      }
      
      // Criar uma cópia dos adicionais do tamanho atual
      const newSelected = { ...newState[selectedSize] };
      
      // Se já está selecionado, remove o adicional
      if (newSelected[additional.id]) {
        delete newSelected[additional.id];
        newState[selectedSize] = newSelected;
        return newState;
      } 
      
      // Se não está selecionado, verifica se pode adicionar
      if (hasFreeAdditionals && selectedAdditionalsCount >= FREE_ADDITIONALS_LIMIT) {
        // Exibir mensagem informando o limite
        alert(`Você já selecionou o limite de ${FREE_ADDITIONALS_LIMIT} adicionais grátis para o tamanho ${selectedSize}!`);
        return prev; // Retorna o estado anterior sem mudanças
      }
      
      // Adiciona o adicional com quantidade 1
      newSelected[additional.id] = {
        additional,
        quantity: 1,
      }
      
      // Atualiza os adicionais para o tamanho atual
      newState[selectedSize] = newSelected;
      
      return newState;
    })
  }

  // Função para remover um adicional
  const removeAdditional = (additionalId: number) => {
    setAdditionalsBySize((prev) => {
      // Se não há adicionais para este tamanho, não faz nada
      if (!prev[selectedSize]) return prev;
      
      // Criar um novo objeto para não modificar o estado diretamente
      const newState = { ...prev };
      const newSelected = { ...newState[selectedSize] };
      
      // Remove o adicional
      delete newSelected[additionalId];
      
      // Atualiza os adicionais para o tamanho atual
      newState[selectedSize] = newSelected;
      
      return newState;
    })
  }

  // Calcular o preço total incluindo adicionais para todos os tamanhos selecionados
  const calculateTotal = () => {
    // Se não houver tamanhos com adicionais, retornar apenas o preço do tamanho atual
    const sizesWithAdditionals = Object.keys(additionalsBySize).filter(size => 
      Object.keys(additionalsBySize[size] || {}).length > 0
    );
    
    // Se não houver tamanhos com adicionais, usar apenas o tamanho atual
    if (sizesWithAdditionals.length === 0) {
      return selectedSizeInfo ? selectedSizeInfo.price : 0;
    }
    
    // Calcular o total para todos os tamanhos com adicionais
    let total = 0;
    
    // Adicionar o preço do tamanho atual se não tiver adicionais selecionados
    if (!sizesWithAdditionals.includes(selectedSize) && selectedSizeInfo) {
      total += selectedSizeInfo.price;
    }
    
    // Somar o preço de cada tamanho com seus adicionais
    for (const size of sizesWithAdditionals) {
      // Obter informações do tamanho
      const sizeInfo = product.sizes.find(s => s.size === size);
      if (!sizeInfo) continue; // Pular se o tamanho não for encontrado
      
      // Preço base do tamanho
      total += sizeInfo.price;
      
      // Somar o preço dos adicionais para este tamanho
      const sizeAdditionals = additionalsBySize[size] || {};
      const additionalsPriceForSize = Object.values(sizeAdditionals).reduce(
        (sum, { additional, quantity }) => sum + additional.price * quantity,
        0
      );
      
      total += additionalsPriceForSize;
    }
    
    return total;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Card com tamanho reduzido */}
        <div className="relative h-36 group">
          <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />

          {/* Botão de ampliar imagem */}
          <button
            onClick={handleOpenImageViewer}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-70 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            aria-label="Ampliar imagem"
          >
            <Maximize2 size={20} className="text-purple-900" />
          </button>

          {/* Overlay com gradiente na parte inferior */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black to-transparent opacity-60"></div>
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-purple-900 text-sm">{product.name}</h3>
          <p className="text-gray-600 text-xs mt-1 line-clamp-2">{product.description}</p>
          <div className="mt-2 flex justify-between items-center">
            <span className="font-bold text-purple-900 text-sm">
              A partir de {formatCurrency(product.sizes[0]?.price || 0)}
            </span>
            <button
              onClick={() => (storeStatus.isOpen ? setIsModalOpen(true) : null)}
              className={`${
                storeStatus.isOpen 
                  ? "bg-gradient-to-r from-purple-500 to-purple-800 hover:from-purple-600 hover:to-purple-900" 
                  : "bg-gray-400 cursor-not-allowed"
              } text-white p-1.5 rounded-full shadow-sm transition-all duration-200`}
              disabled={!storeStatus.isOpen}
              title={storeStatus.isOpen ? "Adicionar ao carrinho" : "Loja fechada"}
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de seleção de tamanho e adição ao carrinho */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="relative p-4 flex justify-between items-center border-b sticky top-0 bg-white z-10">
              <h3 className="font-bold text-xl text-purple-900">{product.name}</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  // Não limpar os adicionais ao fechar o modal
                }}
                className="bg-gradient-to-r from-purple-500 to-purple-800 hover:from-purple-600 hover:to-purple-900 text-white p-1.5 rounded-full shadow-sm transition-all duration-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4">
              <p className="text-gray-600 mt-2">{product.description}</p>

              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-2">Escolha o tamanho:</h4>
                <div className={`grid ${product.sizes.length === 2 ? 'grid-cols-2' : product.sizes.length === 1 ? 'grid-cols-1' : 'grid-cols-3'} gap-2`}>
                  {product.sizes.map((sizeOption) => (
                    <button
                      key={sizeOption.size}
                      onClick={() => {
                        // Ao mudar de tamanho, mantém os adicionais específicos de cada tamanho
                        setSelectedSize(sizeOption.size);
                        // Resetar a categoria selecionada ao mudar de tamanho
                        setSelectedCategoryId(null);
                      }}
                      className={`border rounded-md py-2 px-3 text-center ${selectedSize === sizeOption.size
                        ? 'bg-purple-100 border-purple-500 text-purple-900'
                        : 'border-gray-300 text-gray-700'}`}
                    >
                      <div className="font-medium">{cleanSizeDisplay(sizeOption.size)}</div>
                      <div className="text-sm">{formatCurrency(sizeOption.price)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seção de adicionais - só exibida se houver adicionais confirmados */}
              {additionalsByCategory.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setIsAdditionalsExpanded(!isAdditionalsExpanded)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h4 className="font-semibold text-gray-700">Adicionais (opcional):</h4>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-800 p-1.5 rounded-full shadow-sm">
                      {isAdditionalsExpanded ? (
                        <ChevronUp size={18} className="text-white" />
                      ) : (
                        <ChevronDown size={18} className="text-white" />
                      )}
                    </div>
                  </button>

                  {isAdditionalsExpanded && (
                    <div className="mt-2">
                      {isLoadingAdditionals ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700"></div>
                        </div>
                      ) : additionalsByCategory.length === 0 ? (
                        <p className="text-gray-500 text-sm py-2">Nenhum adicional disponível</p>
                      ) : (
                        <div className="space-y-4">
                          {/* Abas de categorias */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setSelectedCategoryId(null)}
                              className={`px-3 py-1 text-xs rounded-full ${selectedCategoryId === null
                                ? 'bg-purple-700 text-white'
                                : 'bg-gray-100 text-gray-700'}`}
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
                              >
                                {group.category.name}
                              </button>
                            ))}
                          </div>
                          
                          {/* Lista de adicionais filtrada por categoria */}
                          <div className="space-y-2">
                            {(selectedCategoryId === null 
                              ? additionals // Mostrar todos os adicionais
                              : (additionalsByCategory
                                  .find(group => group.category.id === selectedCategoryId)?.additionals || [])
                            ).map((additional) => {
                              // Verificar se este adicional já foi selecionado
                              const isSelected = !!selectedAdditionals[additional.id];
                              // Botão de adicionar deve ser desabilitado se já atingiu o limite e este adicional não está selecionado
                              const isDisabled = hasFreeAdditionals && reachedFreeAdditionalsLimit && !isSelected;
                              
                              return (
                                <div key={additional.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
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
                                      <p className="text-sm text-purple-700">
                                        {additional.price > 0 ? formatCurrency(additional.price) : "Gratuito"}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={() => toggleAdditional(additional)}
                                    disabled={!isSelected && isDisabled}
                                    className={`px-3 py-1.5 rounded-md flex items-center justify-center transition-colors ${isSelected 
                                      ? 'bg-purple-500 text-white hover:bg-purple-600' 
                                      : isDisabled 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : 'bg-purple-100 text-purple-900 hover:bg-purple-200'}`}
                                    title={isDisabled && !isSelected ? `Limite de ${FREE_ADDITIONALS_LIMIT} adicionais grátis atingido` : isSelected ? "Remover" : "Adicionar"}
                                  >
                                    {isSelected ? (
                                      <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        Selecionado
                                      </>
                                    ) : (
                                      <>Adicionar</>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Resumo dos adicionais selecionados */}
              {Object.keys(additionalsBySize).length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded-md">
                  <h5 className="font-medium text-lg text-purple-900 mb-3">
                    Resumo dos adicionais selecionados
                  </h5>
                  
                  {Object.keys(additionalsBySize).map(size => {
                    const sizeAdditionals = additionalsBySize[size] || {};
                    const additionalCount = Object.keys(sizeAdditionals).length;
                    
                    // Pular tamanhos sem adicionais
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
                        
                        <ul className="space-y-1">
                          {Object.values(sizeAdditionals).map(({ additional, quantity }) => (
                            <li key={`${size}-${additional.id}`} className="flex justify-between text-sm">
                              <span>
                                {quantity}x {additional.name}
                              </span>
                              <span>{additional.price === 0 ? "Grátis" : formatCurrency(additional.price * quantity)}</span>
                            </li>
                          ))}
                        </ul>
                        
                        {isFreeSize && reachedLimit && (
                          <p className="text-xs text-purple-700 mt-1 font-medium">
                            Você atingiu o limite de {FREE_ADDITIONALS_LIMIT} adicionais grátis para este tamanho.
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
                        ).length} tamanhos com adicionais)
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
