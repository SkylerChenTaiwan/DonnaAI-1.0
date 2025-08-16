name: "動態欄位映射系統 - 增強版（含風險管理）"
description: |
  實作資料驅動的欄位映射系統，讓用戶可以使用自己的 CSV 欄位結構，同時管理相關風險。

## Goal
將目前的欄位映射系統從「系統定義的固定欄位」改為「從 CSV 檔案動態讀取的欄位」，同時確保系統穩定性、效能和安全性。

## Why
- **商業價值**：讓客戶可以保留自己的資料結構，降低導入門檻
- **用戶體驗**：不需要修改現有 CSV 檔案來符合系統要求
- **靈活性**：支援各種不同產業和組織的欄位需求
- **擴展性**：為未來的自訂報表和查詢功能奠定基礎

## What
### 用戶可見行為
1. 上傳 CSV 時，系統自動讀取所有欄位
2. 用戶可以設定每個欄位的屬性（類型、是否必填等）
3. 系統保留 CSV 的原始欄位名稱和結構
4. 自動建立對應的欄位定義供後續使用
5. 支援搜尋、過濾和排序動態欄位

### 技術需求
1. 移除 `systemFields` 的固定定義
2. 從 CSV 動態讀取欄位
3. 自動生成 `FieldConfig` 定義
4. 儲存到 `field_definitions` 集合
5. 實施欄位數量和名稱限制
6. 優化查詢效能
7. 確保向後相容性

### Success Criteria
- [ ] CSV 上傳時自動讀取所有欄位
- [ ] 用戶可自訂欄位屬性
- [ ] 資料匯入保留原始欄位結構
- [ ] 欄位定義自動儲存供後續使用
- [ ] 查詢效能不受影響（<2秒回應）
- [ ] 支援至少 100 個動態欄位
- [ ] 向後相容現有資料
- [ ] 通過安全性審核

## Risk Analysis & Mitigation

### 1. 資料安全風險
**風險**：
- 動態欄位可能包含敏感資料（如身分證號、信用卡號）
- 欄位級別的權限控制複雜度增加
- 資料洩露風險

**緩解措施**：
```typescript
// 實施欄位級別的資料遮罩
interface FieldSecurity {
  fieldKey: string;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  allowedRoles: string[];
  maskingRule?: 'full' | 'partial' | 'hash';
  encryptionRequired?: boolean;
}

// 敏感資料檢測
const SENSITIVE_PATTERNS = {
  creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
  ssn: /^\d{3}-\d{2}-\d{4}$/,
  taiwanId: /^[A-Z][12]\d{8}$/,
  phone: /^09\d{8}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

function detectSensitiveData(values: any[]): boolean {
  return values.some(value => {
    const str = String(value);
    return Object.values(SENSITIVE_PATTERNS).some(pattern => 
      pattern.test(str)
    );
  });
}
```

### 2. 效能風險
**風險**：
- Firestore 複合索引限制（最多 200 個）
- 大量動態欄位影響查詢速度
- 文檔大小超過 1MB 限制
- 批次寫入超過 500 個操作

**緩解措施**：
```typescript
// 欄位數量限制
const MAX_DYNAMIC_FIELDS = 100;
const MAX_FIELD_NAME_LENGTH = 50;
const MAX_FIELD_VALUE_SIZE = 10000; // 10KB per field
const MAX_DOCUMENT_SIZE = 900000; // 900KB (留 100KB 緩衝)

// 分片儲存策略
interface ShardedCustomer {
  // 核心欄位（固定）
  core: {
    id: string;
    name: string;
    organizationId: string;
    createdAt: Timestamp;
    // ... 其他系統欄位
  };
  
  // 動態欄位分片
  dynamicFields: {
    shard1?: Record<string, any>; // 前 50 個欄位
    shard2?: Record<string, any>; // 51-100 個欄位
  };
  
  // 索引欄位（用於查詢）
  indexedFields: {
    [key: string]: any; // 只包含需要查詢的欄位
  };
}

// 智能索引策略
class DynamicIndexManager {
  // 追蹤欄位使用頻率
  trackFieldUsage(fieldKey: string, operation: 'query' | 'filter' | 'sort') {
    // 記錄到 analytics
  }
  
  // 自動建議索引
  suggestIndexes(): string[] {
    // 基於使用頻率建議需要索引的欄位
    return this.getTopUsedFields(10);
  }
}
```

### 3. 資料完整性風險
**風險**：
- 欄位類型推斷錯誤
- 資料轉換錯誤導致資料遺失
- 關聯錯誤導致資料不一致
- 重複資料問題

**緩解措施**：
```typescript
// 增強型類型推斷
class EnhancedTypeInferrer {
  // 使用多數決策略
  inferTypeWithConfidence(values: any[]): {
    type: FieldType;
    confidence: number;
    alternatives: Array<{ type: FieldType; confidence: number }>;
  } {
    const typeVotes = new Map<FieldType, number>();
    
    values.forEach(value => {
      const possibleTypes = this.getPossibleTypes(value);
      possibleTypes.forEach(type => {
        typeVotes.set(type, (typeVotes.get(type) || 0) + 1);
      });
    });
    
    // 計算信心度
    const sortedTypes = Array.from(typeVotes.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const totalVotes = values.length;
    const bestType = sortedTypes[0];
    
    return {
      type: bestType[0],
      confidence: bestType[1] / totalVotes,
      alternatives: sortedTypes.slice(1, 3).map(([type, votes]) => ({
        type,
        confidence: votes / totalVotes
      }))
    };
  }
  
  // 資料驗證
  validateTypeConsistency(values: any[], type: FieldType): boolean {
    const inconsistentValues = values.filter(v => 
      !this.isValidForType(v, type)
    );
    
    // 允許 5% 的不一致（可能是髒資料）
    return inconsistentValues.length / values.length < 0.05;
  }
}

// 資料轉換審計
interface TransformationAudit {
  fieldKey: string;
  originalValue: any;
  transformedValue: any;
  transformation: string;
  timestamp: Date;
  reversible: boolean;
}

// 重複檢測
class DuplicateDetector {
  async detectDuplicates(
    data: any[],
    keyFields: string[]
  ): Promise<DuplicateReport> {
    const seen = new Map<string, number[]>();
    const duplicates: Array<{ rows: number[]; key: string }> = [];
    
    data.forEach((row, index) => {
      const key = keyFields.map(f => row[f]).join('|');
      if (seen.has(key)) {
        seen.get(key)!.push(index);
      } else {
        seen.set(key, [index]);
      }
    });
    
    seen.forEach((rows, key) => {
      if (rows.length > 1) {
        duplicates.push({ rows, key });
      }
    });
    
    return {
      hasDuplicates: duplicates.length > 0,
      duplicateGroups: duplicates,
      totalDuplicates: duplicates.reduce((sum, g) => sum + g.rows.length - 1, 0)
    };
  }
}
```

### 4. 向後相容風險
**風險**：
- 現有查詢和報表功能失效
- 現有資料結構不相容
- API 介面變更影響前端

**緩解措施**：
```typescript
// 相容性層
class CompatibilityAdapter {
  // 將動態欄位映射到舊系統欄位
  mapToLegacyFields(
    dynamicData: Record<string, any>,
    fieldMapping: DynamicFieldMapping[]
  ): LegacyCustomerData {
    const legacy: any = {};
    
    // 映射已知欄位
    const knownMappings = {
      'customer_name': 'name',
      '客戶名稱': 'name',
      'company_name': 'company',
      '公司名稱': 'company',
      // ... 更多映射
    };
    
    fieldMapping.forEach(mapping => {
      const legacyKey = knownMappings[mapping.csvHeader];
      if (legacyKey && dynamicData[mapping.fieldConfig.fieldKey]) {
        legacy[legacyKey] = dynamicData[mapping.fieldConfig.fieldKey];
      }
    });
    
    // 保留未映射的欄位在 customFields 中
    legacy.customFields = { ...dynamicData };
    
    return legacy;
  }
  
  // 版本化 API
  async getCustomer(id: string, version: 'v1' | 'v2' = 'v2') {
    const customer = await this.fetchCustomer(id);
    
    if (version === 'v1') {
      // 轉換為舊格式
      return this.mapToLegacyFields(customer.dynamicFields, customer.fieldMapping);
    }
    
    return customer; // v2 格式
  }
}
```

### 5. UI/UX 風險
**風險**：
- 大量欄位導致 UI 混亂
- 行動裝置顯示問題
- 搜尋和過濾複雜度增加
- 效能問題（渲染大量欄位）

**緩解措施**：
```typescript
// 智能欄位顯示
interface FieldDisplayConfig {
  visibleByDefault: string[]; // 預設顯示的欄位
  pinnedFields: string[];      // 固定欄位
  groupedFields: Map<string, string[]>; // 分組顯示
  mobileFields: string[];      // 行動版顯示欄位
}

// 虛擬滾動實作
class VirtualFieldList {
  private visibleRange = { start: 0, end: 20 };
  private fieldHeight = 40;
  
  getVisibleFields(
    allFields: FieldConfig[],
    scrollTop: number,
    containerHeight: number
  ): FieldConfig[] {
    const start = Math.floor(scrollTop / this.fieldHeight);
    const end = Math.ceil((scrollTop + containerHeight) / this.fieldHeight);
    
    return allFields.slice(start, end);
  }
}

// 智能搜尋
class SmartFieldSearch {
  // 模糊搜尋
  fuzzySearch(query: string, fields: FieldConfig[]): FieldConfig[] {
    return fields.filter(field => {
      const searchTargets = [
        field.displayName,
        field.originalName,
        field.fieldKey,
        ...(field.statistics?.patterns || [])
      ];
      
      return searchTargets.some(target => 
        this.fuzzyMatch(query.toLowerCase(), target.toLowerCase())
      );
    });
  }
  
  // 基於使用頻率的建議
  suggestFields(partial: string): FieldConfig[] {
    const usage = this.getFieldUsageStats();
    return this.fuzzySearch(partial, fields)
      .sort((a, b) => usage[b.fieldKey] - usage[a.fieldKey])
      .slice(0, 5);
  }
}
```

### 6. 查詢複雜度風險
**風險**：
- 動態欄位無法使用 Firestore 的複合查詢
- 無法預先建立索引
- 全文搜尋困難

**緩解措施**：
```typescript
// 混合查詢策略
class HybridQueryEngine {
  async query(
    collection: string,
    filters: QueryFilter[]
  ): Promise<any[]> {
    // 分離可索引和不可索引的過濾條件
    const { indexable, nonIndexable } = this.separateFilters(filters);
    
    // 使用 Firestore 查詢可索引欄位
    let results = await this.firestoreQuery(collection, indexable);
    
    // 在記憶體中過濾不可索引欄位
    if (nonIndexable.length > 0) {
      results = results.filter(doc => 
        this.matchesFilters(doc, nonIndexable)
      );
    }
    
    return results;
  }
  
  // 建立搜尋索引
  async buildSearchIndex(
    document: any,
    fields: string[]
  ): Promise<SearchIndex> {
    const tokens = new Set<string>();
    
    fields.forEach(field => {
      const value = String(document[field] || '');
      // 分詞
      const fieldTokens = this.tokenize(value);
      fieldTokens.forEach(token => tokens.add(token));
    });
    
    return {
      documentId: document.id,
      tokens: Array.from(tokens),
      updatedAt: new Date()
    };
  }
}

// 使用 Algolia 或 ElasticSearch 進行進階搜尋
interface ExternalSearchService {
  indexDocument(doc: any): Promise<void>;
  search(query: string, filters?: any): Promise<SearchResult[]>;
  deleteDocument(id: string): Promise<void>;
}
```

## Implementation Blueprint

### 階段性實施計劃
```yaml
Phase 1: 基礎功能（第 1-2 週）
  - 動態欄位讀取和顯示
  - 基本類型推斷
  - 資料匯入（限制 50 個欄位）
  
Phase 2: 進階功能（第 3-4 週）
  - 欄位安全性設定
  - 效能優化（分片儲存）
  - 相容性層實作
  
Phase 3: 查詢優化（第 5-6 週）
  - 混合查詢引擎
  - 搜尋索引建立
  - UI 虛擬滾動
  
Phase 4: 監控和優化（第 7-8 週）
  - 使用分析
  - 自動索引建議
  - 效能監控
```

### Data Models and Structure
```typescript
// types/dynamicFields.ts - 增強版
export interface DynamicFieldConfig {
  // 基本資訊
  originalName: string;
  fieldKey: string;
  displayName: string;
  
  // 類型資訊
  detectedType: FieldType;
  confirmedType: FieldType;
  typeConfidence: number;
  
  // 資料特性
  required: boolean;
  unique: boolean;
  nullable: boolean;
  indexed: boolean;
  
  // 安全性
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  encrypted: boolean;
  masked: boolean;
  
  // 統計資訊
  statistics: {
    nullCount: number;
    uniqueCount: number;
    minLength?: number;
    maxLength?: number;
    patterns?: string[];
    samples: any[];
  };
  
  // 驗證規則
  validation?: ValidationRule[];
  
  // 轉換規則
  transformation?: TransformationRule;
  
  // 使用追蹤
  usage: {
    queryCount: number;
    filterCount: number;
    sortCount: number;
    lastUsed?: Date;
  };
}

// 分片儲存結構
export interface ShardedDocument {
  _shardInfo: {
    shardCount: number;
    totalSize: number;
    lastUpdated: Date;
  };
  _shard_0: Record<string, any>; // 核心欄位
  _shard_1?: Record<string, any>; // 動態欄位 1-50
  _shard_2?: Record<string, any>; // 動態欄位 51-100
}

// 查詢優化結構
export interface OptimizedQuery {
  firestoreQuery: FirestoreQuery;
  memoryFilters: MemoryFilter[];
  searchQuery?: ExternalSearchQuery;
  estimatedCost: number;
  estimatedTime: number;
}
```

### Critical Firestore Rules Updates
```javascript
// firestore.rules
match /field_definitions/{defId} {
  // Super Admin 和組織管理員可以寫入
  allow write: if isSuperAdmin() || 
    (isOrgAdmin(resource.data.organizationId) && 
     resource.data.fields.size() <= 100); // 限制欄位數量
  
  // 組織成員可以讀取
  allow read: if isOrgMember(resource.data.organizationId);
}

// 新增：動態欄位索引集合
match /field_indexes/{indexId} {
  allow read: if isOrgMember(resource.data.organizationId);
  allow write: if false; // 只能通過 Cloud Functions 寫入
}

// 修改：客戶集合規則
match /customers/{customerId} {
  // 檢查文檔大小（透過 Cloud Function 強制）
  allow create: if request.auth != null &&
    request.resource.data.size() < 900000; // 900KB 限制
  
  // 其他規則保持不變...
}
```

### List of Tasks with Risk Mitigation
```yaml
Task 1: 建立增強型動態欄位類型定義
CREATE src/types/dynamicFields.ts:
  - 包含安全性欄位
  - 包含效能優化欄位
  - 包含使用追蹤欄位

Task 2: 實作安全的欄位分析器
CREATE src/services/import/SecureDynamicFieldAnalyzer.ts:
  - 敏感資料檢測
  - 欄位名稱清理（防止注入）
  - 類型推斷信心度計算
  - 欄位數量限制檢查

Task 3: 建立分片儲存服務
CREATE src/services/firebase/shardedStorageService.ts:
  - 文檔大小檢查
  - 自動分片邏輯
  - 分片讀取合併
  - 分片寫入分發

Task 4: 實作相容性適配器
CREATE src/services/compatibility/LegacyAdapter.ts:
  - 舊格式轉換
  - API 版本控制
  - 欄位映射快取

Task 5: 建立混合查詢引擎
CREATE src/services/query/HybridQueryEngine.ts:
  - Firestore 查詢優化
  - 記憶體過濾
  - 查詢計劃生成
  - 效能監控

Task 6: 實作虛擬滾動欄位列表
CREATE src/components/database/VirtualFieldList.tsx:
  - 虛擬滾動邏輯
  - 欄位分組顯示
  - 智能欄位搜尋
  - 行動版適配

Task 7: 建立欄位使用分析服務
CREATE src/services/analytics/FieldUsageAnalytics.ts:
  - 使用頻率追蹤
  - 索引建議生成
  - 效能報告

Task 8: 實作資料驗證和審計
CREATE src/services/validation/DataIntegrityValidator.ts:
  - 類型一致性檢查
  - 重複資料檢測
  - 轉換審計日誌
  - 資料回滾功能

Task 9: 建立 Cloud Functions
CREATE functions/src/dynamicFields.ts:
  - 文檔大小檢查
  - 自動索引建立
  - 敏感資料加密
  - 使用統計收集

Task 10: 全面測試
CREATE src/tests/dynamicFields/:
  - 單元測試
  - 整合測試
  - 效能測試
  - 安全性測試
```

## Validation Loop

### Level 1: 基礎功能測試
```bash
# TypeScript 編譯
npx tsc --noEmit

# ESLint 檢查
npm run lint

# 單元測試
npm test -- dynamicFields
```

### Level 2: 效能測試
```typescript
// src/tests/performance/dynamicFields.perf.test.ts
describe('Dynamic Fields Performance', () => {
  test('應該在 2 秒內處理 100 個欄位', async () => {
    const start = Date.now();
    const fields = generateMockFields(100);
    await analyzer.analyzeFields(fields);
    expect(Date.now() - start).toBeLessThan(2000);
  });
  
  test('文檔大小不應超過 900KB', async () => {
    const doc = generateLargeDocument(100);
    const size = JSON.stringify(doc).length;
    expect(size).toBeLessThan(900000);
  });
});
```

### Level 3: 安全性測試
```typescript
// src/tests/security/dynamicFields.security.test.ts
describe('Dynamic Fields Security', () => {
  test('應該檢測信用卡號', () => {
    const values = ['4111-1111-1111-1111', 'test'];
    expect(detector.hasSensitiveData(values)).toBe(true);
  });
  
  test('應該防止欄位名稱注入', () => {
    const malicious = '../../../etc/passwd';
    const safe = analyzer.sanitizeFieldName(malicious);
    expect(safe).not.toContain('..');
  });
});
```

### Level 4: 整合測試
```bash
# 啟動模擬器
firebase emulators:start

# 執行整合測試
npm run test:integration

# 測試場景
1. 上傳 100+ 欄位的 CSV
2. 測試查詢效能
3. 測試向後相容性
4. 測試分片儲存
```

## Monitoring & Alerts
```typescript
// 監控指標
const METRICS = {
  fieldCount: 'dynamic_fields.count',
  queryTime: 'dynamic_fields.query_time',
  documentSize: 'dynamic_fields.doc_size',
  errorRate: 'dynamic_fields.error_rate'
};

// 警報閾值
const ALERTS = {
  maxFieldCount: 100,
  maxQueryTime: 2000, // ms
  maxDocSize: 900000, // bytes
  maxErrorRate: 0.01 // 1%
};
```

## Rollback Plan
```yaml
如果出現嚴重問題：
1. 功能開關：ENABLE_DYNAMIC_FIELDS = false
2. 回滾到固定欄位模式
3. 保留已匯入的資料（在 customFields 中）
4. 通知受影響的用戶
5. 分析問題並修復
```

## Final Validation Checklist
- [ ] 所有測試通過（單元、整合、效能、安全）
- [ ] 文檔大小限制有效
- [ ] 敏感資料檢測正常
- [ ] 查詢效能符合 SLA（<2秒）
- [ ] 向後相容性確認
- [ ] Firebase 規則已更新
- [ ] Cloud Functions 已部署
- [ ] 監控和警報已設置
- [ ] 回滾計劃已測試
- [ ] 用戶文檔已更新

## Anti-Patterns to Avoid
- ❌ 不要信任用戶輸入的欄位名稱（必須清理）
- ❌ 不要無限制地接受欄位數量
- ❌ 不要在前端儲存敏感欄位
- ❌ 不要忽略文檔大小限制
- ❌ 不要跳過類型驗證
- ❌ 不要假設欄位順序不變
- ❌ 不要在主線程處理大量欄位
- ❌ 不要忽略行動裝置限制

---

**信心評分：9/10**

**優勢**：
- 完整的風險分析和緩解措施
- 階段性實施降低風險
- 效能優化策略明確
- 安全性考慮周全
- 包含監控和回滾計劃

**剩餘風險**：
- 外部搜尋服務整合複雜度
- 初期用戶教育成本
- 可能需要調整 UI 設計