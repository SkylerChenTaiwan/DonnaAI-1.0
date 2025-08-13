/**
 * 用戶協助服務
 * 提供資料匯入、自訂欄位設定、舊系統遷移等功能
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { getAuth } from 'firebase/auth';
import { ImportResult, FieldMapping } from '@/types/entities';

// 支援的檔案格式
export const SUPPORTED_FORMATS = ['csv', 'xlsx', 'json'] as const;
export type SupportedFormat = typeof SUPPORTED_FORMATS[number];

// 預設欄位映射
const DEFAULT_FIELD_MAPPINGS: Record<string, FieldMapping[]> = {
  users: [
    { sourceField: '姓名', targetField: 'name', transform: 'none' },
    { sourceField: '電子郵件', targetField: 'email', transform: 'lowercase' },
    { sourceField: '電話', targetField: 'phone', transform: 'phone' },
    { sourceField: '部門', targetField: 'department', transform: 'none' },
    { sourceField: '職位', targetField: 'position', transform: 'none' },
  ],
  customers: [
    { sourceField: '公司名稱', targetField: 'companyName', transform: 'none' },
    { sourceField: '聯絡人', targetField: 'contactName', transform: 'none' },
    { sourceField: '電子郵件', targetField: 'email', transform: 'lowercase' },
    { sourceField: '電話', targetField: 'phone', transform: 'phone' },
    { sourceField: '地址', targetField: 'address', transform: 'none' },
  ],
  tasks: [
    { sourceField: '任務標題', targetField: 'title', transform: 'none' },
    { sourceField: '描述', targetField: 'description', transform: 'none' },
    { sourceField: '負責人', targetField: 'assignee', transform: 'none' },
    { sourceField: '截止日期', targetField: 'dueDate', transform: 'date' },
    { sourceField: '狀態', targetField: 'status', transform: 'lowercase' },
  ] };

// 自訂欄位配置
export interface CustomFieldConfig {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  required: boolean;
  options?: string[]; // for select/multiselect
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// 舊系統配置
export interface LegacyCRMConfig {
  systemType: 'salesforce' | 'hubspot' | 'custom' | 'excel';
  connectionString?: string;
  apiKey?: string;
  mappings: FieldMapping[];
  batchSize: number;
}

/**
 * 匯入用戶資料
 */
export async function importUserData(
  data: any[],
  dataType: 'users' | 'customers' | 'tasks',
  fieldMappings?: FieldMapping[]
): Promise<ImportResult> {
  const db = getFirebaseDb();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('用戶未登入');
  }

  try {
    // 獲取用戶組織資訊
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) {
      throw new Error('找不到用戶資料');
    }

    const userData = userDoc.data();
    const organizationId = userData.organizationId;

    if (!organizationId) {
      throw new Error('用戶未關聯組織');
    }

    // 使用預設或自訂欄位映射
    const mappings = fieldMappings || DEFAULT_FIELD_MAPPINGS[dataType] || [];
    
    // 匯入結果統計
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];
    const details: ImportResult['details'] = [];

    // 批次處理資料（每批 500 筆）
    const batchSize = 500;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchData = data.slice(i, i + batchSize);

      for (let j = 0; j < batchData.length; j++) {
        const rowIndex = i + j;
        const row = batchData[j];

        try {
          // 轉換資料
          const transformedData = transformRowData(row, mappings);
          
          // 驗證必要欄位
          const validationResult = validateData(transformedData, dataType);
          if (!validationResult.isValid) {
            failed++;
            errors.push(`第 ${rowIndex + 1} 行: ${validationResult.errors.join(', ')}`);
            details?.push({
              rowNumber: rowIndex + 1,
              status: 'failed',
              message: validationResult.errors.join(', ') });
            continue;
          }

          // 建立文件
          const docData = {
            ...transformedData,
            organizationId,
            createdBy: currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp() };

          const docRef = doc(collection(db, getCollectionName(dataType)));
          batch.set(docRef, docData);
          
          imported++;
          details?.push({
            rowNumber: rowIndex + 1,
            status: 'success' });
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : '未知錯誤';
          errors.push(`第 ${rowIndex + 1} 行: ${errorMessage}`);
          details?.push({
            rowNumber: rowIndex + 1,
            status: 'failed',
            message: errorMessage });
        }
      }

      // 提交批次
      if (imported > 0) {
        await batch.commit();
      }
    }

    // 記錄匯入活動
    await logImportActivity(organizationId, currentUser.uid, {
      dataType,
      totalRows: data.length,
      imported,
      failed });

    return {
      success: failed === 0,
      imported,
      failed,
      errors,
      details };
  } catch (error) {
    console.error('匯入用戶資料失敗:', error);
    throw error;
  }
}

/**
 * 設定自訂欄位
 */
export async function setupCustomFields(
  entityType: 'users' | 'customers' | 'tasks',
  fields: CustomFieldConfig[]
): Promise<void> {
  const db = getFirebaseDb();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('用戶未登入');
  }

  try {
    // 獲取組織 ID
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) {
      throw new Error('找不到用戶資料');
    }

    const organizationId = userDoc.data().organizationId;
    if (!organizationId) {
      throw new Error('用戶未關聯組織');
    }

    // 驗證欄位配置
    const validationErrors = validateCustomFields(fields);
    if (validationErrors.length > 0) {
      throw new Error(`欄位配置錯誤: ${validationErrors.join(', ')}`);
    }

    // 儲存自訂欄位配置
    const configRef = doc(db, 'custom_field_configs', `${organizationId}_${entityType}`);
    await setDoc(configRef, {
      organizationId,
      entityType,
      fields,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp() });

    // 記錄配置活動
    await logCustomFieldActivity(organizationId, currentUser.uid, {
      entityType,
      fieldsCount: fields.length,
      action: 'setup' });
  } catch (error) {
    console.error('設定自訂欄位失敗:', error);
    throw error;
  }
}

/**
 * 從舊 CRM 系統遷移資料
 */
export async function migrateFromOldCRM(
  config: LegacyCRMConfig,
  dataType: 'users' | 'customers' | 'tasks'
): Promise<ImportResult> {
  try {
    // 根據不同系統類型處理資料
    let data: any[] = [];

    switch (config.systemType) {
      case 'excel':
        data = await extractFromExcel(config);
        break;
      case 'salesforce':
        data = await extractFromSalesforce(config);
        break;
      case 'hubspot':
        data = await extractFromHubspot(config);
        break;
      case 'custom':
        data = await extractFromCustomSystem(config);
        break;
      default:
        throw new Error(`不支援的系統類型: ${config.systemType}`);
    }

    // 使用匯入功能處理資料
    return await importUserData(data, dataType, config.mappings);
  } catch (error) {
    console.error('舊系統資料遷移失敗:', error);
    throw error;
  }
}

/**
 * 獲取自訂欄位配置
 */
export async function getCustomFieldConfig(
  entityType: 'users' | 'customers' | 'tasks'
): Promise<CustomFieldConfig[]> {
  const db = getFirebaseDb();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('用戶未登入');
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) {
      return [];
    }

    const organizationId = userDoc.data().organizationId;
    if (!organizationId) {
      return [];
    }

    const configDoc = await getDoc(
      doc(db, 'custom_field_configs', `${organizationId}_${entityType}`)
    );

    if (!configDoc.exists()) {
      return [];
    }

    return configDoc.data().fields || [];
  } catch (error) {
    console.error('獲取自訂欄位配置失敗:', error);
    return [];
  }
}

// === 輔助函數 ===

/**
 * 轉換行資料
 */
function transformRowData(row: any, mappings: FieldMapping[]): any {
  const transformed: any = {};

  mappings.forEach(mapping => {
    const sourceValue = row[mapping.sourceField];
    let transformedValue = sourceValue;

    // 應用轉換
    switch (mapping.transform) {
      case 'uppercase':
        transformedValue = String(sourceValue).toUpperCase();
        break;
      case 'lowercase':
        transformedValue = String(sourceValue).toLowerCase();
        break;
      case 'date':
        transformedValue = new Date(sourceValue);
        break;
      case 'phone':
        transformedValue = String(sourceValue).replace(/\D/g, '');
        break;
      case 'none':
      default:
        transformedValue = sourceValue;
        break;
    }

    // 使用預設值
    if (!transformedValue && mapping.defaultValue !== undefined) {
      transformedValue = mapping.defaultValue;
    }

    transformed[mapping.targetField] = transformedValue;
  });

  return transformed;
}

/**
 * 驗證資料
 */
function validateData(data: any, dataType: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 基本驗證規則
  const requiredFields: Record<string, string[]> = {
    users: ['name', 'email'],
    customers: ['companyName', 'contactName'],
    tasks: ['title'] };

  const required = requiredFields[dataType] || [];
  required.forEach(field => {
    if (!data[field]) {
      errors.push(`必填欄位 ${field} 不能為空`);
    }
  });

  // 電子郵件驗證
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('電子郵件格式不正確');
  }

  return {
    isValid: errors.length === 0,
    errors };
}

/**
 * 驗證自訂欄位配置
 */
function validateCustomFields(fields: CustomFieldConfig[]): string[] {
  const errors: string[] = [];

  fields.forEach((field, index) => {
    if (!field.name) {
      errors.push(`第 ${index + 1} 個欄位缺少名稱`);
    }

    if (!field.type) {
      errors.push(`第 ${index + 1} 個欄位缺少類型`);
    }

    if (['select', 'multiselect'].includes(field.type) && !field.options?.length) {
      errors.push(`第 ${index + 1} 個欄位為選擇類型但缺少選項`);
    }
  });

  return errors;
}

/**
 * 獲取集合名稱
 */
function getCollectionName(dataType: string): string {
  const collections: Record<string, string> = {
    users: 'users',
    customers: 'customers',
    tasks: 'tasks' };
  return collections[dataType] || dataType;
}

/**
 * 記錄匯入活動
 */
async function logImportActivity(
  organizationId: string,
  userId: string,
  details: any
): Promise<void> {
  const db = getFirebaseDb();
  
  try {
    const logRef = doc(collection(db, 'import_logs'));
    await setDoc(logRef, {
      organizationId,
      userId,
      timestamp: serverTimestamp(),
      type: 'data_import',
      details });
  } catch (error) {
    console.error('記錄匯入活動失敗:', error);
  }
}

/**
 * 記錄自訂欄位活動
 */
async function logCustomFieldActivity(
  organizationId: string,
  userId: string,
  details: any
): Promise<void> {
  const db = getFirebaseDb();
  
  try {
    const logRef = doc(collection(db, 'custom_field_logs'));
    await setDoc(logRef, {
      organizationId,
      userId,
      timestamp: serverTimestamp(),
      type: 'custom_field_config',
      details });
  } catch (error) {
    console.error('記錄自訂欄位活動失敗:', error);
  }
}

// === 資料提取函數（模擬實作）===

/**
 * 從 Excel 檔案提取資料
 */
async function extractFromExcel(config: LegacyCRMConfig): Promise<any[]> {
  // 這裡應該實作 Excel 讀取邏輯
  // 可以使用 SheetJS 或類似函式庫
  console.log('從 Excel 提取資料:', config.connectionString);
  return [];
}

/**
 * 從 Salesforce 提取資料
 */
async function extractFromSalesforce(config: LegacyCRMConfig): Promise<any[]> {
  // 這裡應該實作 Salesforce API 整合
  console.log('從 Salesforce 提取資料');
  return [];
}

/**
 * 從 HubSpot 提取資料
 */
async function extractFromHubspot(config: LegacyCRMConfig): Promise<any[]> {
  // 這裡應該實作 HubSpot API 整合
  console.log('從 HubSpot 提取資料');
  return [];
}

/**
 * 從自訂系統提取資料
 */
async function extractFromCustomSystem(config: LegacyCRMConfig): Promise<any[]> {
  // 這裡應該實作自訂系統資料提取邏輯
  console.log('從自訂系統提取資料');
  return [];
}