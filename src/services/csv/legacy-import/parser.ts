/**
 * 舊系統 CSV 解析器
 * 專門處理舊系統的 CSV 格式
 */

import Papa from 'papaparse';
import { 
  BusinessCodeMapping,
  LegacyUser,
  LegacyCustomer,
  LegacyRecord
} from '@/types/legacy-import';

export interface LegacyParseOptions {
  skipEmptyLines?: boolean;
  trimWhitespace?: boolean;
  encoding?: string;
}

/**
 * 解析舊系統 CSV 檔案（通用）
 */
export async function parseLegacyCSV<T = any>(
  fileContent: string,
  options: LegacyParseOptions = {}
): Promise<T[]> {
  const {
    skipEmptyLines = true,
    trimWhitespace = true,
    encoding = 'UTF-8' } = options;

  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines,
      encoding,
      transformHeader: (header: string) => {
        // 處理可能的 BOM 和空白
        let cleaned = header.replace(/^\uFEFF/, '').trim();
        return trimWhitespace ? cleaned : header;
      },
      transform: (value: string) => {
        // 處理空白和特殊字符
        if (typeof value === 'string') {
          value = value.replace(/\u00A0/g, ' '); // 替換 non-breaking space
          return trimWhitespace ? value.trim() : value;
        }
        return value;
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV 解析警告:', results.errors);
        }
        resolve(results.data as T[]);
      },
      error: (error) => {
        reject(new Error(`CSV 解析失敗: ${error.message}`));
      }
    });
  });
}

/**
 * 解析業務代碼對照 CSV
 */
export async function parseBusinessCodeMapping(
  fileContent: string,
  options?: LegacyParseOptions
): Promise<BusinessCodeMapping[]> {
  const data = await parseLegacyCSV<any>(fileContent, options);
  
  // 轉換欄位名稱（處理可能的變體）
  return data.map(row => ({
    業務名稱: row['業務名稱'] || row['姓名'] || '',
    職級: row['職級'] || row['層級'] || '',
    顧問代碼: row['顧問代碼'] || row['代碼'] || row['業務代碼'] || '',
    主管清單: row['主管清單'] || row['主管'] || row['上級主管'] || '' }));
}

/**
 * 解析業務人員 CSV
 */
export async function parseLegacyUsers(
  fileContent: string,
  options?: LegacyParseOptions
): Promise<LegacyUser[]> {
  const data = await parseLegacyCSV<any>(fileContent, options);
  
  // 保留所有欄位，確保原始資料完整性
  return data.map(row => {
    const user: LegacyUser = {
      業務帳號: row['業務帳號'] || row['帳號'] || row['姓名'] || '',
      你的層級: row['你的層級'] || row['層級'] || row['職級'] || '' };
    
    // 複製所有欄位
    Object.keys(row).forEach(key => {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        user[key] = row[key];
      }
    });
    
    return user;
  });
}

/**
 * 解析客戶資料 CSV
 */
export async function parseLegacyCustomers(
  fileContent: string,
  options?: LegacyParseOptions
): Promise<LegacyCustomer[]> {
  const data = await parseLegacyCSV<any>(fileContent, options);
  
  // 保留所有欄位
  return data.map(row => {
    const customer: LegacyCustomer = {
      負責業務: row['負責業務'] || row['業務'] || row['業務人員'] || '',
      客戶名稱: row['客戶名稱'] || row['姓名'] || row['客戶'] || '' };
    
    // 複製所有欄位
    Object.keys(row).forEach(key => {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        customer[key] = row[key];
      }
    });
    
    return customer;
  });
}

/**
 * 解析訪談記錄 CSV
 */
export async function parseLegacyRecords(
  fileContent: string,
  options?: LegacyParseOptions
): Promise<LegacyRecord[]> {
  const data = await parseLegacyCSV<any>(fileContent, options);
  
  return data.map(row => ({
    標題: row['標題'] || row['主題'] || row['訪談主題'] || '',
    訪談結果: row['訪談結果'] || row['內容'] || row['記錄內容'] || '',
    訪談日期: row['訪談日期'] || row['日期'] || row['會議日期'] || '',
    業務帳號: row['業務帳號'] || row['業務'] || row['業務人員'] || '',
    客戶名稱: row['客戶名稱'] || row['客戶'] || row['客戶姓名'] || '',
    下次跟進日期: row['下次跟進日期'] || row['跟進日期'] || row['下次聯絡'] || undefined,
    提交時間: row['提交時間'] || undefined,
    客戶名單資料庫: row['客戶名單資料庫'] || undefined,
    建立時間: row['建立時間'] || undefined,
    匯入時間: row['匯入時間'] || undefined }));
}

/**
 * 自動檢測 CSV 檔案類型
 */
export function detectCSVType(
  headers: string[]
): 'codeMapping' | 'users' | 'customers' | 'records' | 'unknown' {
  const headerSet = new Set(headers.map(h => h.toLowerCase().trim()));
  
  // 檢查業務代碼對照表
  if (headerSet.has('顧問代碼') || 
      (headerSet.has('業務名稱') && headerSet.has('職級'))) {
    return 'codeMapping';
  }
  
  // 檢查業務人員
  if (headerSet.has('業務帳號') || 
      (headerSet.has('你的層級') && headerSet.has('公司gmail帳號'))) {
    return 'users';
  }
  
  // 檢查訪談記錄
  if (headerSet.has('訪談結果') || 
      (headerSet.has('訪談日期') && headerSet.has('標題'))) {
    return 'records';
  }
  
  // 檢查客戶資料
  if (headerSet.has('負責業務') && headerSet.has('客戶名稱')) {
    return 'customers';
  }
  
  return 'unknown';
}

/**
 * 預覽 CSV 檔案前幾行
 */
export async function previewCSV(
  fileContent: string,
  rows: number = 5
): Promise<{
  headers: string[];
  data: any[];
  totalRows: number;
  detectedType: string;
}> {
  return new Promise((resolve, reject) => {
    let allData: any[] = [];
    let headers: string[] = [];
    
    Papa.parse(fileContent, {
      header: true,
      preview: rows + 1, // +1 for header
      complete: (results) => {
        headers = results.meta.fields || [];
        allData = results.data as any[];
      }
    });
    
    // 解析完整檔案以獲取總行數
    Papa.parse(fileContent, {
      header: true,
      complete: (results) => {
        const totalRows = results.data.length;
        const detectedType = detectCSVType(headers);
        
        resolve({
          headers,
          data: allData.slice(0, rows),
          totalRows,
          detectedType });
      },
      error: (error) => {
        reject(new Error(`CSV 預覽失敗: ${error.message}`));
      }
    });
  });
}