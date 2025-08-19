/**
 * PRP-124: AI 驅動分析查詢介面 - 查詢生成器
 * 
 * @description 動態查詢生成器，根據意圖和實體生成 Firestore 查詢，支援複雜的篩選、聚合和排序
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
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
  Timestamp,
  WhereFilterOp
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type {
  QueryIntent,
  ExtractedEntity,
  DatabaseQuery,
  QueryFilter,
  OrderBy,
  AggregationConfig,
  TimeRange,
  QueryResult,
  QueryData,
  ColumnDefinition,
  DataRow,
  AggregationResult,
  DataSummary,
  QueryMetadata,
  AIError
} from '@/docs/types/ai-query-data-models';

// ============================================================================
// 查詢生成配置和映射
// ============================================================================

/**
 * 集合映射配置
 */
interface CollectionMapping {
  name: string;
  fields: Record<string, {
    type: 'string' | 'number' | 'date' | 'boolean' | 'array';
    indexed: boolean;
    description: string;
  }>;
  relationships: Record<string, {
    collection: string;
    field: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  }>;
}

/**
 * 查詢最佳化規則
 */
interface OptimizationRule {
  condition: (query: DatabaseQuery) => boolean;
  optimization: (query: DatabaseQuery) => DatabaseQuery;
  description: string;
  priority: number;
}

/**
 * 查詢執行計劃
 */
interface ExecutionPlan {
  steps: ExecutionStep[];
  estimatedCost: number;
  parallelizable: boolean;
  cacheStrategy: 'aggressive' | 'normal' | 'disabled';
}

/**
 * 執行步驟
 */
interface ExecutionStep {
  id: string;
  type: 'query' | 'aggregate' | 'join' | 'transform';
  collection: string;
  operation: string;
  estimatedTime: number;
  dependencies: string[];
}

// ============================================================================
// 查詢生成器類別
// ============================================================================

/**
 * 查詢生成器
 * 負責將查詢意圖轉換為 Firestore 查詢並執行
 */
export class QueryGenerator {
  private readonly collectionMappings: Record<string, CollectionMapping>;
  private readonly optimizationRules: OptimizationRule[];
  private readonly metricCalculators: Record<string, (data: any[]) => number>;

  constructor() {
    this.collectionMappings = this.initializeCollectionMappings();
    this.optimizationRules = this.initializeOptimizationRules();
    this.metricCalculators = this.initializeMetricCalculators();
  }

  /**
   * 生成並執行查詢
   * @param intent 查詢意圖
   * @param userContext 使用者上下文
   * @returns 查詢結果
   */
  async generateAndExecuteQuery(
    intent: QueryIntent,
    userContext: {
      userId: string;
      organizationId: string;
      permissions: string[];
    }
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      // 1. 生成資料庫查詢
      const databaseQueries = this.generateDatabaseQueries(intent, userContext);
      
      // 2. 最佳化查詢
      const optimizedQueries = databaseQueries.map(q => this.optimizeQuery(q));
      
      // 3. 生成執行計劃
      const executionPlan = this.generateExecutionPlan(optimizedQueries);
      
      // 4. 執行查詢
      const queryData = await this.executeQueries(optimizedQueries, executionPlan);
      
      // 5. 後處理和聚合
      const processedData = this.postProcessData(queryData, intent);
      
      // 6. 生成元資料
      const metadata = this.generateMetadata(startTime, optimizedQueries, processedData);

      return {
        queryId: this.generateQueryId(),
        status: 'success',
        data: processedData,
        metadata,
      };
    } catch (error) {
      console.error('Query generation and execution failed:', error);
      
      throw new AIError(
        `查詢執行失敗: ${error instanceof Error ? error.message : String(error)}`,
        'QUERY_EXECUTION_ERROR',
        'data_access_error',
        true
      );
    }
  }

  /**
   * 驗證查詢權限
   * @param query 資料庫查詢
   * @param userContext 使用者上下文
   * @returns 是否有權限
   */
  validateQueryPermissions(
    query: DatabaseQuery,
    userContext: {
      userId: string;
      organizationId: string;
      permissions: string[];
    }
  ): {
    allowed: boolean;
    reason?: string;
    modifiedQuery?: DatabaseQuery;
  } {
    // 檢查集合存取權限
    const collectionPermission = `read:${query.collection}`;
    if (!userContext.permissions.includes(collectionPermission) && 
        !userContext.permissions.includes('admin')) {
      return {
        allowed: false,
        reason: `沒有權限存取 ${query.collection} 集合`,
      };
    }

    // 檢查組織隔離
    const modifiedQuery = this.addOrganizationFilter(query, userContext.organizationId);

    // 檢查列層級安全
    const secureQuery = this.addRowLevelSecurity(modifiedQuery, userContext);

    return {
      allowed: true,
      modifiedQuery: secureQuery,
    };
  }

  /**
   * 估算查詢成本
   * @param queries 查詢列表
   * @returns 成本估算
   */
  estimateQueryCost(queries: DatabaseQuery[]): {
    readOperations: number;
    estimatedLatency: number;
    cacheHitProbability: number;
  } {
    let totalReads = 0;
    let totalLatency = 0;
    let cacheScore = 0;

    queries.forEach(query => {
      // 估算讀取操作數
      const estimatedDocs = this.estimateDocumentCount(query);
      totalReads += estimatedDocs;

      // 估算延遲
      const queryComplexity = this.calculateQueryComplexity(query);
      totalLatency += queryComplexity * 50; // 基準 50ms per complexity point

      // 估算快取命中率
      const cacheability = this.calculateCacheability(query);
      cacheScore += cacheability;
    });

    return {
      readOperations: totalReads,
      estimatedLatency: totalLatency,
      cacheHitProbability: cacheScore / queries.length,
    };
  }

  // ============================================================================
  // 私有方法 - 查詢生成
  // ============================================================================

  /**
   * 生成資料庫查詢
   */
  private generateDatabaseQueries(
    intent: QueryIntent,
    userContext: {
      userId: string;
      organizationId: string;
      permissions: string[];
    }
  ): DatabaseQuery[] {
    const queries: DatabaseQuery[] = [];

    // 根據意圖類型生成查詢
    switch (intent.primary) {
      case 'query':
        queries.push(...this.generateBasicQuery(intent));
        break;
      
      case 'comparison':
        queries.push(...this.generateComparisonQuery(intent));
        break;
      
      case 'trend':
        queries.push(...this.generateTrendQuery(intent));
        break;
      
      case 'ranking':
        queries.push(...this.generateRankingQuery(intent));
        break;
      
      case 'aggregate':
        queries.push(...this.generateAggregateQuery(intent));
        break;
      
      case 'prediction':
        queries.push(...this.generatePredictionQuery(intent));
        break;
      
      default:
        queries.push(...this.generateFallbackQuery(intent));
    }

    // 應用權限和安全性
    return queries.map(query => {
      const validation = this.validateQueryPermissions(query, userContext);
      if (!validation.allowed) {
        throw new AIError(
          validation.reason || '查詢權限驗證失敗',
          'PERMISSION_ERROR',
          'permission_error',
          false
        );
      }
      return validation.modifiedQuery || query;
    });
  }

  /**
   * 生成基本查詢
   */
  private generateBasicQuery(intent: QueryIntent): DatabaseQuery[] {
    const metricEntities = intent.entities.filter(e => e.type === 'metric');
    const timeEntities = intent.entities.filter(e => e.type === 'time_period');
    const dimensionEntities = intent.entities.filter(e => e.type === 'dimension');

    const queries: DatabaseQuery[] = [];

    // 為每個指標生成查詢
    metricEntities.forEach(metric => {
      const collection = this.getCollectionForMetric(metric.normalizedValue as string);
      const filters = this.buildFilters(timeEntities, dimensionEntities);
      
      queries.push({
        type: 'firestore',
        collection,
        filters,
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit: 1000,
      });
    });

    // 如果沒有指標，使用預設查詢
    if (queries.length === 0) {
      queries.push({
        type: 'firestore',
        collection: 'orders',
        filters: this.buildFilters(timeEntities, dimensionEntities),
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit: 100,
      });
    }

    return queries;
  }

  /**
   * 生成比較查詢
   */
  private generateComparisonQuery(intent: QueryIntent): DatabaseQuery[] {
    const metricEntities = intent.entities.filter(e => e.type === 'metric');
    const timeEntities = intent.entities.filter(e => e.type === 'time_period');
    
    if (timeEntities.length < 2) {
      // 如果只有一個時間，生成當前期間 vs 前一期間的比較
      return this.generatePeriodComparisonQuery(metricEntities, timeEntities);
    }

    const queries: DatabaseQuery[] = [];

    // 為每個時間期間生成查詢
    timeEntities.forEach((timeEntity, index) => {
      const timeRange = timeEntity.normalizedValue as any;
      
      metricEntities.forEach(metric => {
        const collection = this.getCollectionForMetric(metric.normalizedValue as string);
        
        queries.push({
          type: 'firestore',
          collection,
          filters: [
            {
              field: 'createdAt',
              operator: '>=',
              value: timeRange.start,
            },
            {
              field: 'createdAt',
              operator: '<=',
              value: timeRange.end,
            },
          ],
          aggregations: [
            {
              type: 'sum',
              field: this.getFieldForMetric(metric.normalizedValue as string),
              alias: `${metric.normalizedValue}_period_${index}`,
            },
          ],
        });
      });
    });

    return queries;
  }

  /**
   * 生成趨勢查詢
   */
  private generateTrendQuery(intent: QueryIntent): DatabaseQuery[] {
    const metricEntities = intent.entities.filter(e => e.type === 'metric');
    const timeEntities = intent.entities.filter(e => e.type === 'time_period');
    
    const queries: DatabaseQuery[] = [];
    
    metricEntities.forEach(metric => {
      const collection = this.getCollectionForMetric(metric.normalizedValue as string);
      const timeRange = timeEntities[0]?.normalizedValue as any;
      
      queries.push({
        type: 'firestore',
        collection,
        filters: timeRange ? [
          {
            field: 'createdAt',
            operator: '>=',
            value: timeRange.start,
          },
          {
            field: 'createdAt',
            operator: '<=',
            value: timeRange.end,
          },
        ] : [],
        aggregations: [
          {
            type: 'sum',
            field: this.getFieldForMetric(metric.normalizedValue as string),
            groupBy: ['month'], // 按月分組
            alias: `${metric.normalizedValue}_trend`,
          },
        ],
        orderBy: [{ field: 'month', direction: 'asc' }],
      });
    });

    return queries;
  }

  /**
   * 生成排名查詢
   */
  private generateRankingQuery(intent: QueryIntent): DatabaseQuery[] {
    const metricEntities = intent.entities.filter(e => e.type === 'metric');
    const dimensionEntities = intent.entities.filter(e => e.type === 'dimension');
    const sortEntities = intent.entities.filter(e => e.type === 'sort_order');
    
    const queries: DatabaseQuery[] = [];
    
    metricEntities.forEach(metric => {
      const collection = this.getCollectionForMetric(metric.normalizedValue as string);
      const groupByField = dimensionEntities[0]?.normalizedValue as string || 'region';
      const sortDirection = this.determineSortDirection(sortEntities);
      
      queries.push({
        type: 'firestore',
        collection,
        filters: [],
        aggregations: [
          {
            type: 'sum',
            field: this.getFieldForMetric(metric.normalizedValue as string),
            groupBy: [groupByField],
            alias: `${metric.normalizedValue}_by_${groupByField}`,
          },
        ],
        orderBy: [{ 
          field: this.getFieldForMetric(metric.normalizedValue as string), 
          direction: sortDirection 
        }],
        limit: 20,
      });
    });

    return queries;
  }

  /**
   * 生成聚合查詢
   */
  private generateAggregateQuery(intent: QueryIntent): DatabaseQuery[] {
    const metricEntities = intent.entities.filter(e => e.type === 'metric');
    const aggregationEntities = intent.entities.filter(e => e.type === 'aggregation');
    const dimensionEntities = intent.entities.filter(e => e.type === 'dimension');
    
    const queries: DatabaseQuery[] = [];
    
    metricEntities.forEach(metric => {
      const collection = this.getCollectionForMetric(metric.normalizedValue as string);
      const aggregationType = aggregationEntities[0]?.normalizedValue as string || 'sum';
      const groupByField = dimensionEntities[0]?.normalizedValue as string;
      
      const aggregations: AggregationConfig[] = [
        {
          type: aggregationType as any,
          field: this.getFieldForMetric(metric.normalizedValue as string),
          alias: `${aggregationType}_${metric.normalizedValue}`,
          groupBy: groupByField ? [groupByField] : undefined,
        },
      ];

      queries.push({
        type: 'firestore',
        collection,
        filters: [],
        aggregations,
      });
    });

    return queries;
  }

  /**
   * 生成預測查詢
   */
  private generatePredictionQuery(intent: QueryIntent): DatabaseQuery[] {
    // 預測查詢需要歷史資料來建立趨勢
    const metricEntities = intent.entities.filter(e => e.type === 'metric');
    const queries: DatabaseQuery[] = [];
    
    metricEntities.forEach(metric => {
      const collection = this.getCollectionForMetric(metric.normalizedValue as string);
      
      // 獲取過去 12 個月的資料
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      queries.push({
        type: 'firestore',
        collection,
        filters: [
          {
            field: 'createdAt',
            operator: '>=',
            value: oneYearAgo,
          },
        ],
        aggregations: [
          {
            type: 'sum',
            field: this.getFieldForMetric(metric.normalizedValue as string),
            groupBy: ['month'],
            alias: `${metric.normalizedValue}_historical`,
          },
        ],
        orderBy: [{ field: 'month', direction: 'asc' }],
      });
    });

    return queries;
  }

  /**
   * 生成降級查詢
   */
  private generateFallbackQuery(intent: QueryIntent): DatabaseQuery[] {
    return [
      {
        type: 'firestore',
        collection: 'orders',
        filters: [],
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit: 50,
      },
    ];
  }

  // ============================================================================
  // 私有方法 - 查詢執行
  // ============================================================================

  /**
   * 執行查詢
   */
  private async executeQueries(
    queries: DatabaseQuery[],
    executionPlan: ExecutionPlan
  ): Promise<QueryData> {
    const results: DataRow[] = [];
    const columns: ColumnDefinition[] = [];
    const aggregations: AggregationResult[] = [];

    // 根據執行計劃執行查詢
    if (executionPlan.parallelizable) {
      // 並行執行
      const promises = queries.map(query => this.executeSingleQuery(query));
      const queryResults = await Promise.all(promises);
      
      queryResults.forEach((result, index) => {
        results.push(...result.rows);
        
        // 合併欄位定義（去重）
        result.columns.forEach(col => {
          if (!columns.find(c => c.name === col.name)) {
            columns.push(col);
          }
        });
        
        if (result.aggregations) {
          aggregations.push(...result.aggregations);
        }
      });
    } else {
      // 序列執行
      for (const query of queries) {
        const result = await this.executeSingleQuery(query);
        results.push(...result.rows);
        
        result.columns.forEach(col => {
          if (!columns.find(c => c.name === col.name)) {
            columns.push(col);
          }
        });
        
        if (result.aggregations) {
          aggregations.push(...result.aggregations);
        }
      }
    }

    // 生成資料摘要
    const summary: DataSummary = {
      totalRows: results.length,
      timeRange: this.extractTimeRange(results),
      keyMetrics: this.calculateKeyMetrics(results, aggregations),
      qualityScore: this.calculateDataQuality(results),
    };

    return {
      columns,
      rows: results,
      aggregations,
      summary,
      sources: queries.map(q => ({
        type: 'firestore',
        name: q.collection,
        lastUpdated: new Date(),
      })),
    };
  }

  /**
   * 執行單個查詢
   */
  private async executeSingleQuery(dbQuery: DatabaseQuery): Promise<{
    rows: DataRow[];
    columns: ColumnDefinition[];
    aggregations?: AggregationResult[];
  }> {
    try {
      // 建立 Firestore 查詢
      let firestoreQuery = collection(db, dbQuery.collection);
      let queryConstraints: QueryConstraint[] = [];

      // 加入篩選條件
      dbQuery.filters?.forEach(filter => {
        const operator = this.mapOperatorToFirestore(filter.operator);
        queryConstraints.push(where(filter.field, operator, filter.value));
      });

      // 加入排序
      dbQuery.orderBy?.forEach(order => {
        queryConstraints.push(orderBy(order.field, order.direction));
      });

      // 加入限制
      if (dbQuery.limit) {
        queryConstraints.push(limit(dbQuery.limit));
      }

      // 執行查詢
      const finalQuery = query(firestoreQuery, ...queryConstraints);
      const snapshot = await getDocs(finalQuery);
      
      // 處理結果
      const rows: DataRow[] = [];
      const fieldTypes = new Map<string, string>();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const row: DataRow = { id: doc.id, ...data };
        
        // 轉換 Timestamp
        Object.entries(row).forEach(([key, value]) => {
          if (value instanceof Timestamp) {
            row[key] = value.toDate();
            fieldTypes.set(key, 'date');
          } else {
            fieldTypes.set(key, typeof value);
          }
        });
        
        rows.push(row);
      });

      // 生成欄位定義
      const columns: ColumnDefinition[] = Array.from(fieldTypes.entries()).map(([name, type]) => ({
        name,
        type: type as any,
        description: this.getFieldDescription(dbQuery.collection, name),
        sortable: true,
        filterable: true,
      }));

      // 處理聚合
      let aggregations: AggregationResult[] | undefined;
      if (dbQuery.aggregations) {
        aggregations = this.processAggregations(rows, dbQuery.aggregations);
      }

      return { rows, columns, aggregations };
    } catch (error) {
      console.error('Single query execution failed:', error);
      throw new AIError(
        `Firestore 查詢執行失敗: ${error instanceof Error ? error.message : String(error)}`,
        'FIRESTORE_ERROR',
        'data_access_error',
        true
      );
    }
  }

  // ============================================================================
  // 私有方法 - 輔助函數
  // ============================================================================

  /**
   * 獲取指標對應的集合
   */
  private getCollectionForMetric(metric: string): string {
    const metricCollectionMap: Record<string, string> = {
      'revenue': 'orders',
      'sales': 'orders',
      'customer_count': 'customers',
      'order_count': 'orders',
      'retention_rate': 'customers',
      'conversion_rate': 'meetings',
      'satisfaction_rate': 'feedbacks',
    };

    return metricCollectionMap[metric] || 'orders';
  }

  /**
   * 獲取指標對應的欄位
   */
  private getFieldForMetric(metric: string): string {
    const metricFieldMap: Record<string, string> = {
      'revenue': 'amount',
      'sales': 'amount',
      'customer_count': 'id',
      'order_count': 'id',
      'retention_rate': 'lastActiveAt',
      'conversion_rate': 'status',
      'satisfaction_rate': 'rating',
    };

    return metricFieldMap[metric] || 'amount';
  }

  /**
   * 建立篩選條件
   */
  private buildFilters(
    timeEntities: ExtractedEntity[],
    dimensionEntities: ExtractedEntity[]
  ): QueryFilter[] {
    const filters: QueryFilter[] = [];

    // 時間篩選
    timeEntities.forEach(timeEntity => {
      const timeRange = timeEntity.normalizedValue as any;
      if (timeRange && timeRange.start && timeRange.end) {
        filters.push(
          {
            field: 'createdAt',
            operator: '>=',
            value: timeRange.start,
          },
          {
            field: 'createdAt',
            operator: '<=',
            value: timeRange.end,
          }
        );
      }
    });

    // 維度篩選
    dimensionEntities.forEach(dimension => {
      filters.push({
        field: dimension.normalizedValue as string,
        operator: '=',
        value: dimension.value,
      });
    });

    return filters;
  }

  /**
   * 映射運算子到 Firestore
   */
  private mapOperatorToFirestore(operator: string): WhereFilterOp {
    const operatorMap: Record<string, WhereFilterOp> = {
      '=': '==',
      '!=': '!=',
      '>': '>',
      '>=': '>=',
      '<': '<',
      '<=': '<=',
      'in': 'in',
      'not-in': 'not-in',
      'contains': 'array-contains',
    };

    return operatorMap[operator] || '==';
  }

  /**
   * 處理聚合
   */
  private processAggregations(
    data: DataRow[],
    aggregationConfigs: AggregationConfig[]
  ): AggregationResult[] {
    const results: AggregationResult[] = [];

    aggregationConfigs.forEach(config => {
      const calculator = this.metricCalculators[config.type];
      if (calculator) {
        const values = data.map(row => row[config.field]).filter(v => v != null);
        const result = calculator(values);
        
        results.push({
          type: config.type,
          field: config.field,
          value: result,
          groupBy: config.groupBy ? {} : undefined,
        });
      }
    });

    return results;
  }

  /**
   * 生成查詢 ID
   */
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成元資料
   */
  private generateMetadata(
    startTime: number,
    queries: DatabaseQuery[],
    data: QueryData
  ): QueryMetadata {
    return {
      executionTime: Date.now() - startTime,
      rowCount: data.rows.length,
      dataSources: queries.map(q => q.collection),
      lastUpdated: new Date(),
      traceId: this.generateQueryId(),
    };
  }

  // ============================================================================
  // 私有方法 - 初始化配置
  // ============================================================================

  /**
   * 初始化集合映射
   */
  private initializeCollectionMappings(): Record<string, CollectionMapping> {
    return {
      orders: {
        name: 'orders',
        fields: {
          id: { type: 'string', indexed: true, description: '訂單 ID' },
          amount: { type: 'number', indexed: true, description: '訂單金額' },
          customerId: { type: 'string', indexed: true, description: '客戶 ID' },
          status: { type: 'string', indexed: true, description: '訂單狀態' },
          createdAt: { type: 'date', indexed: true, description: '建立時間' },
          region: { type: 'string', indexed: true, description: '地區' },
        },
        relationships: {
          customer: { collection: 'customers', field: 'customerId', type: 'one-to-one' },
        },
      },
      customers: {
        name: 'customers',
        fields: {
          id: { type: 'string', indexed: true, description: '客戶 ID' },
          name: { type: 'string', indexed: false, description: '客戶姓名' },
          email: { type: 'string', indexed: true, description: '電子郵件' },
          region: { type: 'string', indexed: true, description: '地區' },
          createdAt: { type: 'date', indexed: true, description: '註冊時間' },
          lastActiveAt: { type: 'date', indexed: true, description: '最後活躍時間' },
        },
        relationships: {
          orders: { collection: 'orders', field: 'customerId', type: 'one-to-many' },
        },
      },
    };
  }

  /**
   * 初始化最佳化規則
   */
  private initializeOptimizationRules(): OptimizationRule[] {
    return [
      {
        condition: (query) => query.filters.length > 3,
        optimization: (query) => ({
          ...query,
          filters: query.filters.slice(0, 3), // 限制篩選條件數量
        }),
        description: '限制過多的篩選條件',
        priority: 1,
      },
      {
        condition: (query) => (query.limit || 0) > 1000,
        optimization: (query) => ({
          ...query,
          limit: 1000, // 限制查詢數量
        }),
        description: '限制查詢結果數量',
        priority: 2,
      },
    ];
  }

  /**
   * 初始化指標計算器
   */
  private initializeMetricCalculators(): Record<string, (data: any[]) => number> {
    return {
      sum: (data: number[]) => data.reduce((a, b) => a + b, 0),
      avg: (data: number[]) => data.reduce((a, b) => a + b, 0) / data.length,
      min: (data: number[]) => Math.min(...data),
      max: (data: number[]) => Math.max(...data),
      count: (data: any[]) => data.length,
      median: (data: number[]) => {
        const sorted = data.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      },
    };
  }

  /**
   * 最佳化查詢
   */
  private optimizeQuery(query: DatabaseQuery): DatabaseQuery {
    let optimized = { ...query };

    // 應用最佳化規則
    this.optimizationRules
      .sort((a, b) => a.priority - b.priority)
      .forEach(rule => {
        if (rule.condition(optimized)) {
          optimized = rule.optimization(optimized);
        }
      });

    return optimized;
  }

  /**
   * 生成執行計劃
   */
  private generateExecutionPlan(queries: DatabaseQuery[]): ExecutionPlan {
    return {
      steps: queries.map((query, index) => ({
        id: `step_${index}`,
        type: 'query',
        collection: query.collection,
        operation: 'read',
        estimatedTime: 100,
        dependencies: [],
      })),
      estimatedCost: queries.length * 100,
      parallelizable: true,
      cacheStrategy: 'normal',
    };
  }

  /**
   * 後處理資料
   */
  private postProcessData(data: QueryData, intent: QueryIntent): QueryData {
    // 這裡可以加入資料轉換、計算衍生指標等邏輯
    return data;
  }

  // 其他輔助方法的簡化實作...
  private generatePeriodComparisonQuery(metricEntities: ExtractedEntity[], timeEntities: ExtractedEntity[]): DatabaseQuery[] {
    return [];
  }

  private determineSortDirection(sortEntities: ExtractedEntity[]): 'asc' | 'desc' {
    return 'desc';
  }

  private addOrganizationFilter(query: DatabaseQuery, organizationId: string): DatabaseQuery {
    return {
      ...query,
      filters: [
        ...query.filters,
        { field: 'organizationId', operator: '=', value: organizationId },
      ],
    };
  }

  private addRowLevelSecurity(query: DatabaseQuery, userContext: any): DatabaseQuery {
    return query;
  }

  private estimateDocumentCount(query: DatabaseQuery): number {
    return 100;
  }

  private calculateQueryComplexity(query: DatabaseQuery): number {
    return query.filters.length + (query.orderBy?.length || 0);
  }

  private calculateCacheability(query: DatabaseQuery): number {
    return 0.7;
  }

  private extractTimeRange(results: DataRow[]): { start: Date; end: Date } | undefined {
    if (results.length === 0) return undefined;
    
    const dates = results
      .map(r => r.createdAt)
      .filter(d => d instanceof Date)
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (dates.length === 0) return undefined;
    
    return {
      start: dates[0],
      end: dates[dates.length - 1],
    };
  }

  private calculateKeyMetrics(results: DataRow[], aggregations: AggregationResult[]): Record<string, number | string> {
    return {
      totalRecords: results.length,
    };
  }

  private calculateDataQuality(results: DataRow[]): number {
    return 0.95;
  }

  private getFieldDescription(collection: string, field: string): string {
    return this.collectionMappings[collection]?.fields[field]?.description || '';
  }
}

// ============================================================================
// 匯出
// ============================================================================

/**
 * 查詢生成器單例實例
 */
export const queryGenerator = new QueryGenerator();

/**
 * 預設匯出
 */
export default queryGenerator;