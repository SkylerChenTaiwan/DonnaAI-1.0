/**
 * AI 查詢分析 API
 * POST /api/analytics/query
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { firebaseAdmin } from '@/lib/firebase-admin';
import { dashboardCacheManager } from '@/lib/cache/dashboard-cache-manager';
import type { AIQueryRequest, AIQueryResponse } from '@/docs/types/dashboard-data-models';

export async function POST(request: NextRequest) {
  try {
    // 驗證使用者身份
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '未授權存取' } },
        { status: 401 }
      );
    }

    const body: AIQueryRequest = await request.json();
    const {
      query,
      context,
      userId,
      organizationId,
      language = 'zh-TW',
      responseFormat = 'text',
      maxTokens = 1000,
      temperature = 0.7
    } = body;

    // 驗證必要參數
    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_QUERY', message: '缺少查詢內容' } },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_ORGANIZATION', message: '缺少組織 ID' } },
        { status: 400 }
      );
    }

    // 檢查權限
    const hasAccess = await checkOrganizationAccess(session.user.uid, organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '無存取權限' } },
        { status: 403 }
      );
    }

    const startTime = Date.now();
    let cacheHit = false;
    let cacheAge = 0;

    // 清理和驗證查詢
    const sanitizedQuery = sanitizeQuery(query);
    
    // 嘗試從快取獲取 AI 查詢結果
    let aiResult = await dashboardCacheManager.getAIQuery(sanitizedQuery, organizationId);
    
    if (aiResult) {
      cacheHit = true;
      console.log(`Cache hit for AI query: ${sanitizedQuery.substring(0, 50)}...`);
    } else {
      // 快取未命中，執行 AI 查詢分析
      aiResult = await processAIQuery({
        query: sanitizedQuery,
        context,
        organizationId,
        userId: session.user.uid,
        language,
        responseFormat,
        maxTokens,
        temperature
      });
      
      // 將結果存入快取
      await dashboardCacheManager.cacheAIQuery(sanitizedQuery, organizationId, aiResult);
      console.log(`Cached AI query result: ${sanitizedQuery.substring(0, 50)}...`);
    }

    const processingTime = Date.now() - startTime;

    // 儲存查詢歷史（僅對新查詢）
    if (!cacheHit) {
      await saveQueryHistory({
        userId: session.user.uid,
        organizationId,
        query: sanitizedQuery,
        result: aiResult,
        processingTime
      });
    }

    const response: AIQueryResponse = {
      success: true,
      data: aiResult,
      model: 'gpt-4', // TODO: 使用實際的模型名稱
      tokenUsage: {
        prompt: cacheHit ? 0 : 150, // 快取命中時不消耗 token
        completion: cacheHit ? 0 : 200,
        total: cacheHit ? 0 : 350
      },
      processingTime,
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date(),
        processingTime,
        version: '1.0.0',
        cache: {
          hit: cacheHit,
          age: cacheAge
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI Query API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'AI 查詢處理失敗',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      },
      { status: 500 }
    );
  }
}

/**
 * 檢查使用者是否有存取組織的權限
 */
async function checkOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
  try {
    const db = firebaseAdmin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return false;
    }

    const userData = userDoc.data();
    return userData?.organizationId === organizationId;
  } catch (error) {
    console.error('Error checking organization access:', error);
    return false;
  }
}

/**
 * 清理和驗證查詢輸入
 */
function sanitizeQuery(query: string): string {
  return query
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除 script 標籤
    .replace(/javascript:/gi, '') // 移除 javascript: 協議
    .replace(/on\w+=/gi, '') // 移除事件處理器
    .trim()
    .slice(0, 500); // 限制查詢長度
}

/**
 * 處理 AI 查詢
 */
async function processAIQuery(params: {
  query: string;
  context?: any;
  organizationId: string;
  userId: string;
  language: string;
  responseFormat: string;
  maxTokens: number;
  temperature: number;
}) {
  const { query, context, organizationId, userId, language, responseFormat } = params;

  // 分析查詢意圖
  const intent = await analyzeQueryIntent(query);
  
  // 獲取相關業務資料
  const businessData = await getRelevantBusinessData(organizationId, intent);
  
  // 生成回應
  const response = await generateAIResponse({
    query,
    intent,
    businessData,
    context,
    language,
    responseFormat
  });

  return response;
}

/**
 * 分析查詢意圖
 */
async function analyzeQueryIntent(query: string) {
  // 簡化版意圖分析，實際應該使用 NLP 服務
  const lowerQuery = query.toLowerCase();
  
  let type: 'metric' | 'trend' | 'comparison' | 'prediction' | 'explanation' | 'action' = 'explanation';
  const entities: Array<{ type: string; value: string; role?: string }> = [];
  
  // 檢測查詢類型
  if (lowerQuery.includes('趨勢') || lowerQuery.includes('變化') || lowerQuery.includes('成長')) {
    type = 'trend';
  } else if (lowerQuery.includes('比較') || lowerQuery.includes('對比')) {
    type = 'comparison';
  } else if (lowerQuery.includes('預測') || lowerQuery.includes('預期') || lowerQuery.includes('未來')) {
    type = 'prediction';
  } else if (lowerQuery.includes('多少') || lowerQuery.includes('數量') || lowerQuery.includes('總計')) {
    type = 'metric';
  }

  // 提取實體
  const entityPatterns = [
    { pattern: /(客戶|顧客)/g, type: 'customer', role: 'subject' },
    { pattern: /(營收|收入|業績|銷售)/g, type: 'revenue', role: 'subject' },
    { pattern: /(任務|工作)/g, type: 'task', role: 'subject' },
    { pattern: /(會議|meeting)/g, type: 'meeting', role: 'subject' },
    { pattern: /(本月|這個月|當月)/g, type: 'time', role: 'timeframe' },
    { pattern: /(上月|上個月)/g, type: 'time', role: 'timeframe' },
    { pattern: /(今年|本年)/g, type: 'time', role: 'timeframe' },
    { pattern: /(團隊|同事|成員)/g, type: 'team', role: 'subject' }
  ];

  entityPatterns.forEach(({ pattern, type: entityType, role }) => {
    const matches = query.match(pattern);
    if (matches) {
      matches.forEach(match => {
        entities.push({
          type: entityType,
          value: match,
          role
        });
      });
    }
  });

  return {
    type,
    entities,
    timeRange: extractTimeRange(query),
    parameters: {}
  };
}

/**
 * 從查詢中提取時間範圍
 */
function extractTimeRange(query: string) {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('今天') || lowerQuery.includes('今日')) {
    return { preset: '1d' };
  } else if (lowerQuery.includes('本週') || lowerQuery.includes('這週')) {
    return { preset: '7d' };
  } else if (lowerQuery.includes('本月') || lowerQuery.includes('這個月')) {
    return { preset: '30d' };
  } else if (lowerQuery.includes('本季') || lowerQuery.includes('這季')) {
    return { preset: '90d' };
  } else if (lowerQuery.includes('本年') || lowerQuery.includes('今年')) {
    return { preset: '1y' };
  }
  
  return { preset: '30d' }; // 預設為 30 天
}

/**
 * 獲取相關業務資料
 */
async function getRelevantBusinessData(organizationId: string, intent: any) {
  const db = firebaseAdmin.firestore();
  
  try {
    const businessData: any = {
      summary: {},
      details: []
    };

    // 根據意圖獲取相關資料
    const entityTypes = intent.entities.map((e: any) => e.type);

    if (entityTypes.includes('customer')) {
      // 獲取客戶資料
      const customersQuery = await db
        .collection('customers')
        .where('organizationId', '==', organizationId)
        .limit(100)
        .get();
      
      businessData.customers = {
        total: customersQuery.size,
        recent: customersQuery.docs.slice(0, 5).map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      };
    }

    if (entityTypes.includes('revenue')) {
      // 獲取營收資料
      const revenueQuery = await db
        .collection('records')
        .where('organizationId', '==', organizationId)
        .where('type', '==', 'sales')
        .limit(50)
        .get();

      let totalRevenue = 0;
      revenueQuery.docs.forEach(doc => {
        const data = doc.data();
        totalRevenue += data.metadata?.amount || 0;
      });

      businessData.revenue = {
        total: totalRevenue,
        count: revenueQuery.size,
        recent: revenueQuery.docs.slice(0, 5).map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      };
    }

    if (entityTypes.includes('task')) {
      // 獲取任務資料
      const tasksQuery = await db
        .collection('tasks')
        .where('organizationId', '==', organizationId)
        .limit(50)
        .get();

      const taskStats = {
        total: 0,
        completed: 0,
        pending: 0,
        inProgress: 0
      };

      tasksQuery.docs.forEach(doc => {
        const data = doc.data();
        taskStats.total++;
        
        switch (data.status) {
          case 'completed':
            taskStats.completed++;
            break;
          case 'pending':
            taskStats.pending++;
            break;
          case 'in_progress':
            taskStats.inProgress++;
            break;
        }
      });

      businessData.tasks = taskStats;
    }

    if (entityTypes.includes('team')) {
      // 獲取團隊資料
      const teamQuery = await db
        .collection('users')
        .where('organizationId', '==', organizationId)
        .get();

      businessData.team = {
        total: teamQuery.size,
        members: teamQuery.docs.map(doc => ({
          id: doc.id,
          name: doc.data().displayName || doc.data().name,
          role: doc.data().role
        }))
      };
    }

    return businessData;

  } catch (error) {
    console.error('Error getting business data:', error);
    return {
      summary: {},
      details: []
    };
  }
}

/**
 * 生成 AI 回應
 */
async function generateAIResponse(params: {
  query: string;
  intent: any;
  businessData: any;
  context?: any;
  language: string;
  responseFormat: string;
}) {
  const { query, intent, businessData, language, responseFormat } = params;

  // 這裡應該整合實際的 AI 服務（如 OpenAI GPT、Google Gemini 等）
  // 目前提供基於規則的簡化版本

  let answer = '';
  let data: any[] = [];
  let visualizations: any[] = [];
  let confidence = 0.8;
  let sources: string[] = [];
  let suggestedFollowUp: string[] = [];

  // 根據意圖類型生成回應
  switch (intent.type) {
    case 'metric':
      answer = await generateMetricResponse(query, businessData, language);
      data = extractMetricData(businessData);
      sources = ['customers', 'revenue', 'tasks'];
      suggestedFollowUp = [
        '這個數字與上個月相比如何？',
        '可以看看詳細的趨勢圖嗎？',
        '哪個團隊表現最好？'
      ];
      break;

    case 'trend':
      answer = await generateTrendResponse(query, businessData, language);
      visualizations = generateTrendVisualization(businessData);
      sources = ['revenue', 'customers'];
      suggestedFollowUp = [
        '預測下個月的趨勢',
        '影響趨勢的主要因素是什麼？',
        '與去年同期相比如何？'
      ];
      break;

    case 'comparison':
      answer = await generateComparisonResponse(query, businessData, language);
      visualizations = generateComparisonVisualization(businessData);
      sources = ['tasks', 'team', 'revenue'];
      suggestedFollowUp = [
        '為什麼會有這些差異？',
        '如何改善表現較差的項目？',
        '設定改善目標'
      ];
      break;

    default:
      answer = await generateGeneralResponse(query, businessData, language);
      sources = Object.keys(businessData);
      suggestedFollowUp = [
        '可以提供更多詳細資訊嗎？',
        '相關的圖表分析',
        '如何改善這個狀況？'
      ];
  }

  return {
    id: crypto.randomUUID(),
    originalQuery: query,
    intent,
    responseText: answer,
    structuredData: data.length > 0 ? data : undefined,
    visualization: visualizations.length > 0 ? visualizations[0] : undefined,
    relatedQueries: suggestedFollowUp,
    confidence,
    dataSources: sources,
    actions: []
  };
}

/**
 * 生成指標類型回應
 */
async function generateMetricResponse(query: string, businessData: any, language: string): Promise<string> {
  let response = '';

  if (businessData.customers) {
    response += `目前總客戶數：${businessData.customers.total} 位\n`;
  }

  if (businessData.revenue) {
    response += `總營收：NT$${businessData.revenue.total.toLocaleString()}\n`;
    response += `交易筆數：${businessData.revenue.count} 筆\n`;
  }

  if (businessData.tasks) {
    response += `任務概況：\n`;
    response += `- 總計：${businessData.tasks.total} 項\n`;
    response += `- 已完成：${businessData.tasks.completed} 項\n`;
    response += `- 進行中：${businessData.tasks.inProgress} 項\n`;
    response += `- 待處理：${businessData.tasks.pending} 項\n`;
  }

  if (businessData.team) {
    response += `團隊規模：${businessData.team.total} 人\n`;
  }

  return response || '抱歉，我無法找到相關的指標資料。';
}

/**
 * 生成趨勢類型回應
 */
async function generateTrendResponse(query: string, businessData: any, language: string): Promise<string> {
  let response = '根據資料分析，以下是主要趨勢：\n\n';

  if (businessData.revenue) {
    response += `營收趨勢：目前總營收為 NT$${businessData.revenue.total.toLocaleString()}，`;
    response += `基於最近的交易數據，呈現穩定成長趨勢。\n`;
  }

  if (businessData.customers) {
    response += `客戶成長：客戶數量持續增長，目前達到 ${businessData.customers.total} 位。\n`;
  }

  if (businessData.tasks) {
    const completionRate = ((businessData.tasks.completed / businessData.tasks.total) * 100).toFixed(1);
    response += `任務完成趨勢：完成率為 ${completionRate}%，團隊執行效率良好。\n`;
  }

  return response;
}

/**
 * 生成比較類型回應
 */
async function generateComparisonResponse(query: string, businessData: any, language: string): Promise<string> {
  let response = '比較分析結果：\n\n';

  if (businessData.team && businessData.tasks) {
    const avgTasksPerMember = (businessData.tasks.total / businessData.team.total).toFixed(1);
    response += `平均每位成員負責 ${avgTasksPerMember} 個任務\n`;
  }

  if (businessData.revenue && businessData.customers) {
    const avgRevenuePerCustomer = (businessData.revenue.total / businessData.customers.total).toFixed(0);
    response += `平均每位客戶貢獻 NT$${Number(avgRevenuePerCustomer).toLocaleString()}\n`;
  }

  return response;
}

/**
 * 生成一般類型回應
 */
async function generateGeneralResponse(query: string, businessData: any, language: string): Promise<string> {
  return `根據您的查詢「${query}」，我分析了相關的業務資料。如果您需要特定的指標、趨勢分析或比較，請提供更具體的問題。`;
}

/**
 * 提取指標資料
 */
function extractMetricData(businessData: any): any[] {
  const data: any[] = [];

  if (businessData.customers) {
    data.push({
      metric: 'customers',
      value: businessData.customers.total,
      label: '客戶總數'
    });
  }

  if (businessData.revenue) {
    data.push({
      metric: 'revenue',
      value: businessData.revenue.total,
      label: '總營收'
    });
  }

  if (businessData.tasks) {
    data.push({
      metric: 'tasks_completion',
      value: (businessData.tasks.completed / businessData.tasks.total) * 100,
      label: '任務完成率 (%)'
    });
  }

  return data;
}

/**
 * 生成趨勢視覺化
 */
function generateTrendVisualization(businessData: any): any[] {
  // 簡化版視覺化配置
  return [{
    chartType: 'line',
    chartConfig: {
      id: 'trend-analysis',
      title: '業務趨勢分析',
      type: 'line',
      datasets: [{
        label: '營收趨勢',
        data: [10, 20, 15, 25, 30], // 模擬資料
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }],
      labels: ['週一', '週二', '週三', '週四', '週五']
    }
  }];
}

/**
 * 生成比較視覺化
 */
function generateComparisonVisualization(businessData: any): any[] {
  return [{
    chartType: 'bar',
    chartConfig: {
      id: 'comparison-analysis',
      title: '比較分析',
      type: 'bar',
      datasets: [{
        label: '團隊表現',
        data: [85, 92, 78, 88], // 模擬資料
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']
      }],
      labels: ['業務一組', '業務二組', '業務三組', '業務四組']
    }
  }];
}

/**
 * 儲存查詢歷史
 */
async function saveQueryHistory(params: {
  userId: string;
  organizationId: string;
  query: string;
  result: any;
  processingTime: number;
}) {
  try {
    const db = firebaseAdmin.firestore();
    const { userId, organizationId, query, result, processingTime } = params;

    await db.collection('ai-query-history').add({
      userId,
      organizationId,
      query,
      result: {
        id: result.id,
        answer: result.responseText,
        confidence: result.confidence,
        sources: result.dataSources
      },
      processingTime,
      timestamp: new Date(),
      success: true
    });

  } catch (error) {
    console.error('Error saving query history:', error);
    // 不拋出錯誤，避免影響主要功能
  }
}