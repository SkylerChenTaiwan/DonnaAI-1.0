/**
 * Next.js 中間件
 * 處理路由級別的認證和重導向
 */

import { NextRequest, NextResponse } from 'next/server';

// 公開路由（不需要認證）
const PUBLIC_ROUTES = [
  '/auth',
  '/help',
  '/privacy',
  '/terms',
  '/api/auth/verify', // 認證驗證 API
  '/_next', // Next.js 靜態資源
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

// 認證頁面路由
const AUTH_ROUTES = ['/auth'];

// API 路由
const API_ROUTES = ['/api'];

// 檢查是否為公開路由
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route === pathname) return true;
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname.startsWith(route);
  });
}

// 檢查是否為認證路由
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

// 檢查是否為 API 路由
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api');
}

// 從請求中獲取認證 Token
function getTokenFromRequest(request: NextRequest): string | null {
  // 從 Authorization header 獲取
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 從 Cookie 獲取
  const tokenCookie = request.cookies.get('authToken');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  // 從 URL 參數獲取（僅用於特殊情況）
  const urlToken = request.nextUrl.searchParams.get('token');
  if (urlToken) {
    return urlToken;
  }

  return null;
}

// 驗證 Token 的簡化版本（避免在 middleware 中進行複雜的 Firebase 操作）
function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  // 基本的 JWT 格式檢查
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // 檢查是否為空白或過短
  if (token.length < 50) return false;
  
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`[Middleware] Processing: ${pathname}`);

  // 靜態資源和公開路由直接通過
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 獲取認證 Token
  const token = getTokenFromRequest(request);
  const hasValidToken = token ? isValidTokenFormat(token) : false;

  // API 路由處理
  if (isApiRoute(pathname)) {
    // 排除不需要認證的 API 路由
    const publicApiRoutes = ['/api/auth', '/api/health', '/api/ping'];
    const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route));
    
    if (!isPublicApi && !hasValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '需要認證' },
        { status: 401 }
      );
    }

    // API 路由繼續執行，具體的認證檢查在各個 API handler 中處理
    return NextResponse.next();
  }

  // 已認證用戶訪問認證頁面，重導向到儀表板
  if (isAuthRoute(pathname) && hasValidToken) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // 未認證用戶訪問受保護路由，重導向到登入頁面
  if (!hasValidToken && !isAuthRoute(pathname)) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 其他情況正常通過
  return NextResponse.next();
}

// 配置 middleware 匹配路徑
export const config = {
  // 匹配除了 _next/static, _next/image, favicon.ico 之外的所有路徑
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};