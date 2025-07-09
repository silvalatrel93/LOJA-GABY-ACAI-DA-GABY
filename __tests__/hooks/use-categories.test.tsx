import { renderHook, act } from '@testing-library/react'
import { useCategories } from '@/lib/hooks/use-categories'

// Mock do CategoryService
jest.mock('@/lib/services/category-service', () => ({
  CategoryService: {
    getAllCategories: jest.fn(),
    getActiveCategories: jest.fn(),
    getCategoryById: jest.fn(),
    saveCategory: jest.fn(),
    deleteCategory: jest.fn(),
  },
}))

describe('useCategories', () => {
  const mockGetActiveCategories = jest.fn()
  const mockGetAllCategories = jest.fn()
  const mockGetCategoryById = jest.fn()
  const mockSaveCategory = jest.fn()
  const mockDeleteCategory = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Configurar mocks para cada teste
    const { CategoryService } = require('@/lib/services/category-service')
    CategoryService.getAllCategories = mockGetAllCategories
    CategoryService.getActiveCategories = mockGetActiveCategories
    CategoryService.getCategoryById = mockGetCategoryById
    CategoryService.saveCategory = mockSaveCategory
    CategoryService.deleteCategory = mockDeleteCategory
  })

  it('should fetch categories on mount', async () => {
    const mockCategories = [
      { id: 1, name: 'Categoria 1', order: 1, active: true },
      { id: 2, name: 'Categoria 2', order: 2, active: true },
    ]

    mockGetActiveCategories.mockResolvedValue(mockCategories)

    const { result } = renderHook(() => useCategories())

    // Esperar que a função assíncrona seja executada
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockGetActiveCategories).toHaveBeenCalledTimes(1)
    expect(result.current.categories).toEqual(mockCategories)
    expect(result.current.loading).toBe(false)
  })

  it('should toggle between active only and all categories', async () => {
    const mockActiveCategories = [
      { id: 1, name: 'Categoria Ativa', order: 1, active: true },
    ]
    
    const mockAllCategories = [
      { id: 1, name: 'Categoria Ativa', order: 1, active: true },
      { id: 2, name: 'Categoria Inativa', order: 2, active: false },
    ]

    mockGetActiveCategories.mockResolvedValue(mockActiveCategories)
    mockGetAllCategories.mockResolvedValue(mockAllCategories)

    const { result } = renderHook(() => useCategories())

    // Inicialmente deve buscar apenas categorias ativas
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockGetActiveCategories).toHaveBeenCalledTimes(1)
    expect(result.current.activeOnly).toBe(true)

    // Alternar para mostrar todas as categorias
    await act(async () => {
      result.current.toggleActiveOnly()
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockGetAllCategories).toHaveBeenCalledTimes(1)
    expect(result.current.activeOnly).toBe(false)
  })
})
