# 動態欄位映射系統使用指南

## 概述

動態欄位映射系統提供了完整的 TypeScript 類型定義，用於處理 CSV 檔案匯入、欄位映射、資料驗證和分片儲存。本系統考慮了 Firestore 的限制，並提供了嚴格的類型安全保證。

## 核心功能

### 1. 動態欄位配置
- 支援 12 種資料類型（text, number, date, email, phone, boolean 等）
- 欄位級別的安全設定（public, internal, confidential, restricted）
- 完整的驗證規則系統
- 使用統計追蹤

### 2. CSV 分析
- 自動偵測欄位類型
- 資料品質評估
- 統計分析
- AI 增強的語意理解

### 3. 欄位映射
- 視覺化映射配置
- 資料轉換規則
- AI 輔助映射建議
- 版本控制

### 4. 分片儲存
- 自動處理 Firestore 1MB 文檔限制
- 多種分片策略（size, count, field, hash）
- 分片資訊追蹤

## 使用範例

### 基本使用流程

```typescript
import {
  DynamicFieldConfig,
  CSVAnalysisResult,
  FieldMappingConfig,
  ImportConfig,
  AnalyzeCSVRequest,
  CreateMappingRequest,
  ExecuteImportRequest,
  isValidFieldDataType,
  requiresSharding,
  DEFAULT_SHARDING_CONFIG
} from '@/types/dynamic-field-mapping';

// 1. 分析 CSV 檔案
async function analyzeCSV(fileData: string): Promise<CSVAnalysisResult> {
  const request: AnalyzeCSVRequest = {
    fileData,
    fileType: 'base64',
    options: {
      maxRows: 1000,
      useAI: true,
      targetEntity: 'customer',
      encoding: 'UTF-8',
      delimiter: ','
    }
  };
  
  const response = await api.analyzeCSV(request);
  return response.result;
}

// 2. 建立欄位映射
async function createFieldMapping(
  analysisResult: CSVAnalysisResult
): Promise<FieldMappingConfig> {
  const request: CreateMappingRequest = {
    name: '客戶資料映射',
    analysisId: analysisResult.id,
    mappings: analysisResult.detectedFields.map(field => ({
      sourceField: field.originalName,
      targetField: field.cleanedName,
      isRequired: field.nullCount === 0,
      transformer: getTransformer(field.inferredType),
      defaultValue: getDefaultValue(field.inferredType),
      aiAssisted: {
        confidence: field.typeConfidence,
        reasoning: `自動偵測為 ${field.inferredType} 類型`
      }
    })),
    options: {
      autoCreateFields: true,
      validateMapping: true
    }
  };
  
  const response = await api.createMapping(request);
  return response.mapping;
}

// 3. 執行匯入
async function executeImport(
  mappingConfig: FieldMappingConfig
): Promise<string> {
  const request: ExecuteImportRequest = {
    configId: mappingConfig.id,
    mode: 'immediate',
    overrides: {
      batchSize: 200,
      dryRun: false,
      parallel: true,
      parallelWorkers: 4
    }
  };
  
  const response = await api.executeImport(request);
  return response.taskId;
}
```

### 建立動態欄位配置

```typescript
// 建立客戶姓名欄位
const customerNameField: DynamicFieldConfig = {
  id: generateId(),
  fieldKey: 'customer_name',
  displayName: '客戶姓名',
  dataType: 'text',
  description: '客戶的完整姓名',
  defaultValue: '',
  isSystem: false,
  isActive: true,
  isSearchable: true,
  isSortable: true,
  validationRules: [
    {
      type: 'required',
      message: '客戶姓名為必填',
      severity: 'error'
    },
    {
      type: 'maxLength',
      value: 100,
      message: '姓名長度不能超過 100 字元',
      severity: 'warning'
    }
  ],
  formatting: {
    textTransform: 'capitalize'
  },
  security: {
    level: 'internal',
    readRoles: ['admin', 'sales', 'support'],
    writeRoles: ['admin', 'sales'],
    encrypted: false,
    auditLog: true,
    isPII: true  // 標記為個人識別資訊
  },
  usage: {
    usageCount: 0,
    nullRatio: 0,
    uniqueValueCount: 0
  },
  metadata: {
    createdBy: currentUser.id,
    createdAt: Timestamp.now(),
    updatedBy: currentUser.id,
    updatedAt: Timestamp.now(),
    tags: ['customer', 'required', 'pii']
  }
};

// 建立電話號碼欄位
const phoneField: DynamicFieldConfig = {
  id: generateId(),
  fieldKey: 'phone',
  displayName: '聯絡電話',
  dataType: 'phone',
  isSystem: false,
  isActive: true,
  isSearchable: true,
  isSortable: false,
  validationRules: [
    {
      type: 'pattern',
      value: '^[\\d\\s\\-\\+\\(\\)]+$',
      message: '請輸入有效的電話號碼',
      severity: 'error'
    }
  ],
  formatting: {
    customFormatter: 'formatPhoneNumber'
  },
  security: {
    level: 'confidential',
    readRoles: ['admin', 'sales'],
    writeRoles: ['admin', 'sales'],
    encrypted: true,  // 加密儲存
    auditLog: true,
    isPII: true
  },
  usage: {
    usageCount: 0,
    nullRatio: 0.3,  // 30% 的記錄沒有電話
    uniqueValueCount: 0
  },
  metadata: {
    createdBy: currentUser.id,
    createdAt: Timestamp.now(),
    updatedBy: currentUser.id,
    updatedAt: Timestamp.now(),
    source: 'customers.csv',
    originalName: 'Phone Number'
  }
};
```

### 處理大型資料與分片

```typescript
import { 
  ShardingConfig, 
  ShardedDocument,
  requiresSharding,
  FIRESTORE_LIMITS 
} from '@/types/dynamic-field-mapping';

class DataShardingService {
  private config: ShardingConfig = {
    enabled: true,
    strategy: 'size',
    maxShardSize: 500000, // 500KB
    maxRecordsPerShard: 1000
  };
  
  /**
   * 將大型資料分片儲存
   */
  async saveWithSharding<T>(
    collection: string,
    documentId: string,
    data: T[]
  ): Promise<void> {
    if (!requiresSharding(data, this.config)) {
      // 資料夠小，直接儲存
      await firestore.collection(collection).doc(documentId).set({
        data,
        sharded: false
      });
      return;
    }
    
    // 需要分片
    const shards = this.createShards(data);
    
    // 儲存主文檔
    await firestore.collection(collection).doc(documentId).set({
      sharded: true,
      shardCount: shards.length,
      totalRecords: data.length
    });
    
    // 儲存分片
    const batch = firestore.batch();
    shards.forEach((shard, index) => {
      const shardRef = firestore
        .collection(collection)
        .doc(documentId)
        .collection('shards')
        .doc(`shard-${index}`);
      
      batch.set(shardRef, shard);
    });
    
    await batch.commit();
  }
  
  /**
   * 建立分片
   */
  private createShards<T>(data: T[]): ShardedDocument<T>[] {
    const shards: ShardedDocument<T>[] = [];
    const chunkSize = this.config.maxRecordsPerShard;
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const shardIndex = Math.floor(i / chunkSize);
      
      shards.push({
        parentId: '',  // 將在儲存時設定
        shardInfo: {
          shardId: `shard-${shardIndex}`,
          shardIndex,
          totalShards: Math.ceil(data.length / chunkSize),
          size: JSON.stringify(chunk).length,
          recordCount: chunk.length,
          status: 'active',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        data: chunk,
        metadata: {
          checksum: this.calculateChecksum(chunk),
          compressed: false
        }
      });
    }
    
    return shards;
  }
  
  /**
   * 讀取分片資料
   */
  async readWithSharding<T>(
    collection: string,
    documentId: string
  ): Promise<T[]> {
    const doc = await firestore.collection(collection).doc(documentId).get();
    const docData = doc.data();
    
    if (!docData?.sharded) {
      // 未分片，直接返回
      return docData?.data || [];
    }
    
    // 讀取所有分片
    const shardsSnapshot = await firestore
      .collection(collection)
      .doc(documentId)
      .collection('shards')
      .orderBy('shardInfo.shardIndex')
      .get();
    
    const allData: T[] = [];
    shardsSnapshot.forEach(shardDoc => {
      const shard = shardDoc.data() as ShardedDocument<T>;
      allData.push(...shard.data);
    });
    
    return allData;
  }
  
  private calculateChecksum(data: unknown): string {
    // 實作 checksum 計算
    return crypto.createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
  }
}
```

### 驗證與錯誤處理

```typescript
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  isValidationError,
  isFieldValueEmpty
} from '@/types/dynamic-field-mapping';

class FieldValidator {
  /**
   * 驗證欄位值
   */
  validateField(
    value: unknown,
    config: DynamicFieldConfig
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // 檢查必填
    const requiredRule = config.validationRules.find(r => r.type === 'required');
    if (requiredRule && isFieldValueEmpty(value)) {
      errors.push({
        code: 'FIELD_REQUIRED',
        message: requiredRule.message,
        field: config.fieldKey,
        invalidValue: value
      });
    }
    
    // 類型驗證
    if (!isFieldValueEmpty(value)) {
      const typeValid = this.validateType(value, config.dataType);
      if (!typeValid) {
        errors.push({
          code: 'INVALID_TYPE',
          message: `值必須是 ${config.dataType} 類型`,
          field: config.fieldKey,
          invalidValue: value,
          expectedValue: config.dataType
        });
      }
    }
    
    // 執行自定義驗證規則
    config.validationRules.forEach(rule => {
      const result = this.executeRule(value, rule);
      if (!result.valid) {
        if (rule.severity === 'error') {
          errors.push({
            code: `VALIDATION_${rule.type.toUpperCase()}`,
            message: rule.message,
            field: config.fieldKey,
            invalidValue: value
          });
        } else {
          warnings.push({
            code: `WARNING_${rule.type.toUpperCase()}`,
            message: rule.message,
            field: config.fieldKey,
            suggestion: this.getSuggestion(rule.type)
          });
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      statistics: {
        totalFields: 1,
        validFields: errors.length === 0 ? 1 : 0,
        invalidFields: errors.length > 0 ? 1 : 0,
        warningFields: warnings.length > 0 ? 1 : 0
      }
    };
  }
  
  private validateType(value: unknown, dataType: FieldDataType): boolean {
    switch (dataType) {
      case 'text':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
      case 'datetime':
        return value instanceof Date || !isNaN(Date.parse(String(value)));
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
      case 'phone':
        return /^[\d\s\-\+\(\)]+$/.test(String(value));
      case 'url':
        try {
          new URL(String(value));
          return true;
        } catch {
          return false;
        }
      case 'json':
        try {
          JSON.parse(String(value));
          return true;
        } catch {
          return false;
        }
      case 'array':
        return Array.isArray(value);
      case 'currency':
        return /^-?\d+(\.\d{1,2})?$/.test(String(value));
      case 'percentage':
        const num = Number(value);
        return !isNaN(num) && num >= 0 && num <= 100;
      default:
        return true;
    }
  }
  
  private executeRule(
    value: unknown,
    rule: ValidationRule
  ): { valid: boolean } {
    switch (rule.type) {
      case 'required':
        return { valid: !isFieldValueEmpty(value) };
      case 'minLength':
        return { valid: String(value).length >= Number(rule.value) };
      case 'maxLength':
        return { valid: String(value).length <= Number(rule.value) };
      case 'min':
        return { valid: Number(value) >= Number(rule.value) };
      case 'max':
        return { valid: Number(value) <= Number(rule.value) };
      case 'pattern':
        return { valid: new RegExp(String(rule.value)).test(String(value)) };
      case 'enum':
        return { valid: (rule.value as unknown[]).includes(value) };
      default:
        return { valid: true };
    }
  }
  
  private getSuggestion(ruleType: string): string {
    const suggestions: Record<string, string> = {
      minLength: '請輸入更多字元',
      maxLength: '請減少字元數',
      pattern: '請檢查格式是否正確',
      enum: '請從可用選項中選擇'
    };
    return suggestions[ruleType] || '請檢查輸入值';
  }
}
```

### Type Guards 使用

```typescript
import {
  isValidFieldDataType,
  isValidImportStatus,
  isValidationError,
  isFieldValueEmpty
} from '@/types/dynamic-field-mapping';

// 使用 type guards 進行安全的類型檢查
function processFieldType(type: unknown): void {
  if (!isValidFieldDataType(type)) {
    throw new Error(`無效的欄位類型: ${type}`);
  }
  
  // 此時 TypeScript 知道 type 是 FieldDataType
  console.log(`處理欄位類型: ${type}`);
  
  if (type === 'email') {
    // 特殊處理 email 類型
    console.log('套用 email 驗證規則');
  }
}

function handleImportStatus(status: unknown): void {
  if (!isValidImportStatus(status)) {
    console.error('無效的匯入狀態');
    return;
  }
  
  // 此時 TypeScript 知道 status 是 ImportStatus
  switch (status) {
    case 'completed':
      console.log('匯入完成');
      break;
    case 'failed':
      console.error('匯入失敗');
      break;
    case 'importing':
      console.log('匯入進行中...');
      break;
  }
}

function handleError(error: unknown): void {
  if (isValidationError(error)) {
    // 此時 TypeScript 知道 error 有 code 和 message 屬性
    console.error(`驗證錯誤 [${error.code}]: ${error.message}`);
    
    if (error.field) {
      console.error(`錯誤欄位: ${error.field}`);
    }
  } else {
    console.error('未知錯誤:', error);
  }
}
```

## 最佳實踐

### 1. 欄位命名規範
- 使用 snake_case 作為 fieldKey
- 避免使用特殊字元
- 保持名稱簡潔但有意義

### 2. 安全考量
- 標記 PII 欄位
- 設定適當的安全層級
- 啟用審計日誌
- 加密敏感資料

### 3. 效能優化
- 使用批次處理
- 啟用並行處理
- 合理設定分片大小
- 實施快取策略

### 4. 錯誤處理
- 設定合理的錯誤閾值
- 實施重試機制
- 記錄所有錯誤
- 提供有意義的錯誤訊息

## 常見問題

### Q: 如何處理超過 1MB 的資料？
A: 使用分片系統自動將大型資料分割成多個小於 1MB 的文檔。

### Q: 如何確保欄位名稱符合 Firestore 規範？
A: 使用 cleanFieldName 函數清理欄位名稱，移除特殊字元。

### Q: 如何處理不同的日期格式？
A: 在 FieldFormatting 中指定 dateFormat，系統會自動轉換。

### Q: 如何追蹤欄位使用情況？
A: FieldUsageStats 會自動記錄使用次數、空值比例等統計資訊。

## 相關文件

- [Firestore 限制說明](https://firebase.google.com/docs/firestore/quotas)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)
- [CSV 解析最佳實踐](https://www.w3.org/TR/tabular-data-primer/)