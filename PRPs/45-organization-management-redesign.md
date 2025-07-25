name: "組織管理系統重新設計 - 簡化訂閱與權限管理"
description: |

## Purpose
重新設計組織管理系統，簡化訂閱方案為試用版和正式版，實作類似 Notion 的按使用人數計費模式，並強化權限管理和用戶協助功能。

## Core Principles
1. **簡化訂閱模式**: 只分試用版和正式版
2. **彈性計費**: 按實際使用人數計費，無人數上限
3. **工具使用追蹤**: 統計各工具的使用人數
4. **權限透明化**: 清楚展示權限分布
5. **主動協助**: 幫助用戶完成資料匯入和設定

---

## Goal
建立一個簡化但功能完整的組織管理系統，讓 Super Admin 能夠：
- 管理組織的訂閱狀態（試用版/正式版）
- 查看和管理每月使用人數統計
- 設定贈送人數（計費時扣除）
- 管理組織內的用戶權限
- 協助用戶完成初始設定（資料匯入、欄位調整等）

## Why
- **商業價值**: 簡化訂閱模式降低理解門檻，按使用計費更公平
- **用戶體驗**: 無需預設人數上限，組織可自由成長
- **營運效率**: Super Admin 可主動協助用戶，提高客戶成功率
- **透明度**: 清楚的權限和使用統計有助於組織管理

## What
用戶可見的功能變更：
1. 訂閱方案只有「試用版」和「正式版」
2. 每月自動統計使用人數（活躍用戶）
3. 可設定贈送人數，計費時自動扣除
4. 詳細的工具使用統計
5. Super Admin 可協助用戶完成各種設定

### Success Criteria
- [ ] 訂閱方案簡化為兩種
- [ ] 實作月度使用人數統計
- [ ] 各工具使用人數統計功能完成
- [ ] 贈送人數功能可正常運作
- [ ] Super Admin 可查看和管理所有組織權限
- [ ] Super Admin 可協助用戶匯入資料和調整設定

## All Needed Context

### Documentation & References
```yaml
# 現有實作參考
- file: /src/types/entities/organization.ts
  why: 現有組織資料結構，需要修改訂閱方案部分
  
- file: /src/services/firebase/admin/organizationService.ts
  why: 組織管理服務，需要更新計費邏輯
  
- file: /src/services/firebase/admin/usageMetricsService.ts
  why: 使用統計服務，可擴展來追蹤工具使用
  
- file: /src/services/firebase/admin/userManagementService.ts
  why: 用戶管理服務，用於權限管理
  
- file: /src/screens/superadmin/OrganizationDetailScreen.tsx
  why: 組織詳情頁面，需要重新設計界面

# 參考資料
- url: https://www.notion.so/pricing
  why: Notion 的計費模式參考
  
- url: https://firebase.google.com/docs/firestore/manage-data/transactions
  why: 統計數據需要使用 transaction 確保準確性
```

### Current Codebase tree
```bash
src/
├── types/
│   └── entities/
│       └── organization.ts  # 組織資料結構定義
├── services/
│   └── firebase/
│       └── admin/
│           ├── organizationService.ts  # 組織管理服務
│           ├── usageMetricsService.ts  # 使用統計服務
│           └── userManagementService.ts  # 用戶管理服務
└── screens/
    └── superadmin/
        ├── OrganizationsScreen.tsx  # 組織列表
        ├── CreateOrganizationScreen.tsx  # 建立組織
        └── OrganizationDetailScreen.tsx  # 組織詳情
```

### Desired Codebase tree with files to be added
```bash
src/
├── types/
│   └── entities/
│       ├── organization.ts  # [修改] 簡化訂閱方案
│       └── billing.ts  # [新增] 計費相關型別定義
├── services/
│   └── firebase/
│       └── admin/
│           ├── organizationService.ts  # [修改] 更新組織管理邏輯
│           ├── billingService.ts  # [新增] 計費服務
│           ├── toolUsageService.ts  # [新增] 工具使用統計服務
│           └── userAssistService.ts  # [新增] 用戶協助服務
└── screens/
    └── superadmin/
        ├── OrganizationDetailScreen.tsx  # [修改] 重新設計界面
        ├── BillingSection.tsx  # [新增] 計費管理區塊
        ├── PermissionsSection.tsx  # [新增] 權限管理區塊
        └── UserAssistSection.tsx  # [新增] 用戶協助區塊
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Firestore 有 500 個文檔的批次寫入限制
// 統計大量用戶時需要分批處理

// CRITICAL: React Native 的 Switch 組件在 iOS 和 Android 表現不同
// 使用 DesignSystem 統一樣式

// GOTCHA: Firebase serverTimestamp() 在客戶端會先返回 null
// 需要處理這個邊界情況

// PATTERN: 使用 transaction 確保統計數據的準確性
// 避免並發更新造成的數據不一致
```

## Implementation Blueprint

### Data models and structure

#### 1. 更新組織實體定義
```typescript
// src/types/entities/organization.ts
export interface Organization extends BaseOrganization {
  // 簡化訂閱方案
  subscriptionPlan: 'trial' | 'pro';  // 只有試用版和正式版
  trialEndDate?: Date | Timestamp;  // 試用結束日期
  
  // 計費相關
  billingCycle: 'monthly' | 'yearly';  // 計費週期
  giftedSeats: number;  // 贈送人數
  
  // 移除 maxUsers，改為統計實際使用
  // maxUsers?: number;  // 刪除
  
  // 使用統計（每月更新）
  monthlyUsage?: {
    period: string;  // YYYY-MM
    activeUsers: number;  // 活躍用戶數
    toolUsage: Record<string, number>;  // 各工具使用人數
    calculatedAt: Date | Timestamp;
  };
}
```

#### 2. 新增計費相關型別
```typescript
// src/types/entities/billing.ts
export interface BillingRecord {
  id: string;
  organizationId: string;
  period: string;  // YYYY-MM
  
  // 使用統計
  activeUsers: number;
  giftedSeats: number;
  billableUsers: number;  // activeUsers - giftedSeats
  
  // 工具使用統計
  toolUsage: {
    toolId: string;
    toolName: string;
    activeUsers: number;
  }[];
  
  // 計費資訊
  unitPrice: number;  // 每用戶單價
  totalAmount: number;  // 總金額
  
  // 時間戳記
  createdAt: Date | Timestamp;
  paidAt?: Date | Timestamp;
}
```

### List of tasks to be completed

```yaml
Task 1: 更新組織資料結構
MODIFY src/types/entities/organization.ts:
  - REMOVE: 'basic' | 'professional' | 'enterprise' from subscriptionPlan
  - ADD: 'trial' | 'pro' only
  - ADD: trialEndDate, billingCycle, giftedSeats fields
  - REMOVE: maxUsers field
  - ADD: monthlyUsage object

Task 2: 建立計費相關型別定義
CREATE src/types/entities/billing.ts:
  - DEFINE: BillingRecord interface
  - DEFINE: ToolUsageStats interface
  - DEFINE: UserActivitySummary interface

Task 3: 建立計費服務
CREATE src/services/firebase/admin/billingService.ts:
  - IMPLEMENT: calculateMonthlyUsage() - 計算月度使用人數
  - IMPLEMENT: applyGiftedSeats() - 套用贈送人數
  - IMPLEMENT: generateBillingRecord() - 生成計費記錄
  - IMPLEMENT: getUsageHistory() - 獲取歷史使用記錄

Task 4: 建立工具使用統計服務
CREATE src/services/firebase/admin/toolUsageService.ts:
  - IMPLEMENT: trackToolUsage() - 記錄工具使用
  - IMPLEMENT: getToolUsageStats() - 獲取工具統計
  - IMPLEMENT: getActiveToolUsers() - 獲取工具活躍用戶
  
Task 5: 建立用戶協助服務
CREATE src/services/firebase/admin/userAssistService.ts:
  - IMPLEMENT: importUserData() - 匯入用戶資料
  - IMPLEMENT: setupCustomFields() - 設定自訂欄位
  - IMPLEMENT: migrateFromOldCRM() - 從舊 CRM 遷移資料

Task 6: 更新組織管理服務
MODIFY src/services/firebase/admin/organizationService.ts:
  - UPDATE: createOrganization() - 使用新的訂閱方案
  - REMOVE: getAIQuotaByPlan() - 移除舊的配額計算
  - ADD: startTrial() - 開始試用期
  - ADD: upgradeToProPlan() - 升級到正式版

Task 7: 重新設計組織詳情頁面
MODIFY src/screens/superadmin/OrganizationDetailScreen.tsx:
  - REMOVE: 多個訂閱方案的選擇
  - ADD: 試用版/正式版切換
  - ADD: 月度使用統計顯示
  - ADD: 贈送人數設定
  - INTEGRATE: 新的區塊組件

Task 8: 建立計費管理區塊
CREATE src/screens/superadmin/BillingSection.tsx:
  - DISPLAY: 當前計費週期
  - SHOW: 使用人數統計（總數、贈送、計費）
  - CHART: 歷史使用趨勢
  - ACTION: 調整贈送人數

Task 9: 建立權限管理區塊
CREATE src/screens/superadmin/PermissionsSection.tsx:
  - LIST: 組織內所有用戶
  - SHOW: 每個用戶的權限角色
  - ACTION: 批量調整權限
  - FILTER: 按角色/狀態篩選

Task 10: 建立用戶協助區塊
CREATE src/screens/superadmin/UserAssistSection.tsx:
  - ACTION: 匯入 CSV/Excel 資料
  - ACTION: 設定自訂欄位
  - ACTION: 批量建立用戶
  - LOG: 顯示協助操作歷史

Task 11: 更新建立組織頁面
MODIFY src/screens/superadmin/CreateOrganizationScreen.tsx:
  - SIMPLIFY: 只有試用版選項
  - ADD: 試用期長度設定（預設 30 天）
  - ADD: 初始贈送人數設定
  - REMOVE: 座位數限制設定

Task 12: 更新 Firestore 規則
MODIFY firestore.rules:
  - ADD: billing_records 集合規則
  - ADD: tool_usage 集合規則
  - UPDATE: organizations 集合規則

Task 13: 建立定期統計 Cloud Function（偽代碼）
CREATE functions/calculateMonthlyUsage.ts:
  - SCHEDULE: 每月 1 日執行
  - CALCULATE: 各組織的活躍用戶數
  - GENERATE: 計費記錄
  - NOTIFY: 發送使用報告
```

### Per task pseudocode

```typescript
// Task 3: 計費服務核心邏輯
async function calculateMonthlyUsage(organizationId: string): Promise<MonthlyUsage> {
  // PATTERN: 使用 transaction 確保數據一致性
  return await runTransaction(async (transaction) => {
    // 獲取上個月的日期範圍
    const lastMonth = getLastMonthDateRange();
    
    // 統計活躍用戶（上個月有登入）
    const activeUsersQuery = query(
      collection(db, 'users'),
      where('organizationId', '==', organizationId),
      where('lastActiveAt', '>=', lastMonth.start),
      where('lastActiveAt', '<=', lastMonth.end)
    );
    const activeUsers = await transaction.get(activeUsersQuery);
    
    // 統計各工具使用人數
    const toolUsageMap = new Map<string, Set<string>>();
    const usageQuery = query(
      collection(db, 'tool_usage'),
      where('organizationId', '==', organizationId),
      where('timestamp', '>=', lastMonth.start),
      where('timestamp', '<=', lastMonth.end)
    );
    
    // GOTCHA: Firestore 查詢結果可能很大，需要分頁處理
    await processInBatches(usageQuery, (batch) => {
      batch.forEach(doc => {
        const { toolId, userId } = doc.data();
        if (!toolUsageMap.has(toolId)) {
          toolUsageMap.set(toolId, new Set());
        }
        toolUsageMap.get(toolId)!.add(userId);
      });
    });
    
    // 計算計費用戶數
    const organization = await transaction.get(doc(db, 'organizations', organizationId));
    const giftedSeats = organization.data()?.giftedSeats || 0;
    const billableUsers = Math.max(0, activeUsers.size - giftedSeats);
    
    return {
      period: lastMonth.period,
      activeUsers: activeUsers.size,
      billableUsers,
      toolUsage: Object.fromEntries(
        Array.from(toolUsageMap.entries()).map(([toolId, users]) => [toolId, users.size])
      ),
      calculatedAt: serverTimestamp()
    };
  });
}

// Task 5: 用戶協助服務 - 資料匯入
async function importUserData(
  organizationId: string,
  csvData: string,
  mappings: FieldMapping[]
): Promise<ImportResult> {
  // PATTERN: 使用 Papa Parse 處理 CSV（參考 existing patterns）
  const parsed = Papa.parse(csvData, { header: true });
  
  // VALIDATION: 檢查必要欄位
  const requiredFields = ['name', 'email', 'phone'];
  const missingFields = requiredFields.filter(
    field => !mappings.some(m => m.targetField === field)
  );
  
  if (missingFields.length > 0) {
    throw new ValidationError(`缺少必要欄位: ${missingFields.join(', ')}`);
  }
  
  // GOTCHA: Firestore batch 限制 500 筆
  const batches = chunk(parsed.data, 500);
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];
  
  for (const batchData of batches) {
    const batch = writeBatch(db);
    
    for (const row of batchData) {
      try {
        // 轉換資料格式
        const customerData = mapRowToCustomer(row, mappings);
        
        // PATTERN: 使用統一的驗證器
        validateCustomerData(customerData);
        
        // 建立客戶文檔
        const customerRef = doc(collection(db, 'customers'));
        batch.set(customerRef, {
          ...customerData,
          organizationId,
          importedAt: serverTimestamp(),
          createdBy: auth.currentUser!.uid
        });
        
        imported++;
      } catch (error) {
        failed++;
        errors.push(`第 ${row.__rowNum__} 行: ${error.message}`);
      }
    }
    
    await batch.commit();
  }
  
  return { imported, failed, errors };
}

// Task 8: 計費區塊 - 使用趨勢圖表
function BillingSection({ organizationId }: Props) {
  // PATTERN: 使用 Victory Native 顯示圖表（參考 existing charts）
  const [usageHistory, setUsageHistory] = useState<BillingRecord[]>([]);
  const [giftedSeats, setGiftedSeats] = useState(0);
  
  // 載入歷史資料
  useEffect(() => {
    loadUsageHistory();
  }, [organizationId]);
  
  const handleUpdateGiftedSeats = async () => {
    // VALIDATION: 確保贈送人數合理
    if (giftedSeats < 0 || giftedSeats > 1000) {
      toast.error('贈送人數必須在 0-1000 之間');
      return;
    }
    
    // PATTERN: 樂觀更新 UI
    const previousValue = organization.giftedSeats;
    setOrganization({ ...organization, giftedSeats });
    
    try {
      await updateOrganization(organizationId, { giftedSeats });
      toast.success('贈送人數已更新');
    } catch (error) {
      // 回滾
      setOrganization({ ...organization, giftedSeats: previousValue });
      toast.error('更新失敗');
    }
  };
  
  return (
    <View style={styles.section}>
      {/* 當前計費狀態 */}
      <BillingStatusCard
        activeUsers={currentUsage.activeUsers}
        giftedSeats={giftedSeats}
        billableUsers={currentUsage.billableUsers}
        unitPrice={PRICE_PER_USER}
      />
      
      {/* 使用趨勢圖表 */}
      <UsageTrendChart data={usageHistory} />
      
      {/* 贈送人數設定 */}
      <GiftedSeatsControl
        value={giftedSeats}
        onChange={setGiftedSeats}
        onSave={handleUpdateGiftedSeats}
      />
    </View>
  );
}
```

### Integration Points
```yaml
DATABASE:
  - collection: organizations
    changes: |
      - subscriptionPlan 欄位只允許 'trial' | 'pro'
      - 新增 trialEndDate, billingCycle, giftedSeats
      - 移除 maxUsers
      
  - collection: billing_records (新增)
    fields: |
      - organizationId (indexed)
      - period (indexed)
      - activeUsers, billableUsers, totalAmount
      
  - collection: tool_usage (新增)
    fields: |
      - organizationId, userId, toolId (compound index)
      - timestamp (indexed)
      
FIRESTORE_RULES:
  - add to: firestore.rules
    rules: |
      match /billing_records/{recordId} {
        allow read: if isSuperAdmin() || 
          (isOrgAdmin(resource.data.organizationId));
        allow write: if false; // 只由 Cloud Functions 寫入
      }
      
      match /tool_usage/{usageId} {
        allow read: if isSuperAdmin();
        allow write: if request.auth != null;
      }

NAVIGATION:
  - update: AppNavigator.tsx
    change: OrganizationDetailScreen 不需要修改路由
    
CONFIG:
  - add to: src/config/billing.ts
    constants: |
      export const PRICE_PER_USER = 200; // NTD
      export const TRIAL_DAYS = 30;
      export const BILLING_CYCLES = ['monthly', 'yearly'];
```

## Validation Loop

### Level 1: TypeScript & Linting
```bash
# 檢查新的型別定義
npx tsc --noEmit src/types/entities/organization.ts
npx tsc --noEmit src/types/entities/billing.ts

# 檢查所有新建檔案
npx eslint src/services/firebase/admin/billingService.ts --fix
npx eslint src/services/firebase/admin/toolUsageService.ts --fix
npx eslint src/screens/superadmin/BillingSection.tsx --fix

# Expected: 無錯誤
```

### Level 2: 單元測試
```typescript
// 測試計費邏輯
describe('BillingService', () => {
  test('應正確計算計費用戶數', async () => {
    const usage = await calculateMonthlyUsage('org123');
    expect(usage.billableUsers).toBe(
      Math.max(0, usage.activeUsers - mockOrg.giftedSeats)
    );
  });
  
  test('贈送人數不應產生負數計費', async () => {
    mockOrg.giftedSeats = 100;
    const usage = await calculateMonthlyUsage('org123');
    expect(usage.billableUsers).toBeGreaterThanOrEqual(0);
  });
});

// 測試資料匯入
describe('UserAssistService', () => {
  test('應正確匯入 CSV 資料', async () => {
    const csvData = 'name,email,phone\n張三,zhang@example.com,0912345678';
    const result = await importUserData('org123', csvData, mappings);
    expect(result.imported).toBe(1);
    expect(result.failed).toBe(0);
  });
  
  test('應處理無效資料', async () => {
    const csvData = 'name\n張三'; // 缺少必要欄位
    await expect(importUserData('org123', csvData, mappings))
      .rejects.toThrow('缺少必要欄位');
  });
});
```

### Level 3: 整合測試
```bash
# 啟動開發環境
npm run start

# 測試建立組織（只有試用版）
# 1. 以 Super Admin 登入
# 2. 建立新組織
# 3. 確認訂閱方案為 'trial'
# 4. 確認有 trialEndDate

# 測試計費功能
# 1. 進入組織詳情
# 2. 查看使用統計
# 3. 調整贈送人數
# 4. 確認計費用戶數正確更新

# 測試用戶協助
# 1. 使用匯入功能
# 2. 上傳測試 CSV
# 3. 確認資料正確匯入
```

## Final Validation Checklist
- [ ] TypeScript 編譯無錯誤
- [ ] ESLint 檢查通過
- [ ] 訂閱方案簡化為 trial/pro
- [ ] 月度使用統計正確計算
- [ ] 贈送人數功能正常運作
- [ ] 工具使用統計正確記錄
- [ ] 資料匯入功能可用
- [ ] Firestore 規則已更新
- [ ] UI 顯示正確的計費資訊
- [ ] 無人數上限限制

---

## Anti-Patterns to Avoid
- ❌ 不要在前端直接計算計費金額（應由後端處理）
- ❌ 不要即時統計大量用戶（使用預先計算的統計）
- ❌ 不要忽略 Firestore 批次限制（500 文檔）
- ❌ 不要硬編碼價格（使用設定檔）
- ❌ 不要允許普通用戶修改計費資訊
- ❌ 不要在 UI 顯示敏感的計費細節

## 信心評分：8/10

評分理由：
- ✅ 完整的實作規劃和詳細步驟
- ✅ 考慮了現有程式碼結構
- ✅ 包含錯誤處理和邊界情況
- ✅ 有清楚的驗證步驟
- ⚠️ Cloud Functions 部分需要另外實作
- ⚠️ 可能需要根據實際 UI 需求調整