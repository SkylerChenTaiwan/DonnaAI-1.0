/**
 * 舊系統資料導入統一服務
 * 協調並執行完整的導入流程
 */

import { 
  LegacyImportSession,
  LegacyImportOptions,
  LegacyImportStats,
  BusinessCodeMapping,
  LegacyUser,
  LegacyCustomer,
  LegacyRecord,
  ImportError,
  ImportWarning
} from '@/types/legacy-import';
import { 
  validateBusinessCodeMapping,
  validateLegacyUser,
  validateLegacyCustomer,
  validateLegacyRecord,
  CleaningOptions
} from '@/services/csv/validator';
import { buildCodeMappings, validateCodeMappings } from './codeMapper';
import { importLegacyUsers, UserImportResult } from './userImporter';
import { importLegacyCustomers, CustomerImportResult } from './customerImporter';
import { importLegacyRecords, RecordImportResult } from './recordImporter';
import { 
  parseLegacyCSV,
  parseBusinessCodeMapping,
  parseLegacyUsers,
  parseLegacyCustomers,
  parseLegacyRecords
} from './parser';
import { v4 as uuidv4 } from 'uuid';

export interface ImportSessionProgress {
  sessionId: string;
  status: LegacyImportSession['status'];
  currentPhase: string;
  currentItem?: string;
  totalItems: number;
  processedItems: number;
  percentage: number;
  errors: number;
  warnings: number;
  estimatedTimeRemaining?: number;
}

export interface ImportSessionResult {
  sessionId: string;
  success: boolean;
  stats: LegacyImportStats;
  errors: ImportError[];
  warnings: ImportWarning[];
  reports: {
    summary: string;
    users?: string;
    customers?: string;
    records?: string;
  };
}

/**
 * 建立新的導入會話
 */
export function createImportSession(
  organizationId: string,
  teamId: string,
  userId: string
): LegacyImportSession {
  return {
    id: uuidv4(),
    organizationId,
    teamId,
    status: 'preparing',
    files: {},
    mappings: {
      codeToName: new Map(),
      nameToCode: new Map(),
      codeToLevel: new Map(),
      userNameToId: new Map(),
      customerNameToId: new Map() },
    results: {
      codeMapping: { total: 0, success: 0, failed: 0, errors: [] },
      users: { total: 0, success: 0, failed: 0, errors: [] },
      customers: { total: 0, success: 0, failed: 0, errors: [] },
      records: { total: 0, success: 0, failed: 0, errors: [] } },
    createdAt: new Date(),
    createdBy: userId,
    errors: [],
    warnings: [] };
}

/**
 * 載入並驗證 CSV 檔案
 */
export async function loadAndValidateFile(
  session: LegacyImportSession,
  fileType: 'codeMapping' | 'users' | 'customers' | 'records',
  fileContent: string,
  fileName: string,
  cleaningOptions?: CleaningOptions
): Promise<{
  success: boolean;
  data?: any[];
  errors?: string[];
}> {
  try {
    // 解析 CSV 檔案
    let rawData: any[];
    
    switch (fileType) {
      case 'codeMapping':
        rawData = await parseBusinessCodeMapping(fileContent);
        break;
      case 'users':
        rawData = await parseLegacyUsers(fileContent);
        break;
      case 'customers':
        rawData = await parseLegacyCustomers(fileContent);
        break;
      case 'records':
        rawData = await parseLegacyRecords(fileContent);
        break;
      default:
        throw new Error('不支援的檔案類型');
    }
    
    if (rawData.length === 0) {
      return {
        success: false,
        errors: ['檔案沒有資料'] };
    }

    // 根據檔案類型進行驗證
    let validationResult;
    const options = cleaningOptions || {
      trimWhitespace: true,
      standardizePhoneNumbers: true,
      standardizeEmails: true,
      removeEmptyFields: false,
      skipEmptyRequiredFields: true, // 跳過必填欄位為空的記錄
    };

    switch (fileType) {
      case 'codeMapping':
        validationResult = validateBusinessCodeMapping(rawData as BusinessCodeMapping[], options);
        break;
      case 'users':
        validationResult = validateLegacyUser(rawData as LegacyUser[], options);
        break;
      case 'customers':
        validationResult = validateLegacyCustomer(rawData as LegacyCustomer[], options);
        break;
      case 'records':
        validationResult = validateLegacyRecord(rawData as LegacyRecord[], options);
        break;
    }

    // 儲存到會話
    session.files[fileType] = {
      fileName,
      data: rawData };

    // 回報驗證結果
    const errors: string[] = [];
    if (validationResult.invalidRecords > 0) {
      errors.push(`有 ${validationResult.invalidRecords} 筆無效記錄`);
    }
    if (validationResult.skippedRecords > 0) {
      errors.push(`已跳過 ${validationResult.skippedRecords} 筆空白記錄`);
    }
    validationResult.warnings.forEach(warning => {
      if (!errors.includes(warning.message)) {
        errors.push(`警告: ${warning.message}`);
      }
    });

    return {
      success: validationResult.invalidRecords === 0,
      data: rawData,
      errors: errors.length > 0 ? errors : undefined };

  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : '檔案載入失敗'] };
  }
}

/**
 * 執行完整的導入流程
 */
export async function executeLegacyImport(
  session: LegacyImportSession,
  options: LegacyImportOptions,
  onProgress?: (progress: ImportSessionProgress) => void
): Promise<ImportSessionResult> {
  const startTime = Date.now();
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const reports: ImportSessionResult['reports'] = {
    summary: '' };

  try {
    // 更新狀態
    session.status = 'mapping';
    
    // 總計算項目數
    const totalItems = 
      (session.files.codeMapping?.data.length || 0) +
      (session.files.users?.data.length || 0) +
      (session.files.customers?.data.length || 0) +
      (session.files.records?.data.length || 0);
    
    let processedItems = 0;

    // 步驟 1: 建立業務代碼映射
    if (session.files.codeMapping) {
      updateProgress('正在建立業務代碼對照表...', processedItems, totalItems);
      
      const mappings = buildCodeMappings(session.files.codeMapping.data);
      session.mappings.codeToName = mappings.codeToName;
      session.mappings.nameToCode = mappings.nameToCode;
      session.mappings.codeToLevel = mappings.codeToLevel;
      
      // 驗證映射
      const validation = validateCodeMappings(
        session.files.codeMapping.data,
        mappings.supervisorMap
      );
      
      if (!validation.isValid) {
        validation.errors.forEach(error => {
          errors.push({
            type: 'codeMapping',
            row: 0,
            message: error,
            data: null });
        });
      }
      
      validation.warnings.forEach(warning => {
        warnings.push({
          type: 'codeMapping',
          row: 0,
          message: warning });
      });
      
      processedItems += session.files.codeMapping.data.length;
      
      session.results.codeMapping = {
        total: session.files.codeMapping.data.length,
        success: validation.isValid ? session.files.codeMapping.data.length : 0,
        failed: validation.isValid ? 0 : session.files.codeMapping.data.length,
        errors: validation.errors.map(e => ({ row: 0, message: e })) };
    }

    // 更新狀態
    session.status = 'importing';

    // 步驟 2: 導入業務人員
    let userResult: UserImportResult | undefined;
    if (session.files.users) {
      updateProgress('正在導入業務人員...', processedItems, totalItems);
      
      userResult = await importLegacyUsers(session.files.users.data, {
        organizationId: session.organizationId,
        teamId: session.teamId,
        skipExisting: options.skipDuplicates,
        updateExisting: options.updateExisting,
        codeToName: session.mappings.codeToName,
        nameToCode: session.mappings.nameToCode,
        codeToLevel: session.mappings.codeToLevel,
        onProgress: (userProgress) => {
          const currentProcessed = processedItems + userProgress.processed;
          updateProgress(
            `正在導入業務人員 (${userProgress.currentUser})...`,
            currentProcessed,
            totalItems
          );
        } });

      session.mappings.userNameToId = userResult.userMappings;
      processedItems += session.files.users.data.length;
      
      session.results.users = {
        total: userResult.totalProcessed,
        success: userResult.successCount,
        failed: userResult.failureCount,
        errors: userResult.errors.map(e => ({ row: e.row, message: e.message })) };
      
      errors.push(...userResult.errors);
      warnings.push(...userResult.warnings);
      reports.users = generateUserImportReport(userResult);
    }

    // 步驟 3: 導入客戶資料
    let customerResult: CustomerImportResult | undefined;
    if (session.files.customers && session.mappings.userNameToId.size > 0) {
      updateProgress('正在導入客戶資料...', processedItems, totalItems);
      
      customerResult = await importLegacyCustomers(session.files.customers.data, {
        organizationId: session.organizationId,
        teamId: session.teamId,
        skipDuplicates: options.skipDuplicates,
        updateExisting: options.updateExisting,
        userMappings: session.mappings.userNameToId,
        codeToName: session.mappings.codeToName,
        nameToCode: session.mappings.nameToCode,
        codeToLevel: session.mappings.codeToLevel,
        onProgress: (customerProgress) => {
          const currentProcessed = processedItems + customerProgress.processed;
          updateProgress(
            `正在導入客戶資料 (${customerProgress.currentCustomer})...`,
            currentProcessed,
            totalItems
          );
        } });

      session.mappings.customerNameToId = customerResult.customerMappings;
      processedItems += session.files.customers.data.length;
      
      session.results.customers = {
        total: customerResult.totalProcessed,
        success: customerResult.successCount,
        failed: customerResult.failureCount,
        errors: customerResult.errors.map(e => ({ row: e.row, message: e.message })) };
      
      errors.push(...customerResult.errors);
      warnings.push(...customerResult.warnings);
      reports.customers = generateCustomerImportReport(customerResult);
    }

    // 步驟 4: 導入訪談記錄
    let recordResult: RecordImportResult | undefined;
    if (session.files.records && 
        session.mappings.userNameToId.size > 0 && 
        session.mappings.customerNameToId.size > 0) {
      updateProgress('正在導入訪談記錄...', processedItems, totalItems);
      
      recordResult = await importLegacyRecords(session.files.records.data, {
        organizationId: session.organizationId,
        teamId: session.teamId,
        userMappings: session.mappings.userNameToId,
        customerMappings: session.mappings.customerNameToId,
        codeToName: session.mappings.codeToName,
        nameToCode: session.mappings.nameToCode,
        codeToLevel: session.mappings.codeToLevel,
        onProgress: (recordProgress) => {
          const currentProcessed = processedItems + recordProgress.processed;
          updateProgress(
            `正在導入訪談記錄 (${recordProgress.currentRecord})...`,
            currentProcessed,
            totalItems
          );
        } });

      processedItems += session.files.records.data.length;
      
      session.results.records = {
        total: recordResult.totalProcessed,
        success: recordResult.successCount,
        failed: recordResult.failureCount,
        errors: recordResult.errors.map(e => ({ row: e.row, message: e.message })) };
      
      errors.push(...recordResult.errors);
      warnings.push(...recordResult.warnings);
      reports.records = generateRecordImportReport(recordResult);
    }

    // 更新會話狀態
    session.status = 'completed';
    session.errors = errors;
    session.warnings = warnings;

    // 計算總統計
    const stats: LegacyImportStats = {
      totalProcessed: processedItems,
      successCount: 
        session.results.codeMapping.success +
        session.results.users.success +
        session.results.customers.success +
        session.results.records.success,
      failureCount:
        session.results.codeMapping.failed +
        session.results.users.failed +
        session.results.customers.failed +
        session.results.records.failed,
      skippedCount: 0, // TODO: 從各個結果中計算
      warningCount: warnings.length,
      duration: Date.now() - startTime,
      averageTimePerRecord: (Date.now() - startTime) / processedItems };

    // 生成總報告
    reports.summary = generateSummaryReport(session, stats);

    updateProgress('導入完成', processedItems, totalItems);

    return {
      sessionId: session.id,
      success: stats.failureCount === 0,
      stats,
      errors,
      warnings,
      reports };

  } catch (error) {
    session.status = 'failed';
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    
    errors.push({
      type: 'users',
      row: 0,
      field: 'general',
      message: `導入流程失敗: ${errorMessage}`,
      data: null });

    return {
      sessionId: session.id,
      success: false,
      stats: {
        totalProcessed: processedItems,
        successCount: 0,
        failureCount: processedItems,
        skippedCount: 0,
        warningCount: warnings.length,
        duration: Date.now() - startTime,
        averageTimePerRecord: 0 },
      errors,
      warnings,
      reports: {
        summary: `導入失敗: ${errorMessage}` } };
  }

  // 內部函數：更新進度
  function updateProgress(phase: string, processed: number, total: number) {
    if (onProgress) {
      onProgress({
        sessionId: session.id,
        status: session.status,
        currentPhase: phase,
        totalItems: total,
        processedItems: processed,
        percentage: total > 0 ? (processed / total) * 100 : 0,
        errors: errors.length,
        warnings: warnings.length,
        estimatedTimeRemaining: calculateEstimatedTime(processed, total, startTime) });
    }
  }
}

/**
 * 計算預估剩餘時間
 */
function calculateEstimatedTime(
  processed: number,
  total: number,
  startTime: number
): number | undefined {
  if (processed === 0) return undefined;
  
  const elapsed = Date.now() - startTime;
  const avgTimePerItem = elapsed / processed;
  const remaining = total - processed;
  
  return Math.ceil((remaining * avgTimePerItem) / 1000); // 秒
}

/**
 * 生成總結報告
 */
function generateSummaryReport(
  session: LegacyImportSession,
  stats: LegacyImportStats
): string {
  const report: string[] = [
    '=== 舊系統資料導入總結報告 ===',
    `導入時間: ${new Date().toLocaleString()}`,
    `總處理時間: ${(stats.duration / 1000).toFixed(2)} 秒`,
    `平均每筆處理時間: ${stats.averageTimePerRecord.toFixed(0)} 毫秒`,
    '',
    '整體統計:',
    `- 總處理記錄: ${stats.totalProcessed}`,
    `- 成功: ${stats.successCount}`,
    `- 失敗: ${stats.failureCount}`,
    `- 警告: ${stats.warningCount}`,
    `- 成功率: ${((stats.successCount / stats.totalProcessed) * 100).toFixed(1)}%`,
    '',
  ];

  // 各項目統計
  if (session.files.codeMapping) {
    report.push('業務代碼對照:');
    report.push(`- 總數: ${session.results.codeMapping.total}`);
    report.push(`- 成功: ${session.results.codeMapping.success}`);
    report.push(`- 失敗: ${session.results.codeMapping.failed}`);
    report.push('');
  }

  if (session.files.users) {
    report.push('業務人員:');
    report.push(`- 總數: ${session.results.users.total}`);
    report.push(`- 成功: ${session.results.users.success}`);
    report.push(`- 失敗: ${session.results.users.failed}`);
    report.push('');
  }

  if (session.files.customers) {
    report.push('客戶資料:');
    report.push(`- 總數: ${session.results.customers.total}`);
    report.push(`- 成功: ${session.results.customers.success}`);
    report.push(`- 失敗: ${session.results.customers.failed}`);
    report.push('');
  }

  if (session.files.records) {
    report.push('訪談記錄:');
    report.push(`- 總數: ${session.results.records.total}`);
    report.push(`- 成功: ${session.results.records.success}`);
    report.push(`- 失敗: ${session.results.records.failed}`);
    report.push('');
  }

  // 主要問題摘要
  if (session.errors.length > 0) {
    report.push('主要錯誤類型:');
    const errorTypes = session.errors.reduce((acc, error) => {
      const key = error.message.split(':')[0];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(errorTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([type, count]) => {
        report.push(`- ${type}: ${count} 筆`);
      });
    report.push('');
  }

  report.push('建議後續動作:');
  if (stats.failureCount > 0) {
    report.push('- 檢查並修正錯誤資料後重新導入');
  }
  if (stats.warningCount > 0) {
    report.push('- 檢視警告訊息，確認資料完整性');
  }
  report.push('- 通知業務人員其登入資訊');
  report.push('- 檢查客戶資料是否完整');
  report.push('- 確認訪談記錄的關聯性');

  return report.join('\n');
}

// 重新導出子模組的報告函數
import { generateUserImportReport } from './userImporter';
import { generateCustomerImportReport } from './customerImporter';
import { generateRecordImportReport } from './recordImporter';

export {
  generateUserImportReport,
  generateCustomerImportReport,
  generateRecordImportReport };