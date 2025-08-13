/**
 * 智能匯入系統類型定義
 * 用於批量資料匯入的智能映射和處理
 */

// 資料類型枚舉
export type DataType = 
  | 'email' 
  | 'phone' 
  | 'date' 
  | 'number' 
  | 'boolean' 
  | 'url' 
  | 'text'
  | 'currency'
  | 'percentage'
  | 'address';

// 欄位分析結果
export interface FieldAnalysis {
  header: string;
  detectedType: DataType;
  confidence: number;
  possibleTargets: Array<{
    field: string;
    score: number;
    reason: string;
  }>;
  samples: any[];
  statistics?: {
    uniqueCount: number;
    nullCount: number;
    minLength?: number;
    maxLength?: number;
    averageLength?: number;
  };
}

// 映射建議
export interface MappingSuggestion {
  sourceField: string;
  bestMatch: {
    targetField: string;
    confidence: number;
    method: 'pattern' | 'ai' | 'exact' | 'fuzzy';
  };
  alternatives: Array<{
    targetField: string;
    confidence: number;
    reason: string;
  }>;
  needsTransformation?: {
    type: string;
    description: string;
  };
}

// 映射修正記錄（用於機器學習）
export interface MappingCorrection {
  sourceField: string;
  originalSuggestion: string;
  userCorrection: string;
  context?: {
    fileType: string;
    industry?: string;
    language?: string;
  };
  timestamp: Date;
}

// 檔案關聯
export interface FileRelation {
  sourceFile: number;
  sourceField: string;
  targetFile: number;
  targetField: string;
  relationType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  joinType: 'inner' | 'left' | 'right' | 'full';
  confidence: number;
  matchedSamples?: Array<{
    sourceValue: any;
    targetValue: any;
  }>;
}

// 合併策略
export interface MergeStrategy {
  removeDuplicates: boolean;
  duplicateKeyFields?: string[];
  fillMissingValues: boolean;
  fillStrategy?: 'default' | 'previous' | 'next' | 'average' | 'custom';
  conflictResolution?: 'keep-first' | 'keep-last' | 'merge' | 'custom';
  preserveAllColumns?: boolean;
}

// 驗證規則
export interface ValidationRule {
  field: string;
  type: 'required' | 'unique' | 'format' | 'range' | 'custom' | 'reference';
  config: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    referenceCollection?: string;
    referenceField?: string;
    customValidator?: (value: any) => Promise<boolean>;
    allowNull?: boolean;
  };
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
}

// 驗證結果
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validRows: number;
  totalRows: number;
  fieldStatistics: Map<string, {
    errors: number;
    warnings: number;
  }>;
}

// 驗證錯誤
export interface ValidationError {
  row: number;
  field: string;
  value: any;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

// 清理規則
export interface CleaningRule {
  field: string;
  type: 
    | 'trim' 
    | 'uppercase' 
    | 'lowercase' 
    | 'remove_special'
    | 'normalize_phone'
    | 'normalize_date'
    | 'normalize_email'
    | 'default_value'
    | 'remove_duplicates'
    | 'standardize_address'
    | 'custom';
  config?: {
    default?: any;
    format?: string;
    customCleaner?: (value: any) => any;
    preserveOriginal?: boolean;
  };
}

// 批次處理選項
export interface BatchProcessOptions {
  chunkSize: number;
  parallel?: boolean;
  workerCount?: number;
  onProgress?: (progress: ImportProgress) => void;
  onError?: (error: ImportError) => void;
  retryAttempts?: number;
  retryDelay?: number;
  memoryLimit?: number;
}

// 匯入進度
export interface ImportProgress {
  stage: 'parsing' | 'validating' | 'mapping' | 'importing' | 'complete';
  processed: number;
  total: number;
  percentage: number;
  currentFile?: string;
  currentBatch?: number;
  totalBatches?: number;
  errors: number;
  warnings: number;
  speed?: number; // records per second
  estimatedTimeRemaining?: number; // seconds
  memoryUsage?: number; // MB
}

// 匯入錯誤
export interface ImportError {
  type: 'parse' | 'validation' | 'mapping' | 'import' | 'system';
  message: string;
  row?: number;
  field?: string;
  value?: any;
  suggestion?: string;
  stack?: string;
  recoverable: boolean;
}

// 欄位映射引擎介面
export interface IFieldMappingEngine {
  analyzeHeaders(headers: string[], sampleData?: any[][]): Promise<FieldAnalysis[]>;
  suggestMapping(source: string, targets: any[]): Promise<MappingSuggestion>;
  learnFromCorrections(corrections: MappingCorrection[]): Promise<void>;
  getConfidenceThreshold(): number;
  setConfidenceThreshold(threshold: number): void;
}

// 資料類型推斷器介面
export interface IDataTypeInferrer {
  inferType(values: any[]): DataType;
  inferAllTypes(data: any[][]): Map<string, DataType>;
  getTypeConfidence(values: any[], type: DataType): number;
}

// 關聯建立器介面
export interface IRelationBuilder {
  detectRelations(files: any[]): FileRelation[];
  validateRelation(relation: FileRelation, data1: any[], data2: any[]): boolean;
  optimizeJoinOrder(relations: FileRelation[]): FileRelation[];
}

// 資料合併器介面
export interface IDataMerger {
  merge(files: any[], relations: FileRelation[], strategy: MergeStrategy): any;
  preview(files: any[], relations: FileRelation[], limit?: number): any;
  estimateResultSize(files: any[], relations: FileRelation[]): number;
}

// 驗證引擎介面
export interface IValidationEngine {
  addRule(collection: string, rule: ValidationRule): void;
  removeRule(collection: string, field: string): void;
  validate(collection: string, data: any[]): Promise<ValidationResult>;
  validateField(value: any, rule: ValidationRule): Promise<boolean>;
  getDefaultRules(collection: string): ValidationRule[];
}

// 資料清理器介面
export interface IDataCleaner {
  clean(data: any[], rules: CleaningRule[]): any[];
  cleanField(value: any, rule: CleaningRule): any;
  detectCleaningNeeds(data: any[]): CleaningRule[];
  preview(data: any[], rules: CleaningRule[], limit?: number): any[];
}

// 串流處理器介面
export interface IStreamProcessor {
  processLargeFile(file: File, options: BatchProcessOptions): Promise<void>;
  pause(): void;
  resume(): void;
  cancel(): void;
  getProgress(): ImportProgress;
}

// 智能映射模式定義
export const FIELD_PATTERNS: Record<string, RegExp> = {
  email: /^(email|mail|電子郵件|電郵|信箱|e-mail|邮箱|郵箱)/i,
  phone: /^(phone|tel|電話|手機|mobile|cell|聯絡電話|联系电话|電話號碼)/i,
  name: /^(name|姓名|名字|客戶名|contact|聯絡人|联系人|名稱|稱呼)/i,
  company: /^(company|公司|企業|organization|org|機構|单位|組織)/i,
  date: /^(date|日期|時間|time|created|updated|建立|更新|創建)/i,
  amount: /^(amount|金額|價格|price|cost|total|總計|费用|費用)/i,
  status: /^(status|狀態|state|情況|状态|進度)/i,
  address: /^(address|地址|住址|location|位置|地點)/i,
  description: /^(description|描述|說明|notes|備註|备注|內容|详情)/i,
  id: /^(id|編號|编号|code|代碼|代码|序號)/i,
  gender: /^(gender|性別|sex|性别)/i,
  age: /^(age|年齡|年龄)/i,
  title: /^(title|標題|职位|職稱|头衔|主題)/i,
  department: /^(department|部門|部门|dept|科室)/i,
  tags: /^(tags|標籤|标签|labels|分類|类别)/i };

// 常見資料格式
export const DATA_FORMATS = {
  phoneFormats: [
    /^09\d{8}$/,                    // 台灣手機
    /^0[2-8]\d{7,8}$/,              // 台灣市話
    /^\+886\d{9}$/,                 // 國際格式
    /^\d{3}-\d{3}-\d{4}$/,          // 美國格式
  ],
  emailFormat: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  urlFormat: /^https?:\/\/[^\s]+$/,
  dateFormats: [
    /^\d{4}-\d{2}-\d{2}$/,          // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/,        // MM/DD/YYYY
    /^\d{4}\/\d{2}\/\d{2}$/,        // YYYY/MM/DD
    /^\d{4}年\d{1,2}月\d{1,2}日$/,   // 中文日期
  ] };

// 匯出結果
export interface ImportResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  errors: ImportError[];
  warnings: ImportError[];
  importedIds?: string[];
  duration: number;
  averageSpeed: number;
  peakMemoryUsage: number;
}

// Worker 訊息類型
export interface WorkerMessage {
  type: 'process' | 'validate' | 'clean' | 'progress' | 'error' | 'complete';
  data?: any;
  error?: ImportError;
  progress?: ImportProgress;
}

// 欄位定義擴展（用於動態欄位）
export interface ExtendedFieldDefinition {
  id: string;
  name: string;
  type: DataType;
  label: string;
  required?: boolean;
  unique?: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
  cleaning?: CleaningRule[];
  description?: string;
  examples?: any[];
  aliases?: string[];
  transformations?: Array<{
    from: DataType;
    to: DataType;
    transform: (value: any) => any;
  }>;
}