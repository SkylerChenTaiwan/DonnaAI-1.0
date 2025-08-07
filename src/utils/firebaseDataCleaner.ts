/**
 * Firebase 資料清理工具
 * 確保所有資料符合 Firestore 的要求
 */

import { Timestamp } from 'firebase/firestore';

/**
 * 清理物件中的所有欄位，移除 undefined 和無效值
 */
export function cleanFirestoreData(data: any): any {
  if (data === null) return null;
  if (data === undefined) return null;
  
  // 處理 Date 物件
  if (data instanceof Date) {
    if (isNaN(data.getTime())) {
      console.warn('Invalid date detected, using current date');
      return Timestamp.now();
    }
    return Timestamp.fromDate(data);
  }
  
  // 處理 Timestamp
  if (data instanceof Timestamp) {
    return data;
  }
  
  // 處理陣列
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => cleanFirestoreData(item));
  }
  
  // 處理物件
  if (typeof data === 'object' && data !== null) {
    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // 跳過 undefined 值
      if (value === undefined) continue;
      
      // 跳過空字串鍵
      if (key === '') continue;
      
      // 遞迴清理值
      const cleanedValue = cleanFirestoreData(value);
      
      // 只保留非 undefined 的值
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    }
    
    return cleaned;
  }
  
  // 處理字串
  if (typeof data === 'string') {
    // 移除控制字符
    return data.replace(/[\x00-\x1F\x7F]/g, '');
  }
  
  // 處理數字
  if (typeof data === 'number') {
    // 檢查是否為有效數字
    if (isNaN(data) || !isFinite(data)) {
      console.warn('Invalid number detected:', data);
      return 0;
    }
    return data;
  }
  
  // 處理布林值
  if (typeof data === 'boolean') {
    return data;
  }
  
  // 其他類型轉為字串
  console.warn('Unknown data type, converting to string:', typeof data);
  return String(data);
}

/**
 * 解析各種日期格式
 */
export function parseFlexibleDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  
  // 清理字串
  const cleaned = dateStr.toString().trim();
  
  // 空字串
  if (!cleaned) return null;
  
  // 嘗試各種格式
  const patterns = [
    // YYYY年MM月DD日 或 YYYY年M月D日
    {
      regex: /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
      handler: (match: RegExpMatchArray) => {
        const [_, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    },
    // YY年MM月DD日 或 YY年M月D日（2位數年份）
    {
      regex: /^(\d{2})年(\d{1,2})月(\d{1,2})日$/,
      handler: (match: RegExpMatchArray) => {
        const [_, yearStr, month, day] = match;
        const year = parseInt(yearStr);
        // 假設 00-29 是 2000-2029，30-99 是 1930-1999
        const fullYear = year < 30 ? 2000 + year : 1900 + year;
        return new Date(fullYear, parseInt(month) - 1, parseInt(day));
      }
    },
    // MM/DD/YYYY
    {
      regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      handler: (match: RegExpMatchArray) => {
        const [_, month, day, year] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    },
    // YYYY-MM-DD
    {
      regex: /^(\d{4})-(\d{2})-(\d{2})$/,
      handler: (match: RegExpMatchArray) => {
        const [_, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    },
    // YYYY/MM/DD
    {
      regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
      handler: (match: RegExpMatchArray) => {
        const [_, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    },
    // DD/MM/YYYY (歐洲格式)
    {
      regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
      handler: (match: RegExpMatchArray) => {
        const [_, day, month, year] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
  ];
  
  // 嘗試每個模式
  for (const pattern of patterns) {
    const match = cleaned.match(pattern.regex);
    if (match) {
      const date = pattern.handler(match);
      // 驗證日期是否有效
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  // 嘗試使用 Date 建構子
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    // 檢查年份是否合理（1900-2100）
    const year = parsed.getFullYear();
    if (year >= 1900 && year <= 2100) {
      return parsed;
    }
  }
  
  // 如果都失敗，記錄警告並返回 null
  console.warn(`無法解析日期格式: ${dateStr}`);
  return null;
}

/**
 * 驗證並清理電話號碼
 */
export function cleanPhoneNumber(phone: string | undefined | null): string | null {
  if (!phone) return null;
  
  // 移除所有非數字和加號字符
  const cleaned = phone.toString().replace(/[^\d+]/g, '');
  
  // 如果清理後是空的，返回 null
  if (!cleaned) return null;
  
  // 驗證長度（至少 7 位數）
  if (cleaned.length < 7) {
    console.warn('Phone number too short:', phone);
    return null;
  }
  
  // 驗證長度（最多 15 位數）
  if (cleaned.length > 15) {
    console.warn('Phone number too long:', phone);
    return cleaned.substring(0, 15);
  }
  
  return cleaned;
}

/**
 * 驗證並清理 Email
 */
export function cleanEmail(email: string | undefined | null): string | null {
  if (!email) return null;
  
  const cleaned = email.toString().trim().toLowerCase();
  
  // 基本 Email 驗證
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    console.warn('Invalid email format:', email);
    return null;
  }
  
  return cleaned;
}

/**
 * 確保字串不超過 Firestore 限制（1MB）
 */
export function truncateString(str: string | undefined | null, maxLength: number = 10000): string | null {
  if (!str) return null;
  
  const cleaned = str.toString();
  
  if (cleaned.length > maxLength) {
    console.warn(`String truncated from ${cleaned.length} to ${maxLength} characters`);
    return cleaned.substring(0, maxLength);
  }
  
  return cleaned;
}

/**
 * 批量清理客戶資料
 */
export function cleanCustomerData(customer: any): any {
  return cleanFirestoreData({
    ...customer,
    name: truncateString(customer.name, 200) || '未命名客戶',
    email: cleanEmail(customer.email),
    phone: cleanPhoneNumber(customer.phone),
    address: truncateString(customer.address, 500),
    notes: truncateString(customer.notes, 5000),
    company: truncateString(customer.company, 200),
    // 確保必要欄位存在
    status: customer.status || 'active',
    createdAt: customer.createdAt || Timestamp.now(),
    updatedAt: customer.updatedAt || Timestamp.now(),
    // 移除可能造成問題的欄位
    customFields: cleanCustomFields(customer.customFields)
  });
}

/**
 * 清理自訂欄位
 */
function cleanCustomFields(fields: any): any {
  if (!fields || typeof fields !== 'object') return {};
  
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(fields)) {
    // 跳過空鍵
    if (!key) continue;
    
    // 限制鍵的長度
    const cleanKey = key.substring(0, 100);
    
    // 清理值
    if (typeof value === 'string') {
      cleaned[cleanKey] = truncateString(value, 1000);
    } else if (value instanceof Date) {
      cleaned[cleanKey] = Timestamp.fromDate(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      cleaned[cleanKey] = value;
    } else if (value === null) {
      cleaned[cleanKey] = null;
    }
    // 忽略其他類型
  }
  
  return cleaned;
}

/**
 * 批量清理記錄資料
 */
export function cleanRecordData(record: any): any {
  return cleanFirestoreData({
    ...record,
    title: truncateString(record.title, 200) || '未命名記錄',
    content: truncateString(record.content, 10000) || '',
    type: record.type || 'meeting',
    date: record.date ? Timestamp.fromDate(parseFlexibleDate(record.date) || new Date()) : Timestamp.now(),
    nextFollowUpDate: record.nextFollowUpDate ? 
      Timestamp.fromDate(parseFlexibleDate(record.nextFollowUpDate) || new Date()) : 
      undefined,
    tags: Array.isArray(record.tags) ? 
      record.tags.filter((t: any) => typeof t === 'string').slice(0, 20) : 
      [],
    // 確保必要欄位存在
    createdAt: record.createdAt || Timestamp.now(),
    updatedAt: record.updatedAt || Timestamp.now()
  });
}

/**
 * 批量清理用戶資料
 */
export function cleanUserData(user: any): any {
  return cleanFirestoreData({
    ...user,
    name: truncateString(user.name, 100) || '未命名用戶',
    email: cleanEmail(user.email) || `user_${Date.now()}@example.com`,
    phone: cleanPhoneNumber(user.phone),
    role: ['admin', 'manager', 'salesperson'].includes(user.role) ? user.role : 'salesperson',
    department: truncateString(user.department, 100),
    jobTitle: truncateString(user.jobTitle, 100),
    // 確保必要欄位存在
    isActive: user.isActive !== undefined ? user.isActive : true,
    createdAt: user.createdAt || Timestamp.now(),
    teamIds: Array.isArray(user.teamIds) ? user.teamIds : [],
    personalGoals: user.personalGoals || {}
  });
}