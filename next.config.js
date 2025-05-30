/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações opcionais do Next.js
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'your-supabase-url.supabase.co'], // Adicione aqui os domínios das imagens
  },
  // Habilita o output estático para facilitar o deploy
  output: 'standalone',
  eslint: {
    // Permite que o build de produção passe mesmo com erros de ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permite que o build de produção passe mesmo com erros de TypeScript
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
