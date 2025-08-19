/**
 * PRP-124: AI 驅動分析查詢介面 - 錯誤處理和降級機制
 * 
 * @description 完整的錯誤處理系統，包含錯誤分類、恢復策略、降級機制和使用者友善的錯誤提示
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import type {
  AIError,
  AIErrorType,
  ErrorRecovery,
  RecoveryStrategy,
  RetryConfig,
  FallbackOptions,
  QueryIntent,
  QueryResult,
  ValidationError,
  NetworkError
} from '@/docs/types/ai-query-data-models';

// ============================================================================
// 錯誤處理配置和類型
// ============================================================================

/**
 * 錯誤處理配置
 */
interface ErrorHandlerConfig {
  retryConfig: Record<AIErrorType, RetryConfig>;
  fallbackStrategies: Record<AIErrorType, FallbackOptions>;
  userMessages: Record<AIErrorType, {
    title: string;
    message: string;
    suggestions: string[];
    actions: ErrorAction[];
  }>;
  loggingEnabled: boolean;
  telemetryEnabled: boolean;
}

/**
 * 錯誤動作
 */
interface ErrorAction {
  id: string;
  label: string;
  type: 'retry' | 'fallback' | 'manual' | 'contact_support';
  handler: () => Promise<void> | void;
  primary?: boolean;
}

/**
 * 錯誤上下文
 */
interface ErrorContext {
  queryId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  timestamp: Date;
  query?: string;
  intent?: QueryIntent;
  retryCount?: number;
  previousErrors?: AIError[];
}

/**
 * 錯誤恢復結果
 */
interface RecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  result?: QueryResult;
  fallbackUsed?: boolean;
  retryCount: number;
  totalTime: number;
  error?: AIError;
}

/**
 * 降級選項結果
 */
interface FallbackResult {
  success: boolean;
  result?: QueryResult;
  fallbackType: 'cache' | 'simplified_query' | 'default_data' | 'error_message';
  degradedQuality: boolean;
  explanation: string;
}

// ============================================================================
// 錯誤處理器類別
// ============================================================================

/**
 * AI 錯誤處理器
 * 提供全面的錯誤處理、恢復和降級機制
 */
export class AIErrorHandler {
  private readonly config: ErrorHandlerConfig;
  private readonly errorHistory: Map<string, AIError[]>;
  private readonly recoveryAttempts: Map<string, number>;

  constructor() {
    this.config = this.initializeConfig();
    this.errorHistory = new Map();
    this.recoveryAttempts = new Map();
  }

  /**
   * 處理 AI 錯誤
   * @param error 錯誤實例
   * @param context 錯誤上下文
   * @returns 錯誤恢復結果
   */
  async handleError(
    error: AIError | Error,
    context: ErrorContext
  ): Promise<RecoveryResult> {
    const startTime = Date.now();
    
    try {
      // 1. 標準化錯誤
      const standardizedError = this.standardizeError(error, context);
      
      // 2. 記錄錯誤
      this.logError(standardizedError, context);
      
      // 3. 更新錯誤歷史
      this.updateErrorHistory(standardizedError, context);
      
      // 4. 決定恢復策略
      const strategy = this.determineRecoveryStrategy(standardizedError, context);
      
      // 5. 執行恢復
      const result = await this.executeRecovery(standardizedError, context, strategy);
      
      // 6. 記錄恢復結果
      this.logRecoveryResult(result, context);
      
      return {
        ...result,
        totalTime: Date.now() - startTime,
      };
    } catch (recoveryError) {
      console.error('Error recovery failed:', recoveryError);
      
      return {
        success: false,
        strategy: 'manual',
        retryCount: 0,
        totalTime: Date.now() - startTime,
        error: this.standardizeError(recoveryError, context),
      };
    }
  }

  /**
   * 獲取使用者友善的錯誤訊息
   * @param error 錯誤實例
   * @param context 錯誤上下文
   * @returns 使用者錯誤訊息
   */
  getUserFriendlyMessage(
    error: AIError,
    context: ErrorContext
  ): {
    title: string;
    message: string;
    suggestions: string[];
    actions: ErrorAction[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    const errorConfig = this.config.userMessages[error.type];
    
    if (!errorConfig) {
      return this.getGenericErrorMessage(error);
    }

    // 客製化訊息
    const customizedMessage = this.customizeErrorMessage(errorConfig, error, context);
    
    // 決定嚴重程度
    const severity = this.determineSeverity(error);
    
    return {
      ...customizedMessage,
      severity,
    };
  }

  /**
   * 重試操作
   * @param operation 要重試的操作
   * @param errorType 錯誤類型
   * @param context 上下文
   * @returns 重試結果
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    errorType: AIErrorType,
    context: ErrorContext
  ): Promise<T> {
    const retryConfig = this.config.retryConfig[errorType];
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        // 等待重試延遲
        if (attempt > 1) {
          const delay = this.calculateRetryDelay(attempt, retryConfig);
          await this.sleep(delay);
        }
        
        // 執行操作
        const result = await operation();
        
        // 成功則重置計數器
        this.recoveryAttempts.delete(context.queryId || 'unknown');
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 檢查是否應該重試
        if (retryConfig.retryCondition && !retryConfig.retryCondition(error as AIError)) {
          break;
        }
        
        // 記錄重試嘗試
        this.logRetryAttempt(attempt, lastError, context);
      }
    }
    
    throw lastError || new Error('重試失敗');
  }

  /**
   * 執行降級處理
   * @param error 錯誤實例
   * @param context 錯誤上下文
   * @returns 降級結果
   */
  async executeFallback(
    error: AIError,
    context: ErrorContext
  ): Promise<FallbackResult> {
    const fallbackOptions = this.config.fallbackStrategies[error.type];
    
    if (!fallbackOptions) {
      return {
        success: false,
        fallbackType: 'error_message',
        degradedQuality: true,
        explanation: '沒有可用的降級選項',
      };
    }

    try {
      // 1. 嘗試使用快取
      if (fallbackOptions.useCache) {
        const cacheResult = await this.tryCache(context);
        if (cacheResult.success) {
          return cacheResult;
        }
      }

      // 2. 嘗試使用預設值
      if (fallbackOptions.useDefault !== undefined) {
        return await this.useDefaultValue(fallbackOptions.useDefault, context);
      }

      // 3. 嘗試降級服務
      if (fallbackOptions.fallbackService) {
        return await this.useFallbackService(fallbackOptions.fallbackService, context);
      }

      // 4. 嘗試簡化查詢
      if (fallbackOptions.simplifyQuery) {
        return await this.simplifyQuery(context);
      }

      return {
        success: false,
        fallbackType: 'error_message',
        degradedQuality: true,
        explanation: '所有降級選項都失敗了',
      };
    } catch (fallbackError) {
      console.error('Fallback execution failed:', fallbackError);
      
      return {
        success: false,
        fallbackType: 'error_message',
        degradedQuality: true,
        explanation: `降級處理失敗: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
      };
    }
  }

  /**
   * 清理過期的錯誤記錄
   * @param maxAge 最大保存時間（毫秒）
   */
  cleanupErrorHistory(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    
    for (const [key, errors] of this.errorHistory.entries()) {
      const filteredErrors = errors.filter(error => 
        now - error.timestamp.getTime() < maxAge
      );
      
      if (filteredErrors.length === 0) {
        this.errorHistory.delete(key);
      } else {
        this.errorHistory.set(key, filteredErrors);
      }
    }
  }

  /**
   * 獲取錯誤統計
   * @param timeRange 時間範圍（毫秒）
   * @returns 錯誤統計資訊
   */
  getErrorStatistics(timeRange: number = 24 * 60 * 60 * 1000): {
    totalErrors: number;
    errorsByType: Record<AIErrorType, number>;
    errorRate: number;
    averageRecoveryTime: number;
    commonErrors: Array<{ type: AIErrorType; count: number; lastOccurred: Date }>;
  } {
    const now = Date.now();
    const cutoff = now - timeRange;
    
    let totalErrors = 0;
    const errorsByType: Record<string, number> = {};
    const allErrors: AIError[] = [];

    // 收集統計資料
    for (const errors of this.errorHistory.values()) {
      const recentErrors = errors.filter(error => error.timestamp.getTime() > cutoff);
      totalErrors += recentErrors.length;
      allErrors.push(...recentErrors);
      
      recentErrors.forEach(error => {
        errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      });
    }

    // 計算常見錯誤
    const commonErrors = Object.entries(errorsByType)
      .map(([type, count]) => ({
        type: type as AIErrorType,
        count,
        lastOccurred: new Date(Math.max(...allErrors
          .filter(e => e.type === type)
          .map(e => e.timestamp.getTime())
        )),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors,
      errorsByType: errorsByType as any,
      errorRate: totalErrors / Math.max(1, timeRange / (60 * 60 * 1000)), // 每小時錯誤率
      averageRecoveryTime: 0, // 簡化處理
      commonErrors,
    };
  }

  // ============================================================================
  // 私有方法 - 錯誤處理
  // ============================================================================

  /**
   * 標準化錯誤
   */
  private standardizeError(error: AIError | Error, context: ErrorContext): AIError {
    if (error instanceof AIError) {
      return error;
    }

    // 根據錯誤訊息推斷錯誤類型
    const errorType = this.inferErrorType(error);
    
    return new AIError(
      error.message,
      'UNKNOWN_ERROR',
      errorType,
      true
    );
  }

  /**
   * 推斷錯誤類型
   */
  private inferErrorType(error: Error): AIErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network_error';
    }
    
    if (message.includes('timeout')) {
      return 'timeout_error';
    }
    
    if (message.includes('permission') || message.includes('auth')) {
      return 'permission_error';
    }
    
    if (message.includes('rate limit')) {
      return 'rate_limit_error';
    }
    
    if (message.includes('validation')) {
      return 'validation_error';
    }
    
    return 'ai_service_error';
  }

  /**
   * 記錄錯誤
   */
  private logError(error: AIError, context: ErrorContext): void {
    if (!this.config.loggingEnabled) return;

    console.error('AI Error occurred:', {
      error: {
        message: error.message,
        code: error.code,
        type: error.type,
        retryable: error.retryable,
      },
      context,
    });

    // 發送遙測資料（如果啟用）
    if (this.config.telemetryEnabled) {
      this.sendTelemetry(error, context);
    }
  }

  /**
   * 更新錯誤歷史
   */
  private updateErrorHistory(error: AIError, context: ErrorContext): void {
    const key = context.queryId || context.userId || 'unknown';
    const errors = this.errorHistory.get(key) || [];
    
    errors.push(error);
    
    // 限制歷史記錄數量
    if (errors.length > 100) {
      errors.splice(0, errors.length - 100);
    }
    
    this.errorHistory.set(key, errors);
  }

  /**
   * 決定恢復策略
   */
  private determineRecoveryStrategy(error: AIError, context: ErrorContext): RecoveryStrategy {
    // 檢查重試次數
    const currentRetries = this.recoveryAttempts.get(context.queryId || 'unknown') || 0;
    const maxRetries = this.config.retryConfig[error.type]?.maxAttempts || 3;
    
    if (error.retryable && currentRetries < maxRetries) {
      return 'retry';
    }
    
    if (this.config.fallbackStrategies[error.type]) {
      return 'fallback';
    }
    
    if (error.type === 'network_error' || error.type === 'timeout_error') {
      return 'cache';
    }
    
    return 'manual';
  }

  /**
   * 執行恢復
   */
  private async executeRecovery(
    error: AIError,
    context: ErrorContext,
    strategy: RecoveryStrategy
  ): Promise<RecoveryResult> {
    const key = context.queryId || 'unknown';
    let retryCount = this.recoveryAttempts.get(key) || 0;

    switch (strategy) {
      case 'retry':
        retryCount++;
        this.recoveryAttempts.set(key, retryCount);
        
        // 實際的重試邏輯會在調用方處理
        return {
          success: false,
          strategy: 'retry',
          retryCount,
          totalTime: 0,
          error,
        };

      case 'fallback':
        const fallbackResult = await this.executeFallback(error, context);
        return {
          success: fallbackResult.success,
          strategy: 'fallback',
          result: fallbackResult.result,
          fallbackUsed: true,
          retryCount,
          totalTime: 0,
          error: fallbackResult.success ? undefined : error,
        };

      case 'cache':
        const cacheResult = await this.tryCache(context);
        return {
          success: cacheResult.success,
          strategy: 'cache',
          result: cacheResult.result,
          fallbackUsed: true,
          retryCount,
          totalTime: 0,
          error: cacheResult.success ? undefined : error,
        };

      default:
        return {
          success: false,
          strategy: 'manual',
          retryCount,
          totalTime: 0,
          error,
        };
    }
  }

  /**
   * 嘗試使用快取
   */
  private async tryCache(context: ErrorContext): Promise<FallbackResult> {
    // 簡化的快取邏輯
    // 實際實作應該整合真實的快取系統
    
    return {
      success: false,
      fallbackType: 'cache',
      degradedQuality: false,
      explanation: '沒有可用的快取資料',
    };
  }

  /**
   * 使用預設值
   */
  private async useDefaultValue(
    defaultValue: unknown,
    context: ErrorContext
  ): Promise<FallbackResult> {
    return {
      success: true,
      result: defaultValue as QueryResult,
      fallbackType: 'default_data',
      degradedQuality: true,
      explanation: '使用預設資料',
    };
  }

  /**
   * 使用降級服務
   */
  private async useFallbackService(
    serviceName: string,
    context: ErrorContext
  ): Promise<FallbackResult> {
    // 簡化的降級服務邏輯
    return {
      success: false,
      fallbackType: 'error_message',
      degradedQuality: true,
      explanation: `降級服務 ${serviceName} 暫時不可用`,
    };
  }

  /**
   * 簡化查詢
   */
  private async simplifyQuery(context: ErrorContext): Promise<FallbackResult> {
    // 簡化的查詢邏輯
    return {
      success: false,
      fallbackType: 'simplified_query',
      degradedQuality: true,
      explanation: '查詢簡化失敗',
    };
  }

  // ============================================================================
  // 私有方法 - 訊息處理
  // ============================================================================

  /**
   * 獲取通用錯誤訊息
   */
  private getGenericErrorMessage(error: AIError): {
    title: string;
    message: string;
    suggestions: string[];
    actions: ErrorAction[];
  } {
    return {
      title: '發生未知錯誤',
      message: error.message || '系統發生錯誤，請稍後再試',
      suggestions: [
        '檢查網路連線',
        '重新整理頁面',
        '稍後再試',
      ],
      actions: [
        {
          id: 'retry',
          label: '重試',
          type: 'retry',
          handler: () => window.location.reload(),
          primary: true,
        },
        {
          id: 'contact',
          label: '聯絡支援',
          type: 'contact_support',
          handler: () => console.log('Contact support'),
        },
      ],
    };
  }

  /**
   * 客製化錯誤訊息
   */
  private customizeErrorMessage(
    baseMessage: any,
    error: AIError,
    context: ErrorContext
  ): {
    title: string;
    message: string;
    suggestions: string[];
    actions: ErrorAction[];
  } {
    // 根據上下文客製化訊息
    let message = baseMessage.message;
    
    if (context.query) {
      message += ` (查詢: "${context.query.slice(0, 50)}...")`;
    }

    return {
      title: baseMessage.title,
      message,
      suggestions: baseMessage.suggestions,
      actions: baseMessage.actions,
    };
  }

  /**
   * 決定錯誤嚴重程度
   */
  private determineSeverity(error: AIError): 'low' | 'medium' | 'high' | 'critical' {
    switch (error.type) {
      case 'permission_error':
      case 'validation_error':
        return 'high';
      
      case 'network_error':
      case 'timeout_error':
        return 'medium';
      
      case 'rate_limit_error':
        return 'low';
      
      case 'ai_service_error':
      case 'data_access_error':
        return 'high';
      
      default:
        return 'medium';
    }
  }

  // ============================================================================
  // 私有方法 - 輔助函數
  // ============================================================================

  /**
   * 計算重試延遲
   */
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
      config.maxDelay
    );
    
    // 加入隨機抖動
    return delay + Math.random() * 1000;
  }

  /**
   * 睡眠函數
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 記錄重試嘗試
   */
  private logRetryAttempt(attempt: number, error: Error, context: ErrorContext): void {
    console.warn(`Retry attempt ${attempt} failed:`, {
      error: error.message,
      context: context.queryId,
    });
  }

  /**
   * 記錄恢復結果
   */
  private logRecoveryResult(result: RecoveryResult, context: ErrorContext): void {
    if (result.success) {
      console.info('Error recovery successful:', {
        strategy: result.strategy,
        retryCount: result.retryCount,
        totalTime: result.totalTime,
      });
    } else {
      console.error('Error recovery failed:', {
        strategy: result.strategy,
        error: result.error?.message,
        context: context.queryId,
      });
    }
  }

  /**
   * 發送遙測資料
   */
  private sendTelemetry(error: AIError, context: ErrorContext): void {
    // 簡化的遙測邏輯
    // 實際實作應該整合真實的遙測服務
    console.debug('Telemetry:', { error: error.type, context: context.queryId });
  }

  // ============================================================================
  // 私有方法 - 配置初始化
  // ============================================================================

  /**
   * 初始化配置
   */
  private initializeConfig(): ErrorHandlerConfig {
    return {
      retryConfig: {
        query_parse_error: {
          maxAttempts: 2,
          initialDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
          retryCondition: (error) => error.retryable,
        },
        intent_recognition_error: {
          maxAttempts: 2,
          initialDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
        },
        data_access_error: {
          maxAttempts: 3,
          initialDelay: 500,
          maxDelay: 3000,
          backoffMultiplier: 1.5,
        },
        ai_service_error: {
          maxAttempts: 3,
          initialDelay: 2000,
          maxDelay: 10000,
          backoffMultiplier: 2,
        },
        rate_limit_error: {
          maxAttempts: 5,
          initialDelay: 5000,
          maxDelay: 30000,
          backoffMultiplier: 2,
        },
        timeout_error: {
          maxAttempts: 2,
          initialDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
        },
        permission_error: {
          maxAttempts: 1,
          initialDelay: 0,
          maxDelay: 0,
          backoffMultiplier: 1,
        },
        validation_error: {
          maxAttempts: 1,
          initialDelay: 0,
          maxDelay: 0,
          backoffMultiplier: 1,
        },
        network_error: {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 8000,
          backoffMultiplier: 2,
        },
      },
      fallbackStrategies: {
        query_parse_error: {
          useCache: true,
          simplifyQuery: true,
        },
        intent_recognition_error: {
          useDefault: undefined,
          simplifyQuery: true,
        },
        data_access_error: {
          useCache: true,
          fallbackService: 'backup-db',
        },
        ai_service_error: {
          useCache: true,
          fallbackService: 'simple-parser',
        },
        rate_limit_error: {
          useCache: true,
        },
        timeout_error: {
          useCache: true,
          simplifyQuery: true,
        },
        permission_error: {
          useDefault: undefined,
        },
        validation_error: {
          simplifyQuery: true,
        },
        network_error: {
          useCache: true,
        },
      },
      userMessages: {
        query_parse_error: {
          title: '查詢理解錯誤',
          message: '抱歉，我無法理解您的查詢。請嘗試更明確的表達方式。',
          suggestions: [
            '使用更具體的詞彙',
            '檢查查詢是否包含必要資訊',
            '參考查詢範例',
          ],
          actions: [
            {
              id: 'retry',
              label: '重新輸入',
              type: 'retry',
              handler: () => {},
              primary: true,
            },
            {
              id: 'examples',
              label: '查看範例',
              type: 'manual',
              handler: () => {},
            },
          ],
        },
        intent_recognition_error: {
          title: '意圖識別失敗',
          message: '系統無法識別您的查詢意圖，請重新描述您的需求。',
          suggestions: [
            '明確說明想要查詢的內容',
            '指定時間範圍',
            '使用常見的業務術語',
          ],
          actions: [
            {
              id: 'retry',
              label: '重新查詢',
              type: 'retry',
              handler: () => {},
              primary: true,
            },
          ],
        },
        data_access_error: {
          title: '資料存取錯誤',
          message: '無法取得資料，請檢查您的權限或稍後再試。',
          suggestions: [
            '確認您有存取權限',
            '檢查網路連線',
            '聯絡管理員',
          ],
          actions: [
            {
              id: 'retry',
              label: '重試',
              type: 'retry',
              handler: () => {},
              primary: true,
            },
            {
              id: 'contact',
              label: '聯絡管理員',
              type: 'contact_support',
              handler: () => {},
            },
          ],
        },
        ai_service_error: {
          title: 'AI 服務錯誤',
          message: 'AI 分析服務暫時無法使用，請稍後再試。',
          suggestions: [
            '稍後重試',
            '使用簡化查詢',
            '聯絡技術支援',
          ],
          actions: [
            {
              id: 'retry',
              label: '重試',
              type: 'retry',
              handler: () => {},
              primary: true,
            },
            {
              id: 'fallback',
              label: '使用基本查詢',
              type: 'fallback',
              handler: () => {},
            },
          ],
        },
        rate_limit_error: {
          title: '請求頻率限制',
          message: '您的請求太頻繁，請稍後再試。',
          suggestions: [
            '等待一分鐘後重試',
            '減少查詢頻率',
            '考慮升級帳戶',
          ],
          actions: [
            {
              id: 'wait',
              label: '等待並重試',
              type: 'retry',
              handler: () => {},
              primary: true,
            },
          ],
        },
        timeout_error: {
          title: '請求逾時',
          message: '查詢處理時間過長，請嘗試簡化查詢或稍後再試。',
          suggestions: [
            '縮小查詢範圍',
            '減少資料量',
            '檢查網路連線',
          ],
          actions: [
            {
              id: 'retry',
              label: '重試',
              type: 'retry',
              handler: () => {},
              primary: true,
            },
            {
              id: 'simplify',
              label: '簡化查詢',
              type: 'fallback',
              handler: () => {},
            },
          ],
        },
        permission_error: {
          title: '權限不足',
          message: '您沒有執行此查詢的權限，請聯絡管理員。',
          suggestions: [
            '聯絡管理員申請權限',
            '使用其他查詢方式',
            '檢查帳戶狀態',
          ],
          actions: [
            {
              id: 'contact',
              label: '聯絡管理員',
              type: 'contact_support',
              handler: () => {},
              primary: true,
            },
          ],
        },
        validation_error: {
          title: '輸入驗證錯誤',
          message: '您的輸入格式不正確，請檢查並重新輸入。',
          suggestions: [
            '檢查輸入格式',
            '確認所有必填欄位',
            '參考輸入範例',
          ],
          actions: [
            {
              id: 'retry',
              label: '重新輸入',
              type: 'retry',
              handler: () => {},
              primary: true,
            },
          ],
        },
        network_error: {
          title: '網路連線錯誤',
          message: '網路連線出現問題，請檢查連線狀態後重試。',
          suggestions: [
            '檢查網路連線',
            '重新整理頁面',
            '稍後重試',
          ],
          actions: [
            {
              id: 'retry',
              label: '重試',
              type: 'retry',
              handler: () => {},
              primary: true,
            },
            {
              id: 'refresh',
              label: '重新整理',
              type: 'manual',
              handler: () => window.location.reload(),
            },
          ],
        },
      },
      loggingEnabled: true,
      telemetryEnabled: false,
    };
  }
}

// ============================================================================
// 匯出
// ============================================================================

/**
 * AI 錯誤處理器單例實例
 */
export const aiErrorHandler = new AIErrorHandler();

/**
 * 預設匯出
 */
export default aiErrorHandler;