import type { Metadata } from "next"
import { getActiveProducts } from "@/lib/services/product-service"
import { getActiveCategories } from "@/lib/services/category-service"
import { getStoreConfig } from "@/lib/services/store-config-service"
import ProductList from "@/components/product-list"
import Image from "next/image"
import Link from "next/link"

// Gerar metadados para a página
export async function generateMetadata(): Promise<Metadata> {
  const storeConfig = await getStoreConfig()

  return {
    title: `Vitrine de Produtos - ${storeConfig?.name || "Açaí Online"}`,
    description: "Confira nossos deliciosos produtos de açaí. Peça agora mesmo!",
    openGraph: {
      title: `Vitrine de Produtos - ${storeConfig?.name || "Açaí Online"}`,
      description: "Confira nossos deliciosos produtos de açaí. Peça agora mesmo!",
      images: [
        {
          url: storeConfig?.logoUrl || "/acai-logo.png",
          width: 1200,
          height: 630,
          alt: storeConfig?.name || "Açaí Online",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Vitrine de Produtos - ${storeConfig?.name || "Açaí Online"}`,
      description: "Confira nossos deliciosos produtos de açaí. Peça agora mesmo!",
      images: [storeConfig?.logoUrl || "/acai-logo.png"],
    },
  }
}

export default async function VitrinePage() {
  const products = await getActiveProducts()
  const categories = await getActiveCategories()
  const storeConfig = await getStoreConfig()

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white">
      {/* Cabeçalho da vitrine */}
      <header className="bg-purple-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {storeConfig?.logoUrl && (
              <div className="relative w-12 h-12 mr-3">
                <Image
                  src={storeConfig.logoUrl || "/placeholder.svg"}
                  alt={storeConfig.name || "Açaí Online"}
                  fill
                  className="object-contain rounded-full bg-white p-1"
                />
              </div>
            )}
            <h1 className="text-2xl font-bold">{storeConfig?.name || "Açaí Online"}</h1>
          </div>
          <Link
            href="/"
            className="bg-white text-purple-600 px-4 py-2 rounded-full font-medium hover:bg-purple-50 transition-colors"
          >
            Fazer Pedido
          </Link>
        </div>
      </header>

      {/* Conteúdo da vitrine */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center mb-8 text-purple-800">Nossos Produtos</h2>

        <ProductList products={products} categories={categories} />

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-full font-medium text-lg hover:bg-purple-700 transition-colors shadow-md"
          >
            Ver Cardápio Completo e Fazer Pedido
          </Link>
        </div>
      </div>

      {/* Rodapé da vitrine */}
      <footer className="bg-purple-600 text-white p-4 mt-10">
        <div className="container mx-auto text-center">
          <p>
            © {new Date().getFullYear()} {storeConfig?.name || "Açaí Online"}
          </p>
          <p className="text-sm mt-1">Clique no botão acima para fazer seu pedido!</p>
        </div>
      </footer>
    </div>
  )
}
