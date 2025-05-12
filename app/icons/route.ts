import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { pathname } = new URL(request.url)

  // Extrair o tamanho do ícone da URL
  const size = pathname.includes("192x192") ? 192 : 512

  // Criar um canvas para gerar o ícone
  const canvas = new OffscreenCanvas(size, size)
  const ctx = canvas.getContext("2d")

  if (ctx) {
    // Desenhar um fundo roxo
    ctx.fillStyle = "#9333ea"
    ctx.fillRect(0, 0, size, size)

    // Desenhar um círculo branco no centro
    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 3, 0, 2 * Math.PI)
    ctx.fill()

    // Desenhar as letras "AÇ" no centro
    ctx.fillStyle = "#9333ea"
    ctx.font = `bold ${size / 3}px Arial`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("AÇ", size / 2, size / 2)

    // Converter o canvas para blob
    const blob = await canvas.convertToBlob({
      type: "image/png",
      quality: 1,
    })

    // Converter o blob para array buffer
    const arrayBuffer = await blob.arrayBuffer()

    // Retornar a imagem como resposta
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  }

  // Fallback se algo der errado
  return new NextResponse(null, { status: 404 })
}
