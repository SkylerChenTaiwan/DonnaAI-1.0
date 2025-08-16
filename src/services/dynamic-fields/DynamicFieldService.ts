/**
 * 動態欄位服務 - CRUD 操作
 * 管理動態欄位的配置、儲存和檢索
 */

import {
  DynamicFieldConfig,
  FieldDataType,
  SecurityLevel,
  CSVAnalysisResult,
  DetectedField,
  FieldUsageStats,
  FieldValidationRule,
  createSafeFieldKey,
  isValidFieldDataType,
  FIELD_TYPE_VALIDATION_RULES,
} from '@/types/dynamic-field-mapping';
import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  FirestoreError,
  DocumentReference,
  CollectionReference,
  QueryConstraint,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { DynamicFieldAnalyzer } from './DynamicFieldAnalyzer';

/**
 * 欄位搜尋選項
 */
interface FieldSearchOptions {
  entityType?: string;        // 實體類型（如 'mergeTask', 'customerData'）
  dataTypes?: FieldDataType[]; // 資料類型篩選
  isActive?: boolean;          // 僅顯示啟用的欄位
  isSearchable?: boolean;      // 僅顯示可搜尋的欄位
  isSortable?: boolean;        // 僅顯示可排序的欄位
  securityLevel?: SecurityLevel; // 安全等級篩選
  tags?: string[];             // 標籤篩選
  createdBy?: string;          // 建立者篩選
  limit?: number;              // 限制返回數量
  orderBy?: 'name' | 'created' | 'updated' | 'usage'; // 排序方式
}

/**
 * 批次操作結果
 */
interface BatchOperationResult {
  success: number;
  failed: number;
  errors: Array<{ fieldId: string; error: string }>;
}

/**
 * 欄位更新選項
 */
interface FieldUpdateOptions {
  updateUsage?: boolean;       // 是否更新使用統計
  validateData?: boolean;      // 是否驗證資料
  auditLog?: boolean;          // 是否記錄審計日誌
}

/**
 * 動態欄位服務類
 */
export class DynamicFieldService {
  private readonly COLLECTION_NAME = 'dynamicFieldConfigs';
  private readonly MAX_BATCH_SIZE = 500;
  private fieldAnalyzer: DynamicFieldAnalyzer;
  private cache: Map<string, DynamicFieldConfig> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 分鐘快取

  constructor() {
    this.fieldAnalyzer = new DynamicFieldAnalyzer();
  }

  /**
   * 建立單一欄位配置
   */
  async createField(
    config: Omit<DynamicFieldConfig, 'id' | 'metadata'>,
    userId: string
  ): Promise<DynamicFieldConfig> {
    try {
      // 產生唯一 ID
      const fieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 驗證資料類型
      if (!isValidFieldDataType(config.dataType)) {
        throw new Error(`無效的資料類型: ${config.dataType}`);
      }

      // 建立完整配置
      const fullConfig: DynamicFieldConfig = {
        ...config,
        id: fieldId,
        fieldKey: createSafeFieldKey(config.fieldKey),
        validationRules: config.validationRules || FIELD_TYPE_VALIDATION_RULES[config.dataType] || [],
        metadata: {
          createdBy: userId,
          createdAt: Timestamp.fromDate(new Date()),
          updatedBy: userId,
          updatedAt: Timestamp.fromDate(new Date()),
          source: config.metadata?.source ?? 'manual',
          originalName: config.displayName,
          tags: config.metadata?.tags || [],
        },
        usage: config.usage || {
          usageCount: 0,
          lastUsed: undefined,
          nullRatio: 0,
          uniqueValueCount: 0,
        },
      };

      // 儲存到 Firestore
      const db = getFirebaseDb();
      const docRef = doc(db, this.COLLECTION_NAME, fieldId);
      await setDoc(docRef, this.serializeForFirestore(fullConfig));

      // 更新快取
      this.updateCache(fieldId, fullConfig);

      return fullConfig;
    } catch (error) {
      throw this.handleServiceError('建立欄位失敗', error);
    }
  }

  /**
   * 批次建立欄位配置（從 CSV 分析結果）
   */
  async createFieldsFromAnalysis(
    analysisResult: CSVAnalysisResult,
    entityType: string,
    userId: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      // 批次處理欄位
      const batches = this.createBatches(analysisResult.detectedFields, this.MAX_BATCH_SIZE);
      
      for (const batch of batches) {
        const promises = batch.map(async (field) => {
          try {
            const config = this.fieldAnalyzer.createFieldConfig(field);
            await this.createField(
              {
                ...config,
                metadata: {
                  ...config.metadata,
                  tags: [...(config.metadata?.tags ?? []), entityType],
                },
              },
              userId
            );
            result.success++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              fieldId: field.originalName,
              error: error instanceof Error ? error.message : '未知錯誤',
            });
          }
        });

        await Promise.all(promises);
      }

      return result;
    } catch (error) {
      throw this.handleServiceError('批次建立欄位失敗', error);
    }
  }

  /**
   * 取得單一欄位配置
   */
  async getField(fieldId: string): Promise<DynamicFieldConfig | null> {
    try {
      // 檢查快取
      const cached = this.getFromCache(fieldId);
      if (cached) {
        return cached;
      }

      // 從 Firestore 讀取
      const db = getFirebaseDb();
      const docRef = doc(db, this.COLLECTION_NAME, fieldId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const config = this.deserializeFromFirestore(docSnap.data());
      
      // 更新快取
      this.updateCache(fieldId, config);

      return config;
    } catch (error) {
      throw this.handleServiceError('取得欄位失敗', error);
    }
  }

  /**
   * 搜尋欄位配置
   */
  async searchFields(options: FieldSearchOptions = {}): Promise<DynamicFieldConfig[]> {
    try {
      const constraints: QueryConstraint[] = [];

      // 建立查詢條件
      if (options.entityType) {
        constraints.push(where('metadata.tags', 'array-contains', options.entityType));
      }

      if (options.isActive !== undefined) {
        constraints.push(where('isActive', '==', options.isActive));
      }

      if (options.isSearchable !== undefined) {
        constraints.push(where('isSearchable', '==', options.isSearchable));
      }

      if (options.securityLevel) {
        constraints.push(where('security.level', '==', options.securityLevel));
      }

      // 排序
      switch (options.orderBy) {
        case 'name':
          constraints.push(orderBy('displayName'));
          break;
        case 'created':
          constraints.push(orderBy('metadata.createdAt', 'desc'));
          break;
        case 'updated':
          constraints.push(orderBy('metadata.updatedAt', 'desc'));
          break;
        case 'usage':
          constraints.push(orderBy('usage.usageCount', 'desc'));
          break;
      }

      // 限制數量
      if (options.limit) {
        constraints.push(limit(options.limit));
      }

      // 執行查詢
      const db = getFirebaseDb();
      const q = query(collection(db, this.COLLECTION_NAME), ...constraints);
      const querySnapshot = await getDocs(q);

      const fields: DynamicFieldConfig[] = [];
      querySnapshot.forEach((doc) => {
        const config = this.deserializeFromFirestore(doc.data());
        
        // 額外的本地篩選（針對複雜條件）
        if (options.dataTypes && !options.dataTypes.includes(config.dataType)) {
          return;
        }

        if (options.tags && options.tags.length > 0) {
          const hasAllTags = options.tags.every(tag => 
            config.metadata?.tags?.includes(tag) ?? false
          );
          if (!hasAllTags) return;
        }

        fields.push(config);
      });

      return fields;
    } catch (error) {
      throw this.handleServiceError('搜尋欄位失敗', error);
    }
  }

  /**
   * 更新欄位配置
   */
  async updateField(
    fieldId: string,
    updates: Partial<DynamicFieldConfig>,
    userId: string,
    options: FieldUpdateOptions = {}
  ): Promise<DynamicFieldConfig> {
    try {
      // 取得現有配置
      const existing = await this.getField(fieldId);
      if (!existing) {
        throw new Error(`欄位不存在: ${fieldId}`);
      }

      // 合併更新
      const updated: DynamicFieldConfig = {
        ...existing,
        ...updates,
        id: fieldId, // 確保 ID 不變
        metadata: {
          ...existing.metadata,
          ...updates.metadata,
          updatedBy: userId,
          updatedAt: Timestamp.fromDate(new Date()),
        },
      };

      // 驗證更新後的資料
      if (options.validateData && !isValidFieldDataType(updated.dataType)) {
        throw new Error(`無效的資料類型: ${updated.dataType}`);
      }

      // 儲存到 Firestore
      const db = getFirebaseDb();
      const docRef = doc(db, this.COLLECTION_NAME, fieldId);
      
      // 更新使用統計（分離處理以避免型別問題）
      if (options.updateUsage) {
        await updateDoc(docRef, {
          ...this.serializeForFirestore(updated),
          'usage.usageCount': increment(1),
          'usage.lastUsed': serverTimestamp(),
        });
        
        // 重新讀取以獲得正確的型別
        const updatedDoc = await getDoc(docRef);
        if (updatedDoc.exists()) {
          updated = this.deserializeFromFirestore(updatedDoc.data());
        }
      } else {
        await updateDoc(docRef, this.serializeForFirestore(updated));
      }

      // 清除快取
      this.invalidateCache(fieldId);

      // 審計日誌（如果需要）
      if (options.auditLog && updated.security?.auditLog) {
        await this.logFieldOperation('update', fieldId, userId, updates);
      }

      return updated;
    } catch (error) {
      throw this.handleServiceError('更新欄位失敗', error);
    }
  }

  /**
   * 刪除欄位配置
   */
  async deleteField(fieldId: string, userId: string): Promise<void> {
    try {
      // 檢查欄位是否存在
      const existing = await this.getField(fieldId);
      if (!existing) {
        throw new Error(`欄位不存在: ${fieldId}`);
      }

      // 檢查是否為系統欄位
      if (existing.isSystem) {
        throw new Error('無法刪除系統欄位');
      }

      // 刪除文檔
      const db = getFirebaseDb();
      const docRef = doc(db, this.COLLECTION_NAME, fieldId);
      await deleteDoc(docRef);

      // 清除快取
      this.invalidateCache(fieldId);

      // 審計日誌
      if (existing.security?.auditLog) {
        await this.logFieldOperation('delete', fieldId, userId, existing);
      }
    } catch (error) {
      throw this.handleServiceError('刪除欄位失敗', error);
    }
  }

  /**
   * 批次更新欄位狀態
   */
  async bulkUpdateStatus(
    fieldIds: string[],
    isActive: boolean,
    userId: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const batches = this.createBatches(fieldIds, this.MAX_BATCH_SIZE);

    for (const batch of batches) {
      const promises = batch.map(async (fieldId) => {
        try {
          await this.updateField(
            fieldId,
            { isActive },
            userId,
            { validateData: false }
          );
          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            fieldId,
            error: error instanceof Error ? error.message : '未知錯誤',
          });
        }
      });

      await Promise.all(promises);
    }

    return result;
  }

  /**
   * 取得欄位使用統計
   */
  async getFieldStats(entityType?: string): Promise<{
    totalFields: number;
    activeFields: number;
    dataTypeDistribution: Record<FieldDataType, number>;
    securityLevelDistribution: Record<SecurityLevel, number>;
    averageUsage: number;
    mostUsedFields: DynamicFieldConfig[];
  }> {
    try {
      const fields = await this.searchFields({ entityType });
      
      const stats = {
        totalFields: fields.length,
        activeFields: fields.filter(f => f.isActive).length,
        dataTypeDistribution: {} as Record<FieldDataType, number>,
        securityLevelDistribution: {} as Record<SecurityLevel, number>,
        averageUsage: 0,
        mostUsedFields: [] as DynamicFieldConfig[],
      };

      // 計算分佈
      let totalUsage = 0;
      for (const field of fields) {
        // 資料類型分佈
        stats.dataTypeDistribution[field.dataType] = 
          (stats.dataTypeDistribution[field.dataType] || 0) + 1;

        // 安全等級分佈
        if (field.security?.level) {
          stats.securityLevelDistribution[field.security.level] = 
            (stats.securityLevelDistribution[field.security.level] || 0) + 1;
        }

        // 使用統計
        totalUsage += field.usage?.usageCount || 0;
      }

      // 平均使用次數
      stats.averageUsage = fields.length > 0 ? totalUsage / fields.length : 0;

      // 最常使用的欄位（前 10）
      stats.mostUsedFields = fields
        .sort((a, b) => (b.usage?.usageCount || 0) - (a.usage?.usageCount || 0))
        .slice(0, 10);

      return stats;
    } catch (error) {
      throw this.handleServiceError('取得統計失敗', error);
    }
  }

  /**
   * 序列化為 Firestore 格式
   */
  private serializeForFirestore(config: DynamicFieldConfig): Record<string, unknown> {
    const { defaultValue, ...rest } = config;
    const serialized: Record<string, unknown> = { ...rest };
    
    // 只有在有值時才加入 defaultValue
    if (defaultValue !== undefined) {
      serialized.defaultValue = defaultValue;
    }

    return serialized;
  }

  /**
   * 從 Firestore 反序列化
   */
  private deserializeFromFirestore(data: Record<string, unknown>): DynamicFieldConfig {
    // 型別驗證
    if (!this.isValidFieldConfigData(data)) {
      throw new Error('Invalid field configuration data from Firestore');
    }
    
    const config = data as unknown as DynamicFieldConfig;
    return {
      ...config,
      metadata: {
        ...config.metadata,
        createdAt: config.metadata?.createdAt || Timestamp.fromDate(new Date()),
        updatedAt: config.metadata?.updatedAt || Timestamp.fromDate(new Date()),
      },
    };
  }

  /**
   * 驗證欄位配置資料
   */
  private isValidFieldConfigData(data: unknown): data is Partial<DynamicFieldConfig> {
    if (typeof data !== 'object' || data === null) return false;
    
    const obj = data as Record<string, unknown>;
    
    // 檢查必要欄位
    return (
      typeof obj.id === 'string' &&
      typeof obj.fieldKey === 'string' &&
      typeof obj.displayName === 'string' &&
      typeof obj.dataType === 'string' &&
      typeof obj.isActive === 'boolean'
    );
  }

  /**
   * 建立批次
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 快取管理
   */
  private getFromCache(fieldId: string): DynamicFieldConfig | null {
    const cached = this.cache.get(fieldId);
    const expiry = this.cacheExpiry.get(fieldId);

    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    // 過期或不存在
    this.cache.delete(fieldId);
    this.cacheExpiry.delete(fieldId);
    return null;
  }

  private updateCache(fieldId: string, config: DynamicFieldConfig): void {
    this.cache.set(fieldId, config);
    this.cacheExpiry.set(fieldId, Date.now() + this.CACHE_TTL);

    // 限制快取大小
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value as string | undefined;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.cacheExpiry.delete(oldestKey);
      }
    }
  }

  private invalidateCache(fieldId: string): void {
    this.cache.delete(fieldId);
    this.cacheExpiry.delete(fieldId);
  }

  /**
   * 審計日誌
   */
  private async logFieldOperation(
    operation: 'create' | 'update' | 'delete',
    fieldId: string,
    userId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      const logEntry = {
        operation,
        fieldId,
        userId,
        timestamp: serverTimestamp(),
        details: details || {},
      };

      const db = getFirebaseDb();
      await setDoc(
        doc(collection(db, 'dynamicFieldAuditLogs')),
        logEntry
      );
    } catch (error) {
      console.error('審計日誌寫入失敗:', error);
      // 不拋出錯誤，避免影響主要操作
    }
  }

  /**
   * 錯誤處理
   */
  private handleServiceError(message: string, error: unknown): Error {
    if (error instanceof FirestoreError) {
      return new Error(`${message}: ${error.message} (${error.code})`);
    }
    if (error instanceof Error) {
      return new Error(`${message}: ${error.message}`);
    }
    return new Error(`${message}: 未知錯誤`);
  }

  /**
   * 清理快取（定期執行）
   */
  public clearExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cacheExpiry.forEach((expiry, key) => {
      if (now >= expiry) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    });
  }
}