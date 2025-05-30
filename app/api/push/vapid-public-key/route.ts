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
