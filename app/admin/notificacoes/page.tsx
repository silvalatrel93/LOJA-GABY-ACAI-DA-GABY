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
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
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

    // Garantir que as datas são válidas
    if (isNaN(now.getTime()) || isNaN(oneWeekLater.getTime())) {
      console.error('Erro ao criar datas para nova notificação')
      return
    }

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

    // Validar datas
    const startDate = new Date(editingNotification.startDate)
    const endDate = new Date(editingNotification.endDate)
    
    if (isNaN(startDate.getTime())) {
      alert("Data de início inválida")
      return
    }
    
    if (isNaN(endDate.getTime())) {
      alert("Data de término inválida")
      return
    }
    
    if (startDate >= endDate) {
      alert("A data de início deve ser anterior à data de término")
      return
    }

    try {
      await saveNotification({
        ...editingNotification,
        startDate,
        endDate,
        createdAt: editingNotification.createdAt || new Date()
      })
      await loadNotifications()
      setIsModalOpen(false)

      // Notificar todos os componentes de notificação sobre a nova notificação
      notifyNewNotification()
    } catch (error) {
      console.error("Erro ao salvar notificação:", error)
      alert("Erro ao salvar notificação. Tente novamente.")
    }
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Data inválida';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Data inválida';
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return 'Data inválida';
    }
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
      <header className="bg-gradient-to-r from-purple-800 to-purple-900 text-white p-3 sm:p-4 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link 
                href="/admin" 
                className="p-1.5 rounded-full hover:bg-purple-700 transition-colors duration-200 flex-shrink-0"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap">
                Gerenciar Notificações
              </h1>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={loadNotifications}
                className="w-full bg-purple-700 hover:bg-purple-600 text-white px-4 py-2.5 sm:py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                title="Atualizar notificações"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Atualizar</span>
              </button>
              <button
                onClick={handleAddNotification}
                className="w-full bg-white hover:bg-gray-50 text-purple-900 px-4 py-2.5 sm:py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Nova Notificação</span>
                <span className="sm:hidden">Nova</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center mb-4">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700 mr-1 sm:mr-2 transition-all duration-200" />
            <h2 className="text-lg font-semibold text-purple-900">Notificações do Sistema</h2>
          </div>

          <p className="text-gray-600 mb-4">
            Gerencie as notificações que serão exibidas para os usuários. As notificações podem ser usadas para informar
            sobre feriados, promoções, atualizações do sistema e outros avisos importantes.
          </p>

          {notifications.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4 transition-all duration-200" />
              <p className="text-gray-500">Nenhuma notificação cadastrada.</p>
              <p className="text-gray-500">Clique em "Nova Notificação" para começar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="border rounded-lg overflow-hidden">
                  <div
                    className={`p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 ${notification.active ? "bg-white" : "bg-gray-50"}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center">
                        {getNotificationTypeIcon(notification.type)}
                        <h3 className="font-semibold ml-2 text-sm sm:text-base">{notification.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getNotificationTypeColor(notification.type)}`}
                        >
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                        {notification.active ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Ativa</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">Inativa</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end sm:justify-start space-x-2 mt-2 sm:mt-0">
                      <button 
                        onClick={() => handleEditNotification(notification)} 
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                        title="Editar notificação"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                        disabled={deleteStatus?.id === notification.id && deleteStatus.status === "pending"}
                        title="Excluir notificação"
                      >
                        {deleteStatus?.id === notification.id && deleteStatus.status === "pending" ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 border-t bg-gray-50">
                    <p className="text-gray-700 text-sm mb-2">{notification.message}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600">Prioridade:</span>
                        <span className="ml-1">{notification.priority}</span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <div className="flex flex-wrap items-center">
                        <span className="font-medium text-gray-600">Período:</span>
                        <span className="ml-1">
                          {notification.startDate ? formatDate(notification.startDate) : 'N/I'} até {notification.endDate ? formatDate(notification.endDate) : 'N/I'}
                        </span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600">Criada em:</span>
                        <span className="ml-1">{formatDate(notification.createdAt)}</span>
                      </div>
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
                    value={(() => {
                      try {
                        const date = new Date(editingNotification.startDate)
                        return isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16)
                      } catch {
                        return ''
                      }
                    })()}
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
                    value={(() => {
                      try {
                        const date = new Date(editingNotification.endDate)
                        return isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16)
                      } catch {
                        return ''
                      }
                    })()}
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
