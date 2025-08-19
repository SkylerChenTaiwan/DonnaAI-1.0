/**
 * PRP-125: Notion 風格資料庫管理系統 - 欄位渲染器註冊系統
 * 
 * @description 欄位類型渲染器的統一註冊和管理系統
 * @version 1.0.0
 * @date 2025-08-19
 * 
 * 支援欄位類型：
 * - text: 文字欄位
 * - number: 數字欄位  
 * - date: 日期欄位
 * - select: 單選欄位
 * - multiSelect: 多選欄位
 * - checkbox: 核取方塊欄位
 */

import React from 'react';
import type { 
  Field,
  FieldType,
  CellValue,
  FieldRendererProps 
} from '@/docs/types/database-table-types';

// 匯入各種欄位渲染器
import { TextFieldRenderer } from './text-field';
import { NumberFieldRenderer } from './number-field';
import { DateFieldRenderer } from './date-field';
import { SelectFieldRenderer } from './select-field';
import { MultiSelectFieldRenderer } from './multi-select-field';
import { CheckboxFieldRenderer } from './checkbox-field';

/**
 * 欄位渲染器函數類型
 */
export type FieldRenderer = React.FC<FieldRendererProps>;

/**
 * 欄位渲染器註冊表
 */
const FIELD_RENDERERS: Record<FieldType, FieldRenderer> = {
  text: TextFieldRenderer,
  number: NumberFieldRenderer,
  date: DateFieldRenderer,
  select: SelectFieldRenderer,
  multiSelect: MultiSelectFieldRenderer,
  checkbox: CheckboxFieldRenderer,
  
  // 進階欄位類型（暫時使用文字渲染器）
  url: TextFieldRenderer,
  email: TextFieldRenderer,
  phone: TextFieldRenderer,
  currency: NumberFieldRenderer,
  percent: NumberFieldRenderer,
  rating: NumberFieldRenderer,
  file: TextFieldRenderer,
  relation: TextFieldRenderer,
  formula: TextFieldRenderer,
  rollup: TextFieldRenderer,
  createdTime: DateFieldRenderer,
  createdBy: TextFieldRenderer,
  lastEditedTime: DateFieldRenderer,
  lastEditedBy: TextFieldRenderer,
  autoNumber: NumberFieldRenderer,
  barcode: TextFieldRenderer,
  button: TextFieldRenderer,
  collaborator: TextFieldRenderer,
  count: NumberFieldRenderer,
  lookup: TextFieldRenderer
};

/**
 * 獲取欄位渲染器
 */
export function getFieldRenderer(fieldType: FieldType): FieldRenderer {
  const renderer = FIELD_RENDERERS[fieldType];
  if (!renderer) {
    console.warn(`No renderer found for field type: ${fieldType}, using text renderer`);
    return TextFieldRenderer;
  }
  return renderer;
}

/**
 * 註冊自訂欄位渲染器
 */
export function registerFieldRenderer(fieldType: FieldType, renderer: FieldRenderer): void {
  FIELD_RENDERERS[fieldType] = renderer;
}

/**
 * 統一欄位渲染器元件
 */
export interface UnifiedFieldRendererProps {
  field: Field;
  value: CellValue;
  mode: 'view' | 'edit';
  onChange?: (value: CellValue) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

export const UnifiedFieldRenderer: React.FC<UnifiedFieldRendererProps> = ({
  field,
  value,
  mode,
  onChange,
  onSubmit,
  onCancel,
  error,
  disabled = false,
  readOnly = false,
  className
}) => {
  const Renderer = getFieldRenderer(field.type);
  
  return React.createElement(Renderer, {
    field,
    value,
    mode,
    onChange,
    error,
    disabled,
    readOnly
  });
};

/**
 * 欄位類型對應的預設值
 */
export const DEFAULT_FIELD_VALUES: Record<FieldType, CellValue> = {
  text: '',
  number: 0,
  date: null,
  select: null,
  multiSelect: [],
  checkbox: false,
  url: '',
  email: '',
  phone: '',
  currency: 0,
  percent: 0,
  rating: 0,
  file: null,
  relation: null,
  formula: null,
  rollup: null,
  createdTime: new Date(),
  createdBy: '',
  lastEditedTime: new Date(),
  lastEditedBy: '',
  autoNumber: 1,
  barcode: '',
  button: null,
  collaborator: '',
  count: 0,
  lookup: null
};

/**
 * 獲取欄位預設值
 */
export function getDefaultFieldValue(fieldType: FieldType): CellValue {
  return DEFAULT_FIELD_VALUES[fieldType];
}

/**
 * 驗證欄位值
 */
export function validateFieldValue(field: Field, value: CellValue): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 必填檢查
  if (field.required && (value === null || value === undefined || value === '')) {
    errors.push(`${field.name} 為必填欄位`);
  }

  // 型別特定驗證
  switch (field.type) {
    case 'number':
    case 'currency':
    case 'percent':
      if (value !== null && value !== undefined && isNaN(Number(value))) {
        errors.push(`${field.name} 必須是數字`);
      }
      break;
      
    case 'email':
      if (value && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field.name} 格式不正確`);
        }
      }
      break;
      
    case 'url':
      if (value && typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          errors.push(`${field.name} 必須是有效的網址`);
        }
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 格式化欄位值用於顯示
 */
export function formatFieldValue(field: Field, value: CellValue): string {
  if (value === null || value === undefined) {
    return '';
  }

  switch (field.type) {
    case 'date':
    case 'createdTime':
    case 'lastEditedTime':
      if (value instanceof Date) {
        return value.toLocaleDateString('zh-TW');
      }
      return '';

    case 'currency':
      return `$${Number(value).toLocaleString()}`;

    case 'percent':
      return `${Number(value)}%`;

    case 'checkbox':
      return value ? '✓' : '';

    case 'multiSelect':
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return '';

    default:
      return String(value);
  }
}

// 匯出所有欄位渲染器
export {
  TextFieldRenderer,
  NumberFieldRenderer,
  DateFieldRenderer,
  SelectFieldRenderer,
  MultiSelectFieldRenderer,
  CheckboxFieldRenderer
};