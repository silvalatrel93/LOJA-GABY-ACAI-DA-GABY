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

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Verificar permissão de notificação
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission as NotificationPermission);
    }
  }, []);

  // Registrar service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          setRegistration(registration);
          console.log('Service Worker registrado com sucesso:', registration);
        } catch (error) {
          console.error('Falha ao registrar Service Worker:', error);
        }
      };

      registerServiceWorker();
    }
  }, []);

  // Verificar inscrição existente
  const checkSubscription = useCallback(async () => {
    if (!registration) return;

    try {
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
      setIsSubscribed(!!existingSubscription);
      return existingSubscription;
    } catch (error) {
      console.error('Erro ao verificar inscrição:', error);
      return null;
    }
  }, [registration]);

  // Solicitar permissão e se inscrever para notificações push
  const subscribeToPushNotifications = useCallback(async () => {
    if (!registration) {
      console.error('Service Worker não registrado');
      return null;
    }

    try {
      // Verificar permissão
      if (permission === 'denied') {
        console.warn('Permissão para notificações foi negada');
        return null;
      }

      if (permission === 'default') {
        const permissionResult = await Notification.requestPermission();
        setPermission(permissionResult as NotificationPermission);
        
        if (permissionResult !== 'granted') {
          console.warn('Permissão para notificações não concedida');
          return null;
        }
      }

      // Obter chave pública VAPID do servidor
      const response = await fetch('/api/push/vapid-public-key');
      if (!response.ok) {
        throw new Error('Falha ao obter chave pública VAPID');
      }
      const vapidPublicKey = await response.text();
      
      // Converter a chave VAPID para o formato Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      // Inscrever o usuário para notificações push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      // Enviar a inscrição para o servidor
      await sendSubscriptionToServer(subscription);
      
      setSubscription(subscription);
      setIsSubscribed(true);
      
      return subscription;
    } catch (error) {
      console.error('Erro ao se inscrever para notificações push:', error);
      return null;
    }
  }, [permission, registration]);

  // Cancelar inscrição nas notificações push
  const unsubscribeFromPushNotifications = useCallback(async () => {
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      await removeSubscriptionFromServer(subscription);
      
      setSubscription(null);
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Erro ao cancelar inscrição nas notificações push:', error);
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
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Usuário não autenticado. Inscrição não será salva.');
      return;
    }
    
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(
          subscription.getKey('p256dh') as ArrayBuffer
        ))),
        auth: btoa(String.fromCharCode(...new Uint8Array(
          subscription.getKey('auth') as ArrayBuffer
        )))
      }
    };
    
    // Salvar no banco de dados
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,  // Certifique-se de que user_id está em minúsculas
        subscription: subscriptionData,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        onConflictUpdateColumns: ['subscription', 'updated_at']
      });
    
    if (error) {
      console.error('Erro ao salvar inscrição:', error);
      throw error;
    }
  };

  // Remover inscrição do servidor
  const removeSubscriptionFromServer = async (subscription: PushSubscription) => {
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('Usuário não autenticado ao tentar remover inscrição');
        return;
      }
      
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Erro ao remover inscrição:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro em removeSubscriptionFromServer:', error);
      throw error;
    }
  };

  return {
    permission,
    isSubscribed,
    subscription,
    checkSubscription,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    requestPermission: () => Notification.requestPermission().then(p => {
      setPermission(p as NotificationPermission);
      return p;
    })
  };
}

export default usePushNotifications;
