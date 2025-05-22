// Adiciona as extensões de teste do Jest para React
import '@testing-library/jest-dom'

// Mock para o Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, fill, className }) => {
    return <img src={src} alt={alt} className={className} style={fill ? { objectFit: 'cover' } : {}} data-testid="next-image" />
  },
}))

// Mock para o Next.js Router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  }),
}))
