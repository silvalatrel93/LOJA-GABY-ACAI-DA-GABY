import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/server/push-utils';
import { createSupabaseClient } from '@/lib/supabase-client';
import webpush from "web-push"

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: any;
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: Request) {
  const subscription = await request.json()

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("As chaves VAPID não estão configuradas. Configure as variáveis de ambiente VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.")
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 })
  }

  webpush.setVapidDetails(
    "mailto:test@test.com",
    vapidPublicKey,
    vapidPrivateKey
  )

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: "Novo Pedido",
        body: "Você recebeu um novo pedido!",
      })
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao enviar notificação push:", error)
    return NextResponse.json({ error: "Failed to send push notification" }, { status: 500 })
  }
}
