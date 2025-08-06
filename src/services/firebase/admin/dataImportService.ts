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
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';
import { getAuth } from 'firebase/auth';
// import { createUserWithEmailAndPassword } from 'firebase/auth'; // 不應該在這裡使用，改用 Cloud Function
import { Customer, Record, Task } from '@/types/firebase';
import { User } from '@/types/entities';
import { isOrgAdmin } from '../permissions';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type ImportType = 'customers' | 'records' | 'tasks' | 'users';

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
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
  
  const customer: Partial<Customer> = {
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
  };
  
  batch.set(customerRef, customer);
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
  
  const record: Partial<Record> = {
    title: data.title || data.標題 || data.記錄標題 || '',
    content: data.content || data.內容 || data.記錄內容 || '',
    type: data.type || data.類型 || 'meeting',
    customerId: data.customerId || data.客戶ID || null,
    date: data.date ? new Date(data.date) : new Date(),
    tags: data.tags ? (typeof data.tags === 'string' ? data.tags.split(',') : data.tags) : [],
    organizationId,
    userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  batch.set(recordRef, record);
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
  
  const email = data.email || data.電子郵件 || data.電郵;
  const name = data.name || data.姓名 || data.用戶名稱;
  const role = data.role || data.角色 || data.權限 || 'salesperson';
  const department = data.department || data.部門 || null;
  const phone = data.phone || data.電話 || null;
  
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
    const userData: User = {
      id: uid,
      uid,
      email,
      name,
      role,
      organizationId,
      department,
      phone,
      isActive: false, // 設為未啟用，因為沒有 Auth 帳號
      createdAt: new Date(),
      lastLoginAt: null,
      supervisorId: null,
      teamIds: [],
      personalGoals: {},
    };
    
    await setDoc(userRef, userData);
    console.warn(`⚠️ 已建立用戶文件但無 Auth 帳號: ${email}`);
  } catch (error) {
    // 如果是已存在的用戶，只更新資料
    if (error instanceof Error && error.message.includes('already-exists')) {
      // 查找現有用戶
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email),
        where('organizationId', '==', organizationId)
      );
      const snapshot = await getDocs(usersQuery);
      
      if (!snapshot.empty) {
        const existingUser = snapshot.docs[0];
        await existingUser.ref.update({
          name,
          role,
          department,
          phone,
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