# 型別系統修復建議與實施指南

## 立即需要修復的型別問題

### 1. 消除 Any 型別 - 具體修復方案

#### 檔案: `/web/types/api.types.ts`

```typescript
// ❌ 現有問題（第 51, 63, 70 行）
export interface ApiSuccessResponse<T = any> {
  data: T;
  details?: Record<string, any>;
}

// ✅ 修正方案
export interface ApiSuccessResponse<T = unknown> {
  data: T;
  details?: Record<string, unknown>;
}
```

```typescript
// ❌ 現有問題（第 112, 134-136, 144, 153-154, 161 行）
export interface ApiRequestConfig {
  params?: Record<string, any>;
  data?: any;
}

// ✅ 修正方案
export interface ApiRequestConfig<TData = unknown> {
  params?: Record<string, string | number | boolean>;
  data?: TData;
}
```

```typescript
// ❌ 現有問題（第 134-136 行）
validation?: {
  body?: any;
  query?: any;
  params?: any;
};

// ✅ 修正方案
import { z } from 'zod';

validation?: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
};
```

#### 檔案: `/web/lib/loading.ts`

```typescript
// ❌ 現有問題（第 12, 17, 29, 42, 122, 214, 266, 339 行）
data: any;
onSuccess?: (data: any) => void;

// ✅ 修正方案
export interface LoadingState<T> {
  data: T;
  onSuccess?: (data: T) => void;
}

export function useLoadingState<T = unknown>(
  initialData?: T
): LoadingState<T> {
  // 實作...
}
```

#### 檔案: `/web/lib/middleware.ts`

```typescript
// ❌ 現有問題（第 65, 87, 183, 184 行）
customers: any[] = [];

// ✅ 修正方案
import { Customer } from '@/types/entities';
customers: Customer[] = [];
```

#### 檔案: `/web/services/firebase/firestore.service.ts`

```typescript
// ❌ 現有問題（第 31, 45-48, 55, 60, 230, 410, 531, 567, 596, 620 行）
value: any;
startAfter?: any;

// ✅ 修正方案
value: unknown;
startAfter?: DocumentSnapshot;
startAt?: DocumentSnapshot;
endBefore?: DocumentSnapshot;
endAt?: DocumentSnapshot;
```

### 2. Firebase Admin SDK 型別強化

#### 建立新檔案: `/web/types/firebase-admin.types.ts`

```typescript
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Firebase Admin 使用者文件
 */
export interface UserDocument {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  organizationId?: string;
  teamIds?: string[];
  permissions?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Firebase 查詢結果
 */
export interface QueryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Firebase 批次寫入操作
 */
export interface BatchWrite<T> {
  operation: 'set' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data?: Partial<T>;
  options?: { merge?: boolean };
}

/**
 * Firebase 交易操作
 */
export interface TransactionOperation<T> {
  type: 'get' | 'set' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data?: T;
}
```

#### 修改檔案: `/web/lib/firebase-admin.ts`

```typescript
// ❌ 現有問題
static async getDocument(collectionName: string, documentId: string) {
  const doc = await adminDb.collection(collectionName).doc(documentId).get();
  return { success: true, data: { id: doc.id, ...doc.data() } as Record<string, unknown> };
}

// ✅ 修正方案
static async getDocument<T extends FirebaseDocument>(
  collectionName: string,
  documentId: string
): Promise<QueryResult<T>> {
  try {
    const doc = await adminDb.collection(collectionName).doc(documentId).get();
    if (!doc.exists) {
      return { success: false, error: 'Document not found' };
    }
    const data = { id: doc.id, ...doc.data() } as T;
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

### 3. API Routes 型別一致性

#### 建立新檔案: `/web/lib/api-handlers.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * 型別安全的 API 處理器
 */
export function createApiHandler<TInput, TOutput>(config: {
  schema?: z.ZodSchema<TInput>;
  handler: (input: TInput, context: ApiContext) => Promise<TOutput>;
  middleware?: Middleware[];
}) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 驗證輸入
      let input: TInput;
      if (config.schema) {
        const body = await request.json();
        const result = config.schema.safeParse(body);
        if (!result.success) {
          return createErrorResponse('Validation failed', 400, result.error);
        }
        input = result.data;
      }

      // 執行中間件
      const context = await runMiddleware(request, config.middleware);

      // 執行處理器
      const output = await config.handler(input, context);

      return createSuccessResponse(output);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * 使用範例
 */
export const GET = createApiHandler({
  schema: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
  }),
  middleware: [authenticate, rateLimit],
  handler: async (input, context) => {
    // 型別安全的處理邏輯
    return fetchCustomers(input.page, input.limit, context.user);
  },
});
```

### 4. 環境變數型別安全

#### 建立新檔案: `/web/types/env.d.ts`

```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Node 環境
      NODE_ENV: 'development' | 'test' | 'production';
      
      // Firebase Admin SDK (必須)
      FIREBASE_PROJECT_ID: string;
      FIREBASE_CLIENT_EMAIL: string;
      FIREBASE_PRIVATE_KEY: string;
      
      // Firebase Client SDK (必須)
      NEXT_PUBLIC_FIREBASE_API_KEY: string;
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
      NEXT_PUBLIC_FIREBASE_APP_ID: string;
      
      // 應用程式配置 (可選)
      NEXT_PUBLIC_APP_URL?: string;
      JWT_SECRET?: string;
      SESSION_SECRET?: string;
      
      // 第三方 API (可選)
      CLAUDE_API_KEY?: string;
      OPENAI_API_KEY?: string;
      
      // 其他可選配置
      DATABASE_URL?: string;
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      VERCEL_ANALYTICS_ID?: string;
      SENTRY_DSN?: string;
      RATE_LIMIT_MAX_REQUESTS?: string;
      RATE_LIMIT_WINDOW_MS?: string;
    }
  }
}

export {};
```

#### 修改檔案: `/web/lib/env.ts`

```typescript
// 型別安全的環境變數存取
export class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  
  private constructor() {
    this.validate();
  }
  
  static getInstance(): EnvironmentConfig {
    if (!this.instance) {
      this.instance = new EnvironmentConfig();
    }
    return this.instance;
  }
  
  private validate(): void {
    const required = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    ] as const;
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  get firebase() {
    return {
      admin: {
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      },
      client: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      },
    };
  }
  
  get app() {
    return {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      environment: process.env.NODE_ENV,
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      isTest: process.env.NODE_ENV === 'test',
    };
  }
}

export const config = EnvironmentConfig.getInstance();
```

### 5. 建立型別守衛函數庫

#### 建立新檔案: `/web/lib/type-guards.ts`

```typescript
import { User, Customer, Organization, Team } from '@/types/entities';

/**
 * 基礎型別守衛
 */
export const Guards = {
  // 原始型別守衛
  isString: (value: unknown): value is string => {
    return typeof value === 'string';
  },
  
  isNumber: (value: unknown): value is number => {
    return typeof value === 'number' && !isNaN(value);
  },
  
  isBoolean: (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  },
  
  isObject: (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  },
  
  isArray: <T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] => {
    if (!Array.isArray(value)) return false;
    if (itemGuard) {
      return value.every(itemGuard);
    }
    return true;
  },
  
  // 實體型別守衛
  isUser: (value: unknown): value is User => {
    return Guards.isObject(value) && 
           Guards.isString(value.uid) && 
           Guards.isString(value.email);
  },
  
  isCustomer: (value: unknown): value is Customer => {
    return Guards.isObject(value) && 
           Guards.isString(value.name) && 
           Guards.isString(value.organizationId);
  },
  
  isOrganization: (value: unknown): value is Organization => {
    return Guards.isObject(value) && 
           Guards.isString(value.id) && 
           Guards.isString(value.name);
  },
  
  // 複合型別守衛
  isNonEmptyString: (value: unknown): value is string => {
    return Guards.isString(value) && value.length > 0;
  },
  
  isValidEmail: (value: unknown): value is string => {
    if (!Guards.isString(value)) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  isValidUUID: (value: unknown): value is string => {
    if (!Guards.isString(value)) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },
  
  isValidDate: (value: unknown): value is Date => {
    return value instanceof Date && !isNaN(value.getTime());
  },
  
  isValidTimestamp: (value: unknown): value is string => {
    if (!Guards.isString(value)) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  },
};

/**
 * 斷言函數（拋出錯誤）
 */
export const Assert = {
  isString: (value: unknown, name?: string): asserts value is string => {
    if (!Guards.isString(value)) {
      throw new TypeError(`${name || 'Value'} must be a string`);
    }
  },
  
  isNumber: (value: unknown, name?: string): asserts value is number => {
    if (!Guards.isNumber(value)) {
      throw new TypeError(`${name || 'Value'} must be a number`);
    }
  },
  
  isUser: (value: unknown): asserts value is User => {
    if (!Guards.isUser(value)) {
      throw new TypeError('Invalid user object');
    }
  },
  
  isNonEmptyString: (value: unknown, name?: string): asserts value is string => {
    if (!Guards.isNonEmptyString(value)) {
      throw new TypeError(`${name || 'Value'} must be a non-empty string`);
    }
  },
  
  isValidEmail: (value: unknown): asserts value is string => {
    if (!Guards.isValidEmail(value)) {
      throw new TypeError('Invalid email address');
    }
  },
};

/**
 * 使用範例
 */
export function processUser(data: unknown) {
  if (Guards.isUser(data)) {
    // data 現在有 User 型別
    console.log(data.email);
  }
  
  // 或使用斷言
  Assert.isUser(data);
  // data 現在保證是 User 型別
  console.log(data.email);
}
```

### 6. Result 型別模式實作

#### 建立新檔案: `/web/lib/result.ts`

```typescript
/**
 * Result 型別 - 函數式錯誤處理
 */
export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * 建立成功結果
 */
export const Ok = <T>(value: T): Result<T, never> => ({
  ok: true,
  value,
});

/**
 * 建立失敗結果
 */
export const Err = <E>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

/**
 * Result 工具函數
 */
export const ResultUtils = {
  /**
   * 檢查是否為成功
   */
  isOk: <T, E>(result: Result<T, E>): result is { ok: true; value: T } => {
    return result.ok === true;
  },
  
  /**
   * 檢查是否為失敗
   */
  isErr: <T, E>(result: Result<T, E>): result is { ok: false; error: E } => {
    return result.ok === false;
  },
  
  /**
   * 映射成功值
   */
  map: <T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => U
  ): Result<U, E> => {
    return ResultUtils.isOk(result) ? Ok(fn(result.value)) : result;
  },
  
  /**
   * 映射錯誤
   */
  mapError: <T, E, F>(
    result: Result<T, E>,
    fn: (error: E) => F
  ): Result<T, F> => {
    return ResultUtils.isErr(result) ? Err(fn(result.error)) : result;
  },
  
  /**
   * 扁平映射（flatMap）
   */
  andThen: <T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>
  ): Result<U, E> => {
    return ResultUtils.isOk(result) ? fn(result.value) : result;
  },
  
  /**
   * 提供預設值
   */
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T => {
    return ResultUtils.isOk(result) ? result.value : defaultValue;
  },
  
  /**
   * 從 Promise 建立 Result
   */
  fromPromise: async <T>(
    promise: Promise<T>
  ): Promise<Result<T, Error>> => {
    try {
      const value = await promise;
      return Ok(value);
    } catch (error) {
      return Err(error as Error);
    }
  },
  
  /**
   * 收集多個 Result
   */
  all: <T, E>(results: Result<T, E>[]): Result<T[], E> => {
    const values: T[] = [];
    
    for (const result of results) {
      if (ResultUtils.isErr(result)) {
        return result;
      }
      values.push(result.value);
    }
    
    return Ok(values);
  },
};

/**
 * 使用範例
 */
export async function fetchUserSafe(id: string): Promise<Result<User, Error>> {
  try {
    const user = await fetchUser(id);
    if (!user) {
      return Err(new Error('User not found'));
    }
    return Ok(user);
  } catch (error) {
    return Err(error as Error);
  }
}

// 使用
const result = await fetchUserSafe('123');

if (ResultUtils.isOk(result)) {
  console.log('User:', result.value);
} else {
  console.error('Error:', result.error);
}

// 或使用函數式風格
const displayName = ResultUtils.map(
  result,
  user => user.displayName || 'Anonymous'
);
```

## 實施步驟

### 步驟 1: 設置型別檢查腳本

在 `package.json` 中新增：

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "type-coverage": "type-coverage --detail",
    "find-any": "grep -r 'any' --include='*.ts' --include='*.tsx' ./",
    "lint:types": "tsc --noEmit && type-coverage --at-least 95"
  }
}
```

### 步驟 2: 安裝必要的型別相關套件

```bash
npm install --save-dev \
  @types/node \
  @types/react \
  @types/react-dom \
  type-coverage \
  tsd \
  zod
```

### 步驟 3: 設置 Pre-commit Hook

在 `.husky/pre-commit` 中新增：

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 型別檢查
npm run type-check || exit 1

# 檢查 any 型別使用
ANY_COUNT=$(grep -r '\bany\b' --include='*.ts' --include='*.tsx' ./ | wc -l)
if [ "$ANY_COUNT" -gt "0" ]; then
  echo "⚠️  Warning: Found $ANY_COUNT uses of 'any' type"
fi
```

### 步驟 4: 逐步遷移策略

1. **第一週**: 修復所有 `any` 型別
2. **第二週**: 實施型別守衛和 Result 模式
3. **第三週**: 整合跨平台型別
4. **第四週**: 建立自動化型別測試

## 型別檢查指令

```bash
# 檢查型別錯誤
npm run type-check

# 查找 any 型別
npm run find-any

# 檢查型別覆蓋率
npm run type-coverage

# 持續監控型別
npm run type-check:watch
```

## 成功指標

- [ ] 零 `any` 型別使用
- [ ] 型別覆蓋率 > 95%
- [ ] 所有 API 端點有完整型別
- [ ] Firebase 操作型別安全
- [ ] 環境變數型別完整
- [ ] 型別測試通過率 100%

---

**文件版本**: 1.0.0  
**更新日期**: 2025-08-18  
**負責人**: TypeScript Type Guardian