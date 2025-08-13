/**
 * CSV 解析服務
 * 使用 Papa Parse 解析 CSV 檔案，提供數據驗證和錯誤收集功能
 */

import Papa from 'papaparse';
import { 
  CustomerFormSchema,
  CustomerFormData,
  validateFormData,
  ValidationError
} from '@/services/validation/form-schemas';

export interface CSVParseResult {
  data: CustomerFormData[];
  errors: CSVError[];
  duplicates: CSVDuplicate[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface CSVError {
  row: number;
  field: string;
  value: string;
  error: string;
}

export interface CSVDuplicate {
  row: number;
  field: string;
  value: string;
  duplicatedWith: number[];
}

export interface ParseOptions {
  skipEmptyLines?: boolean;
  trimWhitespace?: boolean;
  checkDuplicates?: boolean;
  duplicateFields?: string[];
}

/**
 * 解析 CSV 檔案內容
 */
export async function parseCSVFile(
  fileContent: string,
  options: ParseOptions = {}
): Promise<CSVParseResult> {
  const {
    skipEmptyLines = true,
    trimWhitespace = true,
    checkDuplicates = true,
    duplicateFields = ['email', 'phone']
  } = options;

  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines,
      transformHeader: (header: string) => trimWhitespace ? header.trim() : header,
      transform: (value: string) => trimWhitespace ? value.trim() : value,
      complete: (results) => {
        try {
          const parseResult = processCSVData(
            results.data as any[],
            results.errors,
            { checkDuplicates, duplicateFields }
          );
          resolve(parseResult);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV 解析失敗: ${error.message}`));
      }
    });
  });
}

/**
 * 處理解析後的 CSV 數據
 */
function processCSVData(
  rawData: any[],
  parseErrors: Papa.ParseError[],
  options: { checkDuplicates: boolean; duplicateFields: string[] }
): CSVParseResult {
  const data: CustomerFormData[] = [];
  const errors: CSVError[] = [];
  const duplicates: CSVDuplicate[] = [];
  
  // 添加解析階段的錯誤
  parseErrors.forEach((error, index) => {
    errors.push({
      row: error.row || index + 1,
      field: 'general',
      value: '',
      error: error.message
    });
  });

  // 用於檢測重複的映射
  const duplicateMap: Record<string, number[]> = {};

  rawData.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // 跳過完全空白的行
    if (isEmptyRow(row)) {
      return;
    }

    // 標準化欄位名稱映射
    const normalizedRow = normalizeFieldNames(row);

    // 驗證數據
    const validationResult = validateFormData(CustomerFormSchema, normalizedRow);

    if (validationResult.success) {
      // 檢查重複數據
      if (options.checkDuplicates) {
        checkForDuplicates(
          validationResult.data,
          rowNumber,
          options.duplicateFields,
          duplicateMap,
          duplicates
        );
      }

      data.push(validationResult.data);
    } else {
      // 收集驗證錯誤
      validationResult.errors.forEach((validationError: ValidationError) => {
        errors.push({
          row: rowNumber,
          field: validationError.field,
          value: String(normalizedRow[validationError.field] || ''),
          error: validationError.message
        });
      });
    }
  });

  return {
    data,
    errors,
    duplicates,
    totalRows: rawData.length,
    validRows: data.length,
    invalidRows: rawData.length - data.length
  };
}

/**
 * 檢查行是否為空
 */
function isEmptyRow(row: any): boolean {
  if (!row || typeof row !== 'object') {
    return true;
  }
  
  const values = Object.values(row);
  return values.every(value => 
    !value || (typeof value === 'string' && value.trim() === '')
  );
}

/**
 * 標準化 CSV 欄位名稱
 * 將 CSV 中可能的欄位名稱映射到標準欄位名稱
 */
function normalizeFieldNames(row: any): any {
  const fieldNameMap: Record<string, string> = {
    // 客戶姓名的各種可能寫法
    '姓名': 'name',
    '客戶姓名': 'name',
    '聯絡人': 'name',
    'name': 'name',
    'Name': 'name',
    '聯絡人姓名': 'name',
    
    // 公司名稱的各種可能寫法
    '公司': 'company',
    '公司名稱': 'company',
    'company': 'company',
    'Company': 'company',
    '企業名稱': 'company',
    
    // 電子郵件的各種可能寫法
    '電子郵件': 'email',
    '信箱': 'email',
    'email': 'email',
    'Email': 'email',
    'E-mail': 'email',
    'e-mail': 'email',
    
    // 電話的各種可能寫法
    '電話': 'phone',
    '聯絡電話': 'phone',
    'phone': 'phone',
    'Phone': 'phone',
    '手機': 'phone',
    '行動電話': 'phone',
    
    // 產業的各種可能寫法
    '產業': 'industry',
    '行業': 'industry',
    'industry': 'industry',
    'Industry': 'industry',
    
    // 地址的各種可能寫法
    '地址': 'address',
    'address': 'address',
    'Address': 'address',
    '公司地址': 'address',
    
    // 備註的各種可能寫法
    '備註': 'notes',
    '註記': 'notes',
    'notes': 'notes',
    'Notes': 'notes',
    '說明': 'notes',
    
    // 標籤的各種可能寫法
    '標籤': 'tags',
    'tags': 'tags',
    'Tags': 'tags',
    '分類': 'tags' };

  const normalizedRow: any = {};

  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = fieldNameMap[key] || key.toLowerCase();
    
    // 處理特殊欄位類型
    if (normalizedKey === 'tags' && typeof value === 'string') {
      // 將標籤字串轉換為陣列，支援多種分隔符
      normalizedRow[normalizedKey] = value
        .split(/[;,，；]/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    } else {
      normalizedRow[normalizedKey] = value;
    }
  });

  return normalizedRow;
}

/**
 * 檢查重複數據
 */
function checkForDuplicates(
  data: CustomerFormData,
  rowNumber: number,
  duplicateFields: string[],
  duplicateMap: Record<string, number[]>,
  duplicates: CSVDuplicate[]
): void {
  duplicateFields.forEach(field => {
    const value = (data as any)[field];
    
    if (value && typeof value === 'string' && value.trim() !== '') {
      const normalizedValue = value.toLowerCase().trim();
      const key = `${field}:${normalizedValue}`;
      
      if (!duplicateMap[key]) {
        duplicateMap[key] = [];
      }
      
      if (duplicateMap[key].length > 0) {
        // 發現重複
        duplicates.push({
          row: rowNumber,
          field,
          value,
          duplicatedWith: [...duplicateMap[key]]
        });
        
        // 同時標記之前的行也是重複的（如果還沒標記過）
        const existingDuplicate = duplicates.find(
          d => d.field === field && d.value.toLowerCase() === normalizedValue
        );
        if (!existingDuplicate) {
          duplicateMap[key].forEach(prevRow => {
            duplicates.push({
              row: prevRow,
              field,
              value,
              duplicatedWith: [rowNumber]
            });
          });
        }
      }
      
      duplicateMap[key].push(rowNumber);
    }
  });
}

/**
 * 獲取 CSV 範本格式
 */
// 保留舊版函數以維持相容性，將在新版本中被取代
export function getCSVTemplate(): string {
  console.warn('getCSVTemplate 已過時，請使用 generateCSVTemplate 從 csvTemplateGenerator');
  
  const headers = [
    'name',
    'company', 
    'email',
    'phone',
    'industry',
    'address',
    'tags',
    'notes'
  ];

  const sampleData = [
    [
      '張小明',
      '台積電',
      'ming.chang@tsmc.com',
      '0912-345-678',
      '半導體',
      '新竹科學園區',
      'VIP;大客戶',
      '重要客戶'
    ]
  ];

  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * 驗證 CSV 檔案大小
 */
export function validateFileSize(fileSize: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
}

/**
 * 估算處理時間
 */
export function estimateProcessingTime(rowCount: number): number {
  // 基於每秒處理約 1000 行的估算
  return Math.max(1, Math.ceil(rowCount / 1000));
}