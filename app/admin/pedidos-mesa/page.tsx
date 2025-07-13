"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Users, Clock, RefreshCw, Check, X, Eye, Printer, QrCode, AlertCircle, Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrderService } from "@/lib/services/order-service"
import { TableService } from "@/lib/services/table-service"
import { updateOrderStatus } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useNotificationSound } from "@/hooks/useNotificationSound"
import type { Order, OrderStatus, Table } from "@/lib/types"

export default function PedidosMesaPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'ready' | 'completed'>('all')
  const [showNewOrderNotification, setShowNewOrderNotification] = useState(false)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [newOrdersData, setNewOrdersData] = useState<Order[]>([])
  const [showSoundActivationMessage, setShowSoundActivationMessage] = useState(false)
  
  const { playSound } = useNotificationSound()
  const prevOrdersRef = useRef<Order[]>([])
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notificationTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Função para tocar o som de notificação específico para mesas
  const startTableSound = useCallback(() => {
    try {
      // Criar um novo elemento de áudio se não existir
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/new-table-order.mp3');
        audioRef.current.volume = 0.8; // Volume um pouco mais alto para diferenciar
        
        // Configurar para tocar em loop
        audioRef.current.loop = true;
      }
      
      // Adicionar um evento de clique ao documento para iniciar o som
      const playSound = () => {
        if (audioRef.current) {
          audioRef.current.play().catch(err => {
            console.error('Erro ao reproduzir som de mesa após interação:', err);
          });
          // Remover o listener após o primeiro clique
          document.removeEventListener('click', playSound);
        }
      };
      
      // Tentar reproduzir diretamente
      audioRef.current.play().catch(err => {
        console.log('Aguardando interação do usuário para tocar o som de mesa...');
        setShowSoundActivationMessage(true);
        document.addEventListener('click', playSound);
      });
    } catch (err) {
      console.error('Erro ao configurar som de mesa:', err);
    }
  }, [setShowSoundActivationMessage]);
  
  // Função para parar o som
  const stopTableSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setShowSoundActivationMessage(false);
  }, [setShowSoundActivationMessage]);

  // Verificar autenticação
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin_authenticated") === "true"
    if (!isAuthenticated) {
      window.location.href = "/admin/login"
      return
    }
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [])

  // Configurar polling para verificar novos pedidos de mesa
  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    const loadAndProcessOrders = async (silent = true) => {
      if (isFetching) return;
      isFetching = true;
      
      try {
        if (isMounted) {
          await loadOrders(silent);
        }
      } finally {
        if (isMounted) {
          isFetching = false;
        }
      }
    };
    
    // Configurar polling a cada 5 segundos
    const pollingInterval = setInterval(() => {
      if (isMounted) {
        void loadAndProcessOrders(true);
      }
    }, 5000);
    
    checkIntervalRef.current = pollingInterval;
    
    // Limpar intervalo ao desmontar
    return () => {
      isMounted = false;
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      if (notificationTimeoutRef.current) {
        clearInterval(notificationTimeoutRef.current);
      }
      
      // Parar o som ao desmontar
      stopTableSound();
    };
  }, [isSoundEnabled, startTableSound, stopTableSound]);

  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadOrders(),
        loadTables()
      ])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadOrders = async (silent = false) => {
    try {
      const tableOrders = await OrderService.getTableOrders()
      
      // Verificar se há novos pedidos que ainda não foram notificados
      const newOrders = tableOrders.filter(order => !order.notified && order.status === "new")
      
      // Se houver novos pedidos, marcá-los como notificados
      if (newOrders.length > 0) {
        try {
          // Marcar cada pedido como notificado no banco de dados
          await Promise.all(
            newOrders.map(order =>
              OrderService.markOrderAsNotified(order.id).catch(error => {
                console.error(`Erro ao marcar pedido de mesa ${order.id} como notificado:`, error);
                return false;
              })
            )
          );
          
          // Atualizar os pedidos localmente para refletir a mudança
          const updatedOrders = tableOrders.map(order => 
            newOrders.some(o => o.id === order.id) 
              ? { ...order, notified: true } 
              : order
          );
          
          // Tocar som e mostrar notificação para novos pedidos de mesa
          if (isSoundEnabled && !silent) {
            startTableSound();
          }
          
          // Definir contador exato de novos pedidos (não acumular)
          setNewOrdersCount(newOrders.length);
          
          // Armazenar dados dos novos pedidos para mostrar mesas específicas
          setNewOrdersData(newOrders);
          
          // Mostrar notificação
          setShowNewOrderNotification(true);
          
          // Atualizar a referência para os pedidos atuais
          prevOrdersRef.current = updatedOrders;
          setOrders(updatedOrders);
          
        } catch (error) {
          console.error("Erro ao marcar pedidos de mesa como notificados:", error);
          setOrders(tableOrders);
        }
      } else {
        // Se não houver novos pedidos, atualizar normalmente
        prevOrdersRef.current = tableOrders;
        setOrders(tableOrders);
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos de mesa:", error)
    }
  }

  const loadTables = async () => {
    try {
      const tablesData = await TableService.getAllTables()
      setTables(tablesData)
    } catch (error) {
      console.error("Erro ao carregar mesas:", error)
    }
  }

  // Atualizar pedidos a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [isSoundEnabled])

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    if (updatingStatus) return
    
    setUpdatingStatus(true)
    try {
      await updateOrderStatus(orderId, newStatus)
      await loadOrders()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      alert("Erro ao atualizar status do pedido")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadOrders()
    } catch (error) {
      console.error("Erro ao atualizar pedidos:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Função para aceitar os novos pedidos
  const handleAcceptOrders = () => {
    setShowNewOrderNotification(false)
    setNewOrdersCount(0)
    setNewOrdersData([])
    stopTableSound()
    
    // Scroll para a área dos pedidos
    const ordersSection = document.querySelector('[data-orders-section]')
    if (ordersSection) {
      ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 300, behavior: 'smooth' })
    }
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
  }

  const getTableName = (tableId?: number) => {
    if (!tableId) return "Mesa não identificada"
    const table = tables.find(t => t.id === tableId)
    return table ? table.name : `Mesa ${tableId}`
  }

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter(order => order.status === status)
  }

  const getFilteredOrders = () => {
    if (filter === 'all') return orders
    if (filter === 'pending') return orders.filter(order => 
      ['new', 'pending', 'preparing'].includes(order.status)
    )
    if (filter === 'ready') return orders.filter(order => order.status === 'ready')
    if (filter === 'completed') return orders.filter(order => 
      ['delivered', 'completed'].includes(order.status)
    )
    return orders
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-orange-100 text-orange-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'Novo'
      case 'pending': return 'Pendente'
      case 'preparing': return 'Preparando'
      case 'ready': return 'Pronto'
      case 'delivered': return 'Entregue'
      case 'completed': return 'Concluído'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  // Formatar número de telefone
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return ''
    
    // Remove todos os caracteres não numéricos
    const numbers = phone.replace(/\D/g, '')
    
    // Formata conforme o padrão brasileiro
    if (numbers.length === 11) {
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`
    } else if (numbers.length === 10) {
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`
    }
    
    return phone
  }

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {getTableName(order.tableId)}
              </CardTitle>
              <p className="text-sm text-gray-600">
                Pedido #{order.id} • {order.customerName}
              </p>
            </div>
          </div>
          <Badge className={`${getStatusColor(order.status)} ${order.status === 'new' ? 'flash-animation' : ''}`}>
            {getStatusText(order.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total:</span>
          <span className="font-semibold text-lg">{formatCurrency(order.total)}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Há:</span>
          <span>{formatDistanceToNow(order.date, { locale: ptBR })}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Pagamento:</span>
          <span className="capitalize">{order.paymentMethod}</span>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Button
            onClick={() => handleViewDetails(order)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Detalhes
          </Button>
          
          {order.status === 'new' && (
            <Button
              onClick={() => handleStatusChange(order.id, 'preparing')}
              disabled={updatingStatus}
              size="sm"
              className="flex-1 pulse-button-animation"
            >
              <Check className="w-4 h-4 mr-2" />
              Aceitar
            </Button>
          )}
          
          {order.status === 'preparing' && (
            <Button
              onClick={() => handleStatusChange(order.id, 'ready')}
              disabled={updatingStatus}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Pronto
            </Button>
          )}
          
          {order.status === 'ready' && (
            <Button
              onClick={() => handleStatusChange(order.id, 'delivered')}
              disabled={updatingStatus}
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Entregue
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/admin" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <div className="flex items-center">
              <Users size={20} className="text-white/90 mr-2" />
              <h1 className="text-xl font-bold">Pedidos das Mesas</h1>
            </div>
          </div>
        </header>
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      </div>
    )
  }

  return (
          <>
      <style jsx global>{`
        @keyframes blink {
          0%, 50% { 
            opacity: 1; 
            background-color: rgb(34 197 94); /* green-600 */
          }
          51%, 100% { 
            opacity: 0.8; 
            background-color: rgb(21 128 61); /* green-700 */
          }
        }
        
        @keyframes flash {
          0%, 50% { 
            opacity: 1; 
          }
          51%, 100% { 
            opacity: 0.4; 
          }
        }
        
        @keyframes pulse-button {
          0%, 50% { 
            opacity: 1;
            transform: scale(1);
          }
          51%, 100% { 
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
        
        .flash-animation {
          animation: flash 1.5s ease-in-out infinite;
        }
        
        .pulse-button-animation {
          animation: pulse-button 1.2s ease-in-out infinite;
        }
      `}</style>
      
      <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 via-purple-800 to-purple-900 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/admin" className="mr-4 hover:bg-white/10 p-2 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div className="flex items-center">
              <Users size={20} className="text-white/90 mr-2" />
              <h1 className="text-xl font-bold">Pedidos das Mesas</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              title={isSoundEnabled ? "Som ativado (notificações de mesa)" : "Som desativado"}
            >
              {isSoundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Notificação de novos pedidos de mesa com efeito piscante */}
      {showNewOrderNotification && (
        <div className="bg-green-600 text-white p-4 shadow-lg" style={{
          animation: 'blink 1s linear infinite'
        }}>
          <div className="container mx-auto">
            <div className="flex flex-col items-center space-y-3">
              <div className="text-center">
                <p className="font-bold text-lg">
                  {newOrdersCount} novo{newOrdersCount > 1 ? 's' : ''} pedido{newOrdersCount > 1 ? 's' : ''}!
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {newOrdersData.map((order, index) => (
                    <span key={order.id} className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                      {getTableName(order.tableId) || `Mesa ${order.tableId || 'N/A'}`}
                    </span>
                  ))}
                </div>
              </div>
              
              <Button
                onClick={handleAcceptOrders}
                size="lg"
                className="bg-white text-green-600 hover:bg-green-50 font-bold px-8 py-3 text-lg rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 animate-bounce"
                style={{
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.8)'
                }}
              >
                ACEITAR PEDIDO{newOrdersCount > 1 ? 'S' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de ativação de som */}
      {showSoundActivationMessage && (
        <div className="bg-blue-600 text-white p-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-center">
            <div className="text-center">
              <p className="font-bold">Clique em qualquer lugar para ativar o som de notificações</p>
              <p className="text-sm opacity-90">
                Necessário para reproduzir sons de novos pedidos de mesa
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto p-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {getOrdersByStatus('new').length}
                </p>
                <p className="text-sm text-gray-600">Novos</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {getOrdersByStatus('preparing').length}
                </p>
                <p className="text-sm text-gray-600">Preparando</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {getOrdersByStatus('ready').length}
                </p>
                <p className="text-sm text-gray-600">Prontos</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {orders.length}
                </p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex space-x-2 mb-6" data-orders-section>
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
          >
            Todos
          </Button>
          <Button
            onClick={() => setFilter('pending')}
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
          >
            Pendentes
          </Button>
          <Button
            onClick={() => setFilter('ready')}
            variant={filter === 'ready' ? 'default' : 'outline'}
            size="sm"
          >
            Prontos
          </Button>
          <Button
            onClick={() => setFilter('completed')}
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
          >
            Concluídos
          </Button>
        </div>

        {/* Lista de Pedidos */}
        {getFilteredOrders().length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">
                {filter === 'all' 
                  ? "Nenhum pedido de mesa encontrado"
                  : `Nenhum pedido ${filter === 'pending' ? 'pendente' : filter === 'ready' ? 'pronto' : 'concluído'} encontrado`
                }
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Os pedidos feitos através dos QR codes das mesas aparecerão aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredOrders().map(renderOrderCard)}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Pedido #{selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 pb-4">
              {/* Informações básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mesa</p>
                  <p className="text-lg font-bold">{getTableName(selectedOrder.tableId)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Data/Hora</p>
                  <p className="text-sm">{new Date(selectedOrder.date).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {getStatusText(selectedOrder.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedOrder.total)}</p>
                </div>
              </div>

              {/* Informações do cliente */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm text-gray-700 mb-3">Cliente</h4>
                <div className="space-y-2">
                  <p className="font-medium text-lg">{selectedOrder.customerName}</p>
                  {selectedOrder.customerPhone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <span className="font-medium mr-2">Telefone:</span>
                      <span>{formatPhoneNumber(selectedOrder.customerPhone)}</span>
                    </div>
                  )}
                  {selectedOrder.customerPhone && (
                    <div className="flex space-x-2 mt-2">
                      <a 
                        href={`tel:${selectedOrder.customerPhone}`} 
                        className="text-xs flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                         </svg>
                        Ligar
                      </a>
                      <a 
                        href={`https://wa.me/55${selectedOrder.customerPhone.replace(/\D/g, '')}`} 
                        className="text-xs flex items-center text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 448 512" fill="currentColor">
                          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Itens do pedido */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm text-gray-700 mb-3">Itens do Pedido</h4>
                <ul className="space-y-4">
                  {selectedOrder.items.map((item, index) => (
                    <li key={index} className="border-b pb-3 last:border-b-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium">
                          {item.quantity}x {item.name} <span className="text-sm text-gray-600">({item.size})</span>
                        </span>
                        <span className="text-right sm:text-left font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                      
                      {item.additionals && item.additionals.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-purple-700 italic font-medium">Adicionais Complementos:</p>
                          <ul className="pl-4 space-y-1 mt-1">
                            {item.additionals.map((additional, idx) => (
                              <li key={idx} className="text-sm flex flex-col sm:flex-row sm:justify-between">
                                <span>
                                  • {additional.quantity || 1}x {additional.name}
                                </span>
                                <span className="pl-4 sm:pl-0 text-right sm:text-left">
                                  {additional.price > 0 ? formatCurrency(additional.price * (additional.quantity || 1)) : 
                                  <span className="text-green-600 font-medium">Grátis</span>}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Informação sobre colher */}
                      {item.needsSpoon !== undefined && (
                        <div className={`mt-2 ${item.needsSpoon ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'} border-l-4 p-2 rounded-r-md`}>
                          <div className="flex items-start">
                            <span className={`inline-block w-2.5 h-2.5 ${item.needsSpoon ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600'} rounded-full mr-1.5 mt-0.5 flex-shrink-0`}></span>
                            <div className="text-sm">
                              <span className={`font-semibold ${item.needsSpoon ? 'text-green-800' : 'text-red-800'}`}>
                                Precisa de colher: {item.needsSpoon ? (
                                  item.spoonQuantity && item.spoonQuantity > 1 ? 
                                    `Sim (${item.spoonQuantity} colheres)` : 
                                    'Sim (1 colher)'
                                ) : 'Não'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Observações do cliente */}
                      {item.notes && item.notes.trim() !== "" && (
                        <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded-r-md">
                          <div className="flex items-start">
                            <span className="inline-block w-2.5 h-2.5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full mr-1.5 mt-1 flex-shrink-0"></span>
                            <div className="text-sm">
                              <span className="font-semibold text-yellow-800">Observação:</span>
                              <span className="text-yellow-700 ml-1">{item.notes}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Informações de pagamento */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm text-gray-700 mb-3">Pagamento</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-700">Método:</span>
                    <span className="text-right font-medium">{selectedOrder.paymentMethod}</span>
                    
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="text-right font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
                    
                    <span className="text-gray-700">Taxa de entrega:</span>
                    <span className="text-right font-medium text-green-600">R$ 0,00 (Mesa)</span>
                    
                    {selectedOrder.paymentChange && parseFloat(selectedOrder.paymentChange) > 0 && (
                      <>
                        <span className="text-gray-700">Pago com:</span>
                        <span className="text-right font-medium">
                          {formatCurrency(parseFloat(selectedOrder.paymentChange))}
                        </span>
                        <span className="text-green-700 font-semibold">Troco:</span>
                        <span className="text-right text-green-700 font-semibold">
                          {formatCurrency(Math.round((parseFloat(selectedOrder.paymentChange) - selectedOrder.total) * 100) / 100)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-lg font-bold">Total</p>
                <p className="text-lg font-bold">{formatCurrency(selectedOrder.total)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
} 