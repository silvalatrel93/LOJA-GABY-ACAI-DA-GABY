import { createSupabaseClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

// Esta é uma chave VAPID de exemplo. Em produção, você deve gerar suas próprias chaves.
// Você pode gerar um par de chaves VAPID usando: web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('As chaves VAPID não estão configuradas. Configure as variáveis de ambiente VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.');
}

export async function GET() {
  if (!VAPID_PUBLIC_KEY) {
    return new NextResponse('VAPID public key not configured', { status: 500 });
  }
  
  return new NextResponse(VAPID_PUBLIC_KEY, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

// Função para enviar notificação push (pode ser usada em outras rotas da API)
export async function sendPushNotification(subscription: any, payload: any) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID keys not configured');
  }

  const webpush = (await import('web-push')).default;
  
  webpush.setVapidDetails(
    'mailto:contato@acaionline.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error };
  }
}
