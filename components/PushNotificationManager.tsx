'use client';

import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, X } from 'lucide-react';

interface PushNotificationManagerProps {
  autoSubscribe?: boolean;
  children?: React.ReactNode;
}

export default function PushNotificationManager({ 
  autoSubscribe = true,
  children 
}: PushNotificationManagerProps) {
  const { 
    permission, 
    isSubscribed, 
    subscribeToPushNotifications, 
    checkSubscription,
    requestPermission
  } = usePushNotifications();
  
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Verificar inscrição ao carregar o componente
  useEffect(() => {
    let isMounted = true;
    
    const verifySubscription = async () => {
      try {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          await checkSubscription();
          
          // Mostrar prompt após 5 segundos se o usuário não estiver inscrito e não tiver negado permissão
          if (isMounted && !isSubscribed && permission !== 'denied' && !hasInteracted) {
            setTimeout(() => {
              if (isMounted && !isSubscribed && !hasInteracted) {
                setShowPrompt(true);
              }
            }, 5000);
          }
        }
      } catch (error) {
        console.warn('Erro ao verificar inscrição de notificações:', error);
      }
    };
    
    verifySubscription();
    
    return () => {
      isMounted = false;
    };
  }, [checkSubscription, isSubscribed, permission, hasInteracted]);

  // Lidar com a inscrição automática
  useEffect(() => {
    let isMounted = true;
    
    const attemptAutoSubscribe = async () => {
      if (!autoSubscribe || permission !== 'granted' || isSubscribed || isLoading) {
        return;
      }
      
      try {
        if (isMounted) setIsLoading(true);
        
        await subscribeToPushNotifications();
        
        if (isMounted) {
          setHasInteracted(true);
          setShowPrompt(false);
        }
      } catch (error) {
        // Não mostrar erro ao usuário para inscrição automática
        console.warn('Falha na inscrição automática:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    attemptAutoSubscribe();
    
    return () => {
      isMounted = false;
    };
  }, [autoSubscribe, permission, isSubscribed, subscribeToPushNotifications, isLoading]);

  // Mostrar feedback ao usuário
  const handleSubscribe = async () => {
    // Marcar que o usuário interagiu com o prompt
    setHasInteracted(true);
    setShowPrompt(false);
    
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      if (permission === 'denied') {
        toast({
          title: 'Permissão necessária',
          description: 'Por favor, ative as notificações nas configurações do seu navegador.',
          variant: 'destructive',
        });
        return;
      }

      if (permission === 'default') {
        toast({
          title: 'Solicitando permissão',
          description: 'Por favor, aceite as notificações para receber atualizações sobre seus pedidos.',
        });
        
        const result = await requestPermission();
        if (result !== 'granted') {
          toast({
            title: 'Notificações bloqueadas',
            description: 'Você precisa permitir notificações para receber atualizações.',
            variant: 'destructive',
          });
          return;
        }
      }

      if (isSubscribed) {
        // Se já estiver inscrito, não faz nada
        toast({
          title: 'Notificações ativadas',
          description: 'Você já está recebendo notificações.',
        });
      } else {
        const result = await subscribeToPushNotifications();
        
        if (result) {
          toast({
            title: 'Notificações ativadas',
            description: 'Você receberá notificações sobre seus pedidos.',
          });
        } else {
          throw new Error('Falha ao ativar notificações');
        }
      }
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
      toast({
        title: 'Erro',
        description: typeof error === 'object' && error !== null && 'message' in error
          ? `Falha: ${(error as Error).message}`
          : 'Não foi possível ativar as notificações. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para fechar o prompt sem ativar notificações
  const handleDismiss = () => {
    setShowPrompt(false);
    setHasInteracted(true);
  };

  // Renderizar botão de ativação de notificações
  const renderNotificationButton = () => {
    if (permission === 'denied') {
      return (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm flex items-start">
          <BellOff className="h-5 w-5 mr-2 flex-shrink-0 text-yellow-600" />
          <p>Você bloqueou as notificações. Para ativar, atualize as configurações do seu navegador.</p>
        </div>
      );
    }

    if (!isSubscribed) {
      return (
        <Button
          onClick={handleSubscribe}
          disabled={isLoading}
          variant="default"
          className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
        >
          {isLoading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
          ) : (
            <Bell className="h-4 w-4" />
          )}
          Ativar Notificações
        </Button>
      );
    }

    return (
      <div className="text-sm text-green-600 flex items-center">
        <Bell className="h-4 w-4 mr-1" />
        Notificações ativadas
      </div>
    );
  };

  return (
    <>
      {children}
      {showPrompt && !isSubscribed && permission !== 'denied' && (
        <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-w-xs animate-fadeIn">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-gray-900">Receba atualizações em tempo real</h3>
            <button 
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Ative as notificações para ser avisado sobre o status dos seus pedidos em tempo real.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleDismiss}>
              Agora não
            </Button>
            {renderNotificationButton()}
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
