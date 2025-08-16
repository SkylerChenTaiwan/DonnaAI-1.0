# HybridQueryEngine.ts 型別安全性分析報告

## 🎯 整體評分：**6.5/10**

這是一個中等型別覆蓋率的程式碼，具有良好的介面定義和基本型別標註，但存在多個關鍵的型別安全問題需要立即修復。

---

## 🚨 **需要立即修復的嚴重問題**

### 1. 嚴重 - unknown 類型濫用導致型別安全風險
**位置**: 第 32、448、461、486 行

**問題詳述**:
```typescript
// 第 32 行 - QueryField 介面
interface QueryField {
  value: unknown;  // 🚨 應該使用聯合類型
}

// 第 448 行 - 型別斷言不安全
fieldValue.some(v => (query.value as unknown[]).includes(v));
// 🚨 強制型別轉換可能導致執行時錯誤

// 第 461 行 - 函數參數
private compareValues(a: unknown, b: unknown): number {
// 🚨 無法保證運行時型別安全
```

**修復建議**:
```typescript
// 定義嚴格的查詢值類型
type QueryValue = string | number | boolean | Timestamp | null | (string | number | boolean)[];

interface QueryField {
  fieldKey: string;
  operator: WhereFilterOp;
  value: QueryValue;  // ✅ 明確的聯合類型
  isStatic: boolean;
  dataType?: FieldDataType;
}

// 型別守衛函數
function isArrayValue(value: QueryValue): value is (string | number | boolean)[] {
  return Array.isArray(value);
}

// 安全的型別檢查
private evaluateDynamicCondition(
  dynamicData: Record<string, QueryValue>,
  query: QueryField
): boolean {
  if (query.operator === 'array-contains-any' && !isArrayValue(query.value)) {
    throw new Error('array-contains-any 操作符要求陣列型別的值');
  }
  // ...
}
```

### 2. 嚴重 - 不安全的型別轉換和斷言
**位置**: 第 237、284、353 行

**問題詳述**:
```typescript
// 第 237 行
data.push({ id: doc.id, ...doc.data() } as T);
// 🚨 強制斷言可能不匹配實際資料結構

// 第 284、353 行
} as T & { _doc: DocumentSnapshot });
// 🚨 複合型別斷言缺乏驗證
```

**修復建議**:
```typescript
// 定義型別守衛
function validateDocumentData<T>(data: unknown): data is T {
  // 實作適當的型別驗證邏輯
  return typeof data === 'object' && data !== null;
}

// 安全的資料轉換
snapshot.forEach(doc => {
  const rawData = doc.data();
  if (validateDocumentData<T>(rawData)) {
    data.push({ id: doc.id, ...rawData });
  } else {
    console.warn(`文檔 ${doc.id} 的資料格式不符合預期型別`);
  }
});
```

---

## ⚠️ **中等嚴重度問題**

### 3. 中等 - 可選鏈操作可能導致未定義行為
**位置**: 第 169、170、492 行

**問題詳述**:
```typescript
// 第 169-170 行
const staticSorts = options.sorts?.filter(s => !dynamicFieldKeys.has(s.fieldKey)) || [];
// 🟡 filter 結果型別不夠明確

// 第 492 行
const aValue = sort.isStatic ? a[sort.fieldKey] : a.dynamicFields?.[sort.fieldKey];
// 🟡 可能返回 undefined，但後續沒有妥善處理
```

**修復建議**:
```typescript
interface SortField {
  fieldKey: string;
  direction: 'asc' | 'desc';
  isStatic: boolean;
}

// 明確的型別註解
const staticSorts: SortField[] = options.sorts?.filter(s => !dynamicFieldKeys.has(s.fieldKey)) ?? [];

// 安全的值取得
private getSortValue<T extends Record<string, unknown>>(
  item: T, 
  sort: SortField
): QueryValue {
  if (sort.isStatic) {
    return (item[sort.fieldKey] as QueryValue) ?? null;
  }
  const dynamicFields = item.dynamicFields as Record<string, QueryValue> | undefined;
  return dynamicFields?.[sort.fieldKey] ?? null;
}
```

### 4. 中等 - 泛型約束不夠嚴格
**位置**: 第 111、486 行

**問題詳述**:
```typescript
// 第 111 行
async executeQuery<T extends Record<string, unknown>>(
// 🟡 約束太寬鬆，應該包含 id 欄位

// 第 486 行
private sortInMemory<T extends Record<string, unknown>>(
// 🟡 需要更嚴格的型別約束
```

**修復建議**:
```typescript
// 定義文檔基礎類型
interface DocumentBase {
  id: string;
  [key: string]: unknown;
}

// 動態欄位文檔類型
interface DynamicFieldDocument extends DocumentBase {
  dynamicFields?: Record<string, QueryValue>;
}

// 更嚴格的泛型約束
async executeQuery<T extends DynamicFieldDocument>(
  entityType: string,
  fields: QueryField[],
  options: QueryOptions = {}
): Promise<QueryResult<T>>

private sortInMemory<T extends DynamicFieldDocument>(
  data: T[],
  sorts: SortField[]
): void
```

---

## 🟢 **輕微問題**

### 5. 輕微 - 缺少輸入驗證
**位置**: 第 111、425 行

**問題詳述**:
```typescript
// 缺少對 entityType 和 fields 參數的驗證
async executeQuery<T extends Record<string, unknown>>(
  entityType: string,  // 🟡 應該驗證非空
  fields: QueryField[], // 🟡 應該驗證陣列不為空
```

**修復建議**:
```typescript
async executeQuery<T extends DynamicFieldDocument>(
  entityType: string,
  fields: QueryField[],
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  // 輸入驗證
  if (!entityType?.trim()) {
    throw new Error('entityType 不能為空');
  }
  
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error('fields 必須是非空陣列');
  }
  
  // 驗證每個查詢欄位
  fields.forEach((field, index) => {
    if (!field.fieldKey?.trim()) {
      throw new Error(`第 ${index} 個查詢欄位的 fieldKey 不能為空`);
    }
  });
  
  // ...rest of implementation
}
```

### 6. 輕微 - 錯誤處理型別不夠具體
**位置**: 第 591 行

**問題詳述**:
```typescript
private handleQueryError(message: string, error: unknown): Error {
// 🟡 error 參數型別太寬泛
```

**修復建議**:
```typescript
// 定義錯誤類型聯合
type QueryError = Error | FirestoreError | TypeError | RangeError;

interface QueryErrorContext {
  entityType?: string;
  queryFields?: QueryField[];
  operation?: string;
}

private handleQueryError(
  message: string, 
  error: unknown, 
  context?: QueryErrorContext
): Error {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const contextInfo = context ? ` [Context: ${JSON.stringify(context)}]` : '';
  return new Error(`${message}: ${errorMessage}${contextInfo}`);
}
```

---

## 📊 **型別覆蓋率統計**

### ✅ **已正確型別標註的部分** (70%)
- 所有介面定義完整且結構良好
- 方法參數和返回值基本有型別標註
- Firebase 相關型別使用正確
- 泛型使用適當（雖然約束可以更嚴格）

### 🟡 **需要改進的部分** (20%)
- `unknown` 類型使用過於頻繁
- 型別轉換缺乏安全檢查
- 泛型約束不夠嚴格
- 缺少輸入驗證

### 🚨 **嚴重缺失的部分** (10%)
- 不安全的型別斷言
- 缺少型別守衛函數
- 執行時型別驗證不足

---

## 🛠️ **建議的重構步驟**

### Phase 1: 立即修復（高優先級）
1. **替換所有 `unknown` 類型** - 定義明確的 `QueryValue` 聯合類型
2. **移除不安全的型別斷言** - 實作型別守衛函數
3. **加入輸入驗證** - 所有公開方法都要驗證參數

### Phase 2: 加強型別安全（中優先級）
1. **改善泛型約束** - 使用更具體的基礎類型
2. **實作型別守衛** - 為關鍵資料轉換加入驗證
3. **加強錯誤處理** - 使用更具體的錯誤型別

### Phase 3: 優化和完善（低優先級）
1. **加入 JSDoc 型別註解** - 改善開發體驗
2. **實作執行時型別檢查** - 使用 zod 或類似工具
3. **優化效能相關型別** - 減少不必要的型別檢查

---

## 🎯 **預期改善效果**

完成修復後，預計型別安全評分可提升至 **8.5-9.0/10**：

- ✅ 消除所有型別安全風險
- ✅ 改善開發時期的型別提示
- ✅ 減少執行時型別相關錯誤
- ✅ 提升程式碼可維護性

---

## 📚 **參考最佳實踐**

1. **使用聯合類型取代 unknown**
2. **實作型別守衛函數進行執行時檢查**
3. **避免使用 `as` 型別斷言，優先使用型別縮減**
4. **為泛型參數提供有意義的約束**
5. **在公開 API 加入完整的輸入驗證**

---

*報告產生時間: 2025-08-16*  
*分析工具: TypeScript Type Guardian Agent*