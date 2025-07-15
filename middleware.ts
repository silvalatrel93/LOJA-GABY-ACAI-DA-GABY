import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    return NextResponse.next()
}

// Middleware config - pode ser removido ou mantido para futuras necessidades
export const config = {
    matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
} 