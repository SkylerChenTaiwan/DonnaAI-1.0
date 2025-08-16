/**
 * 混合查詢引擎 - 支援靜態和動態欄位的統一查詢
 * 處理複雜的跨欄位類型查詢，並優化查詢效能
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  getDocs,
  QueryConstraint,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  WhereFilterOp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { DynamicFieldConfig, FieldDataType } from '@/types/dynamic-field-mapping';
import { DynamicFieldService } from './DynamicFieldService';
import { ShardingService } from './ShardingService';

/**
 * 查詢值類型
 */
type QueryValue = string | number | boolean | Timestamp | null | (string | number | boolean)[];

/**
 * 文檔基本類型
 */
interface DocumentBase {
  id: string;
  [key: string]: unknown;
}

/**
 * 動態欄位文檔類型
 */
interface DynamicFieldDocument extends DocumentBase {
  dynamicFields?: Record<string, QueryValue>;
}

/**
 * 查詢欄位定義
 */
interface QueryField {
  fieldKey: string;           // 欄位鍵
  operator: WhereFilterOp;    // 操作符
  value: QueryValue;          // 查詢值
  isStatic: boolean;          // 是否為靜態欄位
  dataType?: FieldDataType;   // 資料類型
}

/**
 * 排序欄位定義
 */
interface SortField {
  fieldKey: string;           // 欄位鍵
  direction: 'asc' | 'desc';  // 排序方向
  isStatic: boolean;          // 是否為靜態欄位
}

/**
 * 查詢選項
 */
interface QueryOptions {
  limit?: number;             // 限制返回數量
  offset?: number;            // 偏移量
  pageToken?: string;         // 分頁標記
  sorts?: SortField[];        // 排序欄位
  includeSharded?: boolean;   // 是否包含分片資料
  timeout?: number;           // 查詢超時（毫秒）
}

/**
 * 查詢結果
 */
interface QueryResult<T> {
  data: T[];                  // 查詢結果資料
  totalCount?: number;        // 總數（如果可計算）
  hasMore: boolean;           // 是否有更多資料
  nextPageToken?: string;     // 下一頁標記
  queryStats: QueryStats;     // 查詢統計
}

/**
 * 查詢統計
 */
interface QueryStats {
  executionTime: number;      // 執行時間（毫秒）
  documentsRead: number;      // 讀取的文檔數
  indexesUsed: string[];      // 使用的索引
  cacheHitRate: number;       // 快取命中率
  strategy: string;           // 使用的查詢策略
}

/**
 * 查詢計劃
 */
interface QueryPlan {
  strategy: 'static' | 'dynamic' | 'hybrid' | 'sharded';
  staticQueries: QueryConstraint[];
  dynamicQueries: QueryField[];
  sortStrategy: 'firestore' | 'memory';
  estimatedCost: number;
  estimatedTime: number;
}

/**
 * 混合查詢引擎類
 */
export class HybridQueryEngine {
  private fieldService: DynamicFieldService;
  private shardingService: ShardingService;
  private fieldConfigCache = new Map<string, DynamicFieldConfig[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 分鐘快取
  private readonly MAX_MEMORY_SORT = 1000; // 記憶體排序的最大記錄數

  constructor() {
    this.fieldService = new DynamicFieldService();
    this.shardingService = new ShardingService();
  }

  /**
   * 執行混合查詢
   */
  async executeQuery<T extends DynamicFieldDocument>(
    entityType: string,
    fields: QueryField[],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    // 驗證輸入參數
    if (!entityType || entityType.trim() === '') {
      throw new Error('實體類型不能為空');
    }
    
    if (!Array.isArray(fields)) {
      throw new Error('查詢欄位必須為陣列');
    }
    const startTime = Date.now();
    
    try {
      // 分析查詢並制定執行計劃
      const plan = await this.analyzeQuery(entityType, fields, options);
      
      // 根據策略執行查詢
      let result: QueryResult<T>;
      
      switch (plan.strategy) {
        case 'static':
          result = await this.executeStaticQuery<T>(entityType, plan, options);
          break;
        case 'dynamic':
          result = await this.executeDynamicQuery<T>(entityType, plan, options);
          break;
        case 'hybrid':
          result = await this.executeHybridQuery<T>(entityType, plan, options);
          break;
        case 'sharded':
          result = await this.executeShardedQuery<T>(entityType, plan, options);
          break;
        default:
          throw new Error(`不支援的查詢策略: ${plan.strategy}`);
      }
      
      // 更新查詢統計
      result.queryStats.executionTime = Date.now() - startTime;
      result.queryStats.strategy = plan.strategy;
      
      return result;
    } catch (error) {
      throw this.handleQueryError('查詢執行失敗', error);
    }
  }

  /**
   * 分析查詢並制定執行計劃
   */
  private async analyzeQuery(
    entityType: string,
    fields: QueryField[],
    options: QueryOptions
  ): Promise<QueryPlan> {
    // 取得動態欄位配置
    const dynamicFields = await this.getDynamicFields(entityType);
    const dynamicFieldKeys = new Set(dynamicFields.map(f => f.fieldKey));
    
    // 分類欄位
    const staticFields = fields.filter(f => !dynamicFieldKeys.has(f.fieldKey));
    const dynamicFieldQueries = fields.filter(f => dynamicFieldKeys.has(f.fieldKey));
    
    // 分析排序欄位
    const staticSorts = options.sorts?.filter(s => !dynamicFieldKeys.has(s.fieldKey)) || [];
    const dynamicSorts = options.sorts?.filter(s => dynamicFieldKeys.has(s.fieldKey)) || [];
    
    // 估算查詢成本
    let strategy: QueryPlan['strategy'];
    let estimatedCost = 0;
    let estimatedTime = 0;
    
    if (dynamicFieldQueries.length === 0 && dynamicSorts.length === 0) {
      // 純靜態查詢
      strategy = 'static';
      estimatedCost = staticFields.length * 10;
      estimatedTime = 100;
    } else if (staticFields.length === 0 && staticSorts.length === 0) {
      // 純動態查詢
      strategy = dynamicFields.some(f => f.metadata?.source === 'sharded') ? 'sharded' : 'dynamic';
      estimatedCost = dynamicFieldQueries.length * 50;
      estimatedTime = 500;
    } else {
      // 混合查詢
      strategy = 'hybrid';
      estimatedCost = staticFields.length * 10 + dynamicFieldQueries.length * 50;
      estimatedTime = 300;
    }
    
    // 決定排序策略
    const sortStrategy: 'firestore' | 'memory' = 
      dynamicSorts.length > 0 || estimatedCost > 1000 ? 'memory' : 'firestore';
    
    return {
      strategy,
      staticQueries: this.buildStaticConstraints(staticFields, staticSorts),
      dynamicQueries: dynamicFieldQueries,
      sortStrategy,
      estimatedCost,
      estimatedTime,
    };
  }

  /**
   * 執行純靜態查詢
   */
  private async executeStaticQuery<T>(
    entityType: string,
    plan: QueryPlan,
    options: QueryOptions
  ): Promise<QueryResult<T>> {
    const db = getFirebaseDb();
    const constraints = [...plan.staticQueries];
    
    // 加入分頁和限制
    if (options.limit) {
      constraints.push(limit(options.limit));
    }
    
    if (options.pageToken) {
      // 分頁處理（需要解析 pageToken）
      const pageDoc = await this.parsePageToken(options.pageToken);
      if (pageDoc) {
        constraints.push(startAfter(pageDoc));
      }
    }
    
    const q = query(collection(db, entityType), ...constraints);
    const snapshot = await getDocs(q);
    
    const data: T[] = [];
    snapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() } as T);
    });
    
    return {
      data,
      hasMore: data.length === (options.limit || Infinity),
      nextPageToken: data.length === options.limit ? 
        this.generatePageToken(snapshot.docs[snapshot.docs.length - 1]) : undefined,
      queryStats: {
        executionTime: 0, // 將在外層填入
        documentsRead: snapshot.size,
        indexesUsed: ['primary'], // 簡化處理
        cacheHitRate: 0,
        strategy: 'static',
      },
    };
  }

  /**
   * 執行純動態查詢
   */
  private async executeDynamicQuery<T>(
    entityType: string,
    plan: QueryPlan,
    options: QueryOptions
  ): Promise<QueryResult<T>> {
    const db = getFirebaseDb();
    
    // 先取得所有該類型的文檔
    const baseQuery = query(collection(db, entityType));
    const snapshot = await getDocs(baseQuery);
    
    const candidates: Array<T & { _doc: DocumentSnapshot }> = [];
    
    // 篩選符合動態欄位條件的文檔
    snapshot.forEach(doc => {
      const data = doc.data();
      const dynamicData = data.dynamicFields || {};
      
      // 檢查所有動態欄位條件
      const matches = plan.dynamicQueries.every(query => 
        this.evaluateDynamicCondition(dynamicData, query)
      );
      
      if (matches) {
        candidates.push({ 
          id: doc.id, 
          ...data, 
          _doc: doc 
        } as T & { _doc: DocumentSnapshot });
      }
    });
    
    // 記憶體排序
    if (options.sorts) {
      this.sortInMemory(candidates, options.sorts);
    }
    
    // 分頁處理
    const startIndex = options.offset || 0;
    const endIndex = options.limit ? startIndex + options.limit : candidates.length;
    const paginatedData = candidates.slice(startIndex, endIndex);
    
    // 移除內部欄位
    const cleanData = paginatedData.map(item => {
      const { _doc, ...cleanItem } = item;
      return cleanItem as T;
    });
    
    return {
      data: cleanData,
      hasMore: endIndex < candidates.length,
      nextPageToken: endIndex < candidates.length ? 
        this.generateOffsetToken(endIndex) : undefined,
      queryStats: {
        executionTime: 0,
        documentsRead: snapshot.size,
        indexesUsed: ['scan'],
        cacheHitRate: 0,
        strategy: 'dynamic',
      },
    };
  }

  /**
   * 執行混合查詢
   */
  private async executeHybridQuery<T>(
    entityType: string,
    plan: QueryPlan,
    options: QueryOptions
  ): Promise<QueryResult<T>> {
    const db = getFirebaseDb();
    
    // 先執行靜態查詢以縮小範圍
    const staticConstraints = plan.staticQueries;
    const baseQuery = query(collection(db, entityType), ...staticConstraints);
    const snapshot = await getDocs(baseQuery);
    
    const candidates: Array<T & { _doc: DocumentSnapshot }> = [];
    
    // 在靜態查詢結果中篩選動態欄位條件
    snapshot.forEach(doc => {
      const data = doc.data();
      const dynamicData = data.dynamicFields || {};
      
      // 檢查動態欄位條件
      const matches = plan.dynamicQueries.every(query => 
        this.evaluateDynamicCondition(dynamicData, query)
      );
      
      if (matches) {
        candidates.push({ 
          id: doc.id, 
          ...data, 
          _doc: doc 
        } as T & { _doc: DocumentSnapshot });
      }
    });
    
    // 記憶體排序（混合查詢通常需要記憶體排序）
    if (options.sorts) {
      this.sortInMemory(candidates, options.sorts);
    }
    
    // 分頁處理
    const startIndex = options.offset || 0;
    const endIndex = options.limit ? startIndex + options.limit : candidates.length;
    const paginatedData = candidates.slice(startIndex, endIndex);
    
    // 移除內部欄位
    const cleanData = paginatedData.map(item => {
      const { _doc, ...cleanItem } = item;
      return cleanItem as T;
    });
    
    return {
      data: cleanData,
      hasMore: endIndex < candidates.length,
      nextPageToken: endIndex < candidates.length ? 
        this.generateOffsetToken(endIndex) : undefined,
      queryStats: {
        executionTime: 0,
        documentsRead: snapshot.size,
        indexesUsed: ['hybrid'],
        cacheHitRate: 0,
        strategy: 'hybrid',
      },
    };
  }

  /**
   * 執行分片查詢
   */
  private async executeShardedQuery<T>(
    entityType: string,
    plan: QueryPlan,
    options: QueryOptions
  ): Promise<QueryResult<T>> {
    // 這個方法會在需要查詢大型分片資料時使用
    // 目前簡化實作，實際專案中可能需要更複雜的分片查詢邏輯
    
    throw new Error('分片查詢尚未實作');
  }

  /**
   * 建立靜態欄位查詢條件
   */
  private buildStaticConstraints(fields: QueryField[], sorts: SortField[]): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];
    
    // 加入篩選條件
    fields.forEach(field => {
      constraints.push(where(field.fieldKey, field.operator, field.value));
    });
    
    // 加入排序條件
    sorts.forEach(sort => {
      constraints.push(orderBy(sort.fieldKey, sort.direction));
    });
    
    return constraints;
  }

  /**
   * 驗證文檔資料
   */
  private validateDocumentData<T extends DynamicFieldDocument>(data: unknown): data is T {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    
    const obj = data as Record<string, unknown>;
    return typeof obj.id === 'string' || obj.id === undefined;
  }

  /**
   * 評估動態欄位條件
   */
  private evaluateDynamicCondition(
    dynamicData: Record<string, QueryValue>,
    query: QueryField
  ): boolean {
    const fieldValue = dynamicData[query.fieldKey];
    
    switch (query.operator) {
      case '==':
        return fieldValue === query.value;
      case '!=':
        return fieldValue !== query.value;
      case '<':
        return this.compareValues(fieldValue, query.value) < 0;
      case '<=':
        return this.compareValues(fieldValue, query.value) <= 0;
      case '>':
        return this.compareValues(fieldValue, query.value) > 0;
      case '>=':
        return this.compareValues(fieldValue, query.value) >= 0;
      case 'array-contains':
        return Array.isArray(fieldValue) && fieldValue.includes(query.value);
      case 'array-contains-any':
        return Array.isArray(fieldValue) && 
               Array.isArray(query.value) &&
               fieldValue.some(v => query.value.includes(v));
      case 'in':
        return Array.isArray(query.value) && query.value.includes(fieldValue);
      case 'not-in':
        return Array.isArray(query.value) && !query.value.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * 比較兩個值
   */
  private compareValues(a: QueryValue, b: QueryValue): number {
    // 處理 null/undefined
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    
    // 處理時間戳
    if (a instanceof Timestamp && b instanceof Timestamp) {
      return a.toMillis() - b.toMillis();
    }
    
    // 處理數字
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    
    // 處理字串
    const aStr = String(a);
    const bStr = String(b);
    return aStr.localeCompare(bStr);
  }

  /**
   * 記憶體排序
   */
  private sortInMemory<T extends DynamicFieldDocument>(
    data: T[],
    sorts: SortField[]
  ): void {
    data.sort((a, b) => {
      for (const sort of sorts) {
        const aValue = sort.isStatic ? a[sort.fieldKey] : a.dynamicFields?.[sort.fieldKey] ?? null;
        const bValue = sort.isStatic ? b[sort.fieldKey] : b.dynamicFields?.[sort.fieldKey] ?? null;
        
        const comparison = this.compareValues(aValue, bValue);
        
        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }

  /**
   * 取得動態欄位配置
   */
  private async getDynamicFields(entityType: string): Promise<DynamicFieldConfig[]> {
    // 檢查快取
    const cached = this.fieldConfigCache.get(entityType);
    const expiry = this.cacheExpiry.get(entityType);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    // 從服務取得配置
    const fields = await this.fieldService.searchFields({
      entityType,
      isActive: true,
    });
    
    // 更新快取
    this.fieldConfigCache.set(entityType, fields);
    this.cacheExpiry.set(entityType, Date.now() + this.CACHE_TTL);
    
    return fields;
  }

  /**
   * 產生分頁標記
   */
  private generatePageToken(doc: DocumentSnapshot): string {
    return Buffer.from(JSON.stringify({
      id: doc.id,
      path: doc.ref.path,
    })).toString('base64');
  }

  /**
   * 解析分頁標記
   */
  private async parsePageToken(pageToken: string): Promise<DocumentSnapshot | null> {
    try {
      const decoded = JSON.parse(Buffer.from(pageToken, 'base64').toString());
      const db = getFirebaseDb();
      
      // 這裡需要重新取得文檔參考，實際實作可能更複雜
      return null; // 簡化處理
    } catch {
      return null;
    }
  }

  /**
   * 產生偏移標記
   */
  private generateOffsetToken(offset: number): string {
    return Buffer.from(JSON.stringify({ offset })).toString('base64');
  }

  /**
   * 清理快取
   */
  clearCache(): void {
    this.fieldConfigCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * 取得查詢效能統計
   */
  async getQueryStats(entityType: string): Promise<{
    totalQueries: number;
    averageExecutionTime: number;
    cacheHitRate: number;
    mostUsedFields: Array<{ field: string; count: number }>;
  }> {
    // 實際專案中可能需要持久化這些統計資料
    return {
      totalQueries: 0,
      averageExecutionTime: 0,
      cacheHitRate: 0,
      mostUsedFields: [],
    };
  }

  /**
   * 錯誤處理
   */
  private handleQueryError(message: string, error: unknown): QueryError {
    if (error instanceof Error) {
      return new QueryError(`${message}: ${error.message}`, 'QUERY_EXECUTION_ERROR', error);
    }
    return new QueryError(`${message}: 未知錯誤`, 'UNKNOWN_ERROR');
  }
}

/**
 * 查詢錯誤類
 */
export class QueryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'QueryError';
  }
}