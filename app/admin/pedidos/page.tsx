"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Printer, RefreshCw, Bell, BellOff, X, MessageSquare, Trash2 } from "lucide-react"
import { getAllOrders, markOrderAsPrinted, updateOrderStatus, type Order } from "@/lib/db"
import { OrderService } from "@/lib/services/order-service"
import { WhatsAppService } from "@/lib/services/whatsapp-service"
import type { OrderStatus } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import OrderLabelPrinter from "@/components/order-label-printer"
import OrderCounterReset from "@/components/order-counter-reset"
import { useNotificationSound } from "@/hooks/useNotificationSound"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [showNewOrderNotification, setShowNewOrderNotification] = useState(false)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSoundActivationMessage, setShowSoundActivationMessage] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState<boolean>(true)
  const { playSound } = useNotificationSound()
  const prevOrdersRef = useRef<Order[]>([])
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notificationTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sentWhatsAppMessagesRef = useRef<Set<number>>(new Set())

  // Função para tocar o som de notificação continuamente
  const startContinuousSound = useCallback(() => {
    try {
      // Criar um novo elemento de áudio se não existir
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/new-order.mp3');
        audioRef.current.volume = 0.7; // Volume mais alto (70%)
        
        // Configurar para tocar em loop
        audioRef.current.loop = true;
      }
      
      // Adicionar um evento de clique ao documento para iniciar o som
      // (contorna a política de autoplay dos navegadores)
      const playSound = () => {
        if (audioRef.current) {
          audioRef.current.play().catch(err => {
            console.error('Erro ao reproduzir som após interação:', err);
          });
          // Remover o listener após o primeiro clique
          document.removeEventListener('click', playSound);
        }
      };
      
      // Tentar reproduzir diretamente (pode falhar devido à política de autoplay)
      audioRef.current.play().catch(err => {
        console.log('Aguardando interação do usuário para tocar o som...');
        // Mostrar mensagem para o usuário clicar na tela
        setShowSoundActivationMessage(true);
        // Adicionar o listener de clique se a reprodução direta falhar
        document.addEventListener('click', playSound);
      });
    } catch (err) {
      console.error('Erro ao configurar som:', err);
    }
  }, [setShowSoundActivationMessage]);
  
  // Função para parar o som
  const stopContinuousSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Resetar a mensagem de ativação de som
    setShowSoundActivationMessage(false);
  }, [setShowSoundActivationMessage]);

  // Função para carregar pedidos
  const fetchOrders = React.useCallback(async (silent = false, isMounted = true): Promise<Order[] | null> => {
    try {
      if (!silent) setIsLoading(true);
      const ordersList = await getAllOrders();
      
      if (!isMounted) return null;
      
      // Ordenar por data, mais recentes primeiro
      return [...ordersList].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      return null;
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Função para processar e atualizar pedidos
  const processOrders = React.useCallback(async (orders: Order[] | null, isMounted = true) => {
    if (!orders || !isMounted) return;
    
    // Verificar se há novos pedidos que ainda não foram notificados
    // Em vez de comparar com a referência anterior, verificamos a propriedade notified
    const newOrders = orders.filter(order => !order.notified && order.status === "new");
    
    // Enviar mensagem de WhatsApp para novos pedidos se o envio automático estiver ativado
    if (autoSendWhatsApp && newOrders.length > 0) {
      newOrders.forEach(order => {
        // Verificar se já enviamos mensagem para este pedido
        if (!sentWhatsAppMessagesRef.current.has(order.id)) {
          console.log(`Preparando para enviar mensagem WhatsApp para o pedido #${order.id}`);
          
          // Marcar como enviado para evitar envios duplicados
          sentWhatsAppMessagesRef.current.add(order.id);
          
          // Enviar a mensagem de WhatsApp
          const whatsappUrl = WhatsAppService.prepareOrderConfirmation(order);
          if (whatsappUrl && typeof window !== 'undefined') {
            // Abrir em uma nova janela
            window.open(whatsappUrl, '_blank');
          }
        }
      });
    }
    
    // Se houver novos pedidos, marcá-los como notificados
    if (newOrders.length > 0) {
      try {
        // Marcar cada pedido como notificado no banco de dados
        await Promise.all(
          newOrders.map(order =>
            OrderService.markOrderAsNotified(order.id).catch(error => {
              console.error(`Erro ao marcar pedido ${order.id} como notificado:`, error);
              return false; // Continuar mesmo em caso de erro
            })
          )
        );
        
        // Atualizar os pedidos localmente para refletir a mudança
        const updatedOrders = orders.map(order => 
          newOrders.some(o => o.id === order.id) 
            ? { ...order, notified: true } 
            : order
        );
        
        // Usar atualização de estado em lote
        React.startTransition(() => {
          if (!isMounted) return;
          
          // Tocar som e mostrar notificação para novos pedidos
          if (isSoundEnabled) {
            // Iniciar o som contínuo que tocará em loop até ser parado
            startContinuousSound();
          }
          
          // Atualizar contador de novos pedidos
          setNewOrdersCount(prev => prev + newOrders.length);
          
          // Mostrar notificação (permanecerá visível até ser fechada manualmente)
          setShowNewOrderNotification(true);
          
          // Atualizar a referência para os pedidos atuais
          prevOrdersRef.current = updatedOrders;
          setOrders(updatedOrders);
        });
        
      } catch (error) {
        console.error("Erro ao marcar pedidos como notificados:", error);
        // Continuar mesmo em caso de erro
      }
    } else if (JSON.stringify(prevOrdersRef.current) !== JSON.stringify(orders)) {
      // Se não houver novos pedidos, mas houver outras mudanças, atualizar a lista
      React.startTransition(() => {
        if (isMounted) {
          prevOrdersRef.current = orders;
          setOrders(orders);
        }
      });
    }
  }, [isSoundEnabled, startContinuousSound, showNewOrderNotification]);

  // Função para carregar pedidos (usada externamente)
  const loadOrders = React.useCallback(async (silent = false): Promise<void> => {
    const orders = await fetchOrders(silent);
    if (orders) {
      processOrders(orders);
    }
  }, [fetchOrders, processOrders]);

  // Configurar verificação periódica de novos pedidos
  useEffect(() => {
    let isMounted = true;
    let isFetching = false;
    
    // Função para carregar e processar pedidos
    const loadAndProcessOrders = async (silent = true) => {
      if (isFetching) return;
      isFetching = true;
      
      try {
        const orders = await fetchOrders(silent, isMounted);
        if (orders && isMounted) {
          processOrders(orders, isMounted);
        }
      } finally {
        if (isMounted) {
          isFetching = false;
        }
      }
    };
    
    // Carregar pedidos iniciais
    void loadAndProcessOrders(false);
    
    // Configurar polling a cada 5 segundos para verificar novos pedidos mais rapidamente
    const pollingInterval = setInterval(() => {
      if (isMounted) {
        void loadAndProcessOrders(true);
      }
    }, 5000); // Reduzido de 30000 para 5000 (5 segundos)
    
    // Armazenar a referência do intervalo
    checkIntervalRef.current = pollingInterval;
    
    // Limpar intervalos e timeouts ao desmontar
    return () => {
      isMounted = false;
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      
      if (notificationTimeoutRef.current) {
        clearInterval(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
    };
  }, [fetchOrders, processOrders, isSoundEnabled]); // Dependências do efeito

  // Função para enviar manualmente mensagem de WhatsApp para um pedido
  const handleSendWhatsApp = React.useCallback(async (order: Order): Promise<void> => {
    try {
      await WhatsAppService.sendOrderConfirmation(order);
      // Adicionar à lista de mensagens enviadas
      sentWhatsAppMessagesRef.current.add(order.id);
    } catch (error) {
      console.error("Erro ao enviar mensagem de WhatsApp:", error);
      alert("Erro ao enviar mensagem de WhatsApp. Verifique o console para mais detalhes.");
    }
  }, []);
  
  // Função para abrir a página de impressão do pedido
  const openPrintPage = React.useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsPrinterModalOpen(true);
  }, []);

  const handleStatusChange = React.useCallback(async (orderId: Order['id'], status: OrderStatus, order?: Order): Promise<void> => {
    try {
      await updateOrderStatus(orderId, status);
      // Atualizar a lista de pedidos
      await loadOrders(true); // Usar carregamento silencioso
      
      // Se o status for 'completed' e temos o objeto do pedido, abrir a página de impressão automaticamente
      if (status === 'completed' && order) {
        console.log(`Abrindo página de impressão para o pedido #${orderId} após marcar como concluído`);
        openPrintPage(order);
      }
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      alert("Erro ao atualizar status do pedido. Tente novamente.");
    }
  }, [loadOrders, openPrintPage]);

  const handlePrintLabel = React.useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsPrinterModalOpen(true);
  }, []);

  const handleDeleteOrder = React.useCallback(async (order: Order, event: React.MouseEvent) => {
    event.stopPropagation(); // Impedir que o clique abra o modal do pedido
    
    // Confirmar com o usuário antes de excluir
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o Pedido #${order.id}?\n\n` +
      `Cliente: ${order.customerName}\n` +
      `Total: ${formatCurrency(order.total)}\n\n` +
      `Esta ação não pode ser desfeita.`
    );

    if (!confirmDelete) return;

    try {
      console.log(`Excluindo pedido #${order.id}...`);
      const success = await OrderService.deleteOrder(order.id);
      
      if (success) {
        console.log(`Pedido #${order.id} excluído com sucesso`);
        // Recarregar a lista de pedidos
        await loadOrders(true);
        
        // Mostrar mensagem de sucesso
        alert(`Pedido #${order.id} excluído com sucesso!`);
      } else {
        throw new Error('Falha ao excluir pedido');
      }
    } catch (error) {
      console.error(`Erro ao excluir pedido #${order.id}:`, error);
      alert(`Erro ao excluir o pedido #${order.id}. Tente novamente.`);
    }
  }, [loadOrders]);

  const handlePrintComplete = React.useCallback(async () => {
    if (selectedOrder?.id) {
      try {
        await markOrderAsPrinted(selectedOrder.id);
        await loadOrders(true); // Usar carregamento silencioso
      } catch (error) {
        console.error("Erro ao marcar pedido como impresso:", error);
      }
    }
    setIsPrinterModalOpen(false);
    setSelectedOrder(null);
  }, [selectedOrder, loadOrders]);

  const getStatusColor = (status: OrderStatus): string => {
    // Usar a cor #92c730 para todos os status, com uma versão mais clara para o fundo
    return "bg-[#e8f5d3] text-[#5a7c1e]";
  };

  const getStatusText = (status: OrderStatus): string => {
    switch (status) {
      case "new":
        return "Novo"
      case "preparing":
        return "Em Preparo"
      case "delivering":
        return "Em Entrega"
      case "completed":
        return "Concluído"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }
  
  // Função para definir a cor da borda lateral com base no status do pedido
  const getOrderBorderColor = (status: OrderStatus): string => {
    // Usar a cor #92c730 para todos os status
    return "bg-[#92c730]";
  };

  // Função para gerar cores de fundo diferentes para cada pedido com base no ID
  const getOrderBackgroundColor = (orderId: number): string => {
    // Array de classes de cores suaves para alternar
    const backgroundColors = [
      'bg-white',
      'bg-purple-50',
      'bg-blue-50',
      'bg-green-50',
      'bg-yellow-50',
      'bg-orange-50',
      'bg-pink-50',
      'bg-indigo-50',
      'bg-teal-50',
    ];
    
    // Usar o módulo do ID para selecionar uma cor
    // Isso garante que o mesmo pedido sempre tenha a mesma cor
    const colorIndex = orderId % backgroundColors.length;
    return backgroundColors[colorIndex];
  };

  // Função para formatar número de telefone no padrão brasileiro
  const formatPhoneNumber = (phone: string): string => {
    // Remover todos os caracteres não numéricos
    const numbers = phone.replace(/\D/g, '');
    
    // Verificar se é um número válido com DDD
    if (numbers.length === 11) {
      // Formato: (XX) XXXXX-XXXX
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
    } else if (numbers.length === 10) {
      // Formato: (XX) XXXX-XXXX (telefone fixo)
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`;
    }
    
    // Retornar o número original se não for possível formatar
    return phone;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-purple-800 to-purple-900 text-white border-b border-purple-700/50 sticky top-0 z-20 shadow-lg">
        <div className="container mx-auto px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Lado esquerdo - Navegação */}
            <div className="flex items-center">
              <Link 
                href="/admin" 
                className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-all duration-200 flex items-center justify-center active:scale-95"
                aria-label="Voltar para o painel"
              >
                <ArrowLeft size={20} className="text-white/90" />
              </Link>
              
              <h1 className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-white tracking-tight truncate max-w-[180px] sm:max-w-none">
                Gerenciar Pedidos
              </h1>
            </div>
            
            {/* Lado direito - Botões de ação */}
            <div className="flex items-center gap-2">
              {/* Botão de som - mobile */}
              <button 
                onClick={() => setIsSoundEnabled(!isSoundEnabled)} 
                className="sm:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 active:scale-95"
                title={isSoundEnabled ? "Desativar notificações de som" : "Ativar notificações de som"}
                aria-label={isSoundEnabled ? "Desativar som" : "Ativar som"}
              >
                {isSoundEnabled ? (
                  <Bell size={20} className="text-emerald-400" />
                ) : (
                  <BellOff size={20} className="text-amber-400" />
                )}
              </button>

              {/* Botão de som - desktop */}
              <button 
                onClick={() => setIsSoundEnabled(!isSoundEnabled)} 
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 active:scale-[0.98] bg-white/10 hover:bg-white/20"
                title={isSoundEnabled ? "Desativar notificações de som" : "Ativar notificações de som"}
                aria-label={isSoundEnabled ? "Desativar som" : "Ativar som"}
              >
                {isSoundEnabled ? (
                  <>
                    <Bell size={16} className="text-emerald-400" />
                    <span>Som Ativo</span>
                  </>
                ) : (
                  <>
                    <BellOff size={16} className="text-amber-400" />
                    <span>Som Inativo</span>
                  </>
                )}
              </button>
              
              {/* Botão de atualizar - mobile */}
              <button
                onClick={() => loadOrders(false)}
                className="sm:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 active:scale-95"
                title="Atualizar pedidos"
                aria-label="Atualizar lista de pedidos"
              >
                <RefreshCw size={20} className="text-white/90" />
              </button>
              
              {/* Botão de atualizar - desktop */}
              <button
                onClick={() => loadOrders(false)}
                className="hidden sm:flex items-center gap-1.5 bg-white text-purple-900 hover:bg-purple-50 px-3 py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md"
                title="Atualizar lista de pedidos"
              >
                <RefreshCw size={16} className="text-purple-700" />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notificação de novo pedido */}
      {showNewOrderNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-green-600 text-white px-8 py-6 rounded-lg shadow-2xl max-w-md w-full animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Bell className="mr-2 sm:mr-3 w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200" />
                <p className="font-bold text-xl">Novo Pedido Recebido!</p>
              </div>
              <button 
                onClick={() => {
                  // Parar o som contínuo
                  stopContinuousSound();
                  
                  // Limpar o intervalo se existir
                  if (notificationTimeoutRef.current) {
                    clearInterval(notificationTimeoutRef.current);
                    notificationTimeoutRef.current = null;
                  }
                  setShowNewOrderNotification(false);
                  setNewOrdersCount(0);
                }}
                className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-green-700 transition-colors"
                aria-label="Fechar notificação"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-green-700 px-5 py-4 rounded-md mb-5">
              <p className="text-lg font-medium text-center">{newOrdersCount} novo{newOrdersCount > 1 ? 's' : ''} pedido{newOrdersCount > 1 ? 's' : ''} para preparo</p>
              
              {showSoundActivationMessage && (
                <div className="mt-3 bg-yellow-600 p-3 rounded-md animate-pulse">
                  <p className="text-white text-center font-medium">
                    Clique em qualquer lugar da tela para ativar o som de notificação
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-center pt-2">
              <button
                onClick={async () => {
                  // Parar o som contínuo
                  stopContinuousSound();
                  
                  // Marcar como concluído e fechar notificação
                  if (notificationTimeoutRef.current) {
                    clearInterval(notificationTimeoutRef.current);
                    notificationTimeoutRef.current = null;
                  }
                  setShowNewOrderNotification(false);
                  setNewOrdersCount(0);
                  
                  // Obter os novos pedidos e atualizar seus status para "completed"
                  // Vamos atualizar TODOS os pedidos visíveis na tela para "completed"
                  // Isso garante que o usuário veja a mudança imediatamente
                  try {
                    // Indicar que estamos atualizando o status
                    setUpdatingStatus(true);
                    console.log('Atualizando todos os pedidos visíveis para "completed"...');
                    
                    // Primeiro, vamos atualizar a interface imediatamente para feedback visual
                    const updatedOrders = orders.map(order => {
                      if (order.status === "new") {
                        console.log(`Marcando pedido #${order.id} como concluído na interface`);
                        return { ...order, status: "completed" as OrderStatus };
                      }
                      return order;
                    });
                    
                    // Atualizar o estado local imediatamente para feedback visual
                    setOrders(updatedOrders);
                    
                    // Agora, atualizar no banco de dados
                    const ordersToUpdate = orders.filter(order => order.status === "new");
                    console.log(`Encontrados ${ordersToUpdate.length} pedidos para atualizar no banco de dados`);
                    
                    if (ordersToUpdate.length > 0) {
                      // Atualizar cada pedido no banco de dados
                      for (const order of ordersToUpdate) {
                        console.log(`Atualizando pedido #${order.id} no banco de dados...`);
                        const success = await updateOrderStatus(order.id, "completed");
                        console.log(`Pedido #${order.id} atualizado com sucesso: ${success}`);
                      }
                      
                      // Recarregar os pedidos do servidor após a atualização
                      console.log('Recarregando pedidos do servidor...');
                      await loadOrders(true);
                      console.log('Pedidos recarregados com sucesso');
                      
                      // Abrir automaticamente a página de impressão para o primeiro pedido atualizado
                      if (ordersToUpdate.length > 0) {
                        // Pequeno atraso para garantir que a interface seja atualizada primeiro
                        setTimeout(() => {
                          console.log(`Abrindo página de impressão para o pedido #${ordersToUpdate[0].id}`);
                          openPrintPage(ordersToUpdate[0]);
                        }, 500); // 500ms de atraso para garantir que a UI esteja atualizada
                      }
                      
                      // Desativar o estado de atualização
                      setUpdatingStatus(false);
                    } else {
                      console.log('Nenhum pedido com status "new" encontrado para atualizar no banco de dados');
                    }
                  } catch (error) {
                    console.error("Erro ao atualizar status dos pedidos:", error);
                    // Mesmo em caso de erro, tentamos recarregar os pedidos para garantir a sincronização
                    await loadOrders(true);
                  } finally {
                    // Garantir que o estado de atualização seja desativado mesmo em caso de erro
                    setUpdatingStatus(false);
                  }
                  
                  // Redirecionar para a seção de novos pedidos
                  const newOrdersSection = document.getElementById('new-orders-section');
                  if (newOrdersSection) {
                    newOrdersSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-white text-green-700 px-6 py-3 rounded-md font-medium text-lg hover:bg-green-100 transition-colors w-full flex items-center justify-center"
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-green-700 border-t-transparent animate-spin mr-2"></span>
                    Atualizando...
                  </>
                ) : (
                  'Concluído'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-purple-900">Pedidos Recebidos</h2>
            <div className="w-full sm:w-auto">
              <OrderCounterReset />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum pedido recebido ainda.</p>
          ) : (
            <div id="new-orders-section" className="space-y-5">
              {orders.map((order) => (
                <div 
                  key={order.id} 
                  className={`relative border rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] cursor-pointer ${getOrderBackgroundColor(order.id)}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  {/* Borda lateral colorida baseada no status do pedido */}
                  <div 
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${getOrderBorderColor(order.status)}`}
                    aria-hidden="true"
                  ></div>
                  <div className="p-4 pl-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">Pedido #{order.id}</h3>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(order.date), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center flex-wrap gap-2">
                        {updatingStatus && order.status === "new" ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 mr-2 flex items-center">
                            <span className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            Concluindo...
                          </span>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)} mr-2`}>
                            {getStatusText(order.status)}
                          </span>
                        )}
                        {order.printed && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full mr-2">Impresso</span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Impedir que o clique abra o modal do pedido
                            handlePrintLabel(order);
                          }}
                          className="bg-purple-100 text-purple-800 p-1 rounded-full hover:bg-purple-200 transition-colors"
                          title="Imprimir Etiqueta"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteOrder(order, e)}
                          className="bg-red-100 text-red-800 p-1 rounded-full hover:bg-red-200 transition-colors"
                          title="Excluir Pedido"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h4 className="font-medium text-sm text-gray-700">Cliente</h4>
                      <div className="flex flex-col">
                        <p className="font-medium">{order.customerName}</p>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            <div className="flex flex-col">
                              <span className="mr-1 font-medium">CELULAR</span>
                              <span>{formatPhoneNumber(order.customerPhone)}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <a 
                              href={`tel:${order.customerPhone}`} 
                              className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                              </svg>
                              Ligar
                            </a>
                            <a 
                              href={`https://wa.me/55${order.customerPhone.replace(/\D/g, '')}`} 
                              className="text-xs flex items-center text-green-600 hover:text-green-800"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 448 512" fill="currentColor">
                                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                              </svg>
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h4 className="font-medium text-sm text-gray-700">Endereço</h4>
                      <div className="flex flex-col">
                        {/* Tipo de endereço */}
                        {order.address.addressType && (
                          <p className="text-xs text-purple-600 font-medium mb-1 flex items-center">
                            {order.address.addressType === 'casa' && '🏠 Casa'}
                            {order.address.addressType === 'apto' && '🏢 Apartamento'}
                            {order.address.addressType === 'condominio' && '🏘️ Condomínio'}
                          </p>
                        )}
                        <p className="font-medium">
                          {order.address.street}, {order.address.number}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.address.neighborhood}
                          {order.address.complement && ` (${order.address.complement})`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h4 className="font-medium text-sm text-gray-700">Itens do Pedido</h4>
                      <ul className="space-y-3">
                        {order.items.map((item, index) => (
                          <li key={index} className="border-b pb-2 last:border-b-0">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium">
                                {item.quantity}x {item.name} <span className="text-sm text-gray-600">({item.size})</span>
                              </span>
                              <span className="text-right sm:text-left font-medium">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                            {item.additionals && item.additionals.length > 0 ? (
                              <div className="mt-1">
                                <p className="text-sm text-purple-700 italic">Adicionais Complementos:</p>
                                <ul className="pl-4 space-y-1">
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
                            ) : null}
                            
                            {/* Exibir informação de colher */}
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
                            
                            {/* Exibir observações do cliente */}
                            {item.notes && item.notes.trim() !== "" && (
                              <div className="mt-1 bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded-r-md">
                                <div className="flex items-start">
                                  <span className="inline-block w-2.5 h-2.5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full mr-1.5 mt-1 flex-shrink-0"></span>
                                  <div className="text-sm">
                                    <span className="font-semibold text-yellow-800">Obs:</span>
                                    <span className="text-yellow-700 ml-1">{item.notes}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-700">Subtotal</span>
                        <span className="text-right font-medium">{formatCurrency(order.subtotal)}</span>
                        
                        <span className="text-gray-700">Taxa de entrega</span>
                        <span className="text-right font-medium">{formatCurrency(order.deliveryFee)}</span>
                        
                        {/* Explicação da taxa de entrega para picolés */}
                        {(() => {
                          const isPicoleOnlyOrder = order.items.every(item => {
                            const picoléTerms = ["PICOLÉ", "PICOLÉ AO LEITE", "PICOLE", "PICOLE AO LEITE", "PICOLÉ AO LEITÉ", "PICOLE AO LEITÉ"]
                            const itemCategory = item.name || ""
                            return picoléTerms.some(term => itemCategory.toUpperCase().includes(term))
                          })
                          
                          if (isPicoleOnlyOrder && order.deliveryFee > 0 && order.subtotal < 20) {
                            return (
                              <div className="col-span-2 text-center">
                                <span className="text-xs italic text-gray-500">
                                  * Taxa aplicada para picolés abaixo de R$ 20,00
                                </span>
                              </div>
                            )
                          }
                          return null
                        })()}

                        {/* Explicação da taxa de entrega para moreninha */}
                        {(() => {
                          const isMoreninhaOnlyOrder = order.items.every(item => {
                            const itemCategory = item.name || ""
                            return itemCategory.toUpperCase().includes("MORENINHA")
                          })
                          
                          if (isMoreninhaOnlyOrder && order.deliveryFee > 0 && order.subtotal < 17) {
                            return (
                              <div className="col-span-2 text-center">
                                <span className="text-xs italic text-gray-500">
                                  * Taxa aplicada para moreninha abaixo de R$ 17,00
                                </span>
                              </div>
                            )
                          }
                          return null
                        })()}
                        
                        <span className="text-gray-900 font-bold">Total</span>
                        <span className="text-right font-bold text-purple-700">{formatCurrency(order.total)}</span>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-gray-700">Forma de pagamento</span>
                          <span className="text-right font-medium">
                            {order.paymentMethod === "pix" 
                              ? "Pix na Entrega" 
                              : order.paymentMethod === "card" 
                                ? "Cartão na Entrega" 
                                : "Dinheiro"
                            }
                          </span>
                        
                          {order.paymentMethod === "money" && order.paymentChange && parseFloat(order.paymentChange) > 0 && (
                            <>
                              <span className="text-sm text-gray-700">Valor pago</span>
                              <span className="text-sm text-right font-medium">
                                {formatCurrency(parseFloat(order.paymentChange))}
                              </span>
                              <span className="text-sm text-green-700 font-semibold">Troco</span>
                              <span className="text-sm text-right text-green-700 font-semibold">
                                {formatCurrency(Math.round((parseFloat(order.paymentChange) - order.total) * 100) / 100)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-between">
                        <a 
                          href={`https://wa.me/55${order.customerPhone?.replace(/\D/g, '')}`} 
                          className="text-xs flex items-center text-green-600 hover:text-green-800" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          data-component-name="OrdersPage"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 448 512" fill="currentColor">
                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                          </svg>
                          WhatsApp
                        </a>
                        <button
                          onClick={() => handleSendWhatsApp(order)}
                          className="text-xs flex items-center bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Enviar Confirmação
                        </button>
                      </div>
                    </div>


                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Impressão */}
      {isPrinterModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-purple-900">Imprimir Etiqueta</h2>
              <button
                onClick={() => setIsPrinterModalOpen(false)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-200"
                data-component-name="OrdersPage"
              >
                Fechar
              </button>
            </div>

            <div className="p-4">
              <OrderLabelPrinter order={selectedOrder} onPrintComplete={handlePrintComplete} />
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setIsPrinterModalOpen(false)}
                className="hidden px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
