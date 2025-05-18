import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase-client';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Função para log condicional que só exibe em ambiente de desenvolvimento
const logDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PushNotifications] ${message}`, data || '');
  }
};

// Função para log de erro que exibe em todos os ambientes, mas de forma mais controlada
const logError = (message: string, error: any) => {
  // Verificar se é um erro esperado de subscrição que não deve ser tratado como crítico
  const isExpectedError = 
    error?.message?.includes('subscription failed - no active Service Worker') ||
    error?.message?.includes('Registration failed - no Service Worker') ||
    error?.message?.includes('Permission denied');
    
  if (isExpectedError) {
    console.warn(`[PushNotifications] ${message}:`, error);
  } else {
    console.error(`[PushNotifications] ${message}:`, error);
  }
};

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Verificar permissão de notificação
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission as NotificationPermission);
      logDebug(`Status de permissão atual: ${Notification.permission}`);
    } else {
      logDebug('API de Notificação não disponível neste navegador');
    }
  }, []);

  // Registrar service worker
  useEffect(() => {
    let isMounted = true;
    
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          // Verificar se já existe um service worker registrado
          const existingRegistrations = await navigator.serviceWorker.getRegistrations();
          
          if (existingRegistrations.length > 0) {
            // Usar o primeiro service worker existente
            const existingReg = existingRegistrations[0];
            if (isMounted) {
              setRegistration(existingReg);
              logDebug('Usando Service Worker existente');
            }
          } else {
            // Registrar novo service worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            if (isMounted) {
              setRegistration(registration);
              logDebug('Service Worker registrado com sucesso');
            }
          }
        } catch (error) {
          logError('Falha ao registrar Service Worker', error);
        }
      };

      registerServiceWorker();
    } else {
      logDebug('Service Worker não suportado neste navegador');
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Verificar inscrição existente
  const checkSubscription = useCallback(async () => {
    if (!registration) {
      logDebug('Não foi possível verificar inscrição: Service Worker não registrado');
      return null;
    }

    try {
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
      setIsSubscribed(!!existingSubscription);
      
      if (existingSubscription) {
        logDebug('Inscrição existente encontrada');
      } else {
        logDebug('Nenhuma inscrição existente encontrada');
      }
      
      return existingSubscription;
    } catch (error) {
      logError('Erro ao verificar inscrição', error);
      return null;
    }
  }, [registration]);

  // Solicitar permissão e se inscrever para notificações push
  const subscribeToPushNotifications = useCallback(async () => {
    if (!registration) {
      logDebug('Não foi possível se inscrever: Service Worker não registrado');
      return null;
    }

    try {
      // Verificar se já existe uma inscrição
      const existingSubscription = await checkSubscription();
      if (existingSubscription) {
        logDebug('Já existe uma inscrição ativa, retornando-a');
        return existingSubscription;
      }
      
      // Verificar permissão
      if (permission === 'denied') {
        logDebug('Permissão para notificações foi negada pelo usuário');
        return null;
      }

      if (permission === 'default') {
        logDebug('Solicitando permissão para notificações...');
        const permissionResult = await Notification.requestPermission();
        setPermission(permissionResult as NotificationPermission);
        
        if (permissionResult !== 'granted') {
          logDebug(`Permissão para notificações não concedida: ${permissionResult}`);
          return null;
        }
      }

      logDebug('Obtendo chave pública VAPID do servidor...');
      // Obter chave pública VAPID do servidor
      let vapidPublicKey;
      try {
        const response = await fetch('/api/push/vapid-public-key');
        if (!response.ok) {
          throw new Error(`Falha ao obter chave pública VAPID: ${response.status} ${response.statusText}`);
        }
        vapidPublicKey = await response.text();
      } catch (error) {
        logError('Erro ao obter chave VAPID', error);
        return null;
      }
      
      // Converter a chave VAPID para o formato Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      logDebug('Inscrevendo usuário para notificações push...');
      // Inscrever o usuário para notificações push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      // Enviar a inscrição para o servidor
      try {
        await sendSubscriptionToServer(subscription);
        logDebug('Inscrição enviada para o servidor com sucesso');
      } catch (serverError) {
        logError('Erro ao enviar inscrição para o servidor', serverError);
        // Continuar mesmo com erro no servidor, pois a inscrição local ainda é válida
      }
      
      setSubscription(subscription);
      setIsSubscribed(true);
      
      return subscription;
    } catch (error) {
      logError('Erro ao se inscrever para notificações push', error);
      return null;
    }
  }, [permission, registration, checkSubscription]);

  // Cancelar inscrição nas notificações push
  const unsubscribeFromPushNotifications = useCallback(async () => {
    if (!subscription) {
      logDebug('Não há inscrição ativa para cancelar');
      return false;
    }

    try {
      logDebug('Cancelando inscrição no navegador...');
      await subscription.unsubscribe();
      
      try {
        logDebug('Removendo inscrição do servidor...');
        await removeSubscriptionFromServer(subscription);
      } catch (serverError) {
        // Continuar mesmo com erro no servidor
        logError('Erro ao remover inscrição do servidor', serverError);
      }
      
      setSubscription(null);
      setIsSubscribed(false);
      logDebug('Inscrição cancelada com sucesso');
      return true;
    } catch (error) {
      logError('Erro ao cancelar inscrição nas notificações push', error);
      
      // Tentar limpar o estado mesmo com erro
      try {
        setSubscription(null);
        setIsSubscribed(false);
      } catch (stateError) {
        logError('Erro ao limpar estado após falha na desinscrição', stateError);
      }
      
      return false;
    }
  }, [subscription]);

  // Função auxiliar para converter chave VAPID
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  // Enviar inscrição para o servidor
  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    if (!subscription || !subscription.endpoint) {
      throw new Error('Inscrição inválida');
    }
    
    try {
      const supabase = createSupabaseClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Erro ao obter usuário: ${userError.message}`);
      }
      
      if (!user) {
        logDebug('Usuário não autenticado. Inscrição não será salva no servidor.');
        return;
      }
      
      // Extrair chaves da inscrição com tratamento de erros
      let p256dhKey, authKey;
      try {
        p256dhKey = subscription.getKey('p256dh');
        authKey = subscription.getKey('auth');
        
        if (!p256dhKey || !authKey) {
          throw new Error('Chaves de inscrição ausentes');
        }
      } catch (keyError) {
        throw new Error(`Erro ao extrair chaves da inscrição: ${keyError instanceof Error ? keyError.message : 'Erro desconhecido'}`);
      }
      
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey as ArrayBuffer))),
          auth: btoa(String.fromCharCode(...new Uint8Array(authKey as ArrayBuffer)))
        }
      };
      
      // Salvar no banco de dados
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscriptionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        throw new Error(`Erro ao salvar inscrição: ${error.message}`);
      }
      
      logDebug('Inscrição salva no servidor com sucesso');
    } catch (error) {
      logError('Erro em sendSubscriptionToServer', error);
      throw error;
    }
  };

  // Remover inscrição do servidor
  const removeSubscriptionFromServer = async (subscription: PushSubscription) => {
    if (!subscription) {
      logDebug('Nenhuma inscrição fornecida para remoção');
      return;
    }
    
    try {
      const supabase = createSupabaseClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Erro ao obter usuário: ${userError.message}`);
      }
      
      if (!user) {
        logDebug('Usuário não autenticado ao tentar remover inscrição');
        return;
      }
      
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        throw new Error(`Erro ao remover inscrição: ${error.message}`);
      }
      
      logDebug('Inscrição removida do servidor com sucesso');
    } catch (error) {
      logError('Erro em removeSubscriptionFromServer', error);
      throw error;
    }
  };

  // Efeito para verificar a inscrição quando o service worker estiver registrado
  useEffect(() => {
    if (registration) {
      checkSubscription().catch(error => {
        logError('Erro ao verificar inscrição inicial', error);
      });
    }
  }, [registration, checkSubscription]);

  return {
    permission,
    isSubscribed,
    subscription,
    checkSubscription,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    requestPermission: async () => {
      try {
        logDebug('Solicitando permissão para notificações...');
        const result = await Notification.requestPermission();
        setPermission(result as NotificationPermission);
        logDebug(`Resultado da solicitação de permissão: ${result}`);
        return result;
      } catch (error) {
        logError('Erro ao solicitar permissão', error);
        return 'denied' as NotificationPermission;
      }
    }
  };
}

export default usePushNotifications;
