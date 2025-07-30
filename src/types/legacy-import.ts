/**
 * 舊系統資料導入相關類型定義
 * 支援從 Notion 系統批量導入業務人員、客戶資料和訪談記錄
 */

import { ImportResult } from '@/services/firebase/admin/dataImportService';

// 新增：業務代碼對照資料
export interface BusinessCodeMapping {
  業務名稱: string;
  職級: string;
  顧問代碼: string;
  主管清單: string; // 逗號分隔的代碼清單
}

// 業務人員資料（來自 Notion 業務名單）
export interface LegacyUser {
  業務帳號: string;
  公司Gmail帳號?: string;
  你的層級: string; // L0, L1, L2, L3, L4, L5, L6 等
  enabled?: string;
  Phone?: string;
  // Notion 連結欄位（保存到 customFields）
  訪談紀錄資料庫?: string;
  客戶名單資料庫?: string;
  客戶分析資料庫?: string;
  客戶紀念日資料庫?: string;
  成交資料庫?: string;
  // 其他可能的欄位
  [key: string]: any;
}

// 客戶資料（來自 Notion 客戶名單）
export interface LegacyCustomer {
  負責業務: string; // 現在可能是代碼或姓名
  客戶名稱: string;
  公司名稱?: string;
  電子郵件地址?: string;
  聯絡電話?: string;
  // 所有其他欄位都進入 customFields
  年齡?: string;
  年薪?: string;
  職務名稱?: string;
  建議方案?: string;
  銷售階段?: string;
  名單等級?: string;
  金額美金萬?: string;
  進單理由?: string;
  性別?: string;
  等級標籤?: string;
  客戶來源?: string;
  已成交?: string;
  興趣?: string;
  關係?: string;
  年資?: string;
  居住地區?: string;
  醫療險?: string;
  車貸?: string;
  車子?: string;
  股票期貨基金?: string;
  理財習慣?: string;
  理財偏好?: string;
  房貸房租?: string;
  房子土地?: string;
  存款定存?: string;
  想法需求?: string;
  信貸?: string;
  儲蓄險?: string;
  出生年月日?: string;
  加密貨幣?: string;
  婚姻狀況?: string;
  子女?: string;
  // 動態欄位
  [key: string]: any;
}

// 訪談記錄資料（來自 Notion 訪談紀錄）
export interface LegacyRecord {
  標題: string;
  訪談結果: string;
  訪談日期: string; // MM/DD/YYYY 或 YYYY年M月D日 格式
  下次跟進日期?: string;
  業務帳號: string; // 可能是代碼或姓名
  提交時間?: string;
  客戶名單資料庫?: string; // Notion 連結
  建立時間?: string;
  客戶名稱: string;
  匯入時間?: string;
}

// 導入會話狀態管理
export interface LegacyImportSession {
  id: string;
  organizationId: string;
  teamId: string;
  status: 'preparing' | 'mapping' | 'importing' | 'completed' | 'failed';
  files: {
    codeMapping?: { 
      fileName: string; 
      data: BusinessCodeMapping[]; 
    };
    users?: { 
      fileName: string; 
      data: LegacyUser[]; 
    };
    customers?: { 
      fileName: string; 
      data: LegacyCustomer[]; 
    };
    records?: { 
      fileName: string; 
      data: LegacyRecord[]; 
    };
  };
  mappings: {
    codeToName: Map<string, string>;      // 代碼到姓名映射
    nameToCode: Map<string, string>;      // 姓名到代碼映射
    codeToLevel: Map<string, string>;     // 代碼到職級映射
    userNameToId: Map<string, string>;    // 姓名到系統用戶ID映射
    customerNameToId: Map<string, string>;// 客戶名稱到ID映射
  };
  results: {
    codeMapping: ImportResult;
    users: ImportResult;
    customers: ImportResult;
    records: ImportResult;
  };
  createdAt: Date;
  createdBy: string;
  errors: ImportError[];
  warnings: ImportWarning[];
}

// 導入錯誤詳情
export interface ImportError {
  type: 'codeMapping' | 'users' | 'customers' | 'records';
  row: number;
  field?: string;
  message: string;
  data: any;
}

// 導入警告（非致命問題）
export interface ImportWarning {
  type: 'codeMapping' | 'users' | 'customers' | 'records';
  row: number;
  field?: string;
  message: string;
  suggestion?: string;
}

// 欄位映射配置
export interface FieldMapping {
  sourceField: string;  // CSV 欄位名稱
  targetField: string;  // 系統欄位名稱
  transform?: (value: any) => any; // 轉換函數
  required?: boolean;
}

// 導入配置選項
export interface LegacyImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  validateOnly?: boolean;
  batchSize?: number;
  continueOnError?: boolean;
}

// 導入統計結果
export interface LegacyImportStats {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  warningCount: number;
  duration: number; // 毫秒
  averageTimePerRecord: number;
}

// 業務識別結果
export interface BusinessIdentification {
  name: string;
  code: string;
  level?: string;
  found: boolean;
  source: 'code' | 'name' | 'manual';
}

// 日期格式類型
export type DateFormat = 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'YYYY年M月D日' | 'ISO8601';

// 層級到角色的映射類型
export type LevelToRoleMapping = {
  [key: string]: 'salesperson' | 'manager' | 'admin';
};