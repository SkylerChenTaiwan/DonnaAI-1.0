/**
 * 用戶匯入系統類型定義
 * 支援批量用戶匯入、預覽編輯、驗證和處理
 */

/**
 * 用戶匯入階段
 */
export type UserImportStage = 'upload' | 'preview' | 'configure' | 'importing' | 'complete';

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