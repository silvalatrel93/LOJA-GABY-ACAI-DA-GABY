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

  const updateTableSize = (index: number, field: keyof ProductSize, value: string | number) => {
    const updated = [...tableSizes]
    if (field === 'price') {
      updated[index] = { ...updated[index], [field]: Number(value) }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
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
    try {
      const updatedProduct = {
        ...product,
        tableSizes: tableSizes.length > 0 ? tableSizes : undefined
      }

      const { data, error } = await ProductService.saveProduct(updatedProduct)
      
      if (error) {
        toast.error("Erro ao salvar preços da mesa: " + error.message)
        return
      }

      if (data) {
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
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`table-size-name-${index}`}>Nome</Label>
                    <Input
                      id={`table-size-name-${index}`}
                      value={size.size}
                      onChange={(e) => updateTableSize(index, 'size', e.target.value)}
                      placeholder="Ex: Pequeno, Médio, Grande"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`table-size-price-${index}`}>Preço (R$)</Label>
                    <Input
                      id={`table-size-price-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={size.price}
                      onChange={(e) => updateTableSize(index, 'price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeTableSize(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

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