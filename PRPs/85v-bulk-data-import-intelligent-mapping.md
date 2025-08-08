# PRP: 批量資料匯入與智能映射（Bulk Data Import with Intelligent Mapping）

## 概述
擴展現有的三階段資料匯入系統，加強智能欄位映射、多檔案合併、雙向關聯建立等進階功能。專注於業務資料（客戶、記錄、任務）的大量匯入和遷移。

## 背景與需求
組織通常有大量的歷史資料需要從舊系統遷移，包括：
- 數千筆客戶資料
- 歷史銷售記錄
- 既有任務和會議記錄
- 複雜的關聯關係

目前的匯入系統需要增強以處理更複雜的資料結構和關聯。

## 範圍定義
本 PRP 專注於：
- 智能欄位映射演算法
- 多檔案合併與關聯
- 大量資料批次處理
- 資料驗證與清理

不包含：
- 用戶管理（PRP-84 處理）
- 審計追蹤（PRP-86 處理）

## 實施計畫

### 階段 1：智能映射引擎

#### 1.1 欄位智能識別
```typescript
interface FieldMappingEngine {
  // 使用 AI 和規則引擎識別欄位
  analyzeHeaders(headers: string[]): FieldAnalysis[];
  suggestMapping(source: string, targets: FieldDefinition[]): MappingSuggestion;
  learnFromCorrections(corrections: MappingCorrection[]): void;
}

interface FieldAnalysis {
  header: string;
  detectedType: DataType;
  confidence: number;
  possibleTargets: Array<{
    field: string;
    score: number;
    reason: string;
  }>;
}

// 智能識別規則
const FIELD_PATTERNS = {
  email: /^(email|mail|電子郵件|信箱|e-mail)/i,
  phone: /^(phone|tel|電話|手機|mobile|cell)/i,
  name: /^(name|姓名|名字|客戶名|contact|聯絡人)/i,
  company: /^(company|公司|企業|organization|org)/i,
  date: /^(date|日期|時間|time|created|updated)/i,
  amount: /^(amount|金額|價格|price|cost|total)/i,
  status: /^(status|狀態|state|情況)/i,
  // 更多模式...
};

// AI 輔助映射
async function suggestMappingWithAI(
  sourceHeader: string,
  targetFields: FieldDefinition[]
): Promise<MappingSuggestion> {
  // 使用 embeddings 計算相似度
  const sourceEmbedding = await getEmbedding(sourceHeader);
  const targetEmbeddings = await Promise.all(
    targetFields.map(f => getEmbedding(f.label))
  );
  
  const similarities = targetEmbeddings.map((emb, idx) => ({
    field: targetFields[idx],
    similarity: cosineSimilarity(sourceEmbedding, emb)
  }));
  
  return {
    bestMatch: similarities[0].field,
    confidence: similarities[0].similarity,
    alternatives: similarities.slice(1, 4)
  };
}
```

#### 1.2 資料類型推斷
```typescript
class DataTypeInferrer {
  inferType(values: any[]): DataType {
    const samples = values.filter(v => v != null).slice(0, 100);
    
    const typeScores = {
      email: this.scoreEmail(samples),
      phone: this.scorePhone(samples),
      date: this.scoreDate(samples),
      number: this.scoreNumber(samples),
      boolean: this.scoreBoolean(samples),
      url: this.scoreUrl(samples),
      text: 1.0 // 預設
    };
    
    return Object.entries(typeScores)
      .sort(([,a], [,b]) => b - a)[0][0] as DataType;
  }
  
  private scoreEmail(samples: string[]): number {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return samples.filter(s => emailRegex.test(s)).length / samples.length;
  }
  
  private scorePhone(samples: string[]): number {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const validPhones = samples.filter(s => 
      phoneRegex.test(s) && s.replace(/\D/g, '').length >= 7
    );
    return validPhones.length / samples.length;
  }
  
  private scoreDate(samples: string[]): number {
    const validDates = samples.filter(s => {
      const parsed = new Date(s);
      return !isNaN(parsed.getTime());
    });
    return validDates.length / samples.length;
  }
}
```

### 階段 2：多檔案合併系統

#### 2.1 關聯建立器
```typescript
interface FileRelation {
  sourceFile: number;
  sourceField: string;
  targetFile: number;
  targetField: string;
  relationType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  joinType: 'inner' | 'left' | 'right' | 'full';
}

class RelationBuilder {
  // 自動偵測可能的關聯
  detectRelations(files: ParsedFile[]): FileRelation[] {
    const relations: FileRelation[] = [];
    
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const potentialKeys = this.findCommonKeys(files[i], files[j]);
        
        potentialKeys.forEach(key => {
          relations.push({
            sourceFile: i,
            sourceField: key.field1,
            targetFile: j,
            targetField: key.field2,
            relationType: this.detectRelationType(files[i], files[j], key),
            joinType: 'left'
          });
        });
      }
    }
    
    return relations;
  }
  
  private findCommonKeys(file1: ParsedFile, file2: ParsedFile): CommonKey[] {
    const keys: CommonKey[] = [];
    
    // 檢查欄位名稱相似度
    file1.headers.forEach(h1 => {
      file2.headers.forEach(h2 => {
        const similarity = this.calculateSimilarity(h1, h2);
        if (similarity > 0.8) {
          keys.push({ field1: h1, field2: h2, similarity });
        }
      });
    });
    
    // 檢查資料內容相似度
    if (keys.length === 0) {
      keys.push(...this.detectByDataOverlap(file1, file2));
    }
    
    return keys;
  }
  
  private detectRelationType(
    file1: ParsedFile,
    file2: ParsedFile,
    key: CommonKey
  ): RelationType {
    const values1 = new Set(file1.data.map(row => row[key.field1]));
    const values2 = new Set(file2.data.map(row => row[key.field2]));
    
    const uniqueRatio1 = values1.size / file1.data.length;
    const uniqueRatio2 = values2.size / file2.data.length;
    
    if (uniqueRatio1 > 0.95 && uniqueRatio2 > 0.95) {
      return 'one-to-one';
    } else if (uniqueRatio1 > 0.95) {
      return 'one-to-many';
    } else {
      return 'many-to-many';
    }
  }
}
```

#### 2.2 資料合併器
```typescript
class DataMerger {
  merge(
    files: ParsedFile[],
    relations: FileRelation[],
    strategy: MergeStrategy
  ): MergedDataset {
    let result = this.prepareBaseTable(files[0]);
    
    relations.forEach(relation => {
      result = this.applyJoin(
        result,
        files[relation.targetFile],
        relation
      );
    });
    
    if (strategy.removeDuplicates) {
      result = this.deduplicateRows(result, strategy.keyFields);
    }
    
    if (strategy.fillMissingValues) {
      result = this.fillMissingData(result, strategy.fillStrategy);
    }
    
    return result;
  }
  
  private applyJoin(
    left: DataTable,
    right: ParsedFile,
    relation: FileRelation
  ): DataTable {
    const joined: DataTable = {
      headers: [...left.headers],
      data: []
    };
    
    // 加入右表的欄位（避免重複）
    right.headers.forEach(header => {
      if (!joined.headers.includes(header)) {
        joined.headers.push(`${right.name}.${header}`);
      }
    });
    
    // 建立索引以加速查找
    const rightIndex = this.buildIndex(right.data, relation.targetField);
    
    // 執行 join
    left.data.forEach(leftRow => {
      const key = leftRow[relation.sourceField];
      const rightRows = rightIndex.get(key) || [];
      
      if (rightRows.length > 0) {
        rightRows.forEach(rightRow => {
          joined.data.push({ ...leftRow, ...rightRow });
        });
      } else if (relation.joinType === 'left' || relation.joinType === 'full') {
        joined.data.push(leftRow);
      }
    });
    
    return joined;
  }
}
```

### 階段 3：批次處理優化

#### 3.1 串流處理器
```typescript
class StreamProcessor {
  async processLargeFile(
    file: File,
    options: ProcessOptions
  ): Promise<void> {
    const CHUNK_SIZE = options.chunkSize || 1000;
    const reader = new FileStreamReader(file);
    
    let buffer: any[] = [];
    let rowCount = 0;
    
    await reader.readByChunks(async (chunk) => {
      buffer.push(...chunk);
      
      if (buffer.length >= CHUNK_SIZE) {
        await this.processBatch(buffer, rowCount);
        rowCount += buffer.length;
        buffer = [];
        
        // 更新進度
        if (options.onProgress) {
          options.onProgress({
            processed: rowCount,
            total: options.estimatedTotal,
            percentage: (rowCount / options.estimatedTotal) * 100
          });
        }
      }
    });
    
    // 處理剩餘資料
    if (buffer.length > 0) {
      await this.processBatch(buffer, rowCount);
    }
  }
  
  private async processBatch(
    data: any[],
    startIndex: number
  ): Promise<void> {
    const batch = writeBatch(db);
    
    data.forEach((row, index) => {
      const docRef = doc(collection(db, this.targetCollection));
      batch.set(docRef, {
        ...row,
        _importIndex: startIndex + index,
        _importedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
  }
}
```

#### 3.2 並行處理
```typescript
class ParallelImporter {
  async importWithWorkers(
    files: File[],
    options: ImportOptions
  ): Promise<ImportResult> {
    const WORKER_COUNT = options.workerCount || 4;
    const workers: Worker[] = [];
    
    // 建立 worker pool
    for (let i = 0; i < WORKER_COUNT; i++) {
      workers.push(new Worker('/workers/import-worker.js'));
    }
    
    // 分配檔案給 workers
    const fileQueue = [...files];
    const results: ImportResult[] = [];
    
    await Promise.all(workers.map(async (worker, idx) => {
      while (fileQueue.length > 0) {
        const file = fileQueue.shift();
        if (!file) break;
        
        const result = await this.processWithWorker(worker, file);
        results.push(result);
      }
    }));
    
    // 清理 workers
    workers.forEach(w => w.terminate());
    
    return this.mergeResults(results);
  }
}
```

### 階段 4：資料驗證與清理

#### 4.1 驗證規則引擎
```typescript
interface ValidationRule {
  field: string;
  type: 'required' | 'unique' | 'format' | 'range' | 'custom';
  config: any;
  errorMessage: string;
}

class ValidationEngine {
  private rules: Map<string, ValidationRule[]> = new Map();
  
  addRule(collection: string, rule: ValidationRule) {
    if (!this.rules.has(collection)) {
      this.rules.set(collection, []);
    }
    this.rules.get(collection)!.push(rule);
  }
  
  async validate(
    collection: string,
    data: any[]
  ): Promise<ValidationResult> {
    const rules = this.rules.get(collection) || [];
    const errors: ValidationError[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      for (const rule of rules) {
        const isValid = await this.validateField(row[rule.field], rule);
        
        if (!isValid) {
          errors.push({
            row: i,
            field: rule.field,
            value: row[rule.field],
            rule: rule.type,
            message: rule.errorMessage
          });
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      validRows: data.length - errors.length,
      totalRows: data.length
    };
  }
  
  private async validateField(value: any, rule: ValidationRule): Promise<boolean> {
    switch (rule.type) {
      case 'required':
        return value != null && value !== '';
      
      case 'unique':
        return await this.checkUniqueness(value, rule.field, rule.config.collection);
      
      case 'format':
        return new RegExp(rule.config.pattern).test(value);
      
      case 'range':
        const num = Number(value);
        return num >= rule.config.min && num <= rule.config.max;
      
      case 'custom':
        return await rule.config.validator(value);
      
      default:
        return true;
    }
  }
}
```

#### 4.2 資料清理器
```typescript
class DataCleaner {
  clean(data: any[], rules: CleaningRule[]): any[] {
    return data.map(row => {
      const cleaned = { ...row };
      
      rules.forEach(rule => {
        if (cleaned[rule.field] !== undefined) {
          cleaned[rule.field] = this.applyCleaningRule(
            cleaned[rule.field],
            rule
          );
        }
      });
      
      return cleaned;
    });
  }
  
  private applyCleaningRule(value: any, rule: CleaningRule): any {
    switch (rule.type) {
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      
      case 'remove_special':
        return typeof value === 'string' 
          ? value.replace(/[^a-zA-Z0-9\s]/g, '')
          : value;
      
      case 'normalize_phone':
        return this.normalizePhone(value);
      
      case 'normalize_date':
        return this.normalizeDate(value);
      
      case 'default_value':
        return value == null || value === '' ? rule.config.default : value;
      
      default:
        return value;
    }
  }
  
  private normalizePhone(phone: string): string {
    // 移除所有非數字字元
    let normalized = phone.replace(/\D/g, '');
    
    // 台灣手機號碼格式化
    if (normalized.startsWith('886')) {
      normalized = '0' + normalized.slice(3);
    }
    
    if (normalized.length === 10 && normalized.startsWith('09')) {
      return `${normalized.slice(0, 4)}-${normalized.slice(4, 7)}-${normalized.slice(7)}`;
    }
    
    return phone;
  }
  
  private normalizeDate(date: any): Date | null {
    if (!date) return null;
    
    // 嘗試多種日期格式
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    ];
    
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    // 嘗試其他解析方式...
    return null;
  }
}
```

### 階段 5：UI/UX 增強

#### 5.1 視覺化映射介面
```
+----------------------------------------------------------+
| 🔄 智能欄位映射                                          |
+----------------------------------------------------------+
| 來源檔案：customers.csv                                  |
| 目標資料庫：客戶                                         |
|                                                          |
| 來源欄位          →  目標欄位        信心度              |
| ─────────────────────────────────────────────────────── |
| Customer Name     →  客戶姓名        95% ✅             |
| Email Address     →  電子郵件        98% ✅             |
| Phone Number      →  [選擇欄位 ▼]    75% ⚠️             |
|                      建議：電話                          |
| Company           →  公司名稱        92% ✅             |
| Last Contact      →  最後聯絡日期    88% ✅             |
| Sales Rep         →  [建立新欄位]    -- 🆕              |
|                                                          |
| 📌 未映射的必填欄位：                                    |
| • 客戶狀態 - 設定預設值: [活躍 ▼]                       |
| • 建立日期 - 使用: [匯入日期 ▼]                         |
|                                                          |
| [AI 建議全部] [手動調整] [重置]                          |
+----------------------------------------------------------+
```

#### 5.2 進度與錯誤報告
```
+----------------------------------------------------------+
| 📊 匯入進度                                              |
+----------------------------------------------------------+
| 總進度：[████████████░░░░░░] 65%                        |
|                                                          |
| 檔案處理：                                               |
| ✅ customers.csv    1,000 筆  100%                      |
| ⏳ orders.csv       2,500 筆   45%                      |
| ⏸️ tasks.csv         500 筆    0%                       |
|                                                          |
| 📈 統計：                                                |
| • 已處理：3,500 筆                                       |
| • 成功：3,420 筆 (97.7%)                                |
| • 錯誤：80 筆 (2.3%)                                    |
|                                                          |
| ⚠️ 錯誤摘要：                                            |
| • 重複記錄：45 筆 [查看]                                 |
| • 格式錯誤：20 筆 [查看]                                 |
| • 缺少必填：15 筆 [查看]                                 |
|                                                          |
| [暫停] [匯出錯誤報告] [繼續]                             |
+----------------------------------------------------------+
```

## 實作步驟

### 第一天：智能映射引擎
1. 實作欄位識別演算法
2. 建立 AI 輔助映射
3. 資料類型推斷系統

### 第二天：多檔案處理
1. 關聯偵測器
2. 資料合併邏輯
3. 衝突解決機制

### 第三天：批次處理
1. 串流處理實作
2. 並行匯入系統
3. 進度追蹤機制

### 第四天：驗證與清理
1. 驗證規則引擎
2. 資料清理器
3. 錯誤報告生成

### 第五天：整合與測試
1. UI 元件整合
2. 端到端測試
3. 效能優化

## 成功指標

1. **效能指標**
   - [ ] 每秒處理 > 1000 筆記錄
   - [ ] 支援 > 100MB 檔案
   - [ ] 記憶體使用 < 500MB

2. **準確度指標**
   - [ ] 欄位映射準確率 > 90%
   - [ ] 資料類型識別 > 95%
   - [ ] 關聯偵測準確率 > 85%

3. **使用體驗**
   - [ ] 映射建議即時顯示
   - [ ] 錯誤訊息清晰
   - [ ] 可隨時暫停/恢復

## 相關 PRP

- PRP-03: SuperAdmin 組織管理中心
- PRP-84: 組織入職精靈（用戶管理）
- PRP-86: 組織審計日誌系統（追蹤）

---

**優先級**: 高
**預估時間**: 5 天
**依賴項**: 現有 ImportWizard 元件
**實作信心度**: 8/10