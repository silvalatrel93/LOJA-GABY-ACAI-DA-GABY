import { render, screen, fireEvent } from '@testing-library/react'
import { AdditionalSummary } from '@/components/product-card/additional-summary'
import { AdditionalsProvider } from '@/lib/contexts/additionals-context'

// Mock do hook useAdditionals
jest.mock('@/lib/contexts/additionals-context', () => {
  const originalModule = jest.requireActual('@/lib/contexts/additionals-context')
  
  return {
    ...originalModule,
    useAdditionals: jest.fn(() => ({
      selectedAdditionalsCount: 3,
      hasFreeAdditionals: true,
      reachedFreeAdditionalsLimit: false,
      FREE_ADDITIONALS_LIMIT: 5,
      MAX_ADDITIONALS_PER_SIZE: 5,
      selectedAdditionals: {
        1: { additional: { id: 1, name: 'Morango', price: 2.50, categoryId: 1, categoryName: 'Frutas' }, quantity: 1 },
        2: { additional: { id: 2, name: 'Banana', price: 2.00, categoryId: 1, categoryName: 'Frutas' }, quantity: 1 },
        3: { additional: { id: 3, name: 'Chocolate', price: 3.00, categoryId: 2, categoryName: 'Coberturas' }, quantity: 1 }
      },
      removeAdditional: jest.fn(),
      groupedAdditionals: [
        {
          category: { id: 1, name: 'Frutas', description: 'Frutas frescas' },
          additionals: [
            { additional: { id: 1, name: 'Morango', price: 2.50, categoryId: 1, categoryName: 'Frutas' }, quantity: 1 },
            { additional: { id: 2, name: 'Banana', price: 2.00, categoryId: 1, categoryName: 'Frutas' }, quantity: 1 }
          ]
        },
        {
          category: { id: 2, name: 'Coberturas', description: 'Coberturas especiais' },
          additionals: [
            { additional: { id: 3, name: 'Chocolate', price: 3.00, categoryId: 2, categoryName: 'Coberturas' }, quantity: 1 }
          ]
        }
      ],
      additionalsTotalPrice: 7.50
    }))
  }
})

describe('AdditionalSummary', () => {
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <AdditionalsProvider initialSize="Pequeno">
        {ui}
      </AdditionalsProvider>
    )
  }

  it('renderiza o resumo dos adicionais corretamente', () => {
    renderWithProvider(<AdditionalSummary />)
    
    // Verifica se o título é exibido
    expect(screen.getByText('Resumo dos Complementos Premium')).toBeInTheDocument()
    
    // Verifica se as categorias são exibidas
    expect(screen.getByText('Frutas')).toBeInTheDocument()
    expect(screen.getByText('Coberturas')).toBeInTheDocument()
    
    // Verifica se os adicionais são exibidos
    expect(screen.getByText('Morango')).toBeInTheDocument()
    expect(screen.getByText('Banana')).toBeInTheDocument()
    expect(screen.getByText('Chocolate')).toBeInTheDocument()
    
    // Verifica se o preço total é exibido
    expect(screen.getByText('R$ 7,50')).toBeInTheDocument()
  })

  it('exibe mensagem quando não há adicionais selecionados', () => {
    // Sobrescreve o mock para simular nenhum adicional selecionado
    const useAdditionalsMock = require('@/lib/contexts/additionals-context').useAdditionals
    useAdditionalsMock.mockReturnValueOnce({
      selectedAdditionalsCount: 0,
      hasFreeAdditionals: true,
      reachedFreeAdditionalsLimit: false,
      FREE_ADDITIONALS_LIMIT: 5,
      MAX_ADDITIONALS_PER_SIZE: 5,
      selectedAdditionals: {},
      removeAdditional: jest.fn(),
      groupedAdditionals: [],
      additionalsTotalPrice: 0
    })
    
    renderWithProvider(<AdditionalSummary />)
    
    // Verifica se a mensagem de nenhum adicional é exibida
    expect(screen.getByText('Nenhum complemento premium selecionado')).toBeInTheDocument()
  })

  it('chama a função removeAdditional quando o botão de remover é clicado', () => {
    renderWithProvider(<AdditionalSummary />)
    
    // Encontra todos os botões de remover
    const removeButtons = screen.getAllByRole('button')
    
    // Clica no primeiro botão de remover
    fireEvent.click(removeButtons[0])
    
    // Verifica se a função removeAdditional foi chamada com o ID correto
    const removeAdditionalMock = require('@/lib/contexts/additionals-context').useAdditionals().removeAdditional
    expect(removeAdditionalMock).toHaveBeenCalledTimes(1)
  })

  it('exibe informação sobre adicionais gratuitos quando aplicável', () => {
    renderWithProvider(<AdditionalSummary />)
    
    // Como hasFreeAdditionals é true e reachedFreeAdditionalsLimit é false,
    // deve exibir informação sobre adicionais gratuitos
    expect(screen.getByText(/complementos premium gratuitos/i)).toBeInTheDocument()
  })

  it('agrupa adicionais por categoria corretamente', () => {
    renderWithProvider(<AdditionalSummary />)
    
    // Verifica se os adicionais estão agrupados por categoria
    const fruitCategory = screen.getByText('Frutas').closest('div')
    const toppingCategory = screen.getByText('Coberturas').closest('div')
    
    // Verifica se os adicionais estão nos grupos corretos
    expect(fruitCategory?.textContent).toContain('Morango')
    expect(fruitCategory?.textContent).toContain('Banana')
    expect(toppingCategory?.textContent).toContain('Chocolate')
  })
})
