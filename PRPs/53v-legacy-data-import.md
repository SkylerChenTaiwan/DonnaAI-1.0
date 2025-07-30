name: "Legacy Data Import Feature - 舊系統資料導入功能"
description: |

## Purpose
實作一個強大的資料導入功能，能夠從客戶現有的 Notion 系統批量導入業務人員、客戶資料和訪談記錄，並正確建立關聯關係。

## Core Principles
1. **資料完整性**: 確保所有資料正確映射並保持關聯
2. **錯誤恢復**: 提供清晰的錯誤報告和重試機制
3. **批次處理**: 支援大量資料的高效導入
4. **使用者友好**: 提供直覺的介面和進度追蹤
5. **資料驗證**: 在導入前驗證和清理資料

---

## Goal
建立一個完整的資料導入流程，讓客戶能夠：
1. 上傳三種 CSV 檔案（業務名單、客戶名單、訪談記錄）
2. 預覽和映射欄位
3. 驗證資料並處理重複
4. 批次導入並維持正確的關聯關係
5. 查看詳細的導入報告

## Why
- **商業價值**: 降低客戶從舊系統遷移的門檻
- **使用者體驗**: 避免手動重新輸入大量資料
- **資料一致性**: 確保歷史資料正確導入
- **客戶滿意度**: 提供無縫的系統遷移體驗

## What
### 使用者可見行為
1. 新增「舊系統資料導入」功能入口（管理員權限）
2. 支援三種資料類型的導入：
   - 業務人員資料
   - 客戶資料
   - 訪談記錄
3. 提供欄位映射介面
4. 顯示導入進度和結果報告
5. 支援錯誤修正和重新導入

### 技術需求
1. 支援 CSV 檔案解析（UTF-8 編碼）
2. 自動檢測和處理欄位映射
3. 批次導入以提升效能（500筆一批）
4. 資料驗證和清理
5. 關聯關係自動建立

### Success Criteria
- [ ] 成功解析三種 CSV 檔案格式
- [ ] 正確映射業務人員到系統使用者
- [ ] 客戶資料正確關聯到業務人員
- [ ] 訪談記錄正確關聯到客戶和業務人員
- [ ] 提供完整的導入報告
- [ ] 處理重複資料和錯誤情況

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: src/services/csv/importer.ts
  why: 現有的 CSV 導入邏輯，需要擴展支援多檔案和關聯

- file: src/services/csv/validator.ts
  why: 資料驗證邏輯，需要針對新格式調整

- file: src/screens/admin/DataImportScreen.tsx
  why: 現有的資料導入介面，需要擴展功能

- file: src/services/firebase/admin/dataImportService.ts
  why: 資料導入服務層，需要新增多檔案處理邏輯

- file: src/types/firebase.ts
  why: 了解 CustomerDoc、RecordDoc 等資料結構

- file: src/types/entities/user.ts
  why: 了解 User 實體結構和角色定義

- url: https://firebase.google.com/docs/firestore/manage-data/transactions
  why: 批次寫入和交易處理的最佳實踐

- url: https://medium.com/rowyio/import-data-from-csv-to-firebase-firestore-the-fastest-way-de72d76d934
  why: Firestore 批次導入的效能優化技巧
```

### CSV 資料結構範例
```csv
# 業務名單
業務帳號,公司Gmail帳號,你的層級,enabled,Phone,訪談紀錄資料庫,客戶名單資料庫
蔡鈞皓,a0955890429@gmail.com,L0,,0937700891,https://notion.so/...,https://notion.so/...

# 客戶名單
負責業務,客戶名稱,公司名稱,電子郵件地址,聯絡電話,年齡,年薪,職務名稱
1009101,小伍,ABC公司,wu@example.com,0912345678,35,1000000,經理

# 訪談紀錄
標題,訪談結果,訪談日期,下次跟進日期,業務帳號,客戶名稱
2025-07-24陳奐宇,客戶討論產品需求...,07/24/2025,2025年7月31日,1009204,陳奐宇
```

### Current Codebase Structure
```bash
src/
├── services/
│   ├── csv/
│   │   ├── importer.ts      # 現有客戶導入邏輯
│   │   ├── parser.ts        # CSV 解析工具
│   │   └── validator.ts     # 資料驗證
│   ├── firebase/
│   │   ├── admin/
│   │   │   └── dataImportService.ts  # 資料導入服務
│   │   ├── customers.ts     # 客戶 CRUD 操作
│   │   ├── records.ts       # 記錄 CRUD 操作
│   │   └── auth.ts          # 使用者管理
│   └── validation/
│       └── form-schemas.ts  # Zod 驗證模式
├── screens/
│   └── admin/
│       └── DataImportScreen.tsx  # 資料導入介面
└── types/
    ├── firebase.ts          # Firestore 文件類型
    └── entities/
        └── user.ts          # 使用者實體
```

### Desired Codebase Structure
```bash
src/
├── services/
│   ├── csv/
│   │   ├── legacy-import/
│   │   │   ├── index.ts           # 統一匯出
│   │   │   ├── mapper.ts          # 欄位映射邏輯
│   │   │   ├── userImporter.ts    # 業務人員導入
│   │   │   ├── customerImporter.ts # 客戶導入
│   │   │   └── recordImporter.ts  # 訪談記錄導入
│   │   ├── importer.ts            # 保持現有邏輯
│   │   ├── parser.ts              # 保持現有邏輯
│   │   └── validator.ts           # 擴展驗證邏輯
│   └── firebase/
│       └── admin/
│           └── legacyDataImportService.ts  # 新的導入服務
├── screens/
│   └── admin/
│       ├── DataImportScreen.tsx    # 保持現有
│       └── LegacyDataImportScreen.tsx  # 新的導入介面
└── types/
    └── legacy-import.ts            # 舊系統導入相關類型
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Firestore 批次寫入限制為 500 個操作
// 需要分批處理大量資料

// CRITICAL: Firebase Auth 創建使用者需要特殊權限
// 可能需要使用 Admin SDK 或預先創建使用者

// GOTCHA: CSV 中的中文編碼問題
// 確保使用 UTF-8 編碼並正確處理 BOM

// PATTERN: 使用 Map 建立名稱到 ID 的映射
// 避免重複查詢資料庫
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// src/types/legacy-import.ts
export interface LegacyUser {
  業務帳號: string;
  公司Gmail帳號?: string;
  你的層級: 'L0' | 'L1' | 'L2' | 'L3';
  enabled?: string;
  Phone?: string;
  // Notion 連結欄位（保存到 customFields）
  訪談紀錄資料庫?: string;
  客戶名單資料庫?: string;
  // ... 其他 Notion 連結
}

export interface LegacyCustomer {
  負責業務: string;
  客戶名稱: string;
  公司名稱?: string;
  電子郵件地址?: string;
  聯絡電話?: string;
  // 所有其他欄位都進入 customFields
  [key: string]: any;
}

export interface LegacyRecord {
  標題: string;
  訪談結果: string;
  訪談日期: string;
  下次跟進日期?: string;
  業務帳號: string;
  客戶名稱: string;
}

export interface LegacyImportSession {
  id: string;
  organizationId: string;
  status: 'preparing' | 'mapping' | 'importing' | 'completed' | 'failed';
  files: {
    users?: { fileName: string; data: LegacyUser[]; };
    customers?: { fileName: string; data: LegacyCustomer[]; };
    records?: { fileName: string; data: LegacyRecord[]; };
  };
  mappings: {
    userNameToId: Map<string, string>;
    customerNameToId: Map<string, string>;
  };
  results: {
    users: ImportResult;
    customers: ImportResult;
    records: ImportResult;
  };
  createdAt: Date;
  createdBy: string;
}
```

### List of Tasks to Complete

```yaml
Task 1: 建立舊系統導入類型定義
CREATE src/types/legacy-import.ts:
  - 定義 LegacyUser、LegacyCustomer、LegacyRecord 介面
  - 定義 LegacyImportSession 狀態管理
  - 定義欄位映射類型

Task 2: 擴展 CSV 驗證器支援新格式
MODIFY src/services/csv/validator.ts:
  - 新增 validateLegacyUser 函數
  - 新增 validateLegacyCustomer 函數  
  - 新增 validateLegacyRecord 函數
  - 處理中文欄位名稱

Task 3: 建立欄位映射服務
CREATE src/services/csv/legacy-import/mapper.ts:
  - 實作 mapLegacyUserToUser 函數（層級轉角色）
  - 實作 mapLegacyCustomerToCustomer 函數
  - 實作 mapLegacyRecordToRecord 函數
  - 處理日期格式轉換

Task 4: 建立業務人員導入器
CREATE src/services/csv/legacy-import/userImporter.ts:
  - 檢查現有使用者（透過 email 或名稱）
  - 建立名稱到 ID 的映射表
  - 處理層級到角色的轉換（L0->salesperson, L1->manager 等）
  - 保存 Notion 連結到 customFields

Task 5: 建立客戶導入器
CREATE src/services/csv/legacy-import/customerImporter.ts:
  - 使用業務名稱映射表找到正確的 assignedTo
  - 處理所有額外欄位到 customFields
  - 建立客戶名稱到 ID 的映射表
  - 處理重複檢查

Task 6: 建立訪談記錄導入器
CREATE src/services/csv/legacy-import/recordImporter.ts:
  - 使用映射表找到正確的客戶 ID 和業務員 ID
  - 解析日期格式（MM/DD/YYYY 或 YYYY年M月D日）
  - 將下次跟進日期更新到客戶資料
  - 設定記錄類型為 'note'

Task 7: 建立統一的導入服務
CREATE src/services/firebase/admin/legacyDataImportService.ts:
  - 實作 createImportSession 函數
  - 實作 validateAndPrepareLegacyData 函數
  - 實作 executeLegacyImport 函數（協調三個導入器）
  - 實作進度回報機制

Task 8: 建立新的導入介面
CREATE src/screens/admin/LegacyDataImportScreen.tsx:
  - 檔案上傳區域（支援三個檔案）
  - 資料預覽表格
  - 欄位映射配置
  - 導入進度顯示
  - 結果報告顯示

Task 9: 更新導航和權限
MODIFY src/screens/admin/AdminDashboard.tsx:
  - 新增「舊系統資料導入」選項
  - 限制為 admin 權限

Task 10: 建立測試檔案
CREATE src/services/csv/legacy-import/__tests__/:
  - 測試各種日期格式解析
  - 測試層級到角色轉換
  - 測試映射邏輯
  - 測試錯誤處理
```

### Task Pseudocode

```typescript
// Task 3: 欄位映射邏輯
// src/services/csv/legacy-import/mapper.ts
export function mapLevelToRole(level: string): UserRole {
  // PATTERN: 根據客戶的層級系統轉換
  const levelMap: Record<string, UserRole> = {
    'L0': 'salesperson',
    'L1': 'salesperson',  // 或 'manager' 根據需求
    'L2': 'manager',
    'L3': 'admin',
  };
  return levelMap[level] || 'salesperson';
}

export function mapLegacyCustomer(
  legacy: LegacyCustomer,
  userMapping: Map<string, string>
): Partial<CustomerDoc> {
  // CRITICAL: 找到正確的業務員 ID
  const assignedTo = userMapping.get(legacy.負責業務);
  if (!assignedTo) {
    throw new Error(`找不到業務員: ${legacy.負責業務}`);
  }

  // PATTERN: 將所有未知欄位放入 customFields
  const knownFields = ['負責業務', '客戶名稱', '公司名稱', '電子郵件地址', '聯絡電話'];
  const customFields: Record<string, any> = {};
  
  Object.keys(legacy).forEach(key => {
    if (!knownFields.includes(key) && legacy[key]) {
      customFields[key] = legacy[key];
    }
  });

  return {
    name: legacy.客戶名稱,
    company: legacy.公司名稱 || '',
    email: legacy.電子郵件地址,
    phone: legacy.聯絡電話,
    assignedTo,
    customFields,
  };
}

// Task 7: 協調導入流程
// src/services/firebase/admin/legacyDataImportService.ts
export async function executeLegacyImport(
  session: LegacyImportSession,
  onProgress: ProgressCallback
): Promise<LegacyImportResults> {
  // PATTERN: 按順序導入以維持關聯
  const results = {
    users: { success: 0, failed: 0, errors: [] },
    customers: { success: 0, failed: 0, errors: [] },
    records: { success: 0, failed: 0, errors: [] },
  };

  try {
    // Phase 1: 導入或映射使用者
    onProgress({ status: 'importing', message: '正在處理業務人員資料...' });
    const userMapping = await importLegacyUsers(
      session.files.users?.data || [],
      session.organizationId
    );
    session.mappings.userNameToId = userMapping;

    // Phase 2: 導入客戶
    onProgress({ status: 'importing', message: '正在導入客戶資料...' });
    const customerMapping = await importLegacyCustomers(
      session.files.customers?.data || [],
      userMapping,
      session.organizationId
    );
    session.mappings.customerNameToId = customerMapping;

    // Phase 3: 導入訪談記錄
    onProgress({ status: 'importing', message: '正在導入訪談記錄...' });
    await importLegacyRecords(
      session.files.records?.data || [],
      userMapping,
      customerMapping,
      session.organizationId
    );

    // CRITICAL: 更新客戶的下次跟進日期
    await updateCustomerFollowUpDates(session);

  } catch (error) {
    // PATTERN: 保存部分成功的結果
    console.error('導入失敗:', error);
    throw error;
  }

  return results;
}
```

### Integration Points
```yaml
DATABASE:
  - collection: users
    changes: "新增 customFields.notionLinks 儲存原始連結"
  
  - collection: customers  
    changes: "使用現有 customFields 儲存額外資料"
    
  - collection: records
    changes: "確保 customerIds 和 createdBy 正確關聯"

NAVIGATION:
  - file: src/navigation/MainTabNavigator.tsx
  - add: LegacyDataImportScreen to admin routes

PERMISSIONS:
  - requirement: "只有 admin 和 super_admin 可以使用"
  - check: "使用 isOrgAdmin 函數驗證"
```

## Validation Loop

### Level 1: TypeScript 檢查
```bash
# 檢查新檔案的類型
npx tsc --noEmit src/types/legacy-import.ts
npx tsc --noEmit src/services/csv/legacy-import/*.ts

# Expected: 無錯誤
```

### Level 2: 單元測試
```typescript
// src/services/csv/legacy-import/__tests__/mapper.test.ts
describe('Legacy Data Mapper', () => {
  test('應該正確轉換層級到角色', () => {
    expect(mapLevelToRole('L0')).toBe('salesperson');
    expect(mapLevelToRole('L3')).toBe('admin');
  });

  test('應該正確解析中文日期', () => {
    expect(parseLegacyDate('2025年7月31日')).toBeInstanceOf(Date);
    expect(parseLegacyDate('07/31/2025')).toBeInstanceOf(Date);
  });

  test('應該處理缺少的業務員映射', () => {
    const mapping = new Map();
    expect(() => 
      mapLegacyCustomer({ 負責業務: '不存在' }, mapping)
    ).toThrow('找不到業務員');
  });
});
```

### Level 3: 整合測試
```bash
# 測試檔案上傳和解析
npm run test:e2e -- --testNamePattern="Legacy Import"

# 測試批次導入效能
npm run test:performance -- legacy-import

# Expected: 500筆資料在 10 秒內完成
```

## Final Validation Checklist
- [ ] 可以上傳和解析三種 CSV 檔案
- [ ] 正確識別和轉換欄位
- [ ] 業務層級正確轉換為系統角色
- [ ] 客戶正確關聯到業務員
- [ ] 訪談記錄正確關聯到客戶
- [ ] 批次導入效能符合預期
- [ ] 錯誤處理和報告完整
- [ ] 介面直覺且提供足夠回饋

---

## Anti-Patterns to Avoid
- ❌ 不要一次載入所有資料到記憶體
- ❌ 不要忽略資料驗證和清理
- ❌ 不要硬編碼欄位映射
- ❌ 不要忽略重複資料檢查
- ❌ 不要在 UI 執行緒執行大量運算
- ❌ 不要忽略交易失敗的回滾

## 實施優先順序
1. **第一階段**: 基礎架構和資料模型（Tasks 1-3）
2. **第二階段**: 各類型導入器（Tasks 4-6）
3. **第三階段**: 整合服務和介面（Tasks 7-8）
4. **第四階段**: 測試和優化（Tasks 9-10）

## 風險評估
- **資料量風險**: 使用批次處理和進度回報降低風險
- **資料一致性**: 使用交易確保原子性操作
- **效能風險**: 實施分頁和背景處理
- **編碼問題**: 統一使用 UTF-8 並處理 BOM

**預估完成時間**: 3-4 天
**建議測試資料量**: 先用 100 筆測試，再逐步增加到數千筆

---

**信心評分**: 8/10
此 PRP 提供了完整的實施計畫，包含所有必要的上下文、資料結構、錯誤處理和驗證步驟。透過分階段實施和充分的測試，應該能夠一次性成功實現功能。