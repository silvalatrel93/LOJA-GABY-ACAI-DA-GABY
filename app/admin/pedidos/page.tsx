"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Printer, RefreshCw, Bell, BellOff, X, MessageSquare, Trash2, Truck, MapPin, Share2 } from "lucide-react"
import { getAllOrders, markOrderAsPrinted, updateOrderStatus, type Order } from "@/lib/db"
import { OrderService, subscribeToOrderChanges } from "@/lib/services/order-service"
import { WhatsAppService } from "@/lib/services/whatsapp-service"
import { MapsService } from "@/lib/services/maps-service"
import { DeliveryConfigService } from "@/lib/services/delivery-config-service"
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
  const [lastPlayedSoundForOrder, setLastPlayedSoundForOrder] = useState<number | null>(null)
  const [showNewOrderNotification, setShowNewOrderNotification] = useState(false)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSoundActivationMessage, setShowSoundActivationMessage] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState<boolean>(true)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState<Order | null>(null)
  const [defaultDeliveryPhone, setDefaultDeliveryPhone] = useState('')
  const [shouldAutoPrint, setShouldAutoPrint] = useState(false)
  const [printQueue, setPrintQueue] = useState<Order[]>([])
  const [currentPrintIndex, setCurrentPrintIndex] = useState(0)
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
      const ordersList = await OrderService.getDeliveryOrders();

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
    } else {
      // Sempre atualizar a lista para garantir sincronização após exclusões
      console.log(`🔄 Atualizando lista de pedidos. Novos pedidos: ${orders.length}, Anteriores: ${prevOrdersRef.current?.length || 0}`);
      React.startTransition(() => {
        if (isMounted) {
          prevOrdersRef.current = orders;
          setOrders(orders);
          console.log(`✅ Lista de pedidos atualizada com ${orders.length} pedidos`);
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

  // Carregar número padrão do entregador ao montar o componente
  useEffect(() => {
    const loadDefaultDeliveryPhone = () => {
      const phone = DeliveryConfigService.getDefaultDeliveryPhone();
      setDefaultDeliveryPhone(phone);
    };

    loadDefaultDeliveryPhone();
  }, []);

  // Configurar verificação periódica de novos pedidos e subscrição real-time
  useEffect(() => {
    let isMounted = true;
    let isFetching = false;
    let realtimeChannel: any = null;

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

    // Configurar subscrição real-time para novos pedidos
    const setupRealtimeSubscription = () => {
      console.log('🔄 Configurando subscrição real-time para pedidos...');

      realtimeChannel = subscribeToOrderChanges(
        (payload) => {
          console.log('📨 Mudança real-time detectada:', payload);
          if (!isMounted) return;

          // Usar payload.eventType que é o campo correto para postgres_changes
          switch (payload.eventType) {
            case 'INSERT':
              console.log('🆕 Novo pedido recebido, adicionando à lista...');
              setOrders(currentOrders => {
                const newOrder = payload.new as Order;
                // Evitar adicionar duplicados
                if (currentOrders.some(o => o.id === newOrder.id)) {
                  return currentOrders;
                }
                // Tocar som para novo pedido
                if (isSoundEnabled) {
                  startContinuousSound();
                  setLastPlayedSoundForOrder(newOrder.id);
                }
                return [newOrder, ...currentOrders];
              });
              break;

            case 'UPDATE':
              console.log(`🔄 Pedido #${payload.new.id} atualizado, atualizando na lista...`);
              setOrders(currentOrders =>
                currentOrders.map(order =>
                  order.id === payload.new.id ? { ...order, ...(payload.new as Order) } : order
                )
              );
              break;

            case 'DELETE':
              console.log(`🗑️ Pedido #${payload.old.id} excluído, removendo da lista...`);
              setOrders(currentOrders =>
                currentOrders.filter(order => order.id !== payload.old.id)
              );
              break;

            default:
              // Apenas logar eventos não esperados, sem recarregar a lista inteira
              console.log(`Evento não tratado ou desconhecido: ${payload.eventType}`);
              break;
          }
        },
        (error) => {
          console.error('❌ Erro na subscrição real-time de pedidos:', error);
        }
      );
    };

    // Configurar subscrição real-time
    setupRealtimeSubscription();

    // Polling de fallback desativado para priorizar a atualização granular por real-time
    const pollingInterval = null; // Desativado temporariamente para teste
    /*
    const pollingInterval = setInterval(() => {
      if (isMounted) {
        void loadAndProcessOrders(true);
      }
    }, 60000); // Aumentado para 60 segundos para ser um fallback menos agressivo
    */

    // Armazenar a referência do intervalo
    checkIntervalRef.current = pollingInterval;

    // Limpar intervalos, timeouts e subscrições ao desmontar
    return () => {
      isMounted = false;

      // Limpar subscrição real-time
      if (realtimeChannel) {
        console.log('🔌 Desconectando subscrição real-time de pedidos...');
        realtimeChannel.unsubscribe();
        realtimeChannel = null;
      }

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
      console.log(`Iniciando envio de confirmação para pedido #${order.id}`);
      console.log(`Dados do pedido:`, {
        id: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        hasPhone: !!order.customerPhone,
        phoneLength: order.customerPhone?.length || 0
      });

      // Executar diagnóstico completo do pedido
      const diagnosis = WhatsAppService.diagnoseOrder(order);
      console.log(`Diagnóstico do pedido #${order.id}:`, diagnosis);

      // Se há problemas críticos, mostrar erro detalhado
      if (!diagnosis.isValid) {
        const errorMessage = `❌ Não é possível enviar confirmação para o pedido #${order.id}\n\n` +
          `Problemas encontrados:\n${diagnosis.issues.map(issue => `• ${issue}`).join('\n')}` +
          (diagnosis.warnings.length > 0 ? `\n\nAvisos:\n${diagnosis.warnings.map(warning => `• ${warning}`).join('\n')}` : '') +
          `\n\nVerifique os dados do pedido e tente novamente.`;

        console.error(`Pedido #${order.id}: Falha na validação:`, diagnosis.issues);
        alert(errorMessage);
        return;
      }

      // Se há avisos, mostrar mas continuar
      if (diagnosis.warnings.length > 0) {
        console.warn(`Pedido #${order.id}: Avisos encontrados:`, diagnosis.warnings);
        const warningMessage = `⚠️ Avisos para o pedido #${order.id}:\n\n${diagnosis.warnings.map(warning => `• ${warning}`).join('\n')}\n\nDeseja continuar mesmo assim?`;

        if (!confirm(warningMessage)) {
          console.log(`Pedido #${order.id}: Envio cancelado pelo usuário devido aos avisos`);
          return;
        }
      }

      console.log(`Pedido #${order.id}: Enviando confirmação via WhatsApp...`);
      const success = await WhatsAppService.sendOrderConfirmation(order);

      if (success) {
        console.log(`Pedido #${order.id}: Confirmação enviada com sucesso`);
        // Adicionar à lista de mensagens enviadas
        sentWhatsAppMessagesRef.current.add(order.id);

        // Mostrar feedback visual de sucesso
        const button = document.querySelector(`[data-order-id="${order.id}"] .whatsapp-button`);
        if (button) {
          button.classList.add('bg-green-200', 'text-green-800');
          button.classList.remove('bg-green-100', 'text-green-700');
          setTimeout(() => {
            button.classList.remove('bg-green-200', 'text-green-800');
            button.classList.add('bg-green-100', 'text-green-700');
          }, 2000);
        }

        // Confirmação enviada silenciosamente
      } else {
        console.error(`Pedido #${order.id}: Falha ao enviar confirmação`);
        alert(`❌ Erro ao enviar confirmação para o pedido #${order.id}.\n\nPossíveis causas:\n• Popup bloqueado pelo navegador\n• Problema na formatação do telefone\n• WhatsApp não instalado\n\nTelefone: ${order.customerPhone}\n\nVerifique o console para mais detalhes.`);
      }
    } catch (error) {
      console.error(`Erro ao enviar mensagem de WhatsApp para pedido #${order.id}:`, error);
      alert(`❌ Erro inesperado ao enviar mensagem de WhatsApp para o pedido #${order.id}.\n\nDetalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nVerifique o console para mais informações.`);
    }
  }, []);

  // Função para enviar notificação de saída para entrega
  const handleSendDeliveryNotification = React.useCallback(async (order: Order): Promise<void> => {
    try {
      await WhatsAppService.sendDeliveryNotification(order);
    } catch (error) {
      console.error("Erro ao enviar notificação de entrega:", error);
      alert("Erro ao enviar notificação de entrega. Verifique o console para mais detalhes.");
    }
  }, []);

  // Função para abrir rota no Google Maps
  const handleOpenMapsRoute = React.useCallback((order: Order): void => {
    try {
      MapsService.openMapsRoute(order);
    } catch (error) {
      console.error("Erro ao abrir rota no Google Maps:", error);
      alert("Erro ao abrir rota no Google Maps. Verifique o console para mais detalhes.");
    }
  }, []);

  // Função para compartilhar rota com entregador
  const handleShareRouteWithDelivery = React.useCallback((order: Order): void => {
    try {
      setSelectedDeliveryOrder(order);
      setShowDeliveryModal(true);
    } catch (error) {
      console.error("Erro ao compartilhar rota com entregador:", error);
      alert("Erro ao compartilhar rota com entregador. Verifique o console para mais detalhes.");
    }
  }, []);

  // Função para confirmar compartilhamento da rota
  const handleConfirmShareRoute = React.useCallback((deliveryPhone: string, saveAsDefault: boolean = false): void => {
    try {
      if (selectedDeliveryOrder && deliveryPhone.trim()) {
        // Salvar como padrão se solicitado
        if (saveAsDefault) {
          DeliveryConfigService.updateDefaultDeliveryPhone(deliveryPhone.trim());
          setDefaultDeliveryPhone(deliveryPhone.trim());
        }

        MapsService.shareRouteWithDelivery(selectedDeliveryOrder, deliveryPhone.trim());
        setShowDeliveryModal(false);
        setSelectedDeliveryOrder(null);
      }
    } catch (error) {
      console.error("Erro ao compartilhar rota com entregador:", error);
      alert("Erro ao compartilhar rota com entregador. Verifique o console para mais detalhes.");
    }
  }, [selectedDeliveryOrder]);

  // Função para abrir a página de impressão do pedido
  const openPrintPage = React.useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsPrinterModalOpen(true);
  }, []);

  // Funções auxiliares removidas - usando as definições mais adiante no código

  const handleStatusChange = React.useCallback(async (orderId: Order['id'], status: OrderStatus, order?: Order): Promise<void> => {
    try {
      // Otimisticamente atualiza o estado local primeiro
      setOrders(currentOrders =>
        currentOrders.map(o => (o.id === orderId ? { ...o, status } : o))
      );

      // Envia a atualização para o backend
      await updateOrderStatus(orderId, status);
      // A subscrição real-time (evento UPDATE) cuidará de re-sincronizar o estado
      // caso haja alguma discrepância, eliminando a necessidade de `loadOrders`.

      // Lógica de impressão para o status 'completed'
      if (status === 'completed' && order) {
        console.log(`Configurando impressão automática para o pedido #${orderId} após marcar como concluído`);
        setPrintQueue([order]);
        setCurrentPrintIndex(0);
        setSelectedOrder(order);
        setIsPrinterModalOpen(true);
        setShouldAutoPrint(true);
        setCurrentPrintIndex(1);
      }
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      alert("Erro ao atualizar status do pedido. Tente novamente.");
      // Reverter a mudança otimista em caso de erro
      // (Opcional, mas recomendado para uma UI robusta)
      // Para isso, seria necessário buscar o estado original do pedido.
    }
  }, []);

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
      console.log(`🗑️ Iniciando exclusão do pedido #${order.id}...`);
      console.log(`📊 Lista atual tem ${orders.length} pedidos`);
      
      // Remover imediatamente da lista local para feedback visual instantâneo
      setOrders(currentOrders => {
        const filteredOrders = currentOrders.filter(o => o.id !== order.id);
        console.log(`🔄 Removendo pedido #${order.id} da lista local. Antes: ${currentOrders.length}, Depois: ${filteredOrders.length}`);
        return filteredOrders;
      });
      
      // Atualizar também a referência para evitar conflitos
      prevOrdersRef.current = prevOrdersRef.current.filter(o => o.id !== order.id);
      
      const success = await OrderService.deleteOrder(order.id);

      if (success) {
        console.log(`✅ Pedido #${order.id} excluído com sucesso no banco de dados`);

        // A lista já foi atualizada localmente. A subscrição em tempo real cuidará da sincronização final.
        // Não é necessário recarregar a lista inteira.

        // Mostrar mensagem de sucesso
        console.log(`🎉 Exclusão do pedido #${order.id} concluída com sucesso`);
        alert(`Pedido #${order.id} excluído com sucesso!`);
      } else {
        console.error(`❌ Falha ao excluir pedido #${order.id} no banco de dados`);
        // Se a exclusão falhar, a UI pode ficar dessincronizada.
        // A melhor abordagem seria reverter a atualização otimista.
        // Por enquanto, um alerta informa o usuário e a subscrição real-time deve corrigir.
        alert(`Falha ao excluir o pedido #${order.id}. A lista pode estar dessincronizada.`);
        throw new Error('Falha ao excluir pedido');
      }
    } catch (error) {
      console.error(`💥 Erro ao excluir pedido #${order.id}:`, error);
      // Em caso de erro, a UI pode ficar dessincronizada.
      alert(`Erro ao excluir o pedido #${order.id}. Tente novamente.`);
    }
  }, [loadOrders, orders]);

  // Função para processar a fila de impressão
  const processNextPrintInQueue = React.useCallback(() => {
    if (printQueue.length > 0 && currentPrintIndex < printQueue.length) {
      const nextOrder = printQueue[currentPrintIndex];
      console.log(`Imprimindo pedido ${currentPrintIndex + 1} de ${printQueue.length}: #${nextOrder.id}`);
      
      setSelectedOrder(nextOrder);
      setIsPrinterModalOpen(true);
      setShouldAutoPrint(true);
      setCurrentPrintIndex(prev => prev + 1);
    } else {
      // Fila concluída, limpar estados
      console.log('Fila de impressão concluída!');
      setPrintQueue([]);
      setCurrentPrintIndex(0);
      setShouldAutoPrint(false);
    }
  }, [printQueue, currentPrintIndex]);

  const handlePrintComplete = React.useCallback(() => {
    console.log('Impressão concluída...');
    setIsPrinterModalOpen(false);
    setSelectedOrder(null);
    
    // Se há mais pedidos na fila, processar o próximo após um pequeno delay
    if (printQueue.length > 0 && currentPrintIndex < printQueue.length) {
      setTimeout(() => {
        processNextPrintInQueue();
      }, 1000); // 1 segundo de delay entre impressões
    } else {
      // Última impressão, resetar estados
      const totalPrinted = printQueue.length;
      setShouldAutoPrint(false);
      setPrintQueue([]);
      setCurrentPrintIndex(0);
      
      // Notificar conclusão da fila se foram múltiplos pedidos
      if (totalPrinted > 1) {
        setTimeout(() => {
          // Tocar som de conclusão se disponível
          try {
            const completionSound = new Audio('/sounds/completion.mp3');
            completionSound.volume = 0.5;
            completionSound.play().catch(() => {
              // Ignorar erro se som não estiver disponível
            });
          } catch (error) {
            // Ignorar erro de som
          }
          
          alert(`✅ Fila de impressão concluída!\n\n${totalPrinted} etiquetas foram impressas automaticamente.`);
        }, 500);
      }
    }
  }, [printQueue, currentPrintIndex, processNextPrintInQueue]);

  const getStatusColor = (status: OrderStatus): string => {
    // Usar a cor #92c730 para todos os status, com uma versão mais clara para o fundo
    return "bg-[#e8f5d3] text-[#5a7c1e]";
  };

  const getStatusText = (status: OrderStatus): string => {
    switch (status) {
      case "new":
        return "Novo"
      case "pending_payment":
        return "Pago"
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
    if (!phone) {
      return 'Não informado';
    }
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

  // Funções para compartilhamento de rota

  // handleSendDeliveryNotification já definido anteriormente

  // handleOpenMapsRoute já definido anteriormente

  // handleShareRouteWithDelivery e handleConfirmShareRoute já definidos anteriormente

  // Função para atualizar a lista de pedidos
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadOrders(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadOrders]);

  // Função para fechar notificação de novos pedidos
  const handleCloseNotification = React.useCallback(() => {
    setShowNewOrderNotification(false);
    setNewOrdersCount(0);
    stopContinuousSound();
  }, [stopContinuousSound]);

  // Função para imprimir múltiplos pedidos
  const handlePrintMultiple = React.useCallback((selectedOrders: Order[]) => {
    if (selectedOrders.length === 0) return;
    
    // Configurar fila de impressão
    setPrintQueue(selectedOrders);
    setCurrentPrintIndex(0);
    
    // Iniciar com o primeiro pedido
    setSelectedOrder(selectedOrders[0]);
    setIsPrinterModalOpen(true);
    setShouldAutoPrint(true);
    setCurrentPrintIndex(1);
  }, []);

  // Função para alternar som
  const handleToggleSound = React.useCallback(() => {
    setIsSoundEnabled(prev => !prev);
    if (isSoundEnabled) {
      stopContinuousSound();
    }
  }, [isSoundEnabled, stopContinuousSound]);

  // Função para alternar envio automático de WhatsApp
  const handleToggleAutoWhatsApp = React.useCallback(() => {
    setAutoSendWhatsApp(prev => !prev);
  }, []);

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

              <div className="flex items-center ml-2 sm:ml-3">
                <Truck size={20} className="text-white/90 mr-2" />
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate max-w-[180px] sm:max-w-none">
                  Pedidos Delivery
                </h1>
              </div>
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

                      // Configurar fila de impressão para todos os pedidos atualizados
                      if (ordersToUpdate.length > 0) {
                        console.log(`Configurando fila de impressão para ${ordersToUpdate.length} pedidos...`);
                        
                        // Pequeno atraso para garantir que a interface seja atualizada primeiro
                        setTimeout(() => {
                          // Configurar a fila de impressão
                          setPrintQueue(ordersToUpdate);
                          setCurrentPrintIndex(0);
                          
                          // Iniciar a impressão do primeiro pedido
                          console.log(`Iniciando impressão automática em lote para ${ordersToUpdate.length} pedidos`);
                          setSelectedOrder(ordersToUpdate[0]);
                          setIsPrinterModalOpen(true);
                          setShouldAutoPrint(true);
                          setCurrentPrintIndex(1); // Próximo será o índice 1
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
                  data-order-id={order.id}
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
                            {order.customerPhone && (
                              <>
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
                                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                                  </svg>
                                  WhatsApp
                                </a>
                              </>
                            )}
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
                          {order.address.street}{order.address.number ? `, ${order.address.number}` : ''}
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
                        {(Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? JSON.parse(order.items) : [])).map((item: any, index: number) => (
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
                                  {item.additionals.map((additional: any, idx: number) => (
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
                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                          </svg>
                          WhatsApp
                        </a>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleSendWhatsApp(order)}
                            className="whatsapp-button text-xs flex items-center bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded transition-colors duration-200"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Enviar Confirmação
                          </button>
                          <button
                            onClick={() => handleSendDeliveryNotification(order)}
                            className="text-xs flex items-center bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded"
                          >
                            <Truck className="h-3 w-3 mr-1" />
                            Saiu para Entrega
                          </button>
                          <button
                            onClick={() => handleOpenMapsRoute(order)}
                            className="text-xs flex items-center bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            Ver Rota
                          </button>
                          <button
                            onClick={() => handleShareRouteWithDelivery(order)}
                            className="text-xs flex items-center bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-1 rounded"
                          >
                            <Share2 className="h-3 w-3 mr-1" />
                            Compartilhar
                          </button>
                        </div>
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
              <div>
                <h2 className="text-lg font-semibold text-purple-900">Imprimir Etiqueta</h2>
                {printQueue.length > 1 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      Imprimindo {currentPrintIndex} de {printQueue.length} pedidos
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentPrintIndex / printQueue.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setIsPrinterModalOpen(false);
                  // Limpar fila se o usuário cancelar
                  setPrintQueue([]);
                  setCurrentPrintIndex(0);
                  setShouldAutoPrint(false);
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-200"
                data-component-name="OrdersPage"
              >
                {printQueue.length > 1 ? 'Cancelar Fila' : 'Fechar'}
              </button>
            </div>

            <div className="p-4">
              <OrderLabelPrinter order={selectedOrder} onPrintComplete={handlePrintComplete} autoPrint={shouldAutoPrint} />
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

      {/* Modal de Compartilhamento de Rota */}
      {showDeliveryModal && selectedDeliveryOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-purple-900">Compartilhar Rota com Entregador</h2>
              <button
                onClick={() => {
                  setShowDeliveryModal(false);
                  setSelectedDeliveryOrder(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-gray-700 mb-2">Pedido #{selectedDeliveryOrder.id}</h3>
                <p className="text-sm text-gray-600">
                  Cliente: {selectedDeliveryOrder.customerName}<br />
                  Endereço: {selectedDeliveryOrder.address.street}{selectedDeliveryOrder.address.number ? `, ${selectedDeliveryOrder.address.number}` : ''} - {selectedDeliveryOrder.address.neighborhood}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Entregador (com DDD):
                </label>
                <input
                  type="tel"
                  placeholder="(44) 99999-9999"
                  defaultValue={defaultDeliveryPhone}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      const checkbox = document.getElementById('save-as-default') as HTMLInputElement;
                      if (target.value.trim()) {
                        handleConfirmShareRoute(target.value.trim(), checkbox?.checked || false);
                      }
                    }
                  }}
                  autoFocus
                />
                {defaultDeliveryPhone && (
                  <p className="text-xs text-gray-500 mt-1">
                    Número padrão carregado. Você pode alterar se necessário.
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    id="save-as-default"
                    defaultChecked={!defaultDeliveryPhone}
                    className="mr-2 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">
                    Salvar como número padrão do entregador
                  </span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeliveryModal(false);
                    setSelectedDeliveryOrder(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="tel"]') as HTMLInputElement;
                    const checkbox = document.getElementById('save-as-default') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleConfirmShareRoute(input.value.trim(), checkbox?.checked || false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Compartilhar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

