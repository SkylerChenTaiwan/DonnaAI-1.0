# PRP-38: Admin Management System - Super Admin & Enterprise Admin

## 專案概述
建立雙層管理系統，包含 DonnaAI 平台管理員（Super Admin）和企業管理員（Enterprise Admin）功能。

## 核心需求
1. **Super Admin（DonnaAI 平台管理）**
   - 新增企業帳號
   - 管理企業帳號（查看用戶數、用量、購買的工具）
   - 配置可用工具和功能
   - 查看平台整體使用統計

2. **Enterprise Admin（企業內部管理）**
   - 用戶管理（新增、刪除、權限設定）
   - 工具授權管理
   - 查看組織內使用統計
   - 匯入既有 CRM 資料

## 實施藍圖

### 1. 資料模型擴展

```typescript
// src/types/admin.ts
export interface SuperAdmin extends User {
  role: 'super_admin';
  isSuperAdmin: true;
  platformPermissions: string[];
}

export interface EnterpriseConfig {
  id: string;
  organizationId: string;
  enabledTools: ToolConfig[];
  subscriptionDetails: {
    plan: 'trial' | 'basic' | 'professional' | 'enterprise';
    startDate: Date;
    endDate?: Date;
    seats: number;
    aiMinutesQuota: number;
  };
  customSettings: {
    allowDataImport: boolean;
    allowDataExport: boolean;
    customBranding?: {
      logoUrl?: string;
      primaryColor?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolConfig {
  id: string;
  name: string;
  category: 'recording' | 'analytics' | 'sales' | 'productivity';
  enabled: boolean;
  usageLimit?: number;
  customConfig?: Record<string, any>;
}

export interface UsageMetrics {
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  metrics: {
    activeUsers: number;
    totalSessions: number;
    aiMinutesUsed: number;
    toolUsage: Record<string, number>;
    dataVolume: {
      customers: number;
      records: number;
      tasks: number;
    };
  };
}
```

### 2. Firebase 結構更新

```
firestore/
├── organizations/           # 現有
├── enterprise_configs/      # 新增 - 企業配置
│   └── {configId}/
│       ├── tools/          # 工具配置
│       └── settings/       # 企業設定
├── usage_metrics/          # 新增 - 使用統計
│   └── {orgId}/
│       └── {period}/
│           └── {date}/
├── platform_admins/        # 新增 - 平台管理員
└── import_jobs/           # 新增 - 資料匯入任務
```

### 3. 頁面架構

#### Super Admin 頁面
1. **組織管理頁** (`/src/screens/superadmin/OrganizationsScreen.tsx`)
   - 列表顯示所有組織
   - 快速查看關鍵指標
   - 新增組織按鈕

2. **新增組織頁** (`/src/screens/superadmin/CreateOrganizationScreen.tsx`)
   - 企業基本資訊表單
   - 訂閱方案選擇
   - 初始管理員設定
   - 工具配置

3. **組織詳情頁** (`/src/screens/superadmin/OrganizationDetailScreen.tsx`)
   - 組織資訊編輯
   - 用戶列表
   - 使用統計圖表
   - 工具使用情況

4. **平台統計頁** (`/src/screens/superadmin/PlatformDashboard.tsx`)
   - 整體使用統計
   - 收入報表
   - 成長趨勢

#### Enterprise Admin 頁面
1. **管理中心首頁** (`/src/screens/admin/AdminDashboard.tsx`)
   - 組織概覽
   - 快速操作
   - 使用統計摘要

2. **用戶管理頁** (`/src/screens/admin/UserManagementScreen.tsx`)
   - 用戶列表（表格視圖）
   - 新增/編輯用戶
   - 批量操作
   - 權限設定

3. **工具管理頁** (`/src/screens/admin/ToolManagementScreen.tsx`)
   - 已購買工具列表
   - 啟用/停用控制
   - 分配給特定用戶/團隊

4. **資料匯入頁** (`/src/screens/admin/DataImportScreen.tsx`)
   - CSV/Excel 上傳
   - 欄位映射
   - 匯入進度追蹤
   - 歷史記錄

5. **使用報表頁** (`/src/screens/admin/UsageReportsScreen.tsx`)
   - 使用統計圖表
   - 用戶活躍度
   - AI 使用量
   - 匯出報表

### 4. 實施步驟

#### 階段 1：基礎架構（2天）
1. 建立資料模型和類型定義
2. 更新 Firestore 安全規則
3. 建立基礎服務層
4. 設定導航結構

#### 階段 2：Super Admin 功能（3天）
1. 實作組織 CRUD 操作
2. 建立 Super Admin UI
3. 實作使用統計收集
4. 測試權限控制

#### 階段 3：Enterprise Admin 功能（3天）
1. 實作用戶管理功能
2. 建立工具管理系統
3. 實作資料匯入功能
4. 建立使用報表

#### 階段 4：整合與優化（2天）
1. 整合到現有系統
2. 效能優化
3. 完整測試
4. 文檔更新

### 5. 關鍵實作細節

#### 權限檢查 Hook
```typescript
// src/hooks/useAdminAuth.ts
export function useAdminAuth() {
  const { user } = useAuthStore();
  
  const isSuperAdmin = user?.role === 'super_admin';
  const isEnterpriseAdmin = user?.role === 'admin';
  const canAccessAdminPanel = isSuperAdmin || isEnterpriseAdmin;
  
  const checkPermission = (permission: string) => {
    if (isSuperAdmin) return true;
    if (isEnterpriseAdmin) {
      // 檢查企業管理員特定權限
      return checkEnterpriseAdminPermission(user, permission);
    }
    return false;
  };
  
  return {
    isSuperAdmin,
    isEnterpriseAdmin,
    canAccessAdminPanel,
    checkPermission
  };
}
```

#### 資料匯入服務
```typescript
// src/services/dataImport.ts
export class DataImportService {
  async parseCSV(file: File): Promise<ParsedData> {
    // 使用 PapaParse 解析 CSV
  }
  
  async validateData(data: ParsedData): Promise<ValidationResult> {
    // 驗證資料格式和必填欄位
  }
  
  async mapFields(data: ParsedData, mapping: FieldMapping): Promise<MappedData> {
    // 根據用戶選擇映射欄位
  }
  
  async importBatch(data: MappedData, options: ImportOptions): Promise<ImportResult> {
    // 批次匯入到 Firestore
  }
}
```

#### 使用統計收集
```typescript
// src/services/analytics/usageTracker.ts
export class UsageTracker {
  async trackToolUsage(toolId: string, userId: string, orgId: string) {
    // 記錄工具使用
  }
  
  async aggregateMetrics(orgId: string, period: 'daily' | 'weekly' | 'monthly') {
    // 聚合統計資料
  }
  
  async generateReport(orgId: string, dateRange: DateRange): Promise<UsageReport> {
    // 生成使用報表
  }
}
```

### 6. UI/UX 考量

1. **設計系統整合**
   - 延續現有的灰階設計系統
   - Admin 頁面使用更專業的配色（深灰強調）
   - 數據密集型介面優化

2. **響應式設計**
   - 桌面優先（管理介面主要在桌面使用）
   - 平板適配
   - 手機基本支援

3. **效能優化**
   - 虛擬列表顯示大量數據
   - 分頁載入
   - 快取常用資料

### 7. 安全性考量

1. **存取控制**
   ```javascript
   // firestore.rules 更新
   match /enterprise_configs/{configId} {
     allow read: if isSuperAdmin() || 
                    (isEnterpriseAdmin() && resource.data.organizationId == getUserOrgId());
     allow write: if isSuperAdmin();
   }
   
   match /organizations/{orgId}/users/{userId} {
     allow read: if isSuperAdmin() || 
                    (isEnterpriseAdmin() && orgId == getUserOrgId());
     allow write: if isSuperAdmin() || 
                     (isEnterpriseAdmin() && orgId == getUserOrgId() && 
                      !isChangingRole(request.resource.data));
   }
   ```

2. **資料隔離**
   - 組織間資料完全隔離
   - 用戶只能看到授權範圍內的資料

3. **操作審計**
   - 記錄所有管理操作
   - 可追溯的變更歷史

### 8. 測試策略

1. **單元測試**
   - 權限檢查邏輯
   - 資料匯入解析
   - 統計計算

2. **整合測試**
   - 完整的用戶管理流程
   - 資料匯入流程
   - 報表生成

3. **E2E 測試**
   - Super Admin 工作流程
   - Enterprise Admin 工作流程

### 9. 驗證標準

```bash
# 類型檢查
npm run typecheck

# 程式碼品質
npm run lint

# 單元測試
npm test

# 功能驗證清單
- [ ] Super Admin 可以創建新組織
- [ ] Super Admin 可以查看所有組織統計
- [ ] Enterprise Admin 可以管理組織內用戶
- [ ] Enterprise Admin 可以匯入 CSV 資料
- [ ] 工具授權正確限制功能存取
- [ ] 使用統計正確記錄和顯示
```

## 相關資源

### 現有程式碼參考
- 人事管理頁面：`/src/screens/personnel/PersonnelScreen.tsx`
- 權限系統：`/src/services/firebase/permissions.ts`
- 資料匯出（可參考實作匯入）：`/src/services/dataExport.ts`
- 設計系統：`/src/theme/designSystem.ts`

### 外部資源
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) - 後端管理操作
- [PapaParse](https://www.papaparse.com/) - CSV 解析
- [SheetJS](https://sheetjs.com/) - Excel 檔案處理
- [Recharts](https://recharts.org/) - 統計圖表
- [React Table](https://tanstack.com/table/latest) - 資料表格

## 實施優先順序

1. **必要功能**（第一版）
   - Super Admin：創建組織、查看組織列表
   - Enterprise Admin：用戶管理、基本權限控制
   - 基本使用統計

2. **重要功能**（第二版）
   - 資料匯入功能
   - 工具管理系統
   - 詳細使用報表

3. **優化功能**（第三版）
   - 自訂品牌
   - 進階報表
   - API 存取

## 風險與緩解

1. **資料量大**
   - 風險：管理大量用戶時效能問題
   - 緩解：實作分頁、虛擬滾動、適當的索引

2. **權限複雜**
   - 風險：權限設定錯誤導致資料洩露
   - 緩解：完整的測試覆蓋、清晰的權限矩陣

3. **匯入錯誤**
   - 風險：錯誤的資料匯入破壞現有資料
   - 緩解：預覽功能、驗證步驟、回滾機制

## 成功標準

1. Super Admin 可在 2 分鐘內完成新組織設定
2. Enterprise Admin 可在 5 分鐘內匯入 1000 筆客戶資料
3. 頁面載入時間 < 2 秒
4. 零安全漏洞
5. 90% 以上的測試覆蓋率

## 實施信心評分：8.5/10

高信心度基於：
- 現有的權限系統基礎
- 清晰的需求定義
- 成熟的技術棧
- 良好的程式碼結構

需注意：
- 資料匯入的複雜性
- 大量資料的效能優化
- 完整的權限矩陣設計