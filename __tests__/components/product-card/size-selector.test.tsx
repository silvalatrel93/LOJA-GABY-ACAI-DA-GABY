import { render, screen, fireEvent } from '@testing-library/react'
import { SizeSelector } from '@/components/product-card/size-selector'

describe('SizeSelector', () => {
  const mockSizes = [
    { name: 'Pequeno', price: 15.90 },
    { name: '1 Litro', price: 25.90 },
    { name: '2 Litros', price: 45.90 }
  ]
  
  const mockProps = {
    sizes: mockSizes,
    selectedSize: 'Pequeno',
    onSizeChange: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza os tamanhos corretamente', () => {
    render(<SizeSelector {...mockProps} />)
    
    // Verifica se o título é exibido
    expect(screen.getByText('Tamanho')).toBeInTheDocument()
    
    // Verifica se todos os tamanhos são exibidos
    mockSizes.forEach(size => {
      expect(screen.getByText(size.name)).toBeInTheDocument()
      expect(screen.getByText(`R$ ${size.price.toFixed(2).replace('.', ',')}`)).toBeInTheDocument()
    })
  })

  it('marca o tamanho selecionado corretamente', () => {
    render(<SizeSelector {...mockProps} />)
    
    // Verifica se o tamanho selecionado tem a classe correta
    const selectedSizeButton = screen.getByText('Pequeno').closest('button')
    expect(selectedSizeButton).toHaveClass('bg-primary')
    expect(selectedSizeButton).toHaveClass('text-primary-foreground')
    
    // Verifica se os outros tamanhos não têm a classe de selecionado
    const otherSizeButtons = [
      screen.getByText('1 Litro').closest('button'),
      screen.getByText('2 Litros').closest('button')
    ]
    
    otherSizeButtons.forEach(button => {
      expect(button).not.toHaveClass('bg-primary')
      expect(button).not.toHaveClass('text-primary-foreground')
    })
  })

  it('chama a função onSizeChange quando um tamanho é clicado', () => {
    render(<SizeSelector {...mockProps} />)
    
    // Clica em um tamanho diferente do selecionado
    const sizeButton = screen.getByText('1 Litro').closest('button')
    fireEvent.click(sizeButton!)
    
    // Verifica se a função foi chamada com o tamanho correto
    expect(mockProps.onSizeChange).toHaveBeenCalledTimes(1)
    expect(mockProps.onSizeChange).toHaveBeenCalledWith('1 Litro')
  })

  it('não chama onSizeChange quando o tamanho já selecionado é clicado', () => {
    render(<SizeSelector {...mockProps} />)
    
    // Clica no tamanho já selecionado
    const selectedSizeButton = screen.getByText('Pequeno').closest('button')
    fireEvent.click(selectedSizeButton!)
    
    // Verifica que a função não foi chamada
    expect(mockProps.onSizeChange).not.toHaveBeenCalled()
  })

  it('exibe mensagem quando não há tamanhos disponíveis', () => {
    render(<SizeSelector {...mockProps} sizes={[]} />)
    
    // Verifica se a mensagem de indisponibilidade é exibida
    expect(screen.getByText('Tamanhos não disponíveis')).toBeInTheDocument()
  })
})
