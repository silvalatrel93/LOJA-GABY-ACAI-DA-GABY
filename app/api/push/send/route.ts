import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/server/push-utils';
import { createSupabaseClient } from '@/lib/supabase-client';

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: any;
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    // Obter a assinatura do usuário do banco de dados
    const { data: subscriptionData, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user.id)  // Certifique-se de que user_id está em minúsculas
      .single();

    if (error || !subscriptionData) {
      return new NextResponse('Assinatura não encontrada', { status: 404 });
    }

    const { title, body, icon, data }: PushNotificationPayload = await request.json();

    if (!title || !body) {
      return new NextResponse('Título e corpo são obrigatórios', { status: 400 });
    }

    const payload = {
      notification: {
        title,
        body,
        icon: icon || '/icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: data || {},
      },
    };

    const result = await sendPushNotification(subscriptionData.subscription, payload);

    if (!result.success) {
      console.error('Erro ao enviar notificação:', result.error);
      return new NextResponse('Erro ao enviar notificação', { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}
