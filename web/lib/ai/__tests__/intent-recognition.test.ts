/**
 * PRP-124: 意圖識別引擎單元測試
 * 
 * @description 測試查詢意圖識別和分類功能
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import { IntentRecognitionEngine } from '../intent-recognition';
import type { QueryIntent, ExtractedEntity } from '../../../docs/types/ai-query-data-models';

describe('IntentRecognitionEngine', () => {
  let intentEngine: IntentRecognitionEngine;

  beforeEach(() => {
    intentEngine = new IntentRecognitionEngine();
  });

  describe('recognizeIntent', () => {
    // 1. 預期使用測試
    it('should recognize basic query intent', async () => {
      const text = '這個月的營收是多少？';
      const result = await intentEngine.recognizeIntent(text);

      expect(result).toEqual({
        primary: 'query',
        secondary: expect.any(Array),
        confidence: expect.any(Number),
        entities: expect.any(Array),
        reasoning: expect.any(String),
        suggestions: expect.any(Array)
      });

      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.primary).toBe('query');
    });

    it('should recognize comparison intent', async () => {
      const text = '比較這個月和上個月的銷售額';
      const result = await intentEngine.recognizeIntent(text);

      expect(result.primary).toBe('comparison');
      expect(result.entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'metric' }),
          expect.objectContaining({ type: 'time_period' })
        ])
      );
    });

    it('should recognize trend analysis intent', async () => {
      const text = '過去六個月的銷售趨勢';
      const result = await intentEngine.recognizeIntent(text);

      expect(result.primary).toBe('trend');
      expect(result.entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'time_period' })
        ])
      );
    });

    it('should recognize ranking intent', async () => {
      const text = '哪個地區的業績最好？';
      const result = await intentEngine.recognizeIntent(text);

      expect(result.primary).toBe('ranking');
      expect(result.entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'dimension' })
        ])
      );
    });

    it('should recognize aggregation intent', async () => {
      const text = '統計每個部門的客戶數量';
      const result = await intentEngine.recognizeIntent(text);

      expect(result.primary).toBe('aggregate');
      expect(result.entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'metric' }),
          expect.objectContaining({ type: 'dimension' })
        ])
      );
    });

    it('should recognize prediction intent', async () => {
      const text = '預測下季度的營收';
      const result = await intentEngine.recognizeIntent(text);

      expect(result.primary).toBe('prediction');
      expect(result.entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'time_period' }),
          expect.objectContaining({ type: 'metric' })
        ])
      );
    });

    // 2. 邊界條件測試
    it('should handle ambiguous query', async () => {
      const text = '銷售';
      const result = await intentEngine.recognizeIntent(text);

      expect(result.confidence).toBeLessThan(0.7);
      expect(result.suggestions).toEqual(
        expect.arrayContaining([
          expect.stringContaining('更具體')
        ])
      );
    });

    it('should handle empty input', async () => {
      const text = '';
      const result = await intentEngine.recognizeIntent(text);

      expect(result.primary).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.3);
    });

    it('should handle very complex multi-intent query', async () => {
      const text = '比較這個月和上個月的營收，並分析趨勢，同時顯示前五名業務員的排名';
      const result = await intentEngine.recognizeIntent(text);

      expect(result.secondary).toEqual(
        expect.arrayContaining(['comparison', 'trend', 'ranking'])
      );
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    // 3. 失敗情況測試
    it('should handle nonsensical input gracefully', async () => {
      const text = 'xyz123 隨機內容 !@#';
      const result = await intentEngine.recognizeIntent(text);

      expect(result.primary).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.3);
      expect(result.suggestions).toEqual(
        expect.arrayContaining([
          expect.stringContaining('有效的查詢')
        ])
      );
    });
  });

  describe('classifyQuery', () => {
    it('should classify simple metric query', () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'metric',
          value: '營收',
          normalizedValue: 'revenue',
          confidence: 0.9
        }
      ];

      const result = intentEngine.classifyQuery('這個月的營收', entities);

      expect(result.queryType).toBe('metric_retrieval');
      expect(result.complexity).toBe('simple');
    });

    it('should classify complex analytical query', () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'metric',
          value: '營收',
          normalizedValue: 'revenue',
          confidence: 0.9
        },
        {
          type: 'time_period',
          value: '過去六個月',
          normalizedValue: { start: new Date(), end: new Date(), granularity: 'month' },
          confidence: 0.8
        },
        {
          type: 'comparison_operator',
          value: '比較',
          normalizedValue: 'compare',
          confidence: 0.8
        }
      ];

      const result = intentEngine.classifyQuery('比較過去六個月的營收趨勢', entities);

      expect(result.queryType).toBe('analytical');
      expect(result.complexity).toBe('medium');
    });
  });

  describe('enhanceWithContext', () => {
    it('should enhance intent with user context', async () => {
      const baseIntent: QueryIntent = {
        primary: 'query',
        secondary: [],
        confidence: 0.8,
        entities: [],
        reasoning: 'Basic query',
        suggestions: []
      };

      const context = {
        userRole: 'sales_manager',
        currentPage: 'dashboard',
        recentQueries: ['客戶數量', '銷售額']
      };

      const result = intentEngine.enhanceWithContext(baseIntent, context);

      expect(result.confidence).toBeGreaterThanOrEqual(baseIntent.confidence);
      expect(result.suggestions).toEqual(
        expect.arrayContaining([
          expect.stringContaining('銷售')
        ])
      );
    });

    it('should provide role-specific suggestions', async () => {
      const baseIntent: QueryIntent = {
        primary: 'query',
        secondary: [],
        confidence: 0.8,
        entities: [],
        reasoning: 'Basic query',
        suggestions: []
      };

      const context = {
        userRole: 'admin',
        currentPage: 'analytics'
      };

      const result = intentEngine.enhanceWithContext(baseIntent, context);

      expect(result.suggestions).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/系統|使用者|效能/)
        ])
      );
    });
  });

  describe('getSuggestions', () => {
    it('should return relevant suggestions for query intent', () => {
      const intent: QueryIntent = {
        primary: 'query',
        secondary: [],
        confidence: 0.5,
        entities: [{
          type: 'metric',
          value: '營收',
          normalizedValue: 'revenue',
          confidence: 0.8
        }],
        reasoning: 'Low confidence query',
        suggestions: []
      };

      const suggestions = intentEngine.getSuggestions(intent);

      expect(suggestions).toEqual(
        expect.arrayContaining([
          expect.stringContaining('時間範圍'),
          expect.stringContaining('地區')
        ])
      );
    });

    it('should suggest comparison queries for single metrics', () => {
      const intent: QueryIntent = {
        primary: 'query',
        secondary: [],
        confidence: 0.8,
        entities: [{
          type: 'metric',
          value: '客戶數',
          normalizedValue: 'customer_count',
          confidence: 0.9
        }],
        reasoning: 'Simple metric query',
        suggestions: []
      };

      const suggestions = intentEngine.getSuggestions(intent);

      expect(suggestions).toEqual(
        expect.arrayContaining([
          expect.stringContaining('比較')
        ])
      );
    });
  });

  describe('validateIntent', () => {
    it('should validate complete intent structure', () => {
      const intent: QueryIntent = {
        primary: 'comparison',
        secondary: ['trend'],
        confidence: 0.85,
        entities: [
          {
            type: 'metric',
            value: '營收',
            normalizedValue: 'revenue',
            confidence: 0.9
          },
          {
            type: 'time_period',
            value: '這個月',
            normalizedValue: { start: new Date(), end: new Date(), granularity: 'month' },
            confidence: 0.8
          }
        ],
        reasoning: 'Comparison query with time entities',
        suggestions: []
      };

      const result = intentEngine.validateIntent(intent);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch missing required entities for comparison', () => {
      const intent: QueryIntent = {
        primary: 'comparison',
        secondary: [],
        confidence: 0.8,
        entities: [
          {
            type: 'metric',
            value: '營收',
            normalizedValue: 'revenue',
            confidence: 0.9
          }
          // 缺少時間實體進行比較
        ],
        reasoning: 'Incomplete comparison query',
        suggestions: []
      };

      const result = intentEngine.validateIntent(intent);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('比較查詢需要多個時間期間')
        ])
      );
    });

    it('should validate confidence thresholds', () => {
      const intent: QueryIntent = {
        primary: 'query',
        secondary: [],
        confidence: 0.2, // 過低的信心度
        entities: [],
        reasoning: 'Very low confidence',
        suggestions: []
      };

      const result = intentEngine.validateIntent(intent);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('信心度過低')
        ])
      );
    });
  });

  describe('performance and reliability', () => {
    it('should process intent recognition within time limit', async () => {
      const text = '過去三個月每個地區的銷售額趨勢分析';
      const startTime = Date.now();

      await intentEngine.recognizeIntent(text);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000); // 3秒內完成
    });

    it('should handle concurrent intent recognition', async () => {
      const queries = [
        '這個月的營收',
        '比較上季度業績',
        '客戶增長趨勢',
        '地區排名',
        '產品銷量統計'
      ];

      const promises = queries.map(query => intentEngine.recognizeIntent(query));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.primary).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('should maintain consistent results for same input', async () => {
      const text = '這個月的營收統計';
      
      const result1 = await intentEngine.recognizeIntent(text);
      const result2 = await intentEngine.recognizeIntent(text);

      expect(result1.primary).toBe(result2.primary);
      expect(Math.abs(result1.confidence - result2.confidence)).toBeLessThan(0.1);
    });
  });

  describe('error handling', () => {
    it('should handle AI service failures gracefully', async () => {
      // Mock AI failure
      const originalMethod = (intentEngine as any).aiClient;
      (intentEngine as any).aiClient = {
        analyzeIntent: jest.fn().mockRejectedValue(new Error('AI service down'))
      };

      const text = '這個月的營收';
      const result = await intentEngine.recognizeIntent(text);

      expect(result.primary).toBe('fallback');
      expect(result.confidence).toBeLessThan(0.5);

      // Restore
      (intentEngine as any).aiClient = originalMethod;
    });

    it('should provide fallback intent recognition', async () => {
      const text = '營收 這個月';
      
      // Simulate AI service returning null
      const originalMethod = (intentEngine as any).aiClient;
      (intentEngine as any).aiClient = {
        analyzeIntent: jest.fn().mockResolvedValue(null)
      };

      const result = await intentEngine.recognizeIntent(text);

      expect(result).toBeDefined();
      expect(result.primary).toBeDefined();
      expect(result.entities.length).toBeGreaterThan(0);

      // Restore
      (intentEngine as any).aiClient = originalMethod;
    });
  });
});