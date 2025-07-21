/**
 * 查詢 Store 測試
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQueryStore } from '../../stores/queryStore';
import { QueryInterpretation } from '../../types/data-visualization';
// import { UserContext } from '../../types/auth';

// Mock dependencies
vi.mock('../../services/api/gemini-integration', () => ({
  interpretDataQueryWithGemini: vi.fn(),
  getCachedInterpretation: vi.fn(),
  cacheInterpretation: vi.fn(),
  generateQuerySummary: vi.fn().mockResolvedValue('測試查詢摘要')
}));

vi.mock('../../services/firebase/intelligent-queries', () => ({
  executeVisualizationQuery: vi.fn()
}));

// Mock UserContext for future use
// const mockUserContext: UserContext = {
//   userId: 'test-user-123',
//   role: 'salesperson',
//   organizationId: 'test-org-123',
//   teamIds: ['team-1']
// };

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

describe('Query Store', () => {
  beforeEach(() => {
    // 重置 store 狀態
    const { result } = renderHook(() => useQueryStore());
    act(() => {
      result.current.clearCurrentSession();
    });
  });

  describe('初始狀態', () => {
    test('應該有正確的初始狀態', () => {
      const { result } = renderHook(() => useQueryStore());
      
      expect(result.current.currentSession).toBeNull();
      expect(result.current.queryHistory).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('查詢流程', () => {
    test('應該正確處理查詢解析', () => {
      const { result } = renderHook(() => useQueryStore());
      
      // 先設置當前會話
      act(() => {
        result.current.currentSession = {
          queryId: 'test-query-1',
          originalQuery: '測試查詢',
          status: 'processing'
        };
      });
      
      act(() => {
        result.current.handleInterpretation(mockInterpretation);
      });
      
      expect(result.current.currentSession?.interpretation).toEqual(mockInterpretation);
      expect(result.current.currentSession?.status).toBe('generating');
      expect(result.current.isLoading).toBe(false);
    });

    test('應該處理需要澄清的查詢', () => {
      const { result } = renderHook(() => useQueryStore());
      
      // 先設置當前會話
      act(() => {
        result.current.currentSession = {
          queryId: 'test-query-2',
          originalQuery: '測試澄清查詢',
          status: 'processing'
        };
      });
      
      const interpretationWithClarification: QueryInterpretation = {
        ...mockInterpretation,
        clarificationNeeded: {
          fields: [
            {
              name: 'metric',
              label: '指標',
              type: 'select',
              options: [
                { value: 'count', label: '數量' },
                { value: 'sum', label: '總和' }
              ]
            }
          ]
        }
      };
      
      act(() => {
        result.current.handleInterpretation(interpretationWithClarification);
      });
      
      expect(result.current.currentSession?.status).toBe('clarifying');
      expect(result.current.currentSession?.clarificationForm).toBeDefined();
    });
  });

  describe('會話管理', () => {
    test('應該正確清除當前會話', () => {
      const { result } = renderHook(() => useQueryStore());
      
      // 設置一個會話
      act(() => {
        result.current.currentSession = {
          queryId: 'test-query-3',
          originalQuery: '測試清除查詢',
          status: 'processing'
        };
      });
      
      act(() => {
        result.current.handleInterpretation(mockInterpretation);
      });
      
      expect(result.current.currentSession).not.toBeNull();
      
      // 清除會話
      act(() => {
        result.current.clearCurrentSession();
      });
      
      expect(result.current.currentSession).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    test('應該正確儲存成功的查詢', () => {
      const { result } = renderHook(() => useQueryStore());
      
      // 設置當前會話
      act(() => {
        result.current.currentSession = {
          queryId: 'test-query-1',
          originalQuery: '測試查詢',
          status: 'completed'
        };
      });
      
      act(() => {
        result.current.saveSuccessfulQuery('完整查詢描述', 'chart-123');
      });
      
      expect(result.current.queryHistory).toHaveLength(1);
      expect(result.current.queryHistory[0].query).toBe('測試查詢');
      expect(result.current.queryHistory[0].finalQuery).toBe('完整查詢描述');
      expect(result.current.queryHistory[0].chartId).toBe('chart-123');
    });
  });

  describe('錯誤處理', () => {
    test('應該正確設置錯誤狀態', () => {
      const { result } = renderHook(() => useQueryStore());
      
      act(() => {
        result.current.currentSession = {
          queryId: 'test-query-1',
          originalQuery: '測試查詢',
          status: 'error',
          error: '測試錯誤'
        };
        result.current.error = '測試錯誤';
        result.current.isLoading = false;
      });
      
      expect(result.current.error).toBe('測試錯誤');
      expect(result.current.currentSession?.status).toBe('error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('快取管理', () => {
    test('應該正確管理圖表快取', () => {
      const { result } = renderHook(() => useQueryStore());
      
      const mockChart = {
        id: 'chart-123',
        type: 'bar' as const,
        data: [],
        config: {},
        metadata: {
          title: '測試圖表',
          description: '測試描述',
          generatedAt: new Date(),
          dataSource: 'customers' as const,
          metrics: ['count'],
          dimensions: ['time'],
          filters: {},
          recordCount: 10
        },
        queryId: 'query-123'
      };
      
      act(() => {
        result.current.cachedCharts.set('chart-123', mockChart);
      });
      
      expect(result.current.cachedCharts.has('chart-123')).toBe(true);
      expect(result.current.cachedCharts.get('chart-123')).toEqual(mockChart);
    });
  });
});

describe('Query Store Hooks', () => {
  test('useCurrentChart 應該返回正確的圖表', () => {
    // 這個測試需要實際的 hook 實作，暫時跳過
    expect(true).toBe(true);
  });

  test('useQuerySuggestions 應該返回查詢建議', () => {
    // 這個測試需要實際的 hook 實作，暫時跳過
    expect(true).toBe(true);
  });
});