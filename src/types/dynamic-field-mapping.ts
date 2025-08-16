/**
 * 動態欄位映射系統 - 完整類型定義
 * 
 * 支援動態 CSV 欄位映射、類型配置、安全設定和分片儲存
 * 設計考量：
 * - Firestore 文檔大小限制（1MB）
 * - 欄位名稱規範（不能包含特殊字符）
 * - 嚴格的類型安全和 null 處理
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// 基礎類型定義
// ============================================================================

/**
 * 支援的欄位資料類型
 */
export type FieldDataType = 
  | 'text'           // 純文字
  | 'number'         // 數字
  | 'date'           // 日期
  | 'datetime'       // 日期時間
  | 'email'          // 電子郵件
  | 'phone'          // 電話號碼
  | 'url'            // 網址
  | 'boolean'        // 布林值
  | 'json'           // JSON 物件
  | 'array'          // 陣列
  | 'currency'       // 貨幣
  | 'percentage'     // 百分比
  | 'select'         // 單選
  | 'multiselect'    // 多選
  | 'longtext'       // 長文字
  | 'address';       // 地址

/**
 * 欄位驗證規則類型
 */
export type ValidationRuleType = 
  | 'required'       // 必填
  | 'minLength'      // 最小長度
  | 'maxLength'      // 最大長度
  | 'pattern'        // 正則表達式
  | 'min'            // 最小值
  | 'max'            // 最大值
  | 'enum'           // 枚舉值
  | 'custom';        // 自定義驗證

/**
 * 欄位安全層級
 */
export type FieldSecurityLevel = 
  | 'public'         // 公開
  | 'internal'       // 內部使用
  | 'confidential'   // 機密
  | 'restricted';    // 受限（需特殊權限）

/**
 * PII (個人身份資訊) 類型
 */
export type PIIType = 
  | 'email' 
  | 'phone' 
  | 'ssn' 
  | 'creditCard' 
  | 'idNumber' 
  | 'passport' 
  | 'bankAccount';

/**
 * 匯入狀態
 */
export type ImportStatus = 
  | 'pending'        // 等待中
  | 'analyzing'      // 分析中
  | 'mapping'        // 映射中
  | 'validating'     // 驗證中
  | 'importing'      // 匯入中
  | 'completed'      // 完成
  | 'failed'         // 失敗
  | 'cancelled';     // 已取消

// ============================================================================
// 1. 動態欄位配置介面
// ============================================================================

/**
 * 動態欄位配置
 * 定義單一欄位的完整配置資訊
 */
export interface DynamicFieldConfig {
  /** 欄位唯一識別碼 */
  id: string;
  
  /** 欄位鍵值（用於儲存，必須符合 Firestore 規範） */
  fieldKey: string;
  
  /** 欄位顯示名稱 */
  displayName: string;
  
  /** 欄位資料類型 */
  dataType: FieldDataType;
  
  /** 欄位描述 */
  description?: string;
  
  /** 預設值 */
  defaultValue?: unknown;
  
  /** 是否為系統欄位（不可刪除） */
  isSystem: boolean;
  
  /** 是否啟用 */
  isActive: boolean;
  
  /** 是否可搜尋 */
  isSearchable: boolean;
  
  /** 是否可排序 */
  isSortable: boolean;
  
  /** 驗證規則 */
  validationRules: ValidationRule[];
  
  /** 格式化選項 */
  formatting?: FieldFormatting;
  
  /** 安全設定 */
  security: FieldSecurity;
  
  /** 使用統計 */
  usage: FieldUsageStats;
  
  /** 元資料 */
  metadata: FieldMetadata;
}

/**
 * 欄位驗證規則
 */
export interface ValidationRule {
  type: ValidationRuleType;
  value?: unknown;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * 欄位格式化選項
 */
export interface FieldFormatting {
  /** 日期格式（用於 date/datetime 類型） */
  dateFormat?: string;
  
  /** 數字格式（用於 number/currency/percentage） */
  numberFormat?: {
    decimals?: number;
    thousandsSeparator?: string;
    decimalSeparator?: string;
    prefix?: string;
    suffix?: string;
  };
  
  /** 文字轉換 */
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize';
  
  /** 自定義格式化函數名稱 */
  customFormatter?: string;
}

/**
 * 欄位安全設定
 */
export interface FieldSecurity {
  /** 安全層級 */
  level: FieldSecurityLevel;
  
  /** 可讀取的角色 */
  readRoles: string[];
  
  /** 可寫入的角色 */
  writeRoles: string[];
  
  /** 是否加密儲存 */
  encrypted: boolean;
  
  /** 是否需要審計日誌 */
  auditLog: boolean;
  
  /** PII（個人識別資訊）標記 */
  isPII: boolean;
  
  /** PII 類型（如果是 PII） */
  piiType?: PIIType;
  
  /** 遮罩設定 */
  masking?: {
    enabled: boolean;
    pattern: string; // e.g., "****-****-****-{last4}"
  };
}

/**
 * 欄位使用統計
 */
export interface FieldUsageStats {
  /** 使用次數 */
  usageCount: number;
  
  /** 最後使用時間 */
  lastUsedAt?: Timestamp;
  
  /** 空值比例（0-1） */
  nullRatio: number;
  
  /** 唯一值數量 */
  uniqueValueCount: number;
  
  /** 最常見的值（前 10 個） */
  topValues?: Array<{
    value: unknown;
    count: number;
  }>;
}

/**
 * 欄位元資料
 */
export interface FieldMetadata {
  /** 建立者 */
  createdBy: string;
  
  /** 建立時間 */
  createdAt: Timestamp;
  
  /** 最後更新者 */
  updatedBy: string;
  
  /** 最後更新時間 */
  updatedAt: Timestamp;
  
  /** 來源（CSV 檔名、API 等） */
  source?: string;
  
  /** 原始欄位名稱（CSV 中的原始標題） */
  originalName?: string;
  
  /** 標籤 */
  tags?: string[];
  
  /** 自定義屬性 */
  customProperties?: Record<string, unknown>;
}

// ============================================================================
// 2. CSV 分析結果類型
// ============================================================================

/**
 * CSV 分析結果
 */
export interface CSVAnalysisResult {
  /** 分析 ID */
  id: string;
  
  /** 檔案資訊 */
  fileInfo: CSVFileInfo;
  
  /** 偵測到的欄位 */
  detectedFields: DetectedField[];
  
  /** 資料預覽（前 10 筆） */
  dataPreview: Record<string, unknown>[];
  
  /** 資料統計 */
  statistics: CSVStatistics;
  
  /** 資料品質評估 */
  dataQuality: DataQualityAssessment;
  
  /** 分析時間 */
  analyzedAt: Timestamp;
  
  /** 分析耗時（毫秒） */
  processingTime: number;
}

/**
 * CSV 檔案資訊
 */
export interface CSVFileInfo {
  /** 檔案名稱 */
  fileName: string;
  
  /** 檔案大小（bytes） */
  fileSize: number;
  
  /** 編碼 */
  encoding: string;
  
  /** 分隔符號 */
  delimiter: string;
  
  /** 是否有標題列 */
  hasHeader: boolean;
  
  /** 總列數 */
  rowCount: number;
  
  /** 總欄數 */
  columnCount: number;
  
  /** 檔案雜湊值 */
  fileHash: string;
}

/**
 * 偵測到的欄位
 */
export interface DetectedField {
  /** 欄位索引 */
  index: number;
  
  /** 原始欄位名稱 */
  originalName: string;
  
  /** 清理後的欄位名稱 */
  cleanedName: string;
  
  /** 推測的資料類型 */
  inferredType: FieldDataType;
  
  /** 類型推測信心度（0-1） */
  typeConfidence: number;
  
  /** 樣本值 */
  sampleValues: unknown[];
  
  /** 空值數量 */
  nullCount: number;
  
  /** 唯一值數量 */
  uniqueCount: number;
  
  /** 可能的格式 */
  possibleFormats?: string[];
  
  /** AI 推測的語意類型 */
  semanticType?: string;
}

/**
 * CSV 統計資訊
 */
export interface CSVStatistics {
  /** 總記錄數 */
  totalRecords: number;
  
  /** 有效記錄數 */
  validRecords: number;
  
  /** 錯誤記錄數 */
  errorRecords: number;
  
  /** 重複記錄數 */
  duplicateRecords: number;
  
  /** 完整度（非空欄位比例） */
  completeness: number;
  
  /** 各欄位統計 */
  fieldStatistics: Record<string, FieldStatistics>;
}

/**
 * 單一欄位統計
 */
export interface FieldStatistics {
  min?: number | string | Date;
  max?: number | string | Date;
  mean?: number;
  median?: number;
  mode?: unknown;
  standardDeviation?: number;
  nullRatio: number;
  uniqueRatio: number;
}

/**
 * 資料品質評估
 */
export interface DataQualityAssessment {
  /** 整體品質分數（0-100） */
  overallScore: number;
  
  /** 品質問題 */
  issues: DataQualityIssue[];
  
  /** 建議 */
  recommendations: string[];
}

/**
 * 資料品質問題
 */
export interface DataQualityIssue {
  /** 問題類型 */
  type: 'missing_value' | 'invalid_format' | 'outlier' | 'duplicate' | 'inconsistent';
  
  /** 嚴重程度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** 影響的欄位 */
  affectedFields: string[];
  
  /** 影響的記錄數 */
  affectedRecords: number;
  
  /** 問題描述 */
  description: string;
  
  /** 建議修復方式 */
  suggestedFix?: string;
}

// ============================================================================
// 3. 欄位映射類型
// ============================================================================

/**
 * 欄位映射配置
 */
export interface FieldMappingConfig {
  /** 映射 ID */
  id: string;
  
  /** 映射名稱 */
  name: string;
  
  /** 來源系統 */
  sourceSystem: string;
  
  /** 目標實體類型 */
  targetEntity: 'customer' | 'record' | 'product' | 'custom';
  
  /** 欄位映射規則 */
  mappings: FieldMapping[];
  
  /** 轉換規則 */
  transformations: TransformationRule[];
  
  /** 驗證設定 */
  validation: ValidationConfig;
  
  /** 錯誤處理策略 */
  errorHandling: ErrorHandlingStrategy;
  
  /** 映射版本 */
  version: number;
  
  /** 是否啟用 */
  isActive: boolean;
  
  /** 元資料 */
  metadata: {
    createdAt: Timestamp;
    createdBy: string;
    updatedAt: Timestamp;
    updatedBy: string;
    usageCount: number;
    lastUsedAt?: Timestamp;
  };
}

/**
 * 單一欄位映射
 */
export interface FieldMapping {
  /** 來源欄位 */
  sourceField: string;
  
  /** 目標欄位 */
  targetField: string;
  
  /** 是否必要 */
  isRequired: boolean;
  
  /** 轉換函數 */
  transformer?: string;
  
  /** 預設值（當來源為空時） */
  defaultValue?: unknown;
  
  /** 映射條件 */
  condition?: MappingCondition;
  
  /** AI 輔助映射 */
  aiAssisted?: {
    confidence: number;
    alternativeMappings?: string[];
    reasoning?: string;
  };
}

/**
 * 映射條件
 */
export interface MappingCondition {
  /** 條件類型 */
  type: 'equals' | 'contains' | 'regex' | 'expression';
  
  /** 條件值 */
  value: string;
  
  /** 條件欄位（用於跨欄位條件） */
  field?: string;
}

/**
 * 轉換規則
 */
export interface TransformationRule {
  /** 規則 ID */
  id: string;
  
  /** 規則名稱 */
  name: string;
  
  /** 規則類型 */
  type: 'format' | 'calculate' | 'lookup' | 'aggregate' | 'custom';
  
  /** 輸入欄位 */
  inputFields: string[];
  
  /** 輸出欄位 */
  outputField: string;
  
  /** 轉換參數 */
  parameters: Record<string, unknown>;
  
  /** 執行順序 */
  order: number;
}

/**
 * 驗證配置
 */
export interface ValidationConfig {
  /** 是否啟用驗證 */
  enabled: boolean;
  
  /** 驗證規則 */
  rules: ValidationRule[];
  
  /** 驗證失敗時的行為 */
  onFailure: 'skip' | 'abort' | 'flag' | 'default';
  
  /** 允許的錯誤比例（0-1） */
  errorThreshold: number;
}

/**
 * 錯誤處理策略
 */
export interface ErrorHandlingStrategy {
  /** 錯誤時的動作 */
  onError: 'skip' | 'abort' | 'retry' | 'fallback' | 'manual';
  
  /** 重試次數 */
  maxRetries?: number;
  
  /** 重試延遲（毫秒） */
  retryDelay?: number;
  
  /** 備用值策略 */
  fallbackStrategy?: 'default' | 'previous' | 'average' | 'null';
  
  /** 是否記錄錯誤 */
  logErrors: boolean;
  
  /** 是否通知管理員 */
  notifyAdmin: boolean;
}

// ============================================================================
// 4. 匯入配置類型
// ============================================================================

/**
 * 匯入任務配置
 */
export interface ImportConfig {
  /** 配置 ID */
  id: string;
  
  /** 配置名稱 */
  name: string;
  
  /** 配置描述 */
  description?: string;
  
  /** 資料來源 */
  dataSource: DataSource;
  
  /** 映射配置 ID */
  mappingConfigId: string;
  
  /** 匯入選項 */
  options: ImportOptions;
  
  /** 排程設定（如果是定期匯入） */
  schedule?: ImportSchedule;
  
  /** 通知設定 */
  notifications: NotificationConfig;
  
  /** 權限設定 */
  permissions: ImportPermissions;
  
  /** 配置狀態 */
  status: 'draft' | 'active' | 'paused' | 'archived';
  
  /** 元資料 */
  metadata: {
    createdAt: Timestamp;
    createdBy: string;
    updatedAt: Timestamp;
    updatedBy: string;
    lastRunAt?: Timestamp;
    runCount: number;
  };
}

/**
 * 資料來源配置
 */
export interface DataSource {
  /** 來源類型 */
  type: 'file' | 'api' | 'database' | 'storage';
  
  /** 來源設定 */
  config: {
    /** 檔案路徑或 URL */
    location?: string;
    
    /** API 端點 */
    endpoint?: string;
    
    /** 認證資訊 */
    authentication?: {
      type: 'none' | 'basic' | 'bearer' | 'apikey' | 'oauth';
      credentials?: Record<string, string>;
    };
    
    /** 額外參數 */
    parameters?: Record<string, unknown>;
  };
}

/**
 * 匯入選項
 */
export interface ImportOptions {
  /** 批次大小 */
  batchSize: number;
  
  /** 是否允許重複 */
  allowDuplicates: boolean;
  
  /** 重複處理策略 */
  duplicateStrategy: 'skip' | 'update' | 'create' | 'merge';
  
  /** 是否使用交易 */
  useTransaction: boolean;
  
  /** 是否並行處理 */
  parallel: boolean;
  
  /** 並行工作數 */
  parallelWorkers?: number;
  
  /** 超時設定（毫秒） */
  timeout?: number;
  
  /** 是否乾跑（不實際寫入） */
  dryRun: boolean;
}

/**
 * 匯入排程
 */
export interface ImportSchedule {
  /** 排程類型 */
  type: 'once' | 'recurring' | 'cron';
  
  /** 開始時間 */
  startAt: Timestamp;
  
  /** 結束時間 */
  endAt?: Timestamp;
  
  /** 重複間隔（分鐘） */
  interval?: number;
  
  /** Cron 表達式 */
  cronExpression?: string;
  
  /** 時區 */
  timezone: string;
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  /** 成功時通知 */
  onSuccess: boolean;
  
  /** 失敗時通知 */
  onFailure: boolean;
  
  /** 警告時通知 */
  onWarning: boolean;
  
  /** 通知方式 */
  channels: Array<'email' | 'sms' | 'webhook' | 'inapp'>;
  
  /** 收件人 */
  recipients: string[];
  
  /** Webhook URL */
  webhookUrl?: string;
}

/**
 * 匯入權限
 */
export interface ImportPermissions {
  /** 可執行的使用者 */
  allowedUsers: string[];
  
  /** 可執行的角色 */
  allowedRoles: string[];
  
  /** 需要審核 */
  requiresApproval: boolean;
  
  /** 審核者 */
  approvers?: string[];
}

// ============================================================================
// 5. API 請求/回應類型
// ============================================================================

/**
 * 分析 CSV 請求
 */
export interface AnalyzeCSVRequest {
  /** 檔案 URL 或 base64 內容 */
  fileData: string;
  
  /** 檔案類型 */
  fileType: 'url' | 'base64';
  
  /** 分析選項 */
  options?: {
    /** 最大分析列數 */
    maxRows?: number;
    
    /** 是否使用 AI 增強 */
    useAI?: boolean;
    
    /** 目標實體類型（用於更好的欄位推測） */
    targetEntity?: string;
    
    /** 編碼 */
    encoding?: string;
    
    /** 分隔符號 */
    delimiter?: string;
  };
}

/**
 * 分析 CSV 回應
 */
export interface AnalyzeCSVResponse {
  /** 分析結果 */
  result: CSVAnalysisResult;
  
  /** 建議的映射配置 */
  suggestedMappings?: FieldMapping[];
  
  /** 處理時間 */
  processingTime: number;
}

/**
 * 建立映射請求
 */
export interface CreateMappingRequest {
  /** 映射名稱 */
  name: string;
  
  /** 分析結果 ID */
  analysisId: string;
  
  /** 欄位映射 */
  mappings: FieldMapping[];
  
  /** 選項 */
  options?: {
    /** 是否自動建立缺少的欄位 */
    autoCreateFields?: boolean;
    
    /** 是否驗證映射 */
    validateMapping?: boolean;
  };
}

/**
 * 建立映射回應
 */
export interface CreateMappingResponse {
  /** 映射配置 */
  mapping: FieldMappingConfig;
  
  /** 驗證結果 */
  validation?: ValidationResult;
}

/**
 * 執行匯入請求
 */
export interface ExecuteImportRequest {
  /** 匯入配置 ID */
  configId: string;
  
  /** 覆蓋選項 */
  overrides?: Partial<ImportOptions>;
  
  /** 執行模式 */
  mode: 'immediate' | 'scheduled' | 'test';
}

/**
 * 執行匯入回應
 */
export interface ExecuteImportResponse {
  /** 匯入任務 ID */
  taskId: string;
  
  /** 任務狀態 */
  status: ImportStatus;
  
  /** 預估完成時間 */
  estimatedCompletion?: Timestamp;
  
  /** 進度追蹤 URL */
  trackingUrl?: string;
}

/**
 * 匯入進度
 */
export interface ImportProgress {
  /** 任務 ID */
  taskId: string;
  
  /** 當前狀態 */
  status: ImportStatus;
  
  /** 進度百分比（0-100） */
  progress: number;
  
  /** 已處理記錄數 */
  processedRecords: number;
  
  /** 總記錄數 */
  totalRecords: number;
  
  /** 成功記錄數 */
  successCount: number;
  
  /** 失敗記錄數 */
  failureCount: number;
  
  /** 跳過記錄數 */
  skippedCount: number;
  
  /** 當前處理的批次 */
  currentBatch?: number;
  
  /** 總批次數 */
  totalBatches?: number;
  
  /** 錯誤訊息 */
  errors?: ImportError[];
  
  /** 開始時間 */
  startedAt: Timestamp;
  
  /** 預估剩餘時間（秒） */
  estimatedTimeRemaining?: number;
}

// ============================================================================
// 6. 錯誤和驗證類型
// ============================================================================

/**
 * 驗證結果
 */
export interface ValidationResult {
  /** 是否有效 */
  isValid: boolean;
  
  /** 錯誤列表 */
  errors: ValidationError[];
  
  /** 警告列表 */
  warnings: ValidationWarning[];
  
  /** 驗證統計 */
  statistics: {
    totalFields: number;
    validFields: number;
    invalidFields: number;
    warningFields: number;
  };
}

/**
 * 驗證錯誤
 */
export interface ValidationError {
  /** 錯誤代碼 */
  code: string;
  
  /** 錯誤訊息 */
  message: string;
  
  /** 欄位名稱 */
  field?: string;
  
  /** 記錄索引 */
  recordIndex?: number;
  
  /** 錯誤值 */
  invalidValue?: unknown;
  
  /** 預期值或格式 */
  expectedValue?: string;
}

/**
 * 驗證警告
 */
export interface ValidationWarning {
  /** 警告代碼 */
  code: string;
  
  /** 警告訊息 */
  message: string;
  
  /** 欄位名稱 */
  field?: string;
  
  /** 建議 */
  suggestion?: string;
}

/**
 * 匯入錯誤
 */
export interface ImportError {
  /** 錯誤時間 */
  timestamp: Timestamp;
  
  /** 錯誤類型 */
  type: 'validation' | 'transformation' | 'storage' | 'network' | 'permission' | 'unknown';
  
  /** 錯誤代碼 */
  code: string;
  
  /** 錯誤訊息 */
  message: string;
  
  /** 影響的記錄 */
  affectedRecords?: number[];
  
  /** 堆疊追蹤 */
  stackTrace?: string;
  
  /** 是否可重試 */
  retryable: boolean;
  
  /** 錯誤詳情 */
  details?: Record<string, unknown>;
}

// ============================================================================
// 7. 分片儲存類型（解決 Firestore 1MB 限制）
// ============================================================================

/**
 * 分片儲存配置
 */
export interface ShardingConfig {
  /** 是否啟用分片 */
  enabled: boolean;
  
  /** 分片策略 */
  strategy: 'size' | 'count' | 'field' | 'hash';
  
  /** 每個分片的最大大小（bytes） */
  maxShardSize: number;
  
  /** 每個分片的最大記錄數 */
  maxRecordsPerShard: number;
  
  /** 分片欄位（用於 field 策略） */
  shardField?: string;
  
  /** 分片數量（用於 hash 策略） */
  shardCount?: number;
}

/**
 * 分片資訊
 */
export interface ShardInfo {
  /** 分片 ID */
  shardId: string;
  
  /** 分片索引 */
  shardIndex: number;
  
  /** 總分片數 */
  totalShards: number;
  
  /** 分片大小（bytes） */
  size: number;
  
  /** 記錄數 */
  recordCount: number;
  
  /** 分片範圍（用於範圍分片） */
  range?: {
    start: unknown;
    end: unknown;
  };
  
  /** 分片狀態 */
  status: 'active' | 'full' | 'archived';
  
  /** 建立時間 */
  createdAt: Timestamp;
  
  /** 最後更新時間 */
  updatedAt: Timestamp;
}

/**
 * 分片文檔
 */
export interface ShardedDocument<T = unknown> {
  /** 主文檔 ID */
  parentId: string;
  
  /** 分片資訊 */
  shardInfo: ShardInfo;
  
  /** 分片資料 */
  data: T[];
  
  /** 分片元資料 */
  metadata: {
    checksum: string;
    compressed: boolean;
    encryption?: string;
  };
}

// ============================================================================
// Type Guards (類型守衛)
// ============================================================================

/**
 * 檢查是否為有效的欄位資料類型
 */
export function isValidFieldDataType(type: unknown): type is FieldDataType {
  const validTypes: FieldDataType[] = [
    'text', 'number', 'date', 'datetime', 'email', 
    'phone', 'url', 'boolean', 'json', 'array', 
    'currency', 'percentage', 'select', 'multiselect',
    'longtext', 'address'
  ];
  return typeof type === 'string' && validTypes.includes(type as FieldDataType);
}

/**
 * 檢查是否為有效的匯入狀態
 */
export function isValidImportStatus(status: unknown): status is ImportStatus {
  const validStatuses: ImportStatus[] = [
    'pending', 'analyzing', 'mapping', 'validating',
    'importing', 'completed', 'failed', 'cancelled'
  ];
  return typeof status === 'string' && validStatuses.includes(status as ImportStatus);
}

/**
 * 檢查是否為驗證錯誤
 */
export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as any).code === 'string' &&
    typeof (error as any).message === 'string'
  );
}

/**
 * 檢查欄位值是否為空
 */
export function isFieldValueEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
}

/**
 * 檢查是否需要分片
 */
export function requiresSharding(data: unknown, config: ShardingConfig): boolean {
  if (!config.enabled) return false;
  
  const size = JSON.stringify(data).length;
  
  if (config.strategy === 'size' && size > config.maxShardSize) {
    return true;
  }
  
  if (config.strategy === 'count' && Array.isArray(data)) {
    return data.length > config.maxRecordsPerShard;
  }
  
  return false;
}

/**
 * 建立安全的欄位 key
 */
export function createSafeFieldKey(originalName: string): string {
  return originalName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .substring(0, 50); // Firestore 欄位名稱限制
}

/**
 * 計算文檔大小（bytes）
 */
export function calculateDocumentSize(doc: any): number {
  return new Blob([JSON.stringify(doc)]).size;
}

/**
 * 檢查是否為 PII 欄位
 */
export function isPIIField(config: DynamicFieldConfig): boolean {
  return config.security.isPII === true;
}

/**
 * 檢查是否為加密欄位
 */
export function isEncryptedField(config: DynamicFieldConfig): boolean {
  return config.security.encrypted === true;
}

/**
 * 判斷欄位是否應該在核心分片
 */
export function isCoreField(config: DynamicFieldConfig): boolean {
  return (
    config.isSystem ||
    config.isSearchable ||
    config.isSortable ||
    config.usage.usageCount > 100
  );
}

// ============================================================================
// 輔助類型
// ============================================================================

/**
 * 可為空的類型
 */
export type Nullable<T> = T | null;

/**
 * 可選的類型
 */
export type Optional<T> = T | undefined;

/**
 * 深度部分類型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 深度只讀類型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 提取陣列元素類型
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * 非空陣列
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * 字串字面值聯合類型
 */
export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;

// ============================================================================
// 常量定義
// ============================================================================

/**
 * Firestore 限制常量
 */
export const FIRESTORE_LIMITS = {
  /** 文檔最大大小（bytes） */
  MAX_DOCUMENT_SIZE: 1048576, // 1MB
  
  /** 欄位名稱最大長度 */
  MAX_FIELD_NAME_LENGTH: 1500,
  
  /** 單次批次寫入最大數量 */
  MAX_BATCH_SIZE: 500,
  
  /** 單個集合最大文檔數（實際無限制，這是建議值） */
  RECOMMENDED_MAX_DOCS_PER_COLLECTION: 1000000,
  
  /** 索引欄位最大數量 */
  MAX_COMPOSITE_INDEX_FIELDS: 100,
} as const;

/**
 * 預設分片配置
 */
export const DEFAULT_SHARDING_CONFIG: ShardingConfig = {
  enabled: true,
  strategy: 'size',
  maxShardSize: 500000, // 500KB (留餘量給其他欄位)
  maxRecordsPerShard: 1000,
} as const;

/**
 * 預設匯入選項
 */
export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  batchSize: 100,
  allowDuplicates: false,
  duplicateStrategy: 'skip',
  useTransaction: true,
  parallel: false,
  dryRun: false,
} as const;

/**
 * 欄位類型驗證規則映射
 */
export const FIELD_TYPE_VALIDATION_RULES: Record<FieldDataType, ValidationRule[]> = {
  text: [
    { type: 'maxLength', value: 10000, message: '文字長度不能超過 10000 字元', severity: 'error' }
  ],
  number: [
    { type: 'pattern', value: '^-?\\d+(\\.\\d+)?$', message: '必須是有效的數字', severity: 'error' }
  ],
  date: [
    { type: 'pattern', value: '^\\d{4}-\\d{2}-\\d{2}$', message: '日期格式必須為 YYYY-MM-DD', severity: 'error' }
  ],
  datetime: [
    { type: 'pattern', value: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}', message: '日期時間格式不正確', severity: 'error' }
  ],
  email: [
    { type: 'pattern', value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', message: '必須是有效的電子郵件地址', severity: 'error' }
  ],
  phone: [
    { type: 'pattern', value: '^[\\d\\s\\-\\+\\(\\)]+$', message: '必須是有效的電話號碼', severity: 'error' }
  ],
  url: [
    { type: 'pattern', value: '^https?://', message: '必須是有效的網址', severity: 'error' }
  ],
  boolean: [
    { type: 'enum', value: [true, false, 'true', 'false', '1', '0'], message: '必須是布林值', severity: 'error' }
  ],
  json: [
    { type: 'custom', value: 'isValidJSON', message: '必須是有效的 JSON', severity: 'error' }
  ],
  array: [
    { type: 'custom', value: 'isArray', message: '必須是陣列', severity: 'error' }
  ],
  currency: [
    { type: 'pattern', value: '^-?\\d+(\\.\\d{1,2})?$', message: '貨幣格式不正確', severity: 'error' }
  ],
  percentage: [
    { type: 'min', value: 0, message: '百分比不能小於 0', severity: 'error' },
    { type: 'max', value: 100, message: '百分比不能大於 100', severity: 'error' }
  ],
  select: [
    { type: 'enum', value: [], message: '必須是有效的選項', severity: 'error' }
  ],
  multiselect: [
    { type: 'custom', value: 'isValidMultiSelect', message: '必須是有效的多選值', severity: 'error' }
  ],
  longtext: [
    { type: 'maxLength', value: 50000, message: '文字長度不能超過 50000 字元', severity: 'error' }
  ],
  address: [
    { type: 'maxLength', value: 500, message: '地址長度不能超過 500 字元', severity: 'error' }
  ],
} as const;

// ============================================================================
// 匯出所有類型
// ============================================================================

export * from './custom-fields';
export * from './field-interpretations';