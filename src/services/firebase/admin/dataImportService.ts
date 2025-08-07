/**
 * 資料匯入服務
 * 支援批量匯入客戶、記錄、任務和用戶資料
 */

import {
  collection,
  doc,
  writeBatch,
  Timestamp,
  query,
  where,
  getDocs,
  setDoc,
  limit,
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';
import { getAuth } from 'firebase/auth';
// import { createUserWithEmailAndPassword } from 'firebase/auth'; // 不應該在這裡使用，改用 Cloud Function
import { Customer, Record, Task } from '@/types/firebase';
import { User, CreateUserData } from '@/types/entities';
import { Team, CreateTeamData } from '@/types/entities/team';
import { isOrgAdmin } from '../permissions';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  cleanFirestoreData, 
  cleanCustomerData,
  cleanRecordData,
  cleanUserData,
  parseFlexibleDate 
} from '@/utils/firebaseDataCleaner';

export type ImportType = 'customers' | 'records' | 'tasks' | 'users' | 'hierarchy' | 'auto';

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
  imported?: {
    users: number;
    teams: number;
    customers: number;
    records: number;
  };
  warnings?: string[];
}

export interface ImportProgress {
  current: number;
  total: number;
  status: 'parsing' | 'validating' | 'importing' | 'complete' | 'error';
  message?: string;
}

type ProgressCallback = (progress: ImportProgress) => void;

/**
 * 解析 CSV 檔案
 */
async function parseCSV(fileUri: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    // React Native 環境下需要先讀取檔案內容
    fetch(fileUri)
      .then(response => response.text())
      .then(text => {
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          encoding: 'UTF-8',
        });
        
        if (result.errors.length > 0) {
          reject(new Error(`CSV 解析錯誤: ${result.errors[0].message}`));
        } else {
          resolve(result.data);
        }
      })
      .catch(reject);
  });
}

/**
 * 解析 Excel 檔案
 */
async function parseExcel(fileUri: string): Promise<any[]> {
  try {
    // React Native 環境下需要先讀取檔案內容
    const response = await fetch(fileUri);
    const arrayBuffer = await response.arrayBuffer();
    
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const data = XLSX.utils.sheet_to_json(worksheet, {
      raw: false, // 將日期轉換為字串
      dateNF: 'yyyy-mm-dd',
    });
    
    return data;
  } catch (error) {
    throw new Error(`Excel 解析錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 解析檔案（支援 CSV 和 Excel）
 */
export async function parseImportFile(
  fileUri: string,
  fileType: string
): Promise<any[]> {
  if (fileType.includes('csv')) {
    return parseCSV(fileUri);
  } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
    return parseExcel(fileUri);
  } else {
    throw new Error('不支援的檔案格式');
  }
}

/**
 * 驗證客戶資料
 */
function validateCustomerData(data: any, row: number): { isValid: boolean; error?: string } {
  if (!data.name && !data.公司名稱 && !data.客戶名稱) {
    return { isValid: false, error: `第 ${row} 列: 缺少客戶名稱` };
  }
  
  // 支援不同的欄位名稱
  const email = data.email || data.電子郵件 || data.電郵;
  if (email && !isValidEmail(email)) {
    return { isValid: false, error: `第 ${row} 列: 電子郵件格式錯誤` };
  }
  
  return { isValid: true };
}

/**
 * 驗證記錄資料
 */
function validateRecordData(data: any, row: number): { isValid: boolean; error?: string } {
  if (!data.title && !data.標題 && !data.記錄標題) {
    return { isValid: false, error: `第 ${row} 列: 缺少記錄標題` };
  }
  
  if (!data.content && !data.內容 && !data.記錄內容) {
    return { isValid: false, error: `第 ${row} 列: 缺少記錄內容` };
  }
  
  return { isValid: true };
}

/**
 * 驗證任務資料
 */
function validateTaskData(data: any, row: number): { isValid: boolean; error?: string } {
  if (!data.title && !data.標題 && !data.任務名稱) {
    return { isValid: false, error: `第 ${row} 列: 缺少任務標題` };
  }
  
  const dueDate = data.dueDate || data.截止日期 || data.到期日;
  if (dueDate && !isValidDate(dueDate)) {
    return { isValid: false, error: `第 ${row} 列: 日期格式錯誤` };
  }
  
  return { isValid: true };
}

/**
 * 驗證用戶資料
 */
function validateUserData(data: any, row: number): { isValid: boolean; error?: string } {
  const email = data.email || data.電子郵件 || data.電郵;
  if (!email) {
    return { isValid: false, error: `第 ${row} 列: 缺少電子郵件` };
  }
  
  if (!isValidEmail(email)) {
    return { isValid: false, error: `第 ${row} 列: 電子郵件格式錯誤` };
  }
  
  if (!data.name && !data.姓名 && !data.用戶名稱) {
    return { isValid: false, error: `第 ${row} 列: 缺少用戶姓名` };
  }
  
  const role = data.role || data.角色 || data.權限;
  if (role && !['salesperson', 'manager', 'admin'].includes(role)) {
    return { isValid: false, error: `第 ${row} 列: 無效的角色類型` };
  }
  
  return { isValid: true };
}

/**
 * 輔助函數：驗證電子郵件格式
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 輔助函數：驗證日期格式
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * 批量匯入資料
 */
export async function importData(
  type: ImportType,
  data: any[],
  onProgress?: ProgressCallback
): Promise<ImportResult> {
  const db = getFirebaseDb();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('用戶未登入');
  }
  
  // 檢查權限
  const isAdmin = await isOrgAdmin(currentUser.uid);
  if (!isAdmin) {
    throw new Error('您沒有權限執行此操作');
  }
  
  // 獲取當前用戶的組織 ID
  const userDoc = await getDocs(
    query(collection(db, 'users'), where('uid', '==', currentUser.uid))
  );
  const organizationId = userDoc.docs[0]?.data()?.organizationId;
  
  if (!organizationId) {
    throw new Error('無法獲取組織資訊');
  }
  
  const result: ImportResult = {
    total: data.length,
    success: 0,
    failed: 0,
    errors: [],
  };
  
  // 更新進度：開始驗證
  onProgress?.({
    current: 0,
    total: data.length,
    status: 'validating',
    message: '正在驗證資料...',
  });
  
  // 驗證資料
  const validatedData: Array<{ data: any; row: number }> = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = i + 2; // Excel/CSV 第一列是標題，資料從第二列開始
    const item = data[i];
    
    let validation: { isValid: boolean; error?: string };
    
    switch (type) {
      case 'customers':
        validation = validateCustomerData(item, row);
        break;
      case 'records':
        validation = validateRecordData(item, row);
        break;
      case 'tasks':
        validation = validateTaskData(item, row);
        break;
      case 'users':
        validation = validateUserData(item, row);
        break;
      default:
        validation = { isValid: false, error: '不支援的匯入類型' };
    }
    
    if (validation.isValid) {
      validatedData.push({ data: item, row });
    } else {
      result.failed++;
      result.errors.push({
        row,
        message: validation.error || '驗證失敗',
      });
    }
  }
  
  // 更新進度：開始匯入
  onProgress?.({
    current: 0,
    total: validatedData.length,
    status: 'importing',
    message: '正在匯入資料...',
  });
  
  // 批量匯入（每批最多 500 筆）
  const batchSize = 500;
  const batches = [];
  
  for (let i = 0; i < validatedData.length; i += batchSize) {
    batches.push(validatedData.slice(i, i + batchSize));
  }
  
  let processedCount = 0;
  
  for (const batchData of batches) {
    const batch = writeBatch(db);
    
    try {
      for (const { data: item, row } of batchData) {
        switch (type) {
          case 'customers':
            await importCustomer(batch, item, organizationId, currentUser.uid);
            break;
          case 'records':
            await importRecord(batch, item, organizationId, currentUser.uid);
            break;
          case 'tasks':
            await importTask(batch, item, organizationId, currentUser.uid);
            break;
          case 'users':
            // 用戶需要特殊處理（建立 Auth 帳號）
            await importUser(item, organizationId);
            break;
        }
        
        result.success++;
        processedCount++;
        
        // 更新進度
        onProgress?.({
          current: processedCount,
          total: validatedData.length,
          status: 'importing',
          message: `正在匯入第 ${processedCount} / ${validatedData.length} 筆資料...`,
        });
      }
      
      // 提交批次（用戶除外，因為已經單獨處理）
      if (type !== 'users') {
        await batch.commit();
      }
    } catch (error) {
      // 批次中的錯誤
      for (const { row } of batchData) {
        result.failed++;
        result.success = Math.max(0, result.success - 1);
        result.errors.push({
          row,
          message: error instanceof Error ? error.message : '匯入失敗',
        });
      }
    }
  }
  
  // 更新進度：完成
  onProgress?.({
    current: processedCount,
    total: validatedData.length,
    status: 'complete',
    message: '匯入完成',
  });
  
  return result;
}

/**
 * 匯入單筆客戶資料
 */
async function importCustomer(
  batch: any,
  data: any,
  organizationId: string,
  userId: string
): Promise<void> {
  const db = getFirebaseDb();
  const customerRef = doc(collection(db, 'customers'));
  
  // 準備原始客戶資料
  const rawCustomer = {
    name: data.name || data.公司名稱 || data.客戶名稱 || '',
    email: data.email || data.電子郵件 || data.電郵 || null,
    phone: data.phone || data.電話 || data.聯絡電話 || null,
    company: data.company || data.公司 || null,
    address: data.address || data.地址 || null,
    industry: data.industry || data.產業 || null,
    status: 'active',
    organizationId,
    userId,
    assignedTo: userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    notes: data.notes || data.備註 || null,
    tags: data.tags || [],
    // 加入其他可能的欄位
    ...data
  };
  
  // 使用清理工具處理資料
  const cleanedCustomer = cleanCustomerData(rawCustomer);
  
  batch.set(customerRef, cleanedCustomer);
}

/**
 * 匯入單筆記錄資料
 */
async function importRecord(
  batch: any,
  data: any,
  organizationId: string,
  userId: string
): Promise<void> {
  const db = getFirebaseDb();
  const recordRef = doc(collection(db, 'records'));
  
  // 準備原始記錄資料
  const rawRecord = {
    title: data.title || data.標題 || data.記錄標題 || '',
    content: data.content || data.內容 || data.記錄內容 || '',
    type: data.type || data.類型 || 'meeting',
    customerId: data.customerId || data.客戶ID || null,
    date: parseFlexibleDate(data.date || data.日期 || data.訪談日期) || new Date(),
    nextFollowUpDate: data.nextFollowUpDate ? parseFlexibleDate(data.nextFollowUpDate) : null,
    tags: data.tags ? (typeof data.tags === 'string' ? data.tags.split(',') : data.tags) : [],
    organizationId,
    userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    // 加入其他可能的欄位
    ...data
  };
  
  // 使用清理工具處理資料
  const cleanedRecord = cleanRecordData(rawRecord);
  
  batch.set(recordRef, cleanedRecord);
}

/**
 * 匯入單筆任務資料
 */
async function importTask(
  batch: any,
  data: any,
  organizationId: string,
  userId: string
): Promise<void> {
  const db = getFirebaseDb();
  const taskRef = doc(collection(db, 'tasks'));
  
  const task: Partial<Task> = {
    title: data.title || data.標題 || data.任務名稱 || '',
    description: data.description || data.描述 || data.說明 || null,
    status: data.status || data.狀態 || 'pending',
    priority: data.priority || data.優先級 || 'medium',
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    customerId: data.customerId || data.客戶ID || null,
    assignedTo: data.assignedTo || data.負責人 || userId,
    organizationId,
    userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    completedAt: null,
  };
  
  batch.set(taskRef, task);
}

/**
 * 匯入單筆用戶資料
 */
async function importUser(
  data: any,
  organizationId: string
): Promise<void> {
  const db = getFirebaseDb();
  const auth = getAuth();
  
  // 準備原始用戶資料
  const rawUser = {
    email: data.email || data.電子郵件 || data.電郵 || data.公司Gmail帳號,
    name: data.name || data.姓名 || data.用戶名稱 || data.業務帳號,
    role: data.role || data.角色 || data.權限 || 'salesperson',
    department: data.department || data.部門 || null,
    phone: data.phone || data.電話 || data.Phone || null,
    organizationId,
    isActive: data.enabled !== 'false' && data.enabled !== '0',
    // 加入其他可能的欄位
    ...data
  };
  
  // 使用清理工具處理資料
  const cleanedUser = cleanUserData(rawUser);
  
  // 不應該在前端建立 Auth 帳號，這會導致自動登入
  // 應該使用 Cloud Function 或後端服務來建立用戶
  console.error('⚠️ 警告：dataImportService 不應該直接建立 Auth 帳號');
  console.error('請使用 legacy-import 服務或 Cloud Function');
  
  // 暫時只建立 Firestore 文件，不建立 Auth 帳號
  try {
    // 生成一個臨時的 UID
    const uid = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 建立 Firestore 用戶文件（但沒有對應的 Auth 帳號）
    const userRef = doc(db, 'users', uid);
    const userData = {
      ...cleanedUser,
      id: uid,
      uid,
      createdAt: new Date(),
      lastLoginAt: null,
      supervisorId: null,
      teamIds: [],
      personalGoals: {},
    };
    
    await setDoc(userRef, userData);
    console.warn(`⚠️ 已建立用戶文件但無 Auth 帳號: ${cleanedUser.email}`);
  } catch (error) {
    // 如果是已存在的用戶，只更新資料
    if (error instanceof Error && error.message.includes('already-exists')) {
      // 查找現有用戶
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', cleanedUser.email),
        where('organizationId', '==', organizationId)
      );
      const snapshot = await getDocs(usersQuery);
      
      if (!snapshot.empty) {
        const existingUser = snapshot.docs[0];
        await existingUser.ref.update({
          ...cleanedUser,
          updatedAt: Timestamp.now(),
        });
      }
    } else {
      throw error;
    }
  }
}

/**
 * 產生匯入範本
 */
export function generateImportTemplate(type: ImportType): string {
  const templates: Record<ImportType, any[]> = {
    customers: [
      {
        公司名稱: 'ABC 公司',
        聯絡人: '張三',
        電子郵件: 'contact@abc.com',
        電話: '02-12345678',
        地址: '台北市信義區信義路一段1號',
        產業: '科技業',
      },
      {
        公司名稱: 'XYZ 企業',
        聯絡人: '李四',
        電子郵件: 'info@xyz.com',
        電話: '03-87654321',
        地址: '新竹市東區光復路二段2號',
        產業: '製造業',
      },
    ],
    records: [
      {
        標題: '產品討論會議',
        內容: '討論新產品開發進度和市場策略',
        類型: 'meeting',
        日期: '2024-03-01',
        標籤: '產品,策略',
      },
      {
        標題: '客戶拜訪記錄',
        內容: '拜訪客戶了解需求，介紹新服務方案',
        類型: 'visit',
        日期: '2024-03-02',
        標籤: '客戶,銷售',
      },
    ],
    tasks: [
      {
        任務名稱: '準備產品提案',
        描述: '為下週的客戶會議準備產品提案簡報',
        優先級: 'high',
        截止日期: '2024-03-10',
        狀態: 'pending',
      },
      {
        任務名稱: '更新客戶資料',
        描述: '更新本月新增客戶的聯絡資訊',
        優先級: 'medium',
        截止日期: '2024-03-15',
        狀態: 'pending',
      },
    ],
    users: [
      {
        姓名: '王小明',
        電子郵件: 'wang@example.com',
        角色: 'salesperson',
        部門: '業務部',
        電話: '0912-345678',
      },
      {
        姓名: '陳小華',
        電子郵件: 'chen@example.com',
        角色: 'manager',
        部門: '業務部',
        電話: '0923-456789',
      },
    ],
  };
  
  const template = templates[type];
  const csv = Papa.unparse(template, {
    header: true,
    encoding: 'UTF-8',
  });
  
  return csv;
}

/**
 * 智慧型資料匯入 - 自動識別檔案類型和欄位映射
 */
export class SmartDataImporter {
  private db = getFirebaseDb();
  private organizationId: string;
  private userIdMap = new Map<string, string>(); // 姓名/Email -> Firebase ID
  private customerIdMap = new Map<string, string>(); // 客戶識別 -> Firebase ID
  private teamIdMap = new Map<string, string>(); // 團隊名稱 -> Firebase ID
  
  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  /**
   * 智慧分析 CSV 欄位並判斷檔案類型
   */
  private analyzeFileType(headers: string[], rows: any[]): ImportType {
    const lowerHeaders = headers.map(h => h.toLowerCase());
    
    // 判斷檔案類型的關鍵字
    const patterns = {
      users: ['業務', '員工', 'salesperson', 'staff', '職稱', '部門'],
      customers: ['客戶', 'customer', 'client', '公司', 'company'],
      records: ['訪談', '紀錄', 'record', 'meeting', '會議', '內容'],
      hierarchy: ['層級', 'level', '上級', 'parent', '主管', 'supervisor'],
      tasks: ['任務', 'task', '待辦', 'todo', '截止', 'deadline']
    };
    
    // 計算每種類型的匹配分數
    const scores: Record<string, number> = {};
    
    for (const [type, keywords] of Object.entries(patterns)) {
      scores[type] = 0;
      for (const keyword of keywords) {
        if (lowerHeaders.some(h => h.includes(keyword))) {
          scores[type]++;
        }
      }
    }
    
    // 找出最高分的類型
    let maxScore = 0;
    let detectedType: ImportType = 'customers'; // 預設
    
    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type as ImportType;
      }
    }
    
    return detectedType;
  }

  /**
   * 尋找最匹配的欄位名
   */
  private findColumn(headers: string[], candidates: string[]): string {
    for (const candidate of candidates) {
      const found = headers.find(h => 
        h.toLowerCase().includes(candidate.toLowerCase())
      );
      if (found) return found;
    }
    return '';
  }

  /**
   * 智慧型匯入多個檔案（使用自訂映射）
   */
  async importMultipleFilesWithMapping(
    files: Array<{ uri: string; name: string; type?: string }>,
    fieldMappings: Array<{
      fileIndex: number;
      fileType: ImportType;
      mappings: { [systemField: string]: string };
      keyField?: string;
    }>,
    relations: Array<{
      sourceFile: number;
      sourceField: string;
      targetFile: number;
      targetField: string;
    }>,
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
      imported: { users: 0, teams: 0, customers: 0, records: 0 },
      warnings: []
    };

    // 建立關聯映射表
    this.relationMappings = relations;
    this.fieldMappingsConfig = fieldMappings;

    // 載入現有資料以建立映射
    await this.loadExistingMappings();

    // 按依賴順序處理檔案
    const processOrder = this.determineProcessOrder(fieldMappings);

    for (const fileIndex of processOrder) {
      const file = files[fileIndex];
      const mapping = fieldMappings[fileIndex];
      
      try {
        result.warnings?.push(`處理檔案: ${file.name}`);
        
        // 解析檔案
        const data = await parseImportFile(file.uri, file.type || 'text/csv');
        
        if (data.length === 0) {
          result.warnings?.push(`${file.name}: 檔案是空的`);
          continue;
        }

        // 使用自訂映射處理
        const fileResult = await this.processFileWithCustomMapping(
          mapping.fileType,
          data,
          mapping.mappings,
          mapping.keyField,
          onProgress
        );
        
        // 合併結果
        result.total += fileResult.total;
        result.success += fileResult.success;
        result.failed += fileResult.failed;
        result.errors.push(...fileResult.errors);
        
        if (result.imported && fileResult.imported) {
          result.imported.users += fileResult.imported.users;
          result.imported.teams += fileResult.imported.teams;
          result.imported.customers += fileResult.imported.customers;
          result.imported.records += fileResult.imported.records;
        }
      } catch (error) {
        result.warnings?.push(`${file.name}: 處理失敗 - ${error}`);
      }
    }

    return result;
  }

  private relationMappings: Array<{
    sourceFile: number;
    sourceField: string;
    targetFile: number;
    targetField: string;
  }> = [];

  private fieldMappingsConfig: Array<{
    fileIndex: number;
    fileType: ImportType;
    mappings: { [systemField: string]: string };
    keyField?: string;
  }> = [];

  /**
   * 決定檔案處理順序（根據依賴關係）
   */
  private determineProcessOrder(mappings: Array<{ fileType: ImportType }>): number[] {
    const order: number[] = [];
    const typeOrder = ['users', 'hierarchy', 'customers', 'records', 'tasks'];
    
    for (const type of typeOrder) {
      mappings.forEach((m, index) => {
        if (m.fileType === type && !order.includes(index)) {
          order.push(index);
        }
      });
    }
    
    // 加入未分類的檔案
    mappings.forEach((_, index) => {
      if (!order.includes(index)) {
        order.push(index);
      }
    });
    
    return order;
  }

  /**
   * 使用自訂映射處理檔案
   */
  async processFileWithCustomMapping(
    type: ImportType,
    data: any[],
    mappings: { [systemField: string]: string },
    keyField: string | undefined,
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    switch (type) {
      case 'users':
        return this.importUsersWithMapping(data, mappings, keyField, onProgress);
      case 'customers':
        return this.importCustomersWithMapping(data, mappings, keyField, onProgress);
      case 'records':
        return this.importRecordsWithMapping(data, mappings, keyField, onProgress);
      case 'hierarchy':
        return this.importHierarchyWithMapping(data, mappings, keyField, onProgress);
      default:
        return this.importCustomersWithMapping(data, mappings, keyField, onProgress);
    }
  }

  /**
   * 從匯入資料更新欄位定義
   */
  private async updateFieldDefinitionsFromData(
    collectionName: 'customers' | 'tasks' | 'records',
    mappings: { [systemField: string]: string }
  ): Promise<void> {
    try {
      console.log(`🔄 更新 ${collectionName} 欄位定義...`);
      
      // 取得當前欄位定義
      const { getFieldDefinitions, clearFieldDefinitionCache } = await import('../fieldDefinitions');
      const currentFields = await getFieldDefinitions(collectionName, this.organizationId);
      
      // 檢查映射中的新欄位
      const newFields = [];
      const existingFieldKeys = new Set(currentFields.map(f => f.key));
      
      for (const [systemField, sourceColumn] of Object.entries(mappings)) {
        // 如果是自訂欄位且不在當前欄位定義中
        if (systemField.startsWith('customField_') && !existingFieldKeys.has(systemField)) {
          const label = systemField.replace('customField_', '');
          newFields.push({
            key: systemField,
            label: label,
            type: 'text' as const,
            isRequired: false,
            isSystem: false,
            visible: true,
            order: currentFields.length + newFields.length
          });
        }
      }
      
      // 如果有新欄位，建立新的欄位定義版本
      if (newFields.length > 0) {
        console.log(`📝 發現 ${newFields.length} 個新自訂欄位，更新欄位定義`);
        
        const updatedFields = [...currentFields, ...newFields];
        
        // 建立新的欄位定義版本
        const fieldDefinition = {
          collectionName,
          organizationId: this.organizationId,
          fields: updatedFields,
          version: Date.now(),
          isActive: true,
          createdAt: Timestamp.now(),
          createdBy: getAuth().currentUser?.uid || 'system'
        };
        
        // 先標記舊版本為非活躍狀態
        const oldQuery = query(
          collection(this.db, 'field_definitions'),
          where('collectionName', '==', collectionName),
          where('organizationId', '==', this.organizationId),
          where('isActive', '==', true)
        );
        
        const oldSnapshot = await getDocs(oldQuery);
        const batch = writeBatch(this.db);
        
        oldSnapshot.forEach(docSnap => {
          batch.update(doc(this.db, 'field_definitions', docSnap.id), { isActive: false });
        });
        
        // 新增新版本
        const newDocRef = doc(collection(this.db, 'field_definitions'));
        batch.set(newDocRef, fieldDefinition);
        
        await batch.commit();
        
        // 清除快取
        clearFieldDefinitionCache();
        console.log(`✅ 成功更新 ${collectionName} 欄位定義，新增 ${newFields.length} 個欄位`);
      } else {
        console.log(`ℹ️ 沒有發現新欄位，欄位定義無需更新`);
      }
    } catch (error) {
      console.error('更新欄位定義時發生錯誤:', error);
    }
  }

  /**
   * 透過關聯找出對應的 ID
   */
  private resolveRelation(
    sourceFileIndex: number,
    sourceValue: string,
    sourceField: string
  ): string | undefined {
    // 找出相關的關聯定義
    const relation = this.relationMappings.find(r => 
      r.sourceFile === sourceFileIndex && r.sourceField === sourceField
    );
    
    if (!relation) return undefined;
    
    // 從目標檔案的映射中找出對應值
    const targetMapping = this.fieldMappingsConfig[relation.targetFile];
    if (!targetMapping || !targetMapping.keyField) return undefined;
    
    // 根據目標檔案類型查找
    if (targetMapping.fileType === 'users') {
      return this.userIdMap.get(sourceValue);
    } else if (targetMapping.fileType === 'customers') {
      return this.customerIdMap.get(sourceValue);
    } else if (targetMapping.fileType === 'hierarchy') {
      return this.teamIdMap.get(sourceValue);
    }
    
    return undefined;
  }

  /**
   * 智慧型匯入多個檔案（自動映射）
   */
  async importMultipleFiles(
    files: Array<{ uri: string; name: string; type?: string }>,
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
      imported: { users: 0, teams: 0, customers: 0, records: 0 },
      warnings: []
    };

    // 排序檔案（業務員 -> 層級 -> 客戶 -> 紀錄）
    const sortedFiles = files.sort((a, b) => {
      const getPriority = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('業務') || lower.includes('員工')) return 1;
        if (lower.includes('層級') || lower.includes('hierarchy')) return 2;
        if (lower.includes('客戶') || lower.includes('customer')) return 3;
        if (lower.includes('訪談') || lower.includes('紀錄')) return 4;
        return 5;
      };
      return getPriority(a.name) - getPriority(b.name);
    });

    // 載入現有資料以建立映射
    await this.loadExistingMappings();

    // 逐個處理檔案
    for (const file of sortedFiles) {
      try {
        result.warnings?.push(`處理檔案: ${file.name}`);
        
        // 解析檔案
        const data = await parseImportFile(file.uri, file.type || 'text/csv');
        
        if (data.length === 0) {
          result.warnings?.push(`${file.name}: 檔案是空的`);
          continue;
        }

        // 自動識別檔案類型
        const headers = Object.keys(data[0]);
        const fileType = this.analyzeFileType(headers, data);
        
        result.warnings?.push(`${file.name} 識別為: ${fileType}`);
        
        // 根據類型處理
        const fileResult = await this.processFileByType(fileType, data, onProgress);
        
        // 合併結果
        result.total += fileResult.total;
        result.success += fileResult.success;
        result.failed += fileResult.failed;
        result.errors.push(...fileResult.errors);
        
        if (result.imported && fileResult.imported) {
          result.imported.users += fileResult.imported.users;
          result.imported.teams += fileResult.imported.teams;
          result.imported.customers += fileResult.imported.customers;
          result.imported.records += fileResult.imported.records;
        }
      } catch (error) {
        result.warnings?.push(`${file.name}: 處理失敗 - ${error}`);
      }
    }

    return result;
  }

  /**
   * 根據檔案類型處理資料
   */
  private async processFileByType(
    type: ImportType,
    data: any[],
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    const headers = Object.keys(data[0]);
    
    switch (type) {
      case 'users':
        return this.importUsers(data, headers, onProgress);
      case 'customers':
        return this.importCustomers(data, headers, onProgress);
      case 'records':
        return this.importRecords(data, headers, onProgress);
      case 'hierarchy':
        return this.importHierarchy(data, headers, onProgress);
      default:
        return this.importCustomers(data, headers, onProgress);
    }
  }

  /**
   * 匯入業務員資料（使用自訂映射）
   */
  private async importUsersWithMapping(
    rows: any[],
    mappings: { [systemField: string]: string },
    keyField: string | undefined,
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
      imported: { users: 0, teams: 0, customers: 0, records: 0 }
    };

    const batch = writeBatch(this.db);
    let count = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: rows.length,
          status: 'importing',
          message: `匯入用戶 ${i + 1}/${rows.length}`
        });
      }

      try {
        const name = row[mappings.name];
        if (!name) {
          result.errors.push({ row: i + 2, message: '缺少姓名' });
          result.failed++;
          continue;
        }

        // 產生或取得 email
        let email = row[mappings.email];
        if (!email) {
          const pinyin = name.toLowerCase().replace(/[^a-z0-9]/g, '');
          email = `${pinyin}@${this.organizationId}.com`;
        }

        // 判斷角色
        const jobTitle = row[mappings.jobTitle] || '';
        let role: 'admin' | 'manager' | 'salesperson' = 'salesperson';
        if (jobTitle.includes('總監') || jobTitle.includes('處長')) {
          role = 'admin';
        } else if (jobTitle.includes('經理') || jobTitle.includes('主管')) {
          role = 'manager';
        }

        // 建立用戶資料
        const userId = doc(collection(this.db, 'users')).id;
        const userData = {
          id: userId,
          name,
          email,
          role,
          organizationId: this.organizationId,
          phone: row[mappings.phone] || '',
          department: row[mappings.department] || '',
          jobTitle,
          createdAt: Timestamp.now(),
          isActive: true
        };

        batch.set(doc(this.db, 'users', userId), userData);
        
        // 儲存映射 - 使用關鍵欄位
        if (keyField && row[keyField]) {
          this.userIdMap.set(row[keyField], userId);
        }
        this.userIdMap.set(name, userId);
        this.userIdMap.set(email, userId);
        
        count++;
        result.success++;
      } catch (error) {
        result.errors.push({
          row: i + 2,
          message: `匯入失敗: ${error}`
        });
        result.failed++;
      }
    }

    if (count > 0) {
      await batch.commit();
      result.imported!.users = count;
    }

    return result;
  }

  /**
   * 匯入客戶資料（使用自訂映射）
   */
  private async importCustomersWithMapping(
    rows: any[],
    mappings: { [systemField: string]: string },
    keyField: string | undefined,
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
      imported: { users: 0, teams: 0, customers: 0, records: 0 }
    };

    const BATCH_SIZE = 10; // 每批最多處理 10 筆，避免 Firebase 寫入佇列耗盡
    const BATCH_DELAY = 2000; // 批次間延遲 2 秒，確保 Firebase 有時間處理
    const currentFileIndex = this.fieldMappingsConfig.findIndex(m => m.mappings === mappings);
    let totalCount = 0;

    // 預先載入現有客戶資料以提高效能
    console.log('📥 預載入現有客戶資料...');
    const existingCustomersQuery = query(
      collection(this.db, 'customers'),
      where('organizationId', '==', this.organizationId)
    );
    const existingSnapshot = await getDocs(existingCustomersQuery);
    const existingCustomers = new Map<string, any>();
    
    existingSnapshot.forEach(doc => {
      const data = doc.data();
      const key = `${data.name || ''}_${data.company || ''}`;
      existingCustomers.set(key, { id: doc.id, ...data });
    });
    
    console.log(`📋 載入了 ${existingCustomers.size} 筆現有客戶資料`);

    // 分批處理
    for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
      const batch = writeBatch(this.db);
      const batchEnd = Math.min(batchStart + BATCH_SIZE, rows.length);
      let batchCount = 0;

      for (let i = batchStart; i < batchEnd; i++) {
        const row = rows[i];
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: rows.length,
            status: 'importing',
            message: `匯入客戶 ${i + 1}/${rows.length}`
          });
        }

        try {
          const name = row[mappings.name];
          if (!name) {
            result.errors.push({ row: i + 2, message: '缺少客戶姓名' });
            result.failed++;
            continue;
          }

          // 透過關聯找出負責業務員
          let createdBy: string | undefined;
          if (mappings.salesperson) {
            const salespersonValue = row[mappings.salesperson];
            createdBy = this.resolveRelation(currentFileIndex, salespersonValue, mappings.salesperson);
          }
          
          if (!createdBy) {
            const auth = getAuth();
            createdBy = auth.currentUser?.uid || '';
            if (!createdBy) {
              result.errors.push({ row: i + 2, message: '找不到負責業務員' });
              result.failed++;
              continue;
            }
          }

          // 處理標籤
          const tagsStr = row[mappings.tags] || '';
          const tags = tagsStr.split(/[;,；，]/).map((t: string) => t.trim()).filter(Boolean);

          // 檢查是否已存在相同客戶（用於更新而非跳過）
          const customerKey = keyField && row[keyField] 
            ? row[keyField] 
            : `${name}_${row[mappings.company] || ''}`;
          
          let customerId: string;
          let isUpdate = false;
          let existingData: any = null;
          
          // 使用預載入的資料檢查是否已存在
          const existingCustomer = existingCustomers.get(customerKey);
          
          if (existingCustomer) {
            // 找到現有客戶，準備更新
            customerId = existingCustomer.id;
            existingData = existingCustomer;
            isUpdate = true;
            console.log(`客戶 "${name}" 已存在，準備更新欄位`);
          } else if (this.customerIdMap.has(customerKey)) {
            // 本次匯入中已處理過，使用現有 ID
            customerId = this.customerIdMap.get(customerKey)!;
            isUpdate = true;
            console.log(`客戶 "${name}" 在本次匯入中重複，合併資料`);
          } else {
            // 新客戶
            customerId = doc(collection(this.db, 'customers')).id;
            console.log(`新增客戶 "${name}"`);
          }

          // 準備客戶資料（新增或更新）
          let rawCustomerData: any = {
            id: customerId,
            name,
            company: row[mappings.company] || '',
            phone: row[mappings.phone] || '',
            email: row[mappings.email] || '',
            jobTitle: row[mappings.jobTitle] || '',
            createdBy,
            organizationId: this.organizationId,
            tags,
            notes: row[mappings.notes] || '',
            teamMembers: [createdBy],
            assignedTo: createdBy,
            userId: createdBy,
            // 加入所有原始資料
            ...row
          };

          if (isUpdate) {
            // 更新模式：只更新 updatedAt，保留原 createdAt
            rawCustomerData.updatedAt = Timestamp.now();
            // 如果是資料庫中的現有記錄，合併現有資料
            if (existingData) {
              rawCustomerData = {
                ...existingData, // 保留現有資料
                ...rawCustomerData, // 覆蓋新資料
                createdAt: existingData.createdAt || Timestamp.now(), // 保留原創建時間
                updatedAt: Timestamp.now(), // 更新時間戳
              };
            }
          } else {
            // 新增模式：設定 createdAt
            rawCustomerData.createdAt = Timestamp.now();
            rawCustomerData.updatedAt = Timestamp.now();
          }

          // 使用清理工具處理資料
          const cleanedCustomerData = cleanCustomerData(rawCustomerData);
          
          batch.set(doc(this.db, 'customers', customerId), cleanedCustomerData);
          
          // 儲存映射 - 使用關鍵欄位
          if (keyField && row[keyField]) {
            this.customerIdMap.set(row[keyField], customerId);
          }
          this.customerIdMap.set(customerKey, customerId);
          
          batchCount++;
          result.success++;
        } catch (error) {
          result.errors.push({
            row: i + 2,
            message: `匯入失敗: ${error}`
          });
          result.failed++;
        }
      }

      // 提交這一批次
      if (batchCount > 0) {
        try {
          await batch.commit();
          totalCount += batchCount;
          
          // 批次間延遲，避免 Firebase Write stream exhausted
          if (batchStart + BATCH_SIZE < rows.length) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
          }
        } catch (error) {
          console.error(`批次提交失敗: ${error}`);
          
          // 如果是 resource-exhausted 錯誤，增加延遲後重試
          if (error instanceof Error && error.message.includes('resource-exhausted')) {
            console.log('偵測到資源耗盡錯誤，等待 10 秒後重試...');
            
            // 通知用戶正在處理資源限制問題
            if (onProgress) {
              onProgress({
                current: batchStart,
                total: rows.length,
                status: 'retrying',
                message: `Firebase 資源限制，正在等待重試... (${Math.floor(batchStart * 100 / rows.length)}%)`
              });
            }
            
            await new Promise(resolve => setTimeout(resolve, 10000)); // 增加等待時間到 10 秒
            
            try {
              await batch.commit();
              totalCount += batchCount;
              console.log('重試成功');
            } catch (retryError) {
              console.error(`重試失敗: ${retryError}`);
              // 記錄重試失敗的錯誤
              for (let i = batchStart; i < batchEnd; i++) {
                result.errors.push({
                  row: i + 2,
                  message: `批次提交失敗 (重試後): ${retryError}`
                });
                result.failed++;
              }
              result.success -= batchCount;
            }
          } else {
            // 非資源耗盡錯誤，記錄錯誤
            for (let i = batchStart; i < batchEnd; i++) {
              result.errors.push({
                row: i + 2,
                message: `批次提交失敗: ${error}`
              });
              result.failed++;
            }
            result.success -= batchCount;
          }
        }
      }
    }

    result.imported!.customers = totalCount;

    // 匯入完成後，動態檢測並更新欄位定義
    if (totalCount > 0) {
      try {
        await this.updateFieldDefinitionsFromData('customers', mappings);
      } catch (error) {
        console.warn('更新欄位定義失敗:', error);
      }
    }

    return result;
  }

  /**
   * 匯入訪談紀錄（使用自訂映射）
   */
  private async importRecordsWithMapping(
    rows: any[],
    mappings: { [systemField: string]: string },
    keyField: string | undefined,
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
      imported: { users: 0, teams: 0, customers: 0, records: 0 }
    };

    const batch = writeBatch(this.db);
    let count = 0;
    const currentFileIndex = this.fieldMappingsConfig.findIndex(m => m.mappings === mappings);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: rows.length,
          status: 'importing',
          message: `匯入紀錄 ${i + 1}/${rows.length}`
        });
      }

      try {
        // 透過關聯找出客戶
        let customerId: string | undefined;
        if (mappings.customer) {
          const customerValue = row[mappings.customer];
          customerId = this.resolveRelation(currentFileIndex, customerValue, mappings.customer);
        }

        if (!customerId) {
          result.errors.push({ row: i + 2, message: `找不到客戶` });
          result.failed++;
          continue;
        }

        // 透過關聯找出業務員
        let createdBy: string | undefined;
        if (mappings.salesperson) {
          const salespersonValue = row[mappings.salesperson];
          createdBy = this.resolveRelation(currentFileIndex, salespersonValue, mappings.salesperson);
        }
        
        if (!createdBy) {
          createdBy = getAuth().currentUser?.uid;
          if (!createdBy) {
            result.errors.push({ row: i + 2, message: '找不到業務員' });
            result.failed++;
            continue;
          }
        }

        // 處理日期
        const dateStr = row[mappings.date];
        const date = parseFlexibleDate(dateStr) || new Date();

        // 建立紀錄資料
        const recordId = doc(collection(this.db, 'records')).id;
        const rawRecordData = {
          id: recordId,
          customerId,
          createdBy,
          userId: createdBy,
          date: date,
          type: row[mappings.type] || '訪談',
          title: row[mappings.title] || row[mappings.content]?.substring(0, 50) || '訪談紀錄',
          content: row[mappings.content] || '',
          organizationId: this.organizationId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          teamMembers: [createdBy],
          // 加入所有原始資料
          ...row
        };

        // 處理下次跟進日期
        if (mappings.followUp && row[mappings.followUp]) {
          rawRecordData.nextFollowUpDate = parseFlexibleDate(row[mappings.followUp]);
        }

        // 使用清理工具處理資料
        const cleanedRecordData = cleanRecordData(rawRecordData);
        
        batch.set(doc(this.db, 'records', recordId), cleanedRecordData);
        count++;
        result.success++;
      } catch (error) {
        result.errors.push({
          row: i + 2,
          message: `匯入失敗: ${error}`
        });
        result.failed++;
      }
    }

    if (count > 0) {
      await batch.commit();
      result.imported!.records = count;
    }

    return result;
  }

  /**
   * 匯入層級結構（使用自訂映射）
   */
  private async importHierarchyWithMapping(
    rows: any[],
    mappings: { [systemField: string]: string },
    keyField: string | undefined,
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
      imported: { users: 0, teams: 0, customers: 0, records: 0 }
    };

    // 建立團隊
    const teams = new Map<string, string>();
    const batch = writeBatch(this.db);
    
    // 收集唯一團隊
    const teamNames = new Set<string>();
    rows.forEach(row => {
      const teamName = row[mappings.team];
      if (teamName) teamNames.add(teamName);
    });

    // 建立團隊文檔
    for (const teamName of teamNames) {
      const teamId = doc(collection(this.db, 'teams')).id;
      const teamData = {
        id: teamId,
        name: teamName,
        organizationId: this.organizationId,
        memberIds: [],
        createdAt: Timestamp.now()
      };
      
      batch.set(doc(this.db, 'teams', teamId), teamData);
      teams.set(teamName, teamId);
      this.teamIdMap.set(teamName, teamId);
    }

    // 更新用戶的團隊和主管關係
    for (const row of rows) {
      const name = row[mappings.name];
      const parentName = row[mappings.parentCode];
      const teamName = row[mappings.team];
      
      if (!name) continue;
      
      // 使用關鍵欄位找用戶
      let userId: string | undefined;
      if (keyField && row[keyField]) {
        userId = this.userIdMap.get(row[keyField]);
      }
      if (!userId) {
        userId = this.userIdMap.get(name);
      }
      if (!userId) continue;

      const updates: any = {};
      
      if (teamName && teams.has(teamName)) {
        updates.teamIds = [teams.get(teamName)];
      }
      
      if (parentName) {
        const supervisorId = this.userIdMap.get(parentName);
        if (supervisorId) {
          updates.supervisorId = supervisorId;
        }
      }
      
      if (Object.keys(updates).length > 0) {
        batch.update(doc(this.db, 'users', userId), updates);
        result.success++;
      }
    }

    await batch.commit();
    result.imported!.teams = teams.size;

    return result;
  }

  /**
   * 匯入業務員資料
   */
  private async importUsers(
    rows: any[],
    headers: string[],
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
      imported: { users: 0, teams: 0, customers: 0, records: 0 }
    };

    // 欄位映射
    const nameCol = this.findColumn(headers, ['姓名', '業務員', '員工', 'name']);
    const emailCol = this.findColumn(headers, ['email', '電子郵件', '信箱']);
    const phoneCol = this.findColumn(headers, ['電話', '手機', 'phone']);
    const titleCol = this.findColumn(headers, ['職稱', '職位', 'title']);
    const deptCol = this.findColumn(headers, ['部門', 'department']);

    const batch = writeBatch(this.db);
    let count = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: rows.length,
          status: 'importing',
          message: `匯入用戶 ${i + 1}/${rows.length}`
        });
      }

      try {
        const name = row[nameCol];
        if (!name) {
          result.errors.push({ row: i + 2, message: '缺少姓名' });
          result.failed++;
          continue;
        }

        // 產生或取得 email
        let email = row[emailCol];
        if (!email) {
          // 自動產生 email
          const pinyin = name.toLowerCase().replace(/[^a-z0-9]/g, '');
          email = `${pinyin}@${this.organizationId}.com`;
        }

        // 判斷角色
        const jobTitle = row[titleCol] || '';
        let role: 'admin' | 'manager' | 'salesperson' = 'salesperson';
        if (jobTitle.includes('總監') || jobTitle.includes('處長')) {
          role = 'admin';
        } else if (jobTitle.includes('經理') || jobTitle.includes('主管')) {
          role = 'manager';
        }

        // 建立用戶資料
        const userId = doc(collection(this.db, 'users')).id;
        const userData = {
          id: userId,
          name,
          email,
          role,
          organizationId: this.organizationId,
          phone: row[phoneCol] || '',
          department: row[deptCol] || '',
          jobTitle,
          createdAt: Timestamp.now(),
          isActive: true
        };

        batch.set(doc(this.db, 'users', userId), userData);
        
        // 儲存映射
        this.userIdMap.set(name, userId);
        this.userIdMap.set(email, userId);
        
        count++;
        result.success++;
      } catch (error) {
        result.errors.push({
          row: i + 2,
          message: `匯入失敗: ${error}`
        });
        result.failed++;
      }
    }

    if (count > 0) {
      await batch.commit();
      result.imported!.users = count;
    }

    return result;
  }

  /**
   * 匯入客戶資料
   */
  private async importCustomers(
    rows: any[],
    headers: string[],
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
      imported: { users: 0, teams: 0, customers: 0, records: 0 }
    };

    // 欄位映射
    const nameCol = this.findColumn(headers, ['客戶姓名', '姓名', '客戶', 'name']);
    const companyCol = this.findColumn(headers, ['公司', '客戶公司', 'company']);
    const phoneCol = this.findColumn(headers, ['電話', '手機', 'phone']);
    const emailCol = this.findColumn(headers, ['email', '電子郵件']);
    const salesCol = this.findColumn(headers, ['業務員', '負責人', '業務']);
    const tagsCol = this.findColumn(headers, ['標籤', '分類', 'tags']);
    const notesCol = this.findColumn(headers, ['備註', '說明', 'notes']);

    const batch = writeBatch(this.db);
    let count = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: rows.length,
          status: 'importing',
          message: `匯入客戶 ${i + 1}/${rows.length}`
        });
      }

      try {
        const name = row[nameCol];
        if (!name) {
          result.errors.push({ row: i + 2, message: '缺少客戶姓名' });
          result.failed++;
          continue;
        }

        // 找出負責業務員
        const salespersonName = row[salesCol];
        let createdBy = this.userIdMap.get(salespersonName);
        
        if (!createdBy) {
          // 使用目前用戶或預設值
          const auth = getAuth();
          createdBy = auth.currentUser?.uid || '';
          if (!createdBy) {
            result.errors.push({ row: i + 2, message: '找不到負責業務員' });
            result.failed++;
            continue;
          }
        }

        // 處理標籤
        const tagsStr = row[tagsCol] || '';
        const tags = tagsStr.split(/[;,；，]/).map((t: string) => t.trim()).filter(Boolean);

        // 建立客戶資料
        const customerId = doc(collection(this.db, 'customers')).id;
        const customerData = {
          id: customerId,
          name,
          company: row[companyCol] || '',
          phone: row[phoneCol] || '',
          email: row[emailCol] || '',
          createdBy,
          organizationId: this.organizationId,
          tags,
          notes: row[notesCol] || '',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          teamMembers: [createdBy]
        };

        batch.set(doc(this.db, 'customers', customerId), customerData);
        
        // 儲存映射
        const customerKey = `${name}_${row[companyCol] || ''}`;
        this.customerIdMap.set(customerKey, customerId);
        
        count++;
        result.success++;
      } catch (error) {
        result.errors.push({
          row: i + 2,
          message: `匯入失敗: ${error}`
        });
        result.failed++;
      }
    }

    if (count > 0) {
      await batch.commit();
      result.imported!.customers = count;
    }

    return result;
  }

  /**
   * 匯入訪談紀錄
   */
  private async importRecords(
    rows: any[],
    headers: string[],
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
      imported: { users: 0, teams: 0, customers: 0, records: 0 }
    };

    // 欄位映射
    const dateCol = this.findColumn(headers, ['日期', '訪談日期', 'date']);
    const customerCol = this.findColumn(headers, ['客戶', '客戶姓名', 'customer']);
    const salesCol = this.findColumn(headers, ['業務員', '業務', 'sales']);
    const typeCol = this.findColumn(headers, ['類型', '訪談類型', 'type']);
    const contentCol = this.findColumn(headers, ['內容', '紀錄', 'content']);

    const batch = writeBatch(this.db);
    let count = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: rows.length,
          status: 'importing',
          message: `匯入紀錄 ${i + 1}/${rows.length}`
        });
      }

      try {
        // 找出客戶
        const customerName = row[customerCol];
        let customerId: string | undefined;
        
        for (const [key, id] of this.customerIdMap.entries()) {
          if (key.includes(customerName)) {
            customerId = id;
            break;
          }
        }

        if (!customerId) {
          result.errors.push({ row: i + 2, message: `找不到客戶: ${customerName}` });
          result.failed++;
          continue;
        }

        // 找出業務員
        const salespersonName = row[salesCol];
        const createdBy = this.userIdMap.get(salespersonName) || getAuth().currentUser?.uid;
        
        if (!createdBy) {
          result.errors.push({ row: i + 2, message: '找不到業務員' });
          result.failed++;
          continue;
        }

        // 處理日期
        const dateStr = row[dateCol];
        const date = dateStr ? new Date(dateStr) : new Date();

        // 建立紀錄資料
        const recordId = doc(collection(this.db, 'records')).id;
        const recordData = {
          id: recordId,
          customerId,
          createdBy,
          date: Timestamp.fromDate(date),
          type: row[typeCol] || '訪談',
          content: row[contentCol] || '',
          organizationId: this.organizationId,
          createdAt: Timestamp.now(),
          teamMembers: [createdBy]
        };

        batch.set(doc(this.db, 'records', recordId), recordData);
        count++;
        result.success++;
      } catch (error) {
        result.errors.push({
          row: i + 2,
          message: `匯入失敗: ${error}`
        });
        result.failed++;
      }
    }

    if (count > 0) {
      await batch.commit();
      result.imported!.records = count;
    }

    return result;
  }

  /**
   * 匯入層級結構
   */
  private async importHierarchy(
    rows: any[],
    headers: string[],
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
      imported: { users: 0, teams: 0, customers: 0, records: 0 }
    };

    // 欄位映射
    const nameCol = this.findColumn(headers, ['姓名', '名稱', 'name']);
    const teamCol = this.findColumn(headers, ['團隊', '部門', 'team']);
    const parentCol = this.findColumn(headers, ['上級', '主管', 'parent']);

    // 建立團隊
    const teams = new Map<string, string>();
    const batch = writeBatch(this.db);
    
    // 收集唯一團隊
    const teamNames = new Set<string>();
    rows.forEach(row => {
      const teamName = row[teamCol];
      if (teamName) teamNames.add(teamName);
    });

    // 建立團隊文檔
    for (const teamName of teamNames) {
      const teamId = doc(collection(this.db, 'teams')).id;
      const teamData = {
        id: teamId,
        name: teamName,
        organizationId: this.organizationId,
        memberIds: [],
        createdAt: Timestamp.now()
      };
      
      batch.set(doc(this.db, 'teams', teamId), teamData);
      teams.set(teamName, teamId);
      this.teamIdMap.set(teamName, teamId);
    }

    // 更新用戶的團隊和主管關係
    for (const row of rows) {
      const name = row[nameCol];
      const parentName = row[parentCol];
      const teamName = row[teamCol];
      
      if (!name) continue;
      
      const userId = this.userIdMap.get(name);
      if (!userId) continue;

      const updates: any = {};
      
      if (teamName && teams.has(teamName)) {
        updates.teamIds = [teams.get(teamName)];
      }
      
      if (parentName) {
        const supervisorId = this.userIdMap.get(parentName);
        if (supervisorId) {
          updates.supervisorId = supervisorId;
        }
      }
      
      if (Object.keys(updates).length > 0) {
        batch.update(doc(this.db, 'users', userId), updates);
        result.success++;
      }
    }

    await batch.commit();
    result.imported!.teams = teams.size;

    return result;
  }

  /**
   * 載入現有資料映射
   */
  private async loadExistingMappings(): Promise<void> {
    // 載入用戶
    const usersQuery = query(
      collection(this.db, 'users'),
      where('organizationId', '==', this.organizationId)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      this.userIdMap.set(user.name, user.id);
      this.userIdMap.set(user.email, user.id);
    });

    // 載入客戶
    const customersQuery = query(
      collection(this.db, 'customers'),
      where('organizationId', '==', this.organizationId)
    );
    
    const customersSnapshot = await getDocs(customersQuery);
    customersSnapshot.forEach(doc => {
      const customer = doc.data();
      const key = `${customer.name}_${customer.company}`;
      this.customerIdMap.set(key, customer.id);
    });
  }
}