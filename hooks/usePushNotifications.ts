import { useState, useEffect, useCallback, useRef } from 'react';
import { createSupabaseClient } from '@/lib/supabase-client';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Tipos de logs para notificações push
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Função para log condicional com níveis de severidade e throttling
const logCache = new Map<string, number>();
const LOG_THROTTLE_TIME = 30000; // 30 segundos de throttle para logs repetitivos

const log = (level: LogLevel, message: string, data?: any) => {
  const prefix = `[PushNotifications]`;
  
  // Em produção, apenas logs de ERROR e WARN importantes
  if (process.env.NODE_ENV === 'production' && level === LogLevel.DEBUG) {
    return;
  }
  
  // Throttling para logs repetitivos (especialmente INFO)
  if (level === LogLevel.INFO) {
    const cacheKey = message;
    const lastLogTime = logCache.get(cacheKey) || 0;
    const now = Date.now();
    
    if (now - lastLogTime < LOG_THROTTLE_TIME) {
      return; // Pular este log se foi registrado recentemente
    }
    
    logCache.set(cacheKey, now);
  }
  
  // Formatar dados para exibição mais limpa
  const formattedData = data ? (typeof data === 'object' ? data : String(data)) : '';
  
  switch (level) {
    case LogLevel.DEBUG:
      if (process.env.NODE_ENV === 'development') {
        console.log(`${prefix} ${message}`, formattedData);
      }
      break;
    case LogLevel.INFO:
      console.info(`${prefix} ${message}`, formattedData);
      break;
    case LogLevel.WARN:
      console.warn(`${prefix} ${message}`, formattedData);
      break;
    case LogLevel.ERROR:
      console.error(`${prefix} ${message}`, formattedData);
      break;
  }
};

// Atalhos para os diferentes níveis de log
const logDebug = (message: string, data?: any) => log(LogLevel.DEBUG, message, data);
const logInfo = (message: string, data?: any) => log(LogLevel.INFO, message, data);
const logWarn = (message: string, data?: any) => log(LogLevel.WARN, message, data);

// Função para log de erro que exibe em todos os ambientes, mas de forma mais controlada
const logError = (message: string, error: any) => {
  // Verificar se é um erro esperado de subscrição que não deve ser tratado como crítico
  const isExpectedError = 
    error?.message?.includes('subscription failed - no active Service Worker') ||
    error?.message?.includes('Registration failed - no Service Worker') ||
    error?.message?.includes('Permission denied') ||
    error?.message?.includes('Failed to register a ServiceWorker') ||
    error?.message?.includes('NotAllowedError') ||
    error?.name === 'NotAllowedError';
    
  if (isExpectedError) {
    log(LogLevel.WARN, `${message} (erro esperado)`, error);
  } else {
    log(LogLevel.ERROR, message, error);
  }
};

// Interface para o estado do hook
interface PushNotificationState {
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  registration: ServiceWorkerRegistration | null;
  isLoading: boolean;
  error: Error | null;
  isSupported: boolean;
}

export function usePushNotifications() {
  // Estado centralizado para melhor gerenciamento
  const [state, setState] = useState<PushNotificationState>({
    permission: 'default',
    isSubscribed: false,
    subscription: null,
    registration: null,
    isLoading: false,
    error: null,
    isSupported: false
  });
  
  // Cache para evitar verificações repetitivas
  const lastCheckRef = useRef<number>(0);
  const CHECK_THROTTLE_TIME = 5000; // 5 segundos entre verificações
  
  // Função auxiliar para atualizar apenas parte do estado
  const updateState = useCallback((newState: Partial<PushNotificationState>) => {
    setState(prevState => ({ ...prevState, ...newState }));
  }, []);

  // Verificar suporte a notificações e permissão inicial
  useEffect(() => {
    const checkNotificationSupport = () => {
      const isSupported = (
        typeof window !== 'undefined' && 
        'Notification' in window && 
        'serviceWorker' in navigator && 
        'PushManager' in window
      );
      
      updateState({ isSupported });
      
      if (isSupported) {
        const currentPermission = Notification.permission as NotificationPermission;
        updateState({ permission: currentPermission });
        logInfo(`Status de permissão atual: ${currentPermission}`);
      } else {
        logWarn('Notificações push não são suportadas neste navegador');
      }
    };
    
    checkNotificationSupport();
  }, [updateState]);

  // Registrar service worker
  useEffect(() => {
    let isMounted = true;
    
    if (!state.isSupported) {
      return;
    }
    
    const registerServiceWorker = async () => {
      try {
        updateState({ isLoading: true, error: null });
        
        // Verificar se já existe um service worker registrado
        const existingRegistrations = await navigator.serviceWorker.getRegistrations();
        
        if (existingRegistrations.length > 0) {
          // Verificar se o service worker está ativo
          const existingReg = existingRegistrations[0];
          
          // Aguardar o service worker ficar ativo se necessário
          if (existingReg.installing) {
            logInfo('Service Worker está sendo instalado, aguardando...');
            await new Promise((resolve) => {
              existingReg.installing!.addEventListener('statechange', () => {
                if (existingReg.installing!.state === 'activated') {
                  resolve(void 0);
                }
              });
            });
          }
          
          if (existingReg.waiting) {
            logInfo('Service Worker está aguardando, ativando...');
            existingReg.waiting.postMessage({ type: 'SKIP_WAITING' });
            await new Promise((resolve) => {
              navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
            });
          }
          
          if (isMounted) {
            updateState({ 
              registration: existingReg,
              isLoading: false
            });
            logInfo('Usando Service Worker existente');
          }
        } else {
          // Registrar novo service worker com retry em caso de falha
          try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            // Aguardar o service worker ficar ativo
            if (registration.installing) {
              logInfo('Aguardando Service Worker ser instalado...');
              await new Promise((resolve) => {
                const installingWorker = registration.installing;
                if (installingWorker) {
                  installingWorker.addEventListener('statechange', () => {
                    if (installingWorker.state === 'activated') {
                      resolve(void 0);
                    }
                  });
                } else {
                  resolve(void 0);
                }
              });
            }
            
            if (isMounted) {
              updateState({ 
                registration,
                isLoading: false
              });
              logInfo('Service Worker registrado com sucesso');
            }
          } catch (initialError) {
            // Tentar novamente após um pequeno atraso
            logWarn('Primeira tentativa de registro falhou, tentando novamente...', initialError);
            
            setTimeout(async () => {
              try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                
                // Aguardar o service worker ficar ativo
                if (registration.installing) {
                  await new Promise((resolve) => {
                    const installingWorker = registration.installing;
                    if (installingWorker) {
                      installingWorker.addEventListener('statechange', () => {
                        if (installingWorker.state === 'activated') {
                          resolve(void 0);
                        }
                      });
                    } else {
                      resolve(void 0);
                    }
                  });
                }
                
                if (isMounted) {
                  updateState({ 
                    registration,
                    isLoading: false
                  });
                  logInfo('Service Worker registrado com sucesso na segunda tentativa');
                }
              } catch (retryError) {
                if (isMounted) {
                  updateState({ 
                    error: new Error('Falha ao registrar Service Worker após tentativas'),
                    isLoading: false
                  });
                  logError('Falha ao registrar Service Worker após tentativas', retryError);
                }
              }
            }, 1000);
          }
        }
      } catch (error) {
        if (isMounted) {
          updateState({ 
            error: error instanceof Error ? error : new Error('Erro desconhecido'),
            isLoading: false
          });
          logError('Falha ao registrar Service Worker', error);
        }
      }
    };

    registerServiceWorker();
    
    return () => {
      isMounted = false;
    };
  }, [state.isSupported, updateState]);

  // Verificar inscrição existente com retry em caso de falha
  const checkSubscription = useCallback(async () => {
    if (!state.registration) {
      logWarn('Não foi possível verificar inscrição: Service Worker não registrado');
      return null;
    }

    // Throttling para evitar verificações excessivas
    const now = Date.now();
    if (now - lastCheckRef.current < CHECK_THROTTLE_TIME) {
      logDebug('Verificação de inscrição pulada devido ao throttling');
      return state.subscription;
    }
    
    lastCheckRef.current = now;
    updateState({ isLoading: true, error: null });
    
    try {
      const existingSubscription = await state.registration.pushManager.getSubscription();
      
      updateState({ 
        subscription: existingSubscription,
        isSubscribed: !!existingSubscription,
        isLoading: false
      });
      
      if (existingSubscription) {
        logInfo('Inscrição existente encontrada', {
          endpoint: existingSubscription.endpoint.substring(0, 50) + '...'
        });
      } else {
        // Apenas logar uma vez quando verificar pela primeira vez
        // Não logar repetidamente quando não há inscrição
        logDebug('Verificação de inscrição concluída - nenhuma inscrição ativa');
      }
      
      return existingSubscription;
    } catch (error) {
      // Tentar novamente uma vez em caso de falha
      logWarn('Primeira tentativa de verificar inscrição falhou, tentando novamente...', error);
      
      try {
        // Pequeno atraso antes da segunda tentativa
        await new Promise(resolve => setTimeout(resolve, 500));
        const existingSubscription = await state.registration.pushManager.getSubscription();
        
        updateState({ 
          subscription: existingSubscription,
          isSubscribed: !!existingSubscription,
          isLoading: false
        });
        
        logInfo('Inscrição verificada com sucesso na segunda tentativa');
        return existingSubscription;
      } catch (retryError) {
        updateState({ 
          error: retryError instanceof Error ? retryError : new Error('Erro desconhecido'),
          isLoading: false
        });
        logError('Erro ao verificar inscrição após tentativas', retryError);
        return null;
      }
    }
  }, [state.registration, updateState]);

  // Solicitar permissão e se inscrever para notificações push
  const subscribeToPushNotifications = useCallback(async () => {
    if (!state.registration) {
      logDebug('Não foi possível se inscrever: Service Worker não registrado');
      return null;
    }

    // Verificar se o service worker está ativo
    if (!state.registration.active) {
      logWarn('Service Worker não está ativo, aguardando ativação...');
      
      // Aguardar o service worker ficar ativo
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout aguardando Service Worker ficar ativo'));
        }, 10000); // 10 segundos de timeout
        
        const installingWorker = state.registration!.installing;
        const waitingWorker = state.registration!.waiting;
        
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'activated') {
              clearTimeout(timeout);
              resolve(void 0);
            }
          });
        } else if (waitingWorker) {
          waitingWorker.addEventListener('statechange', () => {
            if (waitingWorker.state === 'activated') {
              clearTimeout(timeout);
              resolve(void 0);
            }
          });
        } else {
          // Se não há installing nem waiting, pode ser que já esteja ativo
          clearTimeout(timeout);
          resolve(void 0);
        }
      });
    }

    try {
      // Verificar se já existe uma inscrição
      const existingSubscription = await checkSubscription();
      if (existingSubscription) {
        logDebug('Já existe uma inscrição ativa, retornando-a');
        return existingSubscription;
      }
      
      // Verificar permissão
      if (state.permission === 'denied') {
        logDebug('Permissão para notificações foi negada pelo usuário');
        return null;
      }

      if (state.permission === 'default') {
        logDebug('Solicitando permissão para notificações...');
        const permissionResult = await Notification.requestPermission();
        updateState({ permission: permissionResult as NotificationPermission });
        
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
        const data = await response.json();
        vapidPublicKey = data.vapidPublicKey;
        
        if (!vapidPublicKey) {
          throw new Error('Chave VAPID não encontrada na resposta do servidor');
        }
      } catch (error) {
        logError('Erro ao obter chave VAPID', error);
        return null;
      }
      
      // Converter a chave VAPID para o formato Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      logDebug('Criando nova inscrição...');
      const subscription = await state.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      // Enviar inscrição para o servidor
      try {
        await sendSubscriptionToServer(subscription);
      } catch (serverError) {
        // Continuar mesmo com erro no servidor
        logError('Erro ao enviar inscrição para o servidor', serverError);
      }
      
      updateState({
        subscription: subscription,
        isSubscribed: true
      });
      
      return subscription;
    } catch (error) {
      logError('Erro ao se inscrever para notificações push', error);
      return null;
    }
  }, [state.permission, state.registration, checkSubscription, updateState]);

  // Cancelar inscrição nas notificações push
  const unsubscribeFromPushNotifications = useCallback(async () => {
    if (!state.subscription) {
      logDebug('Não há inscrição ativa para cancelar');
      return false;
    }

    try {
      logDebug('Cancelando inscrição no navegador...');
      await state.subscription.unsubscribe();
      
      try {
        logDebug('Removendo inscrição do servidor...');
        await removeSubscriptionFromServer(state.subscription);
      } catch (serverError) {
        // Continuar mesmo com erro no servidor
        logError('Erro ao remover inscrição do servidor', serverError);
      }
      
      updateState({
        subscription: null,
        isSubscribed: false
      });
      logDebug('Inscrição cancelada com sucesso');
      return true;
    } catch (error) {
      logError('Erro ao cancelar inscrição nas notificações push', error);
      
      // Tentar limpar o estado mesmo com erro
      try {
        updateState({
          subscription: null,
          isSubscribed: false
        });
      } catch (stateError) {
        logError('Erro ao limpar estado após falha na desinscrição', stateError);
      }
      
      return false;
    }
  }, [state.subscription, updateState]);

  // Função auxiliar para converter chave VAPID
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    if (!base64String || typeof base64String !== 'string') {
      throw new Error('String base64 inválida ou vazia');
    }
    
    try {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
      
      // Validar se a string base64 é válida
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
        throw new Error('Formato de string base64 inválido');
      }
      
      const rawData = atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      
      return outputArray;
    } catch (error) {
      throw new Error(`Erro ao converter chave VAPID: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
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
    if (state.registration && !state.isLoading) {
      checkSubscription().catch(error => {
        logError('Erro ao verificar inscrição inicial', error);
        updateState({ 
          error: error instanceof Error ? error : new Error('Erro desconhecido')
        });
      });
    }
  }, [state.registration, state.isLoading, checkSubscription, updateState]);

  // Função para solicitar permissão com tratamento de erros melhorado
  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      logWarn('Notificações não são suportadas neste navegador');
      return 'denied' as NotificationPermission;
    }
    
    updateState({ isLoading: true, error: null });
    
    try {
      logInfo('Solicitando permissão para notificações...');
      const result = await Notification.requestPermission();
      updateState({ 
        permission: result as NotificationPermission,
        isLoading: false
      });
      logInfo(`Resultado da solicitação de permissão: ${result}`);
      return result;
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error : new Error('Erro ao solicitar permissão'),
        isLoading: false
      });
      logError('Erro ao solicitar permissão', error);
      return 'denied' as NotificationPermission;
    }
  }, [state.isSupported, updateState]);
  
  // Retornar API do hook com valores do estado centralizado
  return {
    permission: state.permission,
    isSubscribed: state.isSubscribed,
    subscription: state.subscription,
    isLoading: state.isLoading,
    error: state.error,
    isSupported: state.isSupported,
    checkSubscription,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    requestPermission,
    // Método para limpar erros
    clearError: useCallback(() => {
      updateState({ error: null });
    }, [updateState])
  };
}

export default usePushNotifications;
