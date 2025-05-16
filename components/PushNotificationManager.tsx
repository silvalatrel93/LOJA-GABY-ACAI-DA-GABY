'use client';

import { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/components/ui/use-toast';

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

  // Verificar inscrição ao carregar o componente
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      checkSubscription();
    }
  }, [checkSubscription]);

  // Lidar com a inscrição automática
  useEffect(() => {
    if (autoSubscribe && permission === 'granted' && !isSubscribed) {
      subscribeToPushNotifications().catch(console.error);
    }
  }, [autoSubscribe, permission, isSubscribed, subscribeToPushNotifications]);

  // Mostrar feedback ao usuário
  const handleSubscribe = async () => {
    if (permission === 'denied') {
      toast({
        title: 'Permissão necessária',
        description: 'Por favor, ative as notificações nas configurações do seu navegador.',
        variant: 'destructive',
      });
      return;
    }

    if (permission === 'default') {
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

    try {
      if (isSubscribed) {
        // Se já estiver inscrito, não faz nada
        toast({
          title: 'Notificações ativadas',
          description: 'Você já está recebendo notificações.',
        });
      } else {
        await subscribeToPushNotifications();
        toast({
          title: 'Notificações ativadas',
          description: 'Você receberá notificações sobre seus pedidos.',
        });
      }
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar as notificações. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };

  // Renderizar botão de ativação de notificações
  const renderNotificationButton = () => {
    if (permission === 'denied') {
      return (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm">
          <p>Você bloqueou as notificações. Para ativar, atualize as configurações do seu navegador.</p>
        </div>
      );
    }

    if (!isSubscribed) {
      return (
        <button
          onClick={handleSubscribe}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Ativar Notificações
        </button>
      );
    }

    return (
      <div className="text-sm text-green-600 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Notificações ativadas
      </div>
    );
  };

  return (
    <>
      {children}
      {!isSubscribed && permission !== 'denied' && (
        <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-w-xs">
          <h3 className="font-medium text-gray-900 mb-2">Receba atualizações em tempo real</h3>
          <p className="text-sm text-gray-600 mb-3">
            Ative as notificações para ser avisado sobre o status dos seus pedidos.
          </p>
          <div className="flex justify-end">
            {renderNotificationButton()}
          </div>
        </div>
      )}
    </>
  );
}
