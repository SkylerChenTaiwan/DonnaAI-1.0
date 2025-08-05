name: "動態欄位定義系統 - Firebase 同步欄位結構"
description: |

## Purpose
建立動態欄位定義系統，讓表單欄位和 CSV 範本格式能夠自動與 Firebase 中的欄位定義同步，確保使用者看到的欄位標題和結構始終與資料庫保持一致。

## Core Principles
1. **Single Source of Truth**: Firebase 作為欄位定義的唯一來源
2. **Real-time Sync**: 欄位定義變更即時反映到所有介面
3. **Type Safety**: 保持 TypeScript 類型安全
4. **Backward Compatible**: 相容現有資料結構
5. **Global rules**: 遵循 CLAUDE.md 中的所有規則

---

## Goal
建立一個欄位定義系統，讓所有資料輸入介面（單筆表單、批量 CSV）的欄位標題和結構都能夠動態從 Firebase 讀取，並在欄位定義變更時自動更新。

## Why
- **業務價值**: 企業客戶需要根據自己的業務需求自訂欄位名稱和類型
- **整合現有功能**: 配合已實作的混合模式資料庫（唯讀表格 + 表單編輯）
- **解決問題**: 
  - 目前欄位名稱寫死在程式碼中，無法滿足不同企業的客製化需求
  - CSV 範本下載的欄位與實際需求不符
  - 新增欄位需要改程式碼重新部署

## What
實作動態欄位定義系統，包含：
- Firebase 欄位定義結構設計
- 欄位定義讀取和快取機制
- 表單動態生成器
- CSV 範本動態生成器
- 欄位類型映射系統

### Success Criteria
- [ ] Firebase 中可定義每個集合的欄位結構
- [ ] 單筆新增表單根據定義動態生成欄位
- [ ] CSV 範本根據定義動態生成欄位
- [ ] 欄位定義變更後，所有介面自動更新
- [ ] 保持現有資料相容性
- [ ] 支援欄位驗證規則

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: /src/services/firebase/customers-v2.ts
  why: 了解現有客戶資料結構和 Firebase 操作模式
  
- file: /src/screens/modals/CreateCustomerModal.tsx
  why: 了解現有表單結構，需要改為動態生成
  
- file: /src/components/database/import/CSVImportModal.tsx
  why: 了解 CSV 匯入流程，需要動態生成範本

- file: /src/types/index.ts
  why: 了解現有類型定義，需要擴展支援動態欄位

- doc: https://firebase.google.com/docs/firestore/manage-data/structure-data
  section: Data modeling
  critical: 了解 Firestore 資料結構最佳實踐
```

### Current Codebase Structure
```bash
src/
├── services/
│   └── firebase/
│       ├── customers-v2.ts      # 客戶資料服務
│       └── fieldDefinitions.ts  # (新增) 欄位定義服務
├── screens/
│   └── modals/
│       ├── CreateCustomerModal.tsx  # 需要改為動態
│       └── EditCustomerModal.tsx    # 需要改為動態
├── components/
│   └── database/
│       ├── import/
│       │   └── CSVImportModal.tsx  # 需要動態範本
│       └── forms/
│           └── DynamicFormBuilder.tsx  # (新增) 動態表單產生器
└── types/
    ├── index.ts
    └── fieldDefinitions.ts  # (新增) 欄位定義類型
```

### Known Gotchas
```typescript
// CRITICAL: Firestore 不支援動態欄位查詢，需要建立索引
// Example: 動態欄位需要使用 Map 結構儲存
// Example: React Native 表單元件需要正確的 key prop 避免重渲染問題
// Example: CSV 編碼必須是 UTF-8 with BOM 才能在 Excel 中正確顯示中文
```

## Implementation Blueprint

### Data Models and Structure

#### Firebase 欄位定義結構
```typescript
// Firestore collection: field_definitions
interface FieldDefinition {
  id: string;
  collectionName: 'customers' | 'tasks' | 'records';
  fields: FieldConfig[];
  version: number;
  updatedAt: Timestamp;
  updatedBy: string;
}

interface FieldConfig {
  key: string;           // 欄位 key (不可變)
  label: string;         // 顯示標題 (可變)
  type: FieldType;       // 欄位類型
  required: boolean;     // 是否必填
  order: number;         // 顯示順序
  defaultValue?: any;    // 預設值
  validation?: ValidationRule[];  // 驗證規則
  options?: string[];    // 下拉選單選項
  visible: boolean;      // 是否顯示
}

type FieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'email'
  | 'phone'
  | 'url'
  | 'textarea';

interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message: string;
}
```

### List of Tasks

```yaml
Task 1: 建立欄位定義資料結構
CREATE src/types/fieldDefinitions.ts:
  - DEFINE all interfaces for field definitions
  - EXPORT types for use across the app
  - INCLUDE JSDoc comments for clarity

Task 2: 建立欄位定義 Firebase 服務
CREATE src/services/firebase/fieldDefinitions.ts:
  - IMPLEMENT subscribeToFieldDefinitions function
  - ADD caching mechanism for offline support  
  - HANDLE real-time updates
  - PROVIDE default field definitions if none exist

Task 3: 建立動態表單產生器元件
CREATE src/components/database/forms/DynamicFormBuilder.tsx:
  - ACCEPT field definitions as props
  - GENERATE form fields dynamically
  - HANDLE all field types
  - IMPLEMENT validation logic
  - SUPPORT React Native Web components

Task 4: 修改新增客戶 Modal 使用動態表單
MODIFY src/screens/modals/CreateCustomerModal.tsx:
  - INTEGRATE DynamicFormBuilder
  - SUBSCRIBE to field definitions
  - REMOVE hardcoded form fields
  - MAINTAIN existing submission logic

Task 5: 修改編輯客戶 Modal 使用動態表單
MODIFY src/screens/modals/EditCustomerModal.tsx:
  - INTEGRATE DynamicFormBuilder
  - LOAD existing data into dynamic fields
  - HANDLE field mapping

Task 6: 建立 CSV 範本生成器
CREATE src/utils/csvTemplateGenerator.ts:
  - GENERATE CSV headers from field definitions
  - INCLUDE example data row
  - HANDLE UTF-8 BOM for Excel compatibility
  - EXPORT as downloadable file

Task 7: 修改 CSV 匯入支援動態欄位
MODIFY src/components/database/import/CSVImportModal.tsx:
  - READ CSV based on dynamic field definitions
  - MAP CSV columns to field keys
  - VALIDATE data against field rules
  - SHOW mapping preview

Task 8: 建立欄位定義管理介面（管理員專用）
CREATE src/screens/admin/FieldDefinitionsScreen.tsx:
  - CRUD operations for field definitions
  - DRAG and drop for field ordering
  - PREVIEW form appearance
  - VERSION history

Task 9: 更新 Firestore Security Rules
MODIFY firestore.rules:
  - ADD rules for field_definitions collection
  - RESTRICT write to admins only
  - ALLOW read for authenticated users

Task 10: 建立遷移腳本
CREATE scripts/migrateToFieldDefinitions.ts:
  - CREATE default field definitions
  - MIGRATE existing data structure
  - ENSURE backward compatibility
```

### Per Task Pseudocode

```typescript
// Task 2: Field Definitions Service
export function subscribeToFieldDefinitions(
  collectionName: string,
  callback: (fields: FieldConfig[]) => void
): Unsubscribe {
  // Check cache first
  const cached = fieldDefinitionCache.get(collectionName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    callback(cached.fields);
  }
  
  // Subscribe to real-time updates
  const q = query(
    collection(db, 'field_definitions'),
    where('collectionName', '==', collectionName),
    orderBy('version', 'desc'),
    limit(1)
  );
  
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const definition = snapshot.docs[0].data() as FieldDefinition;
      // Sort fields by order
      const sortedFields = definition.fields
        .filter(f => f.visible)
        .sort((a, b) => a.order - b.order);
      
      // Update cache
      fieldDefinitionCache.set(collectionName, {
        fields: sortedFields,
        timestamp: Date.now()
      });
      
      callback(sortedFields);
    } else {
      // Return default definitions
      callback(getDefaultFieldDefinitions(collectionName));
    }
  });
}

// Task 3: Dynamic Form Builder
export const DynamicFormBuilder: React.FC<Props> = ({
  fields,
  data,
  onChange,
  errors
}) => {
  return (
    <View>
      {fields.map((field) => (
        <FormField
          key={field.key}
          field={field}
          value={data[field.key]}
          onChange={(value) => onChange(field.key, value)}
          error={errors?.[field.key]}
        />
      ))}
    </View>
  );
};

// Task 6: CSV Template Generator
export function generateCSVTemplate(fields: FieldConfig[]): Blob {
  // Generate headers
  const headers = fields.map(f => f.label);
  
  // Generate example row
  const exampleRow = fields.map(f => {
    switch (f.type) {
      case 'text': return '範例文字';
      case 'number': return '123';
      case 'date': return '2025-01-01';
      case 'email': return 'example@email.com';
      default: return '';
    }
  });
  
  // Create CSV content with BOM
  const BOM = '\uFEFF';
  const csvContent = BOM + [
    headers.join(','),
    exampleRow.join(',')
  ].join('\n');
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
}
```

### Integration Points
```yaml
DATABASE:
  - collection: "field_definitions"
  - indexes: "collectionName, version DESC"
  
STORE:
  - add to: src/store/fieldDefinitionsSlice.ts
  - state: "fieldDefinitions: Record<string, FieldConfig[]>"
  
COMPONENTS:
  - update: All form components to use DynamicFormBuilder
  - update: CSV import/export to use dynamic fields
```

## Validation Loop

### Level 1: Type Safety
```bash
# 檢查 TypeScript 編譯
npx tsc --noEmit

# Expected: No errors
```

### Level 2: Component Tests
```typescript
// Test dynamic form generation
describe('DynamicFormBuilder', () => {
  it('generates correct form fields', () => {
    const fields = [
      { key: 'name', label: '姓名', type: 'text', required: true },
      { key: 'email', label: '電郵', type: 'email', required: false }
    ];
    
    const { getByText, getByTestId } = render(
      <DynamicFormBuilder fields={fields} />
    );
    
    expect(getByText('姓名')).toBeInTheDocument();
    expect(getByTestId('field-name')).toHaveAttribute('required');
  });
});
```

### Level 3: Integration Test
```bash
# 測試欄位定義即時更新
1. 開啟應用程式
2. 進入新增客戶表單
3. 在 Firebase Console 修改欄位定義
4. 確認表單自動更新顯示新欄位

# 測試 CSV 範本生成
1. 點擊「下載範本」
2. 確認 CSV 包含所有定義的欄位
3. 確認中文顯示正確
```

## Final Validation Checklist
- [ ] 欄位定義可從 Firebase 讀取
- [ ] 表單根據定義動態生成
- [ ] CSV 範本根據定義生成
- [ ] 欄位變更即時更新
- [ ] 保持類型安全
- [ ] 相容現有資料
- [ ] 管理介面可編輯欄位
- [ ] Security Rules 正確設定

## Anti-Patterns to Avoid
- ❌ 不要在客戶端快取欄位定義太久
- ❌ 不要允許一般用戶修改欄位定義
- ❌ 不要忽略欄位驗證規則
- ❌ 不要硬編碼任何欄位名稱
- ❌ 不要破壞現有資料結構
- ❌ 不要忽略效能（過度訂閱）