/**
 * 動態資料匯入服務
 * 支援動態欄位配置、分片儲存和智慧型驗證
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
import {
  DynamicFieldConfig,
  FieldMappingConfig,
  FieldMapping,
  ValidationError,
  ImportError,
  ImportStatus,
  CSVAnalysisResult,
} from '@/types/dynamic-field-mapping';
import { ShardingService } from '@/services/dynamic-fields/ShardingService';
import { DynamicFieldService } from '@/services/dynamic-fields/DynamicFieldService';
import { ValidationEngine } from '@/services/dynamic-fields/ValidationEngine';
import { isOrgAdmin } from '../permissions';
import * as Papa from 'papaparse';

export interface DynamicImportSession {
  id: string;
  orgId: string;
  userId: string;
  mappingConfig: FieldMappingConfig;
  status: ImportStatus;
  progress: DynamicImportProgress;
  statistics: DynamicImportStatistics;
  errors: ImportError[];
  warnings: ValidationError[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  metadata: {
    sourceFile: string;
    totalRecords: number;
    estimatedTime?: number;
    actualTime?: number;
  };
}

export interface DynamicImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentPhase: 'analyzing' | 'validating' | 'transforming' | 'storing' | 'indexing' | 'completed' | 'failed';
  phaseProgress: number; // 當前階段的進度 (0-100)
  speed: number; // 每秒處理記錄數
  estimatedTimeRemaining: number; // 預估剩餘時間（秒）
  message?: string;
}

export interface DynamicImportStatistics {
  recordsPerSecond: number;
  averageRecordSize: number;
  totalDataSize: number;
  shardsCreated: number;
  fieldsProcessed: number;
  validationErrors: number;
  dataQualityScore: number; // 0-100
  completionRate: number; // 0-100
}

export interface DynamicImportOptions {
  batchSize?: number;
  maxRetries?: number;
  enableSharding?: boolean;
  validationMode?: 'strict' | 'warning' | 'permissive';
  skipDuplicates?: boolean;
  onProgress?: (progress: DynamicImportProgress) => void;
  onError?: (error: ImportError) => void;
  onWarning?: (warning: ValidationError) => void;
}

export class DynamicDataImportService {
  private db = getFirebaseDb();
  private shardingService = new ShardingService();
  private fieldService = new DynamicFieldService();
  private validationEngine = new ValidationEngine();

  private readonly IMPORT_SESSIONS_COLLECTION = 'importSessions';
  private readonly DEFAULT_BATCH_SIZE = 100;
  private readonly MAX_DOCUMENT_SIZE = 900 * 1024; // 900KB (留 100KB 給 Firestore 開銷)

  /**
   * 開始動態資料匯入
   */
  async startImport(
    mappingConfig: FieldMappingConfig,
    csvData: Record<string, unknown>[],
    options: DynamicImportOptions = {}
  ): Promise<string> {
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

    // 獲取組織 ID
    const userDoc = await getDocs(
      query(collection(this.db, 'users'), where('uid', '==', currentUser.uid), limit(1))
    );
    const orgId = userDoc.docs[0]?.data()?.organizationId;

    if (!orgId) {
      throw new Error('無法獲取組織資訊');
    }

    // 建立匯入會話
    const sessionId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: DynamicImportSession = {
      id: sessionId,
      orgId,
      userId: currentUser.uid,
      mappingConfig,
      status: 'analyzing',
      progress: {
        total: csvData.length,
        processed: 0,
        successful: 0,
        failed: 0,
        currentPhase: 'analyzing',
        phaseProgress: 0,
        speed: 0,
        estimatedTimeRemaining: 0,
      },
      statistics: {
        recordsPerSecond: 0,
        averageRecordSize: 0,
        totalDataSize: 0,
        shardsCreated: 0,
        fieldsProcessed: 0,
        validationErrors: 0,
        dataQualityScore: 0,
        completionRate: 0,
      },
      errors: [],
      warnings: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      metadata: {
        sourceFile: mappingConfig.name,
        totalRecords: csvData.length,
      },
    };

    // 儲存會話
    await setDoc(doc(this.db, this.IMPORT_SESSIONS_COLLECTION, sessionId), session);

    // 開始背景處理
    this.processImportInBackground(sessionId, csvData, options);

    return sessionId;
  }

  /**
   * 背景處理匯入
   */
  private async processImportInBackground(
    sessionId: string,
    csvData: Record<string, unknown>[],
    options: DynamicImportOptions
  ): Promise<void> {
    const startTime = Date.now();

    try {
      await this.updateProgress(sessionId, {
        currentPhase: 'analyzing',
        phaseProgress: 0,
        message: '正在分析資料結構...',
      });

      // 階段 1: 分析和驗證欄位定義
      const session = await this.getSession(sessionId);
      const fieldDefinitions = await this.analyzeFieldDefinitions(session.mappingConfig);
      
      await this.updateProgress(sessionId, {
        currentPhase: 'validating',
        phaseProgress: 0,
        message: '正在驗證資料格式...',
      });

      // 階段 2: 驗證資料
      const { validRecords, invalidRecords, warnings } = await this.validateRecords(
        csvData,
        fieldDefinitions,
        options,
        (progress) => this.updateProgress(sessionId, {
          currentPhase: 'validating',
          phaseProgress: progress,
        })
      );

      await this.updateProgress(sessionId, {
        currentPhase: 'transforming',
        phaseProgress: 0,
        message: '正在轉換資料格式...',
      });

      // 階段 3: 轉換資料
      const transformedRecords = await this.transformRecords(
        validRecords,
        session.mappingConfig,
        fieldDefinitions,
        (progress) => this.updateProgress(sessionId, {
          currentPhase: 'transforming',
          phaseProgress: progress,
        })
      );

      await this.updateProgress(sessionId, {
        currentPhase: 'storing',
        phaseProgress: 0,
        message: '正在儲存資料...',
      });

      // 階段 4: 儲存資料（使用分片）
      const storageResults = await this.storeRecords(
        transformedRecords,
        session.orgId,
        session.mappingConfig.targetEntity,
        options,
        (progress) => this.updateProgress(sessionId, {
          currentPhase: 'storing',
          phaseProgress: progress,
        })
      );

      await this.updateProgress(sessionId, {
        currentPhase: 'indexing',
        phaseProgress: 0,
        message: '正在建立索引...',
      });

      // 階段 5: 建立索引和最終統計
      await this.createIndexes(session.orgId, fieldDefinitions);

      // 完成匯入
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;

      const finalStatistics: DynamicImportStatistics = {
        recordsPerSecond: validRecords.length / totalTime,
        averageRecordSize: storageResults.totalSize / validRecords.length,
        totalDataSize: storageResults.totalSize,
        shardsCreated: storageResults.shardCount,
        fieldsProcessed: fieldDefinitions.length,
        validationErrors: invalidRecords.length,
        dataQualityScore: Math.round((validRecords.length / csvData.length) * 100),
        completionRate: 100,
      };

      await this.updateSession(sessionId, {
        status: 'completed',
        progress: {
          total: csvData.length,
          processed: csvData.length,
          successful: validRecords.length,
          failed: invalidRecords.length,
          currentPhase: 'completed',
          phaseProgress: 100,
          speed: finalStatistics.recordsPerSecond,
          estimatedTimeRemaining: 0,
          message: '匯入完成',
        },
        statistics: finalStatistics,
        warnings,
        completedAt: Timestamp.now(),
        metadata: {
          sourceFile: session.mappingConfig.name,
          totalRecords: csvData.length,
          actualTime: totalTime,
        },
      });

      options.onProgress?.({
        total: csvData.length,
        processed: csvData.length,
        successful: validRecords.length,
        failed: invalidRecords.length,
        currentPhase: 'completed',
        phaseProgress: 100,
        speed: finalStatistics.recordsPerSecond,
        estimatedTimeRemaining: 0,
        message: '匯入完成',
      });

    } catch (error) {
      console.error('匯入過程發生錯誤:', error);
      
      const importError: ImportError = {
        timestamp: Timestamp.now(),
        type: 'unknown',
        code: 'IMPORT_FAILED',
        message: error instanceof Error ? error.message : '未知錯誤',
        retryable: false,
        details: { error: String(error) },
      };

      await this.updateSession(sessionId, {
        status: 'failed',
        errors: [importError],
      });

      options.onError?.(importError);
    }
  }

  /**
   * 分析欄位定義
   */
  private async analyzeFieldDefinitions(mappingConfig: FieldMappingConfig): Promise<DynamicFieldConfig[]> {
    // 從映射配置中提取欄位定義
    const fieldIds = mappingConfig.mappings.map(m => m.targetField);
    const fieldConfigs: DynamicFieldConfig[] = [];
    
    // 批次獲取欄位定義
    for (const fieldId of fieldIds) {
      const config = await this.fieldService.getField(fieldId);
      if (config) {
        fieldConfigs.push(config);
      }
    }
    
    return fieldConfigs;
  }

  /**
   * 驗證記錄
   */
  private async validateRecords(
    records: Record<string, unknown>[],
    fieldDefinitions: DynamicFieldConfig[],
    options: DynamicImportOptions,
    onProgress: (progress: number) => void
  ): Promise<{
    validRecords: Record<string, unknown>[];
    invalidRecords: Array<{ record: Record<string, unknown>; errors: ValidationError[] }>;
    warnings: ValidationError[];
  }> {
    const validRecords: Record<string, unknown>[] = [];
    const invalidRecords: Array<{ record: Record<string, unknown>; errors: ValidationError[] }> = [];
    const warnings: ValidationError[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const errors = await this.validationEngine.validateRecord(record, fieldDefinitions);
      
      const criticalErrors = errors.filter(e => e.code.startsWith('CRITICAL_'));
      const warningErrors = errors.filter(e => !e.code.startsWith('CRITICAL_'));

      if (criticalErrors.length > 0 && options.validationMode === 'strict') {
        invalidRecords.push({ record, errors: criticalErrors });
        criticalErrors.forEach(error => options.onError?.({
          timestamp: Timestamp.now(),
          type: 'validation',
          code: error.code,
          message: error.message,
          affectedRecords: [i],
          retryable: false,
        }));
      } else {
        validRecords.push(record);
        warningErrors.forEach(error => {
          warnings.push(error);
          options.onWarning?.(error);
        });
      }

      // 更新進度
      const progress = Math.round(((i + 1) / records.length) * 100);
      onProgress(progress);
    }

    return { validRecords, invalidRecords, warnings };
  }

  /**
   * 轉換記錄
   */
  private async transformRecords(
    records: Record<string, unknown>[],
    mappingConfig: FieldMappingConfig,
    fieldDefinitions: DynamicFieldConfig[],
    onProgress: (progress: number) => void
  ): Promise<Record<string, unknown>[]> {
    const transformedRecords: Record<string, unknown>[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const transformed: Record<string, unknown> = {};

      // 應用欄位映射
      for (const mapping of mappingConfig.mappings) {
        const sourceValue = record[mapping.sourceField];
        const fieldDef = fieldDefinitions.find(f => f.fieldKey === mapping.targetField);

        if (fieldDef && sourceValue !== undefined) {
          // 應用資料類型轉換
          transformed[mapping.targetField] = await this.transformValue(
            sourceValue,
            fieldDef,
            mapping.transformFunction
          );
        }
      }

      // 加入元資料
      transformed._metadata = {
        importedAt: Timestamp.now(),
        sourceRow: i + 1,
        mappingConfigId: mappingConfig.id,
      };

      transformedRecords.push(transformed);

      // 更新進度
      const progress = Math.round(((i + 1) / records.length) * 100);
      onProgress(progress);
    }

    return transformedRecords;
  }

  /**
   * 轉換單一值
   */
  private async transformValue(
    value: unknown,
    fieldDef: DynamicFieldConfig,
    transformFunction?: string
  ): Promise<unknown> {
    if (value === null || value === undefined || value === '') {
      return fieldDef.defaultValue || null;
    }

    // 應用自訂轉換函數
    if (transformFunction) {
      // TODO: 實作自訂轉換函數邏輯
    }

    // 根據欄位類型轉換
    switch (fieldDef.dataType) {
      case 'number':
      case 'currency':
      case 'percentage':
        const num = Number(value);
        return isNaN(num) ? null : num;

      case 'boolean':
        if (typeof value === 'boolean') return value;
        const str = String(value).toLowerCase();
        return ['true', '1', 'yes', '是', '真'].includes(str);

      case 'date':
      case 'datetime':
        try {
          return Timestamp.fromDate(new Date(String(value)));
        } catch {
          return null;
        }

      case 'json':
        try {
          return typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
          return null;
        }

      case 'array':
        if (Array.isArray(value)) return value;
        return String(value).split(',').map(v => v.trim());

      default:
        return String(value);
    }
  }

  /**
   * 儲存記錄（使用分片）
   */
  private async storeRecords(
    records: Record<string, unknown>[],
    orgId: string,
    targetEntity: string,
    options: DynamicImportOptions,
    onProgress: (progress: number) => void
  ): Promise<{ totalSize: number; shardCount: number }> {
    const batchSize = options.batchSize || this.DEFAULT_BATCH_SIZE;
    let totalSize = 0;
    let totalShardCount = 0;

    // 分批處理
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      for (let j = 0; j < batch.length; j++) {
        const record = batch[j];
        const recordId = `${targetEntity}_${Date.now()}_${i + j}`;
        
        // 使用分片服務儲存
        const result = await this.shardingService.writeShardedData(
          targetEntity,
          recordId,
          record
        );

        if (result.success) {
          totalSize += result.totalSize;
          totalShardCount += result.shardCount;
        } else {
          throw new Error(`儲存記錄失敗: ${result.error}`);
        }
      }

      // 更新進度
      const progress = Math.round(((i + batch.length) / records.length) * 100);
      onProgress(progress);
    }

    return { totalSize, shardCount: totalShardCount };
  }

  /**
   * 建立索引
   */
  private async createIndexes(orgId: string, fieldDefinitions: DynamicFieldConfig[]): Promise<void> {
    // TODO: 實作複合索引建立邏輯
    // 這可能需要透過 Cloud Functions 或 Admin SDK 來建立 Firestore 索引
    console.log('建立索引:', fieldDefinitions.map(f => f.fieldKey));
  }

  /**
   * 獲取匯入會話
   */
  async getSession(sessionId: string): Promise<DynamicImportSession> {
    const sessionDoc = await getDocs(
      query(collection(this.db, this.IMPORT_SESSIONS_COLLECTION), where('id', '==', sessionId), limit(1))
    );

    if (sessionDoc.empty) {
      throw new Error('找不到匯入會話');
    }

    return sessionDoc.docs[0].data() as DynamicImportSession;
  }

  /**
   * 更新進度
   */
  private async updateProgress(sessionId: string, progressUpdate: Partial<DynamicImportProgress>): Promise<void> {
    const sessionRef = doc(this.db, this.IMPORT_SESSIONS_COLLECTION, sessionId);
    const session = await this.getSession(sessionId);
    
    const updatedProgress = { ...session.progress, ...progressUpdate };
    
    await setDoc(sessionRef, {
      ...session,
      progress: updatedProgress,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * 更新會話
   */
  private async updateSession(sessionId: string, updates: Partial<DynamicImportSession>): Promise<void> {
    const sessionRef = doc(this.db, this.IMPORT_SESSIONS_COLLECTION, sessionId);
    const session = await this.getSession(sessionId);
    
    await setDoc(sessionRef, {
      ...session,
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * 暫停匯入
   */
  async pauseImport(sessionId: string): Promise<void> {
    await this.updateSession(sessionId, {
      status: 'cancelled', // 暫時使用 cancelled，可能需要新增 'paused' 狀態
    });
  }

  /**
   * 恢復匯入
   */
  async resumeImport(sessionId: string): Promise<void> {
    // TODO: 實作恢復邏輯
    // 需要記錄上次停止的位置並從該位置繼續
  }

  /**
   * 取消匯入
   */
  async cancelImport(sessionId: string): Promise<void> {
    await this.updateSession(sessionId, {
      status: 'cancelled',
      completedAt: Timestamp.now(),
    });
  }

  /**
   * 獲取匯入進度
   */
  async getProgress(sessionId: string): Promise<DynamicImportProgress> {
    const session = await this.getSession(sessionId);
    return session.progress;
  }

  /**
   * 獲取匯入統計
   */
  async getStatistics(sessionId: string): Promise<DynamicImportStatistics> {
    const session = await this.getSession(sessionId);
    return session.statistics;
  }
}

// 匯出單例
export const dynamicDataImportService = new DynamicDataImportService();