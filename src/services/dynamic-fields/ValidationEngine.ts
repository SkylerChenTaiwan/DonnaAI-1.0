/**
 * 動態欄位驗證引擎
 * 根據欄位配置進行智慧型資料驗證
 */

import {
  DynamicFieldConfig,
  ValidationRule,
  ValidationError,
  FieldDataType,
} from '@/types/dynamic-field-mapping';
import { Timestamp } from 'firebase/firestore';

interface ValidationContext {
  fieldKey: string;
  fieldConfig: DynamicFieldConfig;
  value: unknown;
  recordIndex?: number;
  allRecords?: Record<string, unknown>[];
}

interface ValidationRuleHandler {
  (context: ValidationContext, rule: ValidationRule): ValidationError | null;
}

export class ValidationEngine {
  private ruleHandlers: Map<string, ValidationRuleHandler> = new Map();
  private customValidators: Map<string, ValidationRuleHandler> = new Map();

  constructor() {
    this.initializeBuiltInRules();
  }

  /**
   * 初始化內建驗證規則
   */
  private initializeBuiltInRules(): void {
    this.ruleHandlers.set('required', this.validateRequired);
    this.ruleHandlers.set('minLength', this.validateMinLength);
    this.ruleHandlers.set('maxLength', this.validateMaxLength);
    this.ruleHandlers.set('pattern', this.validatePattern);
    this.ruleHandlers.set('min', this.validateMin);
    this.ruleHandlers.set('max', this.validateMax);
    this.ruleHandlers.set('enum', this.validateEnum);
    this.ruleHandlers.set('custom', this.validateCustom);
  }

  /**
   * 驗證單一記錄
   */
  async validateRecord(
    record: Record<string, unknown>,
    fieldConfigs: DynamicFieldConfig[],
    recordIndex?: number
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    for (const fieldConfig of fieldConfigs) {
      if (!fieldConfig.isActive) continue;

      const value = record[fieldConfig.fieldKey];
      const fieldErrors = await this.validateField(fieldConfig, value, recordIndex);
      errors.push(...fieldErrors);
    }

    return errors;
  }

  /**
   * 驗證單一欄位
   */
  async validateField(
    fieldConfig: DynamicFieldConfig,
    value: unknown,
    recordIndex?: number
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    const context: ValidationContext = {
      fieldKey: fieldConfig.fieldKey,
      fieldConfig,
      value,
      recordIndex,
    };

    // 首先驗證資料類型
    const typeError = this.validateDataType(context);
    if (typeError) {
      errors.push(typeError);
      // 如果類型錯誤，跳過其他驗證以避免連鎖錯誤
      return errors;
    }

    // 執行欄位驗證規則
    for (const rule of fieldConfig.validationRules) {
      const handler = this.ruleHandlers.get(rule.type);
      if (handler) {
        const error = handler(context, rule);
        if (error) {
          errors.push(error);
        }
      } else {
        console.warn(`未知的驗證規則類型: ${rule.type}`);
      }
    }

    // 安全性驗證
    if (fieldConfig.security.isPII) {
      const piiError = this.validatePII(context);
      if (piiError) {
        errors.push(piiError);
      }
    }

    return errors;
  }

  /**
   * 驗證資料類型
   */
  private validateDataType(context: ValidationContext): ValidationError | null {
    const { fieldConfig, value, recordIndex } = context;
    
    // null 或 undefined 值需要檢查是否必填
    if (value == null) {
      return null; // 類型驗證不處理必填檢查
    }

    const dataType = fieldConfig.dataType;
    let isValid = true;
    let expectedType = '';

    switch (dataType) {
      case 'text':
      case 'longtext':
      case 'address':
        isValid = typeof value === 'string';
        expectedType = '文字';
        break;

      case 'number':
      case 'currency':
      case 'percentage':
        isValid = typeof value === 'number' || !isNaN(Number(value));
        expectedType = '數字';
        break;

      case 'boolean':
        isValid = typeof value === 'boolean' || 
                 ['true', 'false', '1', '0', 'yes', 'no', '是', '否'].includes(String(value).toLowerCase());
        expectedType = '布林值';
        break;

      case 'date':
      case 'datetime':
        try {
          new Date(String(value));
          isValid = !isNaN(new Date(String(value)).getTime());
        } catch {
          isValid = false;
        }
        expectedType = '日期';
        break;

      case 'email':
        isValid = this.isValidEmail(String(value));
        expectedType = '電子郵件';
        break;

      case 'phone':
        isValid = this.isValidPhone(String(value));
        expectedType = '電話號碼';
        break;

      case 'url':
        isValid = this.isValidURL(String(value));
        expectedType = '網址';
        break;

      case 'json':
        try {
          JSON.parse(String(value));
          isValid = true;
        } catch {
          isValid = false;
        }
        expectedType = 'JSON 格式';
        break;

      case 'array':
        isValid = Array.isArray(value) || typeof value === 'string';
        expectedType = '陣列';
        break;

      default:
        isValid = true; // 未知類型暫時通過
    }

    if (!isValid) {
      return {
        code: 'INVALID_DATA_TYPE',
        message: `欄位 "${fieldConfig.displayName}" 的資料類型不正確，期望 ${expectedType}`,
        field: fieldConfig.fieldKey,
        recordIndex,
        invalidValue: value,
        expectedValue: expectedType,
      };
    }

    return null;
  }

  /**
   * 驗證必填
   */
  private validateRequired = (context: ValidationContext, rule: ValidationRule): ValidationError | null => {
    const { fieldConfig, value, recordIndex } = context;
    
    if (value == null || String(value).trim() === '') {
      return {
        code: 'REQUIRED_FIELD_MISSING',
        message: rule.message || `欄位 "${fieldConfig.displayName}" 為必填項目`,
        field: fieldConfig.fieldKey,
        recordIndex,
        invalidValue: value,
        expectedValue: '非空值',
      };
    }
    
    return null;
  };

  /**
   * 驗證最小長度
   */
  private validateMinLength = (context: ValidationContext, rule: ValidationRule): ValidationError | null => {
    const { fieldConfig, value, recordIndex } = context;
    
    if (value == null) return null;
    
    const stringValue = String(value);
    const minLength = Number(rule.value) || 0;
    
    if (stringValue.length < minLength) {
      return {
        code: 'MIN_LENGTH_VIOLATION',
        message: rule.message || `欄位 "${fieldConfig.displayName}" 長度不得少於 ${minLength} 個字元`,
        field: fieldConfig.fieldKey,
        recordIndex,
        invalidValue: value,
        expectedValue: `至少 ${minLength} 個字元`,
      };
    }
    
    return null;
  };

  /**
   * 驗證最大長度
   */
  private validateMaxLength = (context: ValidationContext, rule: ValidationRule): ValidationError | null => {
    const { fieldConfig, value, recordIndex } = context;
    
    if (value == null) return null;
    
    const stringValue = String(value);
    const maxLength = Number(rule.value) || Infinity;
    
    if (stringValue.length > maxLength) {
      return {
        code: 'MAX_LENGTH_VIOLATION',
        message: rule.message || `欄位 "${fieldConfig.displayName}" 長度不得超過 ${maxLength} 個字元`,
        field: fieldConfig.fieldKey,
        recordIndex,
        invalidValue: value,
        expectedValue: `最多 ${maxLength} 個字元`,
      };
    }
    
    return null;
  };

  /**
   * 驗證正則表達式
   */
  private validatePattern = (context: ValidationContext, rule: ValidationRule): ValidationError | null => {
    const { fieldConfig, value, recordIndex } = context;
    
    if (value == null) return null;
    
    try {
      const pattern = new RegExp(String(rule.value));
      const stringValue = String(value);
      
      if (!pattern.test(stringValue)) {
        return {
          code: 'PATTERN_MISMATCH',
          message: rule.message || `欄位 "${fieldConfig.displayName}" 格式不正確`,
          field: fieldConfig.fieldKey,
          recordIndex,
          invalidValue: value,
          expectedValue: `符合模式: ${rule.value}`,
        };
      }
    } catch (error) {
      console.error('正則表達式錯誤:', rule.value, error);
      return {
        code: 'INVALID_PATTERN',
        message: `欄位 "${fieldConfig.displayName}" 的驗證規則有誤`,
        field: fieldConfig.fieldKey,
        recordIndex,
        invalidValue: value,
      };
    }
    
    return null;
  };

  /**
   * 驗證最小值
   */
  private validateMin = (context: ValidationContext, rule: ValidationRule): ValidationError | null => {
    const { fieldConfig, value, recordIndex } = context;
    
    if (value == null) return null;
    
    const numValue = Number(value);
    const minValue = Number(rule.value);
    
    if (isNaN(numValue) || isNaN(minValue)) return null;
    
    if (numValue < minValue) {
      return {
        code: 'MIN_VALUE_VIOLATION',
        message: rule.message || `欄位 "${fieldConfig.displayName}" 不得小於 ${minValue}`,
        field: fieldConfig.fieldKey,
        recordIndex,
        invalidValue: value,
        expectedValue: `>= ${minValue}`,
      };
    }
    
    return null;
  };

  /**
   * 驗證最大值
   */
  private validateMax = (context: ValidationContext, rule: ValidationRule): ValidationError | null => {
    const { fieldConfig, value, recordIndex } = context;
    
    if (value == null) return null;
    
    const numValue = Number(value);
    const maxValue = Number(rule.value);
    
    if (isNaN(numValue) || isNaN(maxValue)) return null;
    
    if (numValue > maxValue) {
      return {
        code: 'MAX_VALUE_VIOLATION',
        message: rule.message || `欄位 "${fieldConfig.displayName}" 不得大於 ${maxValue}`,
        field: fieldConfig.fieldKey,
        recordIndex,
        invalidValue: value,
        expectedValue: `<= ${maxValue}`,
      };
    }
    
    return null;
  };

  /**
   * 驗證枚舉值
   */
  private validateEnum = (context: ValidationContext, rule: ValidationRule): ValidationError | null => {
    const { fieldConfig, value, recordIndex } = context;
    
    if (value == null) return null;
    
    try {
      const allowedValues = JSON.parse(String(rule.value));
      if (!Array.isArray(allowedValues)) return null;
      
      const stringValue = String(value);
      
      if (!allowedValues.includes(stringValue)) {
        return {
          code: 'ENUM_VIOLATION',
          message: rule.message || `欄位 "${fieldConfig.displayName}" 的值不在允許的選項中`,
          field: fieldConfig.fieldKey,
          recordIndex,
          invalidValue: value,
          expectedValue: `其中之一: ${allowedValues.join(', ')}`,
        };
      }
    } catch (error) {
      console.error('枚舉值解析錯誤:', rule.value, error);
      return {
        code: 'INVALID_ENUM_CONFIG',
        message: `欄位 "${fieldConfig.displayName}" 的枚舉配置有誤`,
        field: fieldConfig.fieldKey,
        recordIndex,
        invalidValue: value,
      };
    }
    
    return null;
  };

  /**
   * 驗證自定義規則
   */
  private validateCustom = (context: ValidationContext, rule: ValidationRule): ValidationError | null => {
    const { fieldConfig } = context;
    
    const customValidator = this.customValidators.get(String(rule.value));
    if (customValidator) {
      return customValidator(context, rule);
    }
    
    console.warn(`找不到自定義驗證器: ${rule.value}`);
    return null;
  };

  /**
   * 驗證 PII（個人識別資訊）
   */
  private validatePII(context: ValidationContext): ValidationError | null {
    const { fieldConfig, value, recordIndex } = context;
    
    if (value == null) return null;
    
    const stringValue = String(value);
    
    // 檢查是否包含明顯的敏感資訊模式
    const sensitivePatterns = [
      /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/, // 信用卡號
      /\d{3}-\d{2}-\d{4}/, // 美國 SSN
      /\d{10}/, // 可能的身分證號（簡化）
    ];
    
    for (const pattern of sensitivePatterns) {
      if (pattern.test(stringValue)) {
        return {
          code: 'PII_DETECTED',
          message: `欄位 "${fieldConfig.displayName}" 可能包含敏感個人資訊，請確認資料安全性`,
          field: fieldConfig.fieldKey,
          recordIndex,
          invalidValue: '[已遮罩]',
        };
      }
    }
    
    return null;
  }

  /**
   * 註冊自定義驗證器
   */
  registerCustomValidator(name: string, validator: ValidationRuleHandler): void {
    this.customValidators.set(name, validator);
  }

  /**
   * 電子郵件格式驗證
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 電話號碼格式驗證
   */
  private isValidPhone(phone: string): boolean {
    // 移除所有非數字字符
    const cleanPhone = phone.replace(/\D/g, '');
    
    // 檢查長度（台灣手機號碼 10 碼，市話 8-9 碼）
    return cleanPhone.length >= 8 && cleanPhone.length <= 15;
  }

  /**
   * URL 格式驗證
   */
  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 批次驗證記錄
   */
  async validateBatch(
    records: Record<string, unknown>[],
    fieldConfigs: DynamicFieldConfig[],
    onProgress?: (processed: number, total: number) => void
  ): Promise<{
    validRecords: Array<{ record: Record<string, unknown>; index: number }>;
    invalidRecords: Array<{ record: Record<string, unknown>; index: number; errors: ValidationError[] }>;
    warnings: ValidationError[];
  }> {
    const validRecords: Array<{ record: Record<string, unknown>; index: number }> = [];
    const invalidRecords: Array<{ record: Record<string, unknown>; index: number; errors: ValidationError[] }> = [];
    const warnings: ValidationError[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const errors = await this.validateRecord(record, fieldConfigs, i);
      
      const criticalErrors = errors.filter(e => e.code.startsWith('CRITICAL_') || e.code.includes('REQUIRED'));
      const warningErrors = errors.filter(e => !criticalErrors.includes(e));
      
      if (criticalErrors.length > 0) {
        invalidRecords.push({ record, index: i, errors: criticalErrors });
      } else {
        validRecords.push({ record, index: i });
      }
      
      warnings.push(...warningErrors);
      
      // 回報進度
      onProgress?.(i + 1, records.length);
    }

    return { validRecords, invalidRecords, warnings };
  }
}

export default ValidationEngine;