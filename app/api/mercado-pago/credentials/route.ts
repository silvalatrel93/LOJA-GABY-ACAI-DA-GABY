import { NextRequest, NextResponse } from 'next/server';
import MercadoPagoService from '@/lib/services/mercado-pago-service';

const mercadoPagoService = new MercadoPagoService();

/**
 * GET - Busca credenciais de uma loja
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lojaId = searchParams.get('loja_id');

    if (!lojaId) {
      return NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      );
    }

    const credentials = await mercadoPagoService.getCredentials(lojaId);
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'Credenciais não encontradas' },
        { status: 404 }
      );
    }

    // Retornar apenas dados não sensíveis
    const safeCredentials = {
      id: credentials.id,
      loja_id: credentials.loja_id,
      public_key: credentials.public_key, // Será usado no frontend
      has_pix_key: !!credentials.chave_pix,
      webhook_url: credentials.webhook_url,
      is_sandbox: credentials.is_sandbox,
      is_active: credentials.is_active,
    };

    return NextResponse.json(safeCredentials);
  } catch (error) {
    console.error('Erro ao buscar credenciais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Salva credenciais de uma loja
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      loja_id,
      public_key,
      access_token,
      chave_pix,
      webhook_url,
      is_sandbox = true
    } = body;

    // Validação dos campos obrigatórios
    if (!loja_id || !public_key || !access_token) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: loja_id, public_key, access_token' },
        { status: 400 }
      );
    }

    // Validar formato das chaves
    if (!public_key.startsWith('APP_USR-') && !public_key.startsWith('TEST-')) {
      return NextResponse.json(
        { error: 'Formato da Public Key inválido' },
        { status: 400 }
      );
    }

    if (!access_token.startsWith('APP_USR-') && !access_token.startsWith('TEST-')) {
      return NextResponse.json(
        { error: 'Formato do Access Token inválido' },
        { status: 400 }
      );
    }

    // Salvar credenciais
    const success = await mercadoPagoService.saveCredentials(
      loja_id,
      public_key,
      access_token,
      chave_pix,
      webhook_url,
      is_sandbox
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Falha ao salvar credenciais. Verifique se são válidas.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Credenciais salvas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar credenciais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove credenciais de uma loja
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lojaId = searchParams.get('loja_id');

    if (!lojaId) {
      return NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      );
    }

    const success = await mercadoPagoService.removeCredentials(lojaId);

    if (!success) {
      return NextResponse.json(
        { error: 'Falha ao remover credenciais' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Credenciais removidas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover credenciais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
