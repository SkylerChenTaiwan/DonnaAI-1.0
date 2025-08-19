/**
 * PRP-124: AI 驅動分析查詢介面 - 查詢解析器
 * 
 * @description 自然語言查詢解析服務，將使用者的中文查詢轉換為結構化的查詢意圖
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import { aiClient } from './ai-client';
import type { 
  AIQuery,
  QueryIntent,
  QueryContext,
  QueryOptions,
  ExtractedEntity,
  QueryClassification,
  IntentType,
  AIError
} from '@/docs/types/ai-query-data-models';

// ============================================================================
// 查詢預處理和標準化
// ============================================================================

/**
 * 查詢預處理結果
 */
interface PreprocessedQuery {
  original: string;
  cleaned: string;
  normalized: string;
  tokens: string[];
  hasTimeReference: boolean;
  hasMetricReference: boolean;
  hasComparisonWords: boolean;
  language: 'zh-TW' | 'zh-CN' | 'en-US';
}

/**
 * 查詢模式匹配結果
 */
interface QueryPattern {
  type: IntentType;
  pattern: RegExp;
  confidence: number;
  entities: Partial<ExtractedEntity>[];
}

// ============================================================================
// 查詢解析器類別
// ============================================================================

/**
 * 查詢解析器
 * 負責將自然語言查詢轉換為結構化的查詢意圖
 */
export class QueryParser {
  private readonly commonPatterns: QueryPattern[];
  private readonly timePatterns: Record<string, string>;
  private readonly metricPatterns: Record<string, string>;
  private readonly comparisonPatterns: Record<string, string>;

  constructor() {
    this.commonPatterns = this.initializeCommonPatterns();
    this.timePatterns = this.initializeTimePatterns();
    this.metricPatterns = this.initializeMetricPatterns();
    this.comparisonPatterns = this.initializeComparisonPatterns();
  }

  /**
   * 解析自然語言查詢
   * @param query 自然語言查詢
   * @param context 查詢上下文
   * @param options 查詢選項
   * @returns 解析後的查詢意圖
   */
  async parseQuery(
    query: string,
    context?: QueryContext,
    options?: QueryOptions
  ): Promise<QueryIntent> {
    try {
      // 1. 查詢預處理
      const preprocessed = this.preprocessQuery(query);
      console.log('Preprocessed query:', preprocessed);

      // 2. 快速模式匹配（提高效能）
      const quickMatch = this.quickPatternMatch(preprocessed);
      if (quickMatch && quickMatch.confidence > 0.8) {
        console.log('Quick pattern match success:', quickMatch);
        return this.buildQueryIntentFromPattern(quickMatch, preprocessed, context);
      }

      // 3. AI 深度解析（更準確但較慢）
      const aiIntent = await this.aiDeepParse(query, context, options);
      console.log('AI deep parse result:', aiIntent);

      // 4. 後處理和驗證
      const finalIntent = this.postProcessIntent(aiIntent, preprocessed, context);
      
      return finalIntent;
    } catch (error) {
      console.error('Query parsing error:', error);
      
      // 降級處理：返回基本意圖
      return this.createFallbackIntent(query, error);
    }
  }

  /**
   * 驗證查詢意圖
   * @param intent 查詢意圖
   * @returns 驗證結果
   */
  validateIntent(intent: QueryIntent): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 檢查必要欄位
    if (!intent.primary) {
      errors.push('缺少主要意圖類型');
    }

    if (!intent.entities || intent.entities.length === 0) {
      warnings.push('未提取到任何實體');
    }

    if (intent.confidence < 0.5) {
      warnings.push('查詢理解信心度較低');
    }

    // 檢查意圖和實體的一致性
    if (intent.primary === 'comparison' && !this.hasComparisonEntities(intent.entities)) {
      warnings.push('比較意圖但缺少比較實體');
    }

    if (intent.primary === 'trend' && !this.hasTimeEntities(intent.entities)) {
      warnings.push('趨勢分析但缺少時間實體');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================================================
  // 私有方法 - 查詢預處理
  // ============================================================================

  /**
   * 查詢預處理
   */
  private preprocessQuery(query: string): PreprocessedQuery {
    // 1. 基本清理
    const cleaned = query
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[，。！？；：]/g, '')
      .toLowerCase();

    // 2. 標準化
    const normalized = this.normalizeQuery(cleaned);

    // 3. 分詞
    const tokens = this.tokenizeQuery(normalized);

    // 4. 特徵檢測
    const hasTimeReference = this.detectTimeReference(normalized);
    const hasMetricReference = this.detectMetricReference(normalized);
    const hasComparisonWords = this.detectComparisonWords(normalized);

    // 5. 語言檢測
    const language = this.detectLanguage(query);

    return {
      original: query,
      cleaned,
      normalized,
      tokens,
      hasTimeReference,
      hasMetricReference,
      hasComparisonWords,
      language,
    };
  }

  /**
   * 標準化查詢
   */
  private normalizeQuery(query: string): string {
    let normalized = query;

    // 時間詞彙標準化
    Object.entries(this.timePatterns).forEach(([pattern, replacement]) => {
      normalized = normalized.replace(new RegExp(pattern, 'g'), replacement);
    });

    // 指標詞彙標準化
    Object.entries(this.metricPatterns).forEach(([pattern, replacement]) => {
      normalized = normalized.replace(new RegExp(pattern, 'g'), replacement);
    });

    // 比較詞彙標準化
    Object.entries(this.comparisonPatterns).forEach(([pattern, replacement]) => {
      normalized = normalized.replace(new RegExp(pattern, 'g'), replacement);
    });

    return normalized;
  }

  /**
   * 查詢分詞
   */
  private tokenizeQuery(query: string): string[] {
    // 簡單的中文分詞邏輯
    const tokens: string[] = [];
    
    // 分離中文和英文
    const parts = query.split(/([a-zA-Z0-9]+)/);
    
    parts.forEach(part => {
      if (/^[a-zA-Z0-9]+$/.test(part)) {
        tokens.push(part);
      } else {
        // 中文按字符分割，但保留常見詞組
        const chineseTokens = this.segmentChinese(part);
        tokens.push(...chineseTokens);
      }
    });

    return tokens.filter(token => token.length > 0);
  }

  /**
   * 中文分詞
   */
  private segmentChinese(text: string): string[] {
    const commonWords = [
      '這個月', '上個月', '下個月', '去年', '今年', '明年',
      '營收', '銷售額', '客戶數', '轉換率', '留存率',
      '比較', '對比', '增長', '下降', '趨勢', '排名',
      '最高', '最低', '平均', '總計', '總和',
    ];

    let result = text;
    const tokens: string[] = [];

    // 先提取常見詞組
    commonWords.forEach(word => {
      if (result.includes(word)) {
        tokens.push(word);
        result = result.replace(word, ' ');
      }
    });

    // 剩餘字符按單字分割
    const remainingChars = result.replace(/\s+/g, '').split('');
    tokens.push(...remainingChars.filter(char => char.length > 0));

    return tokens;
  }

  // ============================================================================
  // 私有方法 - 特徵檢測
  // ============================================================================

  /**
   * 檢測時間引用
   */
  private detectTimeReference(query: string): boolean {
    const timeKeywords = [
      '今天', '昨天', '明天', '這週', '上週', '下週',
      '這個月', '上個月', '下個月', '這季', '上季', '下季',
      '今年', '去年', '明年', '過去', '未來', '最近',
      '小時', '天', '週', '月', '季', '年'
    ];

    return timeKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * 檢測指標引用
   */
  private detectMetricReference(query: string): boolean {
    const metricKeywords = [
      '營收', '收入', '銷售額', '業績', '利潤',
      '客戶', '用戶', '會員', '人數', '數量',
      '轉換率', '留存率', '滿意度', '評分',
      '訂單', '交易', '購買', '消費'
    ];

    return metricKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * 檢測比較詞彙
   */
  private detectComparisonWords(query: string): boolean {
    const comparisonKeywords = [
      '比較', '對比', '相比', '與', '和',
      '增長', '減少', '提升', '下降', '變化',
      '差異', '差別', '不同', '同比', '環比'
    ];

    return comparisonKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * 檢測語言
   */
  private detectLanguage(query: string): 'zh-TW' | 'zh-CN' | 'en-US' {
    const chineseCharCount = (query.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishCharCount = (query.match(/[a-zA-Z]/g) || []).length;

    if (chineseCharCount > englishCharCount) {
      // 檢測繁簡體
      const traditionalChars = ['會', '業', '詢', '資', '養'];
      const simplifiedChars = ['会', '业', '询', '资', '养'];
      
      const hasTraditional = traditionalChars.some(char => query.includes(char));
      const hasSimplified = simplifiedChars.some(char => query.includes(char));
      
      return hasTraditional ? 'zh-TW' : 'zh-CN';
    }

    return 'en-US';
  }

  // ============================================================================
  // 私有方法 - 模式匹配
  // ============================================================================

  /**
   * 快速模式匹配
   */
  private quickPatternMatch(preprocessed: PreprocessedQuery): QueryPattern | null {
    for (const pattern of this.commonPatterns) {
      if (pattern.pattern.test(preprocessed.normalized)) {
        return {
          ...pattern,
          confidence: this.calculatePatternConfidence(pattern, preprocessed),
        };
      }
    }

    return null;
  }

  /**
   * 計算模式匹配信心度
   */
  private calculatePatternConfidence(
    pattern: QueryPattern,
    preprocessed: PreprocessedQuery
  ): number {
    let confidence = pattern.confidence;

    // 根據特徵調整信心度
    if (pattern.type === 'comparison' && preprocessed.hasComparisonWords) {
      confidence += 0.1;
    }

    if (pattern.type === 'trend' && preprocessed.hasTimeReference) {
      confidence += 0.1;
    }

    if (preprocessed.hasMetricReference) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  // ============================================================================
  // 私有方法 - AI 深度解析
  // ============================================================================

  /**
   * AI 深度解析
   */
  private async aiDeepParse(
    query: string,
    context?: QueryContext,
    options?: QueryOptions
  ): Promise<QueryIntent> {
    // 構建增強的查詢上下文
    const enhancedQuery = this.buildEnhancedQuery(query, context);
    
    // 呼叫 AI 客戶端
    const aiModel = options?.accuracy === 'high' ? 'claude-3.5-sonnet' : 'gpt-4o';
    const intent = await aiClient.parseQuery(enhancedQuery, aiModel);

    return intent;
  }

  /**
   * 構建增強查詢
   */
  private buildEnhancedQuery(query: string, context?: QueryContext): string {
    let enhancedQuery = query;

    if (context) {
      // 加入上下文資訊
      if (context.currentPage) {
        enhancedQuery += `\n\n[上下文] 當前頁面：${context.currentPage}`;
      }

      if (context.userRole) {
        enhancedQuery += `\n[使用者角色] ${context.userRole}`;
      }

      if (context.previousResult) {
        enhancedQuery += `\n[前一個查詢] 相關的查詢結果存在`;
      }
    }

    return enhancedQuery;
  }

  // ============================================================================
  // 私有方法 - 後處理
  // ============================================================================

  /**
   * 後處理意圖
   */
  private postProcessIntent(
    intent: QueryIntent,
    preprocessed: PreprocessedQuery,
    context?: QueryContext
  ): QueryIntent {
    // 1. 實體後處理
    const processedEntities = this.postProcessEntities(intent.entities, preprocessed);

    // 2. 分類調整
    const adjustedClassification = this.adjustClassification(
      intent.classification,
      processedEntities,
      context
    );

    // 3. 信心度調整
    const adjustedConfidence = this.adjustConfidence(intent, preprocessed);

    return {
      ...intent,
      entities: processedEntities,
      classification: adjustedClassification,
      confidence: adjustedConfidence,
    };
  }

  /**
   * 實體後處理
   */
  private postProcessEntities(
    entities: ExtractedEntity[],
    preprocessed: PreprocessedQuery
  ): ExtractedEntity[] {
    return entities.map(entity => {
      // 標準化實體值
      if (entity.type === 'time_period') {
        entity.normalizedValue = this.normalizeTimeEntity(entity.value);
      } else if (entity.type === 'metric') {
        entity.normalizedValue = this.normalizeMetricEntity(entity.value);
      }

      return entity;
    });
  }

  /**
   * 標準化時間實體
   */
  private normalizeTimeEntity(value: string): string {
    const timeMapping: Record<string, string> = {
      '這個月': 'current_month',
      '上個月': 'previous_month',
      '下個月': 'next_month',
      '今年': 'current_year',
      '去年': 'previous_year',
      '這週': 'current_week',
      '上週': 'previous_week',
      '最近30天': 'last_30_days',
      '過去六個月': 'last_6_months',
    };

    return timeMapping[value] || value;
  }

  /**
   * 標準化指標實體
   */
  private normalizeMetricEntity(value: string): string {
    const metricMapping: Record<string, string> = {
      '營收': 'revenue',
      '銷售額': 'sales',
      '客戶數': 'customer_count',
      '訂單數': 'order_count',
      '轉換率': 'conversion_rate',
      '留存率': 'retention_rate',
      '平均客單價': 'average_order_value',
    };

    return metricMapping[value] || value;
  }

  /**
   * 調整分類
   */
  private adjustClassification(
    classification: QueryClassification,
    entities: ExtractedEntity[],
    context?: QueryContext
  ): QueryClassification {
    // 根據實體調整領域分類
    const metricEntities = entities.filter(e => e.type === 'metric');
    
    if (metricEntities.some(e => ['revenue', 'sales'].includes(e.normalizedValue as string))) {
      classification.domain = 'sales';
    } else if (metricEntities.some(e => ['customer_count', 'retention_rate'].includes(e.normalizedValue as string))) {
      classification.domain = 'customer';
    }

    // 根據上下文調整
    if (context?.currentPage) {
      if (context.currentPage === 'analytics') {
        classification.complexity = 'moderate';
      }
    }

    return classification;
  }

  /**
   * 調整信心度
   */
  private adjustConfidence(intent: QueryIntent, preprocessed: PreprocessedQuery): number {
    let confidence = intent.confidence;

    // 根據預處理特徵調整
    if (preprocessed.hasTimeReference && intent.primary === 'trend') {
      confidence += 0.05;
    }

    if (preprocessed.hasComparisonWords && intent.primary === 'comparison') {
      confidence += 0.05;
    }

    if (preprocessed.hasMetricReference) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  // ============================================================================
  // 私有方法 - 降級處理
  // ============================================================================

  /**
   * 建立降級意圖
   */
  private createFallbackIntent(query: string, error: unknown): QueryIntent {
    console.error('Creating fallback intent due to error:', error);

    return {
      primary: 'query',
      secondary: [],
      confidence: 0.3,
      entities: [
        {
          type: 'entity_name',
          value: query,
          normalizedValue: query,
          confidence: 0.5,
        },
      ],
      classification: {
        domain: 'general',
        timeScope: 'historical',
        complexity: 'simple',
        dataSources: ['firestore'],
      },
      explanation: '查詢解析失敗，使用基本意圖處理',
      rawResponse: `Fallback due to error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  // ============================================================================
  // 私有方法 - 輔助函數
  // ============================================================================

  /**
   * 檢查是否有比較實體
   */
  private hasComparisonEntities(entities: ExtractedEntity[]): boolean {
    return entities.some(e => 
      e.type === 'comparison_operator' || 
      entities.filter(entity => entity.type === 'time_period').length >= 2
    );
  }

  /**
   * 檢查是否有時間實體
   */
  private hasTimeEntities(entities: ExtractedEntity[]): boolean {
    return entities.some(e => e.type === 'time_period' || e.type === 'date_range');
  }

  // ============================================================================
  // 私有方法 - 模式初始化
  // ============================================================================

  /**
   * 初始化常見模式
   */
  private initializeCommonPatterns(): QueryPattern[] {
    return [
      {
        type: 'comparison',
        pattern: /(比較|對比|相比|增長|下降|變化)/,
        confidence: 0.8,
        entities: [
          { type: 'comparison_operator', value: '比較', normalizedValue: 'compare', confidence: 0.9 },
        ],
      },
      {
        type: 'trend',
        pattern: /(趨勢|變化|走勢|發展)/,
        confidence: 0.8,
        entities: [
          { type: 'aggregation', value: '趨勢', normalizedValue: 'trend', confidence: 0.9 },
        ],
      },
      {
        type: 'ranking',
        pattern: /(排名|排序|最高|最低|第一|前|後)/,
        confidence: 0.7,
        entities: [
          { type: 'sort_order', value: '排名', normalizedValue: 'rank', confidence: 0.8 },
        ],
      },
      {
        type: 'aggregate',
        pattern: /(總計|平均|總和|統計|彙總)/,
        confidence: 0.7,
        entities: [
          { type: 'aggregation', value: '統計', normalizedValue: 'aggregate', confidence: 0.8 },
        ],
      },
    ];
  }

  /**
   * 初始化時間模式
   */
  private initializeTimePatterns(): Record<string, string> {
    return {
      '這個月': 'current_month',
      '上個月': 'previous_month',
      '下個月': 'next_month',
      '本月': 'current_month',
      '上月': 'previous_month',
      '今年': 'current_year',
      '去年': 'previous_year',
      '明年': 'next_year',
      '這週': 'current_week',
      '上週': 'previous_week',
      '這季': 'current_quarter',
      '上季': 'previous_quarter',
    };
  }

  /**
   * 初始化指標模式
   */
  private initializeMetricPatterns(): Record<string, string> {
    return {
      '營收': 'revenue',
      '收入': 'revenue',
      '銷售額': 'sales',
      '業績': 'sales',
      '客戶數': 'customer_count',
      '用戶數': 'user_count',
      '訂單數': 'order_count',
      '轉換率': 'conversion_rate',
      '留存率': 'retention_rate',
      '滿意度': 'satisfaction_rate',
    };
  }

  /**
   * 初始化比較模式
   */
  private initializeComparisonPatterns(): Record<string, string> {
    return {
      '比較': 'compare',
      '對比': 'compare',
      '相比': 'compare',
      '增長': 'growth',
      '成長': 'growth',
      '減少': 'decrease',
      '下降': 'decline',
      '提升': 'increase',
      '改善': 'improve',
    };
  }
}

// ============================================================================
// 匯出
// ============================================================================

/**
 * 查詢解析器單例實例
 */
export const queryParser = new QueryParser();

/**
 * 預設匯出
 */
export default queryParser;