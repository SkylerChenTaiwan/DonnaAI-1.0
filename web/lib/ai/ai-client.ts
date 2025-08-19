/**
 * PRP-124: AI 驅動分析查詢介面 - AI 客戶端服務
 * 
 * @description 統一的 AI 服務客戶端，支援 Claude 3.5 Sonnet 和 GPT-4 API
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import { env } from '@/lib/env';
import type { 
  AIQuery, 
  QueryIntent, 
  AIPerformance, 
  AIError,
  AIErrorType 
} from '@/docs/types/ai-query-data-models';

// ============================================================================
// AI 模型配置和介面
// ============================================================================

/**
 * AI 模型類型
 */
export type AIModelType = 'claude-3.5-sonnet' | 'gpt-4o' | 'gpt-3.5-turbo';

/**
 * AI 模型配置
 */
interface AIModelConfig {
  endpoint: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  retryAttempts: number;
}

/**
 * Claude API 請求結構
 */
interface ClaudeRequest {
  model: string;
  max_tokens: number;
  temperature: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  system?: string;
}

/**
 * Claude API 回應結構
 */
interface ClaudeResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  role: 'assistant';
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * OpenAI API 請求結構
 */
interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens: number;
  temperature: number;
  response_format?: { type: 'json_object' };
}

/**
 * OpenAI API 回應結構
 */
interface OpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

// ============================================================================
// AI 客戶端類別
// ============================================================================

/**
 * AI 客戶端服務類別
 * 提供統一的 AI 服務介面，支援多種 AI 模型
 */
export class AIClient {
  private readonly config: Record<AIModelType, AIModelConfig>;
  private readonly defaultModel: AIModelType;

  constructor() {
    this.config = {
      'claude-3.5-sonnet': {
        endpoint: 'https://api.anthropic.com/v1/messages',
        maxTokens: 4096,
        temperature: 0.7,
        timeout: 30000,
        retryAttempts: 3,
      },
      'gpt-4o': {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        maxTokens: 4096,
        temperature: 0.7,
        timeout: 30000,
        retryAttempts: 3,
      },
      'gpt-3.5-turbo': {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        maxTokens: 2048,
        temperature: 0.7,
        timeout: 20000,
        retryAttempts: 2,
      },
    };

    this.defaultModel = 'claude-3.5-sonnet';
  }

  /**
   * 解析自然語言查詢
   * @param query 自然語言查詢
   * @param model 使用的 AI 模型
   * @returns 結構化的查詢意圖
   */
  async parseQuery(
    query: string,
    model: AIModelType = this.defaultModel
  ): Promise<QueryIntent> {
    const startTime = Date.now();

    try {
      const systemPrompt = this.getQueryParsingPrompt();
      const userMessage = `請分析以下查詢：\n\n${query}`;

      const response = await this.callAI(systemPrompt, userMessage, model);
      const parsed = this.parseAIResponse(response);

      // 記錄效能指標
      const performance: AIPerformance = {
        model,
        responseTime: Date.now() - startTime,
        tokenUsage: response.usage,
        cost: this.calculateCost(response.usage, model),
      };

      console.log('AI Query Parsing Performance:', performance);

      return parsed;
    } catch (error) {
      throw new AIError(
        `查詢解析失敗: ${error instanceof Error ? error.message : String(error)}`,
        'QUERY_PARSE_ERROR',
        'query_parse_error',
        true
      );
    }
  }

  /**
   * 生成 AI 解釋
   * @param queryResult 查詢結果數據
   * @param originalQuery 原始查詢
   * @param model 使用的 AI 模型
   * @returns AI 生成的解釋和洞察
   */
  async generateExplanation(
    queryResult: any,
    originalQuery: string,
    model: AIModelType = this.defaultModel
  ): Promise<{
    summary: string;
    keyFindings: string[];
    insights: string[];
    recommendations: string[];
  }> {
    const startTime = Date.now();

    try {
      const systemPrompt = this.getExplanationPrompt();
      const userMessage = `
原始查詢：${originalQuery}

查詢結果數據：
${JSON.stringify(queryResult, null, 2)}

請提供：
1. 數據摘要
2. 關鍵發現
3. 業務洞察
4. 行動建議
`;

      const response = await this.callAI(systemPrompt, userMessage, model);
      const explanation = this.parseExplanationResponse(response.content);

      // 記錄效能指標
      const performance: AIPerformance = {
        model,
        responseTime: Date.now() - startTime,
        tokenUsage: response.usage,
        cost: this.calculateCost(response.usage, model),
      };

      console.log('AI Explanation Performance:', performance);

      return explanation;
    } catch (error) {
      throw new AIError(
        `解釋生成失敗: ${error instanceof Error ? error.message : String(error)}`,
        'EXPLANATION_ERROR',
        'ai_service_error',
        true
      );
    }
  }

  // ============================================================================
  // 私有方法 - AI 模型呼叫
  // ============================================================================

  /**
   * 呼叫 AI 服務
   * @param systemPrompt 系統提示詞
   * @param userMessage 使用者訊息
   * @param model 使用的模型
   * @returns AI 回應
   */
  private async callAI(
    systemPrompt: string,
    userMessage: string,
    model: AIModelType
  ): Promise<{ content: string; usage: any }> {
    const config = this.config[model];
    
    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        if (model === 'claude-3.5-sonnet') {
          return await this.callClaude(systemPrompt, userMessage, config);
        } else {
          return await this.callOpenAI(systemPrompt, userMessage, model, config);
        }
      } catch (error) {
        if (attempt === config.retryAttempts) {
          throw error;
        }
        
        // 指數退避延遲
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('AI 服務呼叫失敗');
  }

  /**
   * 呼叫 Claude API
   */
  private async callClaude(
    systemPrompt: string,
    userMessage: string,
    config: AIModelConfig
  ): Promise<{ content: string; usage: any }> {
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new AIError(
        'Claude API 金鑰未設定',
        'MISSING_API_KEY',
        'ai_service_error',
        false
      );
    }

    const requestBody: ClaudeRequest = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AIError(
          `Claude API 錯誤: ${response.status} ${response.statusText}`,
          'CLAUDE_API_ERROR',
          this.mapHTTPErrorToAIError(response.status),
          response.status >= 500
        );
      }

      const data: ClaudeResponse = await response.json();
      
      return {
        content: data.content[0]?.text || '',
        usage: {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof AIError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIError(
          'Claude API 請求逾時',
          'TIMEOUT_ERROR',
          'timeout_error',
          true
        );
      }
      
      throw new AIError(
        `Claude API 呼叫失敗: ${error instanceof Error ? error.message : String(error)}`,
        'NETWORK_ERROR',
        'network_error',
        true
      );
    }
  }

  /**
   * 呼叫 OpenAI API
   */
  private async callOpenAI(
    systemPrompt: string,
    userMessage: string,
    model: AIModelType,
    config: AIModelConfig
  ): Promise<{ content: string; usage: any }> {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AIError(
        'OpenAI API 金鑰未設定',
        'MISSING_API_KEY',
        'ai_service_error',
        false
      );
    }

    const requestBody: OpenAIRequest = {
      model: model === 'gpt-4o' ? 'gpt-4o' : 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      response_format: { type: 'json_object' },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AIError(
          `OpenAI API 錯誤: ${response.status} ${response.statusText}`,
          'OPENAI_API_ERROR',
          this.mapHTTPErrorToAIError(response.status),
          response.status >= 500
        );
      }

      const data: OpenAIResponse = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || '',
        usage: {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof AIError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIError(
          'OpenAI API 請求逾時',
          'TIMEOUT_ERROR',
          'timeout_error',
          true
        );
      }
      
      throw new AIError(
        `OpenAI API 呼叫失敗: ${error instanceof Error ? error.message : String(error)}`,
        'NETWORK_ERROR',
        'network_error',
        true
      );
    }
  }

  // ============================================================================
  // 私有方法 - 提示詞模板
  // ============================================================================

  /**
   * 獲取查詢解析提示詞
   */
  private getQueryParsingPrompt(): string {
    return `你是 DonnaAI CRM 系統的智能分析助手。請分析使用者的自然語言查詢，並返回結構化的 JSON 結果。

業務背景：
- 系統類型：CRM 客戶關係管理系統
- 主要數據：customers（客戶）、orders（訂單）、meetings（會議）、tasks（任務）
- 核心指標：營收、客戶數量、轉換率、留存率、平均客單價

請根據以下格式返回 JSON 結果：
{
  "primary": "查詢主要意圖（query/comparison/trend/prediction/aggregate/filter/ranking/anomaly/correlation/distribution）",
  "secondary": ["次要意圖陣列"],
  "confidence": 0.95,
  "entities": [
    {
      "type": "實體類型（metric/time_period/date_range/dimension/filter_condition/comparison_operator/aggregation/sort_order/threshold/entity_name）",
      "value": "原始值",
      "normalizedValue": "標準化後的值",
      "confidence": 0.9
    }
  ],
  "classification": {
    "domain": "業務領域（sales/customer/marketing/operations/finance/general）",
    "timeScope": "時間範圍類型（realtime/historical/predictive）",
    "complexity": "複雜度（simple/moderate/complex）",
    "dataSources": ["需要的資料來源陣列"]
  },
  "explanation": "對查詢意圖的簡短解釋"
}

範例：
查詢："這個月的營收比上個月增長多少？"
回應：
{
  "primary": "comparison",
  "secondary": ["query"],
  "confidence": 0.95,
  "entities": [
    {"type": "metric", "value": "營收", "normalizedValue": "revenue", "confidence": 0.98},
    {"type": "time_period", "value": "這個月", "normalizedValue": "current_month", "confidence": 0.95},
    {"type": "time_period", "value": "上個月", "normalizedValue": "previous_month", "confidence": 0.95},
    {"type": "comparison_operator", "value": "增長", "normalizedValue": "growth_rate", "confidence": 0.9}
  ],
  "classification": {
    "domain": "sales",
    "timeScope": "historical",
    "complexity": "simple",
    "dataSources": ["orders"]
  },
  "explanation": "使用者想比較本月和上月的營收，並計算增長率"
}

請只返回有效的 JSON，不要包含其他文字。`;
  }

  /**
   * 獲取解釋生成提示詞
   */
  private getExplanationPrompt(): string {
    return `你是 DonnaAI CRM 系統的商業分析師。請根據查詢結果提供專業的業務分析和洞察。

請用繁體中文提供：
1. 數據摘要：簡潔描述主要數據趨勢
2. 關鍵發現：3-5 個重要的數據發現
3. 業務洞察：從商業角度解讀數據意義
4. 行動建議：具體可執行的改進建議

回應格式（JSON）：
{
  "summary": "數據摘要文字",
  "keyFindings": ["發現1", "發現2", "發現3"],
  "insights": ["洞察1", "洞察2", "洞察3"],
  "recommendations": ["建議1", "建議2", "建議3"]
}

分析風格：
- 專業但易懂
- 聚焦商業價值
- 提供具體數字
- 避免技術術語
- 突出異常或趨勢

請只返回有效的 JSON，不要包含其他文字。`;
  }

  // ============================================================================
  // 私有方法 - 回應解析和工具函數
  // ============================================================================

  /**
   * 解析 AI 查詢回應
   */
  private parseAIResponse(response: { content: string }): QueryIntent {
    try {
      const parsed = JSON.parse(response.content);
      
      // 驗證必要欄位
      if (!parsed.primary || !parsed.entities || !parsed.classification) {
        throw new Error('AI 回應格式不完整');
      }

      return {
        primary: parsed.primary,
        secondary: parsed.secondary || [],
        confidence: parsed.confidence || 0.8,
        entities: parsed.entities || [],
        classification: parsed.classification,
        explanation: parsed.explanation,
        rawResponse: response.content,
      };
    } catch (error) {
      throw new AIError(
        'AI 回應解析失敗：回應格式無效',
        'RESPONSE_PARSE_ERROR',
        'ai_service_error',
        false
      );
    }
  }

  /**
   * 解析解釋回應
   */
  private parseExplanationResponse(content: string): {
    summary: string;
    keyFindings: string[];
    insights: string[];
    recommendations: string[];
  } {
    try {
      const parsed = JSON.parse(content);
      
      return {
        summary: parsed.summary || '無法生成摘要',
        keyFindings: parsed.keyFindings || [],
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (error) {
      // 如果 JSON 解析失敗，嘗試從純文字中提取資訊
      return {
        summary: '根據查詢結果進行分析...',
        keyFindings: ['數據解析中...'],
        insights: ['正在生成業務洞察...'],
        recommendations: ['請稍後查看詳細建議...'],
      };
    }
  }

  /**
   * 計算 API 使用成本
   */
  private calculateCost(usage: any, model: AIModelType): number {
    const pricing = {
      'claude-3.5-sonnet': {
        input: 0.003,  // $0.003 per 1K tokens
        output: 0.015, // $0.015 per 1K tokens
      },
      'gpt-4o': {
        input: 0.03,   // $0.03 per 1K tokens
        output: 0.06,  // $0.06 per 1K tokens
      },
      'gpt-3.5-turbo': {
        input: 0.0015, // $0.0015 per 1K tokens
        output: 0.002, // $0.002 per 1K tokens
      },
    };

    const modelPricing = pricing[model];
    const inputCost = (usage.inputTokens / 1000) * modelPricing.input;
    const outputCost = (usage.outputTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * 將 HTTP 錯誤映射到 AI 錯誤類型
   */
  private mapHTTPErrorToAIError(statusCode: number): AIErrorType {
    switch (statusCode) {
      case 400:
        return 'validation_error';
      case 401:
      case 403:
        return 'permission_error';
      case 429:
        return 'rate_limit_error';
      case 408:
      case 504:
        return 'timeout_error';
      case 500:
      case 502:
      case 503:
        return 'ai_service_error';
      default:
        return 'network_error';
    }
  }
}

// ============================================================================
// 匯出單例實例
// ============================================================================

/**
 * AI 客戶端單例實例
 */
export const aiClient = new AIClient();

/**
 * 預設匯出
 */
export default aiClient;