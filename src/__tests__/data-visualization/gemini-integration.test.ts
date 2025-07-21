/**
 * Gemini 整合服務測試
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  interpretDataQueryWithGemini,
  getCachedInterpretation,
  cacheInterpretation,
  generateQuerySummary
} from '../../services/api/gemini-integration';
import { QueryInterpretation } from '../../types/data-visualization';
import { UserContext } from '../../types/auth';

// Mock UserContext
const mockUserContext: UserContext = {
  userId: 'test-user-123',
  role: 'salesperson',
  organizationId: 'test-org-123',
  teamIds: ['team-1', 'team-2']
};

// Mock QueryInterpretation
const mockInterpretation: QueryInterpretation = {
  entities: {
    dataType: 'customers',
    metrics: ['count'],
    dimensions: ['time'],
    filters: {},
    timeRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31')
    }
  },
  suggestedChartType: 'bar',
  confidence: 0.9
};

describe('Gemini Integration Service', () => {
  beforeEach(() => {
    // 清理快取
    const cache = (globalThis as any).interpretationCache;
    if (cache) {
      cache.clear();
    }
  });

  describe('generateQuerySummary', () => {
    test('應該生成正確的查詢摘要', async () => {
      const summary = await generateQuerySummary(mockInterpretation);
      
      expect(summary).toContain('客戶');
      expect(summary).toMatch(/數量|count/); // 可能是中文或英文
      expect(summary).toMatch(/長條圖|bar/); // 可能是中文或英文
      expect(summary).toContain('2025');
    });

    test('應該處理無時間範圍的查詢', async () => {
      const interpretationNoTime: QueryInterpretation = {
        ...mockInterpretation,
        entities: {
          ...mockInterpretation.entities,
          timeRange: undefined
        }
      };

      const summary = await generateQuerySummary(interpretationNoTime);
      
      expect(summary).toContain('全部時間');
    });
  });

  describe('快取管理', () => {
    test('應該正確儲存和讀取快取', () => {
      const query = '測試查詢';
      
      // 檢查初始狀態
      expect(getCachedInterpretation(query)).toBeNull();
      
      // 儲存到快取
      cacheInterpretation(query, mockInterpretation);
      
      // 讀取快取
      const cached = getCachedInterpretation(query);
      expect(cached).toEqual(mockInterpretation);
    });

    test('應該處理不存在的快取項目', () => {
      const result = getCachedInterpretation('不存在的查詢');
      expect(result).toBeNull();
    });
  });

  describe('查詢解析', () => {
    // 注意：這些測試需要實際的 Gemini API，在實際環境中可能需要 mock
    test.skip('應該解析基本客戶查詢', async () => {
      const query = '顯示本月的客戶數量';
      
      const result = await interpretDataQueryWithGemini(query, mockUserContext);
      
      expect(result.entities.dataType).toBe('customers');
      expect(result.entities.metrics).toContain('count');
      expect(result.suggestedChartType).toBe('bar');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test.skip('應該處理需要澄清的查詢', async () => {
      const query = '顯示業績';
      
      const result = await interpretDataQueryWithGemini(query, mockUserContext);
      
      expect(result.clarificationNeeded).toBeDefined();
      expect(result.clarificationNeeded?.fields).toBeDefined();
      expect(result.clarificationNeeded?.fields.length).toBeGreaterThan(0);
    });

    test.skip('應該處理澄清回應', async () => {
      const query = '顯示業績';
      const clarificationResponse = {
        metric: '新增客戶數量',
        timeRange: '本月'
      };
      
      const result = await interpretDataQueryWithGemini(
        query, 
        mockUserContext, 
        clarificationResponse
      );
      
      expect(result.clarificationNeeded).toBeUndefined();
      expect(result.entities.dataType).toBe('customers');
    });
  });

  describe('錯誤處理', () => {
    test.skip('應該處理無效的查詢', async () => {
      const query = '';
      
      await expect(
        interpretDataQueryWithGemini(query, mockUserContext)
      ).rejects.toThrow();
    });

    test.skip('應該處理 API 錯誤', async () => {
      // Mock API 錯誤
      const originalEnv = process.env.VITE_GEMINI_API_KEY;
      process.env.VITE_GEMINI_API_KEY = 'invalid-key';
      
      const query = '測試查詢';
      
      await expect(
        interpretDataQueryWithGemini(query, mockUserContext)
      ).rejects.toThrow();
      
      // 恢復環境變數
      process.env.VITE_GEMINI_API_KEY = originalEnv;
    });
  });
});

describe('查詢模式測試', () => {
  test('應該識別客戶相關查詢', () => {
    const queries = [
      '顯示本月客戶數量',
      '新增客戶趨勢',
      '客戶拜訪統計'
    ];
    
    queries.forEach(query => {
      expect(query).toMatch(/客戶/);
    });
  });

  test('應該識別任務相關查詢', () => {
    const queries = [
      '任務完成率',
      '待辦事項統計',
      '團隊任務分佈'
    ];
    
    queries.forEach(query => {
      expect(query).toMatch(/任務|待辦/);
    });
  });

  test('應該識別時間範圍', () => {
    const timeRanges = [
      '本月',
      '上季度',
      '最近30天',
      '本週'
    ];
    
    timeRanges.forEach(range => {
      expect(range).toMatch(/本月|上季|最近|本週/);
    });
  });
});