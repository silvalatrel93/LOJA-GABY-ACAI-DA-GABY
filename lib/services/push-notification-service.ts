import { createSupabaseClient } from "../supabase-client";

type PushNotificationPayload = {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>;
};

export const PushNotificationService = {
  // Enviar notificação push para o usuário atual
  async sendNotification(payload: PushNotificationPayload): Promise<boolean> {
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao enviar notificação: ${error}`);
      }

      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação push:', error);
      return false;
    }
  },

  // Enviar notificação para um usuário específico (apenas admin)
  async sendNotificationToUser(userId: string, payload: PushNotificationPayload): Promise<boolean> {
    try {
      const supabase = createSupabaseClient();
      
      // Obter a assinatura do usuário
      const { data: subscription, error } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)
        .single();

      if (error || !subscription) {
        console.error('Assinatura não encontrada para o usuário:', userId);
        return false;
      }

      // Enviar notificação diretamente via API
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          userId, // Sobrescrever o userId para forçar o envio para um usuário específico
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao enviar notificação: ${error}`);
      }

      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação push para usuário:', error);
      return false;
    }
  },

  // Enviar notificação para múltiplos usuários
  async sendBulkNotification(userIds: string[], payload: PushNotificationPayload): Promise<{ success: boolean; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      const success = await this.sendNotificationToUser(userId, payload);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }


    return { success: sent > 0, sent, failed };
  },

  // Enviar notificação para todos os usuários inscritos
  async broadcastNotification(payload: PushNotificationPayload): Promise<{ success: boolean; sent: number; failed: number }> {
    try {
      const supabase = createSupabaseClient();
      
      // Obter todas as assinaturas
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .not('user_id', 'is', null);

      if (error || !subscriptions) {
        console.error('Erro ao buscar assinaturas:', error);
        return { success: false, sent: 0, failed: 0 };
      }

      const userIds: string[] = [];
      for (const sub of subscriptions) {
        if (sub && typeof sub.user_id === 'string') {
          userIds.push(sub.user_id);
        }
      }
      return this.sendBulkNotification(userIds, payload);
    } catch (error) {
      console.error('Erro ao enviar notificação em massa:', error);
      return { success: false, sent: 0, failed: 0 };
    }
  },

  // Verificar se o navegador suporta notificações push
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Verificar se as notificações são permitidas
  async getPermissionStatus(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  },
};

export default PushNotificationService;
