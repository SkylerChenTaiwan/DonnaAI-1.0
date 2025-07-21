/**
 * 查詢狀態管理 Store
 * 管理自然語言查詢、澄清和圖表生成
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  NLQuery,
  QuerySession,
  QueryInterpretation,
  ChartData,
  QueryStoreState
} from '../types/data-visualization';
import { UserContext } from '../types/auth';
import {
  interpretDataQueryWithGemini,
  getCachedInterpretation,
  cacheInterpretation,
  generateQuerySummary
} from '../services/api/gemini-integration';
import { executeVisualizationQuery } from '../services/firebase/intelligent-queries';

interface QueryStore extends QueryStoreState {
  // Actions
  startQuery: (query: string, userContext: UserContext) => Promise<void>;
  handleInterpretation: (interpretation: QueryInterpretation) => void;
  submitClarification: (formData: any, userContext: UserContext) => Promise<void>;
  saveSuccessfulQuery: (finalQuery: string, chartId: string) => void;
  clearCurrentSession: () => void;
  loadQueryHistory: (userId: string) => Promise<void>;
  retryQuery: (userContext: UserContext) => Promise<void>;
  exportChart: (format: 'png' | 'csv') => Promise<void>;
}

export const useQueryStore = create<QueryStore>()(
  devtools(
    (set, get) => ({
      // State
      currentSession: null,
      queryHistory: [],
      cachedCharts: new Map(),
      isLoading: false,
      error: null,

      // Actions
      startQuery: async (query: string, userContext: UserContext) => {
        const { userId, organizationId, teamIds } = userContext;
        
        set({ 
          isLoading: true, 
          error: null,
          currentSession: {
            queryId: `query-${Date.now()}`,
            originalQuery: query,
            status: 'processing'
          }
        });

        try {
          // 檢查快取
          const cachedInterpretation = getCachedInterpretation(query);
          if (cachedInterpretation) {
            const interpretation = cachedInterpretation;
            get().handleInterpretation(interpretation);
            
            // 如果不需要澄清，直接生成圖表
            if (!interpretation.clarificationNeeded) {
              await get().executeQuery(interpretation, userContext);
            }
            return;
          }

          // 呼叫 Gemini API 解析查詢
          const interpretation = await interpretDataQueryWithGemini(
            query,
            userContext
          );

          // 快取結果
          cacheInterpretation(query, interpretation);
          
          // 更新狀態
          get().handleInterpretation(interpretation);
          
          // 如果不需要澄清，直接生成圖表
          if (!interpretation.clarificationNeeded) {
            await get().executeQuery(interpretation, userContext);
          }
        } catch (error) {
          console.error('查詢處理失敗:', error);
          set({
            error: error instanceof Error ? error.message : '查詢失敗',
            isLoading: false,
            currentSession: {
              ...get().currentSession!,
              status: 'error',
              error: error instanceof Error ? error.message : '查詢失敗'
            }
          });
        }
      },

      handleInterpretation: (interpretation: QueryInterpretation) => {
        const currentSession = get().currentSession;
        if (!currentSession) return;

        set({
          currentSession: {
            ...currentSession,
            interpretation,
            clarificationForm: interpretation.clarificationNeeded,
            status: interpretation.clarificationNeeded ? 'clarifying' : 'generating'
          },
          isLoading: false
        });
      },

      submitClarification: async (formData: any, userContext: UserContext) => {
        const currentSession = get().currentSession;
        if (!currentSession || !currentSession.interpretation) return;

        set({ 
          isLoading: true,
          currentSession: {
            ...currentSession,
            status: 'processing'
          }
        });

        try {
          // 重新解析查詢（包含澄清資料）
          const interpretation = await interpretDataQueryWithGemini(
            currentSession.originalQuery,
            userContext,
            formData
          );

          // 更新會話狀態
          set({
            currentSession: {
              ...currentSession,
              interpretation,
              finalParameters: formData,
              status: 'generating'
            }
          });

          // 生成圖表
          await get().executeQuery(interpretation, userContext);
        } catch (error) {
          console.error('澄清處理失敗:', error);
          set({
            error: error instanceof Error ? error.message : '澄清處理失敗',
            isLoading: false,
            currentSession: {
              ...currentSession,
              status: 'error',
              error: error instanceof Error ? error.message : '澄清處理失敗'
            }
          });
        }
      },

      executeQuery: async (interpretation: QueryInterpretation, userContext: UserContext) => {
        const currentSession = get().currentSession;
        if (!currentSession) return;

        try {
          // 執行查詢並生成圖表
          const chartData = await executeVisualizationQuery(
            interpretation,
            userContext.userId,
            userContext.organizationId,
            userContext.teamIds || []
          );

          // 更新會話狀態
          set({
            currentSession: {
              ...currentSession,
              status: 'completed'
            },
            isLoading: false
          });

          // 快取圖表
          const cachedCharts = get().cachedCharts;
          cachedCharts.set(chartData.id, chartData);

          // 生成查詢摘要並儲存
          const summary = await generateQuerySummary(interpretation);
          get().saveSuccessfulQuery(summary, chartData.id);

          return chartData;
        } catch (error) {
          console.error('圖表生成失敗:', error);
          set({
            error: error instanceof Error ? error.message : '圖表生成失敗',
            isLoading: false,
            currentSession: {
              ...currentSession,
              status: 'error',
              error: error instanceof Error ? error.message : '圖表生成失敗'
            }
          });
        }
      },

      saveSuccessfulQuery: (finalQuery: string, chartId: string) => {
        const currentSession = get().currentSession;
        if (!currentSession) return;

        const newQuery: NLQuery = {
          id: currentSession.queryId,
          query: currentSession.originalQuery,
          timestamp: new Date(),
          userId: '', // 會在呼叫時設定
          finalQuery,
          chartId,
          organizationId: '', // 會在呼叫時設定
          teamId: '' // 會在呼叫時設定
        };

        set({
          queryHistory: [newQuery, ...get().queryHistory.slice(0, 49)] // 保留最近 50 個查詢
        });
      },

      clearCurrentSession: () => {
        set({
          currentSession: null,
          error: null,
          isLoading: false
        });
      },

      loadQueryHistory: async (userId: string) => {
        // 這裡可以從 Firebase 載入查詢歷史
        // 暫時使用本地狀態
        try {
          // TODO: 實作從 Firebase 載入查詢歷史
          console.log('載入查詢歷史:', userId);
        } catch (error) {
          console.error('載入查詢歷史失敗:', error);
        }
      },

      retryQuery: async (userContext: UserContext) => {
        const currentSession = get().currentSession;
        if (!currentSession) return;

        await get().startQuery(currentSession.originalQuery, userContext);
      },

      exportChart: async (format: 'png' | 'csv') => {
        // TODO: 實作圖表匯出功能
        console.log('匯出圖表:', format);
      }
    }),
    {
      name: 'query-store',
      version: 1
    }
  )
);

// Hook for getting current chart data
export const useCurrentChart = (): ChartData | null => {
  const currentSession = useQueryStore(state => state.currentSession);
  const cachedCharts = useQueryStore(state => state.cachedCharts);
  
  if (!currentSession || currentSession.status !== 'completed') {
    return null;
  }

  // Get the latest chart for this session
  // In a real implementation, you'd need to track which chart belongs to which session
  const charts = Array.from(cachedCharts.values());
  return charts[charts.length - 1] || null;
};

// Hook for getting query suggestions
export const useQuerySuggestions = () => {
  const queryHistory = useQueryStore(state => state.queryHistory);
  
  // Generate suggestions based on query history
  const suggestions = queryHistory
    .slice(0, 5)
    .map(query => query.finalQuery || query.query)
    .filter((query, index, array) => array.indexOf(query) === index); // Remove duplicates
    
  return suggestions;
};