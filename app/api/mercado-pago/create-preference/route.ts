import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configurar cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
});

const preference = new Preference(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      items,
      payer,
      back_urls,
      auto_return,
      external_reference,
      payment_methods,
      notification_url
    } = body;

    // Validar dados obrigatórios
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar preferência
    const preferenceRequest = {
      items: items.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description || item.title,
        quantity: item.quantity,
        currency_id: 'BRL',
        unit_price: parseFloat(item.unit_price.toString())
      })),
      payer: {
        name: payer?.name,
        surname: payer?.surname,
        email: payer?.email,
        phone: payer?.phone ? {
          area_code: payer.phone.area_code,
          number: payer.phone.number
        } : undefined,
        identification: payer?.identification ? {
          type: payer.identification.type,
          number: payer.identification.number
        } : undefined,
        address: payer?.address
      },
      back_urls: back_urls || {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending`
      },
      auto_return: auto_return || 'approved',
      external_reference: external_reference,
      // Só inclui notification_url se estivermos em produção (URL pública)
      ...(process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost') ? {
        notification_url: notification_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/mercado-pago/webhook`
      } : {}),
      payment_methods: payment_methods || {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12
      },
      statement_descriptor: 'HEAI ACAI',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };

    const result = await preference.create({ body: preferenceRequest });

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      external_reference: result.external_reference
    });

  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 