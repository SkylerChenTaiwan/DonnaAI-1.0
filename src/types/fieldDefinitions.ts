/**
 * 動態欄位定義類型
 * 用於建立可自訂的表單欄位系統
 */

import { Timestamp } from 'firebase/firestore';

/**
 * 欄位類型定義
 */
export type FieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'email'
  | 'phone'
  | 'url'
  | 'textarea'
  | 'tags';

/**
 * 驗證規則類型
 */
export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'minLength' | 'maxLength' | 'custom';
  value: any;
  message: string;
}

/**
 * 單一欄位配置
 */
export interface FieldConfig {
  key: string;                      // 欄位唯一識別碼 (不可變)
  label: string;                    // 顯示標籤 (可變)
  type: FieldType;                  // 欄位類型
  required: boolean;                // 是否必填
  order: number;                    // 顯示順序
  defaultValue?: any;               // 預設值
  placeholder?: string;             // 輸入提示文字
  validation?: ValidationRule[];    // 驗證規則
  options?: SelectOption[];         // 下拉選單選項 (用於 select/multiselect)
  visible: boolean;                 // 是否顯示
  description?: string;             // 欄位說明
  group?: string;                   // 欄位分組
}

/**
 * 下拉選單選項
 */
export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

/**
 * 欄位定義文檔 (Firestore 結構)
 */
export interface FieldDefinition {
  id: string;
  collectionName: 'customers' | 'tasks' | 'records';
  fields: FieldConfig[];
  version: number;
  isActive: boolean;                // 是否為當前使用版本
  organizationId: string;           // 所屬組織
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;                // 建立者 ID
  updatedBy: string;                // 最後更新者 ID
  description?: string;             // 版本說明
}

/**
 * 欄位定義快取結構
 */
export interface FieldDefinitionCache {
  fields: FieldConfig[];
  timestamp: number;
}

/**
 * 動態表單資料結構
 */
export interface DynamicFormData {
  [key: string]: any;
}

/**
 * 表單驗證錯誤
 */
export interface FormErrors {
  [key: string]: string;
}

/**
 * CSV 欄位映射
 */
export interface CSVFieldMapping {
  csvHeader: string;      // CSV 檔案的欄位名稱
  fieldKey: string;       // 系統內部的欄位 key
  fieldLabel: string;     // 顯示標籤
  isRequired: boolean;    // 是否必填
}

/**
 * 預設欄位定義 - 客戶
 */
export const DEFAULT_CUSTOMER_FIELDS: FieldConfig[] = [
  {
    key: 'name',
    label: '客戶姓名',
    type: 'text',
    required: true,
    order: 1,
    placeholder: '請輸入客戶姓名',
    visible: true,
    validation: [
      { type: 'minLength', value: 2, message: '姓名至少需要2個字元' },
      { type: 'maxLength', value: 50, message: '姓名不能超過50個字元' }
    ]
  },
  {
    key: 'company',
    label: '公司名稱',
    type: 'text',
    required: false,
    order: 2,
    placeholder: '請輸入公司名稱',
    visible: true
  },
  {
    key: 'phone',
    label: '聯絡電話',
    type: 'phone',
    required: false,
    order: 3,
    placeholder: '請輸入電話號碼',
    visible: true
  },
  {
    key: 'email',
    label: '電子郵件',
    type: 'email',
    required: false,
    order: 4,
    placeholder: '請輸入電子郵件',
    visible: true,
    validation: [
      { type: 'pattern', value: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$', message: '請輸入有效的電子郵件' }
    ]
  }
];

/**
 * 預設欄位定義 - 任務
 */
export const DEFAULT_TASK_FIELDS: FieldConfig[] = [
  {
    key: 'title',
    label: '任務標題',
    type: 'text',
    required: true,
    order: 1,
    placeholder: '請輸入任務標題',
    visible: true
  },
  {
    key: 'description',
    label: '任務說明',
    type: 'textarea',
    required: false,
    order: 2,
    placeholder: '請詳細說明任務內容',
    visible: true
  },
  {
    key: 'dueDate',
    label: '到期日期',
    type: 'date',
    required: false,
    order: 3,
    visible: true
  },
  {
    key: 'priority',
    label: '優先級',
    type: 'select',
    required: false,
    order: 4,
    visible: true,
    defaultValue: 'medium',
    options: [
      { label: '高', value: 'high' },
      { label: '中', value: 'medium' },
      { label: '低', value: 'low' }
    ]
  },
  {
    key: 'status',
    label: '狀態',
    type: 'select',
    required: false,
    order: 5,
    visible: true,
    defaultValue: 'pending',
    options: [
      { label: '待處理', value: 'pending' },
      { label: '進行中', value: 'in_progress' },
      { label: '已完成', value: 'completed' },
      { label: '已取消', value: 'cancelled' }
    ]
  }
];

/**
 * 取得預設欄位定義
 */
export function getDefaultFieldDefinitions(collectionName: string): FieldConfig[] {
  switch (collectionName) {
    case 'customers':
      return DEFAULT_CUSTOMER_FIELDS;
    case 'tasks':
      return DEFAULT_TASK_FIELDS;
    default:
      return [];
  }
}

/**
 * 欄位類型對應的 HTML input type
 */
export const FIELD_TYPE_TO_INPUT_TYPE: Record<FieldType, string> = {
  text: 'text',
  number: 'number',
  date: 'date',
  datetime: 'datetime-local',
  select: 'select',
  multiselect: 'select',
  boolean: 'checkbox',
  email: 'email',
  phone: 'tel',
  url: 'url',
  textarea: 'textarea',
  tags: 'text'
};