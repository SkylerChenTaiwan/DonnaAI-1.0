/**
 * 訪談記錄導入器
 * 處理舊系統訪談記錄的批量導入
 */

import { 
  collection, 
  doc, 
  writeBatch,
  Timestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { LegacyRecord, ImportError, ImportWarning } from '@/types/legacy-import';
import { Record } from '@/types/firebase';
import { mapLegacyRecord } from './mapper';
import { resolveBusinessIdentifier } from './codeMapper';

export interface RecordImportOptions {
  organizationId: string;
  teamId: string;
  onProgress?: (progress: RecordImportProgress) => void;
  userMappings: Map<string, string>; // 業務帳號 -> userId 映射
  customerMappings: Map<string, string>; // 客戶名稱 -> customerId 映射
  codeToName?: Map<string, string>;
  nameToCode?: Map<string, string>;
  codeToLevel?: Map<string, string>;
  batchSize?: number;
  updateCustomerLastContact?: boolean; // 是否更新客戶最後聯絡日期
}

export interface RecordImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  currentRecord?: string;
  currentBatch: number;
  totalBatches: number;
  phase: 'preparing' | 'importing' | 'updating' | 'completed';
}

export interface RecordImportResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  recordMappings: Map<string, string>; // 記錄標題+日期 -> recordId 映射
  unmatchedCustomers: Set<string>; // 找不到對應客戶的記錄
  unmatchedUsers: Set<string>; // 找不到對應業務的記錄
  duration: number;
}

const BATCH_SIZE = 500; // Firestore 批次限制

/**
 * 批量導入訪談記錄
 */
export async function importLegacyRecords(
  records: LegacyRecord[],
  options: RecordImportOptions
): Promise<RecordImportResult> {
  const startTime = Date.now();
  const {
    organizationId,
    teamId,
    onProgress,
    userMappings,
    customerMappings,
    codeToName,
    nameToCode,
    codeToLevel,
    batchSize = BATCH_SIZE,
    updateCustomerLastContact = true,
  } = options;

  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const recordMappings = new Map<string, string>();
  const unmatchedCustomers = new Set<string>();
  const unmatchedUsers = new Set<string>();
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  // 計算批次數
  const totalBatches = Math.ceil(records.length / batchSize);

  // 初始化進度
  const progress: RecordImportProgress = {
    total: records.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    currentBatch: 0,
    totalBatches,
    phase: 'preparing',
  };
  onProgress?.(progress);

  try {
    // 第一階段：準備
    progress.phase = 'preparing';
    onProgress?.(progress);

    // 收集需要更新的客戶最後聯絡日期
    const customerLastContactDates = new Map<string, Date>();

    // 第二階段：批次導入
    progress.phase = 'importing';
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, records.length);
      const batchRecords = records.slice(batchStart, batchEnd);
      
      progress.currentBatch = batchIndex + 1;
      onProgress?.(progress);

      const batchResult = await processBatch(
        batchRecords,
        batchStart,
        {
          organizationId,
          teamId,
          userMappings,
          customerMappings,
          codeToName,
          nameToCode,
          codeToLevel,
          customerLastContactDates,
        }
      );

      // 更新統計
      successCount += batchResult.successCount;
      failureCount += batchResult.failureCount;
      skippedCount += batchResult.skippedCount;
      errors.push(...batchResult.errors);
      warnings.push(...batchResult.warnings);
      
      // 更新映射和未匹配集合
      batchResult.mappings.forEach((id, key) => {
        recordMappings.set(key, id);
      });
      batchResult.unmatchedCustomers.forEach(name => {
        unmatchedCustomers.add(name);
      });
      batchResult.unmatchedUsers.forEach(name => {
        unmatchedUsers.add(name);
      });

      // 更新進度
      progress.processed = batchEnd;
      progress.succeeded = successCount;
      progress.failed = failureCount;
      progress.skipped = skippedCount;
      progress.currentRecord = batchRecords[batchRecords.length - 1]?.標題;
      onProgress?.(progress);
    }

    // 第三階段：更新客戶最後聯絡日期
    if (updateCustomerLastContact && customerLastContactDates.size > 0) {
      progress.phase = 'updating';
      progress.currentRecord = '更新客戶最後聯絡日期';
      onProgress?.(progress);

      await updateCustomerLastContactDates(customerLastContactDates);
    }

    // 完成
    progress.phase = 'completed';
    progress.currentRecord = undefined;
    onProgress?.(progress);

    return {
      totalProcessed: records.length,
      successCount,
      failureCount,
      skippedCount,
      errors,
      warnings,
      recordMappings,
      unmatchedCustomers,
      unmatchedUsers,
      duration: Date.now() - startTime,
    };

  } catch (error) {
    console.error('批量導入記錄失敗:', error);
    throw new Error(`批量導入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 處理單個批次
 */
async function processBatch(
  records: LegacyRecord[],
  startIndex: number,
  options: {
    organizationId: string;
    teamId: string;
    userMappings: Map<string, string>;
    customerMappings: Map<string, string>;
    codeToName?: Map<string, string>;
    nameToCode?: Map<string, string>;
    codeToLevel?: Map<string, string>;
    customerLastContactDates: Map<string, Date>;
  }
): Promise<{
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  mappings: Map<string, string>;
  unmatchedCustomers: Set<string>;
  unmatchedUsers: Set<string>;
}> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const mappings = new Map<string, string>();
  const unmatchedCustomers = new Set<string>();
  const unmatchedUsers = new Set<string>();
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;
  let operationCount = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const row = startIndex + i + 1;

    try {
      // 解析業務帳號
      let userId: string | undefined;
      let businessName = record.業務帳號;

      if (options.codeToName && options.nameToCode && options.codeToLevel) {
        const identification = resolveBusinessIdentifier(
          record.業務帳號,
          options.codeToName,
          options.nameToCode,
          options.codeToLevel
        );

        businessName = identification.name || record.業務帳號;

        // 查找對應的 userId
        userId = options.userMappings.get(businessName) || 
                options.userMappings.get(record.業務帳號);
      } else {
        // 直接查找 userId
        userId = options.userMappings.get(record.業務帳號);
      }

      if (!userId) {
        unmatchedUsers.add(record.業務帳號);
        warnings.push({
          type: 'records',
          row,
          field: '業務帳號',
          message: `找不到業務人員: ${record.業務帳號}`,
          suggestion: '記錄將被跳過',
        });
        skippedCount++;
        continue;
      }

      // 查找客戶
      const customerId = options.customerMappings.get(record.客戶名稱);
      
      if (!customerId) {
        unmatchedCustomers.add(record.客戶名稱);
        warnings.push({
          type: 'records',
          row,
          field: '客戶名稱',
          message: `找不到客戶: ${record.客戶名稱}`,
          suggestion: '記錄將被跳過',
        });
        skippedCount++;
        continue;
      }

      // 映射記錄資料
      const mappedRecord = mapLegacyRecord(
        record,
        userId,
        customerId,
        options.organizationId,
        options.teamId
      );

      // 創建記錄文檔
      const recordRef = doc(collection(db, 'records'));
      const recordData: Record = {
        id: recordRef.id,
        title: mappedRecord.title,
        content: mappedRecord.content,
        type: mappedRecord.type,
        customerId: mappedRecord.customerId,
        date: mappedRecord.date,
        tags: mappedRecord.tags,
        organizationId: options.organizationId,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId, // 添加 createdBy 欄位
        teamMembers: [userId], // 添加 teamMembers 欄位以符合 Firestore 規則
        metadata: mappedRecord.metadata,
      };

      // 如果有下次跟進日期，創建對應的任務
      if (mappedRecord.nextFollowUpDate) {
        // TODO: 創建跟進任務
        warnings.push({
          type: 'records',
          row,
          field: '下次跟進日期',
          message: `記錄有跟進日期 ${mappedRecord.nextFollowUpDate.toLocaleDateString()}`,
          suggestion: '請手動創建跟進任務',
        });
      }

      batch.set(recordRef, recordData);
      
      // 生成映射鍵
      const mappingKey = `${record.標題}_${record.訪談日期}`;
      mappings.set(mappingKey, recordRef.id);
      
      // 更新客戶最後聯絡日期
      const currentLastContact = options.customerLastContactDates.get(customerId);
      if (!currentLastContact || mappedRecord.date > currentLastContact) {
        options.customerLastContactDates.set(customerId, mappedRecord.date);
      }
      
      successCount++;
      operationCount++;

      // 檢查批次操作數限制
      if (operationCount >= 500) {
        await batch.commit();
        operationCount = 0;
      }

    } catch (error) {
      errors.push({
        type: 'records',
        row,
        field: 'general',
        message: error instanceof Error ? error.message : '未知錯誤',
        data: record,
      });
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
    mappings,
    unmatchedCustomers,
    unmatchedUsers,
  };
}

/**
 * 更新客戶最後聯絡日期
 */
async function updateCustomerLastContactDates(
  customerLastContactDates: Map<string, Date>
): Promise<void> {
  const db = getFirebaseDb();
  let batch = writeBatch(db);
  let operationCount = 0;

  try {
    for (const [customerId, lastContactDate] of customerLastContactDates.entries()) {
      const customerRef = doc(db, 'customers', customerId);
      batch.update(customerRef, {
        lastContactDate: Timestamp.fromDate(lastContactDate),
        updatedAt: Timestamp.now(),
      });
      
      operationCount++;
      
      // 檢查批次限制
      if (operationCount >= 500) {
        await batch.commit();
        // 重新建立新的批次
        batch = writeBatch(db);
        operationCount = 0;
      }
    }

    // 提交剩餘的更新
    if (operationCount > 0) {
      await batch.commit();
    }

    console.log(`已更新 ${customerLastContactDates.size} 個客戶的最後聯絡日期`);
  } catch (error) {
    console.error('更新客戶最後聯絡日期失敗:', error);
    throw error; // 重新拋出錯誤，讓上層處理
  }
}

/**
 * 生成記錄導入報告
 */
export function generateRecordImportReport(result: RecordImportResult): string {
  const report: string[] = [
    '=== 訪談記錄導入報告 ===',
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

  if (result.unmatchedUsers.size > 0) {
    report.push(`未匹配的業務人員 (${result.unmatchedUsers.size} 個):`);
    const userList = Array.from(result.unmatchedUsers).slice(0, 10);
    userList.forEach(user => {
      report.push(`- ${user}`);
    });
    if (result.unmatchedUsers.size > 10) {
      report.push(`- ... 還有 ${result.unmatchedUsers.size - 10} 個`);
    }
    report.push('');
  }

  if (result.unmatchedCustomers.size > 0) {
    report.push(`未匹配的客戶 (${result.unmatchedCustomers.size} 個):`);
    const customerList = Array.from(result.unmatchedCustomers).slice(0, 10);
    customerList.forEach(customer => {
      report.push(`- ${customer}`);
    });
    if (result.unmatchedCustomers.size > 10) {
      report.push(`- ... 還有 ${result.unmatchedCustomers.size - 10} 個`);
    }
    report.push('');
  }

  if (result.warnings.length > 0) {
    report.push('警告統計:');
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
  report.push('- 檢查未匹配的業務人員和客戶是否已正確導入');
  report.push('- 確認訪談日期格式是否正確');
  report.push('- 手動創建有跟進日期的任務');
  if (result.unmatchedCustomers.size > 0 || result.unmatchedUsers.size > 0) {
    report.push('- 考慮重新導入缺失的業務人員或客戶資料');
  }

  return report.join('\n');
}