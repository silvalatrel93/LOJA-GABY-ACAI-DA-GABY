"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2, RefreshCw, Bell, AlertTriangle, Info, CheckCircle } from "lucide-react"
import { getAllNotifications, saveNotification, deleteNotification, type Notification } from "@/lib/db"
import { notifyNewNotification } from "@/components/notification-bell"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteStatus, setDeleteStatus] = useState<{ id: number; status: "pending" | "success" | "error" } | null>(null)

  // Função para carregar notificações
  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const notificationsList = await getAllNotifications()
      setNotifications(
        notificationsList.sort((a, b) => {
          // Ordenar por data de criação (mais recentes primeiro)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }),
      )
    } catch (error) {
      console.error("Erro ao carregar notificações:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar notificações na montagem do componente
  useEffect(() => {
    loadNotifications()
  }, [])

  const handleEditNotification = (notification: Notification) => {
    setEditingNotification({ ...notification })
    setIsModalOpen(true)
  }

  const handleAddNotification = () => {
    const now = new Date()
    const oneWeekLater = new Date()
    oneWeekLater.setDate(now.getDate() + 7)

    setEditingNotification({
      id: 0, // Será substituído ao salvar
      title: "",
      message: "",
      type: "info",
      active: true,
      startDate: now,
      endDate: oneWeekLater,
      priority: 3,
      read: false,
      createdAt: now,
    })
    setIsModalOpen(true)
  }

  const handleDeleteNotification = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta notificação?")) {
      try {
        setDeleteStatus({ id, status: "pending" })
        await deleteNotification(id)
        setNotifications(notifications.filter((n) => n.id !== id))
        setDeleteStatus({ id, status: "success" })
      } catch (error) {
        console.error("Erro ao excluir notificação:", error)
        setDeleteStatus({ id, status: "error" })
        alert("Erro ao excluir notificação. Tente novamente.")
      }
    }
  }

  const handleSaveNotification = async () => {
    if (!editingNotification) return

    if (!editingNotification.title) {
      alert("O título da notificação é obrigatório")
      return
    }

    if (!editingNotification.message) {
      alert("A mensagem da notificação é obrigatória")
      return
    }

    try {
      await saveNotification(editingNotification)
      await loadNotifications()
      setIsModalOpen(false)

      // Notificar todos os componentes de notificação sobre a nova notificação
      notifyNewNotification()
    } catch (error) {
      console.error("Erro ao salvar notificação:", error)
      alert("Erro ao salvar notificação. Tente novamente.")
    }
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getNotificationTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle size={18} className="text-yellow-500" />
      case "alert":
        return <AlertTriangle size={18} className="text-red-500" />
      case "success":
        return <CheckCircle size={18} className="text-green-500" />
      default:
        return <Info size={18} className="text-blue-500" />
    }
  }

  const getNotificationTypeLabel = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return "Aviso"
      case "alert":
        return "Alerta"
      case "success":
        return "Sucesso"
      default:
        return "Informação"
    }
  }

  const getNotificationTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "alert":
        return "bg-red-100 text-red-800"
      case "success":
        return "bg-green-100 text-green-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/admin" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Gerenciar Notificações</h1>
          </div>
        </header>
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
        <div className="container mx-auto">
          {/* Layout para dispositivos móveis - elementos em coluna */}
          <div className="flex flex-col space-y-3 sm:hidden">
            <div className="flex items-center">
              <Link href="/admin" className="mr-4">
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-xl font-bold">Gerenciar Notificações</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={loadNotifications}
                className="flex-1 bg-purple-800 text-white px-3 py-2 rounded-md font-medium flex items-center justify-center"
                title="Atualizar notificações"
              >
                <RefreshCw size={16} className="mr-1" />
                Atualizar
              </button>
              <button
                onClick={handleAddNotification}
                className="flex-1 bg-white text-purple-900 px-3 py-2 rounded-md font-medium flex items-center justify-center"
              >
                <Plus size={16} className="mr-1" />
                Nova
              </button>
            </div>
          </div>

          {/* Layout para tablets e desktop - elementos em linha */}
          <div className="hidden sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center">
              <Link href="/admin" className="mr-4">
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-xl font-bold">Gerenciar Notificações</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={loadNotifications}
                className="bg-purple-800 text-white px-4 py-2 rounded-md font-medium flex items-center"
                title="Atualizar notificações"
              >
                <RefreshCw size={18} className="mr-1" />
                Atualizar
              </button>
              <button
                onClick={handleAddNotification}
                className="bg-white text-purple-900 px-4 py-2 rounded-md font-medium flex items-center"
              >
                <Plus size={18} className="mr-1" />
                Nova Notificação
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center mb-4">
            <Bell size={24} className="text-purple-700 mr-2" />
            <h2 className="text-lg font-semibold text-purple-900">Notificações do Sistema</h2>
          </div>

          <p className="text-gray-600 mb-4">
            Gerencie as notificações que serão exibidas para os usuários. As notificações podem ser usadas para informar
            sobre feriados, promoções, atualizações do sistema e outros avisos importantes.
          </p>

          {notifications.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Bell size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma notificação cadastrada.</p>
              <p className="text-gray-500">Clique em "Nova Notificação" para começar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="border rounded-lg overflow-hidden">
                  <div
                    className={`p-3 flex justify-between items-center ${notification.active ? "bg-white" : "bg-gray-100"}`}
                  >
                    <div className="flex items-center">
                      {getNotificationTypeIcon(notification.type)}
                      <h3 className="font-semibold ml-2">{notification.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ml-2 ${getNotificationTypeColor(notification.type)}`}
                      >
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                      {notification.active ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full ml-2">Ativa</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full ml-2">Inativa</span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditNotification(notification)} className="text-blue-600 p-1">
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="text-red-600 p-1"
                        disabled={deleteStatus?.id === notification.id && deleteStatus.status === "pending"}
                      >
                        {deleteStatus?.id === notification.id && deleteStatus.status === "pending" ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 border-t">
                    <p className="text-gray-700">{notification.message}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>Prioridade: {notification.priority}</span>
                      <span>•</span>
                      <span>
                        Período: {formatDate(notification.startDate)} até {formatDate(notification.endDate)}
                      </span>
                      <span>•</span>
                      <span>Criada em: {formatDate(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edição/Criação */}
      {isModalOpen && editingNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-purple-900">
                {editingNotification.id ? "Editar Notificação" : "Nova Notificação"}
              </h2>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={editingNotification.title}
                  onChange={(e) => setEditingNotification({ ...editingNotification, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Título da notificação"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                <textarea
                  value={editingNotification.message}
                  onChange={(e) => setEditingNotification({ ...editingNotification, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Mensagem da notificação"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={editingNotification.type}
                  onChange={(e) =>
                    setEditingNotification({
                      ...editingNotification,
                      type: e.target.value as Notification["type"],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="info">Informação</option>
                  <option value="warning">Aviso</option>
                  <option value="alert">Alerta</option>
                  <option value="success">Sucesso</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <select
                  value={editingNotification.priority}
                  onChange={(e) =>
                    setEditingNotification({
                      ...editingNotification,
                      priority: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="1">1 - Baixa</option>
                  <option value="2">2 - Média-Baixa</option>
                  <option value="3">3 - Média</option>
                  <option value="4">4 - Média-Alta</option>
                  <option value="5">5 - Alta</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                  <input
                    type="datetime-local"
                    value={new Date(editingNotification.startDate).toISOString().slice(0, 16)}
                    onChange={(e) =>
                      setEditingNotification({
                        ...editingNotification,
                        startDate: new Date(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Término</label>
                  <input
                    type="datetime-local"
                    value={new Date(editingNotification.endDate).toISOString().slice(0, 16)}
                    onChange={(e) =>
                      setEditingNotification({
                        ...editingNotification,
                        endDate: new Date(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingNotification.active}
                  onChange={(e) =>
                    setEditingNotification({
                      ...editingNotification,
                      active: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  Notificação ativa
                </label>
              </div>
            </div>

            <div className="p-4 border-t sticky bottom-0 bg-white flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNotification}
                className="px-4 py-2 bg-purple-700 text-white rounded-md flex items-center"
              >
                <Save size={18} className="mr-1" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
