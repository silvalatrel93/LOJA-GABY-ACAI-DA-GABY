import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vitrine de Produtos - Açaí Online",
  description: "Confira nossos deliciosos produtos de açaí e faça seu pedido!",
  openGraph: {
    title: "Açaí Online - Produtos Deliciosos",
    description: "Confira nossa variedade de açaí e faça seu pedido agora!",
    images: ["/acai-bowl-special.png"],
    type: "website",
  },
}

export default function VitrineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
