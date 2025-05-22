import { render, screen, fireEvent } from '@testing-library/react'
import { ProductImage } from '@/components/product-card/product-image'

describe('ProductImage', () => {
  const mockProps = {
    image: '/test-image.jpg',
    alt: 'Teste de Imagem',
    onOpenViewer: jest.fn(),
    size: 'small' as const
  }

  it('renderiza a imagem corretamente', () => {
    render(<ProductImage {...mockProps} />)
    
    const imageContainer = screen.getByTestId('next-image')
    expect(imageContainer).toBeInTheDocument()
    expect(imageContainer).toHaveAttribute('src', '/test-image.jpg')
    expect(imageContainer).toHaveAttribute('alt', 'Teste de Imagem')
  })

  it('chama a função onOpenViewer quando o botão é clicado', () => {
    render(<ProductImage {...mockProps} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockProps.onOpenViewer).toHaveBeenCalledTimes(1)
  })

  it('aplica classes diferentes baseado no tamanho', () => {
    // Teste para tamanho small
    const { rerender } = render(<ProductImage {...mockProps} size="small" />)
    let container = screen.getByTestId('product-image-container')
    expect(container).toHaveClass('h-36')
    
    // Teste para tamanho large
    rerender(<ProductImage {...mockProps} size="large" />)
    container = screen.getByTestId('product-image-container')
    expect(container).toHaveClass('h-48')
    expect(container).toHaveClass('rounded-lg')
    expect(container).toHaveClass('overflow-hidden')
    expect(container).toHaveClass('mb-4')
  })

  it('usa imagem placeholder quando nenhuma imagem é fornecida', () => {
    render(<ProductImage {...mockProps} image="" />)
    
    const imageContainer = screen.getByTestId('next-image')
    expect(imageContainer).toHaveAttribute('src', '/placeholder.svg')
  })
})
