/**
 * PRP-124: AI 驅動分析查詢介面 - 實體提取引擎
 * 
 * @description 實體提取和驗證系統，提取時間、數量、人員、類別等業務實體
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import type { 
  ExtractedEntity,
  EntityType,
  TimeRange,
  TimeGranularity
} from '@/docs/types/ai-query-data-models';

// ============================================================================
// 實體模式和規則定義
// ============================================================================

/**
 * 實體模式定義
 */
interface EntityPattern {
  type: EntityType;
  patterns: RegExp[];
  normalizer: (value: string) => unknown;
  validator: (value: unknown) => boolean;
  confidence: number;
  examples: string[];
}

/**
 * 時間實體配置
 */
interface TimeEntityConfig {
  pattern: RegExp;
  resolver: (match: string) => {
    start: Date;
    end: Date;
    granularity: TimeGranularity;
  };
  confidence: number;
}

/**
 * 數值實體配置
 */
interface NumericEntityConfig {
  pattern: RegExp;
  type: 'percentage' | 'currency' | 'count' | 'decimal';
  unit?: string;
  confidence: number;
}

// ============================================================================
// 實體提取引擎
// ============================================================================

/**
 * 實體提取引擎
 * 負責從查詢文字中提取和驗證各種業務實體
 */
export class EntityExtractionEngine {
  private readonly entityPatterns: EntityPattern[];
  private readonly timeConfigs: TimeEntityConfig[];
  private readonly numericConfigs: NumericEntityConfig[];
  private readonly metricMappings: Record<string, string>;
  private readonly dimensionMappings: Record<string, string>;

  constructor() {
    this.entityPatterns = this.initializeEntityPatterns();
    this.timeConfigs = this.initializeTimeConfigs();
    this.numericConfigs = this.initializeNumericConfigs();
    this.metricMappings = this.initializeMetricMappings();
    this.dimensionMappings = this.initializeDimensionMappings();
  }

  /**
   * 提取實體
   * @param text 查詢文字
   * @param context 上下文資訊
   * @returns 提取的實體列表
   */
  extractEntities(
    text: string,
    context?: { 
      userRole?: string;
      currentPage?: string;
      previousEntities?: ExtractedEntity[];
    }
  ): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    try {
      // 1. 基本實體提取
      const basicEntities = this.extractBasicEntities(text);
      entities.push(...basicEntities);

      // 2. 時間實體提取
      const timeEntities = this.extractTimeEntities(text);
      entities.push(...timeEntities);

      // 3. 數值實體提取
      const numericEntities = this.extractNumericEntities(text);
      entities.push(...numericEntities);

      // 4. 指標實體提取
      const metricEntities = this.extractMetricEntities(text);
      entities.push(...metricEntities);

      // 5. 維度實體提取
      const dimensionEntities = this.extractDimensionEntities(text);
      entities.push(...dimensionEntities);

      // 6. 比較運算子提取
      const comparisonEntities = this.extractComparisonEntities(text);
      entities.push(...comparisonEntities);

      // 7. 聚合函數提取
      const aggregationEntities = this.extractAggregationEntities(text);
      entities.push(...aggregationEntities);

      // 8. 上下文增強
      const contextEnhancedEntities = this.enhanceWithContext(entities, context);

      // 9. 去重和驗證
      const validatedEntities = this.validateAndDeduplicate(contextEnhancedEntities, text);

      // 10. 實體關係分析
      const enrichedEntities = this.analyzeEntityRelationships(validatedEntities);

      return enrichedEntities;
    } catch (error) {
      console.error('Entity extraction error:', error);
      return this.createFallbackEntities(text);
    }
  }

  /**
   * 驗證實體
   * @param entities 實體列表
   * @param text 原始文字
   * @returns 驗證結果
   */
  validateEntities(
    entities: ExtractedEntity[],
    text: string
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 檢查實體合理性
    for (const entity of entities) {
      const validation = this.validateSingleEntity(entity, text);
      
      if (!validation.valid) {
        errors.push(`${entity.type} 實體驗證失敗: ${validation.reason}`);
      }

      if (validation.warnings) {
        warnings.push(...validation.warnings);
      }

      if (validation.suggestions) {
        suggestions.push(...validation.suggestions);
      }
    }

    // 檢查實體組合邏輯
    const combinationValidation = this.validateEntityCombinations(entities);
    errors.push(...combinationValidation.errors);
    warnings.push(...combinationValidation.warnings);
    suggestions.push(...combinationValidation.suggestions);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * 標準化實體值
   * @param entity 實體
   * @returns 標準化後的實體
   */
  normalizeEntity(entity: ExtractedEntity): ExtractedEntity {
    const pattern = this.entityPatterns.find(p => p.type === entity.type);
    
    if (pattern) {
      try {
        const normalizedValue = pattern.normalizer(entity.value);
        return {
          ...entity,
          normalizedValue,
        };
      } catch (error) {
        console.warn(`Entity normalization failed for ${entity.type}:`, error);
        return entity;
      }
    }

    return entity;
  }

  // ============================================================================
  // 私有方法 - 基本實體提取
  // ============================================================================

  /**
   * 提取基本實體
   */
  private extractBasicEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    for (const pattern of this.entityPatterns) {
      for (const regex of pattern.patterns) {
        const matches = text.matchAll(new RegExp(regex.source, 'gi'));
        
        for (const match of matches) {
          if (match[0] && match.index !== undefined) {
            try {
              const normalizedValue = pattern.normalizer(match[0]);
              
              if (pattern.validator(normalizedValue)) {
                entities.push({
                  type: pattern.type,
                  value: match[0],
                  normalizedValue,
                  confidence: pattern.confidence,
                  position: {
                    start: match.index,
                    end: match.index + match[0].length,
                  },
                });
              }
            } catch (error) {
              console.warn(`Entity extraction failed for ${pattern.type}:`, error);
            }
          }
        }
      }
    }

    return entities;
  }

  /**
   * 提取時間實體
   */
  private extractTimeEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const now = new Date();

    for (const config of this.timeConfigs) {
      const matches = text.matchAll(new RegExp(config.pattern.source, 'gi'));
      
      for (const match of matches) {
        if (match[0] && match.index !== undefined) {
          try {
            const timeRange = config.resolver(match[0]);
            
            entities.push({
              type: 'time_period',
              value: match[0],
              normalizedValue: {
                start: timeRange.start,
                end: timeRange.end,
                granularity: timeRange.granularity,
              },
              confidence: config.confidence,
              position: {
                start: match.index,
                end: match.index + match[0].length,
              },
              attributes: {
                granularity: timeRange.granularity,
                relative: this.isRelativeTime(match[0]),
              },
            });
          } catch (error) {
            console.warn(`Time entity extraction failed:`, error);
          }
        }
      }
    }

    return entities;
  }

  /**
   * 提取數值實體
   */
  private extractNumericEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    for (const config of this.numericConfigs) {
      const matches = text.matchAll(new RegExp(config.pattern.source, 'gi'));
      
      for (const match of matches) {
        if (match[0] && match.index !== undefined) {
          try {
            const numericValue = this.parseNumericValue(match[0], config.type);
            
            entities.push({
              type: 'threshold',
              value: match[0],
              normalizedValue: numericValue,
              confidence: config.confidence,
              position: {
                start: match.index,
                end: match.index + match[0].length,
              },
              attributes: {
                numericType: config.type,
                unit: config.unit,
              },
            });
          } catch (error) {
            console.warn(`Numeric entity extraction failed:`, error);
          }
        }
      }
    }

    return entities;
  }

  /**
   * 提取指標實體
   */
  private extractMetricEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    Object.entries(this.metricMappings).forEach(([pattern, normalizedName]) => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = text.matchAll(regex);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            type: 'metric',
            value: match[0],
            normalizedValue: normalizedName,
            confidence: 0.9,
            position: {
              start: match.index,
              end: match.index + match[0].length,
            },
            attributes: {
              category: this.categorizeMetric(normalizedName),
            },
          });
        }
      }
    });

    return entities;
  }

  /**
   * 提取維度實體
   */
  private extractDimensionEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    Object.entries(this.dimensionMappings).forEach(([pattern, normalizedName]) => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = text.matchAll(regex);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            type: 'dimension',
            value: match[0],
            normalizedValue: normalizedName,
            confidence: 0.85,
            position: {
              start: match.index,
              end: match.index + match[0].length,
            },
            attributes: {
              category: this.categorizeDimension(normalizedName),
            },
          });
        }
      }
    });

    return entities;
  }

  /**
   * 提取比較運算子實體
   */
  private extractComparisonEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    const comparisonPatterns = [
      { pattern: /比較|對比|相比/gi, normalized: 'compare' },
      { pattern: /增長|成長|提升/gi, normalized: 'increase' },
      { pattern: /減少|下降|降低/gi, normalized: 'decrease' },
      { pattern: /等於|相等/gi, normalized: 'equal' },
      { pattern: /大於|超過|高於/gi, normalized: 'greater_than' },
      { pattern: /小於|低於|少於/gi, normalized: 'less_than' },
      { pattern: /包含|含有/gi, normalized: 'contains' },
    ];

    comparisonPatterns.forEach(({ pattern, normalized }) => {
      const matches = text.matchAll(pattern);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            type: 'comparison_operator',
            value: match[0],
            normalizedValue: normalized,
            confidence: 0.8,
            position: {
              start: match.index,
              end: match.index + match[0].length,
            },
          });
        }
      }
    });

    return entities;
  }

  /**
   * 提取聚合函數實體
   */
  private extractAggregationEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    const aggregationPatterns = [
      { pattern: /總計|總和|合計/gi, normalized: 'sum' },
      { pattern: /平均|平均值/gi, normalized: 'avg' },
      { pattern: /最大|最高|最多/gi, normalized: 'max' },
      { pattern: /最小|最低|最少/gi, normalized: 'min' },
      { pattern: /數量|計數|總數/gi, normalized: 'count' },
      { pattern: /中位數/gi, normalized: 'median' },
      { pattern: /標準差/gi, normalized: 'stddev' },
    ];

    aggregationPatterns.forEach(({ pattern, normalized }) => {
      const matches = text.matchAll(pattern);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            type: 'aggregation',
            value: match[0],
            normalizedValue: normalized,
            confidence: 0.85,
            position: {
              start: match.index,
              end: match.index + match[0].length,
            },
          });
        }
      }
    });

    return entities;
  }

  // ============================================================================
  // 私有方法 - 實體處理和驗證
  // ============================================================================

  /**
   * 上下文增強
   */
  private enhanceWithContext(
    entities: ExtractedEntity[],
    context?: { 
      userRole?: string;
      currentPage?: string;
      previousEntities?: ExtractedEntity[];
    }
  ): ExtractedEntity[] {
    if (!context) return entities;

    return entities.map(entity => {
      let enhancedEntity = { ...entity };

      // 基於使用者角色調整信心度
      if (context.userRole === 'admin' && entity.type === 'metric') {
        enhancedEntity.confidence = Math.min(entity.confidence + 0.05, 1.0);
      }

      // 基於當前頁面調整
      if (context.currentPage === 'analytics' && ['metric', 'aggregation'].includes(entity.type)) {
        enhancedEntity.confidence = Math.min(entity.confidence + 0.05, 1.0);
      }

      // 基於前一個查詢的實體
      if (context.previousEntities) {
        const similarPrevious = context.previousEntities.find(
          prev => prev.type === entity.type && 
                  Math.abs((prev.position?.start || 0) - (entity.position?.start || 0)) < 10
        );
        
        if (similarPrevious) {
          enhancedEntity.confidence = Math.min(entity.confidence + 0.1, 1.0);
        }
      }

      return enhancedEntity;
    });
  }

  /**
   * 驗證和去重
   */
  private validateAndDeduplicate(
    entities: ExtractedEntity[],
    text: string
  ): ExtractedEntity[] {
    // 1. 基本驗證
    const validEntities = entities.filter(entity => {
      const validation = this.validateSingleEntity(entity, text);
      return validation.valid;
    });

    // 2. 按位置排序
    validEntities.sort((a, b) => (a.position?.start || 0) - (b.position?.start || 0));

    // 3. 去重（相同位置的實體只保留信心度最高的）
    const deduplicatedEntities: ExtractedEntity[] = [];
    const usedPositions = new Set<string>();

    for (const entity of validEntities) {
      const positionKey = `${entity.position?.start}-${entity.position?.end}`;
      
      if (!usedPositions.has(positionKey)) {
        deduplicatedEntities.push(entity);
        usedPositions.add(positionKey);
      } else {
        // 如果位置重複，比較信心度
        const existingIndex = deduplicatedEntities.findIndex(
          e => `${e.position?.start}-${e.position?.end}` === positionKey
        );
        
        if (existingIndex !== -1 && entity.confidence > deduplicatedEntities[existingIndex].confidence) {
          deduplicatedEntities[existingIndex] = entity;
        }
      }
    }

    return deduplicatedEntities;
  }

  /**
   * 分析實體關係
   */
  private analyzeEntityRelationships(entities: ExtractedEntity[]): ExtractedEntity[] {
    // 分析時間和指標的關係
    const timeEntities = entities.filter(e => e.type === 'time_period');
    const metricEntities = entities.filter(e => e.type === 'metric');

    // 為每個指標實體加入相關的時間實體
    return entities.map(entity => {
      if (entity.type === 'metric' && timeEntities.length > 0) {
        // 找到最近的時間實體
        const nearestTime = timeEntities.reduce((nearest, current) => {
          const currentDistance = Math.abs((current.position?.start || 0) - (entity.position?.start || 0));
          const nearestDistance = Math.abs((nearest.position?.start || 0) - (entity.position?.start || 0));
          return currentDistance < nearestDistance ? current : nearest;
        });

        return {
          ...entity,
          attributes: {
            ...entity.attributes,
            relatedTimeEntity: nearestTime.normalizedValue,
          },
        };
      }

      return entity;
    });
  }

  /**
   * 驗證單個實體
   */
  private validateSingleEntity(
    entity: ExtractedEntity,
    text: string
  ): {
    valid: boolean;
    reason?: string;
    warnings?: string[];
    suggestions?: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 檢查信心度
    if (entity.confidence < 0.3) {
      return {
        valid: false,
        reason: '信心度過低',
        suggestions: ['請提供更明確的表達'],
      };
    }

    // 檢查實體值是否在原始文字中
    if (!text.toLowerCase().includes(entity.value.toLowerCase())) {
      return {
        valid: false,
        reason: '實體值不在原始文字中',
      };
    }

    // 類型特定驗證
    switch (entity.type) {
      case 'time_period':
        return this.validateTimeEntity(entity);
      
      case 'metric':
        return this.validateMetricEntity(entity);
      
      case 'threshold':
        return this.validateNumericEntity(entity);
      
      default:
        return { valid: true, warnings, suggestions };
    }
  }

  /**
   * 驗證時間實體
   */
  private validateTimeEntity(entity: ExtractedEntity): {
    valid: boolean;
    reason?: string;
    warnings?: string[];
    suggestions?: string[];
  } {
    const timeRange = entity.normalizedValue as any;
    
    if (!timeRange || !timeRange.start || !timeRange.end) {
      return {
        valid: false,
        reason: '時間範圍格式無效',
      };
    }

    const start = new Date(timeRange.start);
    const end = new Date(timeRange.end);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        valid: false,
        reason: '時間格式無效',
      };
    }

    if (start > end) {
      return {
        valid: false,
        reason: '開始時間晚於結束時間',
      };
    }

    return { valid: true };
  }

  /**
   * 驗證指標實體
   */
  private validateMetricEntity(entity: ExtractedEntity): {
    valid: boolean;
    reason?: string;
    warnings?: string[];
    suggestions?: string[];
  } {
    const validMetrics = Object.values(this.metricMappings);
    
    if (!validMetrics.includes(entity.normalizedValue as string)) {
      return {
        valid: false,
        reason: '不支援的指標類型',
        suggestions: [`支援的指標: ${validMetrics.join(', ')}`],
      };
    }

    return { valid: true };
  }

  /**
   * 驗證數值實體
   */
  private validateNumericEntity(entity: ExtractedEntity): {
    valid: boolean;
    reason?: string;
    warnings?: string[];
    suggestions?: string[];
  } {
    const numericValue = entity.normalizedValue as number;
    
    if (typeof numericValue !== 'number' || isNaN(numericValue)) {
      return {
        valid: false,
        reason: '數值格式無效',
      };
    }

    if (numericValue < 0) {
      return {
        valid: true,
        warnings: ['負數值可能不合理'],
      };
    }

    return { valid: true };
  }

  /**
   * 驗證實體組合
   */
  private validateEntityCombinations(entities: ExtractedEntity[]): {
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const entityTypes = entities.map(e => e.type);

    // 檢查比較查詢是否有足夠的時間實體
    if (entityTypes.includes('comparison_operator')) {
      const timeEntities = entities.filter(e => e.type === 'time_period');
      if (timeEntities.length < 2) {
        warnings.push('比較查詢建議包含兩個時間期間');
        suggestions.push('例如：「這個月相比上個月」');
      }
    }

    // 檢查趨勢分析是否有時間實體
    if (entityTypes.includes('aggregation')) {
      const timeEntities = entities.filter(e => e.type === 'time_period');
      if (timeEntities.length === 0) {
        warnings.push('趨勢分析建議指定時間範圍');
        suggestions.push('例如：「過去六個月的趨勢」');
      }
    }

    return { errors, warnings, suggestions };
  }

  // ============================================================================
  // 私有方法 - 輔助函數
  // ============================================================================

  /**
   * 判斷是否為相對時間
   */
  private isRelativeTime(timeText: string): boolean {
    const relativeKeywords = ['這', '上', '下', '本', '前', '後', '最近', '過去'];
    return relativeKeywords.some(keyword => timeText.includes(keyword));
  }

  /**
   * 解析數值
   */
  private parseNumericValue(text: string, type: string): number {
    // 移除非數字字符（保留小數點和負號）
    const cleanText = text.replace(/[^\d.-]/g, '');
    const number = parseFloat(cleanText);

    if (isNaN(number)) {
      throw new Error(`無法解析數值: ${text}`);
    }

    // 根據類型進行轉換
    switch (type) {
      case 'percentage':
        return number / 100; // 轉換為小數
      case 'currency':
        return number;
      case 'count':
        return Math.floor(number); // 整數
      default:
        return number;
    }
  }

  /**
   * 分類指標
   */
  private categorizeMetric(metricName: string): string {
    const categories = {
      sales: ['revenue', 'sales', 'order_count', 'average_order_value'],
      customer: ['customer_count', 'retention_rate', 'satisfaction_rate'],
      marketing: ['conversion_rate', 'click_rate', 'campaign_performance'],
      operations: ['cost', 'efficiency', 'productivity'],
    };

    for (const [category, metrics] of Object.entries(categories)) {
      if (metrics.includes(metricName)) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * 分類維度
   */
  private categorizeDimension(dimensionName: string): string {
    const categories = {
      geographic: ['region', 'city', 'country'],
      demographic: ['age_group', 'gender', 'occupation'],
      temporal: ['quarter', 'month', 'week'],
      product: ['category', 'brand', 'product_line'],
      organizational: ['department', 'team', 'role'],
    };

    for (const [category, dimensions] of Object.entries(categories)) {
      if (dimensions.includes(dimensionName)) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * 建立降級實體
   */
  private createFallbackEntities(text: string): ExtractedEntity[] {
    return [
      {
        type: 'entity_name',
        value: text.slice(0, 20) + (text.length > 20 ? '...' : ''),
        normalizedValue: text,
        confidence: 0.3,
      },
    ];
  }

  // ============================================================================
  // 私有方法 - 配置初始化
  // ============================================================================

  /**
   * 初始化實體模式
   */
  private initializeEntityPatterns(): EntityPattern[] {
    return [
      {
        type: 'entity_name',
        patterns: [/\b[A-Za-z\u4e00-\u9fff]+\b/g],
        normalizer: (value: string) => value.trim(),
        validator: (value: unknown) => typeof value === 'string' && (value as string).length > 0,
        confidence: 0.5,
        examples: ['客戶', '產品', '部門'],
      },
    ];
  }

  /**
   * 初始化時間配置
   */
  private initializeTimeConfigs(): TimeEntityConfig[] {
    const now = new Date();
    
    return [
      {
        pattern: /這個月|本月/gi,
        resolver: () => ({
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          granularity: 'month',
        }),
        confidence: 0.9,
      },
      {
        pattern: /上個月|上月/gi,
        resolver: () => ({
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0),
          granularity: 'month',
        }),
        confidence: 0.9,
      },
      {
        pattern: /今年/gi,
        resolver: () => ({
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31),
          granularity: 'year',
        }),
        confidence: 0.9,
      },
      {
        pattern: /去年/gi,
        resolver: () => ({
          start: new Date(now.getFullYear() - 1, 0, 1),
          end: new Date(now.getFullYear() - 1, 11, 31),
          granularity: 'year',
        }),
        confidence: 0.9,
      },
      {
        pattern: /過去(\d+)個月/gi,
        resolver: (match: string) => {
          const monthsMatch = match.match(/\d+/);
          const months = monthsMatch ? parseInt(monthsMatch[0]) : 1;
          return {
            start: new Date(now.getFullYear(), now.getMonth() - months, 1),
            end: now,
            granularity: 'month',
          };
        },
        confidence: 0.85,
      },
      {
        pattern: /最近(\d+)天/gi,
        resolver: (match: string) => {
          const daysMatch = match.match(/\d+/);
          const days = daysMatch ? parseInt(daysMatch[0]) : 7;
          const start = new Date(now);
          start.setDate(start.getDate() - days);
          return {
            start,
            end: now,
            granularity: 'day',
          };
        },
        confidence: 0.85,
      },
    ];
  }

  /**
   * 初始化數值配置
   */
  private initializeNumericConfigs(): NumericEntityConfig[] {
    return [
      {
        pattern: /(\d+(?:\.\d+)?)\s*%/gi,
        type: 'percentage',
        confidence: 0.9,
      },
      {
        pattern: /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
        type: 'currency',
        unit: 'USD',
        confidence: 0.9,
      },
      {
        pattern: /(\d+(?:,\d{3})*)\s*元/gi,
        type: 'currency',
        unit: 'TWD',
        confidence: 0.9,
      },
      {
        pattern: /(\d+(?:,\d{3})*)/gi,
        type: 'count',
        confidence: 0.7,
      },
    ];
  }

  /**
   * 初始化指標映射
   */
  private initializeMetricMappings(): Record<string, string> {
    return {
      '營收': 'revenue',
      '收入': 'revenue',
      '銷售額': 'sales',
      '業績': 'sales',
      '銷量': 'sales_volume',
      '客戶數': 'customer_count',
      '客戶數量': 'customer_count',
      '用戶數': 'user_count',
      '會員數': 'member_count',
      '訂單數': 'order_count',
      '訂單量': 'order_count',
      '轉換率': 'conversion_rate',
      '留存率': 'retention_rate',
      '滿意度': 'satisfaction_rate',
      '平均客單價': 'average_order_value',
      '客單價': 'average_order_value',
      '利潤': 'profit',
      '成本': 'cost',
      '點擊率': 'click_rate',
      '開信率': 'open_rate',
    };
  }

  /**
   * 初始化維度映射
   */
  private initializeDimensionMappings(): Record<string, string> {
    return {
      '地區': 'region',
      '區域': 'region',
      '城市': 'city',
      '國家': 'country',
      '部門': 'department',
      '團隊': 'team',
      '產品': 'product',
      '產品線': 'product_line',
      '類別': 'category',
      '分類': 'category',
      '品牌': 'brand',
      '管道': 'channel',
      '通路': 'channel',
      '來源': 'source',
      '年齡': 'age_group',
      '性別': 'gender',
      '職業': 'occupation',
    };
  }
}

// ============================================================================
// 匯出
// ============================================================================

/**
 * 實體提取引擎單例實例
 */
export const entityExtractionEngine = new EntityExtractionEngine();

/**
 * 預設匯出
 */
export default entityExtractionEngine;