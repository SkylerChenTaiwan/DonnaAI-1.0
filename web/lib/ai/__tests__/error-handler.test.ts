/**
 * PRP-124: 錯誤處理器單元測試
 * 
 * @description 測試 AI 錯誤處理、恢復策略和降級機制
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import { AIErrorHandler } from '../error-handler';
import type { AIError } from '../../../docs/types/ai-query-data-models';

// Mock AIError class
class MockAIError extends Error implements AIError {
  constructor(
    message: string,
    public code: string,
    public type: any,
    public retryable: boolean,
    public timestamp: Date = new Date()
  ) {
    super(message);
    this.name = 'AIError';
  }
}

describe('AIErrorHandler', () => {
  let errorHandler: AIErrorHandler;

  beforeEach(() => {
    errorHandler = new AIErrorHandler();
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    // 1. 預期使用測試
    it('should handle network error with retry strategy', async () => {
      const error = new MockAIError(
        'Network connection failed',
        'NETWORK_ERROR',
        'network_error',
        true
      );

      const context = {
        queryId: 'test-query-1',
        userId: 'test-user',
        timestamp: new Date(),
        query: '這個月的營收'
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.success).toBe(false);
      expect(result.strategy).toBe('retry');
      expect(result.retryCount).toBe(1);
      expect(result.error).toEqual(error);
    });

    it('should handle AI service error with fallback strategy', async () => {
      const error = new MockAIError(
        'AI service temporarily unavailable',
        'AI_SERVICE_ERROR',
        'ai_service_error',
        true
      );

      const context = {
        queryId: 'test-query-2',
        userId: 'test-user',
        timestamp: new Date(),
        query: '客戶統計'
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.strategy).toBe('fallback');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should handle validation error without retry', async () => {
      const error = new MockAIError(
        'Invalid query format',
        'VALIDATION_ERROR',
        'validation_error',
        false
      );

      const context = {
        queryId: 'test-query-3',
        userId: 'test-user',
        timestamp: new Date(),
        query: 'invalid query'
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.strategy).toBe('manual');
      expect(result.retryCount).toBe(0);
    });

    it('should handle permission error correctly', async () => {
      const error = new MockAIError(
        'Insufficient permissions',
        'PERMISSION_ERROR',
        'permission_error',
        false
      );

      const context = {
        queryId: 'test-query-4',
        userId: 'test-user',
        timestamp: new Date(),
        query: '管理員資料'
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.success).toBe(false);
      expect(result.strategy).toBe('manual');
      expect(result.error?.type).toBe('permission_error');
    });

    // 2. 邊界條件測試
    it('should handle generic Error objects', async () => {
      const error = new Error('Generic error message');

      const context = {
        queryId: 'test-query-5',
        userId: 'test-user',
        timestamp: new Date()
      };

      const result = await errorHandler.handleError(error, context);

      expect(result).toBeDefined();
      expect(result.strategy).toBeDefined();
    });

    it('should handle empty context', async () => {
      const error = new MockAIError(
        'Test error',
        'TEST_ERROR',
        'ai_service_error',
        true
      );

      const context = {
        timestamp: new Date()
      };

      const result = await errorHandler.handleError(error, context);

      expect(result).toBeDefined();
      expect(result.totalTime).toBeGreaterThan(0);
    });

    // 3. 失敗情況測試
    it('should handle error handler failure gracefully', async () => {
      // Mock a method to throw an error
      const originalMethod = (errorHandler as any).standardizeError;
      (errorHandler as any).standardizeError = jest.fn().mockImplementation(() => {
        throw new Error('Error handler internal error');
      });

      const error = new MockAIError(
        'Original error',
        'ORIGINAL_ERROR',
        'ai_service_error',
        true
      );

      const context = {
        timestamp: new Date()
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.success).toBe(false);
      expect(result.strategy).toBe('manual');

      // Restore original method
      (errorHandler as any).standardizeError = originalMethod;
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly message for network error', () => {
      const error = new MockAIError(
        'Connection timeout',
        'NETWORK_ERROR',
        'network_error',
        true
      );

      const context = {
        timestamp: new Date(),
        query: '營收查詢'
      };

      const message = errorHandler.getUserFriendlyMessage(error, context);

      expect(message.title).toBe('網路連線錯誤');
      expect(message.message).toContain('網路連線出現問題');
      expect(message.suggestions).toEqual(
        expect.arrayContaining([
          expect.stringContaining('檢查網路連線')
        ])
      );
      expect(message.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'retry',
            primary: true
          })
        ])
      );
    });

    it('should return message for permission error', () => {
      const error = new MockAIError(
        'Access denied',
        'PERMISSION_ERROR',
        'permission_error',
        false
      );

      const context = {
        timestamp: new Date()
      };

      const message = errorHandler.getUserFriendlyMessage(error, context);

      expect(message.title).toBe('權限不足');
      expect(message.severity).toBe('high');
      expect(message.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'contact_support'
          })
        ])
      );
    });

    it('should return generic message for unknown error types', () => {
      const error = new MockAIError(
        'Unknown error',
        'UNKNOWN_ERROR',
        'unknown_type' as any,
        true
      );

      const context = {
        timestamp: new Date()
      };

      const message = errorHandler.getUserFriendlyMessage(error, context);

      expect(message.title).toBe('發生未知錯誤');
      expect(message.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'retry'
          })
        ])
      );
    });

    it('should customize message with query context', () => {
      const error = new MockAIError(
        'Query parse error',
        'QUERY_PARSE_ERROR',
        'query_parse_error',
        true
      );

      const context = {
        timestamp: new Date(),
        query: '這個月的營收數據統計分析報告'
      };

      const message = errorHandler.getUserFriendlyMessage(error, context);

      expect(message.message).toContain('這個月的營收數據統計分析報告...');
    });
  });

  describe('retryOperation', () => {
    it('should retry operation with exponential backoff', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const context = {
        queryId: 'retry-test',
        timestamp: new Date()
      };

      const result = await errorHandler.retryOperation(
        operation,
        'network_error',
        context
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retry attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      const context = {
        queryId: 'retry-fail-test',
        timestamp: new Date()
      };

      await expect(
        errorHandler.retryOperation(operation, 'network_error', context)
      ).rejects.toThrow('Persistent failure');

      expect(operation).toHaveBeenCalledTimes(3); // default max attempts for network_error
    });

    it('should not retry non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(
        new MockAIError('Permission denied', 'PERM_ERROR', 'permission_error', false)
      );

      const context = {
        queryId: 'no-retry-test',
        timestamp: new Date()
      };

      await expect(
        errorHandler.retryOperation(operation, 'permission_error', context)
      ).rejects.toThrow('Permission denied');

      expect(operation).toHaveBeenCalledTimes(1); // no retries for permission errors
    });
  });

  describe('executeFallback', () => {
    it('should attempt cache fallback', async () => {
      const error = new MockAIError(
        'Service unavailable',
        'SERVICE_ERROR',
        'ai_service_error',
        true
      );

      const context = {
        queryId: 'fallback-test',
        timestamp: new Date(),
        query: '營收統計'
      };

      const result = await errorHandler.executeFallback(error, context);

      expect(result.fallbackType).toBe('cache');
      expect(result.degradedQuality).toBe(false);
    });

    it('should use default value when available', async () => {
      const error = new MockAIError(
        'Intent recognition failed',
        'INTENT_ERROR',
        'intent_recognition_error',
        true
      );

      const context = {
        timestamp: new Date()
      };

      const result = await errorHandler.executeFallback(error, context);

      expect(result.fallbackType).toBe('default_data');
      expect(result.success).toBe(true);
    });

    it('should handle fallback failure gracefully', async () => {
      const error = new MockAIError(
        'Unknown error type',
        'UNKNOWN_ERROR',
        'unknown_error_type' as any,
        true
      );

      const context = {
        timestamp: new Date()
      };

      const result = await errorHandler.executeFallback(error, context);

      expect(result.success).toBe(false);
      expect(result.fallbackType).toBe('error_message');
      expect(result.explanation).toContain('沒有可用的降級選項');
    });
  });

  describe('error statistics and cleanup', () => {
    it('should track error statistics', () => {
      const errors = [
        new MockAIError('Error 1', 'E1', 'network_error', true),
        new MockAIError('Error 2', 'E2', 'network_error', true),
        new MockAIError('Error 3', 'E3', 'ai_service_error', true)
      ];

      // Simulate recording errors
      errors.forEach((error, index) => {
        const context = {
          queryId: `query-${index}`,
          timestamp: new Date()
        };
        
        (errorHandler as any).updateErrorHistory(error, context);
      });

      const stats = errorHandler.getErrorStatistics();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType.network_error).toBe(2);
      expect(stats.errorsByType.ai_service_error).toBe(1);
      expect(stats.commonErrors).toHaveLength(2);
    });

    it('should cleanup old error records', () => {
      // Add some old errors
      const oldError = new MockAIError(
        'Old error',
        'OLD_ERROR',
        'network_error',
        true,
        new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      );

      const recentError = new MockAIError(
        'Recent error',
        'RECENT_ERROR',
        'ai_service_error',
        true
      );

      const oldContext = {
        queryId: 'old-query',
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000)
      };

      const recentContext = {
        queryId: 'recent-query',
        timestamp: new Date()
      };

      (errorHandler as any).updateErrorHistory(oldError, oldContext);
      (errorHandler as any).updateErrorHistory(recentError, recentContext);

      // Cleanup errors older than 24 hours
      errorHandler.cleanupErrorHistory(24 * 60 * 60 * 1000);

      const stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsByType.ai_service_error).toBe(1);
      expect(stats.errorsByType.network_error).toBeUndefined();
    });
  });

  describe('error inference and standardization', () => {
    it('should infer error type from message', () => {
      const networkError = new Error('Network request failed');
      const context = { timestamp: new Date() };

      const standardized = (errorHandler as any).standardizeError(networkError, context);

      expect(standardized.type).toBe('network_error');
    });

    it('should infer timeout error type', () => {
      const timeoutError = new Error('Request timeout exceeded');
      const context = { timestamp: new Date() };

      const standardized = (errorHandler as any).standardizeError(timeoutError, context);

      expect(standardized.type).toBe('timeout_error');
    });

    it('should infer permission error type', () => {
      const permissionError = new Error('Authentication required');
      const context = { timestamp: new Date() };

      const standardized = (errorHandler as any).standardizeError(permissionError, context);

      expect(standardized.type).toBe('permission_error');
    });

    it('should default to ai_service_error for unknown errors', () => {
      const unknownError = new Error('Something went wrong');
      const context = { timestamp: new Date() };

      const standardized = (errorHandler as any).standardizeError(unknownError, context);

      expect(standardized.type).toBe('ai_service_error');
    });
  });

  describe('error severity determination', () => {
    it('should classify permission errors as high severity', () => {
      const error = new MockAIError(
        'Access denied',
        'PERMISSION_ERROR',
        'permission_error',
        false
      );

      const severity = (errorHandler as any).determineSeverity(error);

      expect(severity).toBe('high');
    });

    it('should classify network errors as medium severity', () => {
      const error = new MockAIError(
        'Network failed',
        'NETWORK_ERROR',
        'network_error',
        true
      );

      const severity = (errorHandler as any).determineSeverity(error);

      expect(severity).toBe('medium');
    });

    it('should classify rate limit errors as low severity', () => {
      const error = new MockAIError(
        'Rate limited',
        'RATE_LIMIT_ERROR',
        'rate_limit_error',
        true
      );

      const severity = (errorHandler as any).determineSeverity(error);

      expect(severity).toBe('low');
    });
  });

  describe('performance', () => {
    it('should handle errors within reasonable time', async () => {
      const error = new MockAIError(
        'Performance test error',
        'PERF_ERROR',
        'ai_service_error',
        true
      );

      const context = {
        queryId: 'perf-test',
        timestamp: new Date()
      };

      const startTime = Date.now();
      await errorHandler.handleError(error, context);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // 1秒內完成
    });

    it('should handle concurrent error processing', async () => {
      const errors = Array.from({ length: 10 }, (_, i) => 
        new MockAIError(
          `Concurrent error ${i}`,
          `ERROR_${i}`,
          'network_error',
          true
        )
      );

      const contexts = errors.map((_, i) => ({
        queryId: `concurrent-${i}`,
        timestamp: new Date()
      }));

      const promises = errors.map((error, i) => 
        errorHandler.handleError(error, contexts[i])
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.strategy).toBeDefined();
      });
    });
  });
});