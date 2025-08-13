/**
 * 客戶資料導入器
 * 處理舊系統客戶資料的批量導入
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { LegacyCustomer, ImportError, ImportWarning } from '@/types/legacy-import';
import { CustomerDoc } from '@/types/firebase';
import { CustomerFormData } from '@/services/validation/form-schemas';
import { mapLegacyCustomer } from './mapper';
import { resolveBusinessIdentifier } from './codeMapper';

export interface CustomerImportOptions {
  organizationId: string;
  teamId: string;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  onProgress?: (progress: CustomerImportProgress) => void;
  userMappings: Map<string, string>; // 業務帳號 -> userId 映射
  codeToName?: Map<string, string>;
  nameToCode?: Map<string, string>;
  codeToLevel?: Map<string, string>;
  batchSize?: number;
}

export interface CustomerImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  currentCustomer?: string;
  currentBatch: number;
  totalBatches: number;
  phase: 'preparing' | 'importing' | 'completed';
}

export interface CustomerImportResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  customerMappings: Map<string, string>; // 客戶名稱 -> customerId 映射
  duplicates: Array<{
    row: number;
    customerName: string;
    existingId: string;
    action: 'skipped' | 'updated';
  }>;
  duration: number;
}

const BATCH_SIZE = 500; // Firestore 批次限制

/**
 * 批量導入客戶資料
 */
export async function importLegacyCustomers(
  customers: LegacyCustomer[],
  options: CustomerImportOptions
): Promise<CustomerImportResult> {
  const startTime = Date.now();
  const {
    organizationId,
    teamId,
    skipDuplicates = true,
    updateExisting = false,
    onProgress,
    userMappings,
    codeToName,
    nameToCode,
    codeToLevel,
    batchSize = BATCH_SIZE } = options;

  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const customerMappings = new Map<string, string>();
  const duplicates: CustomerImportResult['duplicates'] = [];
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  // 計算批次數
  const totalBatches = Math.ceil(customers.length / batchSize);

  // 初始化進度
  const progress: CustomerImportProgress = {
    total: customers.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    currentBatch: 0,
    totalBatches,
    phase: 'preparing' };
  onProgress?.(progress);

  try {
    // 第一階段：準備和驗證
    progress.phase = 'preparing';
    onProgress?.(progress);

    // 檢查現有客戶
    const existingCustomers = await getExistingCustomers(organizationId, teamId);

    // 第二階段：批次導入
    progress.phase = 'importing';
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, customers.length);
      const batchCustomers = customers.slice(batchStart, batchEnd);
      
      progress.currentBatch = batchIndex + 1;
      onProgress?.(progress);

      const batchResult = await processBatch(
        batchCustomers,
        batchStart,
        {
          organizationId,
          teamId,
          skipDuplicates,
          updateExisting,
          userMappings,
          codeToName,
          nameToCode,
          codeToLevel,
          existingCustomers }
      );

      // 更新統計
      successCount += batchResult.successCount;
      failureCount += batchResult.failureCount;
      skippedCount += batchResult.skippedCount;
      errors.push(...batchResult.errors);
      warnings.push(...batchResult.warnings);
      duplicates.push(...batchResult.duplicates);
      
      // 更新映射
      batchResult.mappings.forEach((id, name) => {
        customerMappings.set(name, id);
      });

      // 更新進度
      progress.processed = batchEnd;
      progress.succeeded = successCount;
      progress.failed = failureCount;
      progress.skipped = skippedCount;
      progress.currentCustomer = batchCustomers[batchCustomers.length - 1]?.客戶名稱;
      onProgress?.(progress);
    }

    // 完成
    progress.phase = 'completed';
    progress.currentCustomer = undefined;
    onProgress?.(progress);

    return {
      totalProcessed: customers.length,
      successCount,
      failureCount,
      skippedCount,
      errors,
      warnings,
      customerMappings,
      duplicates,
      duration: Date.now() - startTime };

  } catch (error) {
    console.error('批量導入客戶失敗:', error);
    throw new Error(`批量導入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 處理單個批次
 */
async function processBatch(
  customers: LegacyCustomer[],
  startIndex: number,
  options: {
    organizationId: string;
    teamId: string;
    skipDuplicates: boolean;
    updateExisting: boolean;
    userMappings: Map<string, string>;
    codeToName?: Map<string, string>;
    nameToCode?: Map<string, string>;
    codeToLevel?: Map<string, string>;
    existingCustomers: Map<string, string>;
  }
): Promise<{
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  duplicates: CustomerImportResult['duplicates'];
  mappings: Map<string, string>;
}> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const duplicates: CustomerImportResult['duplicates'] = [];
  const mappings = new Map<string, string>();
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;
  let operationCount = 0;

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const row = startIndex + i + 1;

    try {
      // 解析負責業務
      let userId: string | undefined;
      let businessName = customer.負責業務;
      let businessCode = '';

      if (options.codeToName && options.nameToCode && options.codeToLevel) {
        const identification = resolveBusinessIdentifier(
          customer.負責業務,
          options.codeToName,
          options.nameToCode,
          options.codeToLevel
        );

        businessName = identification.name || customer.負責業務;
        businessCode = identification.code;

        // 查找對應的 userId
        userId = options.userMappings.get(businessName) || 
                options.userMappings.get(customer.負責業務);

        if (!userId && identification.found) {
          warnings.push({
            type: 'customers',
            row,
            field: '負責業務',
            message: `找到業務對照 ${businessName} 但未找到對應的用戶`,
            suggestion: '請確認該業務人員已被導入' });
        }
      } else {
        // 直接查找 userId
        userId = options.userMappings.get(customer.負責業務);
      }

      if (!userId) {
        errors.push({
          type: 'customers',
          row,
          field: '負責業務',
          message: `找不到負責業務: ${customer.負責業務}`,
          data: customer });
        failureCount++;
        continue;
      }

      // 檢查重複
      const duplicateKey = generateCustomerKey(customer);
      const existingId = options.existingCustomers.get(duplicateKey);

      if (existingId) {
        if (options.skipDuplicates && !options.updateExisting) {
          duplicates.push({
            row,
            customerName: customer.客戶名稱,
            existingId,
            action: 'skipped' });
          mappings.set(customer.客戶名稱, existingId);
          skippedCount++;
          continue;
        } else if (options.updateExisting) {
          // TODO: 實作更新邏輯
          duplicates.push({
            row,
            customerName: customer.客戶名稱,
            existingId,
            action: 'updated' });
          mappings.set(customer.客戶名稱, existingId);
          skippedCount++;
          continue;
        }
      }

      // 映射客戶資料
      const mappedCustomer = mapLegacyCustomer(
        customer,
        userId,
        options.teamId,
        options.organizationId,
        businessName,
        businessCode
      );

      // 創建客戶文檔
      const customerRef = doc(collection(db, 'customers'));
      const customerData: CustomerDoc = {
        id: customerRef.id,
        name: mappedCustomer.name,
        company: mappedCustomer.company,
        email: mappedCustomer.email,
        phone: mappedCustomer.phone,
        assignedTo: userId,
        teamId: options.teamId,
        organizationId: options.organizationId,
        notes: mappedCustomer.notes || '',
        tags: mappedCustomer.tags || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
        teamMembers: [userId], // 添加 teamMembers 欄位以符合 Firestore 規則
        customFields: (mappedCustomer as any).customFields || {} };

      batch.set(customerRef, customerData);
      mappings.set(customer.客戶名稱, customerRef.id);
      successCount++;
      operationCount++;

      // 檢查批次操作數限制
      if (operationCount >= 500) {
        await batch.commit();
        operationCount = 0;
      }

    } catch (error) {
      errors.push({
        type: 'customers',
        row,
        field: 'general',
        message: error instanceof Error ? error.message : '未知錯誤',
        data: customer });
      failureCount++;
    }
  }

  // 提交剩餘的批次操作
  if (operationCount > 0) {
    await batch.commit();
  }

  return {
    successCount,
    failureCount,
    skippedCount,
    errors,
    warnings,
    duplicates,
    mappings };
}

/**
 * 獲取現有客戶映射
 */
async function getExistingCustomers(
  organizationId: string,
  teamId: string
): Promise<Map<string, string>> {
  const db = getFirebaseDb();
  const existingMap = new Map<string, string>();

  try {
    const customersRef = collection(db, 'customers');
    const q = query(
      customersRef,
      where('organizationId', '==', organizationId),
      where('teamId', '==', teamId)
    );
    const snapshot = await getDocs(q);

    snapshot.forEach((doc) => {
      const data = doc.data() as CustomerDoc;
      
      // 使用多種鍵值檢查重複
      if (data.email) {
        existingMap.set(data.email.toLowerCase(), doc.id);
      }
      
      if (data.name && data.company) {
        const key = `${data.name.toLowerCase()}_${data.company.toLowerCase()}`;
        existingMap.set(key, doc.id);
      }
      
      // 僅名稱
      if (data.name) {
        existingMap.set(data.name.toLowerCase(), doc.id);
      }
    });
  } catch (error) {
    console.error('獲取現有客戶失敗:', error);
  }

  return existingMap;
}

/**
 * 生成客戶識別鍵
 */
function generateCustomerKey(customer: LegacyCustomer): string {
  // 優先使用 email
  if (customer.電子郵件地址) {
    return customer.電子郵件地址.toLowerCase();
  }
  
  // 其次使用姓名+公司
  if (customer.客戶名稱 && customer.公司名稱) {
    return `${customer.客戶名稱.toLowerCase()}_${customer.公司名稱.toLowerCase()}`;
  }
  
  // 最後使用姓名
  if (customer.客戶名稱) {
    return customer.客戶名稱.toLowerCase();
  }
  
  return '';
}

/**
 * 生成客戶導入報告
 */
export function generateCustomerImportReport(result: CustomerImportResult): string {
  const report: string[] = [
    '=== 客戶資料導入報告 ===',
    `導入時間: ${new Date().toLocaleString()}`,
    `處理時長: ${(result.duration / 1000).toFixed(2)} 秒`,
    '',
    '統計結果:',
    `- 總處理數: ${result.totalProcessed}`,
    `- 成功導入: ${result.successCount}`,
    `- 導入失敗: ${result.failureCount}`,
    `- 跳過記錄: ${result.skippedCount}`,
    `- 成功率: ${((result.successCount / result.totalProcessed) * 100).toFixed(1)}%`,
    '',
  ];

  if (result.duplicates.length > 0) {
    report.push('重複記錄統計:');
    const duplicateStats = result.duplicates.reduce((acc, dup) => {
      acc[dup.action] = (acc[dup.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(duplicateStats).forEach(([action, count]) => {
      const actionName = action === 'skipped' ? '跳過' : '更新';
      report.push(`- ${actionName}: ${count} 筆`);
    });
    report.push('');
  }

  if (result.warnings.length > 0) {
    report.push('警告訊息:');
    const warningTypes = result.warnings.reduce((acc, warning) => {
      const key = warning.message.split(':')[0];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(warningTypes).forEach(([type, count]) => {
      report.push(`- ${type}: ${count} 筆`);
    });
    report.push('');
  }

  if (result.errors.length > 0) {
    report.push('錯誤統計:');
    const errorTypes = result.errors.reduce((acc, error) => {
      const key = error.message.split(':')[0];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(errorTypes).forEach(([type, count]) => {
      report.push(`- ${type}: ${count} 筆`);
    });

    if (result.errors.length <= 10) {
      report.push('');
      report.push('錯誤詳情（前 10 筆）:');
      result.errors.slice(0, 10).forEach((error, index) => {
        report.push(`${index + 1}. 第 ${error.row} 行: ${error.message}`);
      });
    }
  }

  report.push('');
  report.push('後續建議:');
  report.push('- 檢查失敗記錄的業務人員是否已導入');
  report.push('- 確認客戶資料的必填欄位是否完整');
  if (result.duplicates.length > 0) {
    report.push('- 檢視重複記錄，確認是否需要合併');
  }

  return report.join('\n');
}