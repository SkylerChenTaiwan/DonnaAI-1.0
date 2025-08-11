/**
 * 資料驗證引擎
 * 提供可配置的資料驗證規則和執行
 */

import {
  IValidationEngine,
  ValidationRule,
  ValidationResult,
  ValidationError,
} from '@/types/intelligentImport';
import { getFirebaseDb } from '@/services/firebase/config';
const db = getFirebaseDb();
import { collection, query, where, getDocs } from 'firebase/firestore';

export class ValidationEngine implements IValidationEngine {
  private rules: Map<string, ValidationRule[]> = new Map();
  private cache: Map<string, Set<any>> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * 初始化預設規則
   */
  private initializeDefaultRules(): void {
    // 客戶資料規則
    this.addDefaultRulesForCollection('customers', [
      {
        field: 'name',
        type: 'required',
        config: {},
        errorMessage: '客戶名稱為必填欄位',
        severity: 'error',
      },
      {
        field: 'email',
        type: 'format',
        config: {
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        },
        errorMessage: '電子郵件格式不正確',
        severity: 'error',
      },
      {
        field: 'phone',
        type: 'format',
        config: {
          pattern: '^[\\d\\s\\-\\+\\(\\)]+$',
          minLength: 7,
          maxLength: 20,
        },
        errorMessage: '電話號碼格式不正確',
        severity: 'warning',
      },
      {
        field: 'email',
        type: 'unique',
        config: {
          allowNull: true,
        },
        errorMessage: '此電子郵件已存在',
        severity: 'error',
      },
    ]);

    // 用戶資料規則
    this.addDefaultRulesForCollection('users', [
      {
        field: 'email',
        type: 'required',
        config: {},
        errorMessage: '電子郵件為必填欄位',
        severity: 'error',
      },
      {
        field: 'email',
        type: 'unique',
        config: {},
        errorMessage: '此電子郵件已被使用',
        severity: 'error',
      },
      {
        field: 'role',
        type: 'custom',
        config: {
          customValidator: async (value: any) => {
            const validRoles = ['admin', 'manager', 'user', 'viewer'];
            return validRoles.includes(value);
          },
        },
        errorMessage: '無效的用戶角色',
        severity: 'error',
      },
    ]);

    // 記錄資料規則
    this.addDefaultRulesForCollection('records', [
      {
        field: 'title',
        type: 'required',
        config: {},
        errorMessage: '記錄標題為必填欄位',
        severity: 'error',
      },
      {
        field: 'date',
        type: 'format',
        config: {
          customValidator: async (value: any) => {
            const date = new Date(value);
            return !isNaN(date.getTime());
          },
        },
        errorMessage: '日期格式不正確',
        severity: 'error',
      },
      {
        field: 'amount',
        type: 'range',
        config: {
          min: 0,
          max: 999999999,
        },
        errorMessage: '金額必須在有效範圍內',
        severity: 'warning',
      },
    ]);

    // 任務資料規則
    this.addDefaultRulesForCollection('tasks', [
      {
        field: 'title',
        type: 'required',
        config: {},
        errorMessage: '任務標題為必填欄位',
        severity: 'error',
      },
      {
        field: 'priority',
        type: 'custom',
        config: {
          customValidator: async (value: any) => {
            const validPriorities = ['low', 'medium', 'high', 'urgent'];
            return !value || validPriorities.includes(value);
          },
        },
        errorMessage: '無效的優先級',
        severity: 'warning',
      },
      {
        field: 'dueDate',
        type: 'custom',
        config: {
          customValidator: async (value: any) => {
            if (!value) return true;
            const date = new Date(value);
            return !isNaN(date.getTime()) && date > new Date();
          },
        },
        errorMessage: '到期日必須是未來的日期',
        severity: 'info',
      },
    ]);
  }

  /**
   * 為集合添加預設規則
   */
  private addDefaultRulesForCollection(
    collectionName: string,
    rules: ValidationRule[]
  ): void {
    if (!this.rules.has(collectionName)) {
      this.rules.set(collectionName, []);
    }
    this.rules.get(collectionName)!.push(...rules);
  }

  /**
   * 添加驗證規則
   */
  addRule(collectionName: string, rule: ValidationRule): void {
    if (!this.rules.has(collectionName)) {
      this.rules.set(collectionName, []);
    }
    
    // 檢查是否已存在相同的規則
    const existingRules = this.rules.get(collectionName)!;
    const existingIndex = existingRules.findIndex(
      r => r.field === rule.field && r.type === rule.type
    );

    if (existingIndex !== -1) {
      // 替換現有規則
      existingRules[existingIndex] = rule;
    } else {
      // 添加新規則
      existingRules.push(rule);
    }
  }

  /**
   * 移除驗證規則
   */
  removeRule(collectionName: string, field: string): void {
    if (!this.rules.has(collectionName)) {
      return;
    }

    const rules = this.rules.get(collectionName)!;
    this.rules.set(
      collectionName,
      rules.filter(r => r.field !== field)
    );
  }

  /**
   * 驗證資料
   */
  async validate(
    collectionName: string,
    data: any[]
  ): Promise<ValidationResult> {
    const rules = this.rules.get(collectionName) || [];
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const fieldStatistics = new Map<string, { errors: number; warnings: number }>();

    // 初始化欄位統計
    for (const rule of rules) {
      if (!fieldStatistics.has(rule.field)) {
        fieldStatistics.set(rule.field, { errors: 0, warnings: 0 });
      }
    }

    // 預載入唯一性檢查的資料
    await this.preloadUniqueData(collectionName, rules);

    // 驗證每一行資料
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      for (const rule of rules) {
        try {
          const isValid = await this.validateField(row[rule.field], rule, row);
          
          if (!isValid) {
            const error: ValidationError = {
              row: i,
              field: rule.field,
              value: row[rule.field],
              rule: rule.type,
              message: rule.errorMessage,
              severity: rule.severity,
              suggestion: this.getSuggestion(rule, row[rule.field]),
            };

            if (rule.severity === 'error') {
              errors.push(error);
              const stats = fieldStatistics.get(rule.field)!;
              stats.errors++;
            } else if (rule.severity === 'warning') {
              warnings.push(error);
              const stats = fieldStatistics.get(rule.field)!;
              stats.warnings++;
            } else {
              warnings.push(error);
            }
          }
        } catch (error: any) {
          // 驗證過程中的錯誤
          errors.push({
            row: i,
            field: rule.field,
            value: row[rule.field],
            rule: rule.type,
            message: `驗證失敗: ${error.message}`,
            severity: 'error',
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRows: data.length - errors.length,
      totalRows: data.length,
      fieldStatistics,
    };
  }

  /**
   * 驗證單個欄位
   */
  async validateField(
    value: any,
    rule: ValidationRule,
    fullRow?: any
  ): Promise<boolean> {
    // 空值處理
    const isNull = value == null || value === '';
    
    if (rule.type === 'required') {
      return !isNull;
    }
    
    // 如果允許空值且值為空，則通過驗證
    if (isNull && rule.config.allowNull !== false) {
      return true;
    }

    switch (rule.type) {
      case 'unique':
        return await this.checkUniqueness(value, rule);

      case 'format':
        return this.checkFormat(value, rule);

      case 'range':
        return this.checkRange(value, rule);

      case 'reference':
        return await this.checkReference(value, rule);

      case 'custom':
        if (rule.config.customValidator) {
          return await rule.config.customValidator(value, fullRow);
        }
        return true;

      default:
        return true;
    }
  }

  /**
   * 檢查唯一性
   */
  private async checkUniqueness(
    value: any,
    rule: ValidationRule
  ): Promise<boolean> {
    const cacheKey = `unique-${rule.field}`;
    
    if (!this.cache.has(cacheKey)) {
      return true; // 如果沒有快取，假設是唯一的
    }

    const existingValues = this.cache.get(cacheKey)!;
    const normalizedValue = this.normalizeValue(value);
    
    if (existingValues.has(normalizedValue)) {
      return false;
    }

    // 添加到快取
    existingValues.add(normalizedValue);
    return true;
  }

  /**
   * 檢查格式
   */
  private checkFormat(value: any, rule: ValidationRule): boolean {
    const stringValue = String(value);

    // 正則表達式檢查
    if (rule.config.pattern) {
      const regex = new RegExp(rule.config.pattern);
      if (!regex.test(stringValue)) {
        return false;
      }
    }

    // 長度檢查
    if (rule.config.minLength && stringValue.length < rule.config.minLength) {
      return false;
    }

    if (rule.config.maxLength && stringValue.length > rule.config.maxLength) {
      return false;
    }

    return true;
  }

  /**
   * 檢查範圍
   */
  private checkRange(value: any, rule: ValidationRule): boolean {
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      return false;
    }

    if (rule.config.min !== undefined && numValue < rule.config.min) {
      return false;
    }

    if (rule.config.max !== undefined && numValue > rule.config.max) {
      return false;
    }

    return true;
  }

  /**
   * 檢查參考完整性
   */
  private async checkReference(
    value: any,
    rule: ValidationRule
  ): Promise<boolean> {
    if (!rule.config.referenceCollection || !rule.config.referenceField) {
      return true;
    }

    const cacheKey = `ref-${rule.config.referenceCollection}-${rule.config.referenceField}`;
    
    if (!this.cache.has(cacheKey)) {
      // 載入參考資料
      await this.loadReferenceData(
        rule.config.referenceCollection,
        rule.config.referenceField
      );
    }

    const referenceValues = this.cache.get(cacheKey);
    if (!referenceValues) {
      return true; // 無法載入參考資料，跳過驗證
    }

    const normalizedValue = this.normalizeValue(value);
    return referenceValues.has(normalizedValue);
  }

  /**
   * 預載入唯一性檢查資料
   */
  private async preloadUniqueData(
    collectionName: string,
    rules: ValidationRule[]
  ): Promise<void> {
    const uniqueRules = rules.filter(r => r.type === 'unique');

    for (const rule of uniqueRules) {
      const cacheKey = `unique-${rule.field}`;
      
      if (this.cache.has(cacheKey)) {
        continue; // 已經載入
      }

      try {
        const snapshot = await getDocs(collection(db, collectionName));
        const values = new Set<any>();

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data[rule.field] != null) {
            values.add(this.normalizeValue(data[rule.field]));
          }
        });

        this.cache.set(cacheKey, values);
      } catch (error) {
        console.warn(`無法載入唯一性檢查資料: ${error}`);
        this.cache.set(cacheKey, new Set());
      }
    }
  }

  /**
   * 載入參考資料
   */
  private async loadReferenceData(
    collectionName: string,
    fieldName: string
  ): Promise<void> {
    const cacheKey = `ref-${collectionName}-${fieldName}`;

    try {
      const snapshot = await getDocs(collection(db, collectionName));
      const values = new Set<any>();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data[fieldName] != null) {
          values.add(this.normalizeValue(data[fieldName]));
        }
      });

      this.cache.set(cacheKey, values);
    } catch (error) {
      console.warn(`無法載入參考資料: ${error}`);
      this.cache.set(cacheKey, new Set());
    }
  }

  /**
   * 標準化值（用於比較）
   */
  private normalizeValue(value: any): string {
    if (value == null) return '';
    return String(value).toLowerCase().trim();
  }

  /**
   * 獲取修正建議
   */
  private getSuggestion(rule: ValidationRule, value: any): string | undefined {
    switch (rule.type) {
      case 'required':
        return '請填寫此欄位';

      case 'format':
        if (rule.config.pattern) {
          return `請符合格式: ${this.getFormatExample(rule.config.pattern)}`;
        }
        break;

      case 'range':
        if (rule.config.min !== undefined && rule.config.max !== undefined) {
          return `值必須在 ${rule.config.min} 到 ${rule.config.max} 之間`;
        } else if (rule.config.min !== undefined) {
          return `值必須大於或等於 ${rule.config.min}`;
        } else if (rule.config.max !== undefined) {
          return `值必須小於或等於 ${rule.config.max}`;
        }
        break;

      case 'unique':
        return '請使用唯一的值';

      case 'reference':
        return `值必須存在於 ${rule.config.referenceCollection} 的 ${rule.config.referenceField} 欄位中`;
    }

    return undefined;
  }

  /**
   * 獲取格式範例
   */
  private getFormatExample(pattern: string): string {
    // 常見格式的範例
    const examples: Record<string, string> = {
      '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$': 'example@email.com',
      '^[\\d\\s\\-\\+\\(\\)]+$': '+886-912-345-678',
      '^\\d{4}-\\d{2}-\\d{2}$': '2024-01-01',
      '^https?://[^\\s]+$': 'https://example.com',
    };

    return examples[pattern] || pattern;
  }

  /**
   * 獲取預設規則
   */
  getDefaultRules(collectionName: string): ValidationRule[] {
    return this.rules.get(collectionName) || [];
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 匯出規則配置
   */
  exportRules(): Record<string, ValidationRule[]> {
    const rules: Record<string, ValidationRule[]> = {};
    
    this.rules.forEach((value, key) => {
      rules[key] = value;
    });

    return rules;
  }

  /**
   * 匯入規則配置
   */
  importRules(rules: Record<string, ValidationRule[]>): void {
    this.rules.clear();
    
    Object.entries(rules).forEach(([collection, collectionRules]) => {
      this.rules.set(collection, collectionRules);
    });
  }
}