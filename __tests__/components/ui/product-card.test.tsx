import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from '@/lib/components/ui/product-card'

// Mock do componente Image do Next.js
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} src={props.src} alt={props.alt} />
  },
}))

describe('ProductCard', () => {
  const defaultProps = {
    title: 'Açaí 500ml',
    description: 'Açaí cremoso com granola',
    price: 15.9,
    image: '/images/acai.jpg',
  }

  it('renderiza corretamente com as propriedades básicas', () => {
    render(<ProductCard {...defaultProps} />)
    
    expect(screen.getByText('Açaí 500ml')).toBeInTheDocument()
    expect(screen.getByText('Açaí cremoso com granola')).toBeInTheDocument()
    expect(screen.getByAltText('Açaí 500ml')).toBeInTheDocument()
  })

  it('renderiza badges quando fornecidas', () => {
    render(<ProductCard {...defaultProps} badges={['Novo', 'Promoção']} />)
    
    expect(screen.getByText('Novo')).toBeInTheDocument()
    expect(screen.getByText('Promoção')).toBeInTheDocument()
  })

  it('chama a função onClick quando clicado', () => {
    const handleClick = jest.fn()
    render(<ProductCard {...defaultProps} onClick={handleClick} />)
    
    fireEvent.click(screen.getByText('Açaí 500ml'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('não chama a função onClick quando desabilitado', () => {
    const handleClick = jest.fn()
    render(<ProductCard {...defaultProps} onClick={handleClick} disabled />)
    
    fireEvent.click(screen.getByText('Açaí 500ml'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('chama a função onAddToCart quando o botão de adicionar ao carrinho é clicado', () => {
    const handleAddToCart = jest.fn()
    render(<ProductCard {...defaultProps} onAddToCart={handleAddToCart} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleAddToCart).toHaveBeenCalledTimes(1)
  })

  it('não exibe o botão de adicionar ao carrinho quando showAddToCartButton é false', () => {
    render(<ProductCard {...defaultProps} showAddToCartButton={false} />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('não exibe o preço quando showPrice é false', () => {
    const { container } = render(<ProductCard {...defaultProps} showPrice={false} />)
    
    // Verificar se o formatCurrency(15.9) não está presente
    expect(container.textContent).not.toContain('R$ 15,90')
  })

  it('renderiza conteúdo adicional quando children é fornecido', () => {
    render(
      <ProductCard {...defaultProps}>
        <div data-testid="additional-content">Conteúdo adicional</div>
      </ProductCard>
    )
    
    expect(screen.getByTestId('additional-content')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo adicional')).toBeInTheDocument()
  })
})
