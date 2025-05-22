import { render, screen, fireEvent } from '@testing-library/react'
import { AdditionalSelector } from '@/components/product-card/additional-selector'
import { AdditionalsProvider } from '@/lib/contexts/additionals-context'

// Mock do hook useAdditionals
jest.mock('@/lib/contexts/additionals-context', () => {
  const originalModule = jest.requireActual('@/lib/contexts/additionals-context')
  
  return {
    ...originalModule,
    useAdditionals: jest.fn(() => ({
      selectedCategoryId: 1,
      setSelectedCategoryId: jest.fn(),
      toggleAdditional: jest.fn(),
      isAdditionalSelected: jest.fn((id) => id === 1),
      hasFreeAdditionals: true,
      reachedFreeAdditionalsLimit: false,
      reachedMaxAdditionalsLimit: false,
      FREE_ADDITIONALS_LIMIT: 5,
      MAX_ADDITIONALS_PER_SIZE: 5
    }))
  }
})

describe('AdditionalSelector', () => {
  const mockCategories = [
    { id: 1, name: 'Frutas', description: 'Frutas frescas' },
    { id: 2, name: 'Coberturas', description: 'Coberturas especiais' }
  ]
  
  const mockAdditionals = [
    { id: 1, name: 'Morango', price: 2.50, categoryId: 1, categoryName: 'Frutas' },
    { id: 2, name: 'Banana', price: 2.00, categoryId: 1, categoryName: 'Frutas' },
    { id: 3, name: 'Chocolate', price: 3.00, categoryId: 2, categoryName: 'Coberturas' }
  ]
  
  const mockProps = {
    additionalCategories: mockCategories,
    additionalsByCategory: mockCategories.map(category => ({
      category,
      additionals: mockAdditionals.filter(a => a.categoryId === category.id)
    }))
  }

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <AdditionalsProvider initialSize="Pequeno">
        {ui}
      </AdditionalsProvider>
    )
  }

  it('renderiza as categorias de adicionais corretamente', () => {
    renderWithProvider(<AdditionalSelector {...mockProps} />)
    
    // Verifica se o título é exibido
    expect(screen.getByText('Complementos Premium')).toBeInTheDocument()
    
    // Verifica se todas as categorias são exibidas
    mockCategories.forEach(category => {
      expect(screen.getByText(category.name)).toBeInTheDocument()
    })
  })

  it('exibe os adicionais da categoria selecionada', () => {
    renderWithProvider(<AdditionalSelector {...mockProps} />)
    
    // Os adicionais da primeira categoria (Frutas) devem estar visíveis
    expect(screen.getByText('Morango')).toBeInTheDocument()
    expect(screen.getByText('Banana')).toBeInTheDocument()
    
    // Os adicionais da segunda categoria (Coberturas) não devem estar visíveis
    expect(screen.queryByText('Chocolate')).not.toBeInTheDocument()
  })

  it('marca os adicionais selecionados corretamente', () => {
    renderWithProvider(<AdditionalSelector {...mockProps} />)
    
    // O adicional com ID 1 deve estar marcado
    const selectedAdditional = screen.getByText('Morango').closest('button')
    expect(selectedAdditional).toHaveClass('border-primary')
    
    // O adicional com ID 2 não deve estar marcado
    const unselectedAdditional = screen.getByText('Banana').closest('button')
    expect(unselectedAdditional).not.toHaveClass('border-primary')
  })

  it('exibe mensagem quando não há adicionais na categoria', () => {
    const propsWithEmptyCategory = {
      ...mockProps,
      additionalsByCategory: [
        {
          category: mockCategories[0],
          additionals: []
        }
      ]
    }
    
    renderWithProvider(<AdditionalSelector {...propsWithEmptyCategory} />)
    
    // Deve exibir a mensagem de nenhum adicional disponível
    expect(screen.getByText('Nenhum complemento premium disponível nesta categoria')).toBeInTheDocument()
  })

  it('exibe o preço dos adicionais corretamente', () => {
    renderWithProvider(<AdditionalSelector {...mockProps} />)
    
    // Verifica se os preços são exibidos corretamente
    expect(screen.getByText('R$ 2,50')).toBeInTheDocument()
    expect(screen.getByText('R$ 2,00')).toBeInTheDocument()
  })

  it('exibe indicador de gratuito para adicionais quando aplicável', () => {
    renderWithProvider(<AdditionalSelector {...mockProps} />)
    
    // Como hasFreeAdditionals é true e reachedFreeAdditionalsLimit é false,
    // deve exibir o indicador de gratuito
    expect(screen.getAllByText('Grátis').length).toBeGreaterThan(0)
  })
})
