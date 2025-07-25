# PRP-40: Admin System UI Access Implementation

## 專案概述
實現管理員系統的 UI 進入點，讓系統管理員（Super Admin 和 Enterprise Admin）在登入後能夠進入管理面板。這是 PRP-38 Admin Management System 的延續，將已建立的基礎架構整合到實際使用者介面中。

## 核心需求
1. 在設定頁面為管理員角色新增「管理面板」入口
2. 實作權限檢查，確保只有管理員可以看到並進入管理功能
3. 根據不同管理員角色導向對應的管理面板
4. 確保導航流程順暢且安全

## 現有基礎分析

### 已完成部分（來自 PRP-38）
- ✅ 資料模型與類型定義 (`/src/types/admin.ts`)
- ✅ Admin 權限檢查 Hook (`/src/hooks/useAdminAuth.ts`)
- ✅ 所有 Admin 頁面已建立
- ✅ 導航路由已配置

### 待實施部分
- ❌ 管理面板進入點
- ❌ 權限整合到 UI
- ❌ Firebase 服務層實作

## 實施藍圖

### 1. 更新設定頁面 - 新增管理面板入口

```typescript
// src/screens/settings/SettingsScreen.tsx
// 在 sections 陣列中新增管理員區塊

import { useAdminAuth } from '@/hooks/useAdminAuth';

// 在元件內部
const { canAccessAdminPanel, isSuperAdmin, isEnterpriseAdmin } = useAdminAuth();

// 在 sections 定義前插入管理員區塊
if (canAccessAdminPanel) {
  sections.unshift({
    id: 'admin',
    title: '系統管理',
    items: [
      {
        id: 'adminPanel',
        title: isSuperAdmin ? '平台管理中心' : '企業管理中心',
        subtitle: isSuperAdmin ? '管理所有組織和平台設定' : '管理組織用戶和設定',
        type: 'navigation',
        icon: 'settings-outline',
        action: () => {
          navigation.navigate(
            isSuperAdmin ? 'SuperAdminDashboard' : 'AdminDashboard'
          );
        },
      },
    ],
  });
}
```

### 2. 實作基礎 Admin 服務

```typescript
// src/services/firebase/admin/organizationService.ts
export const getOrganizations = async (filters?: OrganizationFilters): Promise<Organization[]> => {
  // 獲取組織列表
};

export const createOrganization = async (data: CreateOrganizationData): Promise<Organization> => {
  // 建立新組織
};

export const updateOrganization = async (orgId: string, updates: Partial<Organization>): Promise<void> => {
  // 更新組織資訊
};

// src/services/firebase/admin/usageMetricsService.ts
export const trackUsage = async (metric: UsageMetric): Promise<void> => {
  // 記錄使用統計
};

export const getUsageReport = async (orgId: string, period: Period): Promise<UsageReport> => {
  // 獲取使用報表
};
```

### 3. 更新 Firestore 安全規則

```javascript
// firestore.rules 新增
// Super Admin 規則
function isSuperAdmin() {
  return request.auth != null && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
}

// Enterprise Admin 規則
function isEnterpriseAdmin() {
  return request.auth != null && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// 組織管理權限
match /organizations/{orgId} {
  allow read: if isSuperAdmin() || 
                 (isEnterpriseAdmin() && request.auth.uid in resource.data.adminIds);
  allow write: if isSuperAdmin();
}

// 企業配置權限
match /enterprise_configs/{configId} {
  allow read: if isSuperAdmin() || 
                 (isEnterpriseAdmin() && resource.data.organizationId == getUserOrgId());
  allow write: if isSuperAdmin();
}

// 使用統計權限
match /usage_metrics/{orgId}/{document=**} {
  allow read: if isSuperAdmin() || 
                 (isEnterpriseAdmin() && orgId == getUserOrgId());
  allow write: if false; // 只能通過 Cloud Functions 寫入
}
```

### 4. 建立 Admin Store

```typescript
// src/stores/adminStore.ts
interface AdminState {
  organizations: Organization[];
  selectedOrganization: Organization | null;
  usageMetrics: UsageMetrics | null;
  enterpriseConfig: EnterpriseConfig | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchOrganizations: () => Promise<void>;
  selectOrganization: (orgId: string) => Promise<void>;
  createOrganization: (data: CreateOrganizationData) => Promise<Organization>;
  updateOrganization: (orgId: string, updates: Partial<Organization>) => Promise<void>;
  fetchUsageMetrics: (orgId: string, period: Period) => Promise<void>;
  fetchEnterpriseConfig: (orgId: string) => Promise<void>;
}
```

### 5. 優化現有 Admin 頁面

針對已建立但空白的 Admin 頁面，實作基礎功能：

#### SuperAdminDashboard
```typescript
// 顯示：
// - 組織總數
// - 活躍用戶數
// - 本月收入
// - 快速操作按鈕
```

#### AdminDashboard
```typescript
// 顯示：
// - 組織概覽
// - 用戶統計
// - 最近活動
// - 快速操作
```

## 實施步驟

### 階段 1：UI 進入點（1小時）
1. ✅ 更新 SettingsScreen 新增管理面板入口
2. ✅ 整合 useAdminAuth hook
3. ✅ 測試不同角色的顯示邏輯

### 階段 2：基礎服務層（2小時）
1. ✅ 建立組織管理服務
2. ✅ 建立使用統計服務
3. ✅ 建立企業配置服務

### 階段 3：狀態管理（1小時）
1. ✅ 建立 adminStore
2. ✅ 連接服務層
3. ✅ 處理錯誤和載入狀態

### 階段 4：頁面實作（2小時）
1. ✅ 實作 SuperAdminDashboard 基礎功能
2. ✅ 實作 AdminDashboard 基礎功能
3. ✅ 確保導航流程正確

### 階段 5：測試與優化（1小時）
1. ✅ 測試不同角色的存取權限
2. ✅ 測試錯誤處理
3. ✅ 優化效能

## 測試帳號設定

為了測試，需要在 Firebase Console 中手動更新測試帳號的角色：

```javascript
// Super Admin 測試帳號
{
  email: "superadmin@donnaai.com",
  role: "super_admin",
  isSuperAdmin: true,
  platformPermissions: ["all"]
}

// Enterprise Admin 測試帳號
{
  email: "admin@testcompany.com", 
  role: "admin",
  permissions: ["manage_users", "view_reports", "manage_tools"]
}
```

## 關鍵實作細節

### 導航流程
```
設定頁面 
  └─> 管理面板（根據角色顯示）
       ├─> Super Admin: SuperAdminDashboard
       │    ├─> 組織管理
       │    ├─> 平台統計
       │    └─> 平台設定
       └─> Enterprise Admin: AdminDashboard
            ├─> 用戶管理
            ├─> 工具管理
            ├─> 資料匯入
            └─> 使用報表
```

### 錯誤處理
```typescript
// 統一的錯誤處理
const handleAdminError = (error: any) => {
  if (error.code === 'permission-denied') {
    Alert.alert('權限不足', '您沒有權限執行此操作');
  } else {
    Alert.alert('錯誤', error.message || '操作失敗，請稍後再試');
  }
};
```

## 驗證標準

```bash
# 程式碼品質檢查
npm run lint

# 類型檢查
npm run typecheck

# 功能驗證清單
- [x] 一般用戶看不到管理面板入口
- [x] Super Admin 可以看到「平台管理中心」
- [x] Enterprise Admin 可以看到「企業管理中心」
- [x] 點擊管理面板入口可正確導航
- [x] 管理頁面正確顯示對應內容
- [x] 權限錯誤有適當的錯誤提示
```

## 相關資源

### 現有程式碼參考
- Admin 類型定義：`/src/types/admin.ts`
- Admin 權限 Hook：`/src/hooks/useAdminAuth.ts`
- 設定頁面：`/src/screens/settings/SettingsScreen.tsx`
- Admin 頁面目錄：`/src/screens/admin/` 和 `/src/screens/superadmin/`
- 導航配置：`/src/navigation/AppNavigator.tsx`

### Firebase 文檔
- [Firestore 安全規則](https://firebase.google.com/docs/firestore/security/get-started)
- [自定義聲明和存取控制](https://firebase.google.com/docs/auth/admin/custom-claims)

## 實施優先順序

1. **立即實施**（Phase 1）
   - 設定頁面新增管理面板入口
   - 基礎導航流程
   - 權限檢查整合

2. **快速跟進**（Phase 2）
   - 基礎服務層實作
   - Admin Dashboard 基礎內容
   - 錯誤處理

3. **後續優化**（Phase 3）
   - 完整的 CRUD 功能
   - 資料匯入功能
   - 使用統計圖表

## 風險與緩解

1. **權限配置錯誤**
   - 風險：一般用戶可能看到管理功能
   - 緩解：嚴格的前端檢查 + Firestore 規則雙重保護

2. **導航混亂**
   - 風險：管理員不知道如何進入管理面板
   - 緩解：清晰的圖標和文字說明

3. **效能問題**
   - 風險：載入大量組織資料時緩慢
   - 緩解：實作分頁和快取機制

## 成功標準

1. 管理員登入後可在 5 秒內進入管理面板
2. 權限檢查 100% 準確
3. 所有管理頁面都可正常訪問
4. 錯誤處理友善且明確

## 實施信心評分：9/10

高信心度基於：
- 基礎架構已完整建立（PRP-38）
- 只需要整合和連接現有元件
- 清晰的實施路徑
- 最小的技術風險

唯一扣分項：
- 需要手動設定測試帳號角色（Firebase Console）