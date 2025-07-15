"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Save, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { ProductService } from "@/lib/services/product-service"
import type { Product, ProductSize } from "@/lib/types"

interface TablePricingManagerProps {
  product: Product
  onUpdate: (updatedProduct: Product) => void
}

function TablePricingManager({ product, onUpdate }: TablePricingManagerProps) {
  const [tableSizes, setTableSizes] = useState<ProductSize[]>(product.tableSizes || [])
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setTableSizes(product.tableSizes || [])
    setHasChanges(false)
  }, [product])

  const addTableSize = () => {
    const newSize: ProductSize = {
      size: "",
      price: 0
    }
    setTableSizes([...tableSizes, newSize])
    setHasChanges(true)
  }

  const updateTableSize = (index: number, field: keyof ProductSize, value: any) => {
    const updated = [...tableSizes]
    updated[index] = { ...updated[index], [field]: value }
    setTableSizes(updated)
    setHasChanges(true)
  }

  const removeTableSize = (index: number) => {
    const updated = tableSizes.filter((_, i) => i !== index)
    setTableSizes(updated)
    setHasChanges(true)
  }

  const saveTablePricing = async () => {
    setIsLoading(true)
    console.log(`💾 Salvando preços de mesa para produto: ${product.name}`)
    console.log(`🔢 Quantidade de preços de mesa a salvar: ${tableSizes.length}`)
    console.log(`📋 Preços de mesa detalhados:`, tableSizes)
    
    try {
      const updatedProduct = {
        ...product,
        tableSizes: tableSizes.length > 0 ? tableSizes : undefined
      }
      
      console.log(`🔄 Produto atualizado com tableSizes:`, updatedProduct.tableSizes)

      const { data, error } = await ProductService.saveProduct(updatedProduct)
      
      if (error) {
        console.error(`❌ Erro ao salvar preços de mesa para ${product.name}:`, error)
        toast.error("Erro ao salvar preços da mesa: " + error.message)
        return
      }

      if (data) {
        console.log(`✅ Preços de mesa salvos com sucesso para ${product.name}`)
        console.log(`📋 Dados salvos:`, data.tableSizes)
        onUpdate(data)
        setHasChanges(false)
        toast.success("Preços da mesa salvos com sucesso!")
      }
    } catch (error) {
      console.error("Erro ao salvar preços da mesa:", error)
      toast.error("Erro ao salvar preços da mesa")
    } finally {
      setIsLoading(false)
    }
  }

  const clearTablePricing = () => {
    setTableSizes([])
    setHasChanges(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Preços para Mesa
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure preços específicos para consumo na mesa. Se não configurado, usará os preços padrão.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preços padrão (delivery) */}
        <div>
          <Label className="text-sm font-medium">Preços Padrão (Delivery)</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {product.sizes.map((size, index) => (
              <Badge key={index} variant="outline">
                {size.size}: R$ {size.price.toFixed(2)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Preços da mesa */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Preços para Mesa</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTableSize}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
              {tableSizes.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearTablePricing}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {tableSizes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum preço específico para mesa configurado</p>
              <p className="text-sm">Os preços padrão serão utilizados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tableSizes.map((size, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    {/* Tamanho */}
                    <div className="md:col-span-3">
                      <Label className="block text-xs text-gray-500 mb-1 font-medium">Tamanho</Label>
                      <Input
                        value={size.size}
                        onChange={(e) => updateTableSize(index, 'size', e.target.value)}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: 500ml"
                      />
                    </div>

                    {/* Preço */}
                    <div className="md:col-span-4">
                      <Label className="block text-xs text-gray-500 mb-1 font-medium">Preço</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">R$</span>
                        </div>
                        <Input
                          type="number"
                          value={size.price === 0 ? '' : size.price}
                          onChange={(e) => updateTableSize(index, 'price', e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="0,00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Limite de adicionais */}
                    <div className="md:col-span-3">
                      <Label className="block text-xs text-gray-500 mb-1 font-medium whitespace-nowrap">Limite de adicionais</Label>
                      <Input
                        type="number"
                        value={size.additionalsLimit || ''}
                        onChange={(e) => updateTableSize(index, 'additionalsLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Vazio = sem limite"
                        min="0"
                        max="20"
                      />
                    </div>

                    {/* Botão remover */}
                    <div className="md:col-span-2 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTableSize(index)}
                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer"
                        title="Remover tamanho"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações sobre limites de adicionais */}
        {tableSizes.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 text-blue-600 mr-2">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-blue-800">Sistema de Limites para Mesa</h4>
            </div>
            <p className="text-xs text-blue-700 mb-2">
              Configure o limite de adicionais individualmente para cada tamanho da mesa.
              Este limite será aplicado apenas no sistema de mesa.
            </p>
            <div className="text-xs text-blue-600">
              • <strong>Vazio</strong> = sem limite de adicionais<br/>
              • <strong>Número</strong> = limite específico para aquele tamanho<br/>
              • <strong>Recomendado</strong> = 5 adicionais por tamanho
            </div>
          </div>
        )}

        {/* Botão de salvar */}
        {hasChanges && (
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={saveTablePricing}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? "Salvando..." : "Salvar Preços da Mesa"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TablePricingManager
export { TablePricingManager }