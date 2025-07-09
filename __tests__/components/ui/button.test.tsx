import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/lib/components/ui/button'

describe('Button', () => {
  it('renderiza corretamente com texto', () => {
    render(<Button>Teste</Button>)
    expect(screen.getByText('Teste')).toBeInTheDocument()
  })

  it('aplica a variante correta', () => {
    const { container } = render(<Button variant="primary">Teste</Button>)
    expect(container.firstChild).toHaveClass('bg-gradient-to-r')
    expect(container.firstChild).toHaveClass('from-purple-500')
  })

  it('aplica o tamanho correto', () => {
    const { container } = render(<Button size="sm">Teste</Button>)
    expect(container.firstChild).toHaveClass('py-1')
    expect(container.firstChild).toHaveClass('px-2')
  })

  it('renderiza o ícone quando fornecido', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>
    render(<Button icon={<TestIcon />}>Teste</Button>)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('desabilita o botão quando disabled=true', () => {
    render(<Button disabled>Teste</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toHaveClass('opacity-50')
    expect(screen.getByRole('button')).toHaveClass('cursor-not-allowed')
  })

  it('chama a função onClick quando clicado', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Teste</Button>)
    fireEvent.click(screen.getByText('Teste'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('não chama a função onClick quando desabilitado', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick} disabled>Teste</Button>)
    fireEvent.click(screen.getByText('Teste'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('aplica classes adicionais quando fornecidas', () => {
    const { container } = render(<Button className="test-class">Teste</Button>)
    expect(container.firstChild).toHaveClass('test-class')
  })
})
