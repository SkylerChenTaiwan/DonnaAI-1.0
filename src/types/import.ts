/**
 * 三階段資料匯入系統類型定義
 * 支援多檔案合併、欄位映射、跨資料庫關聯
 */

import { Timestamp } from 'firebase/firestore';
import { FieldType } from './fieldDefinitions';

/**
 * 資料庫類型
 */
export type DatabaseType = 'customers' | 'records' | 'tasks' | 'users';

/**
 * 關聯類型
 */
export type RelationType = 'one-to-one' | 'one-to-many' | 'many-to-many';

/**
 * 欄位關聯定義
 * 定義兩個資料庫欄位之間的關聯關係
 */
export interface FieldRelation {
  id: string;                         // 關聯唯一識別碼
  sourceDatabase: DatabaseType;       // 來源資料庫
  sourceField: string;                // 來源欄位
  targetDatabase: DatabaseType;       // 目標資料庫
  targetField: string;                // 目標欄位
  relationType: RelationType;         // 關聯類型
  bidirectional: boolean;             // 是否雙向關聯
  createdAt: Timestamp;              // 建立時間
  updatedAt?: Timestamp;              // 更新時間
  organizationId: string;            // 所屬組織
  createdBy: string;                 // 建立者
  description?: string;               // 關聯說明
}

/**
 * 上傳的檔案資訊
 */
export interface UploadedFile {
  id: string;                        // 檔案唯一識別碼
  name: string;                      // 檔案名稱
  headers: string[];                 // CSV 標題列
  data: any[];                      // 檔案資料
  keyField: string | null;          // 用於合併的關鍵欄位
  uploadedAt: Date;                 // 上傳時間
  rowCount: number;                 // 資料列數
  encoding?: string;                // 檔案編碼
  size?: number;                    // 檔案大小（bytes）
}

/**
 * 合併後的資料表
 */
export interface MergedTable {
  headers: string[];                 // 合併後的所有欄位
  data: any[];                      // 合併後的資料
  mergeInfo: {                       // 合併資訊
    totalRows: number;               // 總列數
    matchedRows: number;             // 成功匹配的列數
    unmatchedRows: number;           // 未匹配的列數
    duplicateColumns: string[];     // 重複的欄位名稱
  };
}

/**
 * 合併策略
 */
export type MergeStrategy = 
  | 'left'     // 左連接：保留第一個檔案的所有資料
  | 'inner'    // 內連接：只保留匹配的資料
  | 'outer';   // 外連接：保留所有檔案的所有資料

/**
 * 合併配置
 */
export interface MergeConfig {
  files: Array<{
    id: string;                     // 檔案 ID
    keyField: string;               // 該檔案的關鍵欄位
  }>;
  mergeStrategy: MergeStrategy;    // 合併策略
  handleDuplicates?: 'rename' | 'override' | 'skip'; // 重複欄位處理
  caseSensitive?: boolean;         // 關鍵欄位比對是否區分大小寫
}

/**
 * 欄位映射配置
 */
export interface FieldMapping {
  sourceColumn: string;            // CSV 來源欄位
  targetField: string;             // 目標系統欄位
  isNew: boolean;                  // 是否為新建欄位
  fieldType?: FieldType;           // 新欄位的類型
  customLabel?: string;            // 自訂標籤
  transform?: 'none' | 'uppercase' | 'lowercase' | 'trim' | 'date'; // 資料轉換
  defaultValue?: any;              // 空值的預設值
}

/**
 * 匯入精靈狀態
 */
export interface ImportWizardState {
  // 當前階段
  stage: 1 | 2 | 3;
  
  // 階段 1: 選擇目標資料庫
  targetDatabase: DatabaseType | null;
  existingFieldsLoaded: boolean;
  
  // 階段 2: 檔案上傳與合併
  uploadedFiles: UploadedFile[];
  mergeConfig: MergeConfig | null;
  mergedTable: MergedTable | null;
  
  // 階段 3: 欄位映射與關聯
  fieldMappings: FieldMapping[];
  fieldRelations: FieldRelation[];
  
  // 匯入選項
  importOptions: {
    skipDuplicates: boolean;        // 跳過重複資料
    updateExisting: boolean;        // 更新現有資料
    batchSize: number;              // 批次處理大小
    validateBeforeImport: boolean;  // 匯入前驗證
    createBackup: boolean;          // 建立備份
  };
  
  // 匯入進度
  importProgress: {
    isImporting: boolean;
    totalRows: number;
    processedRows: number;
    successCount: number;
    errorCount: number;
    errors: ImportError[];
  };
}

/**
 * 匯入錯誤
 */
export interface ImportError {
  row: number;                     // 錯誤所在列
  column?: string;                 // 錯誤所在欄位
  message: string;                 // 錯誤訊息
  data?: any;                      // 相關資料
  type: 'validation' | 'parse' | 'permission' | 'duplicate' | 'unknown';
}

/**
 * 關鍵欄位候選
 * 系統自動偵測可能作為關鍵欄位的欄位
 */
export interface KeyFieldCandidate {
  field: string;                   // 欄位名稱
  uniqueCount: number;            // 唯一值數量
  totalCount: number;             // 總值數量
  uniquenessRatio: number;        // 唯一性比例 (0-1)
  hasNulls: boolean;              // 是否包含空值
  confidence: 'high' | 'medium' | 'low'; // 建議信心度
  reason: string;                 // 建議原因
}

/**
 * 匯入歷史記錄
 */
export interface ImportHistory {
  id: string;
  organizationId: string;
  userId: string;
  targetDatabase: DatabaseType;
  importedAt: Timestamp;
  totalRows: number;
  successCount: number;
  errorCount: number;
  fileNames: string[];
  fieldMappings: FieldMapping[];
  fieldRelations: FieldRelation[];
  duration: number;                // 匯入耗時（毫秒）
  status: 'completed' | 'partial' | 'failed';
}

/**
 * 匯入範本
 * 儲存常用的匯入配置
 */
export interface ImportTemplate {
  id: string;
  name: string;
  description?: string;
  targetDatabase: DatabaseType;
  fieldMappings: FieldMapping[];
  fieldRelations: FieldRelation[];
  organizationId: string;
  createdBy: string;
  createdAt: Timestamp;
  lastUsed?: Timestamp;
  useCount: number;
}

/**
 * 資料預覽
 */
export interface DataPreview {
  headers: string[];
  rows: any[][];                   // 前幾行資料預覽
  totalRows: number;
  hasMore: boolean;
}

/**
 * 欄位統計資訊
 */
export interface FieldStatistics {
  field: string;
  type: FieldType;
  nonNullCount: number;
  nullCount: number;
  uniqueValues: number;
  minLength?: number;
  maxLength?: number;
  minValue?: any;
  maxValue?: any;
  sampleValues: any[];
}

/**
 * 關聯驗證結果
 */
export interface RelationValidation {
  relation: FieldRelation;
  isValid: boolean;
  issues: Array<{
    type: 'missing_target' | 'type_mismatch' | 'circular' | 'duplicate';
    message: string;
    severity: 'error' | 'warning';
  }>;
  affectedRows: number[];
}

/**
 * 匯入工作
 * 用於追蹤非同步匯入任務
 */
export interface ImportJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;                // 0-100
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  result?: {
    successCount: number;
    errorCount: number;
    errors: ImportError[];
  };
  cancelToken?: string;           // 用於取消工作
}