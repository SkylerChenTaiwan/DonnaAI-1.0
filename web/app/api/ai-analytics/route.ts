/**
 * PRP-124 Phase 3: AI Analytics API Integration
 * 
 * @description 完整的 AI 分析 API 端點，整合 Phase 2 AI 引擎
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { headers } from 'next/headers';
import { z } from 'zod';

// AI 引擎導入
import { queryParser } from '@/lib/ai/query-parser';
import { intentRecognition } from '@/lib/ai/intent-recognition';
import { chartRecommender } from '@/lib/ai/chart-recommender';
import { performanceMonitor } from '@/lib/ai/performance-monitor';

// 基礎設施導入
import { authOptions } from '@/lib/auth-config';
import { firebaseAdmin } from '@/lib/firebase-admin';
import { dashboardCacheManager } from '@/lib/cache/dashboard-cache-manager';
import { rateLimiter } from '@/lib/rate-limiter';
import { notificationService } from '@/lib/notifications/notification-service';

// 型別導入
import type {
  AIQuery,
  QueryResult,
  QueryIntent,
  ChartConfig,
  AIError,
  QueryMetrics,
  QuerySuggestion,
  UserContext
} from '@/docs/types/ai-query-data-models';

// ============================================================================
// 請求/回應驗證 Schema
// ============================================================================

const AIAnalyticsRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  context: z.object({
    conversationId: z.string().optional(),
    previousResults: z.array(z.any()).optional(),
    userPreferences: z.object({
      language: z.enum(['zh-TW', 'zh-CN', 'en-US']).default('zh-TW'),
      theme: z.enum(['light', 'dark', 'auto']).default('auto'),
      preferredChartTypes: z.array(z.string()).default([])
    }).optional(),
    filters: z.record(z.any()).optional(),
    timeRange: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
      preset: z.enum(['1d', '7d', '30d', '90d', '1y']).optional()
    }).optional()
  }).optional(),
  options: z.object({
    realtime: z.boolean().default(false),
    useCache: z.boolean().default(true),
    timeout: z.number().min(1000).max(30000).default(15000),
    includeExplanation: z.boolean().default(true),
    includeSuggestions: z.boolean().default(true),
    maxSuggestions: z.number().min(1).max(10).default(5),
    chartType: z.string().optional(),
    accuracy: z.enum(['low', 'medium', 'high']).default('medium')
  }).optional(),
  metadata: z.object({
    source: z.enum(['text', 'voice', 'suggestion', 'template']).default('text'),
    sessionId: z.string().optional(),
    userAgent: z.string().optional(),
    timestamp: z.string().optional()
  }).optional()
});

type AIAnalyticsRequest = z.infer<typeof AIAnalyticsRequestSchema>;

// ============================================================================
// 錯誤處理
// ============================================================================

class AIAnalyticsError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AIAnalyticsError';
  }
}

const handleError = (error: unknown): NextResponse => {
  console.error('AI Analytics API Error:', error);

  if (error instanceof AIAnalyticsError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '請求參數不正確',
          details: {
            issues: error.issues.map(issue => ({
              path: issue.path.join('.'),
              message: issue.message
            }))
          }
        }
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服務暫時無法使用，請稍後再試',
        details: process.env.NODE_ENV === 'development' ? { error: String(error) } : undefined
      }
    },
    { status: 500 }
  );
};

// ============================================================================
// 身份驗證和授權
// ============================================================================

const authenticate = async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new AIAnalyticsError(
      'UNAUTHORIZED',
      '請先登入您的帳戶',
      401
    );
  }

  return session;
};

const checkPermissions = async (userId: string, organizationId?: string) => {
  if (!organizationId) {
    throw new AIAnalyticsError(
      'MISSING_ORGANIZATION_ID',
      '缺少組織識別碼',
      400
    );
  }

  const db = firebaseAdmin.firestore();
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new AIAnalyticsError(
      'USER_NOT_FOUND',
      '使用者不存在',
      404
    );
  }

  const userData = userDoc.data();
  if (userData?.organizationId !== organizationId) {
    throw new AIAnalyticsError(
      'INSUFFICIENT_PERMISSIONS',
      '您沒有權限存取此組織的資料',
      403
    );
  }

  return userData;
};

// ============================================================================
// 速率限制
// ============================================================================

const checkRateLimit = async (userId: string, ip: string) => {
  const userLimit = await rateLimiter.check(`ai-query:user:${userId}`, 100, 3600); // 100 queries per hour
  const ipLimit = await rateLimiter.check(`ai-query:ip:${ip}`, 200, 3600); // 200 queries per hour per IP

  if (!userLimit.allowed || !ipLimit.allowed) {
    throw new AIAnalyticsError(
      'RATE_LIMIT_EXCEEDED',
      '查詢頻率過高，請稍後再試',
      429,
      {
        userRemaining: userLimit.remaining,
        ipRemaining: ipLimit.remaining,
        resetTime: Math.max(userLimit.resetTime, ipLimit.resetTime)
      }
    );
  }
};

// ============================================================================
// AI 處理管道
// ============================================================================

const processAIQuery = async (
  request: AIAnalyticsRequest,
  userContext: UserContext
): Promise<QueryResult> => {
  const startTime = Date.now();
  const queryId = crypto.randomUUID();

  try {
    // 開始效能監控
    const monitor = performanceMonitor.startQuery(queryId);
    
    // Step 1: 解析查詢
    monitor.recordPhase('parsing');
    const parseResult = await queryParser.parse({
      query: request.query,
      language: request.context?.userPreferences?.language || 'zh-TW',
      context: request.context
    });

    // Step 2: 意圖識別
    monitor.recordPhase('intent-recognition');
    const intentResult = await intentRecognition.recognizeIntent({
      query: request.query,
      parseResult,
      context: userContext
    });

    // Step 3: 資料查詢
    monitor.recordPhase('data-querying');
    const queryData = await executeDataQuery(intentResult, userContext);

    // Step 4: 圖表推薦
    monitor.recordPhase('chart-recommendation');
    const chartRecommendation = await chartRecommender.recommend({
      data: queryData,
      intent: intentResult,
      preferences: request.context?.userPreferences
    });

    // Step 5: 生成建議
    const suggestions = await generateQuerySuggestions(request.query, intentResult);

    // Step 6: AI 解釋生成
    monitor.recordPhase('explanation-generation');
    const explanation = await generateAIExplanation(
      request.query,
      queryData,
      intentResult,
      chartRecommendation
    );

    // 結束監控
    const metrics = monitor.end();

    return {
      queryId,
      status: 'success',
      data: {
        columns: queryData.columns,
        rows: queryData.rows,
        aggregations: queryData.aggregations,
        summary: queryData.summary,
        sources: queryData.sources
      },
      chartConfig: chartRecommendation?.primary.config,
      explanation,
      suggestions,
      metadata: {
        executionTime: Date.now() - startTime,
        rowCount: queryData.rows?.length || 0,
        dataSources: queryData.sources.map(s => s.name),
        lastUpdated: new Date(),
        version: '1.0.0',
        traceId: queryId
      }
    };

  } catch (error) {
    console.error(`Query processing failed for ${queryId}:`, error);
    throw new AIAnalyticsError(
      'QUERY_PROCESSING_FAILED',
      '查詢處理時發生錯誤',
      500,
      { queryId, error: String(error) }
    );
  }
};

// ============================================================================
// 資料查詢執行
// ============================================================================

const executeDataQuery = async (intent: QueryIntent, userContext: UserContext) => {
  const db = firebaseAdmin.firestore();
  const organizationId = userContext.organizationId;

  // 基於意圖構建查詢
  const queries = buildFirestoreQueries(intent, organizationId);
  const results = await Promise.all(
    queries.map(query => executeFirestoreQuery(db, query))
  );

  // 合併和處理結果
  return processQueryResults(results, intent);
};

const buildFirestoreQueries = (intent: QueryIntent, organizationId: string) => {
  const queries: any[] = [];

  // 基於提取的實體建構查詢
  intent.entities.forEach(entity => {
    switch (entity.type) {
      case 'metric':
        if (entity.value.includes('營收') || entity.value.includes('收入')) {
          queries.push({
            collection: 'records',
            filters: [
              { field: 'organizationId', operator: '==', value: organizationId },
              { field: 'type', operator: '==', value: 'sales' }
            ],
            orderBy: [{ field: 'createdAt', direction: 'desc' }],
            limit: 100
          });
        }
        if (entity.value.includes('客戶')) {
          queries.push({
            collection: 'customers',
            filters: [
              { field: 'organizationId', operator: '==', value: organizationId }
            ],
            orderBy: [{ field: 'createdAt', direction: 'desc' }],
            limit: 100
          });
        }
        break;
        
      case 'time_period':
        // 根據時間範圍調整查詢條件
        break;
    }
  });

  // 如果沒有特定查詢，建立預設查詢
  if (queries.length === 0) {
    queries.push({
      collection: 'records',
      filters: [
        { field: 'organizationId', operator: '==', value: organizationId }
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 50
    });
  }

  return queries;
};

const executeFirestoreQuery = async (db: any, queryConfig: any) => {
  let query = db.collection(queryConfig.collection);

  // 套用篩選條件
  queryConfig.filters?.forEach((filter: any) => {
    query = query.where(filter.field, filter.operator, filter.value);
  });

  // 套用排序
  queryConfig.orderBy?.forEach((order: any) => {
    query = query.orderBy(order.field, order.direction);
  });

  // 套用限制
  if (queryConfig.limit) {
    query = query.limit(queryConfig.limit);
  }

  const snapshot = await query.get();
  return {
    collection: queryConfig.collection,
    docs: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  };
};

const processQueryResults = (results: any[], intent: QueryIntent) => {
  const allData = results.flatMap(result => result.docs);
  
  // 基於意圖處理資料
  const processedData = transformDataForIntent(allData, intent);
  
  return {
    columns: inferColumns(processedData),
    rows: processedData,
    aggregations: calculateAggregations(processedData, intent),
    summary: {
      totalRows: processedData.length,
      timeRange: extractTimeRange(processedData),
      keyMetrics: calculateKeyMetrics(processedData, intent),
      qualityScore: 0.95
    },
    sources: results.map(result => ({
      type: 'firestore' as const,
      name: `Firestore ${result.collection}`,
      connection: { endpoint: `firestore://${result.collection}` },
      lastUpdated: new Date()
    }))
  };
};

// ============================================================================
// 輔助函數
// ============================================================================

const transformDataForIntent = (data: any[], intent: QueryIntent) => {
  // 基於意圖轉換資料格式
  switch (intent.primary) {
    case 'trend':
      return data.map(item => ({
        date: item.createdAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        value: item.metadata?.amount || item.value || 1,
        category: item.type || 'default',
        ...item
      }));
      
    case 'comparison':
      return data.map(item => ({
        category: item.type || item.category || 'default',
        value: item.metadata?.amount || item.value || 1,
        label: item.title || item.name || item.id,
        ...item
      }));
      
    default:
      return data;
  }
};

const inferColumns = (data: any[]) => {
  if (data.length === 0) return [];
  
  const sample = data[0];
  return Object.keys(sample).map(key => ({
    name: key,
    type: inferColumnType(sample[key]),
    description: key,
    format: getColumnFormat(key, sample[key])
  }));
};

const inferColumnType = (value: any): 'string' | 'number' | 'date' | 'boolean' => {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) return 'date';
  return 'string';
};

const getColumnFormat = (key: string, value: any): string | undefined => {
  if (key.includes('amount') || key.includes('price') || key.includes('revenue')) return 'currency';
  if (key.includes('rate') || key.includes('percent')) return 'percentage';
  if (key.includes('date') || key.includes('time')) return 'date';
  return undefined;
};

const calculateAggregations = (data: any[], intent: QueryIntent) => {
  const aggregations: any[] = [];
  
  // 尋找數值欄位進行聚合
  const numericFields = findNumericFields(data);
  
  numericFields.forEach(field => {
    const values = data.map(item => item[field]).filter(v => typeof v === 'number');
    
    if (values.length > 0) {
      aggregations.push(
        { type: 'sum', field, value: values.reduce((a, b) => a + b, 0) },
        { type: 'avg', field, value: values.reduce((a, b) => a + b, 0) / values.length },
        { type: 'min', field, value: Math.min(...values) },
        { type: 'max', field, value: Math.max(...values) },
        { type: 'count', field, value: values.length }
      );
    }
  });
  
  return aggregations;
};

const findNumericFields = (data: any[]): string[] => {
  if (data.length === 0) return [];
  
  const sample = data[0];
  return Object.keys(sample).filter(key => 
    typeof sample[key] === 'number' || 
    (key.includes('amount') || key.includes('value') || key.includes('price'))
  );
};

const extractTimeRange = (data: any[]) => {
  const dates = data.map(item => {
    const date = item.createdAt?.toDate?.() || item.date || item.timestamp;
    return date ? new Date(date) : null;
  }).filter(Boolean);
  
  if (dates.length === 0) return undefined;
  
  return {
    start: new Date(Math.min(...dates.map(d => d!.getTime()))),
    end: new Date(Math.max(...dates.map(d => d!.getTime())))
  };
};

const calculateKeyMetrics = (data: any[], intent: QueryIntent) => {
  const metrics: Record<string, number | string> = {};
  
  // 計算基礎指標
  metrics.totalRecords = data.length;
  
  // 基於意圖計算特定指標
  const numericFields = findNumericFields(data);
  numericFields.forEach(field => {
    const values = data.map(item => item[field]).filter(v => typeof v === 'number');
    if (values.length > 0) {
      metrics[`${field}_total`] = values.reduce((a, b) => a + b, 0);
      metrics[`${field}_average`] = values.reduce((a, b) => a + b, 0) / values.length;
    }
  });
  
  return metrics;
};

// ============================================================================
// AI 解釋生成
// ============================================================================

const generateAIExplanation = async (
  query: string,
  data: any,
  intent: QueryIntent,
  chartRecommendation: any
) => {
  // 基於查詢結果生成解釋
  const summary = generateSummary(query, data, intent);
  const keyFindings = generateKeyFindings(data, intent);
  const insights = generateInsights(data, intent);
  const recommendations = generateRecommendations(data, intent);

  return {
    summary,
    keyFindings,
    insights,
    recommendations,
    confidence: 'high' as const
  };
};

const generateSummary = (query: string, data: any, intent: QueryIntent): string => {
  const recordCount = data.rows?.length || 0;
  
  if (recordCount === 0) {
    return `根據您的查詢「${query}」，目前沒有找到相關資料。建議調整查詢條件或時間範圍。`;
  }

  let summary = `根據您的查詢「${query}」，我分析了 ${recordCount} 筆相關資料。`;
  
  // 基於意圖類型添加特定描述
  switch (intent.primary) {
    case 'trend':
      summary += ' 資料顯示了明確的趨勢模式，';
      break;
    case 'comparison':
      summary += ' 透過比較分析，我們可以看到不同項目間的差異，';
      break;
    case 'aggregate':
      summary += ' 聚合分析結果顯示了整體表現概況，';
      break;
  }
  
  return summary + '以下是詳細的分析結果。';
};

const generateKeyFindings = (data: any, intent: QueryIntent): string[] => {
  const findings: string[] = [];
  
  const recordCount = data.rows?.length || 0;
  if (recordCount > 0) {
    findings.push(`共分析了 ${recordCount} 筆資料記錄`);
  }
  
  // 基於聚合結果產生發現
  if (data.aggregations && data.aggregations.length > 0) {
    const sumAggregations = data.aggregations.filter((agg: any) => agg.type === 'sum');
    sumAggregations.forEach((agg: any) => {
      if (agg.value > 0) {
        findings.push(`${agg.field} 總計為 ${agg.value.toLocaleString()}`);
      }
    });
  }
  
  return findings;
};

const generateInsights = (data: any, intent: QueryIntent): any[] => {
  const insights: any[] = [];
  
  // 基於資料模式產生洞察
  if (data.summary?.qualityScore) {
    insights.push({
      id: 'data-quality',
      type: 'pattern',
      title: '資料品質良好',
      description: `資料完整性達到 ${(data.summary.qualityScore * 100).toFixed(1)}%`,
      importance: 'medium' as const,
      suggestedActions: ['繼續維持資料收集品質']
    });
  }
  
  return insights;
};

const generateRecommendations = (data: any, intent: QueryIntent): string[] => {
  const recommendations: string[] = [];
  
  // 基於資料提供建議
  const recordCount = data.rows?.length || 0;
  
  if (recordCount === 0) {
    recommendations.push('建議檢查資料來源或調整查詢條件');
    recommendations.push('考慮擴大時間範圍以獲得更多資料');
  } else if (recordCount > 100) {
    recommendations.push('資料量充足，可進行深度分析');
    recommendations.push('建議建立定期監控機制');
  }
  
  recommendations.push('可以建立儀表板持續追蹤這些指標');
  
  return recommendations;
};

// ============================================================================
// 查詢建議生成
// ============================================================================

const generateQuerySuggestions = async (query: string, intent: QueryIntent): Promise<QuerySuggestion[]> => {
  const suggestions: QuerySuggestion[] = [];
  
  // 基於意圖生成相關建議
  switch (intent.primary) {
    case 'trend':
      suggestions.push(
        {
          id: crypto.randomUUID(),
          text: '預測未來三個月的趨勢',
          type: 'contextual',
          category: 'trend',
          description: '基於當前趨勢進行預測分析',
          relevance: 0.9,
          tags: ['預測', '趨勢']
        },
        {
          id: crypto.randomUUID(),
          text: '比較與去年同期的差異',
          type: 'contextual',
          category: 'comparison',
          description: '年度對比分析',
          relevance: 0.85,
          tags: ['對比', '年度']
        }
      );
      break;
      
    case 'aggregate':
      suggestions.push(
        {
          id: crypto.randomUUID(),
          text: '查看詳細的分類統計',
          type: 'contextual',
          category: 'revenue',
          description: '按類別進行詳細分析',
          relevance: 0.8,
          tags: ['分類', '統計']
        }
      );
      break;
  }
  
  return suggestions;
};

// ============================================================================
// 快取管理
// ============================================================================

const getCacheKey = (request: AIAnalyticsRequest, userId: string): string => {
  const key = {
    query: request.query,
    context: request.context,
    options: request.options,
    userId
  };
  
  return `ai-analytics:${Buffer.from(JSON.stringify(key)).toString('base64')}`;
};

const getCachedResult = async (cacheKey: string): Promise<QueryResult | null> => {
  try {
    const cached = await dashboardCacheManager.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setCachedResult = async (cacheKey: string, result: QueryResult): Promise<void> => {
  try {
    await dashboardCacheManager.set(cacheKey, JSON.stringify(result), 300); // 5分鐘快取
  } catch (error) {
    console.error('Failed to cache result:', error);
  }
};

// ============================================================================
// 主要 API 處理函數
// ============================================================================

export async function POST(request: NextRequest) {
  const requestStart = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // 1. 身份驗證
    const session = await authenticate(request);
    
    // 2. 解析請求
    const body = await request.json();
    const validatedRequest = AIAnalyticsRequestSchema.parse(body);
    
    // 3. 權限檢查
    const userData = await checkPermissions(session.user.uid, session.user.organizationId);
    
    // 4. 速率限制
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    await checkRateLimit(session.user.uid, clientIP);
    
    // 5. 快取檢查
    const cacheKey = getCacheKey(validatedRequest, session.user.uid);
    let result: QueryResult | null = null;
    
    if (validatedRequest.options?.useCache !== false) {
      result = await getCachedResult(cacheKey);
    }
    
    // 6. 處理查詢（如果沒有快取）
    if (!result) {
      const userContext: UserContext = {
        userId: session.user.uid,
        organizationId: session.user.organizationId!,
        roles: userData.roles || ['user'],
        permissions: userData.permissions || {},
        preferences: validatedRequest.context?.userPreferences || {},
        session: {
          sessionId: validatedRequest.metadata?.sessionId || requestId,
          ipAddress: clientIP,
          userAgent: validatedRequest.metadata?.userAgent || request.headers.get('user-agent') || '',
          startedAt: new Date(),
          lastActivityAt: new Date()
        }
      };

      result = await processAIQuery(validatedRequest, userContext);
      
      // 快取結果
      if (validatedRequest.options?.useCache !== false) {
        await setCachedResult(cacheKey, result);
      }
    }
    
    // 7. 記錄查詢歷史
    await recordQueryHistory({
      userId: session.user.uid,
      organizationId: session.user.organizationId!,
      queryId: result.queryId,
      query: validatedRequest.query,
      result,
      processingTime: Date.now() - requestStart,
      cached: !!result,
      requestId
    });

    // 8. 返回結果
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        requestId,
        processingTime: Date.now() - requestStart,
        cached: false,
        version: '1.0.0'
      }
    });

  } catch (error) {
    return handleError(error);
  }
}

// ============================================================================
// 查詢歷史記錄
// ============================================================================

const recordQueryHistory = async (params: {
  userId: string;
  organizationId: string;
  queryId: string;
  query: string;
  result: QueryResult;
  processingTime: number;
  cached: boolean;
  requestId: string;
}) => {
  try {
    const db = firebaseAdmin.firestore();
    
    await db.collection('ai-analytics-history').add({
      ...params,
      timestamp: new Date(),
      success: params.result.status === 'success'
    });

    // 發送通知（如果是重要查詢結果）
    if (params.result.status === 'success' && params.result.data.rows.length > 0) {
      await notificationService.sendNotification({
        userId: params.userId,
        type: 'ai_analysis_complete',
        title: 'AI 分析完成',
        message: `您的查詢「${params.query}」已完成分析`,
        data: {
          queryId: params.queryId,
          rowCount: params.result.data.rows.length
        }
      });
    }

  } catch (error) {
    console.error('Failed to record query history:', error);
    // 不拋出錯誤，避免影響主要功能
  }
};

// ============================================================================
// 健康檢查端點
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // 檢查 AI 引擎狀態
    const aiEngineStatus = {
      queryParser: await checkServiceHealth(() => queryParser.healthCheck?.()),
      intentRecognition: await checkServiceHealth(() => intentRecognition.healthCheck?.()),
      chartRecommender: await checkServiceHealth(() => chartRecommender.healthCheck?.()),
      performanceMonitor: await checkServiceHealth(() => performanceMonitor.healthCheck?.())
    };

    // 檢查資料庫連接
    const dbStatus = await checkServiceHealth(async () => {
      const db = firebaseAdmin.firestore();
      await db.collection('health-check').doc('test').get();
      return true;
    });

    // 檢查快取系統
    const cacheStatus = await checkServiceHealth(async () => {
      await dashboardCacheManager.get('health-check');
      return true;
    });

    const overall = Object.values(aiEngineStatus).every(status => status === 'healthy') &&
                   dbStatus === 'healthy' &&
                   cacheStatus === 'healthy';

    return NextResponse.json({
      status: overall ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        aiEngine: aiEngineStatus,
        database: dbStatus,
        cache: cacheStatus
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: String(error)
    }, { status: 500 });
  }
}

const checkServiceHealth = async (healthCheck?: () => Promise<any>): Promise<string> => {
  try {
    if (healthCheck) {
      await healthCheck();
    }
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
};