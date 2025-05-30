import { useState, useEffect } from "react"
import { useAdditionals } from "@/lib/contexts/additionals-context"
import { getAllAdditionals } from "@/lib/services/additional-service"
import { getActiveAdditionalCategories } from "@/lib/services/additional-category-service"
import type { Additional } from "@/lib/services/additional-service"
import type { AdditionalCategory } from "@/lib/services/additional-category-service"
import type { Product } from "@/lib/services/product-service"

/**
 * Hook especializado para gerenciar os adicionais permitidos de um produto
 */
export function useProductAdditionals(product: Product) {
  // Estado local para gerenciar erros de carregamento
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [availableAdditionals, setAvailableAdditionals] = useState<Additional[]>([])
  const [availableCategories, setAvailableCategories] = useState<AdditionalCategory[]>([])

  // Acesso ao contexto de adicionais
  const {
    selectedAdditionals,
    selectedCategoryId,
    setAdditionals,
    setAdditionalsByCategory,
    setSelectedCategoryId,
    setIsDataLoaded,
    toggleAdditional,
    removeAdditional,
    hasFreeAdditionals,
    selectedAdditionalsCount,
    reachedFreeAdditionalsLimit,
    reachedMaxAdditionalsLimit,
    FREE_ADDITIONALS_LIMIT,
    maxAdditionalsPerSize
  } = useAdditionals()

  // Função para carregar adicionais e suas categorias
  const loadAdditionals = async () => {
    try {
      setLoading(true)
      setError(null)

      // Carregar categorias ativas e adicionais em paralelo
      const [categories, allAdditionals] = await Promise.all([
        getActiveAdditionalCategories(),
        getAllAdditionals()
      ])

      // Verificar se os dados foram carregados com sucesso
      if (!categories || !allAdditionals) {
        throw new Error("Falha ao carregar dados de adicionais")
      }

      // Filtrar apenas os adicionais permitidos para este produto
      const productAdditionals = allAdditionals.filter(additional =>
        product.allowedAdditionals.includes(additional.id)
      )

      // Encontrar categorias que têm adicionais permitidos
      const productCategories = categories.filter(category =>
        productAdditionals.some(additional => additional.categoryId === category.id)
      )

      // Organizar adicionais por categoria
      const additionalsByCategoryData = productCategories.map((category) => {
        const categoryAdditionals = productAdditionals.filter(
          additional => additional.categoryId === category.id
        )
        return { category, additionals: categoryAdditionals }
      })

      // Atualizar estados
      setAvailableAdditionals(productAdditionals)
      setAvailableCategories(productCategories)
      setAdditionals(productAdditionals)
      setAdditionalsByCategory(additionalsByCategoryData)
      setIsDataLoaded(true)

      // Se não houver categoria selecionada e existirem categorias, selecionar a primeira
      if (selectedCategoryId === null && productCategories.length > 0) {
        setSelectedCategoryId(productCategories[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar adicionais")
      console.error("Erro ao carregar adicionais:", err)
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados quando o produto mudar
  useEffect(() => {
    if (product) {
      loadAdditionals()
    }
  }, [product, loadAdditionals])

  // Função para calcular o preço total dos adicionais
  const calculateAdditionalsTotal = () => {
    if (!selectedAdditionals) return 0

    // Converter para array para ter controle sobre a ordem
    const additionalsList = Object.values(selectedAdditionals)

    return additionalsList.reduce((total, { additional, quantity }, index) => {
      // Se o tamanho tem adicionais gratuitos e este adicional está dentro do limite gratuito
      if (hasFreeAdditionals && index < FREE_ADDITIONALS_LIMIT) {
        return total // Este adicional é gratuito
      }
      // Este adicional é pago
      return total + additional.price * quantity
    }, 0)
  }

  // Função para obter adicionais da categoria selecionada
  const getSelectedCategoryAdditionals = (): Additional[] => {
    if (selectedCategoryId === null) return availableAdditionals

    return availableAdditionals.filter(
      additional => additional.categoryId === selectedCategoryId
    )
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

    const remainingTotal = maxAdditionalsPerSize - selectedAdditionalsCount

    if (hasFreeAdditionals && !reachedFreeAdditionalsLimit) {
      return `${selectedAdditionalsCount} complemento${selectedAdditionalsCount !== 1 ? 's' : ''} premium selecionado${selectedAdditionalsCount !== 1 ? 's' : ''} (${remainingFree} grátis restante${remainingFree !== 1 ? 's' : ''})`
    }

    return `${selectedAdditionalsCount} complemento${selectedAdditionalsCount !== 1 ? 's' : ''} premium selecionado${selectedAdditionalsCount !== 1 ? 's' : ''} (${remainingTotal} restante${remainingTotal !== 1 ? 's' : ''})`
  }

  return {
    // Estados
    availableAdditionals,
    availableCategories,
    selectedCategoryId,
    selectedAdditionals,
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

    // Métodos
    setSelectedCategoryId,
    toggleAdditional,
    removeAdditional,
    isAdditionalSelected,

    // Constantes
    maxAdditionalsPerSize,
    FREE_ADDITIONALS_LIMIT
  }
}
