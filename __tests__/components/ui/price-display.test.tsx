import React from 'react'
import { render, screen } from '@testing-library/react'
import { PriceDisplay } from '@/lib/components/ui/price-display'
import { formatCurrency } from '@/lib/utils'

describe('PriceDisplay', () => {
  it('renderiza corretamente o preço formatado', () => {
    const price = 29.9
    render(<PriceDisplay price={price} />)
    expect(screen.getByText(formatCurrency(price))).toBeInTheDocument()
  })

  it('renderiza o texto "Grátis" quando o preço é zero', () => {
    render(<PriceDisplay price={0} />)
    expect(screen.getByText('Grátis')).toBeInTheDocument()
  })

  it('renderiza o texto personalizado quando o preço é zero e freeText é fornecido', () => {
    render(<PriceDisplay price={0} freeText="Gratuito" />)
    expect(screen.getByText('Gratuito')).toBeInTheDocument()
  })

  it('renderiza o prefixo quando showPrefix=true', () => {
    render(<PriceDisplay price={29.9} showPrefix={true} />)
    expect(screen.getByText('A PARTIR DE')).toBeInTheDocument()
  })

  it('renderiza o prefixo personalizado quando fornecido', () => {
    render(<PriceDisplay price={29.9} showPrefix={true} prefixText="APENAS" />)
    expect(screen.getByText('APENAS')).toBeInTheDocument()
  })

  it('aplica a variante correta', () => {
    const { container } = render(<PriceDisplay price={29.9} variant="large" />)
    const priceElement = screen.getByText(formatCurrency(29.9))
    expect(priceElement).toHaveClass('text-lg')
  })

  it('aplica classes adicionais quando fornecidas', () => {
    const { container } = render(<PriceDisplay price={29.9} className="test-class" />)
    expect(container.firstChild).toHaveClass('test-class')
  })
})
