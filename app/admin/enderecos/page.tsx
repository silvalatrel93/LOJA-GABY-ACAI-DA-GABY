"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Pencil, Trash2, Plus, MapPin } from "lucide-react"
import { supabase } from "@/lib/services/supabase-client"

interface DeliveryAddress {
  id: number
  address: string
  number: string | null
  neighborhood: string | null
  city: string
  delivery_fee: number
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

interface AddressFormData {
  address: string
  number: string
  neighborhood: string
  city: string
  delivery_fee: string
  is_active: boolean
  notes: string
}

export default function DeliveryAddressesPage() {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null)
  const [formData, setFormData] = useState<AddressFormData>({
    address: '',
    number: '',
    neighborhood: '',
    city: 'Cidade',
    delivery_fee: '0.00',
    is_active: true,
    notes: ''
  })

  // Carregar endereços
  const loadAddresses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .order('address')

      if (error) {
        console.error('Erro ao carregar endereços:', error)
        toast.error('Erro ao carregar endereços')
        return
      }

      setAddresses(data || [])
    } catch (error) {
      console.error('Erro inesperado:', error)
      toast.error('Erro inesperado ao carregar endereços')
    } finally {
      setLoading(false)
    }
  }

  // Salvar endereço (criar ou editar)
  const saveAddress = async () => {
    try {
      if (!formData.address.trim()) {
        toast.error('Endereço é obrigatório')
        return
      }

      const deliveryFee = parseFloat(formData.delivery_fee)
      if (isNaN(deliveryFee) || deliveryFee < 0) {
        toast.error('Taxa de entrega deve ser um valor válido')
        return
      }

      const addressData = {
        address: formData.address.trim(),
        number: formData.number.trim() || null,
        neighborhood: formData.neighborhood.trim() || null,
        city: formData.city.trim(),
        delivery_fee: deliveryFee,
        is_active: formData.is_active,
        notes: formData.notes.trim() || null
      }

      let error
      if (editingAddress) {
        // Editar endereço existente
        const { error: updateError } = await supabase
          .from('delivery_addresses')
          .update(addressData)
          .eq('id', editingAddress.id)
        error = updateError
      } else {
        // Criar novo endereço
        const { error: insertError } = await supabase
          .from('delivery_addresses')
          .insert([addressData])
        error = insertError
      }

      if (error) {
        console.error('Erro ao salvar endereço:', error)
        if (error.code === '23505') {
          toast.error('Este endereço já existe')
        } else {
          toast.error('Erro ao salvar endereço')
        }
        return
      }

      toast.success(editingAddress ? 'Endereço atualizado!' : 'Endereço criado!')
      setShowDialog(false)
      resetForm()
      loadAddresses()
    } catch (error) {
      console.error('Erro inesperado:', error)
      toast.error('Erro inesperado ao salvar endereço')
    }
  }

  // Excluir endereço
  const deleteAddress = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('delivery_addresses')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao excluir endereço:', error)
        toast.error('Erro ao excluir endereço')
        return
      }

      toast.success('Endereço excluído!')
      loadAddresses()
    } catch (error) {
      console.error('Erro inesperado:', error)
      toast.error('Erro inesperado ao excluir endereço')
    }
  }

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      address: '',
      number: '',
      neighborhood: '',
      city: 'Cidade',
      delivery_fee: '0.00',
      is_active: true,
      notes: ''
    })
    setEditingAddress(null)
  }

  // Abrir diálogo para criar
  const openCreateDialog = () => {
    resetForm()
    setShowDialog(true)
  }

  // Abrir diálogo para editar
  const openEditDialog = (address: DeliveryAddress) => {
    setFormData({
      address: address.address,
      number: address.number || '',
      neighborhood: address.neighborhood || '',
      city: address.city,
      delivery_fee: address.delivery_fee.toFixed(2),
      is_active: address.is_active,
      notes: address.notes || ''
    })
    setEditingAddress(address)
    setShowDialog(true)
  }

  // Carregar endereços ao montar o componente
  useEffect(() => {
    loadAddresses()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Endereços de Entrega</h1>
          <p className="text-gray-600">Gerencie endereços e suas taxas de entrega</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Endereço
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum endereço cadastrado</h3>
                <p className="text-gray-600 mb-4">Comece criando seu primeiro endereço de entrega</p>
                <Button onClick={openCreateDialog}>Criar Primeiro Endereço</Button>
              </CardContent>
            </Card>
          ) : (
            addresses.map((address) => (
              <Card key={address.id} className={!address.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {address.address}{address.number ? `, ${address.number}` : ''}
                        </h3>
                        {!address.is_active && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                            Inativo
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Bairro:</span> {address.neighborhood || 'Não informado'}
                        </div>
                        <div>
                          <span className="font-medium">Cidade:</span> {address.city}
                        </div>
                        <div>
                          <span className="font-medium">Taxa:</span> 
                          <span className="font-bold text-green-600 ml-1">
                            {formatCurrency(address.delivery_fee)}
                          </span>
                        </div>
                      </div>
                      
                      {address.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Observações:</span> {address.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(address)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAddress(address.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Diálogo para criar/editar endereço */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Endereço *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ex: Rua das Flores"
              />
            </div>
            
            <div>
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="Ex: 123"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Ex: Centro"
                />
              </div>
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ex: São Paulo"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="delivery_fee">Taxa de Entrega (R$) *</Label>
              <Input
                id="delivery_fee"
                type="number"
                step="0.01"
                min="0"
                value={formData.delivery_fee}
                onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                placeholder="0.00"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Endereço ativo</Label>
            </div>
            
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o endereço ou taxa..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveAddress}>
              {editingAddress ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}