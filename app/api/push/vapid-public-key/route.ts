import { NextResponse } from 'next/server';

// Esta é uma chave VAPID de exemplo. Em produção, você deve gerar suas próprias chaves.
// Você pode gerar um par de chaves VAPID usando: web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('As chaves VAPID não estão configuradas. Configure as variáveis de ambiente VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.');
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    console.warn("As chaves VAPID não estão configuradas. Configure as variáveis de ambiente VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.");
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  return NextResponse.json({ vapidPublicKey });
}
