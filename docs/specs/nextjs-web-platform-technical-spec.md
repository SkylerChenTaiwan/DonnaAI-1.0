# Next.js Web Platform Foundation - 技術架構規格

## 📋 專案概覽

### 專案資訊
- **專案名稱**: DonnaAI Next.js Web Platform Foundation
- **版本**: 1.0.0
- **開發日期**: 2025年8月
- **規格撰寫**: spec-writer agent
- **更新日期**: 2025-08-18

### 目標與背景
本規格文件定義了 DonnaAI 專案從現有 React Native + Web 混合架構遷移至獨立 Next.js 14 Web 平台的完整技術架構。新平台將提供原生級別的 Web 體驗，特別針對桌面端用戶優化，同時與現有的 Firebase 後端保持完全相容。

## 🏗️ 系統架構

### 整體架構圖
```mermaid
graph TB
    subgraph "Client Layer - 客戶端層"
        A[Next.js 14 App]
        B[App Router]
        C[React Server Components]
        D[Client Components]
        E[Tailwind CSS]
    end
    
    subgraph "API Layer - API 層"
        F[Next.js API Routes]
        G[認證中間件]
        H[API 錯誤處理]
        I[請求驗證]
    end
    
    subgraph "Backend Services - 後端服務"
        J[Firebase Admin SDK]
        K[Firestore Database]
        L[Firebase Auth]
        M[Firebase Storage]
        N[Cloud Functions]
    end
    
    subgraph "Current RN App - 現有 RN 應用"
        O[React Native App]
        P[Firebase Client SDK]
    end
    
    A --> B
    B --> C
    B --> D
    A --> E
    B --> F
    F --> G
    F --> H
    F --> I
    G --> J
    J --> K
    J --> L
    J --> M
    J --> N
    
    O --> P
    P --> K
    P --> L
    P --> M
    
    classDef client fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef backend fill:#e8f5e8
    classDef current fill:#fff3e0
    
    class A,B,C,D,E client
    class F,G,H,I api
    class J,K,L,M,N backend
    class O,P current
```

### 資料流架構
```mermaid
sequenceDiagram
    participant User as 用戶瀏覽器
    participant Next as Next.js App
    participant API as API Routes
    participant FB as Firebase Admin
    participant DB as Firestore
    
    User->>Next: 1. 訪問頁面
    Next->>Next: 2. Server-side Rendering
    Next->>API: 3. API 請求 (getServerSideProps)
    API->>FB: 4. Firebase Admin 驗證
    FB->>DB: 5. 資料庫查詢
    DB->>FB: 6. 回傳資料
    FB->>API: 7. 處理資料
    API->>Next: 8. 回傳至頁面
    Next->>User: 9. 渲染完整頁面
    
    User->>Next: 10. 客戶端互動
    Next->>API: 11. 客戶端 API 請求
    API->>FB: 12. 驗證 + 資料操作
    FB->>API: 13. 回傳結果
    API->>Next: 14. JSON 回應
    Next->>User: 15. 更新 UI
```

## 💻 技術棧規範

### 核心技術棧
```typescript
{
  "frontend": {
    "framework": "Next.js 14.2+",
    "react": "React 18.3+",
    "typescript": "TypeScript 5.8+",
    "routing": "App Router (src/app)",
    "styling": "Tailwind CSS 3.4+",
    "stateManagement": "Zustand + React Query",
    "forms": "React Hook Form + Zod"
  },
  "backend": {
    "apiRoutes": "Next.js API Routes (src/app/api)",
    "middleware": "Next.js Middleware",
    "authentication": "Firebase Admin SDK",
    "database": "Firebase Firestore",
    "storage": "Firebase Storage",
    "serverless": "Firebase Cloud Functions"
  },
  "development": {
    "bundler": "Turbopack (Next.js 14)",
    "linter": "ESLint 8+ with TypeScript",
    "formatter": "Prettier 3+",
    "testing": "Vitest + React Testing Library",
    "typeChecking": "TypeScript strict mode"
  },
  "deployment": {
    "hosting": "Vercel (主要) / Firebase Hosting (備用)",
    "cdn": "Vercel Edge Network",
    "analytics": "Vercel Analytics + Firebase Analytics",
    "monitoring": "Sentry + Firebase Crashlytics"
  }
}
```

### 版本相容性矩陣
| 技術 | 最低版本 | 推薦版本 | 測試版本 | 備註 |
|------|----------|----------|----------|------|
| Node.js | 18.17.0 | 20.11.0+ | 20.11.1 | LTS 版本 |
| Next.js | 14.2.0 | 14.2.5+ | 14.2.5 | App Router 穩定版 |
| React | 18.2.0 | 18.3.1+ | 18.3.1 | 支援 Server Components |
| TypeScript | 5.4.0 | 5.8.3+ | 5.8.3 | 與現有專案一致 |
| Tailwind CSS | 3.4.0 | 3.4.6+ | 3.4.6 | 最新穩定版 |
| Firebase Admin | 12.0.0 | 13.4.0+ | 13.4.0 | 與現有專案一致 |

## 🏗️ 專案架構設計

### 目錄結構
```
nextjs-web-platform/
├── README.md
├── next.config.js              # Next.js 配置
├── tailwind.config.js          # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
├── package.json
├── .env.local                  # 環境變數
├── .env.example               # 環境變數範本
├── .gitignore
├── .eslintrc.json             # ESLint 配置
├── .prettierrc                # Prettier 配置
├── middleware.ts              # Next.js 中間件
├── next-env.d.ts             # Next.js 類型定義
├──
├── public/                    # 靜態資源
│   ├── icons/                # 圖示檔案
│   ├── images/               # 圖片資源
│   ├── favicon.ico           # 網站圖標
│   └── manifest.json         # PWA 配置
├──
├── src/                      # 主要原始碼
│   ├── app/                  # App Router 目錄
│   │   ├── globals.css       # 全域樣式
│   │   ├── layout.tsx        # 根布局
│   │   ├── page.tsx          # 首頁
│   │   ├── loading.tsx       # 載入頁面
│   │   ├── error.tsx         # 錯誤頁面
│   │   ├── not-found.tsx     # 404 頁面
│   │   ├──
│   │   ├── api/              # API Routes
│   │   │   ├── auth/         # 認證相關 API
│   │   │   ├── users/        # 用戶管理 API
│   │   │   ├── organizations/# 組織管理 API
│   │   │   ├── customers/    # 客戶管理 API
│   │   │   ├── records/      # 記錄管理 API
│   │   │   └── health/       # 健康檢查 API
│   │   ├──
│   │   ├── dashboard/        # 儀表板頁面
│   │   │   ├── page.tsx      # 儀表板首頁
│   │   │   ├── layout.tsx    # 儀表板布局
│   │   │   ├── analytics/    # 分析頁面
│   │   │   └── settings/     # 設定頁面
│   │   ├──
│   │   ├── auth/             # 認證頁面
│   │   │   ├── login/        # 登入頁面
│   │   │   ├── register/     # 註冊頁面
│   │   │   └── callback/     # OAuth 回調
│   │   └──
│   │   └── (protected)/      # 受保護的路由群組
│   │       ├── customers/    # 客戶管理頁面
│   │       ├── records/      # 記錄管理頁面
│   │       └── admin/        # 管理員頁面
│   ├──
│   ├── components/           # React 元件
│   │   ├── ui/               # 基礎 UI 元件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── index.ts      # 統一匯出
│   │   ├──
│   │   ├── forms/            # 表單元件
│   │   │   ├── LoginForm.tsx
│   │   │   ├── UserForm.tsx
│   │   │   └── CustomerForm.tsx
│   │   ├──
│   │   ├── layout/           # 布局元件
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Footer.tsx
│   │   ├──
│   │   └── features/         # 功能特定元件
│   │       ├── dashboard/    # 儀表板元件
│   │       ├── analytics/    # 分析元件
│   │       └── customers/    # 客戶管理元件
│   ├──
│   ├── lib/                  # 公用程式庫
│   │   ├── firebase/         # Firebase 相關
│   │   │   ├── admin.ts      # Firebase Admin 配置
│   │   │   ├── auth.ts       # 認證服務
│   │   │   ├── firestore.ts  # Firestore 操作
│   │   │   └── storage.ts    # Storage 操作
│   │   ├──
│   │   ├── auth/             # 認證相關
│   │   │   ├── middleware.ts # 認證中間件
│   │   │   ├── session.ts    # 會話管理
│   │   │   └── permissions.ts# 權限檢查
│   │   ├──
│   │   ├── api/              # API 相關
│   │   │   ├── client.ts     # API 客戶端
│   │   │   ├── types.ts      # API 類型定義
│   │   │   └── errors.ts     # 錯誤處理
│   │   ├──
│   │   ├── utils/            # 工具函數
│   │   │   ├── validation.ts # 驗證函數
│   │   │   ├── format.ts     # 格式化函數
│   │   │   ├── constants.ts  # 常數定義
│   │   │   └── helpers.ts    # 輔助函數
│   │   ├──
│   │   └── hooks/            # 自訂 React Hooks
│   │       ├── useAuth.ts    # 認證 Hook
│   │       ├── useApi.ts     # API Hook
│   │       ├── useLocalStorage.ts
│   │       └── useDebounce.ts
│   ├──
│   ├── styles/               # 樣式檔案
│   │   ├── globals.css       # 全域樣式
│   │   ├── components.css    # 元件樣式
│   │   └── utilities.css     # 工具樣式
│   ├──
│   ├── types/                # TypeScript 類型定義
│   │   ├── auth.ts           # 認證相關類型
│   │   ├── user.ts           # 用戶類型
│   │   ├── organization.ts   # 組織類型
│   │   ├── customer.ts       # 客戶類型
│   │   ├── record.ts         # 記錄類型
│   │   ├── api.ts            # API 類型
│   │   └── global.d.ts       # 全域類型定義
│   └──
│   └── config/               # 配置檔案
│       ├── database.ts       # 資料庫配置
│       ├── auth.ts           # 認證配置
│       ├── app.ts            # 應用程式配置
│       └── environment.ts    # 環境配置
├──
├── tests/                    # 測試檔案
│   ├── __mocks__/           # Mock 檔案
│   ├── components/          # 元件測試
│   ├── pages/               # 頁面測試
│   ├── api/                 # API 測試
│   ├── utils/               # 工具函數測試
│   ├── setup.ts             # 測試設定
│   └── test-utils.ts        # 測試工具
├──
├── docs/                     # 技術文件
│   ├── deployment.md        # 部署指南
│   ├── development.md       # 開發指南
│   ├── api-reference.md     # API 參考
│   └── troubleshooting.md   # 問題排除
└──
└── .vercel/                 # Vercel 部署配置
    └── project.json
```

### 路由設計架構
```typescript
// App Router 路由結構
interface RouteStructure {
  "/": "首頁 - 公開訪問";
  "/auth/login": "登入頁面";
  "/auth/register": "註冊頁面";
  "/auth/callback": "OAuth 回調處理";
  "/dashboard": "主儀表板 - 需認證";
  "/dashboard/analytics": "分析頁面 - 需認證";
  "/dashboard/settings": "設定頁面 - 需認證";
  "/(protected)/customers": "客戶列表 - 需權限";
  "/(protected)/customers/[id]": "客戶詳情 - 需權限";
  "/(protected)/records": "記錄列表 - 需權限";
  "/(protected)/records/[id]": "記錄詳情 - 需權限";
  "/(protected)/admin": "管理員面板 - 需超級管理員權限";
  "/api/auth/[...nextauth]": "認證 API";
  "/api/users": "用戶管理 API";
  "/api/customers": "客戶管理 API";
  "/api/records": "記錄管理 API";
  "/api/health": "健康檢查 API";
}
```

## 🔐 Firebase 整合架構

### Firebase Admin SDK 配置
```typescript
// src/lib/firebase/admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// 防止重複初始化
const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

// 初始化 Firebase Admin
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseAdminConfig);
} else {
  app = getApps()[0];
}

// 匯出服務實例
export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app);
export { app as adminApp };

// 類型定義
export interface FirebaseAdminServices {
  db: typeof adminDb;
  auth: typeof adminAuth;
  storage: typeof adminStorage;
  app: typeof app;
}
```

### 資料模型映射
```typescript
// src/types/firebase.ts
// 與現有 React Native 專案共享的資料結構

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'org_admin' | 'manager' | 'user';
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Organization {
  id: string;
  name: string;
  type: 'enterprise' | 'small_business';
  settings: {
    allowUserRegistration: boolean;
    maxUsers: number;
    features: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  industry?: string;
  organizationId: string;
  assignedUserId?: string;
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Record {
  id: string;
  title: string;
  content: string;
  type: 'meeting' | 'call' | 'email' | 'note';
  customerId: string;
  userId: string;
  organizationId: string;
  metadata: {
    duration?: number;
    audioFileUrl?: string;
    transcription?: string;
    aiAnalysis?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### API 中間件設計
```typescript
// src/lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    uid: string;
    email: string;
    role: string;
    organizationId?: string;
  };
}

// 認證中間件
export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const token = req.headers.get('authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return NextResponse.json(
          { error: 'Missing authorization token' },
          { status: 401 }
        );
      }

      // 驗證 Firebase 令牌
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // 獲取用戶詳細資訊
      const userRecord = await adminAuth.getUser(decodedToken.uid);
      const userDoc = await adminDb
        .collection('users')
        .doc(decodedToken.uid)
        .get();
      
      const userData = userDoc.data();
      
      // 將用戶資訊附加到請求
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        uid: decodedToken.uid,
        email: userRecord.email || '',
        role: userData?.role || 'user',
        organizationId: userData?.organizationId,
      };

      return handler(authenticatedReq);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  };
}

// 權限檢查中間件
export function withPermissions(
  requiredRole: string[] | string
) {
  return (
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) => {
    return withAuth(async (req: AuthenticatedRequest) => {
      const userRole = req.user.role;
      const allowedRoles = Array.isArray(requiredRole) 
        ? requiredRole 
        : [requiredRole];

      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req);
    });
  };
}
```

## 🎨 設計系統整合

### Tailwind CSS 配置
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 延續現有 React Native 專案的設計 tokens
      colors: {
        // 主色調
        primary: '#2C2C2C',
        
        // 背景色系
        background: {
          primary: '#FFFFFF',
          surface: '#FFFFFF',
          elevated: '#FFFFFF',
          input: '#FAFAFA',
        },
        
        // 按鈕色系
        button: {
          primary: {
            DEFAULT: '#1A1A1A',
            hover: '#2C2C2C',
            pressed: '#0A0A0A',
          },
          secondary: {
            DEFAULT: '#F7F7F7',
            hover: '#ECECEC',
            pressed: '#E0E0E0',
          },
        },
        
        // 文字色系
        text: {
          primary: '#2C2C2C',
          secondary: '#666666',
          tertiary: '#999999',
          disabled: '#CCCCCC',
          inverse: '#FFFFFF',
        },
        
        // 邊框色系
        border: {
          light: '#E5E7EB',
          DEFAULT: '#D1D5DB',
          medium: '#B5B5B5',
          dark: '#9CA3AF',
        },
        
        // 狀態色系
        status: {
          success: '#34C759',
          warning: '#FF9500',
          error: '#FF3B30',
          info: '#5856D6',
        },
        
        // 灰階系統
        gray: {
          50: '#FAFAFA',
          100: '#F8F8F8',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      
      // 間距系統
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },
      
      // 字體系統
      fontSize: {
        'h1': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'h3': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'h4': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-small': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'button': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'button-small': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        'button-large': ['16px', { lineHeight: '22px', fontWeight: '500' }],
      },
      
      // 圓角系統
      borderRadius: {
        button: '6px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      
      // 陰影系統
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 2px 4px rgba(0, 0, 0, 0.08)',
        md: '0 2px 4px rgba(0, 0, 0, 0.08)',
        lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
        xl: '0 8px 16px rgba(0, 0, 0, 0.15)',
      },
      
      // 過渡動畫
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },
      
      // 響應式斷點
      screens: {
        'mobile': '767px',
        'tablet': '1024px',
        'desktop': '1440px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### 全域 CSS 設置
```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 全域 CSS 變數 - 與現有設計系統同步 */
:root {
  /* 顏色變數 */
  --color-primary: #2C2C2C;
  --color-background-primary: #FFFFFF;
  --color-background-surface: #FFFFFF;
  --color-background-input: #FAFAFA;
  --color-text-primary: #2C2C2C;
  --color-text-secondary: #666666;
  --color-border-default: #D1D5DB;
  --color-border-light: #E5E7EB;
  --color-success: #34C759;
  --color-warning: #FF9500;
  --color-error: #FF3B30;
  
  /* 間距變數 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  
  /* 動畫變數 */
  --transition-fast: 150ms;
  --transition-normal: 250ms;
  --transition-slow: 350ms;
}

/* 基礎重置樣式 */
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
               'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 全域輔助類別 */
@layer components {
  /* 按鈕基礎樣式 */
  .btn-base {
    @apply inline-flex items-center justify-center rounded-button font-medium 
           transition-all duration-fast focus:outline-none focus:ring-2 
           focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .btn-primary {
    @apply btn-base bg-button-primary hover:bg-button-primary-hover 
           text-text-inverse px-4 py-2 text-button;
  }
  
  .btn-secondary {
    @apply btn-base bg-button-secondary hover:bg-button-secondary-hover 
           text-primary px-4 py-2 text-button;
  }
  
  /* 輸入框基礎樣式 */
  .input-base {
    @apply w-full px-3 py-2 text-body bg-background-input border 
           border-border-default rounded-sm focus:outline-none 
           focus:ring-2 focus:ring-primary focus:border-transparent
           placeholder:text-text-tertiary;
  }
  
  /* 卡片基礎樣式 */
  .card-base {
    @apply bg-background-surface rounded-md p-md shadow-sm border 
           border-border-light;
  }
  
  /* 表格基礎樣式 */
  .table-base {
    @apply w-full border-collapse border-border-light;
  }
  
  .table-header {
    @apply bg-gray-50 text-text-secondary text-body-small font-medium 
           px-md py-sm border-b border-border-light;
  }
  
  .table-cell {
    @apply text-text-primary text-body px-md py-sm border-b 
           border-border-light;
  }
}

@layer utilities {
  /* 文字截斷 */
  .text-ellipsis {
    @apply truncate;
  }
  
  /* 多行文字截斷 */
  .text-ellipsis-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .text-ellipsis-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* Scrollbar 樣式 */
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-default) transparent;
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: var(--color-border-default);
    border-radius: 3px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: var(--color-border-medium);
  }
}

/* 響應式工具類 */
@media (max-width: 767px) {
  .mobile-hidden {
    display: none;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-hidden {
    display: none;
  }
}

@media (min-width: 1024px) {
  .desktop-hidden {
    display: none;
  }
}

/* 深色模式支援 (未來擴展) */
@media (prefers-color-scheme: dark) {
  :root {
    /* 未來可以在這裡添加深色模式變數 */
  }
}
```

## 🔧 環境配置

### 環境變數架構
```bash
# .env.example
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_API_KEY=your-firebase-web-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
NODE_ENV=development

# Database Configuration
DATABASE_URL=your-database-connection-string (if using additional DB)

# External API Configuration
OPENAI_API_KEY=your-openai-api-key (if needed for AI features)
GEMINI_API_KEY=your-gemini-api-key (if needed for AI features)

# Monitoring and Analytics
SENTRY_DSN=your-sentry-dsn
VERCEL_ANALYTICS_ID=your-vercel-analytics-id

# Development Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_ENVIRONMENT=development
```

### Next.js 配置
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 實驗功能
  experimental: {
    // 啟用 Turbopack (開發模式)
    turbo: {
      loaders: {
        // 自定義 loader 配置
      },
    },
    // 伺服器元件
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  
  // 編譯配置
  typescript: {
    // 生產建置時忽略 TypeScript 錯誤 (不建議)
    ignoreBuildErrors: false,
  },
  
  // ESLint 配置
  eslint: {
    // 生產建置時忽略 ESLint 錯誤 (不建議)
    ignoreDuringBuilds: false,
  },
  
  // 圖片最佳化
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 國際化
  i18n: {
    locales: ['zh-TW', 'en'],
    defaultLocale: 'zh-TW',
    localeDetection: true,
  },
  
  // 重寫規則
  async rewrites() {
    return [
      // API 代理
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.EXTERNAL_API_URL}/:path*`,
      },
    ];
  },
  
  // 重定向規則
  async redirects() {
    return [
      // 舊路由重定向
      {
        source: '/old-dashboard',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  
  // Headers 配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ];
  },
  
  // Webpack 配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 自定義 webpack 配置
    config.plugins.push(
      new webpack.DefinePlugin({
        __BUILD_ID__: JSON.stringify(buildId),
      })
    );
    
    return config;
  },
  
  // 環境變數
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 輸出配置
  output: 'standalone',
  
  // 路由區分大小寫
  trailingSlash: false,
  
  // PWA 支援 (使用 next-pwa)
  ...(process.env.NODE_ENV === 'production' && {
    pwa: {
      dest: 'public',
      register: true,
      skipWaiting: true,
    },
  }),
};

module.exports = nextConfig;
```

## ⚡ 效能最佳化策略

### 程式碼分割策略
```typescript
// 動態匯入策略
// src/components/LazyComponents.tsx
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// 重型圖表元件延遲載入
export const AnalyticsChart = dynamic(
  () => import('@/components/charts/AnalyticsChart'),
  {
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded" />,
    ssr: false, // 客戶端專用元件
  }
);

// 管理員面板延遲載入
export const AdminPanel = dynamic(
  () => import('@/components/admin/AdminPanel'),
  {
    loading: () => <div>載入管理面板...</div>,
  }
);

// 編輯器元件延遲載入 (大型依賴)
export const RichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor'),
  {
    loading: () => <div>載入編輯器...</div>,
    ssr: false,
  }
);
```

### 資料獲取最佳化
```typescript
// src/lib/data/optimizations.ts
import { unstable_cache } from 'next/cache';

// 快取策略配置
const CACHE_TAGS = {
  USERS: 'users',
  CUSTOMERS: 'customers',
  RECORDS: 'records',
  ORGANIZATIONS: 'organizations',
} as const;

// 資料快取函數
export const getCachedUsers = unstable_cache(
  async (organizationId: string) => {
    // Firebase 查詢邏輯
    const users = await adminDb
      .collection('users')
      .where('organizationId', '==', organizationId)
      .get();
    
    return users.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  [`users-org`],
  {
    tags: [CACHE_TAGS.USERS],
    revalidate: 300, // 5 分鐘快取
  }
);

// 分頁資料獲取
export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export async function getPaginatedCustomers(
  organizationId: string,
  options: PaginationOptions
) {
  const { page, limit, orderBy = 'createdAt', orderDirection = 'desc' } = options;
  
  let query = adminDb
    .collection('customers')
    .where('organizationId', '==', organizationId)
    .orderBy(orderBy, orderDirection)
    .limit(limit)
    .offset((page - 1) * limit);
  
  const [snapshot, totalSnapshot] = await Promise.all([
    query.get(),
    adminDb
      .collection('customers')
      .where('organizationId', '==', organizationId)
      .count()
      .get(),
  ]);
  
  return {
    data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    total: totalSnapshot.data().count,
    page,
    limit,
    totalPages: Math.ceil(totalSnapshot.data().count / limit),
  };
}
```

### 圖片最佳化
```typescript
// src/components/ui/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  placeholder?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'blur',
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">圖片載入失敗</span>
      </div>
    );
  }
  
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      placeholder={placeholder}
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      onError={() => setError(true)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
```

## 🔒 安全性架構

### 認證與授權策略
```typescript
// src/lib/auth/security.ts
import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { rateLimit } from '@/lib/utils/rate-limit';

// 速率限制配置
const limiter = rateLimit({
  interval: 60 * 1000, // 1 分鐘
  uniqueTokenPerInterval: 500, // 支持 500 個不同 tokens
});

// 安全中間件
export async function securityMiddleware(req: NextRequest) {
  const ip = req.ip ?? '127.0.0.1';
  const userAgent = req.headers.get('user-agent') ?? 'unknown';
  
  try {
    // 速率限制檢查
    await limiter.check(5, ip); // 每分鐘最多 5 個請求
  } catch {
    return new Response('Too Many Requests', { status: 429 });
  }
  
  // 安全標頭檢查
  const securityHeaders = {
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': generateCSP(),
  };
  
  return { securityHeaders, ip, userAgent };
}

// CSP 政策生成
function generateCSP() {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.anthropic.com https://firestore.googleapis.com wss://firestore.googleapis.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');
}

// 輸入驗證
export function validateInput(data: any, schema: any) {
  try {
    return schema.parse(data);
  } catch (error) {
    throw new Error(`Invalid input: ${error.message}`);
  }
}

// SQL 注入防護 (雖然使用 Firestore，但針對查詢字串)
export function sanitizeQuery(query: string): string {
  return query
    .replace(/[<>]/g, '')
    .replace(/script/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

// CSRF 保護
export function generateCSRFToken(): string {
  return Buffer.from(Date.now().toString()).toString('base64');
}

export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  // 實作 CSRF token 驗證邏輯
  return token === sessionToken;
}
```

### 資料驗證架構
```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod';

// 用戶相關驗證
export const userValidation = {
  create: z.object({
    email: z.string().email('無效的電子郵件格式'),
    displayName: z.string().min(2, '姓名至少 2 個字符').max(50, '姓名不超過 50 個字符'),
    role: z.enum(['super_admin', 'org_admin', 'manager', 'user']),
    organizationId: z.string().uuid('無效的組織 ID').optional(),
  }),
  
  update: z.object({
    displayName: z.string().min(2).max(50).optional(),
    role: z.enum(['super_admin', 'org_admin', 'manager', 'user']).optional(),
    isActive: z.boolean().optional(),
  }),
};

// 客戶相關驗證
export const customerValidation = {
  create: z.object({
    name: z.string().min(1, '客戶名稱為必填').max(100),
    email: z.string().email('無效的電子郵件').optional(),
    phone: z.string().regex(/^[\+]?[0-9\-\s\(\)]{6,20}$/, '無效的電話號碼').optional(),
    company: z.string().max(100).optional(),
    industry: z.string().max(50).optional(),
    customFields: z.record(z.any()).optional(),
  }),
  
  update: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(/^[\+]?[0-9\-\s\(\)]{6,20}$/).optional(),
    company: z.string().max(100).optional(),
    industry: z.string().max(50).optional(),
    customFields: z.record(z.any()).optional(),
    assignedUserId: z.string().uuid().optional(),
  }),
};

// 記錄相關驗證
export const recordValidation = {
  create: z.object({
    title: z.string().min(1, '標題為必填').max(200),
    content: z.string().min(1, '內容為必填').max(10000),
    type: z.enum(['meeting', 'call', 'email', 'note']),
    customerId: z.string().uuid('無效的客戶 ID'),
    metadata: z.object({
      duration: z.number().positive().optional(),
      audioFileUrl: z.string().url().optional(),
      transcription: z.string().optional(),
      aiAnalysis: z.any().optional(),
    }).optional(),
  }),
  
  update: z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).max(10000).optional(),
    type: z.enum(['meeting', 'call', 'email', 'note']).optional(),
    metadata: z.object({
      duration: z.number().positive().optional(),
      audioFileUrl: z.string().url().optional(),
      transcription: z.string().optional(),
      aiAnalysis: z.any().optional(),
    }).optional(),
  }),
};

// 分頁驗證
export const paginationValidation = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  orderBy: z.string().max(50).optional(),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(100).optional(),
  filters: z.record(z.any()).optional(),
});

// API 回應驗證
export const apiResponseValidation = {
  success: z.object({
    success: z.literal(true),
    data: z.any(),
    message: z.string().optional(),
  }),
  
  error: z.object({
    success: z.literal(false),
    error: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
  }),
  
  pagination: z.object({
    data: z.array(z.any()),
    pagination: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }),
  }),
};
```

## 📊 監控與日誌

### 錯誤監控架構
```typescript
// src/lib/monitoring/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

// Sentry 配置
export function initErrorTracking() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // 效能監控
    profilesSampleRate: 1.0,
    
    // 過濾敏感資訊
    beforeSend(event) {
      // 移除敏感資料
      if (event.request) {
        delete event.request.headers?.authorization;
        delete event.request.cookies;
      }
      
      return event;
    },
    
    // 整合配置
    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.nextRouterInstrumentation(router),
      }),
    ],
  });
}

// 自定義錯誤記錄
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 錯誤處理中間件
export function errorHandler(
  error: Error,
  req: NextRequest,
  context?: any
) {
  // 記錄到 Sentry
  Sentry.withScope((scope) => {
    scope.setTag('component', 'api');
    scope.setContext('request', {
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
    });
    
    if (context) {
      scope.setContext('additional', context);
    }
    
    Sentry.captureException(error);
  });
  
  // 結構化日誌
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...context,
  });
  
  // 回傳適當的錯誤回應
  if (error instanceof AppError) {
    return Response.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }
  
  // 未知錯誤
  return Response.json(
    {
      success: false,
      error: '內部伺服器錯誤',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}
```

### 效能監控
```typescript
// src/lib/monitoring/performance.ts
import { performance, PerformanceEntry } from 'perf_hooks';

// 效能指標收集
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  // 記錄 API 回應時間
  recordApiLatency(endpoint: string, duration: number) {
    const key = `api_latency_${endpoint}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)?.push(duration);
    
    // 回報到外部服務
    if (process.env.NODE_ENV === 'production') {
      this.reportMetric('api_latency', duration, { endpoint });
    }
  }
  
  // 記錄資料庫查詢時間
  recordDatabaseQuery(collection: string, operation: string, duration: number) {
    const key = `db_${collection}_${operation}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)?.push(duration);
    
    if (process.env.NODE_ENV === 'production') {
      this.reportMetric('database_query', duration, { collection, operation });
    }
  }
  
  // 取得統計資訊
  getStats(key: string) {
    const values = this.metrics.get(key) || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
  
  private reportMetric(name: string, value: number, tags: Record<string, string>) {
    // 整合到 Vercel Analytics 或其他監控服務
    if (typeof window !== 'undefined' && (window as any).va) {
      (window as any).va('track', name, { value, ...tags });
    }
  }
}

// 裝飾器用於自動監控 API 端點
export function monitorPerformance(target: string) {
  return function (
    originalMethod: any,
    context: ClassMethodDecoratorContext
  ) {
    return async function (this: any, ...args: any[]) {
      const start = performance.now();
      const monitor = PerformanceMonitor.getInstance();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - start;
        monitor.recordApiLatency(target, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        monitor.recordApiLatency(`${target}_error`, duration);
        throw error;
      }
    };
  };
}
```

## 🚀 部署架構

### Vercel 部署配置
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "FIREBASE_PROJECT_ID": "@firebase-project-id",
    "FIREBASE_CLIENT_EMAIL": "@firebase-client-email",
    "FIREBASE_PRIVATE_KEY": "@firebase-private-key",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "NEXTAUTH_URL": "@nextauth-url"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/health",
      "destination": "/api/health/check"
    }
  ]
}
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test:run
      env:
        NODE_ENV: test
    
    - name: Build application
      run: npm run build
      env:
        NODE_ENV: production
        FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
        FIREBASE_CLIENT_EMAIL: ${{ secrets.FIREBASE_CLIENT_EMAIL }}
        FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
```

## 📚 API 設計規範

### RESTful API 架構
```typescript
// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { customerValidation } from '@/lib/validation/schemas';
import { adminDb } from '@/lib/firebase/admin';
import { AppError } from '@/lib/monitoring/error-tracking';

// GET /api/customers - 取得客戶列表
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    
    let query = adminDb
      .collection('customers')
      .where('organizationId', '==', req.user.organizationId);
    
    if (search) {
      query = query
        .where('name', '>=', search)
        .where('name', '<=', search + '\uf8ff');
    }
    
    const [snapshot, totalSnapshot] = await Promise.all([
      query
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset((page - 1) * limit)
        .get(),
      query.count().get()
    ]);
    
    const customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        total: totalSnapshot.data().count,
        page,
        limit,
        totalPages: Math.ceil(totalSnapshot.data().count / limit),
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch customers', 500, 'FETCH_CUSTOMERS_ERROR');
  }
});

// POST /api/customers - 建立新客戶
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = customerValidation.create.parse(body);
    
    const customerData = {
      ...validatedData,
      organizationId: req.user.organizationId,
      assignedUserId: req.user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await adminDb.collection('customers').add(customerData);
    
    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...customerData,
      },
      message: '客戶建立成功',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Invalid input data', 400, 'VALIDATION_ERROR');
    }
    throw new AppError('Failed to create customer', 500, 'CREATE_CUSTOMER_ERROR');
  }
});
```

### 錯誤處理標準
```typescript
// src/lib/api/error-responses.ts
export const ErrorCodes = {
  // 認證錯誤
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // 權限錯誤
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // 驗證錯誤
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // 資源錯誤
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_EXISTS: 'RESOURCE_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // 伺服器錯誤
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // 速率限制
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // 業務邏輯錯誤
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INVALID_OPERATION: 'INVALID_OPERATION',
} as const;

export const ErrorMessages = {
  [ErrorCodes.UNAUTHORIZED]: '未授權訪問',
  [ErrorCodes.INVALID_TOKEN]: '無效的認證令牌',
  [ErrorCodes.TOKEN_EXPIRED]: '認證令牌已過期',
  [ErrorCodes.FORBIDDEN]: '禁止訪問',
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: '權限不足',
  [ErrorCodes.VALIDATION_ERROR]: '輸入資料驗證失敗',
  [ErrorCodes.INVALID_INPUT]: '無效的輸入資料',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: '缺少必填欄位',
  [ErrorCodes.NOT_FOUND]: '資源不存在',
  [ErrorCodes.RESOURCE_EXISTS]: '資源已存在',
  [ErrorCodes.RESOURCE_CONFLICT]: '資源衝突',
  [ErrorCodes.INTERNAL_ERROR]: '內部伺服器錯誤',
  [ErrorCodes.DATABASE_ERROR]: '資料庫操作失敗',
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: '外部服務錯誤',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: '請求頻率超出限制',
  [ErrorCodes.BUSINESS_RULE_VIOLATION]: '違反業務規則',
  [ErrorCodes.INVALID_OPERATION]: '無效的操作',
} as const;

// 標準化錯誤回應格式
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  timestamp: string;
  path: string;
  method: string;
}

export function createErrorResponse(
  error: AppError,
  req: NextRequest
): ErrorResponse {
  return {
    success: false,
    error: error.message,
    code: error.code,
    details: error.isOperational ? undefined : error.stack,
    timestamp: new Date().toISOString(),
    path: new URL(req.url).pathname,
    method: req.method,
  };
}
```

## 🧪 測試架構

### 測試配置
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

// tests/setup.ts
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// 設定 MSW server
const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
```

### 單元測試範例
```typescript
// tests/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('applies correct variant styles', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('btn-primary');
  });
  
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });
});
```

### API 測試範例
```typescript
// tests/api/customers.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/customers/route';

describe('/api/customers', () => {
  describe('GET', () => {
    it('returns customers list for authenticated user', async () => {
      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });
      
      // Mock the authentication
      (req as any).user = {
        uid: 'user123',
        organizationId: 'org123',
        role: 'user',
      };
      
      const response = await GET(req as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toBeDefined();
    });
    
    it('returns 401 for unauthenticated request', async () => {
      const { req } = createMocks({
        method: 'GET',
      });
      
      const response = await GET(req as any);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing authorization token');
    });
  });
  
  describe('POST', () => {
    it('creates new customer with valid data', async () => {
      const customerData = {
        name: '測試客戶',
        email: 'test@example.com',
        phone: '+886-2-1234-5678',
        company: '測試公司',
      };
      
      const { req } = createMocks({
        method: 'POST',
        body: customerData,
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
      });
      
      (req as any).user = {
        uid: 'user123',
        organizationId: 'org123',
        role: 'user',
      };
      
      const response = await POST(req as any);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(customerData.name);
      expect(data.data.id).toBeDefined();
    });
    
    it('returns validation error for invalid data', async () => {
      const invalidData = {
        name: '', // 空名稱
        email: 'invalid-email', // 無效電子郵件
      };
      
      const { req } = createMocks({
        method: 'POST',
        body: invalidData,
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
      });
      
      (req as any).user = {
        uid: 'user123',
        organizationId: 'org123',
        role: 'user',
      };
      
      const response = await POST(req as any);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

## 📖 開發指南

### 本地開發環境設置
```bash
# 1. 克隆專案並安裝依賴
git clone <repository-url> nextjs-web-platform
cd nextjs-web-platform
npm install

# 2. 設置環境變數
cp .env.example .env.local
# 編輯 .env.local 填入正確的 Firebase 配置

# 3. 啟動開發伺服器
npm run dev

# 4. 在另一個終端運行測試
npm run test:watch

# 5. 運行類型檢查
npm run type-check

# 6. 運行 linting
npm run lint
```

### 開發工作流程
1. **建立功能分支**: `git checkout -b feature/new-feature`
2. **開發和測試**: 遵循 TDD 原則，先寫測試再實作
3. **提交代碼**: 使用語義化提交訊息
4. **建立 PR**: 經過 code review 後合併
5. **部署**: 自動部署到 staging 環境測試
6. **發布**: 合併到 main 分支部署到生產環境

### 程式碼品質標準
- **TypeScript**: 嚴格模式，所有函數必須有類型定義
- **ESLint**: 遵循 Next.js 建議配置
- **Prettier**: 統一程式碼格式
- **測試覆蓋率**: 最低 80%
- **效能**: Core Web Vitals 分數 > 90

## 🔄 與現有系統整合

### 資料遷移策略
```typescript
// src/lib/migration/data-sync.ts
import { adminDb } from '@/lib/firebase/admin';

// 資料同步檢查
export async function validateDataConsistency() {
  const collections = ['users', 'customers', 'records', 'organizations'];
  const results: Record<string, any> = {};
  
  for (const collection of collections) {
    try {
      const snapshot = await adminDb.collection(collection).limit(1).get();
      results[collection] = {
        exists: !snapshot.empty,
        sampleDoc: snapshot.docs[0]?.data(),
      };
    } catch (error) {
      results[collection] = {
        error: error.message,
      };
    }
  }
  
  return results;
}

// 資料結構驗證
export async function validateSchema(collection: string, expectedFields: string[]) {
  const snapshot = await adminDb.collection(collection).limit(10).get();
  const docs = snapshot.docs.map(doc => doc.data());
  
  const missingFields: string[] = [];
  const extraFields: Set<string> = new Set();
  
  docs.forEach(doc => {
    expectedFields.forEach(field => {
      if (!(field in doc)) {
        missingFields.push(field);
      }
    });
    
    Object.keys(doc).forEach(field => {
      if (!expectedFields.includes(field)) {
        extraFields.add(field);
      }
    });
  });
  
  return {
    missingFields: [...new Set(missingFields)],
    extraFields: [...extraFields],
    sampleCount: docs.length,
  };
}
```

### 漸進式遷移計劃
1. **Phase 1**: Next.js 基礎架構搭建
2. **Phase 2**: 認證系統整合
3. **Phase 3**: API 層建立
4. **Phase 4**: 核心功能遷移（客戶、記錄管理）
5. **Phase 5**: 進階功能遷移（分析、報表）
6. **Phase 6**: UI/UX 優化
7. **Phase 7**: 效能調優和監控設置

## 📋 檢查清單

### 開發完成檢查
- [ ] TypeScript 嚴格模式無錯誤
- [ ] ESLint 檢查通過
- [ ] 單元測試覆蓋率 ≥ 80%
- [ ] 整合測試通過
- [ ] API 文件更新
- [ ] 效能測試通過 (Core Web Vitals)
- [ ] 安全性測試通過
- [ ] 跨瀏覽器測試通過

### 部署前檢查
- [ ] 生產環境變數設置正確
- [ ] Firebase 權限配置檢查
- [ ] SSL 憑證配置
- [ ] CDN 配置優化
- [ ] 監控系統設置
- [ ] 錯誤追蹤系統運作
- [ ] 備份策略確認
- [ ] 災難恢復計劃測試

## 🚨 風險評估與緩解

### 技術風險
1. **Next.js 14 新功能穩定性**
   - 風險: App Router 和 Server Components 可能有未知 bug
   - 緩解: 充分測試，準備降級方案到 Pages Router

2. **Firebase Admin SDK 配置複雜**
   - 風險: 服務帳戶金鑰配置錯誤導致無法連接
   - 緩解: 詳細配置文件和自動化檢查腳本

3. **效能瓶頸**
   - 風險: 大量 Firebase 查詢可能影響效能
   - 緩解: 實作快取策略，優化查詢邏輯

### 業務風險
1. **用戶體驗一致性**
   - 風險: Web 版與 Mobile 版體驗差異過大
   - 緩解: 共享設計系統，定期 UX 測試

2. **資料安全性**
   - 風險: 新平台可能存在安全漏洞
   - 緩解: 安全審計，滲透測試

### 營運風險
1. **部署複雜性**
   - 風險: 多平台部署增加維護複雜度
   - 緩解: CI/CD 自動化，詳細操作文件

2. **團隊技能轉換**
   - 風險: 團隊需要學習 Next.js 開發模式
   - 緩解: 培訓計劃，技術文件完善

## 📈 成功指標

### 技術指標
- **建置時間**: < 2 分鐘
- **首屏載入時間**: < 2 秒
- **API 回應時間**: < 300ms (95th percentile)
- **測試覆蓋率**: ≥ 80%
- **TypeScript 類型覆蓋率**: 100%

### 業務指標
- **用戶滿意度**: ≥ 4.5/5
- **頁面錯誤率**: < 1%
- **API 錯誤率**: < 0.5%
- **系統可用性**: ≥ 99.9%

### 開發效率指標
- **功能交付週期**: < 2 週
- **Bug 修復時間**: < 2 天
- **程式碼審查時間**: < 4 小時
- **部署頻率**: 每天至少 1 次

---

## 📝 版本歷史

- **v1.0.0** (2025-08-18): 初始架構規格完成
- **v1.1.0** (計劃): 新增 PWA 支援和離線功能
- **v1.2.0** (計劃): 國際化支援擴展
- **v2.0.0** (計劃): 微服務架構重構

---

**文件狀態**: ✅ 完成  
**最後更新**: 2025-08-18  
**下次審查**: 2025-09-18  
**維護者**: DonnaAI 開發團隊