name: "Legacy Data Import Feature V2 - 舊系統資料導入功能（含業務代碼對照）"
description: |

## Purpose
實作一個強大的資料導入功能，能夠從客戶現有的 Notion 系統批量導入業務人員、客戶資料和訪談記錄，並正確建立關聯關係。**V2 版本新增業務代碼到姓名的對照功能**。

## Core Principles
1. **資料完整性**: 確保所有資料正確映射並保持關聯
2. **錯誤恢復**: 提供清晰的錯誤報告和重試機制
3. **批次處理**: 支援大量資料的高效導入
4. **使用者友好**: 提供直覺的介面和進度追蹤
5. **資料驗證**: 在導入前驗證和清理資料
6. **智慧對照**: 自動處理業務代碼到姓名的轉換

---

## Goal
建立一個完整的資料導入流程，讓客戶能夠：
1. 上傳四種 CSV 檔案（業務代碼對照表、業務名單、客戶名單、訪談記錄）
2. 自動將業務代碼轉換為姓名
3. 預覽和映射欄位
4. 驗證資料並處理重複
5. 批次導入並維持正確的關聯關係
6. 查看詳細的導入報告

## Why
- **商業價值**: 降低客戶從舊系統遷移的門檻
- **使用者體驗**: 避免手動重新輸入大量資料
- **資料一致性**: 確保歷史資料正確導入
- **客戶滿意度**: 提供無縫的系統遷移體驗
- **彈性處理**: 支援不同格式的業務識別方式

## What
### 使用者可見行為
1. 新增「舊系統資料導入」功能入口（管理員權限）
2. 支援四種資料類型的導入：
   - 業務代碼對照表（新增）
   - 業務人員資料
   - 客戶資料
   - 訪談記錄
3. 自動處理業務代碼到姓名的轉換
4. 提供欄位映射介面
5. 顯示導入進度和結果報告
6. 支援錯誤修正和重新導入

### 技術需求
1. 支援 CSV 檔案解析（UTF-8 編碼）
2. 建立業務代碼到姓名的映射表
3. 自動檢測和處理欄位映射
4. 批次導入以提升效能（500筆一批）
5. 資料驗證和清理
6. 關聯關係自動建立
7. 處理代碼和姓名的模糊匹配

### Success Criteria
- [ ] 成功解析四種 CSV 檔案格式
- [ ] 正確建立業務代碼到姓名的映射
- [ ] 正確映射業務人員到系統使用者
- [ ] 客戶資料正確關聯到業務人員（支援代碼和姓名）
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
# 業務代碼對照表（新增）
業務名稱,職級,顧問代碼,主管清單
吳依璇,L3,1009101,"1009017,1009098"
江建璋,L6,1009001,1009035

# 業務名單
業務帳號,公司Gmail帳號,你的層級,enabled,Phone,訪談紀錄資料庫,客戶名單資料庫
蔡鈞皓,a0955890429@gmail.com,L0,,0937700891,https://notion.so/...,https://notion.so/...

# 客戶名單（現在使用業務代碼）
負責業務,客戶名稱,公司名稱,電子郵件地址,聯絡電話,年齡,年薪,職務名稱
1009101,小伍,ABC公司,wu@example.com,0912345678,35,1000000,經理

# 訪談紀錄（現在使用業務代碼）
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
│   │   │   ├── index.ts               # 統一匯出
│   │   │   ├── mapper.ts              # 欄位映射邏輯
│   │   │   ├── codeMapper.ts          # 業務代碼對照邏輯（新增）
│   │   │   ├── userImporter.ts        # 業務人員導入
│   │   │   ├── customerImporter.ts    # 客戶導入
│   │   │   └── recordImporter.ts      # 訪談記錄導入
│   │   ├── importer.ts                # 保持現有邏輯
│   │   ├── parser.ts                  # 保持現有邏輯
│   │   └── validator.ts               # 擴展驗證邏輯
│   └── firebase/
│       └── admin/
│           └── legacyDataImportService.ts  # 新的導入服務
├── screens/
│   └── admin/
│       ├── DataImportScreen.tsx        # 保持現有
│       └── LegacyDataImportScreen.tsx  # 新的導入介面
└── types/
    └── legacy-import.ts                # 舊系統導入相關類型
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

// NEW GOTCHA: 業務代碼可能在不同檔案中不一致
// 需要處理前導零和字串/數字轉換問題

// NEW PATTERN: 使用雙向映射表
// 同時支援代碼到姓名和姓名到代碼的查詢
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// src/types/legacy-import.ts

// 新增：業務代碼對照資料
export interface BusinessCodeMapping {
  業務名稱: string;
  職級: string;
  顧問代碼: string;
  主管清單: string; // 逗號分隔的代碼清單
}

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
  負責業務: string; // 現在可能是代碼或姓名
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
  業務帳號: string; // 可能是代碼或姓名
  客戶名稱: string;
}

export interface LegacyImportSession {
  id: string;
  organizationId: string;
  status: 'preparing' | 'mapping' | 'importing' | 'completed' | 'failed';
  files: {
    codeMapping?: { fileName: string; data: BusinessCodeMapping[]; }; // 新增
    users?: { fileName: string; data: LegacyUser[]; };
    customers?: { fileName: string; data: LegacyCustomer[]; };
    records?: { fileName: string; data: LegacyRecord[]; };
  };
  mappings: {
    codeToName: Map<string, string>;      // 代碼到姓名映射（新增）
    nameToCode: Map<string, string>;      // 姓名到代碼映射（新增）
    userNameToId: Map<string, string>;    // 姓名到系統用戶ID映射
    customerNameToId: Map<string, string>;
  };
  results: {
    codeMapping: ImportResult; // 新增
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
  - 定義 BusinessCodeMapping 介面（新增）
  - 定義 LegacyUser、LegacyCustomer、LegacyRecord 介面
  - 定義 LegacyImportSession 狀態管理
  - 定義欄位映射類型

Task 2: 擴展 CSV 驗證器支援新格式
MODIFY src/services/csv/validator.ts:
  - 新增 validateBusinessCodeMapping 函數（新增）
  - 新增 validateLegacyUser 函數
  - 新增 validateLegacyCustomer 函數  
  - 新增 validateLegacyRecord 函數
  - 處理中文欄位名稱

Task 3: 建立業務代碼對照服務（新增）
CREATE src/services/csv/legacy-import/codeMapper.ts:
  - 實作 parseCodeMappingFile 函數
  - 實作 buildCodeMappings 函數（建立雙向映射）
  - 實作 resolveBusinessIdentifier 函數（智慧解析代碼或姓名）
  - 處理代碼格式標準化（處理前導零等）

Task 4: 建立欄位映射服務
CREATE src/services/csv/legacy-import/mapper.ts:
  - 實作 mapLegacyUserToUser 函數（層級轉角色）
  - 實作 mapLegacyCustomerToCustomer 函數
  - 實作 mapLegacyRecordToRecord 函數
  - 處理日期格式轉換
  - 整合業務代碼解析邏輯（新增）

Task 5: 建立業務人員導入器
CREATE src/services/csv/legacy-import/userImporter.ts:
  - 檢查現有使用者（透過 email 或名稱）
  - 建立名稱到 ID 的映射表
  - 處理層級到角色的轉換（L0->salesperson, L1->manager 等）
  - 保存 Notion 連結到 customFields
  - 保存原始業務代碼到 customFields（新增）

Task 6: 建立客戶導入器
CREATE src/services/csv/legacy-import/customerImporter.ts:
  - 使用業務代碼對照表解析負責業務（新增）
  - 使用業務名稱映射表找到正確的 assignedTo
  - 處理所有額外欄位到 customFields
  - 建立客戶名稱到 ID 的映射表
  - 處理重複檢查

Task 7: 建立訪談記錄導入器
CREATE src/services/csv/legacy-import/recordImporter.ts:
  - 使用業務代碼對照表解析業務帳號（新增）
  - 使用映射表找到正確的客戶 ID 和業務員 ID
  - 解析日期格式（MM/DD/YYYY 或 YYYY年M月D日）
  - 將下次跟進日期更新到客戶資料
  - 設定記錄類型為 'note'

Task 8: 建立統一的導入服務
CREATE src/services/firebase/admin/legacyDataImportService.ts:
  - 實作 createImportSession 函數
  - 實作 validateAndPrepareLegacyData 函數
  - 實作 executeLegacyImport 函數（協調四個導入器）
  - 先處理業務代碼對照表（新增）
  - 實作進度回報機制

Task 9: 建立新的導入介面
CREATE src/screens/admin/LegacyDataImportScreen.tsx:
  - 檔案上傳區域（支援四個檔案）
  - 顯示業務代碼對照預覽（新增）
  - 資料預覽表格
  - 欄位映射配置
  - 導入進度顯示
  - 結果報告顯示

Task 10: 更新導航和權限
MODIFY src/screens/admin/AdminDashboard.tsx:
  - 新增「舊系統資料導入」選項
  - 限制為 admin 權限

Task 11: 建立測試檔案
CREATE src/services/csv/legacy-import/__tests__/:
  - 測試業務代碼對照解析（新增）
  - 測試代碼到姓名轉換（新增）
  - 測試各種日期格式解析
  - 測試層級到角色轉換
  - 測試映射邏輯
  - 測試錯誤處理
```

### Task Pseudocode

```typescript
// Task 3: 業務代碼對照服務（新增）
// src/services/csv/legacy-import/codeMapper.ts
export function buildCodeMappings(
  mappingData: BusinessCodeMapping[]
): {
  codeToName: Map<string, string>;
  nameToCode: Map<string, string>;
  codeToLevel: Map<string, string>;
} {
  const codeToName = new Map<string, string>();
  const nameToCode = new Map<string, string>();
  const codeToLevel = new Map<string, string>();

  mappingData.forEach(row => {
    // CRITICAL: 標準化代碼格式（處理可能的前導零問題）
    const normalizedCode = normalizeBusinessCode(row.顧問代碼);
    
    codeToName.set(normalizedCode, row.業務名稱);
    nameToCode.set(row.業務名稱, normalizedCode);
    codeToLevel.set(normalizedCode, row.職級);
  });

  return { codeToName, nameToCode, codeToLevel };
}

export function resolveBusinessIdentifier(
  identifier: string,
  codeToName: Map<string, string>,
  nameToCode: Map<string, string>
): { name: string; code: string } | null {
  // PATTERN: 智慧判斷是代碼還是姓名
  const normalizedId = identifier.trim();
  
  // 檢查是否為代碼格式（數字）
  if (/^\d+$/.test(normalizedId)) {
    const normalized = normalizeBusinessCode(normalizedId);
    const name = codeToName.get(normalized);
    if (name) {
      return { name, code: normalized };
    }
  }
  
  // 檢查是否為姓名
  const code = nameToCode.get(normalizedId);
  if (code) {
    return { name: normalizedId, code };
  }
  
  // GOTCHA: 可能需要模糊匹配
  // 處理可能的空格、全形半形等問題
  
  return null;
}

// Task 4: 更新欄位映射邏輯
// src/services/csv/legacy-import/mapper.ts
export function mapLegacyCustomer(
  legacy: LegacyCustomer,
  codeToName: Map<string, string>,
  userMapping: Map<string, string>
): Partial<CustomerDoc> {
  // CRITICAL: 先解析業務識別碼
  const businessInfo = resolveBusinessIdentifier(
    legacy.負責業務,
    codeToName,
    new Map() // nameToCode 在這裡不需要
  );
  
  if (!businessInfo) {
    throw new Error(`無法識別業務人員: ${legacy.負責業務}`);
  }
  
  // 使用姓名找到系統用戶ID
  const assignedTo = userMapping.get(businessInfo.name);
  if (!assignedTo) {
    throw new Error(`找不到業務員: ${businessInfo.name} (代碼: ${businessInfo.code})`);
  }

  // PATTERN: 將所有未知欄位放入 customFields
  const knownFields = ['負責業務', '客戶名稱', '公司名稱', '電子郵件地址', '聯絡電話'];
  const customFields: Record<string, any> = {
    originalBusinessCode: businessInfo.code, // 保存原始代碼
  };
  
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

// Task 8: 更新協調導入流程
// src/services/firebase/admin/legacyDataImportService.ts
export async function executeLegacyImport(
  session: LegacyImportSession,
  onProgress: ProgressCallback
): Promise<LegacyImportResults> {
  // PATTERN: 按順序導入以維持關聯
  const results = {
    codeMapping: { success: 0, failed: 0, errors: [] },
    users: { success: 0, failed: 0, errors: [] },
    customers: { success: 0, failed: 0, errors: [] },
    records: { success: 0, failed: 0, errors: [] },
  };

  try {
    // NEW Phase 0: 處理業務代碼對照表
    onProgress({ status: 'importing', message: '正在處理業務代碼對照表...' });
    let codeToName = new Map<string, string>();
    let nameToCode = new Map<string, string>();
    
    if (session.files.codeMapping?.data) {
      const mappings = buildCodeMappings(session.files.codeMapping.data);
      codeToName = mappings.codeToName;
      nameToCode = mappings.nameToCode;
      session.mappings.codeToName = codeToName;
      session.mappings.nameToCode = nameToCode;
    }

    // Phase 1: 導入或映射使用者
    onProgress({ status: 'importing', message: '正在處理業務人員資料...' });
    const userMapping = await importLegacyUsers(
      session.files.users?.data || [],
      session.organizationId,
      codeToName // 傳入代碼對照表
    );
    session.mappings.userNameToId = userMapping;

    // Phase 2: 導入客戶
    onProgress({ status: 'importing', message: '正在導入客戶資料...' });
    const customerMapping = await importLegacyCustomers(
      session.files.customers?.data || [],
      codeToName, // 新增參數
      userMapping,
      session.organizationId
    );
    session.mappings.customerNameToId = customerMapping;

    // Phase 3: 導入訪談記錄
    onProgress({ status: 'importing', message: '正在導入訪談記錄...' });
    await importLegacyRecords(
      session.files.records?.data || [],
      codeToName, // 新增參數
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

// 輔助函數：標準化業務代碼
function normalizeBusinessCode(code: string): string {
  // 移除空格，統一為字串格式
  // 不補零，保持原始格式但確保一致性
  return code.toString().trim();
}
```

### Integration Points
```yaml
DATABASE:
  - collection: users
    changes: |
      新增 customFields.originalBusinessCode 儲存原始業務代碼
      新增 customFields.notionLinks 儲存原始連結
  
  - collection: customers  
    changes: |
      使用現有 customFields 儲存額外資料
      新增 customFields.originalBusinessCode 記錄原始負責業務代碼
    
  - collection: records
    changes: "確保 customerIds 和 createdBy 正確關聯"

NAVIGATION:
  - file: src/navigation/MainTabNavigator.tsx
  - add: LegacyDataImportScreen to admin routes

PERMISSIONS:
  - requirement: "只有 admin 和 super_admin 可以使用"
  - check: "使用 isOrgAdmin 函數驗證"

UI_FLOW:
  - step1: "上傳業務代碼對照表（可選但建議）"
  - step2: "上傳其他三個檔案"
  - step3: "預覽對照結果"
  - step4: "確認並執行導入"
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
// src/services/csv/legacy-import/__tests__/codeMapper.test.ts
describe('Business Code Mapper', () => {
  test('應該正確建立雙向映射', () => {
    const data = [
      { 業務名稱: '吳依璇', 職級: 'L3', 顧問代碼: '1009101', 主管清單: '' }
    ];
    const { codeToName, nameToCode } = buildCodeMappings(data);
    
    expect(codeToName.get('1009101')).toBe('吳依璇');
    expect(nameToCode.get('吳依璇')).toBe('1009101');
  });

  test('應該智慧解析業務識別碼', () => {
    const codeToName = new Map([['1009101', '吳依璇']]);
    const nameToCode = new Map([['吳依璇', '1009101']]);
    
    // 測試代碼輸入
    expect(resolveBusinessIdentifier('1009101', codeToName, nameToCode))
      .toEqual({ name: '吳依璇', code: '1009101' });
    
    // 測試姓名輸入
    expect(resolveBusinessIdentifier('吳依璇', codeToName, nameToCode))
      .toEqual({ name: '吳依璇', code: '1009101' });
  });

  test('應該處理找不到的業務識別碼', () => {
    const codeToName = new Map();
    const nameToCode = new Map();
    
    expect(resolveBusinessIdentifier('9999999', codeToName, nameToCode))
      .toBeNull();
  });
});

// src/services/csv/legacy-import/__tests__/mapper.test.ts
describe('Legacy Data Mapper with Code Mapping', () => {
  test('應該正確轉換使用代碼的客戶資料', () => {
    const codeToName = new Map([['1009101', '吳依璇']]);
    const userMapping = new Map([['吳依璇', 'user-id-123']]);
    
    const customer = { 
      負責業務: '1009101',
      客戶名稱: '測試客戶',
      公司名稱: 'ABC公司'
    };
    
    const result = mapLegacyCustomer(customer, codeToName, userMapping);
    
    expect(result.assignedTo).toBe('user-id-123');
    expect(result.customFields?.originalBusinessCode).toBe('1009101');
  });
});
```

### Level 3: 整合測試
```bash
# 測試檔案上傳和解析
npm run test:e2e -- --testNamePattern="Legacy Import with Code Mapping"

# 測試批次導入效能
npm run test:performance -- legacy-import-v2

# Expected: 500筆資料在 10 秒內完成
```

## Final Validation Checklist
- [ ] 可以上傳和解析四種 CSV 檔案
- [ ] 正確建立業務代碼到姓名的雙向映射
- [ ] 正確識別和轉換欄位
- [ ] 支援業務代碼和姓名兩種輸入方式
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
- ❌ 不要假設業務代碼格式一致

## 實施優先順序
1. **第一階段**: 基礎架構和資料模型（Tasks 1-3）
2. **第二階段**: 各類型導入器（Tasks 4-7）
3. **第三階段**: 整合服務和介面（Tasks 8-9）
4. **第四階段**: 測試和優化（Tasks 10-11）

## 風險評估
- **資料量風險**: 使用批次處理和進度回報降低風險
- **資料一致性**: 使用交易確保原子性操作
- **效能風險**: 實施分頁和背景處理
- **編碼問題**: 統一使用 UTF-8 並處理 BOM
- **對照準確性**: 提供預覽功能讓用戶確認

## V2 版本新增功能總結
1. **業務代碼對照表處理**
   - 支援第四個 CSV 檔案上傳
   - 建立代碼到姓名的雙向映射
   - 智慧識別代碼或姓名

2. **彈性的業務識別**
   - 客戶資料可使用代碼或姓名
   - 訪談記錄可使用代碼或姓名
   - 自動轉換並保存原始資訊

3. **更好的錯誤處理**
   - 顯示無法對照的業務代碼
   - 提供手動對照介面
   - 詳細的對照報告

**預估完成時間**: 4-5 天（比 V1 多 1 天處理代碼對照）
**建議測試資料量**: 先用 100 筆測試，再逐步增加到數千筆

---

**信心評分**: 9/10
此 V2 版本 PRP 完整解決了業務代碼對照問題，提供了靈活的識別機制，並保持了向後相容性。透過智慧解析和雙向映射，能夠處理各種輸入格式，大幅提升了導入的成功率和使用者體驗。