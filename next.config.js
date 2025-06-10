/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações opcionais do Next.js
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'vercel.app', 'i.postimg.cc', 'www.dijosdoces.com.br'],
  },
  // Habilita o output estático para facilitar o deploy
  eslint: {
    // Permite que o build de produção passe mesmo com erros de ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permite que o build de produção passe mesmo com erros de TypeScript
    ignoreBuildErrors: true,
  },
  distDir: '.next',
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'vercel.app'],
    },
  },
}

module.exports = nextConfig
