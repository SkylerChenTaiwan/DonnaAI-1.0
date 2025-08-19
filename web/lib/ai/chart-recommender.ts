/**
 * PRP-124: AI 驅動分析查詢介面 - 圖表推薦引擎
 * 
 * @description 圖表推薦系統，根據資料特性推薦最適合的圖表類型，生成圖表配置和樣式
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import type {
  ChartType,
  ChartConfig,
  ChartRecommendation,
  RecommendedChart,
  QueryData,
  QueryIntent,
  ExtractedEntity,
  DataBinding,
  ChartStyling,
  ChartInteractions,
  AnimationConfig,
  AxisBinding,
  SeriesBinding
} from '@/docs/types/ai-query-data-models';

// ============================================================================
// 圖表推薦規則和配置
// ============================================================================

/**
 * 圖表推薦規則
 */
interface ChartRule {
  id: string;
  conditions: ChartCondition[];
  recommendedChart: ChartType;
  confidence: number;
  reasoning: string;
  alternatives: ChartType[];
  dataRequirements: {
    minRows: number;
    maxRows: number;
    requiredColumns: string[];
    optionalColumns: string[];
  };
}

/**
 * 圖表條件
 */
interface ChartCondition {
  type: 'data_structure' | 'data_type' | 'intent' | 'column_count' | 'row_count' | 'entity_type';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'exists';
  value: any;
  weight: number;
}

/**
 * 資料分析結果
 */
interface DataAnalysis {
  structure: 'time_series' | 'categorical' | 'numerical' | 'mixed' | 'hierarchical';
  dimensions: number;
  measures: number;
  timeColumns: string[];
  categoricalColumns: string[];
  numericalColumns: string[];
  rowCount: number;
  patterns: DataPattern[];
  trends: TrendInfo[];
}

/**
 * 資料模式
 */
interface DataPattern {
  type: 'trend' | 'seasonal' | 'cyclical' | 'correlation' | 'distribution' | 'outlier';
  confidence: number;
  description: string;
  affectedColumns: string[];
}

/**
 * 趨勢資訊
 */
interface TrendInfo {
  column: string;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  strength: number;
  seasonality: boolean;
}

// ============================================================================
// 圖表推薦引擎
// ============================================================================

/**
 * 圖表推薦引擎
 * 根據資料特性和查詢意圖推薦最適合的圖表類型
 */
export class ChartRecommendationEngine {
  private readonly chartRules: ChartRule[];
  private readonly chartTemplates: Record<ChartType, ChartConfig>;
  private readonly colorSchemes: Record<string, string[]>;

  constructor() {
    this.chartRules = this.initializeChartRules();
    this.chartTemplates = this.initializeChartTemplates();
    this.colorSchemes = this.initializeColorSchemes();
  }

  /**
   * 推薦圖表
   * @param data 查詢資料
   * @param intent 查詢意圖
   * @param preferences 使用者偏好
   * @returns 圖表推薦結果
   */
  recommendChart(
    data: QueryData,
    intent: QueryIntent,
    preferences?: {
      preferredChartTypes?: ChartType[];
      colorScheme?: string;
      theme?: 'light' | 'dark';
      accessibility?: boolean;
    }
  ): ChartRecommendation {
    try {
      // 1. 分析資料結構
      const dataAnalysis = this.analyzeData(data);
      
      // 2. 評估所有圖表類型
      const chartScores = this.evaluateChartTypes(data, intent, dataAnalysis);
      
      // 3. 應用使用者偏好
      const adjustedScores = this.applyUserPreferences(chartScores, preferences);
      
      // 4. 排序並選擇最佳推薦
      const sortedCharts = this.sortAndFilterRecommendations(adjustedScores);
      
      // 5. 生成詳細配置
      const recommendations = this.generateDetailedRecommendations(
        sortedCharts,
        data,
        intent,
        dataAnalysis,
        preferences
      );

      // 6. 計算總體信心度
      const overallConfidence = this.calculateOverallConfidence(
        recommendations,
        dataAnalysis,
        intent
      );

      return {
        primary: recommendations[0],
        alternatives: recommendations.slice(1, 4),
        reasoning: this.generateReasoning(recommendations[0], dataAnalysis, intent),
        confidence: overallConfidence,
      };
    } catch (error) {
      console.error('Chart recommendation failed:', error);
      return this.createFallbackRecommendation(data, intent);
    }
  }

  /**
   * 生成圖表配置
   * @param chartType 圖表類型
   * @param data 資料
   * @param intent 查詢意圖
   * @param customization 自訂設定
   * @returns 完整的圖表配置
   */
  generateChartConfig(
    chartType: ChartType,
    data: QueryData,
    intent: QueryIntent,
    customization?: {
      title?: string;
      colorScheme?: string;
      theme?: 'light' | 'dark';
      interactive?: boolean;
      animated?: boolean;
    }
  ): ChartConfig {
    try {
      // 1. 獲取基礎模板
      const baseTemplate = this.chartTemplates[chartType];
      
      // 2. 分析資料以生成資料綁定
      const dataBinding = this.generateDataBinding(chartType, data, intent);
      
      // 3. 生成樣式配置
      const styling = this.generateStyling(chartType, customization);
      
      // 4. 生成互動配置
      const interactions = this.generateInteractions(chartType, data, customization);
      
      // 5. 生成動畫配置
      const animations = this.generateAnimations(chartType, customization);
      
      // 6. 生成標題
      const title = customization?.title || this.generateTitle(intent, data);

      return {
        type: chartType,
        title,
        dataBinding,
        styling,
        interactions,
        animations,
        custom: {
          responsive: true,
          exportable: true,
          tooltipEnabled: true,
        },
      };
    } catch (error) {
      console.error('Chart config generation failed:', error);
      return this.createFallbackConfig(chartType, data);
    }
  }

  /**
   * 驗證圖表適合性
   * @param chartType 圖表類型
   * @param data 資料
   * @returns 驗證結果
   */
  validateChartSuitability(
    chartType: ChartType,
    data: QueryData
  ): {
    suitable: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    const analysis = this.analyzeData(data);
    const rule = this.chartRules.find(r => r.recommendedChart === chartType);
    
    if (!rule) {
      return {
        suitable: false,
        score: 0,
        issues: ['不支援的圖表類型'],
        suggestions: ['請選擇其他圖表類型'],
      };
    }

    let score = 0;

    // 檢查資料需求
    if (data.rows.length < rule.dataRequirements.minRows) {
      issues.push(`資料量不足，至少需要 ${rule.dataRequirements.minRows} 筆記錄`);
      score -= 0.3;
    }

    if (data.rows.length > rule.dataRequirements.maxRows) {
      issues.push(`資料量過多，建議少於 ${rule.dataRequirements.maxRows} 筆記錄`);
      score -= 0.2;
      suggestions.push('考慮使用資料分頁或聚合');
    }

    // 檢查必要欄位
    const availableColumns = data.columns.map(c => c.name);
    const missingRequired = rule.dataRequirements.requiredColumns.filter(
      col => !availableColumns.includes(col)
    );

    if (missingRequired.length > 0) {
      issues.push(`缺少必要欄位: ${missingRequired.join(', ')}`);
      score -= 0.4;
    }

    // 檢查圖表特定條件
    const chartValidation = this.validateChartSpecificConditions(chartType, analysis);
    issues.push(...chartValidation.issues);
    suggestions.push(...chartValidation.suggestions);
    score += chartValidation.scoreAdjustment;

    // 計算最終分數
    const finalScore = Math.max(0, Math.min(1, 0.8 + score));

    return {
      suitable: finalScore > 0.5 && issues.length === 0,
      score: finalScore,
      issues,
      suggestions,
    };
  }

  // ============================================================================
  // 私有方法 - 資料分析
  // ============================================================================

  /**
   * 分析資料結構
   */
  private analyzeData(data: QueryData): DataAnalysis {
    const timeColumns: string[] = [];
    const categoricalColumns: string[] = [];
    const numericalColumns: string[] = [];

    // 分析欄位類型
    data.columns.forEach(column => {
      switch (column.type) {
        case 'date':
          timeColumns.push(column.name);
          break;
        case 'number':
          numericalColumns.push(column.name);
          break;
        case 'string':
          categoricalColumns.push(column.name);
          break;
      }
    });

    // 判斷資料結構
    let structure: DataAnalysis['structure'] = 'mixed';
    if (timeColumns.length > 0 && numericalColumns.length > 0) {
      structure = 'time_series';
    } else if (categoricalColumns.length > 0 && numericalColumns.length > 0) {
      structure = 'categorical';
    } else if (numericalColumns.length >= 2) {
      structure = 'numerical';
    }

    // 分析模式和趨勢
    const patterns = this.detectDataPatterns(data, timeColumns, numericalColumns);
    const trends = this.analyzeTrends(data, timeColumns, numericalColumns);

    return {
      structure,
      dimensions: categoricalColumns.length + timeColumns.length,
      measures: numericalColumns.length,
      timeColumns,
      categoricalColumns,
      numericalColumns,
      rowCount: data.rows.length,
      patterns,
      trends,
    };
  }

  /**
   * 檢測資料模式
   */
  private detectDataPatterns(
    data: QueryData,
    timeColumns: string[],
    numericalColumns: string[]
  ): DataPattern[] {
    const patterns: DataPattern[] = [];

    // 檢測趨勢模式
    if (timeColumns.length > 0 && numericalColumns.length > 0) {
      patterns.push({
        type: 'trend',
        confidence: 0.8,
        description: '包含時間序列資料，適合趨勢分析',
        affectedColumns: [...timeColumns, ...numericalColumns],
      });
    }

    // 檢測相關性模式
    if (numericalColumns.length >= 2) {
      patterns.push({
        type: 'correlation',
        confidence: 0.6,
        description: '多個數值欄位，可能存在相關性',
        affectedColumns: numericalColumns,
      });
    }

    // 檢測分布模式
    if (data.rows.length > 20 && numericalColumns.length > 0) {
      patterns.push({
        type: 'distribution',
        confidence: 0.7,
        description: '資料量充足，適合分析數值分布',
        affectedColumns: numericalColumns,
      });
    }

    return patterns;
  }

  /**
   * 分析趨勢
   */
  private analyzeTrends(
    data: QueryData,
    timeColumns: string[],
    numericalColumns: string[]
  ): TrendInfo[] {
    const trends: TrendInfo[] = [];

    if (timeColumns.length === 0 || numericalColumns.length === 0) {
      return trends;
    }

    numericalColumns.forEach(column => {
      // 簡化的趨勢分析（實際應用中可以使用更複雜的統計方法）
      const values = data.rows
        .map(row => row[column] as number)
        .filter(val => typeof val === 'number' && !isNaN(val));

      if (values.length < 3) return;

      // 計算線性趨勢
      const n = values.length;
      const sumX = values.reduce((sum, _, index) => sum + index, 0);
      const sumY = values.reduce((sum, val) => sum + val, 0);
      const sumXY = values.reduce((sum, val, index) => sum + index * val, 0);
      const sumXX = values.reduce((sum, _, index) => sum + index * index, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      
      let direction: TrendInfo['direction'] = 'stable';
      if (slope > 0.1) direction = 'increasing';
      else if (slope < -0.1) direction = 'decreasing';

      trends.push({
        column,
        direction,
        strength: Math.abs(slope),
        seasonality: false, // 簡化處理
      });
    });

    return trends;
  }

  // ============================================================================
  // 私有方法 - 圖表評估
  // ============================================================================

  /**
   * 評估圖表類型
   */
  private evaluateChartTypes(
    data: QueryData,
    intent: QueryIntent,
    analysis: DataAnalysis
  ): Record<ChartType, number> {
    const scores: Record<ChartType, number> = {} as any;

    this.chartRules.forEach(rule => {
      let score = 0;
      
      rule.conditions.forEach(condition => {
        if (this.evaluateCondition(condition, data, intent, analysis)) {
          score += condition.weight;
        }
      });

      // 正規化分數
      const normalizedScore = Math.min(1, score * rule.confidence);
      scores[rule.recommendedChart] = normalizedScore;
    });

    return scores;
  }

  /**
   * 評估條件
   */
  private evaluateCondition(
    condition: ChartCondition,
    data: QueryData,
    intent: QueryIntent,
    analysis: DataAnalysis
  ): boolean {
    switch (condition.type) {
      case 'data_structure':
        return this.checkOperator(analysis.structure, condition.operator, condition.value);
      
      case 'data_type':
        return this.checkDataType(data, condition.operator, condition.value);
      
      case 'intent':
        return this.checkOperator(intent.primary, condition.operator, condition.value);
      
      case 'column_count':
        return this.checkOperator(data.columns.length, condition.operator, condition.value);
      
      case 'row_count':
        return this.checkOperator(data.rows.length, condition.operator, condition.value);
      
      case 'entity_type':
        return intent.entities.some(entity => 
          this.checkOperator(entity.type, condition.operator, condition.value)
        );
      
      default:
        return false;
    }
  }

  /**
   * 檢查運算子
   */
  private checkOperator(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'contains':
        return Array.isArray(actual) ? actual.includes(expected) : 
               typeof actual === 'string' ? actual.includes(expected) : false;
      case 'in':
        return Array.isArray(expected) ? expected.includes(actual) : false;
      case 'exists':
        return actual != null;
      default:
        return false;
    }
  }

  /**
   * 檢查資料類型
   */
  private checkDataType(data: QueryData, operator: string, value: string): boolean {
    const hasType = data.columns.some(col => col.type === value);
    return operator === 'exists' ? hasType : !hasType;
  }

  // ============================================================================
  // 私有方法 - 推薦生成
  // ============================================================================

  /**
   * 應用使用者偏好
   */
  private applyUserPreferences(
    scores: Record<ChartType, number>,
    preferences?: {
      preferredChartTypes?: ChartType[];
      colorScheme?: string;
      theme?: 'light' | 'dark';
      accessibility?: boolean;
    }
  ): Record<ChartType, number> {
    if (!preferences) return scores;

    const adjustedScores = { ...scores };

    // 提升偏好圖表類型的分數
    if (preferences.preferredChartTypes) {
      preferences.preferredChartTypes.forEach(chartType => {
        if (adjustedScores[chartType] !== undefined) {
          adjustedScores[chartType] = Math.min(1, adjustedScores[chartType] + 0.2);
        }
      });
    }

    return adjustedScores;
  }

  /**
   * 排序和篩選推薦
   */
  private sortAndFilterRecommendations(
    scores: Record<ChartType, number>
  ): Array<{ chartType: ChartType; score: number }> {
    return Object.entries(scores)
      .map(([chartType, score]) => ({ chartType: chartType as ChartType, score }))
      .filter(({ score }) => score > 0.3)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * 生成詳細推薦
   */
  private generateDetailedRecommendations(
    sortedCharts: Array<{ chartType: ChartType; score: number }>,
    data: QueryData,
    intent: QueryIntent,
    analysis: DataAnalysis,
    preferences?: any
  ): RecommendedChart[] {
    return sortedCharts.map(({ chartType, score }) => {
      const config = this.generateChartConfig(chartType, data, intent, preferences);
      const validation = this.validateChartSuitability(chartType, data);
      
      return {
        type: chartType,
        suitability: score,
        config,
        pros: this.getChartPros(chartType, analysis),
        cons: this.getChartCons(chartType, analysis),
      };
    });
  }

  /**
   * 獲取圖表優點
   */
  private getChartPros(chartType: ChartType, analysis: DataAnalysis): string[] {
    const prosMap: Record<ChartType, string[]> = {
      line: ['清楚顯示趨勢', '適合時間序列資料', '可比較多個系列'],
      bar: ['易於比較數值', '清楚顯示類別差異', '支援堆疊顯示'],
      pie: ['顯示佔比關係', '直觀易懂', '適合部分與整體的關係'],
      scatter: ['顯示相關性', '識別異常值', '適合大量資料點'],
      heatmap: ['顯示密度分布', '適合矩陣資料', '可視化相關性'],
      funnel: ['顯示流程轉換', '清楚的階段對比', '適合轉換分析'],
      gauge: ['直觀的進度顯示', '清楚的目標對比', '適合 KPI 監控'],
      radar: ['多維度比較', '顯示整體輪廓', '適合能力分析'],
      treemap: ['階層結構顯示', '空間利用效率高', '可顯示權重關係'],
      sankey: ['流量可視化', '顯示轉換路徑', '適合流程分析'],
      candlestick: ['完整的價格資訊', '適合財務資料', '顯示波動範圍'],
      table: ['精確的數值顯示', '支援排序篩選', '適合詳細資料'],
      metric: ['突出關鍵指標', '簡潔明瞭', '適合 KPI 展示'],
      map: ['地理分布視覺化', '直觀的空間關係', '適合區域分析'],
      custom: ['高度客製化', '特殊需求適配', '靈活性高'],
    };

    return prosMap[chartType] || [];
  }

  /**
   * 獲取圖表缺點
   */
  private getChartCons(chartType: ChartType, analysis: DataAnalysis): string[] {
    const consMap: Record<ChartType, string[]> = {
      line: ['不適合類別資料', '線條過多時混亂', '需要時間軸'],
      bar: ['空間使用效率低', '類別過多時擁擠', '不適合連續資料'],
      pie: ['類別太多時難讀', '不適合比較', '角度判斷困難'],
      scatter: ['需要兩個數值軸', '點太多時重疊', '趨勢不明顯'],
      heatmap: ['顏色解讀依賴性', '需要矩陣結構', '細節資訊有限'],
      funnel: ['僅適合流程資料', '階段有限', '不適合一般比較'],
      gauge: ['僅適合單一指標', '空間使用率低', '資訊容量有限'],
      radar: ['軸太多時複雜', '面積可能誤導', '不適合大量資料'],
      treemap: ['階層關係複雜', '小區塊難讀', '不適合趨勢分析'],
      sankey: ['僅適合流量資料', '複雜度高', '不適合一般分析'],
      candlestick: ['僅適合特定格式', '學習成本高', '複雜度較高'],
      table: ['視覺效果有限', '大量資料時冗長', '缺乏視覺化優勢'],
      metric: ['資訊容量極小', '無法顯示細節', '不適合比較'],
      map: ['需要地理資料', '依賴地圖底圖', '複雜度較高'],
      custom: ['開發成本高', '維護複雜', '標準化程度低'],
    };

    return consMap[chartType] || [];
  }

  // ============================================================================
  // 私有方法 - 配置生成
  // ============================================================================

  /**
   * 生成資料綁定
   */
  private generateDataBinding(
    chartType: ChartType,
    data: QueryData,
    intent: QueryIntent
  ): DataBinding {
    const analysis = this.analyzeData(data);
    
    // 基本軸綁定
    let xAxis: AxisBinding | undefined;
    let yAxis: AxisBinding | AxisBinding[] | undefined;

    switch (chartType) {
      case 'line':
      case 'bar':
        if (analysis.timeColumns.length > 0) {
          xAxis = {
            field: analysis.timeColumns[0],
            label: '時間',
            type: 'time',
            format: 'MM/DD',
          };
        } else if (analysis.categoricalColumns.length > 0) {
          xAxis = {
            field: analysis.categoricalColumns[0],
            label: analysis.categoricalColumns[0],
            type: 'category',
          };
        }
        
        if (analysis.numericalColumns.length > 0) {
          yAxis = {
            field: analysis.numericalColumns[0],
            label: analysis.numericalColumns[0],
            type: 'value',
          };
        }
        break;

      case 'scatter':
        if (analysis.numericalColumns.length >= 2) {
          xAxis = {
            field: analysis.numericalColumns[0],
            label: analysis.numericalColumns[0],
            type: 'value',
          };
          yAxis = {
            field: analysis.numericalColumns[1],
            label: analysis.numericalColumns[1],
            type: 'value',
          };
        }
        break;

      case 'pie':
        // 圓餅圖使用分類和數值
        if (analysis.categoricalColumns.length > 0 && analysis.numericalColumns.length > 0) {
          xAxis = {
            field: analysis.categoricalColumns[0],
            label: '類別',
            type: 'category',
          };
          yAxis = {
            field: analysis.numericalColumns[0],
            label: '數值',
            type: 'value',
          };
        }
        break;
    }

    // 顏色和大小維度
    let color: string | undefined;
    let size: string | undefined;
    
    if (analysis.categoricalColumns.length > 1) {
      color = analysis.categoricalColumns[1];
    }
    
    if (analysis.numericalColumns.length > 1) {
      size = analysis.numericalColumns[1];
    }

    return {
      xAxis,
      yAxis,
      color,
      size,
      series: this.generateSeriesBindings(data, intent),
    };
  }

  /**
   * 生成系列綁定
   */
  private generateSeriesBindings(data: QueryData, intent: QueryIntent): SeriesBinding[] {
    const analysis = this.analyzeData(data);
    const series: SeriesBinding[] = [];

    // 根據意圖生成系列
    if (intent.primary === 'comparison') {
      // 比較查詢可能需要多個系列
      analysis.numericalColumns.forEach((column, index) => {
        series.push({
          name: column,
          dataField: column,
          type: 'line',
          color: this.getSeriesColor(index),
        });
      });
    } else {
      // 一般查詢使用主要數值欄位
      if (analysis.numericalColumns.length > 0) {
        series.push({
          name: analysis.numericalColumns[0],
          dataField: analysis.numericalColumns[0],
          type: 'line',
          color: this.getSeriesColor(0),
        });
      }
    }

    return series;
  }

  /**
   * 生成樣式配置
   */
  private generateStyling(
    chartType: ChartType,
    customization?: any
  ): ChartStyling {
    const theme = customization?.theme || 'light';
    const colorScheme = customization?.colorScheme || 'default';

    return {
      colorScheme: this.colorSchemes[colorScheme] || this.colorSchemes.default,
      theme,
      grid: ['line', 'bar', 'scatter'].includes(chartType),
      legend: {
        show: true,
        position: 'top',
        align: 'center',
      },
      tooltip: {
        show: true,
        trigger: 'hover',
      },
      font: {
        family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        size: 12,
        color: theme === 'dark' ? '#ffffff' : '#333333',
      },
      margin: {
        top: 20,
        right: 20,
        bottom: 40,
        left: 40,
      },
    };
  }

  /**
   * 生成互動配置
   */
  private generateInteractions(
    chartType: ChartType,
    data: QueryData,
    customization?: any
  ): ChartInteractions {
    const interactive = customization?.interactive !== false;

    return {
      zoom: interactive && ['line', 'scatter'].includes(chartType),
      pan: interactive && ['line', 'scatter'].includes(chartType),
      brush: interactive && data.rows.length > 100,
      export: true,
      contextMenu: true,
    };
  }

  /**
   * 生成動畫配置
   */
  private generateAnimations(
    chartType: ChartType,
    customization?: any
  ): AnimationConfig {
    const animated = customization?.animated !== false;

    return {
      enabled: animated,
      duration: 750,
      easing: 'ease-in-out',
      delay: 0,
    };
  }

  // ============================================================================
  // 私有方法 - 輔助函數
  // ============================================================================

  /**
   * 生成標題
   */
  private generateTitle(intent: QueryIntent, data: QueryData): string {
    const metricEntities = intent.entities.filter(e => e.type === 'metric');
    const timeEntities = intent.entities.filter(e => e.type === 'time_period');

    if (metricEntities.length > 0) {
      let title = metricEntities[0].value;
      
      if (timeEntities.length > 0) {
        title += ` - ${timeEntities[0].value}`;
      }
      
      switch (intent.primary) {
        case 'trend':
          title += ' 趨勢分析';
          break;
        case 'comparison':
          title += ' 比較分析';
          break;
        case 'ranking':
          title += ' 排名分析';
          break;
        default:
          title += ' 分析';
      }
      
      return title;
    }

    return '資料分析圖表';
  }

  /**
   * 獲取系列顏色
   */
  private getSeriesColor(index: number): string {
    const defaultColors = this.colorSchemes.default;
    return defaultColors[index % defaultColors.length];
  }

  /**
   * 計算總體信心度
   */
  private calculateOverallConfidence(
    recommendations: RecommendedChart[],
    analysis: DataAnalysis,
    intent: QueryIntent
  ): number {
    if (recommendations.length === 0) return 0;

    let confidence = recommendations[0].suitability;

    // 根據資料品質調整
    if (analysis.rowCount < 10) {
      confidence *= 0.8;
    }

    // 根據模式匹配調整
    if (analysis.patterns.length > 0) {
      const avgPatternConfidence = analysis.patterns.reduce((sum, p) => sum + p.confidence, 0) / analysis.patterns.length;
      confidence = (confidence + avgPatternConfidence) / 2;
    }

    return Math.min(1, confidence);
  }

  /**
   * 生成推薦理由
   */
  private generateReasoning(
    recommendation: RecommendedChart,
    analysis: DataAnalysis,
    intent: QueryIntent
  ): string {
    const reasons: string[] = [];

    // 基於資料結構的理由
    switch (analysis.structure) {
      case 'time_series':
        reasons.push('資料包含時間序列，適合顯示趨勢變化');
        break;
      case 'categorical':
        reasons.push('資料包含分類和數值，適合比較分析');
        break;
      case 'numerical':
        reasons.push('資料主要為數值型，適合相關性分析');
        break;
    }

    // 基於查詢意圖的理由
    switch (intent.primary) {
      case 'trend':
        reasons.push('查詢目的為趨勢分析，選擇能清楚顯示變化的圖表');
        break;
      case 'comparison':
        reasons.push('查詢目的為比較分析，選擇便於比較的視覺化方式');
        break;
      case 'ranking':
        reasons.push('查詢目的為排名分析，選擇能突出順序的圖表');
        break;
    }

    // 基於資料量的理由
    if (analysis.rowCount > 100) {
      reasons.push('資料量充足，可展現詳細的分析結果');
    } else if (analysis.rowCount < 20) {
      reasons.push('資料量較少，選擇簡潔清晰的視覺化方式');
    }

    return reasons.join('；') || '根據資料特性選擇最適合的圖表類型';
  }

  /**
   * 建立降級推薦
   */
  private createFallbackRecommendation(
    data: QueryData,
    intent: QueryIntent
  ): ChartRecommendation {
    const fallbackConfig = this.createFallbackConfig('bar', data);
    
    return {
      primary: {
        type: 'bar',
        suitability: 0.5,
        config: fallbackConfig,
        pros: ['通用性強', '易於理解'],
        cons: ['可能不是最佳選擇'],
      },
      alternatives: [
        {
          type: 'table',
          suitability: 0.6,
          config: this.createFallbackConfig('table', data),
          pros: ['顯示詳細資料'],
          cons: ['視覺效果有限'],
        },
      ],
      reasoning: '發生錯誤時的降級推薦',
      confidence: 0.5,
    };
  }

  /**
   * 建立降級配置
   */
  private createFallbackConfig(chartType: ChartType, data: QueryData): ChartConfig {
    return {
      type: chartType,
      title: '資料視覺化',
      dataBinding: {
        xAxis: data.columns[0] ? {
          field: data.columns[0].name,
          label: data.columns[0].name,
          type: 'category',
        } : undefined,
        yAxis: data.columns[1] ? {
          field: data.columns[1].name,
          label: data.columns[1].name,
          type: 'value',
        } : undefined,
      },
      styling: {
        colorScheme: this.colorSchemes.default,
        theme: 'light',
        grid: true,
      },
    };
  }

  /**
   * 驗證圖表特定條件
   */
  private validateChartSpecificConditions(
    chartType: ChartType,
    analysis: DataAnalysis
  ): {
    issues: string[];
    suggestions: string[];
    scoreAdjustment: number;
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let scoreAdjustment = 0;

    switch (chartType) {
      case 'line':
        if (analysis.timeColumns.length === 0) {
          issues.push('線圖建議使用時間軸資料');
          suggestions.push('考慮使用長條圖');
          scoreAdjustment -= 0.3;
        }
        break;

      case 'pie':
        if (analysis.categoricalColumns.length === 0) {
          issues.push('圓餅圖需要分類資料');
          scoreAdjustment -= 0.4;
        }
        if (analysis.rowCount > 10) {
          suggestions.push('類別過多時考慮使用長條圖');
          scoreAdjustment -= 0.1;
        }
        break;

      case 'scatter':
        if (analysis.numericalColumns.length < 2) {
          issues.push('散佈圖需要至少兩個數值欄位');
          scoreAdjustment -= 0.5;
        }
        break;
    }

    return { issues, suggestions, scoreAdjustment };
  }

  // ============================================================================
  // 私有方法 - 初始化配置
  // ============================================================================

  /**
   * 初始化圖表規則
   */
  private initializeChartRules(): ChartRule[] {
    return [
      {
        id: 'line_chart_rule',
        conditions: [
          { type: 'data_structure', operator: 'equals', value: 'time_series', weight: 0.8 },
          { type: 'intent', operator: 'equals', value: 'trend', weight: 0.6 },
          { type: 'data_type', operator: 'exists', value: 'date', weight: 0.5 },
          { type: 'row_count', operator: 'greater_than', value: 5, weight: 0.3 },
        ],
        recommendedChart: 'line',
        confidence: 0.9,
        reasoning: '時間序列資料最適合使用線圖顯示趨勢',
        alternatives: ['bar', 'table'],
        dataRequirements: {
          minRows: 3,
          maxRows: 10000,
          requiredColumns: ['time', 'value'],
          optionalColumns: ['category'],
        },
      },
      {
        id: 'bar_chart_rule',
        conditions: [
          { type: 'data_structure', operator: 'equals', value: 'categorical', weight: 0.7 },
          { type: 'intent', operator: 'in', value: ['comparison', 'ranking'], weight: 0.6 },
          { type: 'data_type', operator: 'exists', value: 'string', weight: 0.4 },
          { type: 'row_count', operator: 'less_than', value: 50, weight: 0.3 },
        ],
        recommendedChart: 'bar',
        confidence: 0.8,
        reasoning: '分類資料比較最適合使用長條圖',
        alternatives: ['line', 'pie'],
        dataRequirements: {
          minRows: 1,
          maxRows: 100,
          requiredColumns: ['category', 'value'],
          optionalColumns: [],
        },
      },
      {
        id: 'pie_chart_rule',
        conditions: [
          { type: 'data_structure', operator: 'equals', value: 'categorical', weight: 0.6 },
          { type: 'row_count', operator: 'less_than', value: 8, weight: 0.5 },
          { type: 'entity_type', operator: 'contains', value: 'aggregation', weight: 0.4 },
        ],
        recommendedChart: 'pie',
        confidence: 0.7,
        reasoning: '少量分類資料的佔比關係適合圓餅圖',
        alternatives: ['bar', 'table'],
        dataRequirements: {
          minRows: 2,
          maxRows: 10,
          requiredColumns: ['category', 'value'],
          optionalColumns: [],
        },
      },
      {
        id: 'scatter_chart_rule',
        conditions: [
          { type: 'data_structure', operator: 'equals', value: 'numerical', weight: 0.8 },
          { type: 'column_count', operator: 'greater_than', value: 2, weight: 0.6 },
          { type: 'intent', operator: 'equals', value: 'correlation', weight: 0.7 },
          { type: 'row_count', operator: 'greater_than', value: 10, weight: 0.4 },
        ],
        recommendedChart: 'scatter',
        confidence: 0.8,
        reasoning: '數值資料相關性分析適合散佈圖',
        alternatives: ['line', 'heatmap'],
        dataRequirements: {
          minRows: 5,
          maxRows: 5000,
          requiredColumns: ['x_value', 'y_value'],
          optionalColumns: ['category', 'size'],
        },
      },
      {
        id: 'table_fallback_rule',
        conditions: [
          { type: 'row_count', operator: 'greater_than', value: 0, weight: 0.3 },
        ],
        recommendedChart: 'table',
        confidence: 0.4,
        reasoning: '通用的資料顯示方式',
        alternatives: [],
        dataRequirements: {
          minRows: 1,
          maxRows: 1000,
          requiredColumns: [],
          optionalColumns: [],
        },
      },
    ];
  }

  /**
   * 初始化圖表模板
   */
  private initializeChartTemplates(): Record<ChartType, ChartConfig> {
    const baseConfig: ChartConfig = {
      type: 'line',
      title: '圖表標題',
      dataBinding: {},
      styling: {
        colorScheme: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
        theme: 'light',
        grid: true,
      },
    };

    return {
      line: { ...baseConfig, type: 'line' },
      bar: { ...baseConfig, type: 'bar' },
      pie: { ...baseConfig, type: 'pie', styling: { ...baseConfig.styling, grid: false } },
      scatter: { ...baseConfig, type: 'scatter' },
      heatmap: { ...baseConfig, type: 'heatmap' },
      funnel: { ...baseConfig, type: 'funnel' },
      gauge: { ...baseConfig, type: 'gauge' },
      radar: { ...baseConfig, type: 'radar' },
      treemap: { ...baseConfig, type: 'treemap' },
      sankey: { ...baseConfig, type: 'sankey' },
      candlestick: { ...baseConfig, type: 'candlestick' },
      table: { ...baseConfig, type: 'table' },
      metric: { ...baseConfig, type: 'metric' },
      map: { ...baseConfig, type: 'map' },
      custom: { ...baseConfig, type: 'custom' },
    };
  }

  /**
   * 初始化顏色方案
   */
  private initializeColorSchemes(): Record<string, string[]> {
    return {
      default: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'],
      blue: ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'],
      green: ['#047857', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
      red: ['#B91C1C', '#EF4444', '#F87171', '#FCA5A5', '#FECACA'],
      purple: ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'],
      warm: ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D'],
      cool: ['#0891B2', '#0284C7', '#2563EB', '#7C3AED', '#C026D3'],
    };
  }
}

// ============================================================================
// 匯出
// ============================================================================

/**
 * 圖表推薦引擎單例實例
 */
export const chartRecommendationEngine = new ChartRecommendationEngine();

/**
 * 預設匯出
 */
export default chartRecommendationEngine;