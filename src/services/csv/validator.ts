/**
 * CSV 數據驗證服務
 * 提供批量數據驗證、清理和標準化功能
 */

import { CustomerFormData } from '@/services/validation/form-schemas';

export interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  warnings: ValidationWarning[];
  duplicateRecords: DuplicateRecord[];
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
  suggestion?: string;
}

export interface DuplicateRecord {
  row: number;
  duplicateRows: number[];
  field: string;
  value: string;
}

export interface CleaningOptions {
  removeEmptyFields?: boolean;
  standardizePhoneNumbers?: boolean;
  standardizeEmails?: boolean;
  trimWhitespace?: boolean;
  capitalizeNames?: boolean;
}

/**
 * 批量驗證客戶數據
 */
export function validateCustomerBatch(
  data: CustomerFormData[],
  options: CleaningOptions = {}
): ValidationSummary {
  const {
    removeEmptyFields = true,
    standardizePhoneNumbers = true,
    standardizeEmails = true,
    trimWhitespace = true,
    capitalizeNames = true,
  } = options;

  const warnings: ValidationWarning[] = [];
  const duplicates: DuplicateRecord[] = [];
  let validRecords = 0;
  let invalidRecords = 0;

  // 檢查重複資料
  const emailMap = new Map<string, number[]>();
  const phoneMap = new Map<string, number[]>();
  const nameCompanyMap = new Map<string, number[]>();

  data.forEach((record, index) => {
    const row = index + 1;
    let isValid = true;

    try {
      // 清理和標準化數據
      const cleanedRecord = cleanCustomerData(record, {
        removeEmptyFields,
        standardizePhoneNumbers,
        standardizeEmails,
        trimWhitespace,
        capitalizeNames,
      });

      // 檢查必填欄位
      if (!cleanedRecord.name || !cleanedRecord.company) {
        warnings.push({
          row,
          field: !cleanedRecord.name ? 'name' : 'company',
          message: `${!cleanedRecord.name ? '客戶姓名' : '公司名稱'}為必填欄位`,
        });
        isValid = false;
      }

      // 驗證電子郵件格式
      if (cleanedRecord.email && !isValidEmail(cleanedRecord.email)) {
        warnings.push({
          row,
          field: 'email',
          message: '電子郵件格式不正確',
          suggestion: `建議修改為正確格式，例如：user@example.com`,
        });
      }

      // 驗證電話格式
      if (cleanedRecord.phone && !isValidPhoneNumber(cleanedRecord.phone)) {
        warnings.push({
          row,
          field: 'phone',
          message: '電話號碼格式可能不正確',
          suggestion: '建議使用格式：0912-345-678 或 +886-912-345-678',
        });
      }

      // 檢查電子郵件重複
      if (cleanedRecord.email) {
        const emailKey = cleanedRecord.email.toLowerCase();
        if (!emailMap.has(emailKey)) {
          emailMap.set(emailKey, []);
        }
        emailMap.get(emailKey)!.push(row);
      }

      // 檢查電話重複
      if (cleanedRecord.phone) {
        const phoneKey = normalizePhoneNumber(cleanedRecord.phone);
        if (!phoneMap.has(phoneKey)) {
          phoneMap.set(phoneKey, []);
        }
        phoneMap.get(phoneKey)!.push(row);
      }

      // 檢查姓名+公司組合重複
      if (cleanedRecord.name && cleanedRecord.company) {
        const nameCompanyKey = `${cleanedRecord.name.toLowerCase()}_${cleanedRecord.company.toLowerCase()}`;
        if (!nameCompanyMap.has(nameCompanyKey)) {
          nameCompanyMap.set(nameCompanyKey, []);
        }
        nameCompanyMap.get(nameCompanyKey)!.push(row);
      }

      // 檢查數據完整性
      const completeness = calculateDataCompleteness(cleanedRecord);
      if (completeness < 0.4) {
        warnings.push({
          row,
          field: 'general',
          message: '資料完整度較低',
          suggestion: '建議補充更多客戶資訊以提升資料品質',
        });
      }

      if (isValid) {
        validRecords++;
      } else {
        invalidRecords++;
      }

      // 更新原始數據（清理後的版本）
      Object.assign(record, cleanedRecord);

    } catch (error) {
      warnings.push({
        row,
        field: 'general',
        message: `資料處理失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
      });
      invalidRecords++;
    }
  });

  // 整理重複資料
  emailMap.forEach((rows, email) => {
    if (rows.length > 1) {
      rows.forEach(row => {
        duplicates.push({
          row,
          duplicateRows: rows.filter(r => r !== row),
          field: 'email',
          value: email,
        });
      });
    }
  });

  phoneMap.forEach((rows, phone) => {
    if (rows.length > 1) {
      rows.forEach(row => {
        duplicates.push({
          row,
          duplicateRows: rows.filter(r => r !== row),
          field: 'phone',
          value: phone,
        });
      });
    }
  });

  nameCompanyMap.forEach((rows, nameCompany) => {
    if (rows.length > 1) {
      rows.forEach(row => {
        duplicates.push({
          row,
          duplicateRows: rows.filter(r => r !== row),
          field: 'name_company',
          value: nameCompany.replace('_', ' + '),
        });
      });
    }
  });

  return {
    totalRecords: data.length,
    validRecords,
    invalidRecords,
    warnings,
    duplicateRecords: duplicates,
  };
}

/**
 * 清理和標準化客戶數據
 */
function cleanCustomerData(
  data: CustomerFormData,
  options: CleaningOptions
): CustomerFormData {
  const cleaned: CustomerFormData = { ...data };

  if (options.trimWhitespace) {
    Object.keys(cleaned).forEach(key => {
      if (typeof cleaned[key as keyof CustomerFormData] === 'string') {
        (cleaned[key as keyof CustomerFormData] as any) = 
          (cleaned[key as keyof CustomerFormData] as string).trim();
      }
    });
  }

  if (options.capitalizeNames && cleaned.name) {
    cleaned.name = capitalizeWords(cleaned.name);
  }

  if (cleaned.company) {
    // 簡單的公司名稱格式化
    cleaned.company = cleaned.company.trim();
  }

  if (options.standardizeEmails && cleaned.email) {
    cleaned.email = cleaned.email.toLowerCase().trim();
  }

  if (options.standardizePhoneNumbers && cleaned.phone) {
    cleaned.phone = standardizePhoneNumber(cleaned.phone);
  }

  if (options.removeEmptyFields) {
    Object.keys(cleaned).forEach(key => {
      const value = cleaned[key as keyof CustomerFormData];
      if (value === '' || value === null || value === undefined) {
        delete cleaned[key as keyof CustomerFormData];
      }
    });
  }

  return cleaned;
}

/**
 * 驗證電子郵件格式
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 驗證電話號碼格式
 */
function isValidPhoneNumber(phone: string): boolean {
  // 支援多種台灣電話格式
  const phonePatterns = [
    /^09\d{8}$/, // 09xxxxxxxx
    /^09\d{2}-\d{3}-\d{3}$/, // 09xx-xxx-xxx
    /^\+886-?9\d{8}$/, // +886-9xxxxxxxx
    /^0\d-\d{7,8}$/, // 市話：0x-xxxxxxx
    /^0\d{1,2}-\d{6,8}$/, // 市話變體
  ];
  
  return phonePatterns.some(pattern => pattern.test(phone));
}

/**
 * 標準化電話號碼
 */
function standardizePhoneNumber(phone: string): string {
  // 移除所有非數字和加號、減號字符
  let cleaned = phone.replace(/[^\d+-]/g, '');
  
  // 處理國際格式
  if (cleaned.startsWith('+886')) {
    cleaned = '0' + cleaned.substring(4);
  }
  
  // 如果是手機號碼，加上減號分隔
  if (cleaned.match(/^09\d{8}$/)) {
    cleaned = cleaned.replace(/^(09\d{2})(\d{3})(\d{3})$/, '$1-$2-$3');
  }
  
  return cleaned;
}

/**
 * 正規化電話號碼（用於重複檢查）
 */
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[\s-+()]/g, '').toLowerCase();
}

/**
 * 首字母大寫
 */
function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * 計算資料完整度
 */
function calculateDataCompleteness(data: CustomerFormData): number {
  const fields = ['name', 'company', 'email', 'phone', 'industry', 'address', 'notes'];
  const filledFields = fields.filter(field => {
    const value = data[field as keyof CustomerFormData];
    return value && value !== '' && (Array.isArray(value) ? value.length > 0 : true);
  });
  
  return filledFields.length / fields.length;
}

/**
 * 生成清理報告
 */
export function generateCleaningReport(
  before: CustomerFormData[],
  after: CustomerFormData[],
  validationSummary: ValidationSummary
): string {
  const report = [
    '=== CSV 資料清理報告 ===',
    `處理時間: ${new Date().toLocaleString()}`,
    '',
    '處理統計:',
    `- 總記錄數: ${validationSummary.totalRecords}`,
    `- 有效記錄: ${validationSummary.validRecords}`,
    `- 無效記錄: ${validationSummary.invalidRecords}`,
    `- 成功率: ${((validationSummary.validRecords / validationSummary.totalRecords) * 100).toFixed(1)}%`,
    '',
    '問題統計:',
    `- 警告數量: ${validationSummary.warnings.length}`,
    `- 重複記錄: ${validationSummary.duplicateRecords.length}`,
    '',
  ];

  if (validationSummary.warnings.length > 0) {
    report.push('主要警告:');
    const warningTypes = validationSummary.warnings.reduce((acc, warning) => {
      acc[warning.message] = (acc[warning.message] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(warningTypes).forEach(([message, count]) => {
      report.push(`- ${message}: ${count} 筆`);
    });
    report.push('');
  }

  if (validationSummary.duplicateRecords.length > 0) {
    report.push('重複資料統計:');
    const duplicateTypes = validationSummary.duplicateRecords.reduce((acc, dup) => {
      acc[dup.field] = (acc[dup.field] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(duplicateTypes).forEach(([field, count]) => {
      const fieldName = field === 'email' ? '電子郵件' : field === 'phone' ? '電話' : '姓名+公司';
      report.push(`- ${fieldName}重複: ${count} 筆`);
    });
  }

  return report.join('\n');
}