/**
 * 欄位映射服務
 * 處理舊系統欄位到新系統欄位的轉換
 */

import { 
  LegacyUser, 
  LegacyCustomer, 
  LegacyRecord,
  DateFormat,
  LevelToRoleMapping
} from '@/types/legacy-import';
import { User } from '@/types/entities/user';
import { CustomerFormData } from '@/services/validation/form-schemas';
import { Timestamp } from 'firebase/firestore';

// 層級到角色的映射配置
const LEVEL_TO_ROLE: LevelToRoleMapping = {
  'L0': 'salesperson',
  'L1': 'salesperson',
  'L2': 'salesperson',
  'L3': 'admin',
  'L4': 'admin',
  'L5': 'admin',
  'L6': 'admin',
};

// 客戶欄位的預設值對照
const CUSTOMER_FIELD_MAPPINGS: Record<string, string> = {
  '等級標籤': 'level',
  '客戶來源': 'source',
  '銷售階段': 'stage',
  '名單等級': 'listLevel',
  '已成交': 'isClosed',
  '興趣': 'interests',
  '關係': 'relationship',
};

/**
 * 映射業務人員資料
 */
export function mapLegacyUser(
  legacyUser: LegacyUser,
  organizationId: string,
  teamId: string,
  businessName?: string,
  businessCode?: string
): Partial<User> {
  // 決定角色
  const role = LEVEL_TO_ROLE[legacyUser.你的層級] || 'salesperson';
  
  // 判斷是否為經理（如果職級高於 L2 或有明確的經理標記）
  const isManager = legacyUser.你的層級 && 
    (parseInt(legacyUser.你的層級.replace('L', '')) >= 3 || 
     role === 'manager' || 
     role === 'admin');

  // 處理自定義欄位
  const customFields: Record<string, any> = {};
  
  // 保存 Notion 連結
  if (legacyUser.訪談紀錄資料庫) customFields.notionInterviewDb = legacyUser.訪談紀錄資料庫;
  if (legacyUser.客戶名單資料庫) customFields.notionCustomerDb = legacyUser.客戶名單資料庫;
  if (legacyUser.客戶分析資料庫) customFields.notionAnalysisDb = legacyUser.客戶分析資料庫;
  if (legacyUser.客戶紀念日資料庫) customFields.notionAnniversaryDb = legacyUser.客戶紀念日資料庫;
  if (legacyUser.成交資料庫) customFields.notionDealDb = legacyUser.成交資料庫;
  
  // 保存原始業務代碼（如果有）
  if (businessCode) customFields.originalBusinessCode = businessCode;
  
  // 保存其他未知欄位
  Object.keys(legacyUser).forEach(key => {
    if (!['業務帳號', '公司Gmail帳號', '你的層級', 'enabled', 'Phone', 
         '訪談紀錄資料庫', '客戶名單資料庫', '客戶分析資料庫', 
         '客戶紀念日資料庫', '成交資料庫'].includes(key)) {
      customFields[key] = legacyUser[key];
    }
  });

  const mappedUser: Partial<User> = {
    email: legacyUser.公司Gmail帳號 || '',
    name: businessName || legacyUser.業務帳號,
    role,
    organizationId,
    teamIds: [teamId],
    phone: normalizePhoneNumber(legacyUser.Phone),
    isActive: legacyUser.enabled !== 'false' && legacyUser.enabled !== '0',
    personalGoals: {},
    supervisorId: null, // 將在後續處理主管關係時更新
    department: null,
    lastLoginAt: null,
  };

  // 只有在有自定義欄位時才添加
  if (Object.keys(customFields).length > 0) {
    (mappedUser as any).customFields = customFields;
  }

  return mappedUser;
}

/**
 * 映射客戶資料
 */
export function mapLegacyCustomer(
  legacyCustomer: LegacyCustomer,
  userId: string,
  teamId: string,
  organizationId: string,
  businessName?: string,
  businessCode?: string
): CustomerFormData {
  // 處理自定義欄位
  const customFields: Record<string, any> = {};
  
  // 基本資訊欄位
  if (legacyCustomer.年齡) customFields.age = legacyCustomer.年齡;
  if (legacyCustomer.年薪) customFields.annualIncome = legacyCustomer.年薪;
  if (legacyCustomer.職務名稱) customFields.jobTitle = legacyCustomer.職務名稱;
  if (legacyCustomer.性別) customFields.gender = legacyCustomer.性別;
  if (legacyCustomer.出生年月日) {
    const birthDate = parseLegacyDate(legacyCustomer.出生年月日);
    customFields.birthDate = Timestamp.fromDate(birthDate);
  }
  if (legacyCustomer.婚姻狀況) customFields.maritalStatus = legacyCustomer.婚姻狀況;
  if (legacyCustomer.子女) customFields.children = legacyCustomer.子女;
  if (legacyCustomer.年資) customFields.yearsOfService = legacyCustomer.年資;
  if (legacyCustomer.居住地區) customFields.residenceArea = legacyCustomer.居住地區;
  
  // 銷售相關欄位
  if (legacyCustomer.建議方案) customFields.suggestedPlan = legacyCustomer.建議方案;
  if (legacyCustomer.銷售階段) customFields.salesStage = legacyCustomer.銷售階段;
  if (legacyCustomer.名單等級) customFields.listLevel = legacyCustomer.名單等級;
  if (legacyCustomer.金額美金萬) customFields.dealAmountUSD = legacyCustomer.金額美金萬;
  if (legacyCustomer.進單理由) customFields.dealReason = legacyCustomer.進單理由;
  if (legacyCustomer.等級標籤) customFields.levelTag = legacyCustomer.等級標籤;
  if (legacyCustomer.客戶來源) customFields.customerSource = legacyCustomer.客戶來源;
  if (legacyCustomer.已成交) customFields.isClosed = legacyCustomer.已成交 === '是' || legacyCustomer.已成交 === 'true';
  
  // 個人興趣與習慣
  if (legacyCustomer.興趣) customFields.interests = legacyCustomer.興趣;
  if (legacyCustomer.關係) customFields.relationship = legacyCustomer.關係;
  
  // 財務狀況
  if (legacyCustomer.醫療險) customFields.medicalInsurance = legacyCustomer.醫療險;
  if (legacyCustomer.車貸) customFields.carLoan = legacyCustomer.車貸;
  if (legacyCustomer.車子) customFields.car = legacyCustomer.車子;
  if (legacyCustomer.股票期貨基金) customFields.investments = legacyCustomer.股票期貨基金;
  if (legacyCustomer.理財習慣) customFields.financialHabits = legacyCustomer.理財習慣;
  if (legacyCustomer.理財偏好) customFields.financialPreferences = legacyCustomer.理財偏好;
  if (legacyCustomer.房貸房租) customFields.housingExpense = legacyCustomer.房貸房租;
  if (legacyCustomer.房子土地) customFields.realEstate = legacyCustomer.房子土地;
  if (legacyCustomer.存款定存) customFields.savings = legacyCustomer.存款定存;
  if (legacyCustomer.信貸) customFields.personalLoan = legacyCustomer.信貸;
  if (legacyCustomer.儲蓄險) customFields.savingsInsurance = legacyCustomer.儲蓄險;
  if (legacyCustomer.加密貨幣) customFields.cryptocurrency = legacyCustomer.加密貨幣;
  
  // 需求與想法
  if (legacyCustomer.想法需求) customFields.needsAndThoughts = legacyCustomer.想法需求;
  
  // 保存原始業務資訊
  if (businessCode) customFields.originalBusinessCode = businessCode;
  if (businessName && businessName !== legacyCustomer.負責業務) {
    customFields.originalBusinessName = legacyCustomer.負責業務;
  }
  
  // 處理所有其他未知欄位
  Object.keys(legacyCustomer).forEach(key => {
    if (!['負責業務', '客戶名稱', '公司名稱', '電子郵件地址', '聯絡電話', 
         '年齡', '年薪', '職務名稱', '建議方案', '銷售階段', '名單等級', 
         '金額美金萬', '進單理由', '性別', '等級標籤', '客戶來源', '已成交', 
         '興趣', '關係', '年資', '居住地區', '醫療險', '車貸', '車子', 
         '股票期貨基金', '理財習慣', '理財偏好', '房貸房租', '房子土地', 
         '存款定存', '想法需求', '信貸', '儲蓄險', '出生年月日', '加密貨幣', 
         '婚姻狀況', '子女'].includes(key)) {
      customFields[key] = legacyCustomer[key];
    }
  });

  const mappedCustomer: CustomerFormData = {
    name: legacyCustomer.客戶名稱,
    company: legacyCustomer.公司名稱 || '',
    email: legacyCustomer.電子郵件地址,
    phone: normalizePhoneNumber(legacyCustomer.聯絡電話),
    assignedTo: userId,
    teamId,
    notes: '', // 將在訪談記錄中處理
    tags: [], // 可以根據某些欄位自動生成標籤
  };

  // 自動生成標籤
  const tags: string[] = [];
  if (legacyCustomer.等級標籤) tags.push(legacyCustomer.等級標籤);
  if (legacyCustomer.客戶來源) tags.push(legacyCustomer.客戶來源);
  if (legacyCustomer.已成交 === '是') tags.push('已成交');
  if (legacyCustomer.銷售階段) tags.push(legacyCustomer.銷售階段);
  
  if (tags.length > 0) {
    mappedCustomer.tags = tags;
  }

  // 添加自定義欄位
  if (Object.keys(customFields).length > 0) {
    (mappedCustomer as any).customFields = customFields;
  }

  return mappedCustomer;
}

/**
 * 映射訪談記錄資料
 */
export function mapLegacyRecord(
  legacyRecord: LegacyRecord,
  userId: string,
  customerId: string,
  organizationId: string,
  teamId: string
): {
  title: string;
  content: string;
  type: 'meeting' | 'call' | 'email' | 'visit' | 'other';
  customerId: string;
  date: Date;
  nextFollowUpDate?: Date;
  tags: string[];
  metadata?: Record<string, any>;
} {
  // 決定記錄類型（基於標題或內容）
  let recordType: 'meeting' | 'call' | 'email' | 'visit' | 'other' = 'meeting';
  const titleLower = legacyRecord.標題.toLowerCase();
  
  if (titleLower.includes('電話') || titleLower.includes('call')) {
    recordType = 'call';
  } else if (titleLower.includes('郵件') || titleLower.includes('email')) {
    recordType = 'email';
  } else if (titleLower.includes('拜訪') || titleLower.includes('visit')) {
    recordType = 'visit';
  } else if (titleLower.includes('會議') || titleLower.includes('meeting')) {
    recordType = 'meeting';
  } else {
    recordType = 'other';
  }

  // 處理日期
  const meetingDate = parseLegacyDate(legacyRecord.訪談日期);
  const followUpDate = legacyRecord.下次跟進日期 ? 
    parseLegacyDate(legacyRecord.下次跟進日期) : undefined;

  // 生成標籤
  const tags: string[] = ['導入資料'];
  if (recordType !== 'other') tags.push(recordType);

  // 處理元數據
  const metadata: Record<string, any> = {
    importedFrom: 'legacy',
    originalBusinessAccount: legacyRecord.業務帳號,
    originalCustomerName: legacyRecord.客戶名稱,
  };

  if (legacyRecord.提交時間) metadata.submitTime = legacyRecord.提交時間;
  if (legacyRecord.建立時間) metadata.createTime = legacyRecord.建立時間;
  if (legacyRecord.匯入時間) metadata.importTime = legacyRecord.匯入時間;
  if (legacyRecord.客戶名單資料庫) metadata.notionCustomerDb = legacyRecord.客戶名單資料庫;

  return {
    title: legacyRecord.標題,
    content: legacyRecord.訪談結果,
    type: recordType,
    customerId,
    date: meetingDate,
    nextFollowUpDate: followUpDate,
    tags,
    metadata,
  };
}

/**
 * 解析舊系統的日期格式
 */
export function parseLegacyDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();
  
  // 清理字串
  const cleaned = dateStr.trim();
  
  // MM/DD/YYYY 格式
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
    const [month, day, year] = cleaned.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // YYYY年M月D日 格式（支援 2-4 位數年份）
  if (/^\d{2,4}年\d{1,2}月\d{1,2}日$/.test(cleaned)) {
    const match = cleaned.match(/^(\d{2,4})年(\d{1,2})月(\d{1,2})日$/);
    if (match) {
      const [_, yearStr, month, day] = match;
      let year = parseInt(yearStr);
      // 如果是 2 位數年份，假設是 1900-1999 或 2000-2099
      if (year < 100) {
        year = year < 50 ? 2000 + year : 1900 + year;
      }
      return new Date(year, parseInt(month) - 1, parseInt(day));
    }
  }
  
  // YYYY-MM-DD 格式
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return new Date(cleaned);
  }
  
  // 嘗試使用 Date 建構子解析
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  // 如果都失敗，返回當前日期
  console.warn(`無法解析日期格式: ${dateStr} → ${cleaned}`);
  return new Date();
}

/**
 * 正規化電話號碼
 */
function normalizePhoneNumber(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  
  // 移除所有非數字和加號字符
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // 處理台灣電話格式
  if (cleaned.startsWith('+886')) {
    cleaned = '0' + cleaned.substring(4);
  }
  
  // 如果是手機號碼，加上減號分隔
  if (cleaned.match(/^09\d{8}$/)) {
    cleaned = cleaned.replace(/^(09\d{2})(\d{3})(\d{3})$/, '$1-$2-$3');
  }
  
  return cleaned || undefined;
}

/**
 * 生成映射統計報告
 */
export function generateMappingStatistics(
  users: LegacyUser[],
  customers: LegacyCustomer[],
  records: LegacyRecord[]
): {
  userStats: Record<string, number>;
  customerStats: Record<string, number>;
  recordStats: Record<string, number>;
  dateFormats: Record<string, number>;
} {
  // 統計用戶層級分布
  const userStats: Record<string, number> = {};
  users.forEach(user => {
    const level = user.你的層級 || 'Unknown';
    userStats[level] = (userStats[level] || 0) + 1;
  });

  // 統計客戶欄位覆蓋率
  const customerStats: Record<string, number> = {};
  const customerFields = [
    '電子郵件地址', '聯絡電話', '公司名稱', '年齡', '年薪', 
    '職務名稱', '銷售階段', '客戶來源', '已成交'
  ];
  
  customerFields.forEach(field => {
    const count = customers.filter(c => c[field]).length;
    const percentage = Math.round((count / customers.length) * 100);
    customerStats[field] = percentage;
  });

  // 統計記錄類型
  const recordStats: Record<string, number> = {};
  records.forEach(record => {
    const titleLower = record.標題.toLowerCase();
    let type = 'other';
    
    if (titleLower.includes('電話')) type = 'call';
    else if (titleLower.includes('郵件')) type = 'email';
    else if (titleLower.includes('拜訪')) type = 'visit';
    else if (titleLower.includes('會議')) type = 'meeting';
    
    recordStats[type] = (recordStats[type] || 0) + 1;
  });

  // 統計日期格式
  const dateFormats: Record<string, number> = {};
  records.forEach(record => {
    const dateStr = record.訪談日期;
    if (!dateStr) {
      dateFormats['empty'] = (dateFormats['empty'] || 0) + 1;
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      dateFormats['MM/DD/YYYY'] = (dateFormats['MM/DD/YYYY'] || 0) + 1;
    } else if (/^\d{4}年\d{1,2}月\d{1,2}日$/.test(dateStr)) {
      dateFormats['YYYY年M月D日'] = (dateFormats['YYYY年M月D日'] || 0) + 1;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      dateFormats['YYYY-MM-DD'] = (dateFormats['YYYY-MM-DD'] || 0) + 1;
    } else {
      dateFormats['other'] = (dateFormats['other'] || 0) + 1;
    }
  });

  return {
    userStats,
    customerStats,
    recordStats,
    dateFormats,
  };
}