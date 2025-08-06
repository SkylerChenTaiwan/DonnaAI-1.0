# PRP-78: 三階段資料匯入系統重構

## Executive Summary
將現有複雜的欄位映射系統改為直覺的三階段匯入流程：
1. 選擇目標資料庫
2. 上傳並合併多個檔案
3. 設定欄位映射與跨資料庫關聯

## Background & Motivation
現有的欄位映射系統過於複雜，使用者難以理解。新系統將：
- 簡化匯入流程為三個清晰階段
- 支援多檔案合併成單一大表
- 自動建立雙向關聯
- 允許動態創建自訂欄位

## Detailed Requirements

### 階段 1: 選擇目標資料庫
- 使用者選擇要匯入到哪個資料庫（客戶、訪談記錄、任務）
- 系統載入該資料庫的欄位定義
- 顯示該資料庫的現有欄位結構

### 階段 2: 檔案上傳與合併
- 支援上傳多個 CSV/Excel 檔案
- 每個檔案需指定關鍵欄位（用於合併）
- 系統使用關鍵欄位將多檔案合併為單一大表
- 顯示合併預覽

### 階段 3: 欄位映射與關聯設定
- 從合併表中選擇要匯入的欄位
- 為每個欄位指定：
  - 自訂欄位名稱
  - 是否關聯到其他資料庫
  - 關聯目標（資料庫.欄位）
- 自動建立雙向關聯

## Technical Architecture

### 資料結構

```typescript
// 欄位關聯定義
interface FieldRelation {
  id: string;
  sourceDatabase: 'customers' | 'records' | 'tasks';
  sourceField: string;
  targetDatabase: 'customers' | 'records' | 'tasks' | 'users';
  targetField: string;
  relationType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  bidirectional: boolean;
  createdAt: Timestamp;
  organizationId: string;
}

// 匯入階段狀態
interface ImportWizardState {
  stage: 1 | 2 | 3;
  targetDatabase: 'customers' | 'records' | 'tasks' | null;
  uploadedFiles: Array<{
    id: string;
    name: string;
    headers: string[];
    data: any[];
    keyField: string | null;
  }>;
  mergedTable: {
    headers: string[];
    data: any[];
  } | null;
  fieldMappings: Array<{
    sourceColumn: string;
    targetField: string;
    isNew: boolean;
    fieldType?: FieldType;
  }>;
  fieldRelations: FieldRelation[];
}

// 合併配置
interface MergeConfig {
  files: Array<{
    id: string;
    keyField: string;
  }>;
  mergeStrategy: 'left' | 'inner' | 'outer';
}
```

### 關鍵實作點

#### 1. 檔案合併演算法
```typescript
function mergeFiles(files: UploadedFile[], config: MergeConfig): MergedTable {
  // 使用第一個檔案作為基底
  const baseFile = files[0];
  const baseKey = config.files[0].keyField;
  
  let mergedData = baseFile.data.map(row => ({ ...row }));
  
  // 逐一合併其他檔案
  for (let i = 1; i < files.length; i++) {
    const file = files[i];
    const keyField = config.files[i].keyField;
    
    // 建立查詢索引
    const lookupMap = new Map();
    file.data.forEach(row => {
      lookupMap.set(row[keyField], row);
    });
    
    // 合併資料
    mergedData = mergedData.map(baseRow => {
      const keyValue = baseRow[baseKey];
      const matchedRow = lookupMap.get(keyValue);
      
      if (matchedRow) {
        // 合併欄位，避免覆蓋
        return {
          ...baseRow,
          ...prefixDuplicateKeys(matchedRow, file.name)
        };
      }
      
      return baseRow;
    });
  }
  
  return {
    headers: Object.keys(mergedData[0] || {}),
    data: mergedData
  };
}
```

#### 2. 雙向關聯管理
```typescript
async function createBidirectionalRelation(
  relation: FieldRelation
): Promise<void> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  
  // 建立正向關聯
  const forwardRef = doc(collection(db, 'field_relations'));
  batch.set(forwardRef, relation);
  
  // 自動建立反向關聯
  if (relation.bidirectional) {
    const reverseRelation: FieldRelation = {
      ...relation,
      id: generateId(),
      sourceDatabase: relation.targetDatabase as any,
      sourceField: relation.targetField,
      targetDatabase: relation.sourceDatabase,
      targetField: relation.sourceField,
    };
    
    const reverseRef = doc(collection(db, 'field_relations'));
    batch.set(reverseRef, reverseRelation);
  }
  
  await batch.commit();
  
  // 更新關聯快取
  updateRelationCache(relation);
}
```

## Implementation Blueprint

### File Structure
```
src/
├── components/
│   └── import/
│       ├── ImportWizard.tsx                 # 主要匯入精靈元件
│       ├── stages/
│       │   ├── DatabaseSelector.tsx         # 階段1: 選擇資料庫
│       │   ├── FileUploadMerger.tsx        # 階段2: 上傳與合併
│       │   └── FieldMapper.tsx             # 階段3: 欄位映射
│       ├── preview/
│       │   ├── MergedTablePreview.tsx      # 合併預覽
│       │   └── RelationshipVisualizer.tsx  # 關聯視覺化
│       └── utils/
│           ├── fileMerger.ts               # 檔案合併邏輯
│           └── relationManager.ts          # 關聯管理
├── services/
│   └── firebase/
│       └── fieldRelations.ts               # 欄位關聯服務
└── types/
    └── import.ts                            # 匯入相關類型定義
```

## Task List

### Task 1: 建立欄位關聯資料結構
```typescript
// CREATE src/types/import.ts
export interface FieldRelation {
  id: string;
  sourceDatabase: DatabaseType;
  sourceField: string;
  targetDatabase: DatabaseType;
  targetField: string;
  relationType: RelationType;
  bidirectional: boolean;
  createdAt: Timestamp;
  organizationId: string;
}

// CREATE src/services/firebase/fieldRelations.ts
- IMPLEMENT createFieldRelation()
- IMPLEMENT getFieldRelations()
- IMPLEMENT updateFieldRelation()
- IMPLEMENT deleteFieldRelation()
- ADD bidirectional relation auto-creation
```

### Task 2: 實作檔案合併工具
```typescript
// CREATE src/components/import/utils/fileMerger.ts
- IMPLEMENT mergeByKey() - 根據關鍵欄位合併
- IMPLEMENT detectKeyFields() - 自動偵測可能的關鍵欄位
- IMPLEMENT handleDuplicateColumns() - 處理重複欄位名稱
- IMPLEMENT validateMerge() - 驗證合併結果
```

### Task 3: 建立三階段匯入精靈
```typescript
// CREATE src/components/import/ImportWizard.tsx
- IMPLEMENT stage navigation
- MANAGE wizard state
- HANDLE stage transitions
- VALIDATE each stage before proceeding
```

### Task 4: 實作階段 1 - 資料庫選擇器
```typescript
// CREATE src/components/import/stages/DatabaseSelector.tsx
- DISPLAY database options (customers, records, tasks)
- LOAD field definitions for selected database
- SHOW existing data statistics
- PREPARE import context
```

### Task 5: 實作階段 2 - 檔案上傳與合併
```typescript
// CREATE src/components/import/stages/FileUploadMerger.tsx
- SUPPORT multiple file uploads
- DISPLAY file preview for each file
- SELECT key field for each file
- SHOW merge preview
- HANDLE merge conflicts
```

### Task 6: 實作階段 3 - 欄位映射與關聯
```typescript
// CREATE src/components/import/stages/FieldMapper.tsx
- DISPLAY merged table columns
- SELECT fields to import
- MAP to existing or new fields
- CONFIGURE cross-database relations
- PREVIEW import result
```

### Task 7: 建立關聯視覺化元件
```typescript
// CREATE src/components/import/preview/RelationshipVisualizer.tsx
- VISUALIZE database relationships
- SHOW bidirectional connections
- HIGHLIGHT new relations
- ALLOW relation editing
```

### Task 8: 整合到現有系統
```typescript
// MODIFY src/components/screens/admin/LegacyDataImportScreen.tsx
- REPLACE current import flow with ImportWizard
- MAINTAIN backward compatibility
- MIGRATE existing import sessions
```

### Task 9: 更新 Firestore 規則
```javascript
// MODIFY firestore.rules
// 新增 field_relations 集合規則
match /field_relations/{relationId} {
  allow read: if request.auth != null && 
    getUserData().organizationId == resource.data.organizationId;
  allow write: if request.auth != null && 
    getUserData().role == 'admin' &&
    getUserData().organizationId == request.resource.data.organizationId;
}
```

### Task 10: 建立測試資料產生器
```typescript
// CREATE src/utils/test/importTestDataGenerator.ts
- GENERATE sample CSV files
- CREATE related data across files
- INCLUDE edge cases
- SUPPORT various encodings
```

## Migration Strategy

### 資料遷移
1. 保留現有 FieldMappingModal 作為 legacy 支援
2. 新建 ImportWizard 作為主要介面
3. 逐步遷移使用者到新系統
4. 3 個月後移除舊系統

### 相容性考量
- 支援舊的匯入格式
- 自動轉換舊映射到新格式
- 保留匯入歷史記錄

## Testing Strategy

### 單元測試
```bash
# 檔案合併測試
npm test -- fileMerger.test.ts

# 關聯管理測試  
npm test -- relationManager.test.ts

# 精靈流程測試
npm test -- ImportWizard.test.ts
```

### 整合測試
1. 測試多檔案合併場景
2. 測試雙向關聯建立
3. 測試大量資料匯入
4. 測試錯誤處理

### E2E 測試場景
1. 完整三階段匯入流程
2. 多檔案合併與關聯設定
3. 錯誤恢復與重試
4. 匯入進度追蹤

## Validation Gates

```bash
# TypeScript 編譯檢查
npm run type-check

# Linting
npm run lint

# 單元測試
npm test

# 建置測試
npm run web:build

# 部署前檢查
npm run web:deploy -- --dry-run
```

## Success Criteria

1. ✅ 使用者可以選擇目標資料庫
2. ✅ 支援上傳並合併多個檔案
3. ✅ 自動偵測並建議關鍵欄位
4. ✅ 允許自訂欄位名稱
5. ✅ 支援跨資料庫關聯設定
6. ✅ 自動建立雙向關聯
7. ✅ 匯入成功率 > 95%
8. ✅ 處理 10,000 筆資料 < 30 秒

## Risk Mitigation

### 風險 1: 大檔案處理
- **解決方案**: 使用 Web Worker 處理檔案解析
- **備案**: 分批處理，顯示進度

### 風險 2: 合併衝突
- **解決方案**: 提供衝突解決介面
- **備案**: 允許手動調整合併結果

### 風險 3: 關聯複雜度
- **解決方案**: 視覺化關聯圖表
- **備案**: 提供簡單模式（不設關聯）

## Reference Documentation

### Firebase Firestore
- [批次寫入最佳實踐](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [複合查詢](https://firebase.google.com/docs/firestore/query-data/queries)

### React Patterns
- [Wizard Pattern](https://www.patterns.dev/posts/wizard-pattern)
- [Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks)

### 現有程式碼參考
- `src/components/import/FieldMappingModal.tsx` - 現有映射邏輯
- `src/services/firebase/admin/dataImportService.ts` - 匯入服務
- `src/services/firebase/fieldDefinitions.ts` - 欄位定義管理
- `src/utils/csvTemplateGenerator.ts` - CSV 處理工具

## Notes for AI Implementation

### 重要提醒
1. **保持向後相容**: 不要破壞現有的匯入功能
2. **錯誤處理**: 每個階段都要有完善的錯誤處理
3. **進度回饋**: 長時間操作要顯示進度
4. **記憶體管理**: 注意大檔案的記憶體使用
5. **使用繁體中文**: 所有 UI 文字使用繁體中文

### 實作順序建議
1. 先建立資料結構（Task 1）
2. 實作檔案合併邏輯（Task 2）
3. 建立 UI 框架（Task 3-7）
4. 整合到系統（Task 8）
5. 更新權限規則（Task 9）
6. 測試與優化（Task 10）

### 可重用元件
- 使用現有的 `LoadingSpinner`
- 使用現有的 `Modal` 元件
- 使用現有的 `Table` 元件
- 使用現有的 `FileUpload` 邏輯

## Confidence Score

**實作成功信心度: 8.5/10**

### 信心度分析
- ✅ 清晰的三階段流程設計
- ✅ 完整的技術架構
- ✅ 詳細的實作步驟
- ✅ 考慮了錯誤處理和邊界情況
- ⚠️ 檔案合併邏輯可能需要調整
- ⚠️ 雙向關聯管理需要仔細測試

---

*PRP-78: Three-Stage Data Import System | Version 1.0 | Created: 2025-08-06*