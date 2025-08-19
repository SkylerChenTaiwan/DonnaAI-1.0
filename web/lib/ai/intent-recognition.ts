/**
 * PRP-124: AI 驅動分析查詢介面 - 意圖識別引擎
 * 
 * @description 查詢意圖識別和分類系統，定義常見業務查詢模式和範本
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import type { 
  IntentType,
  QueryIntent,
  QueryClassification,
  ExtractedEntity,
  RecognizedIntent,
  IntentRecognition,
  SentimentAnalysis
} from '@/docs/types/ai-query-data-models';

// ============================================================================
// 意圖模式和範本定義
// ============================================================================

/**
 * 意圖模式定義
 */
interface IntentPattern {
  id: string;
  type: IntentType;
  priority: number;
  patterns: string[];
  keywords: string[];
  entities: string[];
  examples: string[];
  confidence: number;
  domain: string;
}

/**
 * 意圖分類規則
 */
interface ClassificationRule {
  condition: (entities: ExtractedEntity[], text: string) => boolean;
  classification: Partial<QueryClassification>;
  confidence: number;
}

/**
 * 情境模式
 */
interface ContextPattern {
  context: string;
  intents: IntentType[];
  boost: number;
}

// ============================================================================
// 意圖識別引擎
// ============================================================================

/**
 * 意圖識別引擎
 * 負責識別查詢的業務意圖和分類
 */
export class IntentRecognitionEngine {
  private readonly intentPatterns: IntentPattern[];
  private readonly classificationRules: ClassificationRule[];
  private readonly contextPatterns: ContextPattern[];
  private readonly sentimentKeywords: Record<string, number>;

  constructor() {
    this.intentPatterns = this.initializeIntentPatterns();
    this.classificationRules = this.initializeClassificationRules();
    this.contextPatterns = this.initializeContextPatterns();
    this.sentimentKeywords = this.initializeSentimentKeywords();
  }

  /**
   * 識別查詢意圖
   * @param text 查詢文字
   * @param entities 提取的實體
   * @param context 上下文資訊
   * @returns 意圖識別結果
   */
  recognizeIntent(
    text: string,
    entities: ExtractedEntity[],
    context?: string
  ): IntentRecognition {
    // 1. 基本意圖識別
    const recognizedIntents = this.matchIntentPatterns(text, entities);

    // 2. 上下文增強
    const contextEnhancedIntents = this.enhanceWithContext(recognizedIntents, context);

    // 3. 實體驗證
    const validatedIntents = this.validateWithEntities(contextEnhancedIntents, entities);

    // 4. 情感分析
    const sentiment = this.analyzeSentiment(text);

    // 5. 語言檢測
    const language = this.detectLanguage(text);

    // 6. 計算最終信心度
    const confidence = this.calculateOverallConfidence(validatedIntents, entities, text);

    return {
      intents: validatedIntents,
      entities,
      sentiment,
      language,
      confidence,
    };
  }

  /**
   * 分類查詢
   * @param intent 主要意圖
   * @param entities 實體列表
   * @param text 原始文字
   * @returns 查詢分類
   */
  classifyQuery(
    intent: IntentType,
    entities: ExtractedEntity[],
    text: string
  ): QueryClassification {
    let classification: QueryClassification = {
      domain: 'general',
      timeScope: 'historical',
      complexity: 'simple',
      dataSources: ['firestore'],
    };

    // 應用分類規則
    for (const rule of this.classificationRules) {
      if (rule.condition(entities, text)) {
        classification = {
          ...classification,
          ...rule.classification,
        };
        break;
      }
    }

    // 根據意圖調整分類
    classification = this.adjustClassificationByIntent(classification, intent);

    // 根據實體調整分類
    classification = this.adjustClassificationByEntities(classification, entities);

    return classification;
  }

  /**
   * 獲取意圖建議
   * @param partialText 部分輸入文字
   * @param context 上下文
   * @returns 建議的意圖和查詢
   */
  getSuggestions(
    partialText: string,
    context?: string
  ): Array<{
    intent: IntentType;
    suggestedQuery: string;
    confidence: number;
    category: string;
  }> {
    const suggestions: Array<{
      intent: IntentType;
      suggestedQuery: string;
      confidence: number;
      category: string;
    }> = [];

    // 1. 基於部分文字匹配意圖模式
    const matchingPatterns = this.intentPatterns.filter(pattern =>
      pattern.keywords.some(keyword =>
        keyword.includes(partialText.toLowerCase()) ||
        partialText.toLowerCase().includes(keyword)
      )
    );

    // 2. 生成建議
    matchingPatterns
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .forEach(pattern => {
        const example = this.selectBestExample(pattern, partialText);
        suggestions.push({
          intent: pattern.type,
          suggestedQuery: example,
          confidence: this.calculateSuggestionConfidence(pattern, partialText),
          category: pattern.domain,
        });
      });

    // 3. 上下文相關建議
    if (context) {
      const contextSuggestions = this.getContextualSuggestions(context, partialText);
      suggestions.push(...contextSuggestions);
    }

    // 4. 排序和去重
    return this.deduplicateAndSort(suggestions);
  }

  // ============================================================================
  // 私有方法 - 意圖匹配
  // ============================================================================

  /**
   * 匹配意圖模式
   */
  private matchIntentPatterns(
    text: string,
    entities: ExtractedEntity[]
  ): RecognizedIntent[] {
    const recognizedIntents: RecognizedIntent[] = [];
    const normalizedText = text.toLowerCase();

    for (const pattern of this.intentPatterns) {
      let score = 0;
      const parameters: Record<string, unknown> = {};

      // 1. 關鍵字匹配
      const keywordMatches = pattern.keywords.filter(keyword =>
        normalizedText.includes(keyword)
      );
      score += keywordMatches.length * 0.3;

      // 2. 模式匹配
      const patternMatches = pattern.patterns.filter(p =>
        new RegExp(p, 'i').test(normalizedText)
      );
      score += patternMatches.length * 0.4;

      // 3. 實體匹配
      const entityMatches = entities.filter(entity =>
        pattern.entities.includes(entity.type)
      );
      score += entityMatches.length * 0.3;

      // 4. 計算信心度
      const confidence = Math.min(score * pattern.confidence, 1.0);

      if (confidence > 0.3) {
        // 提取參數
        entityMatches.forEach(entity => {
          parameters[entity.type] = entity.normalizedValue;
        });

        recognizedIntents.push({
          name: pattern.id,
          confidence,
          parameters,
        });
      }
    }

    return recognizedIntents.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 上下文增強
   */
  private enhanceWithContext(
    intents: RecognizedIntent[],
    context?: string
  ): RecognizedIntent[] {
    if (!context) return intents;

    const contextPattern = this.contextPatterns.find(cp => cp.context === context);
    if (!contextPattern) return intents;

    return intents.map(intent => {
      const pattern = this.intentPatterns.find(p => p.id === intent.name);
      if (pattern && contextPattern.intents.includes(pattern.type)) {
        return {
          ...intent,
          confidence: Math.min(intent.confidence + contextPattern.boost, 1.0),
        };
      }
      return intent;
    });
  }

  /**
   * 實體驗證
   */
  private validateWithEntities(
    intents: RecognizedIntent[],
    entities: ExtractedEntity[]
  ): RecognizedIntent[] {
    return intents.map(intent => {
      const pattern = this.intentPatterns.find(p => p.id === intent.name);
      if (!pattern) return intent;

      // 檢查必需的實體是否存在
      const requiredEntities = pattern.entities;
      const presentEntities = entities.map(e => e.type);
      
      const hasRequiredEntities = requiredEntities.every(required =>
        presentEntities.includes(required)
      );

      let adjustedConfidence = intent.confidence;
      
      if (!hasRequiredEntities) {
        // 缺少必需實體，降低信心度
        adjustedConfidence *= 0.7;
      } else {
        // 有所需實體，提高信心度
        adjustedConfidence = Math.min(adjustedConfidence * 1.1, 1.0);
      }

      return {
        ...intent,
        confidence: adjustedConfidence,
      };
    });
  }

  // ============================================================================
  // 私有方法 - 分類調整
  // ============================================================================

  /**
   * 根據意圖調整分類
   */
  private adjustClassificationByIntent(
    classification: QueryClassification,
    intent: IntentType
  ): QueryClassification {
    switch (intent) {
      case 'prediction':
        return { ...classification, timeScope: 'predictive', complexity: 'complex' };
      
      case 'correlation':
      case 'anomaly':
        return { ...classification, complexity: 'complex' };
      
      case 'trend':
        return { ...classification, complexity: 'moderate', timeScope: 'historical' };
      
      case 'comparison':
        return { ...classification, complexity: 'moderate' };
      
      default:
        return classification;
    }
  }

  /**
   * 根據實體調整分類
   */
  private adjustClassificationByEntities(
    classification: QueryClassification,
    entities: ExtractedEntity[]
  ): QueryClassification {
    let adjustedClassification = { ...classification };

    // 根據指標實體確定領域
    const metricEntities = entities.filter(e => e.type === 'metric');
    for (const metric of metricEntities) {
      const normalizedValue = metric.normalizedValue as string;
      
      if (['revenue', 'sales', 'order_count'].includes(normalizedValue)) {
        adjustedClassification.domain = 'sales';
      } else if (['customer_count', 'retention_rate'].includes(normalizedValue)) {
        adjustedClassification.domain = 'customer';
      } else if (['conversion_rate', 'campaign_performance'].includes(normalizedValue)) {
        adjustedClassification.domain = 'marketing';
      }
    }

    // 根據時間實體確定時間範圍
    const timeEntities = entities.filter(e => e.type === 'time_period' || e.type === 'date_range');
    if (timeEntities.length > 0) {
      const hasCurrentTime = timeEntities.some(e => 
        (e.normalizedValue as string).includes('current')
      );
      
      if (hasCurrentTime) {
        adjustedClassification.timeScope = 'realtime';
      }
    }

    // 根據實體數量確定複雜度
    if (entities.length > 5) {
      adjustedClassification.complexity = 'complex';
    } else if (entities.length > 2) {
      adjustedClassification.complexity = 'moderate';
    }

    return adjustedClassification;
  }

  // ============================================================================
  // 私有方法 - 情感和語言分析
  // ============================================================================

  /**
   * 情感分析
   */
  private analyzeSentiment(text: string): SentimentAnalysis {
    let score = 0;
    const normalizedText = text.toLowerCase();

    // 計算情感分數
    Object.entries(this.sentimentKeywords).forEach(([keyword, weight]) => {
      if (normalizedText.includes(keyword)) {
        score += weight;
      }
    });

    // 正規化分數到 -1 到 1 之間
    score = Math.max(-1, Math.min(1, score / 3));

    let sentiment: 'positive' | 'neutral' | 'negative';
    if (score > 0.1) {
      sentiment = 'positive';
    } else if (score < -0.1) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }

    return {
      sentiment,
      score,
      emotions: this.extractEmotions(text),
    };
  }

  /**
   * 提取情緒標籤
   */
  private extractEmotions(text: string): string[] {
    const emotions: string[] = [];
    const normalizedText = text.toLowerCase();

    const emotionPatterns = {
      '焦慮': ['急', '快', '趕緊', '立即'],
      '好奇': ['為什麼', '怎麼', '原因', '瞭解'],
      '滿意': ['好', '棒', '優秀', '滿意'],
      '擔心': ['擔心', '憂慮', '問題', '異常'],
    };

    Object.entries(emotionPatterns).forEach(([emotion, patterns]) => {
      if (patterns.some(pattern => normalizedText.includes(pattern))) {
        emotions.push(emotion);
      }
    });

    return emotions;
  }

  /**
   * 語言檢測
   */
  private detectLanguage(text: string): string {
    const chineseCharCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const totalCharCount = text.length;

    if (chineseCharCount / totalCharCount > 0.3) {
      return 'zh-TW';
    }

    return 'en-US';
  }

  // ============================================================================
  // 私有方法 - 建議生成
  // ============================================================================

  /**
   * 選擇最佳範例
   */
  private selectBestExample(pattern: IntentPattern, partialText: string): string {
    // 找到最相似的範例
    let bestExample = pattern.examples[0];
    let bestScore = 0;

    for (const example of pattern.examples) {
      const score = this.calculateSimilarity(partialText, example);
      if (score > bestScore) {
        bestScore = score;
        bestExample = example;
      }
    }

    return bestExample;
  }

  /**
   * 計算文字相似度
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const shorter = text1.length < text2.length ? text1 : text2;
    const longer = text1.length < text2.length ? text2 : text1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(shorter, longer);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 計算編輯距離
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 計算建議信心度
   */
  private calculateSuggestionConfidence(pattern: IntentPattern, partialText: string): number {
    let confidence = pattern.confidence * 0.8; // 基礎信心度

    // 根據文字匹配度調整
    const matchingKeywords = pattern.keywords.filter(keyword =>
      keyword.includes(partialText.toLowerCase()) ||
      partialText.toLowerCase().includes(keyword)
    );

    confidence += (matchingKeywords.length / pattern.keywords.length) * 0.2;

    return Math.min(confidence, 1.0);
  }

  /**
   * 獲取上下文相關建議
   */
  private getContextualSuggestions(
    context: string,
    partialText: string
  ): Array<{
    intent: IntentType;
    suggestedQuery: string;
    confidence: number;
    category: string;
  }> {
    const contextPattern = this.contextPatterns.find(cp => cp.context === context);
    if (!contextPattern) return [];

    const suggestions: Array<{
      intent: IntentType;
      suggestedQuery: string;
      confidence: number;
      category: string;
    }> = [];

    contextPattern.intents.forEach(intent => {
      const pattern = this.intentPatterns.find(p => p.type === intent);
      if (pattern) {
        const example = this.selectBestExample(pattern, partialText);
        suggestions.push({
          intent,
          suggestedQuery: example,
          confidence: pattern.confidence + contextPattern.boost,
          category: pattern.domain,
        });
      }
    });

    return suggestions;
  }

  /**
   * 去重和排序建議
   */
  private deduplicateAndSort(
    suggestions: Array<{
      intent: IntentType;
      suggestedQuery: string;
      confidence: number;
      category: string;
    }>
  ): Array<{
    intent: IntentType;
    suggestedQuery: string;
    confidence: number;
    category: string;
  }> {
    // 去重（基於查詢文字）
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.suggestedQuery === suggestion.suggestedQuery)
    );

    // 按信心度排序
    return uniqueSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8); // 限制數量
  }

  // ============================================================================
  // 私有方法 - 計算整體信心度
  // ============================================================================

  /**
   * 計算整體信心度
   */
  private calculateOverallConfidence(
    intents: RecognizedIntent[],
    entities: ExtractedEntity[],
    text: string
  ): number {
    if (intents.length === 0) return 0.0;

    // 取最高信心度意圖的信心度作為基準
    let confidence = intents[0].confidence;

    // 根據實體數量調整
    if (entities.length > 0) {
      confidence = Math.min(confidence + (entities.length * 0.05), 1.0);
    }

    // 根據文字長度調整
    if (text.length < 5) {
      confidence *= 0.8; // 太短的查詢降低信心度
    }

    return confidence;
  }

  // ============================================================================
  // 私有方法 - 初始化配置
  // ============================================================================

  /**
   * 初始化意圖模式
   */
  private initializeIntentPatterns(): IntentPattern[] {
    return [
      {
        id: 'sales_query',
        type: 'query',
        priority: 1,
        patterns: ['銷售', '營收', '業績'],
        keywords: ['銷售額', '營收', '收入', '業績', '總計'],
        entities: ['metric'],
        examples: [
          '這個月的銷售額是多少？',
          '查詢本季營收總計',
          '顯示年度業績數據',
        ],
        confidence: 0.9,
        domain: 'sales',
      },
      {
        id: 'sales_comparison',
        type: 'comparison',
        priority: 2,
        patterns: ['比較.*銷售', '.*增長.*', '.*vs.*'],
        keywords: ['比較', '對比', '增長', '下降', '變化', '同比'],
        entities: ['metric', 'time_period', 'comparison_operator'],
        examples: [
          '這個月銷售額比上個月增長多少？',
          '比較今年和去年的營收',
          '各地區銷售表現對比',
        ],
        confidence: 0.85,
        domain: 'sales',
      },
      {
        id: 'trend_analysis',
        type: 'trend',
        priority: 3,
        patterns: ['趨勢', '走勢', '變化.*時間'],
        keywords: ['趨勢', '走勢', '發展', '變化', '過去', '歷史'],
        entities: ['metric', 'time_period'],
        examples: [
          '顯示過去六個月的銷售趨勢',
          '客戶數量變化走勢',
          '營收增長趨勢分析',
        ],
        confidence: 0.8,
        domain: 'general',
      },
      {
        id: 'ranking_analysis',
        type: 'ranking',
        priority: 4,
        patterns: ['排名', '排序', '最.*', '前.*', '後.*'],
        keywords: ['排名', '排序', '最高', '最低', '第一', '前', '後', 'top'],
        entities: ['metric', 'sort_order'],
        examples: [
          '銷售人員業績排名',
          '產品銷量前十名',
          '客戶滿意度最高的地區',
        ],
        confidence: 0.8,
        domain: 'general',
      },
      {
        id: 'customer_analysis',
        type: 'query',
        priority: 5,
        patterns: ['客戶', '用戶', '會員'],
        keywords: ['客戶', '用戶', '會員', '人數', '數量'],
        entities: ['metric'],
        examples: [
          '本月新增客戶數量',
          '活躍用戶統計',
          '會員留存率分析',
        ],
        confidence: 0.85,
        domain: 'customer',
      },
      {
        id: 'prediction_analysis',
        type: 'prediction',
        priority: 6,
        patterns: ['預測', '預估', '預期', '未來'],
        keywords: ['預測', '預估', '預期', '未來', '下個月', '下季', '明年'],
        entities: ['metric', 'time_period'],
        examples: [
          '預測下季度營收',
          '估算未來客戶增長',
          '預期銷售目標達成率',
        ],
        confidence: 0.7,
        domain: 'general',
      },
      {
        id: 'anomaly_detection',
        type: 'anomaly',
        priority: 7,
        patterns: ['異常', '問題', '突然', '異常'],
        keywords: ['異常', '問題', '奇怪', '突然', '異常', '不正常'],
        entities: ['metric'],
        examples: [
          '找出銷售異常的地區',
          '檢測客戶流失異常',
          '發現業績突然下降的原因',
        ],
        confidence: 0.75,
        domain: 'general',
      },
    ];
  }

  /**
   * 初始化分類規則
   */
  private initializeClassificationRules(): ClassificationRule[] {
    return [
      {
        condition: (entities, text) => 
          entities.some(e => e.type === 'metric' && ['revenue', 'sales'].includes(e.normalizedValue as string)),
        classification: { domain: 'sales' },
        confidence: 0.9,
      },
      {
        condition: (entities, text) => 
          entities.some(e => e.type === 'metric' && ['customer_count', 'retention_rate'].includes(e.normalizedValue as string)),
        classification: { domain: 'customer' },
        confidence: 0.9,
      },
      {
        condition: (entities, text) => 
          text.includes('預測') || text.includes('未來'),
        classification: { timeScope: 'predictive', complexity: 'complex' },
        confidence: 0.8,
      },
      {
        condition: (entities, text) => 
          entities.length > 4,
        classification: { complexity: 'complex' },
        confidence: 0.7,
      },
      {
        condition: (entities, text) => 
          entities.some(e => e.type === 'time_period' && (e.normalizedValue as string).includes('current')),
        classification: { timeScope: 'realtime' },
        confidence: 0.8,
      },
    ];
  }

  /**
   * 初始化上下文模式
   */
  private initializeContextPatterns(): ContextPattern[] {
    return [
      {
        context: 'dashboard',
        intents: ['query', 'comparison', 'trend'],
        boost: 0.1,
      },
      {
        context: 'analytics',
        intents: ['trend', 'correlation', 'anomaly'],
        boost: 0.15,
      },
      {
        context: 'reports',
        intents: ['aggregate', 'ranking', 'comparison'],
        boost: 0.1,
      },
    ];
  }

  /**
   * 初始化情感關鍵字
   */
  private initializeSentimentKeywords(): Record<string, number> {
    return {
      // 正面情感
      '好': 0.3,
      '棒': 0.4,
      '優秀': 0.5,
      '滿意': 0.4,
      '成功': 0.5,
      '增長': 0.3,
      '提升': 0.3,
      '改善': 0.4,

      // 負面情感
      '問題': -0.4,
      '錯誤': -0.5,
      '失敗': -0.6,
      '下降': -0.3,
      '減少': -0.3,
      '異常': -0.4,
      '擔心': -0.4,
      '糟糕': -0.5,

      // 中性但有語氣的詞
      '急': 0.1,
      '快': 0.1,
      '立即': 0.1,
      '馬上': 0.1,
    };
  }
}

// ============================================================================
// 匯出
// ============================================================================

/**
 * 意圖識別引擎單例實例
 */
export const intentRecognitionEngine = new IntentRecognitionEngine();

/**
 * 預設匯出
 */
export default intentRecognitionEngine;