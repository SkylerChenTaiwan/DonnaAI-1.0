/**
 * Firebase 批量導入服務
 * 處理大量客戶數據的分批上傳、進度追踪和錯誤報告
 */

import { writeBatch, collection, doc, getDocs, query, where } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { createCustomer } from '@/services/firebase/customers';
import { CustomerFormData } from '@/services/validation/form-schemas';
import { CustomerDoc } from '@/types/firebase';

export interface ImportOptions {
  batchSize?: number;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  onProgress?: (progress: ImportProgress) => void;
  userId: string;
  teamId: string;
  organizationId: string;
}

export interface ImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  percentage: number;
  estimatedTimeRemaining?: number;
  currentOperation: string;
}

export interface ImportResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: ImportError[];
  duplicates: ImportDuplicate[];
  duration: number;
}

export interface ImportError {
  row: number;
  data: CustomerFormData;
  error: string;
  code?: string;
}

export interface ImportDuplicate {
  row: number;
  data: CustomerFormData;
  existingId: string;
  matchedField: string;
  action: 'skipped' | 'updated';
}

const BATCH_SIZE = 500; // Firestore 批量操作限制
const MAX_PARALLEL_BATCHES = 3; // 最大並行批次數

/**
 * 批量導入客戶數據
 */
export async function importCustomers(
  data: CustomerFormData[],
  options: ImportOptions
): Promise<ImportResult> {
  const startTime = Date.now();
  const {
    batchSize = BATCH_SIZE,
    skipDuplicates = true,
    updateExisting = false,
    onProgress,
    userId,
    teamId,
    organizationId,
  } = options;

  const errors: ImportError[] = [];
  const duplicates: ImportDuplicate[] = [];
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  // 計算批次數量
  const totalBatches = Math.ceil(data.length / batchSize);
  
  // 初始化進度
  const progress: ImportProgress = {
    total: data.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    currentBatch: 0,
    totalBatches,
    percentage: 0,
    currentOperation: '準備導入...',
  };

  onProgress?.(progress);

  try {
    // 檢查現有客戶以避免重複
    let existingCustomers: Map<string, string> = new Map();
    
    if (skipDuplicates || updateExisting) {
      progress.currentOperation = '檢查現有客戶資料...';
      onProgress?.(progress);
      
      existingCustomers = await getExistingCustomers(organizationId, teamId);
    }

    // 分批處理數據
    for (let i = 0; i < totalBatches; i++) {
      const batchStart = i * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, data.length);
      const batchData = data.slice(batchStart, batchEnd);

      progress.currentBatch = i + 1;
      progress.currentOperation = `處理第 ${i + 1}/${totalBatches} 批...`;
      onProgress?.(progress);

      try {
        const batchResult = await processBatch(
          batchData,
          batchStart,
          existingCustomers,
          {
            skipDuplicates,
            updateExisting,
            userId,
            teamId,
            organizationId,
          }
        );

        successCount += batchResult.successCount;
        failureCount += batchResult.failureCount;
        skippedCount += batchResult.skippedCount;
        errors.push(...batchResult.errors);
        duplicates.push(...batchResult.duplicates);

        progress.processed = batchEnd;
        progress.succeeded = successCount;
        progress.failed = failureCount;
        progress.percentage = (batchEnd / data.length) * 100;
        
        // 估算剩餘時間
        const elapsed = Date.now() - startTime;
        const avgTimePerRecord = elapsed / batchEnd;
        const remaining = data.length - batchEnd;
        progress.estimatedTimeRemaining = Math.ceil((remaining * avgTimePerRecord) / 1000);

        onProgress?.(progress);

        // 短暫延遲以避免過度負載
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`批次 ${i + 1} 處理失敗:`, error);
        
        // 記錄整個批次的錯誤
        batchData.forEach((item, index) => {
          errors.push({
            row: batchStart + index + 1,
            data: item,
            error: `批次處理失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
            code: 'BATCH_ERROR',
          });
        });
        
        failureCount += batchData.length;
      }
    }

    const duration = Date.now() - startTime;

    progress.currentOperation = '導入完成';
    progress.percentage = 100;
    onProgress?.(progress);

    return {
      success: failureCount === 0,
      totalRecords: data.length,
      successCount,
      failureCount,
      skippedCount,
      errors,
      duplicates,
      duration,
    };

  } catch (error) {
    console.error('批量導入失敗:', error);
    throw new Error(`批量導入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 處理單個批次
 */
async function processBatch(
  batchData: CustomerFormData[],
  startIndex: number,
  existingCustomers: Map<string, string>,
  options: {
    skipDuplicates: boolean;
    updateExisting: boolean;
    userId: string;
    teamId: string;
    organizationId: string;
  }
): Promise<{
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: ImportError[];
  duplicates: ImportDuplicate[];
}> {
  const errors: ImportError[] = [];
  const duplicates: ImportDuplicate[] = [];
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  // 使用並行處理來提升性能
  const promises = batchData.map(async (item, index) => {
    const rowNumber = startIndex + index + 1;
    
    try {
      // 檢查重複
      const duplicateKey = getDuplicateKey(item);
      const existingId = existingCustomers.get(duplicateKey);

      if (existingId) {
        if (options.skipDuplicates && !options.updateExisting) {
          duplicates.push({
            row: rowNumber,
            data: item,
            existingId,
            matchedField: duplicateKey.includes('@') ? 'email' : 'name+company',
            action: 'skipped',
          });
          return { type: 'skipped' };
        } else if (options.updateExisting) {
          // TODO: 實作更新現有記錄的邏輯
          duplicates.push({
            row: rowNumber,
            data: item,
            existingId,
            matchedField: duplicateKey.includes('@') ? 'email' : 'name+company',
            action: 'updated',
          });
          return { type: 'updated' };
        }
      }

      // 準備客戶數據
      const customerData = {
        ...item,
        assignedTo: options.userId,
        teamId: options.teamId,
        organizationId: options.organizationId,
        // 清理空值
        email: item.email || undefined,
        phone: item.phone || undefined,
        industry: item.industry || undefined,
        address: item.address || undefined,
        notes: item.notes || undefined,
      };

      // 創建客戶
      await createCustomer(customerData, options.userId);
      return { type: 'success' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      
      return {
        type: 'error',
        error: {
          row: rowNumber,
          data: item,
          error: errorMessage,
          code: getErrorCode(errorMessage),
        },
      };
    }
  });

  // 等待所有並行處理完成
  const results = await Promise.all(promises);

  // 統計結果
  results.forEach(result => {
    switch (result.type) {
      case 'success':
        successCount++;
        break;
      case 'error':
        failureCount++;
        if (result.error) {
          errors.push(result.error);
        }
        break;
      case 'skipped':
      case 'updated':
        skippedCount++;
        break;
    }
  });

  return {
    successCount,
    failureCount,
    skippedCount,
    errors,
    duplicates,
  };
}

/**
 * 獲取現有客戶映射
 */
async function getExistingCustomers(
  organizationId: string,
  teamId: string
): Promise<Map<string, string>> {
  const existingMap = new Map<string, string>();

  try {
    const db = getFirebaseDb();
    const customersRef = collection(db, 'customers');
    
    // 查詢組織內的客戶
    const q = query(
      customersRef,
      where('organizationId', '==', organizationId),
      where('teamId', '==', teamId)
    );

    const snapshot = await getDocs(q);
    
    snapshot.forEach((doc) => {
      const data = doc.data() as CustomerDoc;
      
      // 使用多種鍵來檢查重複
      if (data.email) {
        existingMap.set(data.email.toLowerCase(), doc.id);
      }
      
      if (data.name && data.company) {
        const nameCompanyKey = `${data.name.toLowerCase()}_${data.company.toLowerCase()}`;
        existingMap.set(nameCompanyKey, doc.id);
      }
    });

  } catch (error) {
    console.error('獲取現有客戶失敗:', error);
    // 不拋出錯誤，繼續處理但沒有重複檢查
  }

  return existingMap;
}

/**
 * 生成重複檢查鍵
 */
function getDuplicateKey(data: CustomerFormData): string {
  if (data.email) {
    return data.email.toLowerCase();
  }
  
  if (data.name && data.company) {
    return `${data.name.toLowerCase()}_${data.company.toLowerCase()}`;
  }
  
  return `${data.name || ''}_${data.company || ''}`.toLowerCase();
}

/**
 * 根據錯誤訊息獲取錯誤代碼
 */
function getErrorCode(errorMessage: string): string {
  if (errorMessage.includes('權限')) return 'PERMISSION_DENIED';
  if (errorMessage.includes('網路')) return 'NETWORK_ERROR';
  if (errorMessage.includes('必填')) return 'VALIDATION_ERROR';
  if (errorMessage.includes('格式')) return 'FORMAT_ERROR';
  if (errorMessage.includes('重複')) return 'DUPLICATE_ERROR';
  return 'UNKNOWN_ERROR';
}

/**
 * 生成導入報告
 */
export function generateImportReport(result: ImportResult): string {
  const report = [
    '=== CSV 導入報告 ===',
    `導入時間: ${new Date().toLocaleString()}`,
    `處理時長: ${(result.duration / 1000).toFixed(2)} 秒`,
    '',
    '統計結果:',
    `- 總記錄數: ${result.totalRecords}`,
    `- 成功導入: ${result.successCount}`,
    `- 導入失敗: ${result.failureCount}`,
    `- 跳過記錄: ${result.skippedCount}`,
    `- 成功率: ${((result.successCount / result.totalRecords) * 100).toFixed(1)}%`,
    '',
  ];

  if (result.duplicates.length > 0) {
    report.push('重複記錄:');
    const duplicatesByAction = result.duplicates.reduce((acc, dup) => {
      acc[dup.action] = (acc[dup.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(duplicatesByAction).forEach(([action, count]) => {
      const actionName = action === 'skipped' ? '跳過' : '更新';
      report.push(`- ${actionName}: ${count} 筆`);
    });
    report.push('');
  }

  if (result.errors.length > 0) {
    report.push('錯誤統計:');
    const errorsByCode = result.errors.reduce((acc, error) => {
      const code = error.code || 'UNKNOWN_ERROR';
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(errorsByCode).forEach(([code, count]) => {
      const codeName = getErrorCodeName(code);
      report.push(`- ${codeName}: ${count} 筆`);
    });

    if (result.errors.length <= 10) {
      report.push('');
      report.push('錯誤詳情:');
      result.errors.slice(0, 10).forEach((error, index) => {
        report.push(`${index + 1}. 第 ${error.row} 行: ${error.error}`);
      });
    }
  }

  return report.join('\n');
}

/**
 * 獲取錯誤代碼的中文名稱
 */
function getErrorCodeName(code: string): string {
  const codeNames: Record<string, string> = {
    PERMISSION_DENIED: '權限錯誤',
    NETWORK_ERROR: '網路錯誤',
    VALIDATION_ERROR: '驗證錯誤',
    FORMAT_ERROR: '格式錯誤',
    DUPLICATE_ERROR: '重複錯誤',
    BATCH_ERROR: '批次錯誤',
    UNKNOWN_ERROR: '未知錯誤',
  };

  return codeNames[code] || code;
}