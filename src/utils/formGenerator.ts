/**
 * 表格欄位轉表單工具
 * 將資料表格的欄位定義轉換為動態表單欄位
 */

import { TableColumn } from '@/components/common/DataTable';

export interface FormFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'number';
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select type
  validation?: (value: string) => string | null;
}

/**
 * 根據欄位名稱推斷欄位類型
 */
const inferFieldType = (key: string, title: string): FormFieldConfig['type'] => {
  const lowerKey = key.toLowerCase();
  const lowerTitle = title.toLowerCase();
  
  // Email 欄位
  if (lowerKey.includes('email') || lowerKey.includes('mail')) {
    return 'email';
  }
  
  // 電話欄位
  if (lowerKey.includes('phone') || lowerKey.includes('tel') || 
      lowerKey.includes('mobile') || lowerTitle.includes('電話')) {
    return 'tel';
  }
  
  // 日期欄位
  if (lowerKey.includes('date') || lowerKey.includes('time') || 
      lowerTitle.includes('日期') || lowerTitle.includes('時間')) {
    return 'date';
  }
  
  // 數字欄位
  if (lowerKey.includes('amount') || lowerKey.includes('price') || 
      lowerKey.includes('quantity') || lowerKey.includes('count') ||
      lowerTitle.includes('金額') || lowerTitle.includes('數量')) {
    return 'number';
  }
  
  // 描述或備註欄位
  if (lowerKey.includes('description') || lowerKey.includes('note') || 
      lowerKey.includes('remark') || lowerTitle.includes('描述') || 
      lowerTitle.includes('備註')) {
    return 'textarea';
  }
  
  // 預設為文字輸入
  return 'text';
};

/**
 * 判斷欄位是否必填
 */
const isRequiredField = (key: string): boolean => {
  const requiredFields = ['name', 'title', 'email', 'phone'];
  return requiredFields.includes(key.toLowerCase());
};

/**
 * 產生欄位的預設提示文字
 */
const generatePlaceholder = (title: string, type: FormFieldConfig['type']): string => {
  switch (type) {
    case 'email':
      return '請輸入電子郵件地址';
    case 'tel':
      return '請輸入電話號碼';
    case 'date':
      return '請選擇日期';
    case 'number':
      return `請輸入${title}`;
    case 'textarea':
      return `請輸入${title}內容`;
    default:
      return `請輸入${title}`;
  }
};

/**
 * 建立欄位驗證函數
 */
const createValidator = (type: FormFieldConfig['type'], key: string): ((value: string) => string | null) => {
  return (value: string) => {
    // 必填欄位檢查
    if (isRequiredField(key) && !value.trim()) {
      return '此欄位為必填';
    }
    
    // 類型特定驗證
    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return '請輸入有效的電子郵件地址';
        }
        break;
        
      case 'tel':
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (value && !phoneRegex.test(value)) {
          return '請輸入有效的電話號碼';
        }
        break;
        
      case 'number':
        if (value && isNaN(Number(value))) {
          return '請輸入有效的數字';
        }
        break;
    }
    
    return null;
  };
};

/**
 * 將表格欄位轉換為表單欄位配置
 */
export const columnToFormField = (column: TableColumn): FormFieldConfig => {
  const fieldType = inferFieldType(column.key, column.title);
  
  return {
    key: column.key,
    label: column.title,
    type: fieldType,
    required: isRequiredField(column.key),
    placeholder: generatePlaceholder(column.title, fieldType),
    validation: createValidator(fieldType, column.key) };
};

/**
 * 將多個表格欄位轉換為表單欄位配置
 */
export const columnsToFormFields = (columns: TableColumn[]): FormFieldConfig[] => {
  // 過濾掉不應該在表單中顯示的欄位
  const excludedKeys = ['id', 'createdAt', 'updatedAt', 'actions'];
  
  return columns
    .filter(column => !excludedKeys.includes(column.key))
    .map(columnToFormField);
};

/**
 * 驗證整個表單資料
 */
export const validateFormData = (
  data: Record<string, any>, 
  fields: FormFieldConfig[]
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  fields.forEach(field => {
    const value = data[field.key] || '';
    const error = field.validation?.(String(value));
    if (error) {
      errors[field.key] = error;
    }
  });
  
  return errors;
};