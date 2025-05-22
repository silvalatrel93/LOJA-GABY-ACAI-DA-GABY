import { render, screen } from '@testing-library/react'
import { ProductInfo } from '@/components/product-card/product-info'

describe('ProductInfo', () => {
  const mockProps = {
    category: 'Açaí',
    name: 'Açaí Premium',
    description: 'Açaí com frutas e complementos',
    price: 25.90
  }

  it('renderiza as informações do produto corretamente', () => {
    render(<ProductInfo {...mockProps} />)
    
    // Verifica se a categoria é exibida corretamente
    const category = screen.getByText('Açaí')
    expect(category).toBeInTheDocument()
    expect(category).toHaveClass('text-xs text-primary')
    
    // Verifica se o nome é exibido corretamente
    const name = screen.getByText('Açaí Premium')
    expect(name).toBeInTheDocument()
    expect(name).toHaveClass('text-lg font-semibold')
    
    // Verifica se a descrição é exibida corretamente
    const description = screen.getByText('Açaí com frutas e complementos')
    expect(description).toBeInTheDocument()
    expect(description).toHaveClass('text-muted-foreground text-sm')
    
    // Verifica se o preço é exibido corretamente
    const price = screen.getByText('R$ 25,90')
    expect(price).toBeInTheDocument()
    expect(price).toHaveClass('text-lg font-bold')
  })

  it('não exibe a categoria quando não fornecida', () => {
    render(<ProductInfo {...mockProps} category="" />)
    
    // Verifica que a categoria não é exibida
    const category = screen.queryByTestId('product-category')
    expect(category).not.toBeInTheDocument()
  })

  it('formata o preço corretamente', () => {
    // Teste com preço inteiro
    const { rerender } = render(<ProductInfo {...mockProps} price={25} />)
    expect(screen.getByText('R$ 25,00')).toBeInTheDocument()
    
    // Teste com preço decimal
    rerender(<ProductInfo {...mockProps} price={25.9} />)
    expect(screen.getByText('R$ 25,90')).toBeInTheDocument()
    
    // Teste com preço com mais de 2 casas decimais
    rerender(<ProductInfo {...mockProps} price={25.999} />)
    expect(screen.getByText('R$ 26,00')).toBeInTheDocument()
  })

  it('exibe descrição truncada quando muito longa', () => {
    const longDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
    
    render(<ProductInfo {...mockProps} description={longDescription} />)
    
    // Verifica se a descrição é truncada
    const description = screen.getByTestId('product-description')
    expect(description).toHaveClass('line-clamp-2')
  })
})
