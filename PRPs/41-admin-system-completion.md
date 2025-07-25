# PRP-41: Admin System Completion - 完整管理功能實作

## 專案概述
完成 Admin 管理系統的所有功能，包含完善各個管理頁面、資料匯入/匯出功能優化、使用統計圖表實作，以及 Firestore 安全規則驗證。這是 PRP-38 和 PRP-40 的延續，將空白的管理頁面實作完成。

## 核心需求
1. 驗證並優化 Firestore 安全規則
2. 完善所有管理頁面的具體功能
3. 優化資料匯入功能並完成匯出功能
4. 實作詳細的使用統計圖表

## 現有基礎分析

### 已完成部分
- ✅ Firestore 安全規則已實作（需驗證）
- ✅ 資料匯入服務 (`dataImport.ts`) 和 CSV 上傳元件
- ✅ Victory Native 圖表庫和基礎圖表元件
- ✅ 表單處理模式（react-hook-form + zod）
- ✅ Admin 權限檢查和路由設定

### 待實施部分
- ❌ 管理頁面具體功能實作
- ❌ 資料匯出功能完善
- ❌ 統計圖表整合到管理頁面
- ❌ 批量操作和進階功能

## 實施藍圖

### 1. Firestore 安全規則驗證與優化

檢查並確保 `firestore.rules` 包含所有必要的管理員權限控制：

```javascript
// 確保包含以下規則
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin 相關集合的存取控制
    match /organizations/{orgId} {
      allow read: if isAuthenticated() && 
        (isSuperAdmin() || (isEnterpriseAdmin() && request.auth.uid in resource.data.adminIds));
      allow write: if isSuperAdmin();
      allow update: if isEnterpriseAdmin() && request.auth.uid in resource.data.adminIds
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['id', 'createdAt']);
    }
    
    match /enterprise_configs/{configId} {
      allow read: if isAuthenticated() && 
        (isSuperAdmin() || (isEnterpriseAdmin() && resource.data.organizationId == getUserOrgId()));
      allow write: if isSuperAdmin();
      allow update: if isEnterpriseAdmin() && resource.data.organizationId == getUserOrgId();
    }
    
    match /usage_metrics/{orgId}/{document=**} {
      allow read: if isAuthenticated() && 
        (isSuperAdmin() || (isEnterpriseAdmin() && orgId == getUserOrgId()));
      allow write: if false; // 只能通過 Cloud Functions
    }
  }
}
```

### 2. 管理頁面功能實作

#### 2.1 用戶管理頁面 (`UserManagementScreen.tsx`)
```typescript
// 功能需求：
// - 用戶列表（DataTable 元件）
// - 新增/編輯用戶（Modal + Form）
// - 角色分配（下拉選單）
// - 權限設定（多選框）
// - 批量操作（啟用/停用/刪除）
// - 搜尋和篩選

// 參考現有模式：
// - PersonnelScreen.tsx 的表格實作
// - CustomerForm.tsx 的表單處理
// - useAdminAuth hook 的權限檢查
```

#### 2.2 工具管理頁面 (`ToolManagementScreen.tsx`)
```typescript
// 功能需求：
// - 工具列表（卡片式佈局）
// - 啟用/停用工具
// - 使用限制設定
// - 工具使用統計
// - 自訂配置

// 使用 adminStore 的工具管理功能：
const { enterpriseConfig, toggleTool, updateEnterpriseConfig } = useAdminStore();
```

#### 2.3 資料匯入頁面 (`DataImportScreen.tsx`)
```typescript
// 功能需求：
// - 檔案上傳介面（使用現有 CSVUploader）
// - 欄位映射 UI
// - 資料預覽
// - 匯入進度追蹤
// - 錯誤處理和重試
// - 匯入歷史記錄

// 整合現有服務：
import { DataImportService } from '@/services/dataImport';
import { CSVUploader } from '@/components/data/CSVUploader';
```

#### 2.4 使用報表頁面 (`UsageReportsScreen.tsx`)
```typescript
// 功能需求：
// - 時間範圍選擇器
// - 多種圖表類型（折線圖、長條圖、圓餅圖）
// - 資料表格視圖
// - 匯出報表功能
// - 自訂報表建立

// 使用現有圖表元件：
import { ActivityChart } from '@/components/charts/ActivityChart';
// 新增更多圖表類型
```

### 3. 資料匯出功能完善

擴展現有的 `dataExport.ts`：

```typescript
// src/services/dataExport.ts 優化
export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  dataTypes: Array<'users' | 'customers' | 'records' | 'tasks' | 'usage'>;
  dateRange?: { start: Date; end: Date };
  filters?: Record<string, any>;
  includeMetadata?: boolean;
}

export async function exportAdminData(options: ExportOptions): Promise<void> {
  // 實作管理員資料匯出
  // 支援大量資料的分批處理
  // 顯示進度條
  // 處理不同格式的轉換
}
```

### 4. 使用統計圖表實作

建立可重用的圖表元件庫：

```typescript
// src/components/charts/admin/
// - UsageLineChart.tsx - 使用趨勢折線圖
// - RevenueBarChart.tsx - 收入長條圖
// - UserDistributionPie.tsx - 用戶分布圓餅圖
// - ToolUsageHeatmap.tsx - 工具使用熱圖
// - MetricCard.tsx - 統計卡片元件

// 基礎圖表配置
const chartTheme = {
  axis: {
    style: {
      tickLabels: {
        fill: DesignSystem.colors.text.secondary,
        fontSize: 12
      },
      grid: {
        stroke: DesignSystem.colors.border.light,
        strokeDasharray: "3 3"
      }
    }
  }
};
```

### 5. 批量操作和進階功能

```typescript
// 批量操作 Hook
export function useBatchOperations<T>() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleBatchOperation = async (
    operation: (ids: string[]) => Promise<void>,
    confirmMessage?: string
  ) => {
    if (selectedItems.size === 0) return;
    
    if (confirmMessage) {
      const confirmed = await showConfirmDialog(confirmMessage);
      if (!confirmed) return;
    }
    
    setIsProcessing(true);
    try {
      await operation(Array.from(selectedItems));
      setSelectedItems(new Set());
      showToast.success('批量操作完成');
    } catch (error) {
      showToast.error('批量操作失敗');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    selectedItems,
    setSelectedItems,
    isProcessing,
    handleBatchOperation
  };
}
```

## 實施步驟

### 階段 1：頁面基礎結構（Day 1）
1. 建立所有管理頁面的基礎結構
2. 實作導航和權限檢查
3. 設定頁面佈局和樣式

### 階段 2：用戶管理功能（Day 2）
1. 實作用戶列表和搜尋
2. 新增/編輯用戶表單
3. 角色和權限管理
4. 批量操作功能

### 階段 3：工具管理和資料匯入（Day 3）
1. 工具管理介面
2. 整合資料匯入功能
3. 優化匯入流程和錯誤處理

### 階段 4：統計報表（Day 4）
1. 建立圖表元件庫
2. 實作使用報表頁面
3. 整合資料匯出功能

### 階段 5：測試和優化（Day 5）
1. 完整功能測試
2. 效能優化
3. 錯誤處理完善

## 關鍵實作細節

### 統一的頁面結構
```typescript
// 管理頁面基礎模板
const AdminPageTemplate: React.FC<AdminPageProps> = ({ 
  title, 
  actions, 
  children 
}) => {
  return (
    <Layout>
      <AdminHeader title={title} actions={actions} />
      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {children}
      </ScrollView>
    </Layout>
  );
};
```

### 資料載入模式
```typescript
// 使用 React Query 或類似模式
const useAdminData = (dataType: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadData();
  }, [dataType]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await fetchAdminData(dataType);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, refetch: loadData };
};
```

## 驗證標準

```bash
# 功能驗證清單
- [ ] 所有管理頁面可正常訪問
- [ ] 權限控制正確運作
- [ ] 資料匯入支援 CSV 和 Excel
- [ ] 資料匯出功能完整
- [ ] 圖表顯示正確且響應式
- [ ] 批量操作無錯誤
- [ ] 錯誤處理友善

# 效能指標
- [ ] 頁面載入時間 < 2 秒
- [ ] 大量資料（1000+ 筆）操作流暢
- [ ] 圖表渲染無延遲
```

## 相關資源

### 現有程式碼參考
- 表格實作：`/src/screens/personnel/PersonnelScreen.tsx`
- 表單處理：`/src/components/customers/CustomerForm.tsx`
- 圖表元件：`/src/components/charts/ActivityChart.tsx`
- 資料匯入：`/src/services/dataImport.ts`
- CSV 上傳：`/src/components/data/CSVUploader.tsx`

### 外部文檔
- [Victory Native 文檔](https://formidable.com/open-source/victory/docs/native/)
- [React Hook Form](https://react-hook-form.com/)
- [Expo Document Picker](https://docs.expo.dev/versions/latest/sdk/document-picker/)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## 風險與緩解

1. **大量資料處理**
   - 風險：處理大量用戶/資料時效能問題
   - 緩解：實作分頁、虛擬滾動、資料快取

2. **圖表效能**
   - 風險：複雜圖表在移動裝置上效能不佳
   - 緩解：限制資料點數量、使用簡化版本

3. **檔案上傳限制**
   - 風險：大檔案上傳失敗
   - 緩解：分塊上傳、顯示進度、支援續傳

## 成功標準

1. 所有管理頁面功能完整且無錯誤
2. 資料匯入/匯出支援多種格式
3. 統計圖表美觀且資訊豐富
4. 使用者體驗流暢，操作直觀
5. 符合現有設計系統規範

## 實施信心評分：8.5/10

高信心度基於：
- 大部分基礎架構已完成
- 有清晰的實作模式可參考
- 現有元件可重用
- 技術棧熟悉且穩定

扣分項：
- 需要實作的功能較多
- 圖表效能需要優化
- 大量資料處理需要特別注意