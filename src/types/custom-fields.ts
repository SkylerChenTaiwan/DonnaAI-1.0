/**
 * 自訂欄位系統型別定義
 */

import { Timestamp } from 'firebase/firestore';

// 自訂欄位定義
export interface CustomFieldDefinition {
  id: string;
  fieldKey: string;                    // 欄位鍵值（唯一識別碼）
  fieldName: string;                   // 顯示名稱
  fieldType: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  required: boolean;                   // 是否必填
  options?: string[];                  // select/multiselect 的選項
  defaultValue?: any;                  // 預設值
  organizationId: string;              // 所屬組織
  entityType: 'customer' | 'record';   // 適用的實體類型
  createdBy: string;                   // 建立者 ID
  createdAt: Timestamp;                // 建立時間
  permissions: {
    canEdit: string[];                 // 可編輯的角色或使用者 ID
  };
  // AI 欄位理解系統
  aiFieldInterpretation?: {
    userDescription: string;           // 使用者輸入的欄位說明
    aiProcessedDescription: string;    // AI 處理後的結構化說明
    extractionRules?: string[];        // AI 提取規則
    examples?: string[];               // 範例值
    synonyms?: string[];               // 同義詞（AI 辨識用）
  };
}

// AI 欄位對應結果
export interface AIFieldMapping {
  fieldKey: string;
  confidence: number;                  // 0-1 的信心分數
  extractedValue: any;
  reason?: string;                     // AI 判斷原因
  requiresConfirmation?: boolean;      // 是否需要使用者確認
  alternatives?: Array<{               // 其他可能的值
    value: any;
    confidence: number;
  }>;
}

// AI 處理確認請求
export interface AIProcessingConfirmation {
  id: string;
  recordId: string;                    // 關聯的紀錄 ID
  customerId?: string;                 // 關聯的客戶 ID
  fieldMappings: AIFieldMapping[];     // AI 建議的欄位對應
  status: 'pending' | 'confirmed' | 'rejected' | 'modified';
  createdAt: Timestamp;
  reviewedAt?: Timestamp;              // 審核時間
  reviewedBy?: string;                 // 審核者 ID
  userModifications?: Record<string, any>; // 使用者修改的值
}

// AI API 請求/回應格式
export interface AIFieldExtractionRequest {
  content: string;                     // 紀錄內容（轉錄文字或摘要）
  fieldDefinitions: Array<{
    fieldKey: string;
    fieldName: string;
    fieldType: string;
    aiInterpretation?: string;         // AI 理解的欄位說明
    examples?: string[];
  }>;
  contextualInfo?: {                   // 額外上下文
    customerName?: string;
    previousRecords?: string[];
  };
}

export interface AIFieldExtractionResponse {
  fieldMappings: AIFieldMapping[];
  processingMetadata: {
    modelUsed: string;
    processingTime: number;
    totalConfidence: number;
  };
  suggestedActions?: string[];         // AI 建議的後續行動
}

// 自訂欄位值類型
export type CustomFieldValue = string | number | boolean | Date | string[];

// 自訂欄位驗證錯誤
export interface CustomFieldValidationError {
  fieldKey: string;
  error: string;
}