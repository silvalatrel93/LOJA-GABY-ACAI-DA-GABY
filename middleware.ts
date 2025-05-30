import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Verificar se é uma rota de API de push
    if (request.nextUrl.pathname.startsWith('/api/push')) {
        const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
        const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

        if (!vapidPublicKey || !vapidPrivateKey) {
            return NextResponse.json(
                { error: 'VAPID keys not configured' },
                { status: 500 }
            )
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/api/push/:path*',
} 