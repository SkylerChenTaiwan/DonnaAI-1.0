/**
 * 資料清理器
 * 自動標準化和清理匯入的資料
 */

import {
  IDataCleaner,
  CleaningRule,
  DataType,
} from '@/types/intelligentImport';

export class DataCleaner implements IDataCleaner {
  private readonly phoneCountryCode: string = '886'; // 台灣國碼

  /**
   * 清理資料
   */
  clean(data: any[], rules: CleaningRule[]): any[] {
    return data.map(row => this.cleanRow(row, rules));
  }

  /**
   * 清理單行資料
   */
  private cleanRow(row: any, rules: CleaningRule[]): any {
    const cleaned = { ...row };

    for (const rule of rules) {
      if (cleaned[rule.field] !== undefined) {
        cleaned[rule.field] = this.cleanField(cleaned[rule.field], rule);
        
        // 如果需要保留原始值
        if (rule.config?.preserveOriginal) {
          cleaned[`_original_${rule.field}`] = row[rule.field];
        }
      }
    }

    return cleaned;
  }

  /**
   * 清理單個欄位
   */
  cleanField(value: any, rule: CleaningRule): any {
    // 空值處理
    if (value == null || value === '') {
      if (rule.type === 'default_value' && rule.config?.default !== undefined) {
        return rule.config.default;
      }
      return value;
    }

    switch (rule.type) {
      case 'trim':
        return this.trim(value);

      case 'uppercase':
        return this.uppercase(value);

      case 'lowercase':
        return this.lowercase(value);

      case 'remove_special':
        return this.removeSpecialChars(value);

      case 'normalize_phone':
        return this.normalizePhone(value);

      case 'normalize_date':
        return this.normalizeDate(value);

      case 'normalize_email':
        return this.normalizeEmail(value);

      case 'default_value':
        return value || rule.config?.default;

      case 'remove_duplicates':
        return this.removeDuplicateWords(value);

      case 'standardize_address':
        return this.standardizeAddress(value);

      case 'custom':
        if (rule.config?.customCleaner) {
          return rule.config.customCleaner(value);
        }
        return value;

      default:
        return value;
    }
  }

  /**
   * 去除空白
   */
  private trim(value: any): any {
    if (typeof value !== 'string') return value;
    return value.trim();
  }

  /**
   * 轉換為大寫
   */
  private uppercase(value: any): any {
    if (typeof value !== 'string') return value;
    return value.toUpperCase();
  }

  /**
   * 轉換為小寫
   */
  private lowercase(value: any): any {
    if (typeof value !== 'string') return value;
    return value.toLowerCase();
  }

  /**
   * 移除特殊字元
   */
  private removeSpecialChars(value: any): string {
    if (typeof value !== 'string') return String(value);
    
    // 保留字母、數字、中文、空格
    return value.replace(/[^\w\s\u4e00-\u9fa5]/g, '');
  }

  /**
   * 標準化電話號碼
   */
  private normalizePhone(value: any): string {
    if (typeof value !== 'string') value = String(value);
    
    // 移除所有非數字字元
    let phone = value.replace(/\D/g, '');

    // 處理國際碼
    if (phone.startsWith(this.phoneCountryCode)) {
      phone = '0' + phone.slice(this.phoneCountryCode.length);
    }

    // 台灣手機號碼格式化 (09XX-XXX-XXX)
    if (phone.length === 10 && phone.startsWith('09')) {
      return `${phone.slice(0, 4)}-${phone.slice(4, 7)}-${phone.slice(7)}`;
    }

    // 台灣市話格式化
    if (phone.length === 9 && phone.startsWith('0')) {
      // 02-XXXX-XXXX (台北)
      if (phone.startsWith('02')) {
        return `${phone.slice(0, 2)}-${phone.slice(2, 6)}-${phone.slice(6)}`;
      }
      // 其他地區 (0X-XXX-XXXX)
      return `${phone.slice(0, 2)}-${phone.slice(2, 5)}-${phone.slice(5)}`;
    }

    if (phone.length === 10 && phone.startsWith('0')) {
      // 03, 04, 05, 06, 07, 08 等地區
      return `${phone.slice(0, 2)}-${phone.slice(2, 6)}-${phone.slice(6)}`;
    }

    // 國際格式
    if (phone.length > 10) {
      // 嘗試格式化為 +XXX-X-XXXX-XXXX
      if (phone.startsWith('886')) {
        const localNumber = '0' + phone.slice(3);
        return this.normalizePhone(localNumber);
      }
    }

    // 如果無法識別格式，返回清理後的數字
    return phone;
  }

  /**
   * 標準化日期
   */
  private normalizeDate(value: any): Date | string | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value !== 'string') {
      value = String(value);
    }

    // 常見日期格式
    const datePatterns = [
      // ISO 格式
      /^(\d{4})-(\d{2})-(\d{2})$/,
      // 美國格式 MM/DD/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // 歐洲格式 DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // 中文格式
      /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
      // 民國年
      /^(\d{2,3})\/(\d{1,2})\/(\d{1,2})$/,
    ];

    // 嘗試直接解析
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
      return this.formatDate(parsed);
    }

    // 嘗試民國年轉換
    const rocMatch = value.match(/^(\d{2,3})\/(\d{1,2})\/(\d{1,2})$/);
    if (rocMatch) {
      const year = parseInt(rocMatch[1]) + 1911;
      const month = rocMatch[2].padStart(2, '0');
      const day = rocMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // 嘗試中文日期
    const chineseMatch = value.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    if (chineseMatch) {
      const year = chineseMatch[1];
      const month = chineseMatch[2].padStart(2, '0');
      const day = chineseMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // 無法解析
    return null;
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 標準化電子郵件
   */
  private normalizeEmail(value: any): string {
    if (typeof value !== 'string') return String(value);
    
    // 轉換為小寫並去除空白
    let email = value.toLowerCase().trim();
    
    // 移除常見的錯誤字元
    email = email.replace(/\s/g, '');
    
    // 修正常見錯誤
    email = email
      .replace(/,/g, '.')  // 逗號改為點
      .replace(/＠/g, '@')  // 全形@改為半形
      .replace(/。/g, '.')  // 全形句號改為點
      .replace(/\.{2,}/g, '.'); // 多個點改為單個
    
    // 驗證格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return value; // 如果修正後仍無效，返回原值
    }
    
    return email;
  }

  /**
   * 移除重複的字詞
   */
  private removeDuplicateWords(value: any): string {
    if (typeof value !== 'string') return String(value);
    
    const words = value.split(/\s+/);
    const uniqueWords = [...new Set(words)];
    return uniqueWords.join(' ');
  }

  /**
   * 標準化地址
   */
  private standardizeAddress(value: any): string {
    if (typeof value !== 'string') return String(value);
    
    let address = value.trim();
    
    // 統一全形轉半形
    address = this.fullToHalf(address);
    
    // 標準化常見地址元素
    const replacements: Record<string, string> = {
      '台北': '臺北',
      '台中': '臺中',
      '台南': '臺南',
      '台東': '臺東',
      '台灣': '臺灣',
      '号': '號',
      '弄': '弄',
      '巷': '巷',
      '楼': '樓',
      '室': '室',
      'F': '樓',
      'f': '樓',
      'No.': '',
      'no.': '',
      '#': '',
    };
    
    for (const [from, to] of Object.entries(replacements)) {
      address = address.replace(new RegExp(from, 'gi'), to);
    }
    
    // 移除多餘空格
    address = address.replace(/\s+/g, ' ');
    
    // 確保數字和單位之間沒有空格
    address = address.replace(/(\d+)\s*(號|樓|室|弄|巷)/g, '$1$2');
    
    return address;
  }

  /**
   * 全形轉半形
   */
  private fullToHalf(str: string): string {
    let result = '';
    
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      
      // 全形空格
      if (charCode === 0x3000) {
        result += ' ';
      }
      // 其他全形字元
      else if (charCode >= 0xFF01 && charCode <= 0xFF5E) {
        result += String.fromCharCode(charCode - 0xFEE0);
      }
      // 保持原樣
      else {
        result += str.charAt(i);
      }
    }
    
    return result;
  }

  /**
   * 偵測需要的清理規則
   */
  detectCleaningNeeds(data: any[]): CleaningRule[] {
    const rules: CleaningRule[] = [];
    
    if (data.length === 0) return rules;
    
    // 分析每個欄位
    const headers = Object.keys(data[0]);
    
    for (const field of headers) {
      const values = data.map(row => row[field]).filter(v => v != null);
      
      if (values.length === 0) continue;
      
      // 檢查是否需要 trim
      if (this.needsTrim(values)) {
        rules.push({
          field,
          type: 'trim',
        });
      }
      
      // 檢查是否為電話號碼
      if (this.isPhoneField(field, values)) {
        rules.push({
          field,
          type: 'normalize_phone',
        });
      }
      
      // 檢查是否為電子郵件
      if (this.isEmailField(field, values)) {
        rules.push({
          field,
          type: 'normalize_email',
        });
      }
      
      // 檢查是否為日期
      if (this.isDateField(field, values)) {
        rules.push({
          field,
          type: 'normalize_date',
        });
      }
      
      // 檢查是否為地址
      if (this.isAddressField(field, values)) {
        rules.push({
          field,
          type: 'standardize_address',
        });
      }
      
      // 檢查是否有空值需要預設值
      if (this.hasNullValues(values, data.length)) {
        rules.push({
          field,
          type: 'default_value',
          config: {
            default: this.suggestDefaultValue(field, values),
          },
        });
      }
    }
    
    return rules;
  }

  /**
   * 檢查是否需要 trim
   */
  private needsTrim(values: any[]): boolean {
    return values.some(v => 
      typeof v === 'string' && (v.startsWith(' ') || v.endsWith(' '))
    );
  }

  /**
   * 檢查是否為電話欄位
   */
  private isPhoneField(field: string, values: any[]): boolean {
    const fieldLower = field.toLowerCase();
    if (fieldLower.includes('phone') || 
        fieldLower.includes('tel') || 
        fieldLower.includes('電話') ||
        fieldLower.includes('手機')) {
      return true;
    }
    
    // 檢查資料內容
    const phonePattern = /^[\d\s\-\+\(\)]+$/;
    const phoneCount = values.filter(v => 
      typeof v === 'string' && phonePattern.test(v)
    ).length;
    
    return phoneCount / values.length > 0.8;
  }

  /**
   * 檢查是否為電子郵件欄位
   */
  private isEmailField(field: string, values: any[]): boolean {
    const fieldLower = field.toLowerCase();
    if (fieldLower.includes('email') || 
        fieldLower.includes('mail') || 
        fieldLower.includes('郵件') ||
        fieldLower.includes('信箱')) {
      return true;
    }
    
    // 檢查資料內容
    const emailCount = values.filter(v => 
      typeof v === 'string' && v.includes('@')
    ).length;
    
    return emailCount / values.length > 0.8;
  }

  /**
   * 檢查是否為日期欄位
   */
  private isDateField(field: string, values: any[]): boolean {
    const fieldLower = field.toLowerCase();
    if (fieldLower.includes('date') || 
        fieldLower.includes('time') || 
        fieldLower.includes('日期') ||
        fieldLower.includes('時間')) {
      return true;
    }
    
    // 檢查資料內容
    const dateCount = values.filter(v => {
      const date = new Date(String(v));
      return !isNaN(date.getTime());
    }).length;
    
    return dateCount / values.length > 0.7;
  }

  /**
   * 檢查是否為地址欄位
   */
  private isAddressField(field: string, values: any[]): boolean {
    const fieldLower = field.toLowerCase();
    if (fieldLower.includes('address') || 
        fieldLower.includes('addr') || 
        fieldLower.includes('地址') ||
        fieldLower.includes('住址')) {
      return true;
    }
    
    // 檢查資料內容
    const addressKeywords = ['路', '街', '巷', '號', '樓', '市', '區', '縣'];
    const addressCount = values.filter(v => {
      const str = String(v);
      return addressKeywords.some(keyword => str.includes(keyword));
    }).length;
    
    return addressCount / values.length > 0.6;
  }

  /**
   * 檢查是否有空值
   */
  private hasNullValues(values: any[], totalRows: number): boolean {
    const nullCount = totalRows - values.length;
    return nullCount / totalRows > 0.1; // 超過 10% 為空
  }

  /**
   * 建議預設值
   */
  private suggestDefaultValue(field: string, values: any[]): any {
    const fieldLower = field.toLowerCase();
    
    // 狀態欄位
    if (fieldLower.includes('status') || fieldLower.includes('狀態')) {
      return '待處理';
    }
    
    // 布林欄位
    if (fieldLower.includes('active') || fieldLower.includes('enabled')) {
      return true;
    }
    
    // 數量欄位
    if (fieldLower.includes('count') || fieldLower.includes('quantity')) {
      return 0;
    }
    
    // 日期欄位
    if (fieldLower.includes('date') && fieldLower.includes('create')) {
      return new Date().toISOString();
    }
    
    return '';
  }

  /**
   * 預覽清理結果
   */
  preview(data: any[], rules: CleaningRule[], limit: number = 10): any[] {
    const sample = data.slice(0, limit);
    return this.clean(sample, rules);
  }

  /**
   * 獲取清理統計
   */
  getCleaningStatistics(
    original: any[],
    cleaned: any[]
  ): {
    totalChanges: number;
    changedFields: Map<string, number>;
    examples: Array<{
      field: string;
      original: any;
      cleaned: any;
    }>;
  } {
    let totalChanges = 0;
    const changedFields = new Map<string, number>();
    const examples: Array<{
      field: string;
      original: any;
      cleaned: any;
    }> = [];
    
    for (let i = 0; i < Math.min(original.length, cleaned.length); i++) {
      const originalRow = original[i];
      const cleanedRow = cleaned[i];
      
      for (const field of Object.keys(originalRow)) {
        if (originalRow[field] !== cleanedRow[field]) {
          totalChanges++;
          
          const count = changedFields.get(field) || 0;
          changedFields.set(field, count + 1);
          
          // 收集範例
          if (examples.length < 5 && !examples.find(e => e.field === field)) {
            examples.push({
              field,
              original: originalRow[field],
              cleaned: cleanedRow[field],
            });
          }
        }
      }
    }
    
    return {
      totalChanges,
      changedFields,
      examples,
    };
  }
}