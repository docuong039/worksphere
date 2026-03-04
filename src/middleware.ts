/**
 * @file middleware.ts
 * @description Next.js Middleware - Xử lý xác thực và phân quyền truy cập.
 *
 * LOGIC:
 * - Các route PUBLIC (như /login): Nếu đã đăng nhập thì redirect về /dashboard.
 * - Tất cả các route khác (PRIVATE): Nếu chưa đăng nhập thì redirect về /login.
 */
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Các route công khai, không cần đăng nhập
const PUBLIC_ROUTES = ['/login'];

// Các route prefix của API không cần middleware check (NextAuth tự xử lý)
const API_AUTH_PREFIX = '/api/auth';

export async function middleware(req: NextRequest) {
    const { nextUrl } = req;
    const pathname = nextUrl.pathname;

    // 1. Bỏ qua các API route của NextAuth
    if (pathname.startsWith(API_AUTH_PREFIX)) {
        return NextResponse.next();
    }

    const session = await auth();
    const isLoggedIn = !!session;
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // 2. Nếu đã đăng nhập mà vào /login => redirect về /dashboard
    if (isLoggedIn && isPublicRoute) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 3. Nếu chưa đăng nhập mà vào route private => redirect về /login
    if (!isLoggedIn && !isPublicRoute) {
        const callbackUrl = encodeURIComponent(pathname);
        return NextResponse.redirect(
            new URL(`/login?callbackUrl=${callbackUrl}`, req.url)
        );
    }

    return NextResponse.next();
}

export const config = {
    /*
     * Áp dụng middleware cho tất cả các route NGOẠI TRỪ:
     * - _next/static  : file tĩnh của Next.js
     * - _next/image   : tối ưu ảnh của Next.js
     * - favicon.ico   : favicon
     * - mockServiceWorker.js : PWA service worker (nếu có)
     */
    matcher: [
        '/((?!_next/static|_next/image|uploads|favicon.ico|mockServiceWorker.js).*)',
    ],
};
