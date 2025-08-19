"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Search, CheckCircle, AlertCircle } from "lucide-react"
import { findDeliveryAddressByAddress, searchDeliveryAddresses, type DeliveryAddress } from "@/lib/services/delivery-address-service"
import { formatCurrency } from "@/lib/utils"

interface DeliveryAddressLookupProps {
  onAddressSelect: (address: DeliveryAddress | null) => void
  onAddressClear: () => void
  initialAddress?: string
  className?: string
}

export function DeliveryAddressLookup({ onAddressSelect, onAddressClear, initialAddress = "", className = "" }: DeliveryAddressLookupProps) {
  const [address, setAddress] = useState(initialAddress)
  const [searchResults, setSearchResults] = useState<DeliveryAddress[]>([])
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Buscar endereço exato quando o usuário para de digitar
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (address.trim().length < 3) {
      setSearchResults([])
      setShowResults(false)
      setSelectedAddress(null)
      onAddressSelect(null)
      if (onAddressClear) onAddressClear()
      return
    }

    const timeout = setTimeout(async () => {
      await searchAddresses(address.trim())
    }, 500) // Aguardar 500ms após parar de digitar

    setSearchTimeout(timeout)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [address])

  // Buscar endereços
  const searchAddresses = async (searchTerm: string) => {
    try {
      setIsSearching(true)
      
      // Primeiro, tentar buscar endereço exato
      const exactMatch = await findDeliveryAddressByAddress(searchTerm)
      
      if (exactMatch) {
        setSelectedAddress(exactMatch)
        setSearchResults([exactMatch])
        setShowResults(true)
        onAddressSelect(exactMatch)
      } else {
        // Se não encontrar exato, buscar similares
        const results = await searchDeliveryAddresses(searchTerm, 5)
        setSearchResults(results)
        setShowResults(results.length > 0)
        setSelectedAddress(null)
        onAddressSelect(null)
      }
    } catch (error) {
      console.error('Erro ao buscar endereços:', error)
      setSearchResults([])
      setShowResults(false)
      setSelectedAddress(null)
      onAddressSelect(null)
    } finally {
      setIsSearching(false)
    }
  }

  // Selecionar um endereço da lista
  const selectAddress = (selectedAddr: DeliveryAddress) => {
    setAddress(selectedAddr.address)
    setSelectedAddress(selectedAddr)
    setShowResults(false)
    onAddressSelect(selectedAddr)
  }

  // Buscar manualmente
  const handleManualSearch = () => {
    if (address.trim()) {
      searchAddresses(address.trim())
    }
  }

  return (
    <div className={className}>
      <div className="space-y-2">

        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="delivery-address"
                type="text"
                placeholder="Digite seu endereço completo..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleManualSearch}
              disabled={!address.trim() || isSearching}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Endereço selecionado */}
        {selectedAddress && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">
                    {selectedAddress.address}
                    {selectedAddress.number && (
                      <span className="ml-1">• Nº {selectedAddress.number}</span>
                    )}
                  </p>
                  <div className="text-sm text-green-700 mt-1">
                    {selectedAddress.neighborhood && (
                      <span>{selectedAddress.neighborhood} • </span>
                    )}
                    <span>{selectedAddress.city}</span>
                  </div>
                  <div className="text-sm font-semibold text-green-800 mt-1">
                    Taxa de entrega: {formatCurrency(selectedAddress.delivery_fee)}
                  </div>
                  {selectedAddress.notes && !selectedAddress.notes.includes('Endereço criado automaticamente do pedido de') && (
                    <p className="text-xs text-green-600 mt-1">{selectedAddress.notes}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados da busca */}
        {showResults && searchResults.length > 0 && !selectedAddress && (
          <Card className="border-blue-200">
            <CardContent className="p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                <Search className="h-4 w-4" />
                Endereços encontrados:
              </h4>
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => selectAddress(result)}
                    className="w-full text-left p-2 rounded-md hover:bg-blue-50 border border-blue-100 transition-colors"
                  >
                    <div className="font-medium text-blue-900">
                      {result.address}
                      {result.number && (
                        <span className="ml-1">• Nº {result.number}</span>
                      )}
                    </div>
                    <div className="text-sm text-blue-700">
                      {result.neighborhood && (
                        <span>{result.neighborhood} • </span>
                      )}
                      <span>{result.city}</span>
                    </div>
                    {result.notes && !result.notes.includes('Endereço criado automaticamente do pedido de') && (
                      <p className="text-xs text-blue-600 mt-1">{result.notes}</p>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nenhum resultado encontrado */}
        {showResults && searchResults.length === 0 && address.trim().length >= 3 && !isSearching && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800">Endereço não encontrado</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Este endereço não está cadastrado em nosso sistema. 
                    Entre em contato conosco para verificar a disponibilidade de entrega.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default DeliveryAddressLookup