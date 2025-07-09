import { useState, useCallback, useEffect } from 'react'
import { CategoryService } from '../services/category-service'
import type { Category } from '../types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeOnly, setActiveOnly] = useState(true)
  
  // Função para buscar categorias
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = activeOnly 
        ? await CategoryService.getActiveCategories()
        : await CategoryService.getAllCategories()
      
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar categorias')
    } finally {
      setLoading(false)
    }
  }, [activeOnly])
  
  // Buscar categorias na montagem e quando activeOnly mudar
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])
  
  // Função para obter categoria por ID
  const getCategoryById = useCallback(async (id: number): Promise<Category | null> => {
    try {
      setLoading(true)
      setError(null)
      return await CategoryService.getCategoryById(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar categoria')
      return null
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Função para salvar categoria
  const saveCategory = useCallback(async (category: Category): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      
      const result = await CategoryService.saveCategory(category)
      
      if (result.error) {
        setError(result.error.message)
        return false
      }
      
      setSuccess(true)
      await fetchCategories() // Atualizar a lista
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar categoria')
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchCategories])
  
  // Função para excluir categoria
  const deleteCategory = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      
      const result = await CategoryService.deleteCategory(id)
      
      if (!result) {
        setError('Erro ao excluir categoria')
        return false
      }
      
      setSuccess(true)
      await fetchCategories() // Atualizar a lista
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir categoria')
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchCategories])
  
  // Alternar entre mostrar todas as categorias ou apenas as ativas
  const toggleActiveOnly = useCallback(() => {
    setActiveOnly(prev => !prev)
  }, [])
  
  // Função para atualizar a lista
  const refreshCategories = useCallback(async () => {
    await fetchCategories()
  }, [fetchCategories])
  
  // Função para resetar status
  const resetStatus = useCallback(() => {
    setError(null)
    setSuccess(false)
  }, [])
  
  return {
    // Dados
    categories,
    activeOnly,
    
    // Operações
    getCategoryById,
    saveCategory,
    deleteCategory,
    toggleActiveOnly,
    refreshCategories,
    
    // Estados
    loading,
    error,
    success,
    resetStatus
  }
}
