import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verificar variáveis de ambiente (sem expor valores sensíveis)
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasAccessToken: !!process.env.MERCADO_PAGO_ACCESS_TOKEN,
      hasPublicKey: !!process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY,
      hasWebhookSecret: !!process.env.MERCADO_PAGO_WEBHOOK_SECRET,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      accessTokenLength: process.env.MERCADO_PAGO_ACCESS_TOKEN?.length || 0,
      publicKeyLength: process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.length || 0,
      webhookSecretLength: process.env.MERCADO_PAGO_WEBHOOK_SECRET?.length || 0,
      // Primeiros caracteres para verificação (sem expor chaves completas)
      accessTokenPrefix: process.env.MERCADO_PAGO_ACCESS_TOKEN?.substring(0, 12) || 'N/A',
      publicKeyPrefix: process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.substring(0, 12) || 'N/A',
    };

    return NextResponse.json({
      status: 'ok',
      message: 'Diagnóstico do Mercado Pago',
      diagnostics
    });
  } catch (error) {
    console.error('Erro no diagnóstico:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Erro no diagnóstico',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}