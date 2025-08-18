/**
 * Next.js 中間件型別定義
 * 用於 Edge Runtime 和 Node.js Runtime
 */

import type { NextRequest, NextResponse } from 'next/server';
import type { User } from './web-platform-base-types';

/**
 * 中間件配置
 */
export interface MiddlewareConfig {
  matcher: string | string[];
  runtime?: 'nodejs' | 'edge';
  regions?: string[];
}

/**
 * 中間件函數型別
 */
export type Middleware = (
  request: NextRequest,
  event: NextFetchEvent
) => Promise<NextResponse | Response | null | undefined> | NextResponse | Response | null | undefined;

/**
 * Next.js Fetch 事件
 */
export interface NextFetchEvent extends FetchEvent {
  sourcePage?: string;
}

/* ============================================
   認證中間件型別
   ============================================ */

/**
 * JWT Token 驗證結果
 */
export interface TokenVerificationResult {
  valid: boolean;
  user?: User;
  error?: string;
  expired?: boolean;
}

/**
 * Session 配置
 */
export interface SessionConfig {
  name: string;
  secret: string;
  maxAge: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  domain?: string;
}

/**
 * 認證策略
 */
export type AuthStrategy = 'jwt' | 'session' | 'api-key' | 'oauth';

/**
 * 認證提供者
 */
export interface AuthProvider {
  name: string;
  type: AuthStrategy;
  verify: (credentials: any) => Promise<User | null>;
  serialize?: (user: User) => string;
  deserialize?: (token: string) => Promise<User | null>;
}

/* ============================================
   路由保護中間件
   ============================================ */

/**
 * 路由保護規則
 */
export interface RouteProtectionRule {
  path: string | RegExp;
  requireAuth: boolean;
  requireRoles?: string[];
  requirePermissions?: string[];
  redirectTo?: string;
  allowedMethods?: string[];
}

/**
 * 路由匹配結果
 */
export interface RouteMatchResult {
  matched: boolean;
  params?: Record<string, string>;
  rule?: RouteProtectionRule;
}

/* ============================================
   重寫和重定向
   ============================================ */

/**
 * URL 重寫規則
 */
export interface RewriteRule {
  source: string | RegExp;
  destination: string | ((params: Record<string, string>) => string);
  permanent?: boolean;
  statusCode?: number;
}

/**
 * 重定向規則
 */
export interface RedirectRule {
  source: string | RegExp;
  destination: string;
  permanent?: boolean;
  statusCode?: 301 | 302 | 307 | 308;
  basePath?: boolean;
  locale?: boolean;
  has?: Array<{
    type: 'header' | 'cookie' | 'host' | 'query';
    key: string;
    value?: string;
  }>;
  missing?: Array<{
    type: 'header' | 'cookie' | 'host' | 'query';
    key: string;
    value?: string;
  }>;
}

/* ============================================
   請求處理
   ============================================ */

/**
 * 請求上下文
 */
export interface RequestContext {
  request: NextRequest;
  response: NextResponse;
  user?: User;
  session?: any;
  locale?: string;
  geo?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
  };
  ip?: string;
  userAgent?: string;
}

/**
 * 請求處理器
 */
export type RequestHandler = (
  context: RequestContext
) => Promise<NextResponse | void> | NextResponse | void;

/**
 * 請求管道
 */
export interface RequestPipeline {
  use(handler: RequestHandler): this;
  run(request: NextRequest): Promise<NextResponse>;
}

/* ============================================
   速率限制
   ============================================ */

/**
 * 速率限制儲存
 */
export interface RateLimitStore {
  increment(key: string): Promise<number>;
  reset(key: string): Promise<void>;
  get(key: string): Promise<number>;
  setExpiry(key: string, seconds: number): Promise<void>;
}

/**
 * 速率限制規則
 */
export interface RateLimitRule {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
  skip?: (request: NextRequest) => boolean;
  handler?: (request: NextRequest) => NextResponse;
  store?: RateLimitStore;
}

/**
 * 速率限制資訊
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

/* ============================================
   安全性中間件
   ============================================ */

/**
 * CSP (Content Security Policy) 配置
 */
export interface CSPConfig {
  directives: {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    fontSrc?: string[];
    connectSrc?: string[];
    mediaSrc?: string[];
    objectSrc?: string[];
    frameSrc?: string[];
    baseUri?: string[];
    formAction?: string[];
    frameAncestors?: string[];
    upgradeInsecureRequests?: boolean;
    blockAllMixedContent?: boolean;
  };
  reportUri?: string;
  reportOnly?: boolean;
}

/**
 * 安全標頭配置
 */
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: CSPConfig | string;
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  xContentTypeOptions?: 'nosniff';
  referrerPolicy?: string;
  permissionsPolicy?: string;
  strictTransportSecurity?: {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  xXssProtection?: string;
}

/* ============================================
   國際化中間件
   ============================================ */

/**
 * 語言檢測配置
 */
export interface LocaleDetectionConfig {
  locales: string[];
  defaultLocale: string;
  localeDetection?: boolean;
  domains?: Array<{
    domain: string;
    defaultLocale: string;
    locales?: string[];
  }>;
}

/**
 * 語言協商結果
 */
export interface LocaleNegotiationResult {
  locale: string;
  source: 'cookie' | 'header' | 'domain' | 'default';
  quality?: number;
}

/* ============================================
   日誌和監控
   ============================================ */

/**
 * 日誌級別
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * 日誌配置
 */
export interface LogConfig {
  level: LogLevel;
  format?: 'json' | 'text';
  destination?: 'console' | 'file' | 'remote';
  includeHeaders?: boolean;
  includeBody?: boolean;
  includeCookies?: boolean;
  sanitize?: (data: any) => any;
}

/**
 * 請求日誌
 */
export interface RequestLog {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  ip?: string;
  userAgent?: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
}

/**
 * 效能指標
 */
export interface PerformanceMetrics {
  requestId: string;
  timestamp: Date;
  duration: number;
  ttfb: number; // Time to First Byte
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage?: {
    user: number;
    system: number;
  };
}

/* ============================================
   中間件工廠函數
   ============================================ */

/**
 * 建立中間件鏈
 */
export function createMiddlewareChain(
  ...middlewares: Middleware[]
): Middleware {
  return async (request: NextRequest, event: NextFetchEvent) => {
    let response: NextResponse | Response | null | undefined;
    
    for (const middleware of middlewares) {
      response = await middleware(request, event);
      
      // 如果中間件返回回應，停止執行後續中間件
      if (response) {
        return response;
      }
    }
    
    return NextResponse.next();
  };
}

/**
 * 條件中間件
 */
export function conditionalMiddleware(
  condition: (request: NextRequest) => boolean,
  middleware: Middleware
): Middleware {
  return async (request: NextRequest, event: NextFetchEvent) => {
    if (condition(request)) {
      return middleware(request, event);
    }
    return NextResponse.next();
  };
}

/**
 * 路徑匹配中間件
 */
export function pathMiddleware(
  paths: string | string[] | RegExp,
  middleware: Middleware
): Middleware {
  return conditionalMiddleware(
    (request) => {
      const pathname = request.nextUrl.pathname;
      
      if (typeof paths === 'string') {
        return pathname === paths;
      }
      
      if (Array.isArray(paths)) {
        return paths.includes(pathname);
      }
      
      if (paths instanceof RegExp) {
        return paths.test(pathname);
      }
      
      return false;
    },
    middleware
  );
}

/* ============================================
   中間件輔助函數
   ============================================ */

/**
 * 取得客戶端 IP
 */
export function getClientIp(request: NextRequest): string | undefined {
  return request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip');
}

/**
 * 取得使用者代理
 */
export function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * 設定安全標頭
 */
export function setSecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig
): void {
  if (config.contentSecurityPolicy) {
    const csp = typeof config.contentSecurityPolicy === 'string'
      ? config.contentSecurityPolicy
      : formatCSP(config.contentSecurityPolicy);
    response.headers.set('Content-Security-Policy', csp);
  }
  
  if (config.xFrameOptions) {
    response.headers.set('X-Frame-Options', config.xFrameOptions);
  }
  
  if (config.xContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', config.xContentTypeOptions);
  }
  
  if (config.referrerPolicy) {
    response.headers.set('Referrer-Policy', config.referrerPolicy);
  }
  
  if (config.permissionsPolicy) {
    response.headers.set('Permissions-Policy', config.permissionsPolicy);
  }
  
  if (config.strictTransportSecurity) {
    const hsts = `max-age=${config.strictTransportSecurity.maxAge}${
      config.strictTransportSecurity.includeSubDomains ? '; includeSubDomains' : ''
    }${config.strictTransportSecurity.preload ? '; preload' : ''}`;
    response.headers.set('Strict-Transport-Security', hsts);
  }
  
  if (config.xXssProtection) {
    response.headers.set('X-XSS-Protection', config.xXssProtection);
  }
}

/**
 * 格式化 CSP
 */
function formatCSP(config: CSPConfig): string {
  const directives: string[] = [];
  
  for (const [key, value] of Object.entries(config.directives)) {
    if (value === undefined) continue;
    
    const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    
    if (typeof value === 'boolean') {
      if (value) directives.push(directiveName);
    } else if (Array.isArray(value)) {
      directives.push(`${directiveName} ${value.join(' ')}`);
    }
  }
  
  return directives.join('; ');
}

/**
 * 建立請求 ID
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * 解析 Accept-Language 標頭
 */
export function parseAcceptLanguage(header: string): Array<{ locale: string; quality: number }> {
  return header
    .split(',')
    .map(lang => {
      const [locale, q] = lang.trim().split(';');
      const quality = q ? parseFloat(q.split('=')[1]) : 1;
      return { locale: locale.trim(), quality };
    })
    .sort((a, b) => b.quality - a.quality);
}