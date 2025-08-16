/**
 * 分片服務 - 處理 Firestore 1MB 文檔限制
 * 自動將大型資料分割成多個分片文檔
 */

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
  Timestamp,
  writeBatch,
  DocumentReference,
  WriteBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';

/**
 * 分片配置
 */
interface ShardConfig {
  maxShardSize: number;         // 每個分片的最大大小（bytes）
  compressionEnabled: boolean;  // 是否啟用壓縮
  estimationBuffer: number;     // 估算緩衝區（0.1 = 10%）
}

/**
 * 分片元資料
 */
interface ShardMetadata {
  id: string;                   // 分片組 ID
  totalShards: number;          // 總分片數
  totalSize: number;            // 總大小（bytes）
  createdAt: Timestamp;         // 建立時間
  updatedAt: Timestamp;         // 更新時間
  entityType: string;           // 實體類型
  entityId: string;             // 實體 ID
  version: number;              // 版本號
  checksum?: string;            // 校驗和
}

/**
 * 單個分片
 */
interface Shard {
  shardId: string;              // 分片 ID
  parentId: string;             // 父文檔 ID
  shardIndex: number;           // 分片索引（0-based）
  data: Record<string, unknown>; // 分片資料
  size: number;                 // 分片大小（bytes）
  checksum?: string;            // 分片校驗和
}

/**
 * 分片讀取結果
 */
interface ShardReadResult<T> {
  data: T;                      // 合併後的資料
  metadata: ShardMetadata;      // 元資料
  shards: number;               // 分片數量
}

/**
 * 分片寫入結果
 */
interface ShardWriteResult {
  success: boolean;
  shardCount: number;
  totalSize: number;
  shardIds: string[];
  error?: string;
}

/**
 * 分片服務類
 */
export class ShardingService {
  private readonly METADATA_COLLECTION = 'shardMetadata';
  private readonly SHARDS_COLLECTION = 'shards';
  
  // Firestore 限制：1MB = 1,048,576 bytes
  // 保留 50KB 作為元資料和結構開銷
  private readonly MAX_DOCUMENT_SIZE = 1048576 - 51200; // ~998KB
  
  private defaultConfig: ShardConfig = {
    maxShardSize: this.MAX_DOCUMENT_SIZE,
    compressionEnabled: false,
    estimationBuffer: 0.1, // 10% 緩衝
  };

  constructor(config?: Partial<ShardConfig>) {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * 寫入分片資料
   */
  async writeShardedData<T extends Record<string, unknown>>(
    entityType: string,
    entityId: string,
    data: T,
    options?: {
      compress?: boolean;
      version?: number;
    }
  ): Promise<ShardWriteResult> {
    try {
      // 估算資料大小
      const serialized = JSON.stringify(data);
      const totalSize = this.estimateSize(serialized);
      
      // 如果資料小於限制，直接寫入單個文檔
      if (totalSize < this.defaultConfig.maxShardSize) {
        return await this.writeSingleShard(entityType, entityId, data, totalSize);
      }
      
      // 需要分片
      const shards = this.createShards(data, this.defaultConfig.maxShardSize);
      return await this.writeMultipleShards(entityType, entityId, shards, options?.version);
    } catch (error) {
      return {
        success: false,
        shardCount: 0,
        totalSize: 0,
        shardIds: [],
        error: error instanceof Error ? error.message : '未知錯誤',
      };
    }
  }

  /**
   * 讀取分片資料
   */
  async readShardedData<T extends Record<string, unknown>>(
    entityType: string,
    entityId: string
  ): Promise<ShardReadResult<T> | null> {
    try {
      // 讀取元資料
      const metadataId = this.generateMetadataId(entityType, entityId);
      const db = getFirebaseDb();
      const metadataDoc = await getDoc(doc(db, this.METADATA_COLLECTION, metadataId));
      
      if (!metadataDoc.exists()) {
        return null;
      }
      
      const metadata = metadataDoc.data() as ShardMetadata;
      
      // 如果只有一個分片，直接讀取
      if (metadata.totalShards === 1) {
        const shardDoc = await getDoc(
          doc(db, this.SHARDS_COLLECTION, `${metadataId}_0`)
        );
        
        if (!shardDoc.exists()) {
          throw new Error('分片資料不存在');
        }
        
        const shard = shardDoc.data() as Shard;
        return {
          data: shard.data as T,
          metadata,
          shards: 1,
        };
      }
      
      // 讀取所有分片
      const shards = await this.readAllShards(metadataId, metadata.totalShards);
      const mergedData = this.mergeShards<T>(shards);
      
      return {
        data: mergedData,
        metadata,
        shards: metadata.totalShards,
      };
    } catch (error) {
      console.error('讀取分片資料失敗:', error);
      return null;
    }
  }

  /**
   * 更新分片資料
   */
  async updateShardedData<T extends Record<string, unknown>>(
    entityType: string,
    entityId: string,
    updates: Partial<T>,
    options?: {
      merge?: boolean;
      version?: number;
    }
  ): Promise<ShardWriteResult> {
    try {
      // 讀取現有資料
      const existing = await this.readShardedData<T>(entityType, entityId);
      
      if (!existing) {
        // 如果不存在，建立新的
        return await this.writeShardedData(entityType, entityId, updates as T, options);
      }
      
      // 合併更新
      const updated = options?.merge 
        ? { ...existing.data, ...updates }
        : updates as T;
      
      // 版本控制
      const newVersion = options?.version ?? (existing.metadata.version + 1);
      
      // 刪除舊分片
      await this.deleteShards(entityType, entityId);
      
      // 寫入新分片
      return await this.writeShardedData(entityType, entityId, updated, {
        ...options,
        version: newVersion,
      });
    } catch (error) {
      return {
        success: false,
        shardCount: 0,
        totalSize: 0,
        shardIds: [],
        error: error instanceof Error ? error.message : '未知錯誤',
      };
    }
  }

  /**
   * 刪除分片資料
   */
  async deleteShards(entityType: string, entityId: string): Promise<boolean> {
    try {
      const metadataId = this.generateMetadataId(entityType, entityId);
      
      // 讀取元資料
      const db = getFirebaseDb();
      const metadataDoc = await getDoc(doc(db, this.METADATA_COLLECTION, metadataId));
      
      if (!metadataDoc.exists()) {
        return false;
      }
      
      const metadata = metadataDoc.data() as ShardMetadata;
      
      // 使用批次刪除
      const batch = writeBatch(db);
      
      // 刪除所有分片
      for (let i = 0; i < metadata.totalShards; i++) {
        const shardRef = doc(db, this.SHARDS_COLLECTION, `${metadataId}_${i}`);
        batch.delete(shardRef);
      }
      
      // 刪除元資料
      batch.delete(doc(db, this.METADATA_COLLECTION, metadataId));
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('刪除分片失敗:', error);
      return false;
    }
  }

  /**
   * 建立分片
   */
  private createShards(
    data: Record<string, unknown>,
    maxSize: number
  ): Array<Record<string, unknown>> {
    const shards: Array<Record<string, unknown>> = [];
    
    // 如果是陣列，按元素分片
    if (Array.isArray(data)) {
      return this.shardArray(data, maxSize);
    }
    
    // 如果是物件，按鍵值對分片
    return this.shardObject(data, maxSize);
  }

  /**
   * 分片陣列
   */
  private shardArray(arr: unknown[], maxSize: number): Array<Record<string, unknown>> {
    const shards: Array<Record<string, unknown>> = [];
    let currentShard: unknown[] = [];
    let currentSize = 2; // [] 的大小
    
    for (const item of arr) {
      const itemSize = this.estimateSize(JSON.stringify(item));
      
      // 如果單個項目超過限制，需要進一步分割
      if (itemSize > maxSize) {
        // 保存當前分片
        if (currentShard.length > 0) {
          shards.push({ items: currentShard, type: 'array_shard' });
          currentShard = [];
          currentSize = 2;
        }
        
        // 處理超大項目（遞迴分片）
        if (typeof item === 'object' && item !== null) {
          const subShards = this.createShards(item as Record<string, unknown>, maxSize);
          subShards.forEach(subShard => {
            shards.push({ item: subShard, type: 'array_item_shard' });
          });
        } else {
          // 如果是基本類型但仍超過限制，拋出錯誤
          throw new Error('單個項目超過最大分片大小限制');
        }
        continue;
      }
      
      // 檢查是否需要新分片
      if (currentSize + itemSize + 1 > maxSize) { // +1 for comma
        shards.push({ items: currentShard, type: 'array_shard' });
        currentShard = [];
        currentSize = 2;
      }
      
      currentShard.push(item);
      currentSize += itemSize + 1;
    }
    
    // 保存最後的分片
    if (currentShard.length > 0) {
      shards.push({ items: currentShard, type: 'array_shard' });
    }
    
    return shards;
  }

  /**
   * 分片物件
   */
  private shardObject(
    obj: Record<string, unknown>,
    maxSize: number
  ): Array<Record<string, unknown>> {
    const shards: Array<Record<string, unknown>> = [];
    let currentShard: Record<string, unknown> = {};
    let currentSize = 2; // {} 的大小
    
    for (const [key, value] of Object.entries(obj)) {
      const keySize = key.length + 4; // "key": 的大小
      const valueSize = this.estimateSize(JSON.stringify(value));
      const entrySize = keySize + valueSize;
      
      // 如果單個鍵值對超過限制
      if (entrySize > maxSize) {
        // 保存當前分片
        if (Object.keys(currentShard).length > 0) {
          shards.push({ ...currentShard, _type: 'object_shard' });
          currentShard = {};
          currentSize = 2;
        }
        
        // 處理超大值（遞迴分片）
        if (typeof value === 'object' && value !== null) {
          const subShards = this.createShards(value as Record<string, unknown>, maxSize);
          shards.push({
            _key: key,
            _value: subShards,
            _type: 'nested_shard',
          });
        } else {
          // 基本類型但超過限制，嘗試截斷
          if (typeof value === 'string') {
            const chunks = this.chunkString(value, maxSize - keySize - 100);
            chunks.forEach((chunk, index) => {
              shards.push({
                [`${key}_part_${index}`]: chunk,
                _type: 'string_shard',
              });
            });
          } else {
            throw new Error(`鍵 "${key}" 的值超過最大分片大小限制`);
          }
        }
        continue;
      }
      
      // 檢查是否需要新分片
      if (currentSize + entrySize + 1 > maxSize) { // +1 for comma
        shards.push({ ...currentShard, _type: 'object_shard' });
        currentShard = {};
        currentSize = 2;
      }
      
      currentShard[key] = value;
      currentSize += entrySize + 1;
    }
    
    // 保存最後的分片
    if (Object.keys(currentShard).length > 0) {
      shards.push({ ...currentShard, _type: 'object_shard' });
    }
    
    return shards;
  }

  /**
   * 分割字串
   */
  private chunkString(str: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += chunkSize) {
      chunks.push(str.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 合併分片
   */
  private mergeShards<T>(shards: Shard[]): T {
    // 按索引排序
    shards.sort((a, b) => a.shardIndex - b.shardIndex);
    
    // 檢查第一個分片的類型
    const firstShard = shards[0].data;
    const shardType = firstShard._type as string;
    
    if (shardType === 'array_shard' || shardType === 'array_item_shard') {
      return this.mergeArrayShards(shards) as T;
    }
    
    return this.mergeObjectShards(shards) as T;
  }

  /**
   * 合併陣列分片
   */
  private mergeArrayShards(shards: Shard[]): unknown[] {
    const result: unknown[] = [];
    
    for (const shard of shards) {
      const data = shard.data;
      
      if (data._type === 'array_shard' && Array.isArray(data.items)) {
        result.push(...data.items);
      } else if (data._type === 'array_item_shard') {
        result.push(data.item);
      }
    }
    
    return result;
  }

  /**
   * 合併物件分片
   */
  private mergeObjectShards(shards: Shard[]): Record<string, unknown> {
    let result: Record<string, unknown> = {};
    
    for (const shard of shards) {
      const data = shard.data;
      const { _type, ...rest } = data;
      
      if (_type === 'object_shard') {
        result = { ...result, ...rest };
      } else if (_type === 'nested_shard') {
        const key = data._key as string;
        const value = data._value;
        
        // 遞迴合併嵌套分片
        if (Array.isArray(value)) {
          const nestedShards = value.map((v, i) => ({
            shardId: '',
            parentId: '',
            shardIndex: i,
            data: v as Record<string, unknown>,
            size: 0,
          }));
          result[key] = this.mergeShards(nestedShards);
        } else {
          result[key] = value;
        }
      } else if (_type === 'string_shard') {
        // 合併字串分片
        for (const [key, value] of Object.entries(rest)) {
          const match = key.match(/^(.+)_part_(\d+)$/);
          if (match) {
            const baseKey = match[1];
            const currentValue = result[baseKey] ? String(result[baseKey]) : '';
            result[baseKey] = currentValue + String(value);
          }
        }
      }
    }
    
    return result;
  }

  /**
   * 寫入單個分片
   */
  private async writeSingleShard(
    entityType: string,
    entityId: string,
    data: Record<string, unknown>,
    size: number
  ): Promise<ShardWriteResult> {
    const metadataId = this.generateMetadataId(entityType, entityId);
    const shardId = `${metadataId}_0`;
    
    const db = getFirebaseDb();
    const batch = writeBatch(db);
    
    // 寫入元資料
    const metadata: ShardMetadata = {
      id: metadataId,
      totalShards: 1,
      totalSize: size,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      entityType,
      entityId,
      version: 1,
      checksum: this.generateChecksum(JSON.stringify(data)),
    };
    
    batch.set(doc(db, this.METADATA_COLLECTION, metadataId), metadata);
    
    // 寫入分片
    const shard: Shard = {
      shardId,
      parentId: metadataId,
      shardIndex: 0,
      data,
      size,
      checksum: metadata.checksum,
    };
    
    batch.set(doc(db, this.SHARDS_COLLECTION, shardId), shard);
    
    await batch.commit();
    
    return {
      success: true,
      shardCount: 1,
      totalSize: size,
      shardIds: [shardId],
    };
  }

  /**
   * 寫入多個分片
   */
  private async writeMultipleShards(
    entityType: string,
    entityId: string,
    shards: Array<Record<string, unknown>>,
    version?: number
  ): Promise<ShardWriteResult> {
    const metadataId = this.generateMetadataId(entityType, entityId);
    const shardIds: string[] = [];
    let totalSize = 0;
    
    const db = getFirebaseDb();
    const batch = writeBatch(db);
    
    // 寫入每個分片
    for (let i = 0; i < shards.length; i++) {
      const shardId = `${metadataId}_${i}`;
      const shardData = shards[i];
      const shardSize = this.estimateSize(JSON.stringify(shardData));
      
      const shard: Shard = {
        shardId,
        parentId: metadataId,
        shardIndex: i,
        data: shardData,
        size: shardSize,
        checksum: this.generateChecksum(JSON.stringify(shardData)),
      };
      
      batch.set(doc(db, this.SHARDS_COLLECTION, shardId), shard);
      shardIds.push(shardId);
      totalSize += shardSize;
    }
    
    // 寫入元資料
    const metadata: ShardMetadata = {
      id: metadataId,
      totalShards: shards.length,
      totalSize,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      entityType,
      entityId,
      version: version ?? 1,
      checksum: this.generateChecksum(JSON.stringify(shards)),
    };
    
    batch.set(doc(db, this.METADATA_COLLECTION, metadataId), metadata);
    
    await batch.commit();
    
    return {
      success: true,
      shardCount: shards.length,
      totalSize,
      shardIds,
    };
  }

  /**
   * 讀取所有分片
   */
  private async readAllShards(parentId: string, totalShards: number): Promise<Shard[]> {
    const shards: Shard[] = [];
    const db = getFirebaseDb();
    
    // 批次讀取以提高效能
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < totalShards; i++) {
      const shardId = `${parentId}_${i}`;
      promises.push(
        getDoc(doc(db, this.SHARDS_COLLECTION, shardId)).then(docSnap => {
          if (docSnap.exists()) {
            shards.push(docSnap.data() as Shard);
          }
        })
      );
    }
    
    await Promise.all(promises);
    
    if (shards.length !== totalShards) {
      throw new Error(`預期 ${totalShards} 個分片，但只找到 ${shards.length} 個`);
    }
    
    return shards;
  }

  /**
   * 估算資料大小
   */
  private estimateSize(serialized: string): number {
    // UTF-8 編碼估算
    let size = 0;
    for (let i = 0; i < serialized.length; i++) {
      const code = serialized.charCodeAt(i);
      if (code < 0x80) size += 1;
      else if (code < 0x800) size += 2;
      else if (code < 0xd800 || code >= 0xe000) size += 3;
      else size += 4;
    }
    
    // 加上緩衝區
    return Math.ceil(size * (1 + this.defaultConfig.estimationBuffer));
  }

  /**
   * 產生元資料 ID
   */
  private generateMetadataId(entityType: string, entityId: string): string {
    return `${entityType}_${entityId}`;
  }

  /**
   * 產生校驗和
   */
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = Math.imul(31, hash) + char;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 取得分片統計
   */
  async getShardStatistics(entityType?: string): Promise<{
    totalEntities: number;
    totalShards: number;
    averageShardsPerEntity: number;
    totalStorageSize: number;
    largestEntity: { id: string; shards: number; size: number } | null;
  }> {
    try {
      const constraints = entityType 
        ? [where('entityType', '==', entityType)]
        : [];
      
      const db = getFirebaseDb();
      const q = query(collection(db, this.METADATA_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      let totalShards = 0;
      let totalSize = 0;
      let largestEntity: { id: string; shards: number; size: number } | null = null;
      
      snapshot.forEach(doc => {
        const metadata = doc.data() as ShardMetadata;
        totalShards += metadata.totalShards;
        totalSize += metadata.totalSize;
        
        if (!largestEntity || metadata.totalSize > largestEntity.size) {
          largestEntity = {
            id: metadata.id,
            shards: metadata.totalShards,
            size: metadata.totalSize,
          };
        }
      });
      
      const totalEntities = snapshot.size;
      
      return {
        totalEntities,
        totalShards,
        averageShardsPerEntity: totalEntities > 0 ? totalShards / totalEntities : 0,
        totalStorageSize: totalSize,
        largestEntity,
      };
    } catch (error) {
      console.error('取得分片統計失敗:', error);
      return {
        totalEntities: 0,
        totalShards: 0,
        averageShardsPerEntity: 0,
        totalStorageSize: 0,
        largestEntity: null,
      };
    }
  }
}