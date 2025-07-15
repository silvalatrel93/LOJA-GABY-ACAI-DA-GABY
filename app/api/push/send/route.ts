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
  try {
    const body = await request.json()
    
    // Aceitar diferentes formatos de payload
    const subscription = body.subscription || body
    const payload = body.payload || {
      title: "Novo Pedido",
      body: "Você recebeu um novo pedido!",
    }

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("As chaves VAPID não estão configuradas. Configure as variáveis de ambiente VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.")
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 })
    }

    webpush.setVapidDetails(
      "mailto:admin@acaionline.com",
      vapidPublicKey,
      vapidPrivateKey
    )

    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao enviar notificação push:", error)
    return NextResponse.json({ 
      error: "Failed to send push notification",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
