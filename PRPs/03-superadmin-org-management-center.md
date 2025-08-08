# PRP: SuperAdmin 組織管理中心重構

## 概述
重新設計 SuperAdmin 的組織管理介面，整合入職（onboarding）和管理功能，提供統一的組織管理體驗。

## 背景與需求
當 SuperAdmin 與一家公司談好合作後，需要：
1. 快速設置新組織
2. 批量導入用戶和資料
3. 持續管理和監控組織狀態
4. 查看組織的資料和使用情況

目前問題：
- SuperAdmin 功能散落在不同頁面
- 缺乏統一的入職流程
- 沒有審計日誌追蹤

## 實施計畫

### 階段 1：介面重構

#### 1.1 建立組織管理中心（Organization Management Center）
```
src/screens/superadmin/OrganizationCenter.tsx
```

主要功能區塊：
1. **組織總覽標籤**：列出所有組織，快速篩選和搜尋
2. **待入職標籤**：顯示需要完成設置的新組織
3. **快速操作**：新增組織、批量操作等

#### 1.2 重新設計組織列表介面
- 新增狀態標籤：`新建`、`設置中`、`活躍`、`暫停`
- 加入入職進度指示器
- 快速切換查看不同組織資料

### 階段 2：入職儀表板（Onboarding Dashboard）

#### 2.1 建立入職狀態追蹤
```typescript
interface OnboardingStatus {
  organizationId: string;
  steps: {
    basicSetup: { completed: boolean; completedAt?: Date };
    billingSetup: { completed: boolean; completedAt?: Date };
    userImport: { completed: boolean; importedCount?: number };
    dataImport: { 
      customers: boolean;
      records: boolean;
      tasks: boolean;
    };
    welcomeEmailSent: boolean;
  };
  createdAt: Date;
  completedAt?: Date;
}
```

#### 2.2 入職進度卡片元件
```
src/components/superadmin/OnboardingProgressCard.tsx
```
顯示：
- 整體進度百分比
- 各步驟完成狀態
- 下一步操作提示
- 快速跳轉連結

### 階段 3：審計日誌系統

#### 3.1 建立審計日誌服務
```
src/services/firebase/auditLogService.ts
```

記錄操作：
- 組織創建/修改/刪除
- 用戶批量匯入
- 資料匯入操作
- 權限變更
- 資料查看記錄

#### 3.2 審計日誌查看介面
```
src/screens/superadmin/AuditLogViewer.tsx
```

功能：
- 按組織篩選
- 按時間範圍查詢
- 按操作類型分類
- 匯出審計報告

### 階段 4：組織資料查看器

#### 4.1 唯讀資料瀏覽器
```
src/components/superadmin/OrganizationDataViewer.tsx
```

特點：
- 切換不同組織的資料庫視圖
- 唯讀模式，防止誤操作
- 顯示資料統計摘要
- 快速搜尋和篩選

#### 4.2 組織切換器元件
```
src/components/superadmin/OrganizationSwitcher.tsx
```

功能：
- 下拉選單快速切換
- 最近查看的組織
- 搜尋組織
- 顯示當前組織資訊

## 技術實作細節

### 資料結構更新

#### Organizations 集合新增欄位：
```typescript
{
  // 現有欄位...
  
  // 新增欄位
  onboardingStatus: 'pending' | 'in_progress' | 'completed',
  onboardingProgress: number, // 0-100
  onboardingSteps: OnboardingSteps,
  metadata: {
    industry?: string;
    companySize?: string;
    primaryContact?: string;
    notes?: string;
  },
  createdBy: string, // SuperAdmin ID
  lastViewedBy?: string,
  lastViewedAt?: Date
}
```

#### AuditLogs 集合：
```typescript
{
  id: string;
  timestamp: Timestamp;
  organizationId: string;
  organizationName: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'import' | 'export';
  resource: 'organization' | 'user' | 'customer' | 'record' | 'task';
  details: {
    [key: string]: any;
  };
  ip?: string;
  userAgent?: string;
}
```

### 路由結構調整

```
/superadmin
  /dashboard -> SuperAdmin 總覽
  /organizations -> 組織管理中心（新）
    /:id -> 組織詳情（整合入職和管理）
    /:id/onboarding -> 入職精靈
    /:id/data -> 資料查看器
    /:id/audit -> 審計日誌
  /platform -> 平台設定
```

### 狀態管理

建立新的 Store：
```
src/stores/superAdminStore.ts
```

管理：
- 當前查看的組織
- 組織列表快取
- 入職狀態
- 審計日誌設定

## UI/UX 設計要點

### 1. 組織管理中心主頁
```
+------------------------------------------+
| 🔍 搜尋組織...           [+ 新增組織]    |
+------------------------------------------+
| [全部] [待入職] [活躍] [暫停]           |
+------------------------------------------+
| 📊 Global Company        進度: 75%  🔵  |
|    3個步驟待完成 · 50個用戶 · 建立於2天前 |
|    [繼續設置] [查看詳情]                |
+------------------------------------------+
| ✅ ABC Corp              活躍       🟢  |
|    100個用戶 · 5000筆資料 · 上月收入$500 |
|    [查看] [資料] [審計]                 |
+------------------------------------------+
```

### 2. 入職進度視圖
```
組織入職進度 - Global Company

[===========75%===========]

✅ 基本設定          完成於 2天前
✅ 計費方案          $10/用戶/月
⏳ 用戶導入          50/80 已完成
   ⚠️ 11筆資料未匯入 [查看詳情]
⭕ 客戶資料導入      待開始
⭕ 發送歡迎郵件      待完成

[繼續設置] [稍後處理]
```

### 3. 審計日誌視圖
```
審計日誌 - Global Company

篩選: [所有操作 ▼] [最近7天 ▼]

📝 2024-01-08 14:30:22
   admin@donna.ai 匯入了 50 個用戶
   詳情: CSV檔案, 11筆失敗
   
👁️ 2024-01-08 14:25:10
   admin@donna.ai 查看了客戶資料庫
   詳情: 瀏覽了 25 筆記錄
```

## 實作步驟

### 第一天：基礎架構
1. 建立 superAdminStore
2. 設置審計日誌服務
3. 更新 Organizations 資料結構

### 第二天：UI 元件
1. 建立 OrganizationCenter 主頁
2. 實作 OnboardingProgressCard
3. 建立 OrganizationSwitcher

### 第三天：功能整合
1. 整合現有功能到新介面
2. 實作審計日誌記錄
3. 測試組織切換功能

### 第四天：資料查看器
1. 建立唯讀資料瀏覽器
2. 實作權限控制
3. 加入審計記錄

### 第五天：測試與優化
1. 端到端測試
2. 效能優化
3. 使用者體驗改善

## 成功指標

1. **功能完整性**
   - [ ] 所有組織在統一介面管理
   - [ ] 入職進度清晰可見
   - [ ] 審計日誌完整記錄

2. **使用體驗**
   - [ ] 3秒內載入組織列表
   - [ ] 1秒內切換組織視圖
   - [ ] 直觀的進度追蹤

3. **資料安全**
   - [ ] 所有操作記錄在審計日誌
   - [ ] 資料查看為唯讀模式
   - [ ] 權限驗證完整

## 驗證方式

```bash
# 前端測試
npm run test:superadmin

# E2E 測試
npm run e2e:organization-center

# 審計日誌驗證
npm run verify:audit-logs
```

## 風險與緩解

1. **資料量大時的效能問題**
   - 使用分頁載入
   - 實作虛擬滾動
   - 加入快取機制

2. **權限洩漏風險**
   - 雙重權限檢查（前端+後端）
   - 所有操作記錄審計
   - 定期權限審查

3. **用戶體驗混亂**
   - 保留舊介面過渡期
   - 提供操作指引
   - 收集用戶回饋

## 相關文件

- 現有程式碼：
  - `/src/screens/superadmin/OrganizationsScreen.tsx`
  - `/src/screens/superadmin/OrganizationDetailScreen.tsx`
  - `/src/services/firebase/organizations.ts`

- 參考設計：
  - Firebase Console 的專案管理介面
  - Stripe Dashboard 的客戶管理
  - AWS Organizations 的帳戶管理

## 後續 PRP

完成此 PRP 後，將進行：
1. PRP-04: 組織入職精靈（Onboarding Wizard）
2. PRP-05: 批量資料匯入與智能映射

---

**優先級**: 高
**預估時間**: 5 天
**依賴項**: 無
**實作信心度**: 9/10