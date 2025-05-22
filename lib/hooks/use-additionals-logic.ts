import { useState, useEffect } from "react"
import { useAdditionals } from "@/lib/contexts/additionals-context"
import { getAllAdditionals } from "@/lib/services/additional-service"
import { getActiveAdditionalCategories } from "@/lib/services/additional-category-service"
import type { Additional } from "@/lib/services/additional-service"
import type { AdditionalCategory } from "@/lib/services/additional-category-service"

/**
 * Hook personalizado para gerenciar a lógica de adicionais
 * Separa a lógica de negócio da apresentação
 */
import type { Product } from "@/lib/services/product-service"

export function useAdditionalsLogic(product?: Product) {
  const {
    additionals,
    additionalsByCategory,
    selectedSize,
    selectedCategoryId,
    selectedAdditionals,
    isDataLoaded,
    hasFreeAdditionals,
    selectedAdditionalsCount,
    reachedFreeAdditionalsLimit,
    reachedMaxAdditionalsLimit,
    setAdditionals,
    setAdditionalsByCategory,
    setSelectedSize,
    setSelectedCategoryId,
    toggleAdditional,
    removeAdditional,
    setIsDataLoaded,
    resetAdditionalsBySize,
    MAX_ADDITIONALS_PER_SIZE,
    FREE_ADDITIONALS_LIMIT
  } = useAdditionals()

  // Estado local para gerenciar erros de carregamento
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Função para carregar adicionais e suas categorias
  const loadAdditionalsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Carregar categorias ativas e adicionais em paralelo
      const [categories, additionalsData] = await Promise.all([
        getActiveAdditionalCategories(),
        getAllAdditionals()
      ])

      // Verificar se os dados foram carregados com sucesso
      if (!categories || !additionalsData) {
        throw new Error("Falha ao carregar dados de adicionais")
      }

      // Organizar adicionais por categoria, filtrando apenas as categorias permitidas
      const additionalsByCategoryData = categories
        .map((category: AdditionalCategory) => {
          const categoryAdditionals = additionalsData.filter(
            (additional: Additional) => 
              additional.categoryId === category.id && 
              (!product?.allowedAdditionals || product.allowedAdditionals.includes(additional.id))
          )
          return { category, additionals: categoryAdditionals }
        })
        .filter(({ additionals }) => additionals.length > 0)

      // Atualizar o estado no contexto
      setAdditionals(additionalsData)
      setAdditionalsByCategory(additionalsByCategoryData)
      setIsDataLoaded(true)
      
      // Se não houver categoria selecionada e existirem categorias, selecionar a primeira
      if (selectedCategoryId === null && categories.length > 0) {
        setSelectedCategoryId(categories[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar adicionais")
      console.error("Erro ao carregar adicionais:", err)
    } finally {
      setLoading(false)
    }
  }

  // Função para calcular o preço total dos adicionais
  const calculateAdditionalsTotal = () => {
    if (!selectedAdditionals) return 0

    return Object.values(selectedAdditionals).reduce((total, { additional, quantity }) => {
      // Se o tamanho tem adicionais gratuitos e ainda não atingiu o limite
      if (hasFreeAdditionals && Object.keys(selectedAdditionals).length <= FREE_ADDITIONALS_LIMIT) {
        return total
      }
      return total + additional.price * quantity
    }, 0)
  }

  // Função para obter adicionais da categoria selecionada
  const getSelectedCategoryAdditionals = (): Additional[] => {
    if (selectedCategoryId === null) return []
    
    const categoryData = additionalsByCategory.find(
      item => item.category.id === selectedCategoryId
    )
    
    return categoryData ? categoryData.additionals : []
  }

  // Função para verificar se um adicional está selecionado
  const isAdditionalSelected = (additionalId: number): boolean => {
    return !!selectedAdditionals[additionalId]
  }

  // Função para obter o texto de resumo dos adicionais
  const getAdditionalsCountText = (): string => {
    if (selectedAdditionalsCount === 0) return "Sem complementos premium"
    
    const remainingFree = hasFreeAdditionals 
      ? Math.max(0, FREE_ADDITIONALS_LIMIT - selectedAdditionalsCount)
      : 0
      
    const remainingTotal = MAX_ADDITIONALS_PER_SIZE - selectedAdditionalsCount
    
    if (hasFreeAdditionals && !reachedFreeAdditionalsLimit) {
      return `${selectedAdditionalsCount} complemento${selectedAdditionalsCount !== 1 ? 's' : ''} premium selecionado${selectedAdditionalsCount !== 1 ? 's' : ''} (${remainingFree} grátis restante${remainingFree !== 1 ? 's' : ''})`
    }
    
    return `${selectedAdditionalsCount} complemento${selectedAdditionalsCount !== 1 ? 's' : ''} premium selecionado${selectedAdditionalsCount !== 1 ? 's' : ''} (${remainingTotal} restante${remainingTotal !== 1 ? 's' : ''})`
  }

  // Função para agrupar adicionais por categoria
  const groupAdditionalsByCategory = () => {
    if (!selectedAdditionals) return []

    // Criar um mapa de categorias
    const categoriesMap = new Map<number, {
      category: AdditionalCategory | null;
      additionals: Array<{additional: Additional; quantity: number}>;
    }>()

    // Inicializar com uma categoria "sem categoria" para adicionais sem categoria
    categoriesMap.set(0, {
      category: null,
      additionals: []
    })

    // Agrupar adicionais por categoria
    Object.values(selectedAdditionals).forEach(({ additional, quantity }) => {
      const categoryId = additional.categoryId || 0
      
      if (!categoriesMap.has(categoryId)) {
        const category = additionalsByCategory.find(
          item => item.category.id === categoryId
        )?.category || null
        
        categoriesMap.set(categoryId, {
          category,
          additionals: []
        })
      }
      
      categoriesMap.get(categoryId)?.additionals.push({ additional, quantity })
    })

    // Converter o mapa em array e remover categorias vazias
    return Array.from(categoriesMap.values())
      .filter(group => group.additionals.length > 0)
  }

  return {
    // Estados
    additionals,
    additionalsByCategory,
    selectedSize,
    selectedCategoryId,
    selectedAdditionals,
    isDataLoaded,
    error,
    loading,
    
    // Valores calculados
    hasFreeAdditionals,
    selectedAdditionalsCount,
    reachedFreeAdditionalsLimit,
    reachedMaxAdditionalsLimit,
    selectedCategoryAdditionals: getSelectedCategoryAdditionals(),
    additionalsTotalPrice: calculateAdditionalsTotal(),
    additionalsCountText: getAdditionalsCountText(),
    groupedAdditionals: groupAdditionalsByCategory(),
    
    // Métodos
    setSelectedSize,
    setSelectedCategoryId,
    toggleAdditional,
    removeAdditional,
    resetAdditionalsBySize,
    loadAdditionalsData,
    isAdditionalSelected,
    
    // Constantes
    MAX_ADDITIONALS_PER_SIZE,
    FREE_ADDITIONALS_LIMIT,
    SIZES_WITH_FREE_ADDITIONALS: useAdditionals().SIZES_WITH_FREE_ADDITIONALS,
    
    // Acesso direto ao estado do contexto
    additionalsBySize: useAdditionals().additionalsBySize
  }
}
