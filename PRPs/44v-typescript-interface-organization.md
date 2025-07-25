# PRP: TypeScript 介面定義統一與組織重構

## 問題描述
專案中存在重複的介面定義，導致類型不一致和執行時錯誤。最近發生的 `toUpperCase` undefined 錯誤就是因為 `useOrganization` hook 中的 `Organization` 介面缺少 `subscriptionPlan` 等必要欄位。

## 根本原因分析

### 1. 重複定義的介面
- **Organization**：同時定義在 `/src/types/user.ts` 和 `/src/hooks/useOrganization.ts`
- **Team**：同時定義在相同的兩個檔案中
- 兩處定義的欄位不一致，造成類型安全問題

### 2. 實際資料結構差異

#### `/src/types/user.ts` 中的完整定義：
```typescript
export interface Organization {
  id: string;
  name: string;
  subscriptionPlan: 'trial' | 'basic' | 'professional' | 'enterprise';
  aiMinutesQuota: number;
  aiMinutesUsed: number;
  createdAt: Date;
  updatedAt?: Date;
  status?: 'active' | 'suspended' | 'cancelled' | 'expired';
  domain?: string;
  contactEmail?: string;
  maxUsers?: number;
  stats?: {
    totalUsers: number;
    totalTeams: number;
    activeProjects: number;
  };
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  parentTeamId?: string;
  managerIds?: string[];
  memberIds?: string[];
}
```

#### `/src/hooks/useOrganization.ts` 中的不完整定義：
```typescript
export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  ownerId: string;
  settings?: {
    defaultLanguage?: string;
    timezone?: string;
    features?: string[];
  };
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  description?: string;
  memberCount?: number;
  leaderId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### 3. 現有架構分析
- `/src/types/` 是專門存放類型定義的目錄
- 大部分服務正確地從 `@/types/user` 匯入 Organization 類型
- 但 hook 自行定義了不同的介面，破壞了單一真實來源原則

## 解決方案設計

### 1. 介面組織原則
- **單一真實來源**：每個介面只在一處定義
- **領域分離**：按業務領域組織類型檔案
- **明確的匯入路徑**：統一使用 `@/types/*` 匯入
- **介面繼承與組合**：使用 TypeScript 的 extends 和 intersection types

### 2. 檔案結構建議
```
src/types/
├── entities/          # 核心實體定義
│   ├── organization.ts
│   ├── team.ts
│   ├── user.ts
│   └── index.ts
├── state/            # 狀態管理相關
│   ├── organization.ts
│   └── index.ts
├── api/              # API 請求/回應類型
│   └── index.ts
└── index.ts          # 統一匯出
```

### 3. 介面重構策略

#### 步驟 1：建立統一的 Organization 介面
```typescript
// src/types/entities/organization.ts
export interface BaseOrganization {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Organization extends BaseOrganization {
  subscriptionPlan: 'trial' | 'basic' | 'professional' | 'enterprise';
  aiMinutesQuota: number;
  aiMinutesUsed: number;
  status?: 'active' | 'suspended' | 'cancelled' | 'expired';
  domain?: string;
  contactEmail?: string;
  maxUsers?: number;
  ownerId: string;
  settings?: OrganizationSettings;
  stats?: OrganizationStats;
}

export interface OrganizationSettings {
  defaultLanguage?: string;
  timezone?: string;
  features?: string[];
}

export interface OrganizationStats {
  totalUsers: number;
  totalTeams: number;
  activeProjects: number;
}
```

#### 步驟 2：移除 hook 中的重複定義
```typescript
// src/hooks/useOrganization.ts
import { Organization, Team } from '@/types/entities';
// 移除本地的 interface 定義
```

#### 步驟 3：建立資料驗證工具
```typescript
// src/utils/validators/organization.ts
export function isValidOrganization(data: any): data is Organization {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    ['trial', 'basic', 'professional', 'enterprise'].includes(data.subscriptionPlan)
  );
}

export function normalizeOrganization(data: Partial<Organization>): Organization {
  return {
    id: data.id || '',
    name: data.name || '',
    subscriptionPlan: data.subscriptionPlan || 'basic',
    aiMinutesQuota: data.aiMinutesQuota || 0,
    aiMinutesUsed: data.aiMinutesUsed || 0,
    createdAt: data.createdAt || new Date(),
    ownerId: data.ownerId || '',
    ...data
  };
}
```

## 實作計劃

### 階段 1：建立新的類型結構（不破壞現有功能）
1. 在 `/src/types/entities/` 建立新的介面定義
2. 建立資料驗證和正規化工具
3. 建立類型防護函式

### 階段 2：逐步遷移
1. 更新 `useOrganization` hook 使用新介面
2. 更新所有服務使用統一介面
3. 測試所有受影響的功能

### 階段 3：清理與優化
1. 移除舊的重複定義
2. 更新所有匯入路徑
3. 加入 ESLint 規則防止未來的重複定義

## 實作任務清單

1. **建立新的類型結構**
   - [ ] 建立 `/src/types/entities/` 目錄
   - [ ] 建立 `organization.ts` 統一介面
   - [ ] 建立 `team.ts` 統一介面
   - [ ] 建立 `index.ts` 統一匯出

2. **建立資料驗證工具**
   - [ ] 建立 `/src/utils/validators/` 目錄
   - [ ] 實作 `organization.ts` 驗證器
   - [ ] 實作 `team.ts` 驗證器

3. **更新 useOrganization hook**
   - [ ] 移除本地介面定義
   - [ ] 匯入統一介面
   - [ ] 加入資料驗證邏輯
   - [ ] 測試 hook 功能

4. **更新受影響的元件**
   - [ ] 更新 OrganizationsScreen
   - [ ] 更新其他使用 Organization 的元件
   - [ ] 加入防禦性程式碼

5. **測試與驗證**
   - [ ] 執行單元測試
   - [ ] 手動測試 Super Admin 功能
   - [ ] 驗證資料正確顯示

## 驗證步驟

```bash
# 1. TypeScript 編譯檢查
npm run typecheck

# 2. ESLint 檢查
npm run lint

# 3. 執行測試
npm test

# 4. 手動測試
# - 登入 Super Admin 帳號
# - 檢查組織列表顯示正常
# - 確認沒有 undefined 錯誤
```

## 預期效果

1. **類型安全**：消除類型不一致導致的執行時錯誤
2. **維護性提升**：單一真實來源讓更新更容易
3. **開發體驗**：更好的 IDE 支援和自動完成
4. **可擴展性**：清晰的介面繼承結構便於未來擴展

## 風險評估

1. **破壞性變更**：需要更新多個檔案，可能影響現有功能
2. **測試覆蓋**：需要確保所有使用這些介面的地方都經過測試
3. **資料相容性**：需要確保新舊資料格式相容

## 參考資源

1. [TypeScript Handbook - Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
2. [TypeScript Deep Dive - Type Organization](https://basarat.gitbook.io/typescript/project/modules)
3. 專案現有模式：
   - `/src/types/user.ts` - 現有的完整 Organization 定義
   - `/src/types/admin.ts` - OrganizationDetails 擴展範例
   - `/src/services/firebase/organizations.ts` - 服務層使用範例

## 實作信心評分：9/10

此 PRP 提供了完整的問題分析、解決方案和實作步驟。唯一的不確定因素是可能還有其他未發現的使用這些介面的地方，但透過 TypeScript 編譯器和測試可以快速發現並修復。