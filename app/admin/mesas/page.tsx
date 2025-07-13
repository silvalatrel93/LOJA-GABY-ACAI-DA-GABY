"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Edit, Trash2, QrCode, BarChart3, RefreshCw, Users, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { TableService } from "@/lib/services/table-service"
import QRCodeGenerator from "@/components/qr-code-generator"
import type { Table } from "@/lib/types"

export default function MesasAdminPage() {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withOrders: 0,
  })

  const [formData, setFormData] = useState({
    number: "",
    name: "",
    active: true,
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Verificar autenticação
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin_authenticated") === "true"
    if (!isAuthenticated) {
      window.location.href = "/admin/login"
      return
    }
    loadTables()
    loadStats()
  }, [])

  const loadTables = async () => {
    try {
      setIsLoading(true)
      const tablesData = await TableService.getAllTables()
      setTables(tablesData)
    } catch (error) {
      console.error("Erro ao carregar mesas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await TableService.getTableStats()
      setStats(statsData)
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    // Validação
    const errors: Record<string, string> = {}

    if (!formData.number.trim()) {
      errors.number = "Número da mesa é obrigatório"
    } else if (isNaN(Number(formData.number)) || Number(formData.number) <= 0) {
      errors.number = "Número deve ser um valor positivo"
    }

    if (!formData.name.trim()) {
      errors.name = "Nome da mesa é obrigatório"
    }

    // Verificar se o número já existe (exceto para edição)
    const existingTable = tables.find(t => t.number === Number(formData.number))
    if (existingTable && (!selectedTable || existingTable.id !== selectedTable.id)) {
      errors.number = "Já existe uma mesa com este número"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      let result

      if (selectedTable) {
        // Atualizar mesa existente
        result = await TableService.updateTable(selectedTable.id, {
          number: Number(formData.number),
          name: formData.name,
          active: formData.active,
        })
      } else {
        // Criar nova mesa
        result = await TableService.createTable({
          number: Number(formData.number),
          name: formData.name,
          active: formData.active,
          qrCode: "", // Será gerado automaticamente
        })
      }

      if (result.error) {
        alert(`Erro ao ${selectedTable ? 'atualizar' : 'criar'} mesa: ${result.error.message}`)
        return
      }

      // Sucesso - fechar modal e recarregar dados
      setIsModalOpen(false)
      setSelectedTable(null)
      resetForm()
      await loadTables()
      await loadStats()

      // Feedback visual pelo fechamento do modal e atualização da lista

    } catch (error) {
      console.error("Erro ao salvar mesa:", error)
      alert("Erro inesperado ao salvar mesa. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (table: Table) => {
    setSelectedTable(table)
    setFormData({
      number: table.number.toString(),
      name: table.name,
      active: table.active,
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleDelete = async (table: Table) => {
    const confirmMessage = `⚠️ ATENÇÃO: Deseja excluir a mesa ${table.name}?\n\nEsta ação não pode ser desfeita.\n\n❗ A mesa só pode ser excluída se não houver pedidos associados.`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const result = await TableService.deleteTable(table.id)

      if (result.error) {
        // Verificar se o erro é sobre pedidos associados
        if (result.error.message.includes("pedidos associados")) {
          alert(`❌ Não é possível excluir a mesa ${table.name}\n\n📋 Esta mesa possui pedidos associados.\n\n💡 Para excluir a mesa:\n1. Acesse "Pedidos das Mesas"\n2. Finalize ou cancele todos os pedidos desta mesa\n3. Tente excluir novamente`)
          return
        }

        // Para outros tipos de erro
        alert(`Erro ao excluir mesa: ${result.error.message}`)
        return
      }

      // Sucesso - recarregar dados
      await loadTables()
      await loadStats()
      alert(`✅ Mesa ${table.name} excluída com sucesso!`)

    } catch (error) {
      console.error("Erro ao excluir mesa:", error)
      alert("Erro inesperado ao excluir mesa. Tente novamente.")
    }
  }

  const handleToggleActive = async (table: Table) => {
    try {
      const result = await TableService.updateTable(table.id, {
        active: !table.active,
      })

      if (result.error) {
        alert(`Erro ao ${!table.active ? 'ativar' : 'desativar'} mesa: ${result.error.message}`)
        return
      }

      await loadTables()
      await loadStats()

      // Feedback visual sutil para ativação/desativação
      // (sem alert para não incomodar muito o usuário)

    } catch (error) {
      console.error("Erro ao alterar status da mesa:", error)
      alert("Erro inesperado ao alterar status da mesa. Tente novamente.")
    }
  }

  const handleShowQR = (table: Table) => {
    setSelectedTable(table)
    setIsQRModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      number: "",
      name: "",
      active: true,
    })
    setFormErrors({})
  }

  const handleAddNew = () => {
    setSelectedTable(null)
    resetForm()
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/admin" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Gerenciar Mesas</h1>
          </div>
        </header>
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 via-purple-800 to-purple-900 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/admin" className="mr-4 hover:bg-white/10 p-2 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Gerenciar Mesas</h1>
          </div>
          <Button
            onClick={handleAddNew}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <Plus size={18} className="mr-2" />
            Nova Mesa
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Mesas</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mesas Ativas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mesas Inativas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                </div>
                <EyeOff className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Com Pedidos</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.withOrders}</p>
                </div>
                <QrCode className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Mesas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mesas Cadastradas</CardTitle>
              <Button
                onClick={() => { loadTables(); loadStats(); }}
                variant="outline"
                size="sm"
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tables.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhuma mesa cadastrada</p>
                <Button onClick={handleAddNew} className="mt-4">
                  <Plus size={18} className="mr-2" />
                  Adicionar primeira mesa
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Número</th>
                      <th className="text-left p-3">Nome</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">QR Code</th>
                      <th className="text-left p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((table) => (
                      <tr key={table.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{table.number}</td>
                        <td className="p-3">{table.name}</td>
                        <td className="p-3">
                          <Badge
                            variant={table.active ? "default" : "secondary"}
                            className={table.active ? "bg-green-100 text-green-800" : ""}
                          >
                            {table.active ? "Ativa" : "Inativa"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button
                            onClick={() => handleShowQR(table)}
                            variant="outline"
                            size="sm"
                          >
                            <QrCode size={16} />
                          </Button>
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleEdit(table)}
                              variant="outline"
                              size="sm"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              onClick={() => handleToggleActive(table)}
                              variant="outline"
                              size="sm"
                            >
                              {table.active ? <EyeOff size={16} /> : <Eye size={16} />}
                            </Button>
                            <Button
                              onClick={() => handleDelete(table)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Adicionar/Editar Mesa */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTable ? "Editar Mesa" : "Nova Mesa"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="number">Número da Mesa</Label>
                <Input
                  id="number"
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  min="1"
                  max="999"
                  required
                />
                {formErrors.number && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.number}</p>
                )}
              </div>

              <div>
                <Label htmlFor="name">Nome da Mesa</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Mesa 1, Mesa VIP, etc."
                  required
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 text-purple-600"
                />
                <Label htmlFor="active">Mesa ativa</Label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de QR Code */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {selectedTable?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedTable && (
              <QRCodeGenerator
                table={selectedTable}
                onGenerate={(url) => console.log("QR gerado:", url)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 