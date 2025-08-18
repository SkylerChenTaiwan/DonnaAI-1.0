# DonnaAI Web 平台型別整合計劃

## 執行摘要
- **建立日期**: 2025-08-18
- **目標**: 整合完整的型別系統到 DonnaAI Web 平台
- **預計時程**: 5-7 天
- **執行者**: TypeScript Type Guardian Agent

## 一、已完成的型別檔案

### ✅ 核心型別檔案 (已建立)
1. **`web-platform-base-types.ts`** - Web 平台基礎型別
   - Next.js API Routes 型別
   - 中間件和認證型別
   - 響應式設計型別
   - 錯誤處理型別
   - 環境配置型別

2. **`cross-platform-shared-types.ts`** - 跨平台共享型別
   - 基礎實體型別
   - 業務邏輯型別
   - 查詢和分頁型別
   - 通知和活動型別

3. **`api-endpoint-types.ts`** - API 端點型別
   - 所有 API 端點定義
   - 請求和回應型別
   - 完整的業務邏輯介面

4. **`firebase-integration-types.ts`** - Firebase 整合型別
   - Firebase Auth 型別
   - Firestore 型別
   - Storage 型別
   - Cloud Functions 型別

5. **`type-safety-check-report.md`** - 型別安全檢查報告
   - 現有配置分析
   - 改進建議
   - 執行計劃

## 二、整合步驟

### Phase 1: 環境變數型別定義 (Day 1)

#### 1. 建立環境變數型別定義檔案
```typescript
// /web/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    // Firebase Admin SDK
    readonly FIREBASE_PROJECT_ID: string;
    readonly FIREBASE_CLIENT_EMAIL: string;
    readonly FIREBASE_PRIVATE_KEY: string;
    
    // Firebase Client SDK
    readonly NEXT_PUBLIC_FIREBASE_API_KEY: string;
    readonly NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
    readonly NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
    readonly NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
    readonly NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly NEXT_PUBLIC_FIREBASE_APP_ID: string;
    
    // 其他環境變數
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly NEXT_PUBLIC_APP_URL?: string;
    readonly JWT_SECRET?: string;
    readonly SESSION_SECRET?: string;
  }
}
```

#### 2. 更新 `/web/lib/env.ts`
- 移除索引存取，使用點記法
- 整合新的型別定義

### Phase 2: 修復中間件型別問題 (Day 1-2)

#### 1. 更新 `/web/lib/middleware.ts`
```typescript
// 使用型別守衛替代強制轉換
import { z } from 'zod';

const TokenUserSchema = z.object({
  uid: z.string(),
  email: z.string().optional(),
  role: z.string().optional(),
  organization_id: z.string().optional(),
  team_ids: z.array(z.string()).optional(),
});

// 驗證並轉換
const validatedUser = TokenUserSchema.parse(tokenResult.user);
```

#### 2. 建立型別守衛函數庫
```typescript
// /web/lib/type-guards.ts
export * from '@/docs/types/web-platform-base-types';
// 匯入所有型別守衛函數
```

### Phase 3: 整合共享型別 (Day 2-3)

#### 1. 建立型別映射
```typescript
// /web/types/index.ts
export * from '@/docs/types/web-platform-base-types';
export * from '@/docs/types/cross-platform-shared-types';
export * from '@/docs/types/api-endpoint-types';
export * from '@/docs/types/firebase-integration-types';
```

#### 2. 更新現有檔案使用新型別
- 更新 `/web/types/api.types.ts`
- 更新 `/web/types/user.types.ts`
- 確保與新型別系統一致

### Phase 4: 整合 Zod 驗證 (Day 3-4)

#### 1. 安裝 Zod
```bash
cd web
npm install zod
```

#### 2. 建立驗證 Schema
```typescript
// /web/lib/validation/schemas.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  // ... 其他欄位
});

// 型別推導
export type User = z.infer<typeof UserSchema>;
```

#### 3. 整合到 API 路由
```typescript
// /web/app/api/users/route.ts
import { UserSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = UserSchema.parse(body);
  // ... 使用驗證後的資料
}
```

### Phase 5: 建立型別測試 (Day 4-5)

#### 1. 建立型別測試檔案
```typescript
// /web/__tests__/types/type-safety.test.ts
import { expectType, expectNotType } from 'tsd';
import type { ApiResponse, AuthenticatedUser } from '@/types';

// 測試型別推斷
const response: ApiResponse<string> = {
  success: true,
  data: 'test'
};

expectType<true>(response.success);
```

#### 2. 設定型別覆蓋率報告
```json
// /web/package.json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-coverage": "type-coverage --detail --min 95"
  }
}
```

### Phase 6: 文件和培訓 (Day 5-6)

#### 1. 建立型別使用指南
```markdown
// /web/docs/TYPE_USAGE_GUIDE.md
# 型別系統使用指南

## 匯入型別
...

## 建立新型別
...

## 型別守衛使用
...
```

#### 2. 建立範例程式碼
```typescript
// /web/examples/type-examples.ts
// 各種型別使用範例
```

## 三、檢查清單

### 立即執行 (今天)
- [ ] 建立環境變數型別定義
- [ ] 修復中間件型別轉換問題
- [ ] 移除所有 `any` 使用

### 短期執行 (本週)
- [ ] 整合 Zod 驗證
- [ ] 建立型別守衛庫
- [ ] 更新所有 API 路由使用新型別
- [ ] 建立型別測試

### 長期維護
- [ ] 定期型別覆蓋率檢查
- [ ] 型別文件更新
- [ ] 團隊培訓

## 四、風險評估

### 潛在風險
1. **編譯時間增加** - 嚴格型別可能增加 10-20% 編譯時間
2. **學習曲線** - 團隊需要適應新的型別系統
3. **破壞性變更** - 某些現有程式碼可能需要重構

### 緩解措施
1. 使用增量編譯和快取
2. 提供完整文件和範例
3. 分階段實施，避免一次性大改

## 五、成功指標

### 量化指標
- 型別覆蓋率 > 95%
- 零 `any` 使用（除必要情況）
- 所有 API 端點有完整型別定義
- 執行時錯誤減少 50%

### 質化指標
- 開發體驗改善
- 程式碼可維護性提升
- 新功能開發速度加快
- 減少型別相關的 bug

## 六、下一步行動

### 今天完成
1. ✅ 建立所有核心型別檔案
2. 🔄 開始整合環境變數型別
3. 🔄 修復中間件型別問題

### 本週目標
1. 完成 Zod 整合
2. 更新所有 API 路由
3. 建立完整的型別測試

### 長期規劃
1. 建立自動化型別產生工具
2. 整合 OpenAPI 規範
3. 建立型別變更追蹤系統

---

**結論**: 型別系統基礎架構已完成，現在需要進行整合和實施。透過分階段執行，可以最小化風險並確保成功實施。