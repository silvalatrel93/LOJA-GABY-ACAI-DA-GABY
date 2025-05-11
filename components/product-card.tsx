"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Maximize2, ChevronDown, ChevronUp } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/utils"
import ImageViewer from "@/components/image-viewer"
import { getActiveAdditionals, type Additional } from "@/lib/db"
import { getStoreStatus } from "@/lib/store-utils"

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const [selectedSize, setSelectedSize] = useState(product.sizes[0].size)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [additionals, setAdditionals] = useState<Additional[]>([])
  const [selectedAdditionals, setSelectedAdditionals] = useState<{
    [key: number]: { additional: Additional; quantity: number }
  }>({})
  const [isLoadingAdditionals, setIsLoadingAdditionals] = useState(false)
  const [isAdditionalsExpanded, setIsAdditionalsExpanded] = useState(false)
  const [storeStatus, setStoreStatus] = useState({ isOpen: true, statusText: "", statusClass: "" })

  const selectedSizeInfo = product.sizes.find((s) => s.size === selectedSize)

  // Carregar adicionais disponíveis
  useEffect(() => {
    if (isModalOpen) {
      const loadAdditionals = async () => {
        try {
          setIsLoadingAdditionals(true)
          const activeAdditionals = await getActiveAdditionals()

          // Filtrar apenas os adicionais permitidos para este produto
          if (product.allowedAdditionals && product.allowedAdditionals.length > 0) {
            // Se o produto tem adicionais específicos permitidos, mostrar apenas esses
            const filteredAdditionals = activeAdditionals.filter((additional) =>
              product.allowedAdditionals?.includes(additional.id),
            )
            setAdditionals(filteredAdditionals)
          } else {
            // Se o produto não tem adicionais específicos, não mostrar nenhum
            setAdditionals([])
          }
        } catch (error) {
          console.error("Erro ao carregar adicionais:", error)
        } finally {
          setIsLoadingAdditionals(false)
        }
      }

      loadAdditionals()
    }
  }, [isModalOpen, product.allowedAdditionals])

  useEffect(() => {
    const loadStoreStatus = async () => {
      const status = await getStoreStatus()
      setStoreStatus(status)
    }

    loadStoreStatus()
  }, [])

  const handleAddToCart = () => {
    // Converter os adicionais selecionados para o formato do carrinho
    const cartAdditionals = Object.values(selectedAdditionals).map(({ additional, quantity }) => ({
      id: additional.id,
      name: additional.name,
      price: additional.price,
      quantity,
    }))

    // Calcular o preço total incluindo adicionais
    const additionalsTotal = Object.values(selectedAdditionals).reduce(
      (sum, { additional, quantity }) => sum + additional.price * quantity,
      0,
    )

    addToCart({
      id: product.id,
      name: product.name,
      price: selectedSizeInfo.price + additionalsTotal,
      size: selectedSize,
      image: product.image,
      quantity: 1,
      additionals: cartAdditionals.length > 0 ? cartAdditionals : undefined,
    })
    setIsModalOpen(false)
    // Limpar adicionais selecionados após adicionar ao carrinho
    setSelectedAdditionals({})
  }

  // Função para abrir o visualizador de imagem
  const handleOpenImageViewer = (e) => {
    e.stopPropagation() // Impedir que o evento se propague para outros elementos
    setIsImageViewerOpen(true)
  }

  // Função para adicionar ou remover um adicional
  const toggleAdditional = (additional: Additional) => {
    setSelectedAdditionals((prev) => {
      const newSelected = { ...prev }

      // Se já existe, incrementa a quantidade
      if (newSelected[additional.id]) {
        newSelected[additional.id] = {
          ...newSelected[additional.id],
          quantity: newSelected[additional.id].quantity + 1,
        }
      } else {
        // Se não existe, adiciona com quantidade 1
        newSelected[additional.id] = {
          additional,
          quantity: 1,
        }
      }

      return newSelected
    })
  }

  // Função para remover um adicional
  const removeAdditional = (additionalId: number) => {
    setSelectedAdditionals((prev) => {
      const newSelected = { ...prev }

      // Se existe e a quantidade é maior que 1, decrementa
      if (newSelected[additionalId] && newSelected[additionalId].quantity > 1) {
        newSelected[additionalId] = {
          ...newSelected[additionalId],
          quantity: newSelected[additionalId].quantity - 1,
        }
      } else {
        // Se a quantidade é 1, remove completamente
        delete newSelected[additionalId]
      }

      return newSelected
    })
  }

  // Calcular o preço total incluindo adicionais
  const calculateTotal = () => {
    const basePrice = selectedSizeInfo.price
    const additionalsTotal = Object.values(selectedAdditionals).reduce(
      (sum, { additional, quantity }) => sum + additional.price * quantity,
      0,
    )
    return basePrice + additionalsTotal
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
            className="absolute top-2 right-2 bg-white bg-opacity-70 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Ampliar imagem"
          >
            <Maximize2 size={16} className="text-purple-900" />
          </button>

          {/* Overlay com gradiente na parte inferior */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black to-transparent opacity-60"></div>
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-purple-900 text-sm">{product.name}</h3>
          <p className="text-gray-600 text-xs mt-1 line-clamp-2">{product.description}</p>
          <div className="mt-2 flex justify-between items-center">
            <span className="font-bold text-purple-900 text-sm">
              A partir de {formatCurrency(product.sizes[0].price)}
            </span>
            <button
              onClick={() => (storeStatus.isOpen ? setIsModalOpen(true) : null)}
              className={`${
                storeStatus.isOpen ? "bg-purple-700 hover:bg-purple-800" : "bg-gray-400 cursor-not-allowed"
              } text-white p-1.5 rounded-full`}
              disabled={!storeStatus.isOpen}
              title={storeStatus.isOpen ? "Adicionar ao carrinho" : "Loja fechada"}
            >
              <Plus size={16} />
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
                  setSelectedAdditionals({})
                }}
                className="bg-gray-200 text-gray-800 p-1.5 rounded-full hover:bg-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <p className="text-gray-600 mt-2">{product.description}</p>

              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-2">Escolha o tamanho:</h4>
                <div className="grid grid-cols-3 gap-2">
                  {product.sizes.map((sizeOption) => (
                    <button
                      key={sizeOption.size}
                      className={`border rounded-md py-2 px-3 text-center ${
                        selectedSize === sizeOption.size
                          ? "bg-purple-100 border-purple-500 text-purple-900"
                          : "border-gray-300 text-gray-700"
                      }`}
                      onClick={() => setSelectedSize(sizeOption.size)}
                    >
                      <div className="font-medium">{sizeOption.size}</div>
                      <div className="text-sm">{formatCurrency(sizeOption.price)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seção de adicionais */}
              <div className="mt-6">
                <button
                  onClick={() => setIsAdditionalsExpanded(!isAdditionalsExpanded)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h4 className="font-semibold text-gray-700">Adicionais (opcional):</h4>
                  {isAdditionalsExpanded ? (
                    <ChevronUp size={18} className="text-gray-700" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-700" />
                  )}
                </button>

                {isAdditionalsExpanded && (
                  <div className="mt-2">
                    {isLoadingAdditionals ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700"></div>
                      </div>
                    ) : additionals.length === 0 ? (
                      <p className="text-gray-500 text-sm py-2">Nenhum adicional disponível</p>
                    ) : (
                      <div className="space-y-2">
                        {additionals.map((additional) => (
                          <div key={additional.id} className="flex items-center justify-between border rounded-md p-2">
                            <div className="flex items-center">
                              <div className="w-10 h-10 relative mr-2 bg-purple-50 rounded-md overflow-hidden">
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
                                <p className="font-medium text-sm">{additional.name}</p>
                                <p className="text-xs text-purple-700">{formatCurrency(additional.price)}</p>
                              </div>
                            </div>

                            {selectedAdditionals[additional.id] ? (
                              <div className="flex items-center">
                                <button
                                  onClick={() => removeAdditional(additional.id)}
                                  className="w-7 h-7 bg-purple-100 text-purple-900 rounded-l-md flex items-center justify-center"
                                >
                                  -
                                </button>
                                <span className="w-7 h-7 bg-purple-50 flex items-center justify-center text-sm">
                                  {selectedAdditionals[additional.id].quantity}
                                </span>
                                <button
                                  onClick={() => toggleAdditional(additional)}
                                  className="w-7 h-7 bg-purple-100 text-purple-900 rounded-r-md flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => toggleAdditional(additional)}
                                className="w-7 h-7 bg-purple-100 text-purple-900 rounded-md flex items-center justify-center"
                              >
                                +
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Resumo dos adicionais selecionados */}
              {Object.keys(selectedAdditionals).length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded-md">
                  <h5 className="font-medium text-sm text-purple-900 mb-2">Adicionais selecionados:</h5>
                  <ul className="space-y-1">
                    {Object.values(selectedAdditionals).map(({ additional, quantity }) => (
                      <li key={additional.id} className="flex justify-between text-sm">
                        <span>
                          {quantity}x {additional.name}
                        </span>
                        <span>{formatCurrency(additional.price * quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3 rounded-lg font-semibold mt-6"
                disabled={!storeStatus.isOpen}
              >
                {storeStatus.isOpen
                  ? `Adicionar ao Carrinho • ${formatCurrency(calculateTotal())}`
                  : "Loja fechada - Não é possível adicionar"}
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
