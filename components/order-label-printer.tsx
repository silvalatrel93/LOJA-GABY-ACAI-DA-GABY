"use client"

import { useRef, useState, useEffect } from "react"
import { Printer, Download } from "lucide-react"
import { formatCurrency, cleanSizeDisplay } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { jsPDF } from "jspdf"
import type { Order, Additional } from "@/lib/db"
import { getStoreConfig } from "@/lib/db"
import { getSalmoAleatorio } from "@/lib/salmos"

interface OrderLabelPrinterProps {
  order: Order
  onPrintComplete: () => void
}

// Largura configurável da etiqueta (80mm ou 58mm são os padrões de impressora térmica)
const LABEL_WIDTH_MM = 80 // Configurado para MP-4200 TH (58-82.5mm)

export default function OrderLabelPrinter({ order, onPrintComplete }: OrderLabelPrinterProps) {
  const printContainerRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [storeName, setStoreName] = useState("Açaí Online")
  const [logoUrl, setLogoUrl] = useState("")
  const [salmo, setSalmo] = useState({ referencia: "", texto: "" })

  const [isLogoReady, setIsLogoReady] = useState(false)
  const [logoError, setLogoError] = useState(false)

  // Buscar o nome e logo da loja quando o componente for montado
  useEffect(() => {
    let isMounted = true;
    
    const fetchStoreConfig = async () => {
      try {
        const storeConfig = await getStoreConfig()
        if (!isMounted) return;
        
        if (storeConfig) {
          if (storeConfig.name) {
            setStoreName(storeConfig.name)
          }
          if (storeConfig.logoUrl) {
            // Pré-carregar a imagem para garantir que esteja disponível
            const img = new Image()
            
            // Configurar um timeout para evitar espera infinita
            const timeoutId = setTimeout(() => {
              if (isMounted) {
                console.log("Timeout ao carregar a logo")
                setLogoError(true)
                setLogoUrl("")
                setIsLogoReady(true)
              }
            }, 2000) // Timeout de 2 segundos
            
            img.onload = () => {
              if (!isMounted) return;
              clearTimeout(timeoutId);
              setLogoUrl(storeConfig.logoUrl)
              setIsLogoReady(true)
              setLogoError(false)
            }
            
            img.onerror = () => {
              if (!isMounted) return;
              clearTimeout(timeoutId);
              console.error("Erro ao carregar a logo")
              setLogoError(true)
              setLogoUrl("")
              setIsLogoReady(true)
            }
            
            // Iniciar o carregamento após configurar os event listeners
            img.src = storeConfig.logoUrl
            
            // Forçar o início do carregamento (útil para cache)
            if (img.complete) {
              img.onload(null as any);
            }
          } else {
            setIsLogoReady(true) // Nenhuma logo para carregar
          }
        } else {
          setIsLogoReady(true) // Nenhuma configuração encontrada
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Erro ao buscar configurações da loja:", error)
        setLogoError(true)
        setIsLogoReady(true) // Continuar mesmo com erro
      }
    }
    
    fetchStoreConfig()
    
    return () => {
      isMounted = false;
    }

    // Gerar um salmo aleatório
    setSalmo(getSalmoAleatorio())

    fetchStoreConfig()
  }, [])

  // Função para normalizar texto especificamente para impressão térmica
  const normalizeForThermalPrint = (text: string): string => {
    if (!text) return '';
    
    return text
      // Converter para string se não for
      .toString()
      // Remover caracteres especiais que causam problemas na impressão térmica
      .replace(/[áàâãä]/gi, 'A')
      .replace(/[éèêë]/gi, 'E') 
      .replace(/[íìîï]/gi, 'I')
      .replace(/[óòôõö]/gi, 'O')
      .replace(/[úùûü]/gi, 'U')
      .replace(/ç/gi, 'C')
      .replace(/ñ/gi, 'N')
      // Substituir bullet points e símbolos especiais
      .replace(/[•·‧∙]/g, '-') // Bullet points viram hífen
      .replace(/[★☆]/g, '*') // Estrelas viram asterisco
      // Remover aspas especiais
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Remover hífens especiais
      .replace(/[–—]/g, '-')
      // Converter outros símbolos problemáticos
      .replace(/…/g, '...')
      .replace(/°/g, 'o')
      .replace(/²/g, '2')
      .replace(/³/g, '3')
      .replace(/ª/g, 'a')
      .replace(/º/g, 'o')
      // Remover caracteres de controle e não imprimíveis
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      // Normalizar espaços múltiplos
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Função para formatar linha de adicional com espaçamento adequado
  const formatAdditionalLine = (quantity: number, name: string, price: number): string => {
    const normalizedName = normalizeForThermalPrint(name);
    const itemText = `+ ${quantity}x ${normalizedName}`; // Alterado de - para +
    const priceText = formatCurrency(price * quantity);
    
    // Calcular quantos caracteres cabem em 80mm (aproximadamente 42 caracteres para Courier New 10pt)
    const maxWidth = 42;
    const spacesNeeded = maxWidth - itemText.length - priceText.length;
    const spaces = spacesNeeded > 3 ? ' '.repeat(spacesNeeded) : '   '; // Mínimo 3 espaços
    
    return `${itemText}${spaces}${priceText}`;
  };

  // Função para formatar linha de item principal com espaçamento adequado
  const formatItemLine = (quantity: number, name: string, size: string, price: number): string => {
    const normalizedName = normalizeForThermalPrint(name);
    const cleanedSize = cleanSizeDisplay(size);
    const itemText = `${quantity}x ${normalizedName}: (${cleanedSize})`;
    const priceText = formatCurrency(price * quantity);
    
    // Calcular quantos caracteres cabem em 80mm (aproximadamente 42 caracteres para Courier New 10pt)
    const maxWidth = 42;
    const spacesNeeded = maxWidth - itemText.length - priceText.length;
    const spaces = spacesNeeded > 3 ? ' '.repeat(spacesNeeded) : '   '; // Mínimo 3 espaços
    
    return `${itemText}${spaces}${priceText}`;
  };

  // Função para imprimir diretamente na impressora
  const handlePrint = () => {
    if (!isLogoReady) {
      // Se a logo ainda não estiver pronta, tente novamente em breve
      setTimeout(handlePrint, 100)
      return
    }
    if (printContainerRef.current) {
      // Processar o conteúdo para normalizar caracteres antes da impressão
      let processedContent = printContainerRef.current.innerHTML;
      
      // Normalizar especificamente o nome da loja
      const normalizedStoreName = normalizeForThermalPrint(storeName);
      
      // Substituir o nome da loja no conteúdo
      processedContent = processedContent
        .replace(new RegExp(storeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), normalizedStoreName)
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        .replace(/[–—]/g, '-')
        .replace(/…/g, '...')
        .replace(/°/g, 'o')
        .replace(/²/g, '2')
        .replace(/³/g, '3');

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

        // Definir o estilo para impressora térmica (largura configurável)
        printDocument.write(`
          <!DOCTYPE html>
          <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Etiqueta de Pedido #${order.id}</title>
              <style>
                /* Configurações globais para impressão térmica */
                * {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  box-sizing: border-box;
                }
                
                @page {
                  size: ${LABEL_WIDTH_MM}mm auto;
                  margin: 0mm;
                }
                
                @media print {
                  * {
                    -webkit-font-smoothing: none !important;
                    -moz-osx-font-smoothing: unset !important;
                    font-smoothing: none !important;
                    text-rendering: optimizeSpeed !important;
                  }
                }
                
                body {
                  font-family: 'Courier New', 'Liberation Mono', 'DejaVu Sans Mono', 'Consolas', monospace;
                  width: ${LABEL_WIDTH_MM - 8}mm;
                  padding: 3mm;
                  margin: 0;
                  font-size: 10pt;
                  font-variant: normal;
                  font-weight: normal;
                  text-rendering: optimizeSpeed;
                  -webkit-font-smoothing: none;
                  -moz-osx-font-smoothing: unset;
                  font-smoothing: none;
                  letter-spacing: 0;
                  word-spacing: 0;
                  line-height: 1.2;
                  word-break: break-word;
                  font-feature-settings: "kern" 0, "liga" 0;
                }
                .header {
                  text-align: center;
                  margin-bottom: 5mm;
                }
                .logo {
                  max-width: ${LABEL_WIDTH_MM - 20}mm;
                  max-height: 18mm;
                  margin: 0 auto 3mm;
                  display: block;
                }
                .title {
                  font-size: 12pt;
                  font-weight: bold;
                  margin-bottom: 1.5mm;
                }
                .subtitle {
                  font-size: 10pt;
                  margin-bottom: 1mm;
                }
                .section {
                  margin-bottom: 3mm;
                }
                .section-title {
                  font-weight: bold;
                  border-bottom: 1px solid #000;
                  margin-bottom: 1.5mm;
                  font-size: 10pt;
                  font-family: Arial, sans-serif !important;
                  text-transform: uppercase;
                }
                .item {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 1mm;
                  font-size: 9pt;
                }
                .additional-status {
                  font-style: italic;
                  margin-left: 4mm;
                  margin-top: 1mm;
                  margin-bottom: 1mm;
                  font-size: 9pt;
                }
                .additional {
                  font-family: 'Courier New', 'Liberation Mono', 'DejaVu Sans Mono', 'Consolas', monospace;
                  font-size: 8pt;
                  font-weight: normal;
                  font-variant: normal;
                  margin-left: 4mm;
                  margin-bottom: 1mm;
                  padding-left: 0;
                  white-space: pre;
                  word-break: keep-all;
                  letter-spacing: 0;
                  word-spacing: 0;
                  text-rendering: optimizeSpeed;
                }
                .divider {
                  border-top: 1px dashed #000;
                  margin: 3mm 0;
                }
                .total {
                  font-weight: bold;
                  font-size: 10pt;
                  font-variant: normal;
                }
                .footer {
                  text-align: center;
                  margin-top: 4mm;
                  font-size: 9pt;
                  font-variant: normal;
                }
                .salmo {
                  text-align: center;
                  margin-top: 4mm;
                  font-size: 8pt;
                  font-style: italic;
                  font-variant: normal;
                  border-top: 1px dashed #000;
                  padding-top: 3mm;
                }
                .salmo-texto {
                  margin-bottom: 1.5mm;
                  line-height: 1.1;
                  font-variant: normal;
                }
                .salmo-referencia {
                  font-weight: bold;
                  font-size: 7pt;
                  font-variant: normal;
                }
                .item-formatted {
                  font-family: 'Courier New', 'Liberation Mono', 'DejaVu Sans Mono', 'Consolas', monospace;
                  font-size: 9pt;
                  font-weight: normal;
                  font-variant: normal;
                  margin-bottom: 2mm;
                  white-space: pre;
                  word-break: keep-all;
                  letter-spacing: 0;
                  word-spacing: 0;
                  text-rendering: optimizeSpeed;
                }
                .items-spacing {
                  margin-bottom: 4mm;
                }
              </style>
            </head>
            <body>
              ${processedContent}
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

      // Criar um novo documento PDF com tamanho para impressora térmica (largura configurável)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [LABEL_WIDTH_MM, 200], // Largura configurável
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
          const maxWidth = LABEL_WIDTH_MM * 0.4 // 40% da largura
          const imgProps = doc.getImageProperties(logoBase64)
          const imgWidth = Math.min(maxWidth, imgProps.width / (imgProps.width / maxWidth))
          const imgHeight = imgProps.height * (imgWidth / imgProps.width)

          // Centralizar a imagem
          const xPos = (LABEL_WIDTH_MM - imgWidth) / 2
          doc.addImage(logoBase64, "PNG", xPos, yPos, imgWidth, imgHeight)
          yPos += imgHeight + 5 // Adicionar espaço após a logo
        } catch (error) {
          console.error("Erro ao carregar a logo:", error)
          // Continuar sem a logo
        }
      }

      // Configurar fonte com suporte a caracteres especiais
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      // Cabeçalho
      doc.text(storeName.toUpperCase(), LABEL_WIDTH_MM / 2, yPos, { align: "center" })
      yPos += 10

      doc.setFontSize(10)
      doc.text(`Pedido #${order.id}`, LABEL_WIDTH_MM / 2, yPos, { align: "center" })
      yPos += 5

      doc.setFont("courier", "normal")
      doc.text(format(new Date(order.date), "dd/MM/yyyy HH:mm", { locale: ptBR }), LABEL_WIDTH_MM / 2, yPos, { align: "center" })
      yPos += 10

      // Cliente
      doc.setFont("courier", "bold")
      doc.text("CLIENTE", margin, yPos)
      yPos += 5
      doc.setFont("courier", "normal")
      doc.text(normalizeForThermalPrint(order.customerName), margin, yPos)
      yPos += 5
      doc.text(order.customerPhone, margin, yPos)
      yPos += 10

      // Endereço
      doc.setFont("helvetica", "bold")
      doc.text("ENDEREÇO", margin, yPos)
      yPos += 5
      doc.setFont("courier", "normal")
      doc.text(`${normalizeForThermalPrint(order.address.street)}, ${order.address.number}`, margin, yPos)
      yPos += 5
      doc.text(`Bairro: ${normalizeForThermalPrint(order.address.neighborhood)}`, margin, yPos)
      yPos += 5
      if (order.address.complement) {
        doc.text(`Complemento: ${normalizeForThermalPrint(order.address.complement)}`, margin, yPos)
        yPos += 5
      }
      yPos += 5

      // Itens
      doc.setFont("courier", "bold")
      doc.text("ITENS", margin, yPos)
      yPos += 5
      doc.setFont("courier", "normal")

      // Calcular a largura disponível para o texto
      const availableWidth = LABEL_WIDTH_MM - 2 * margin

      order.items.forEach((item) => {
        // Usar a nova formatação de linha
        const formattedItemLine = formatItemLine(item.quantity, item.name, item.size, item.price)
        doc.text(formattedItemLine, margin, yPos)
        yPos += 5

        // Adicionar status de adicionais
        if (item.additionals && item.additionals.length > 0) {
          doc.setFont("courier", "italic")
          doc.text("Adicionais Complementos:", margin + 3, yPos)
          yPos += 5
          doc.setFont("courier", "normal")

          // Adicionar adicionais do item
          item.additionals.forEach((additional) => {
            const formattedLine = formatAdditionalLine(additional.quantity ?? 1, additional.name, additional.price)
            doc.text(formattedLine, margin + 5, yPos)
            yPos += 4
          })
        }

        yPos += 3 // Espaço extra após cada item
      })

      yPos += 5

      // Linha divisória
      doc.setDrawColor(0)
      doc.setLineDashPattern([1, 1], 0)
      doc.line(margin, yPos, LABEL_WIDTH_MM - margin, yPos)
      yPos += 5

      // Espaçamento adicional de 1 linha entre divider e subtotal  
      yPos += 5

      // Totais
      doc.text("Subtotal:", margin, yPos)
      doc.text(formatCurrency(order.subtotal), LABEL_WIDTH_MM - margin, yPos, { align: "right" })
      yPos += 5

      doc.text("Taxa de entrega:", margin, yPos)
      doc.text(formatCurrency(order.deliveryFee), LABEL_WIDTH_MM - margin, yPos, { align: "right" })
      yPos += 5

      doc.setFont("courier", "bold")
      doc.text("TOTAL:", margin, yPos)
      doc.text(formatCurrency(order.total), LABEL_WIDTH_MM - margin, yPos, { align: "right" })
      yPos += 10

      // Forma de pagamento
      doc.setFont("courier", "normal")
      const paymentText = `Forma de pagamento: ${order.paymentMethod === "pix" ? "PIX" : "Cartão na Entrega"}`
      doc.text(normalizeForThermalPrint(paymentText), margin, yPos)
      yPos += 10

      // Rodapé
      doc.setFont("courier", "normal")
      doc.setFontSize(9)
      doc.text("Obrigado pela preferencia!", LABEL_WIDTH_MM / 2, yPos, { align: "center" })
      yPos += 10

      // Adicionar salmo
      doc.setDrawColor(0)
      doc.setLineDashPattern([1, 1], 0)
      doc.line(margin, yPos, LABEL_WIDTH_MM - margin, yPos)
      yPos += 5

      // Quebrar o texto do salmo em múltiplas linhas se necessário
      const maxLineWidth = LABEL_WIDTH_MM - 10 // largura máxima para o texto
      const salmoTexto = doc.splitTextToSize(normalizeForThermalPrint(salmo.texto), maxLineWidth)

      doc.setFont("courier", "italic")
      doc.setFontSize(8)

      // Centralizar cada linha do texto do salmo
      salmoTexto.forEach((linha: string) => {
        doc.text(linha, LABEL_WIDTH_MM / 2, yPos, { align: "center" })
        yPos += 4
      })

      // Adicionar a referência do salmo
      doc.setFont("courier", "bold")
      doc.text(normalizeForThermalPrint(salmo.referencia), LABEL_WIDTH_MM / 2, yPos, { align: "center" })

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
            {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo ${storeName}`}
              className="logo"
              style={{
                maxWidth: `${LABEL_WIDTH_MM - 20}mm`,
                maxHeight: "18mm",
                margin: "0 auto 3mm",
                display: "block",
              }}
              onError={(e) => {
                // Se a imagem falhar ao carregar, remova o src para evitar tentativas repetidas
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : !logoError && (
            // Mostrar placeholder enquanto carrega (se não houver erro)
            <div 
              className="logo-placeholder" 
              style={{
                width: `${LABEL_WIDTH_MM - 20}mm`,
                height: "18mm",
                margin: "0 auto 3mm",
                backgroundColor: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                fontSize: "10px"
              }}
            >
              {isLogoReady ? "Sem logo configurada" : "Carregando..."}
            </div>
          )}
            <div className="title">{normalizeForThermalPrint(storeName).toUpperCase()}</div>
            <div className="subtitle">Pedido #{order.id}</div>
            <div className="subtitle">{format(new Date(order.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
          </div>

          <div className="section">
            <div className="section-title">CLIENTE</div>
            <div className="mb-1">{normalizeForThermalPrint(order.customerName)}</div>
            <div className="mb-1 font-bold">CELULAR</div>
            <div>{order.customerPhone}</div>
          </div>

          <div className="section">
            <div className="section-title" style={{ fontFamily: 'Arial, sans-serif' }}>ENDEREÇO</div>
            <div>
              {normalizeForThermalPrint(order.address.street)}, {order.address.number}
            </div>
            <div>Bairro: {normalizeForThermalPrint(order.address.neighborhood)}</div>
            {order.address.complement && <div>Complemento: {normalizeForThermalPrint(order.address.complement)}</div>}
          </div>

          <div className="section">
            <div className="section-title">ITENS DO PEDIDO</div>
            {order.items.map((item, index) => (
              <div key={index} style={{ marginBottom: "6px" }}>
                <div className="item-formatted" style={{ fontFamily: "monospace", fontSize: "11px", marginBottom: "4px" }}>
                  {formatItemLine(item.quantity, item.name, item.size, item.price)}
                </div>

                {/* Indicar se tem ou não adicionais */}
                {item.additionals && item.additionals.length > 0 ? (
                  <div className="mb-2">
                    <div className="additional-status font-bold">Adicionais Complementos</div>
                    {item.additionals.map((additional, idx) => (
                      <div key={idx} className="additional" style={{ fontFamily: "monospace", fontSize: "10px", marginBottom: "2px" }}>
                        {formatAdditionalLine(additional.quantity ?? 1, additional.name, additional.price)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {/* Espaçamento adicional de 1 linha após todos os itens */}
            <div className="items-spacing"></div>
          </div>

          <div className="divider"></div>
          
          {/* Espaçamento adicional de 1 linha entre divider e subtotal */}
          <div className="items-spacing"></div>

          <div className="section">
            <div className="item">
              <div>Subtotal:</div>
              <div style={{ fontWeight: "bold" }}>{formatCurrency(order.subtotal)}</div>
            </div>
            <div className="item">
              <div>Taxa de entrega:</div>
              <div style={{ fontWeight: "bold" }}>{formatCurrency(order.deliveryFee)}</div>
            </div>
            <div className="item total">
              <div>TOTAL:</div>
              <div>{formatCurrency(order.total)}</div>
            </div>
          </div>

          <div className="section">
            <div>Forma de pagamento: {order.paymentMethod === "pix" ? "PIX" : "Cartão na Entrega"}</div>
          </div>

          <div className="footer">Obrigado pela preferencia!</div>

          {/* Adicionar salmo */}
          <div className="salmo">
            <div className="salmo-texto">{normalizeForThermalPrint(salmo.texto)}</div>
            <div className="salmo-referencia">{normalizeForThermalPrint(salmo.referencia)}</div>
          </div>
        </div>
      </div>

      {/* Instrução para configuração de impressão - Estilo mais discreto */}
      <div className="mb-3 p-2 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] rounded-md">
        <div className="flex items-start">
          <span className="text-gray-500 mr-1">ℹ️</span>
          <div>
            <p className="mb-1">Configure a largura do papel para <span className="font-medium">{LABEL_WIDTH_MM}mm</span> na impressão.</p>
            <p className="text-gray-500 text-[10px]">MP-4200 TH: papel 58-82.5mm. Atual: 80mm.</p>
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handlePrint}
          disabled={!isLogoReady || isGeneratingPDF}
          className={`flex-1 text-white py-2 rounded-md flex items-center justify-center ${
            !isLogoReady || isGeneratingPDF 
              ? 'bg-purple-400 cursor-not-allowed' 
              : 'bg-purple-700 hover:bg-purple-800'
          }`}
        >
          {!isLogoReady ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Carregando...
            </>
          ) : (
            <>
              <Printer size={18} className="mr-2" />
              {isGeneratingPDF ? 'Gerando...' : 'Imprimir'}
            </>
          )}
        </button>

        <button
          onClick={handleGeneratePDF}
          disabled={!isLogoReady || isGeneratingPDF}
          className={`flex-1 text-white py-2 rounded-md flex items-center justify-center ${
            !isLogoReady || isGeneratingPDF 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Download size={18} className="mr-2" />
          {isGeneratingPDF ? "Gerando..." : "Salvar PDF"}
        </button>
      </div>
    </div>
  )
}
