"use client"

import { useRef, useState, useEffect } from "react"
import { Printer, Download } from "lucide-react"
import { formatCurrency, cleanSizeDisplay } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { jsPDF } from "jspdf"
import type { Order, CartAdditional } from "@/lib/db"
import { getStoreConfig } from "@/lib/db"
import { getSalmoAleatorio } from "@/lib/salmos"

interface OrderLabelPrinterProps {
  order: Order
  onPrintComplete: () => void
}

export default function OrderLabelPrinter({ order, onPrintComplete }: OrderLabelPrinterProps) {
  const printContainerRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [storeName, setStoreName] = useState("Açaí Online")
  const [logoUrl, setLogoUrl] = useState("")
  const [salmo, setSalmo] = useState({ referencia: "", texto: "" })

  // Buscar o nome e logo da loja quando o componente for montado
  useEffect(() => {
    const fetchStoreConfig = async () => {
      try {
        const storeConfig = await getStoreConfig()
        if (storeConfig) {
          if (storeConfig.name) {
            setStoreName(storeConfig.name)
          }
          if (storeConfig.logoUrl) {
            setLogoUrl(storeConfig.logoUrl)
          }
        }
      } catch (error) {
        console.error("Erro ao buscar configurações da loja:", error)
      }
    }

    // Gerar um salmo aleatório
    setSalmo(getSalmoAleatorio())

    fetchStoreConfig()
  }, [])

  // Função para imprimir diretamente na impressora
  const handlePrint = () => {
    if (printContainerRef.current) {
      // Criar um iframe oculto para impressão
      const printIframe = document.createElement("iframe")
      printIframe.style.position = "fixed"
      printIframe.style.right = "0"
      printIframe.style.bottom = "0"
      printIframe.style.width = "0"
      printIframe.style.height = "0"
      printIframe.style.border = "0"

      document.body.appendChild(printIframe)

      // Configurar o conteúdo do iframe
      const printDocument = printIframe.contentWindow?.document
      if (printDocument) {
        printDocument.open()

        // Definir o estilo para impressora térmica (geralmente 80mm de largura)
        printDocument.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Etiqueta de Pedido #${order.id}</title>
              <style>
                @page {
                  size: 80mm auto;
                  margin: 0mm;
                }
                body {
                  font-family: 'Courier New', monospace;
                  width: 72mm;
                  padding: 3mm;
                  margin: 0;
                  font-size: 10pt;
                }
                .header {
                  text-align: center;
                  margin-bottom: 5mm;
                }
                .logo {
                  max-width: 60mm;
                  max-height: 20mm;
                  margin: 0 auto 2mm;
                  display: block;
                }
                .title {
                  font-size: 12pt;
                  font-weight: bold;
                }
                .subtitle {
                  font-size: 10pt;
                }
                .section {
                  margin-bottom: 3mm;
                }
                .section-title {
                  font-weight: bold;
                  border-bottom: 1px solid #000;
                  margin-bottom: 1mm;
                }
                .item {
                  display: flex;
                  justify-content: space-between;
                }
                .additional-status {
                  font-style: italic;
                  margin-left: 5mm;
                  margin-top: 1mm;
                  margin-bottom: 1mm;
                }
                .additional {
                  padding-left: 5mm;
                  font-size: 9pt;
                }
                .divider {
                  border-top: 1px dashed #000;
                  margin: 2mm 0;
                }
                .total {
                  font-weight: bold;
                  text-align: right;
                }
                .footer {
                  text-align: center;
                  margin-top: 5mm;
                  font-size: 9pt;
                }
                .salmo {
                  text-align: center;
                  margin-top: 5mm;
                  font-size: 9pt;
                  font-style: italic;
                  border-top: 1px dashed #000;
                  padding-top: 3mm;
                }
                .salmo-texto {
                  margin-bottom: 1mm;
                }
                .salmo-referencia {
                  font-weight: bold;
                }
              </style>
            </head>
            <body>
              ${printContainerRef.current.innerHTML}
            </body>
          </html>
        `)

        printDocument.close()

        // Imprimir e remover o iframe
        printIframe.contentWindow?.focus()
        printIframe.contentWindow?.print()

        // Remover o iframe após a impressão
        setTimeout(() => {
          document.body.removeChild(printIframe)
          onPrintComplete()
        }, 1000)
      }
    }
  }

  // Função para carregar uma imagem e retornar como base64
  const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous" // Importante para evitar problemas de CORS
      img.onload = () => {
        // Redimensionar a imagem para um tamanho mais adequado
        const maxWidth = 300 // Largura máxima em pixels
        const maxHeight = 150 // Altura máxima em pixels

        let width = img.width
        let height = img.height

        // Redimensionar mantendo a proporção
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/png"))
      }
      img.onerror = (error) => {
        reject(error)
      }
      img.src = url
    })
  }

  // Função para gerar e baixar PDF
  const handleGeneratePDF = async () => {
    if (!printContainerRef.current) return

    try {
      setIsGeneratingPDF(true)

      // Criar um novo documento PDF com tamanho para impressora térmica (80mm de largura)
      // 80mm = aproximadamente 226.8 pontos (80mm * 2.835)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200], // Largura: 80mm, Altura: ajustável (200mm inicial)
      })

      // Configurar fonte
      doc.setFont("courier", "normal")
      doc.setFontSize(10)

      // Margens
      const margin = 5
      let yPos = margin

      // Adicionar logo se disponível
      if (logoUrl) {
        try {
          const logoBase64 = await loadImage(logoUrl)
          // Calcular dimensões para manter a proporção e limitar a largura
          const maxWidth = 30 // Reduzido de 70mm para 30mm
          const imgProps = doc.getImageProperties(logoBase64)
          const imgWidth = Math.min(maxWidth, imgProps.width / (imgProps.width / maxWidth))
          const imgHeight = imgProps.height * (imgWidth / imgProps.width)

          // Centralizar a imagem
          const xPos = (80 - imgWidth) / 2
          doc.addImage(logoBase64, "PNG", xPos, yPos, imgWidth, imgHeight)
          yPos += imgHeight + 5 // Adicionar espaço após a logo
        } catch (error) {
          console.error("Erro ao carregar a logo:", error)
          // Continuar sem a logo
        }
      }

      // Cabeçalho
      doc.setFont("courier", "bold")
      doc.setFontSize(12)
      doc.text(storeName.toUpperCase(), 40, yPos, { align: "center" })
      yPos += 10

      doc.setFontSize(10)
      doc.text(`Pedido #${order.id}`, 40, yPos, { align: "center" })
      yPos += 5

      doc.setFont("courier", "normal")
      doc.text(format(new Date(order.date), "dd/MM/yyyy HH:mm", { locale: ptBR }), 40, yPos, { align: "center" })
      yPos += 10

      // Cliente
      doc.setFont("courier", "bold")
      doc.text("CLIENTE", margin, yPos)
      yPos += 5
      doc.setFont("courier", "normal")
      doc.text(order.customerName, margin, yPos)
      yPos += 5
      doc.text(order.customerPhone, margin, yPos)
      yPos += 10

      // Endereço
      doc.setFont("courier", "bold")
      doc.text("ENDEREÇO", margin, yPos)
      yPos += 5
      doc.setFont("courier", "normal")
      doc.text(`${order.address.street}, ${order.address.number}`, margin, yPos)
      yPos += 5
      doc.text(`Bairro: ${order.address.neighborhood}`, margin, yPos)
      yPos += 5
      if (order.address.complement) {
        doc.text(`Complemento: ${order.address.complement}`, margin, yPos)
        yPos += 5
      }
      yPos += 5

      // Itens
      doc.setFont("courier", "bold")
      doc.text("ITENS", margin, yPos)
      yPos += 5
      doc.setFont("courier", "normal")

      // Calcular a largura disponível para o texto
      const availableWidth = 80 - 2 * margin

      order.items.forEach((item) => {
        // Usar tamanho limpo na impressão
        const cleanedSize = cleanSizeDisplay(item.size)
        const itemText = `${item.quantity}x ${item.name} (${cleanedSize})`
        const priceText = formatCurrency(item.price * item.quantity)

        // Verificar se o texto é muito longo e quebrar em múltiplas linhas se necessário
        if (doc.getTextWidth(itemText) > availableWidth - doc.getTextWidth(priceText) - 5) {
          doc.text(itemText, margin, yPos)
          yPos += 5
          doc.text(priceText, 80 - margin, yPos, { align: "right" })
          yPos += 5
        } else {
          doc.text(itemText, margin, yPos)
          doc.text(priceText, 80 - margin, yPos, { align: "right" })
          yPos += 5
        }

        // Adicionar status de adicionais
        if (item.additionals && item.additionals.length > 0) {
          doc.setFont("courier", "italic")
          doc.text("Com Adicionais:", margin + 3, yPos)
          yPos += 5
          doc.setFont("courier", "normal")

          // Adicionar adicionais do item
          item.additionals.forEach((additional) => {
            const additionalText = `• ${additional.quantity}x ${additional.name}`
            const additionalPriceText = formatCurrency(additional.price * additional.quantity)

            doc.text(additionalText, margin + 5, yPos)
            doc.text(additionalPriceText, 80 - margin, yPos, { align: "right" })
            yPos += 4
          })
        } else {
          doc.setFont("courier", "italic")
          doc.text("Sem Adicionais:", margin + 3, yPos)
          yPos += 5
          doc.setFont("courier", "normal")
        }

        yPos += 3 // Espaço extra após cada item
      })

      yPos += 5

      // Linha divisória
      doc.setDrawColor(0)
      doc.setLineDashPattern([1, 1], 0)
      doc.line(margin, yPos, 80 - margin, yPos)
      yPos += 5

      // Totais
      doc.text("Subtotal:", margin, yPos)
      doc.text(formatCurrency(order.subtotal), 80 - margin, yPos, { align: "right" })
      yPos += 5

      doc.text("Taxa de entrega:", margin, yPos)
      doc.text(formatCurrency(order.deliveryFee), 80 - margin, yPos, { align: "right" })
      yPos += 5

      doc.setFont("courier", "bold")
      doc.text("TOTAL:", margin, yPos)
      doc.text(formatCurrency(order.total), 80 - margin, yPos, { align: "right" })
      yPos += 10

      // Forma de pagamento
      doc.setFont("courier", "bold")
      doc.text("PAGAMENTO", margin, yPos)
      yPos += 5
      doc.setFont("courier", "normal")
      doc.text(order.paymentMethod === "pix" ? "PIX" : "Cartão na Entrega", margin, yPos)
      yPos += 10

      // Rodapé
      doc.setFont("courier", "normal")
      doc.setFontSize(9)
      doc.text("Obrigado pela preferência!", 40, yPos, { align: "center" })
      yPos += 10

      // Adicionar salmo
      doc.setDrawColor(0)
      doc.setLineDashPattern([1, 1], 0)
      doc.line(margin, yPos, 80 - margin, yPos)
      yPos += 5

      // Quebrar o texto do salmo em múltiplas linhas se necessário
      const maxLineWidth = 70 // 70mm de largura máxima para o texto
      const salmoTexto = doc.splitTextToSize(salmo.texto, maxLineWidth)

      doc.setFont("courier", "italic")
      doc.setFontSize(8)

      // Centralizar cada linha do texto do salmo
      salmoTexto.forEach((linha: string) => {
        doc.text(linha, 40, yPos, { align: "center" })
        yPos += 4
      })

      // Adicionar a referência do salmo
      doc.setFont("courier", "bold")
      doc.text(salmo.referencia, 40, yPos, { align: "center" })

      // Salvar o PDF
      doc.save(`pedido-${order.id}.pdf`)

      // Marcar como impresso após gerar o PDF
      onPrintComplete()
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      alert("Erro ao gerar PDF. Tente novamente.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div>
      <div className="mb-4 border rounded-lg p-4 max-h-96 overflow-auto">
        <div ref={printContainerRef} className="thermal-receipt">
          <div className="header">
            {logoUrl && (
              <img
                src={logoUrl || "/placeholder.svg"}
                alt={`Logo ${storeName}`}
                className="logo"
                style={{
                  maxWidth: "40mm", // Reduzido de 60mm para 40mm
                  maxHeight: "15mm", // Reduzido de 20mm para 15mm
                  margin: "0 auto 8px",
                  display: "block",
                }}
              />
            )}
            <div className="title">{storeName.toUpperCase()}</div>
            <div className="subtitle">Pedido #{order.id}</div>
            <div className="subtitle">{format(new Date(order.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
          </div>

          <div className="section">
            <div className="section-title">CLIENTE</div>
            <div>{order.customerName}</div>
            <div>{order.customerPhone}</div>
          </div>

          <div className="section">
            <div className="section-title">ENDEREÇO</div>
            <div>
              {order.address.street}, {order.address.number}
            </div>
            <div>Bairro: {order.address.neighborhood}</div>
            {order.address.complement && <div>Complemento: {order.address.complement}</div>}
          </div>

          <div className="section">
            <div className="section-title">ITENS</div>
            {order.items.map((item, index) => (
              <div key={index} style={{ marginBottom: "8px" }}>
                <div className="item">
                  <div>
                    {item.quantity}x {item.name} ({cleanSizeDisplay(item.size)})
                  </div>
                  <div>{formatCurrency(item.price * item.quantity)}</div>
                </div>

                {/* Indicar se tem ou não adicionais */}
                {item.additionals && item.additionals.length > 0 ? (
                  <>
                    {/* Agrupamento de adicionais por categoria */}
                    {(() => {
                      // Agrupar adicionais por categoria
                      const groupedByCategory: Record<string, typeof item.additionals> = {};
                      
                      item.additionals.forEach((additional) => {
                        const categoryName = additional.categoryName || "Outros";
                        if (!groupedByCategory[categoryName]) {
                          groupedByCategory[categoryName] = [];
                        }
                        groupedByCategory[categoryName].push(additional);
                      });
                      
                      // Renderizar os grupos de categorias
                      return Object.entries(groupedByCategory).map(([categoryName, additionals]) => (
                        <div key={`${item.name}-${categoryName}`} className="mb-2">
                          <div className="additional-status">{categoryName}</div>
                          {additionals.map((additional, idx) => (
                            <div key={idx} className="item additional">
                              <div>
                                • {additional.quantity}x {additional.name}
                              </div>
                              <div>{formatCurrency(additional.price * additional.quantity)}</div>
                            </div>
                          ))}
                        </div>
                      ));
                    })()}
                  </>
                ) : (
                  <div className="additional-status">Sem Complementos Premium</div>
                )}
              </div>
            ))}
          </div>

          <div className="divider"></div>

          <div className="section">
            <div className="item">
              <div>Subtotal:</div>
              <div>{formatCurrency(order.subtotal)}</div>
            </div>
            <div className="item">
              <div>Taxa de entrega:</div>
              <div>{formatCurrency(order.deliveryFee)}</div>
            </div>
            <div className="item total">
              <div>TOTAL:</div>
              <div>{formatCurrency(order.total)}</div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">PAGAMENTO</div>
            <div>{order.paymentMethod === "pix" ? "PIX" : "Cartão na Entrega"}</div>
          </div>

          <div className="footer">Obrigado pela preferência!</div>

          {/* Adicionar salmo */}
          <div className="salmo">
            <div className="salmo-texto">{salmo.texto}</div>
            <div className="salmo-referencia">{salmo.referencia}</div>
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={handlePrint}
          className="flex-1 bg-purple-700 hover:bg-purple-800 text-white py-2 rounded-md flex items-center justify-center"
        >
          <Printer size={18} className="mr-2" />
          Imprimir
        </button>

        <button
          onClick={handleGeneratePDF}
          disabled={isGeneratingPDF}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md flex items-center justify-center"
        >
          <Download size={18} className="mr-2" />
          {isGeneratingPDF ? "Gerando..." : "Salvar PDF"}
        </button>
      </div>
    </div>
  )
}
