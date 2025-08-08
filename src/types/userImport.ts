/**
 * 用戶匯入系統類型定義
 * 支援批量用戶匯入、預覽編輯、驗證和處理
 * 整合智能欄位映射功能
 */

import { UploadedFile, MergedTable, MergeConfig } from './import';

/**
 * 用戶匯入階段 - 更新為三階段流程
 */
export type UserImportStage = 'upload' | 'mapping' | 'preview';

/**
 * 匯入錯誤
 */
export interface ImportError {
  row: number;
  email: string;
  error: string;
  field?: string;
  value?: string;
}

/**
 * 匯入的用戶資料
 */
export interface ImportUserData {
  id: string;                    // 臨時 ID 用於編輯
  email: string;                 // 必填
  name: string;                  // 必填  
  role?: 'user' | 'admin';       // 預設 'user'
  department?: string;
  position?: string;
  phoneNumber?: string;
  // 驗證狀態
  isValid: boolean;
  validationErrors: string[];
  isDuplicate: boolean;
  // 編輯狀態
  isEdited: boolean;
  isSelected: boolean;           // 是否選中匯入
}

/**
 * 匯入配置
 */
export interface UserImportConfig {
  defaultRole: 'user' | 'admin';
  skipDuplicates: boolean;
  updateExisting: boolean;
  sendWelcomeEmail: boolean;
  generatePasswords: boolean;
  organizationId: string;
}

/**
 * 匯入進度
 */
export interface UserImportProgress {
  isImporting: boolean;
  totalUsers: number;
  processedUsers: number;
  successCount: number;
  errorCount: number;
  currentUser: string;
  errors: ImportError[];
}

/**
 * 匯入結果
 */
export interface UserImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  errors: ImportError[];
  warnings: string[];
}

/**
 * CSV 解析結果 (用戶特化版)
 */
export interface UserCSVParseResult {
  data: ImportUserData[];
  errors: ImportError[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateCount: number;
}

/**
 * 原始 CSV 用戶資料 (解析前)
 */
export interface RawUserData {
  email?: string;
  name?: string;
  role?: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  phone?: string;         // 支援不同的欄位名稱
  title?: string;         // 支援不同的職位欄位名稱
  [key: string]: string | undefined;     // 支援額外欄位
}

/**
 * 批量操作選項
 */
export interface BatchOperationOptions {
  operation: 'setRole' | 'setDepartment' | 'toggleSelection' | 'clearErrors';
  value?: string;
  targetIds?: string[];  // 如果未指定，則應用到所有用戶
}

/**
 * 用戶編輯事件
 */
export interface UserEditEvent {
  userId: string;
  field: keyof ImportUserData;
  value: string | 'user' | 'admin' | boolean;
  oldValue?: string | 'user' | 'admin' | boolean | undefined;
}

/**
 * 匯入統計
 */
export interface UserImportStats {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  selected: number;
  errors: number;
}

/**
 * 用戶欄位映射
 */
export interface UserFieldMapping {
  sourceField: string;      // 來源檔案的欄位名
  targetField: string;      // 目標用戶屬性
  confidence: number;       // AI 建議的信心度 (0-1)
  isRequired: boolean;      // 是否必填
  dataType: 'email' | 'text' | 'phone' | 'select' | 'date';
  transform?: (value: any) => any;  // 資料轉換函數
  method?: 'pattern' | 'ai' | 'exact' | 'fuzzy' | 'manual'; // 映射方法
}

/**
 * 用戶匯入配置（擴展版）
 */
export interface UserImportConfigExtended extends UserImportConfig {
  fieldMappings: UserFieldMapping[];
  mergeStrategy?: 'left' | 'inner' | 'outer';
  keyField?: string;          // 用於合併的關鍵欄位
  aiAssisted: boolean;        // 是否使用 AI 輔助
  mode: 'simple' | 'advanced'; // 匯入模式
}

/**
 * 用戶匯入精靈狀態
 */
export interface UserImportWizardState {
  stage: UserImportStage;
  mode: 'simple' | 'advanced';
  files: UploadedFile[];
  mergedTable: MergedTable | null;
  mergeConfig: MergeConfig | null;
  mappings: UserFieldMapping[];
  importData: ImportUserData[];
  validationResults: ValidationResult[];
  importProgress: UserImportProgress;
  config: UserImportConfigExtended;
}

/**
 * 驗證結果
 */
export interface ValidationResult {
  field: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 解析後的檔案（用於用戶匯入）
 */
export interface ParsedUserFile extends UploadedFile {
  hasEmailField: boolean;
  hasNameField: boolean;
  suggestedMappings?: UserFieldMapping[];
}