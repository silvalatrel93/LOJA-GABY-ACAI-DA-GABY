import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    {
      name: "Açaí Online - Admin",
      short_name: "Açaí Admin",
      description: "Painel administrativo para gerenciar sua loja de açaí",
      start_url: "/admin",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#9333ea",
      icons: [
        {
          src: "/icons/icon-192x192",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/icons/icon-512x512",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  )
}
