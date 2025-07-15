"use client"

import { useState, useEffect } from "react"
import { QrCode, Download, Eye, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Table } from "@/lib/types"

interface QRCodeGeneratorProps {
  table?: Table
  onGenerate?: (url: string) => void
}

export default function QRCodeGenerator({ table, onGenerate }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [tableNumber, setTableNumber] = useState<string>(table?.number.toString() || "")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Garantir que o componente só renderize no cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Gerar URL da mesa (sempre no cliente para garantir URL correta)
  const generateMesaUrl = (numero: string): string => {
    if (!isMounted) {
      return '' // Não gerar URL até estar montado no cliente
    }
    
    const baseUrl = window.location.origin
    const fullUrl = `${baseUrl}/mesa/${numero}`
    console.log('Gerando QR Code para URL:', fullUrl)
    return fullUrl
  }

  // Gerar QR code usando uma API externa
  const generateQRCode = async (url: string): Promise<string> => {
    // Usando QR Server API (gratuita)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&format=png&margin=10`
    return qrApiUrl
  }

  const handleGenerate = async () => {
    if (!tableNumber.trim()) {
      alert("Por favor, informe o número da mesa")
      return
    }

    if (!isMounted) {
      alert("Aguarde o carregamento da página")
      return
    }

    setIsGenerating(true)
    try {
      const mesaUrl = generateMesaUrl(tableNumber)
      if (!mesaUrl) {
        alert("Erro ao gerar URL da mesa")
        return
      }
      
      const qrUrl = await generateQRCode(mesaUrl)
      
      setQrCodeUrl(qrUrl)
      
      if (onGenerate) {
        onGenerate(mesaUrl)
      }
    } catch (error) {
      console.error("Erro ao gerar QR code:", error)
      alert("Erro ao gerar QR code. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyUrl = async () => {
    if (!tableNumber.trim()) return
    
    const mesaUrl = generateMesaUrl(tableNumber)
    
    try {
      await navigator.clipboard.writeText(mesaUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Erro ao copiar URL:", error)
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea')
      textArea.value = mesaUrl
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!qrCodeUrl) return
    
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `qr-mesa-${tableNumber}.png`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePreview = () => {
    if (!tableNumber.trim()) return
    
    const mesaUrl = generateMesaUrl(tableNumber)
    window.open(mesaUrl, '_blank')
  }

  return (
    <div className="w-full space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <QrCode className="w-5 h-5" />
          Gerador de QR Code
        </h3>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="table-number" className="text-sm font-medium">
            Número da Mesa
          </label>
          <Input
            id="table-number"
            type="number"
            placeholder="Ex: 1"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            min="1"
            max="999"
          />
        </div>

        {tableNumber && (
          <Alert>
            <AlertDescription>
              <strong>URL da Mesa:</strong> {generateMesaUrl(tableNumber)}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={!tableNumber.trim() || isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gerando...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4 mr-2" />
                Gerar QR
              </>
            )}
          </Button>
          
          <Button
            onClick={handleCopyUrl}
            variant="outline"
            disabled={!tableNumber.trim()}
            className="flex-shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            onClick={handlePreview}
            variant="outline"
            disabled={!tableNumber.trim()}
            className="flex-shrink-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        {qrCodeUrl && (
          <div className="space-y-3">
            <div className="text-center">
              <img 
                src={qrCodeUrl} 
                alt={`QR Code para Mesa ${tableNumber}`}
                className="mx-auto border rounded-lg shadow-sm w-full max-w-[180px] h-auto"
              />
            </div>
            
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar QR Code
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• O QR code direcionará para: /mesa/{tableNumber}</p>
          <p>• Clientes poderão fazer pedidos diretamente da mesa</p>
          <p>• Pedidos aparecerão no painel de mesas do admin</p>
        </div>
      </div>
    </div>
  )
}