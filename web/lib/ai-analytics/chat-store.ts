/**
 * PRP-124 Phase 3: AI Analytics Chat Store
 * 
 * @description 使用 Zustand 管理 AI 分析對話狀態
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { queryParser } from '@/lib/ai/query-parser';
import { intentRecognition } from '@/lib/ai/intent-recognition';
import { chartRecommender } from '@/lib/ai/chart-recommender';
import { performanceMonitor } from '@/lib/ai/performance-monitor';
import type {
  Conversation,
  ConversationState,
  ConversationContext,
  Message,
  MessageType,
  MessageContent,
  MessageSender,
  ChatState,
  InputState,
  VoiceInputState,
  QuerySuggestion,
  SuggestionType,
  AIQuery,
  QueryResult,
  QueryIntent,
  ChartConfig,
  AIError,
  QueryPermission
} from '@/docs/types/ai-query-data-models';

// ============================================================================
// Store 介面定義
// ============================================================================

interface ChatStore extends ChatState {
  // ============================================================================
  // Actions - 對話管理
  // ============================================================================
  
  /** 開始新對話 */
  startConversation: () => Conversation;
  
  /** 載入對話 */
  loadConversation: (conversationId: string) => Promise<void>;
  
  /** 切換對話 */
  switchConversation: (conversationId: string) => void;
  
  /** 清除當前對話 */
  clearConversation: () => void;
  
  /** 刪除對話 */
  deleteConversation: (conversationId: string) => void;
  
  /** 更新對話標題 */
  updateConversationTitle: (conversationId: string, title: string) => void;
  
  /** 釘選對話 */
  pinConversation: (conversationId: string, pinned: boolean) => void;
  
  // ============================================================================
  // Actions - 訊息管理
  // ============================================================================
  
  /** 發送訊息 */
  sendMessage: (content: string, type?: MessageType) => Promise<QueryResult | null>;
  
  /** 重發訊息 */
  resendMessage: (messageId: string) => Promise<void>;
  
  /** 編輯訊息 */
  editMessage: (messageId: string, newContent: string) => void;
  
  /** 刪除訊息 */
  deleteMessage: (messageId: string) => void;
  
  /** 添加訊息反應 */
  addReaction: (messageId: string, reaction: string) => void;
  
  /** 複製訊息 */
  copyMessage: (messageId: string) => void;
  
  // ============================================================================
  // Actions - 輸入狀態
  // ============================================================================
  
  /** 設定輸入值 */
  setInputValue: (value: string) => void;
  
  /** 設定輸入模式 */
  setInputMode: (mode: 'text' | 'voice') => void;
  
  /** 更新輸入狀態 */
  updateInputState: (state: Partial<InputState>) => void;
  
  // ============================================================================
  // Actions - 建議管理
  // ============================================================================
  
  /** 載入建議 */
  loadSuggestions: (query?: string) => Promise<void>;
  
  /** 添加自訂建議 */
  addCustomSuggestion: (suggestion: Omit<QuerySuggestion, 'id'>) => void;
  
  /** 移除建議 */
  removeSuggestion: (suggestionId: string) => void;
  
  /** 更新建議使用次數 */
  updateSuggestionUsage: (suggestionId: string) => void;
  
  // ============================================================================
  // Actions - 錯誤處理
  // ============================================================================
  
  /** 設定錯誤 */
  setError: (error: Error | null) => void;
  
  /** 清除錯誤 */
  clearError: () => void;
  
  // ============================================================================
  // Actions - 載入狀態
  // ============================================================================
  
  /** 設定載入狀態 */
  setLoading: (loading: boolean) => void;
  
  // ============================================================================
  // Actions - 歷史管理
  // ============================================================================
  
  /** 顯示/隱藏歷史 */
  toggleHistory: () => void;
  
  /** 搜尋歷史 */
  searchHistory: (query: string) => Conversation[];
  
  /** 匯出對話歷史 */
  exportHistory: (conversationId?: string) => Promise<string>;
  
  /** 清除所有歷史 */
  clearAllHistory: () => void;
}

// ============================================================================
// 預設值
// ============================================================================

const createDefaultInputState = (): InputState => ({
  value: '',
  isTyping: false,
  isRecording: false,
  mode: 'text',
  voiceInputState: {
    status: 'idle',
    volumeLevel: 0,
    language: 'zh-TW'
  }
});

const createDefaultConversationContext = (): ConversationContext => ({
  entities: new Map(),
  variables: new Map(),
  queryHistory: [],
  preferences: {}
});

// ============================================================================
// 輔助函數
// ============================================================================

const createMessage = (
  conversationId: string,
  type: MessageType,
  sender: MessageSender,
  content: MessageContent,
  queryId?: string
): Message => ({
  id: uuidv4(),
  conversationId,
  type,
  sender,
  content,
  timestamp: new Date(),
  status: 'sent',
  queryId,
  attachments: [],
  reactions: [],
  isEdited: false
});

const createUserMessage = (conversationId: string, text: string): Message =>
  createMessage(
    conversationId,
    'user_query',
    { type: 'user', id: 'current-user', name: '您' },
    { text }
  );

const createAIMessage = (
  conversationId: string,
  content: MessageContent,
  queryId?: string
): Message =>
  createMessage(
    conversationId,
    'ai_response',
    { type: 'ai', id: 'ai-assistant', name: 'AI 助理' },
    content,
    queryId
  );

const createSystemMessage = (conversationId: string, text: string): Message =>
  createMessage(
    conversationId,
    'system',
    { type: 'system', id: 'system', name: 'System' },
    { text }
  );

// ============================================================================
// Mock AI 處理函數
// ============================================================================

const mockAIProcessing = async (query: string): Promise<QueryResult> => {
  // 模擬 AI 處理延遲
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
  
  // 模擬錯誤情況 (10% 機率)
  if (Math.random() < 0.1) {
    throw new Error('AI 服務暫時無法使用，請稍後再試。');
  }

  // 使用現有的 AI 引擎進行處理
  try {
    const parseResult = await queryParser.parse(query);
    const intentResult = await intentRecognition.recognizeIntent(query);
    const chartRecommendation = await chartRecommender.recommend(parseResult, intentResult);
    
    // 生成模擬資料
    const mockData = generateMockData(query);
    
    return {
      queryId: uuidv4(),
      status: 'success',
      data: {
        columns: [
          { name: 'date', type: 'date', description: '日期' },
          { name: 'value', type: 'number', description: '數值' }
        ],
        rows: mockData,
        sources: [
          {
            type: 'firestore',
            name: 'DonnaAI 資料庫',
            connection: { endpoint: 'firestore://donnaai' }
          }
        ]
      },
      chartConfig: chartRecommendation?.primary.config || {
        type: 'line',
        title: '查詢結果',
        dataBinding: {
          xAxis: { field: 'date', label: '日期' },
          yAxis: { field: 'value', label: '數值' }
        }
      },
      explanation: {
        summary: generateMockExplanation(query),
        keyFindings: [
          '資料顯示明顯的上升趨勢',
          '本月表現超出預期目標',
          '建議持續監控關鍵指標'
        ],
        insights: [],
        recommendations: [
          '建議加強客戶關係管理',
          '考慮擴大成功策略的應用範圍'
        ],
        confidence: 'high'
      },
      suggestions: [
        {
          id: uuidv4(),
          text: '查看詳細的趨勢分析',
          type: 'contextual' as SuggestionType,
          relevance: 0.9
        }
      ],
      metadata: {
        executionTime: 2300,
        rowCount: mockData.length,
        dataSources: ['DonnaAI 資料庫'],
        lastUpdated: new Date()
      }
    };
  } catch (error) {
    console.error('AI 處理錯誤:', error);
    throw new Error('查詢處理時發生錯誤，請稍後再試。');
  }
};

const generateMockData = (query: string) => {
  const dataPoints = 12;
  const baseValue = Math.random() * 100 + 50;
  
  return Array.from({ length: dataPoints }, (_, index) => ({
    date: new Date(2024, index, 1).toISOString().split('T')[0],
    value: Math.round(baseValue + Math.sin(index * 0.5) * 20 + Math.random() * 10)
  }));
};

const generateMockExplanation = (query: string): string => {
  if (query.includes('營收') || query.includes('收入')) {
    return '根據分析，營收表現整體呈現穩定成長趨勢。過去一年的數據顯示，平均月成長率約為 3-5%，特別是在第三和第四季度表現突出。';
  } else if (query.includes('客戶')) {
    return '客戶分析結果顯示，新客戶獲取率保持良好水平，客戶留存率達到 85%。重點客戶群體的貢獻持續增加，建議加強服務品質。';
  } else if (query.includes('績效') || query.includes('表現')) {
    return '團隊整體績效表現良好，關鍵績效指標均達到或超過設定目標。建議持續優化工作流程以提升效率。';
  } else {
    return '基於現有資料分析，相關指標表現穩定。建議定期監控趨勢變化，及時調整策略以維持良好表現。';
  }
};

// ============================================================================
// 建議生成
// ============================================================================

const generateSuggestions = (query: string = ''): QuerySuggestion[] => {
  const baseSuggestions: QuerySuggestion[] = [
    {
      id: 'suggestion-1',
      text: '本月營收表現如何？',
      type: 'popular',
      category: '營收分析',
      icon: '💰',
      relevance: 0.9,
      usageCount: 45,
      lastUsed: new Date('2024-01-15')
    },
    {
      id: 'suggestion-2',
      text: '哪些客戶需要重點關注？',
      type: 'popular',
      category: '客戶分析',
      icon: '👥',
      relevance: 0.8,
      usageCount: 32,
      lastUsed: new Date('2024-01-14')
    },
    {
      id: 'suggestion-3',
      text: '團隊績效排名如何？',
      type: 'popular',
      category: '績效分析',
      icon: '📊',
      relevance: 0.85,
      usageCount: 28,
      lastUsed: new Date('2024-01-13')
    },
    {
      id: 'suggestion-4',
      text: '預測下季度的業績目標',
      type: 'trending',
      category: '預測分析',
      icon: '🔮',
      relevance: 0.7,
      usageCount: 19,
      lastUsed: new Date('2024-01-12')
    }
  ];

  if (!query || query.length < 2) {
    return baseSuggestions;
  }

  // 基於查詢內容過濾建議
  return baseSuggestions.filter(suggestion =>
    suggestion.text.toLowerCase().includes(query.toLowerCase()) ||
    suggestion.category?.toLowerCase().includes(query.toLowerCase())
  );
};

// ============================================================================
// Zustand Store
// ============================================================================

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ============================================================================
        // 初始狀態
        // ============================================================================
        
        currentConversation: null,
        conversations: [],
        isLoading: false,
        error: null,
        inputState: createDefaultInputState(),
        suggestions: generateSuggestions(),
        showHistory: false,
        selectedMessage: null,

        // ============================================================================
        // 對話管理
        // ============================================================================

        startConversation: () => {
          const conversation: Conversation = {
            id: uuidv4(),
            userId: 'current-user', // TODO: 從認證系統獲取
            title: `新對話 ${new Date().toLocaleString('zh-TW')}`,
            messages: [],
            state: {
              status: 'active',
              waitingForInput: false,
              processingTasks: []
            },
            context: createDefaultConversationContext(),
            startedAt: new Date(),
            lastActivityAt: new Date(),
            tags: [],
            isPinned: false
          };

          set(state => ({
            currentConversation: conversation,
            conversations: [conversation, ...state.conversations]
          }));

          return conversation;
        },

        loadConversation: async (conversationId: string) => {
          const { conversations } = get();
          const conversation = conversations.find(c => c.id === conversationId);
          
          if (conversation) {
            set({ currentConversation: conversation });
          } else {
            console.error('對話不存在:', conversationId);
          }
        },

        switchConversation: (conversationId: string) => {
          get().loadConversation(conversationId);
        },

        clearConversation: () => {
          const { currentConversation } = get();
          if (currentConversation) {
            set({
              currentConversation: {
                ...currentConversation,
                messages: [],
                state: { status: 'active', waitingForInput: false, processingTasks: [] },
                context: createDefaultConversationContext(),
                lastActivityAt: new Date()
              }
            });
          }
        },

        deleteConversation: (conversationId: string) => {
          set(state => {
            const newConversations = state.conversations.filter(c => c.id !== conversationId);
            const newCurrentConversation = state.currentConversation?.id === conversationId
              ? null
              : state.currentConversation;

            return {
              conversations: newConversations,
              currentConversation: newCurrentConversation
            };
          });
        },

        updateConversationTitle: (conversationId: string, title: string) => {
          set(state => ({
            conversations: state.conversations.map(c =>
              c.id === conversationId ? { ...c, title, lastActivityAt: new Date() } : c
            ),
            currentConversation: state.currentConversation?.id === conversationId
              ? { ...state.currentConversation, title, lastActivityAt: new Date() }
              : state.currentConversation
          }));
        },

        pinConversation: (conversationId: string, pinned: boolean) => {
          set(state => ({
            conversations: state.conversations.map(c =>
              c.id === conversationId ? { ...c, isPinned: pinned } : c
            ),
            currentConversation: state.currentConversation?.id === conversationId
              ? { ...state.currentConversation, isPinned: pinned }
              : state.currentConversation
          }));
        },

        // ============================================================================
        // 訊息管理
        // ============================================================================

        sendMessage: async (content: string, type: MessageType = 'user_query') => {
          let { currentConversation } = get();

          // 如果沒有當前對話，建立新的對話
          if (!currentConversation) {
            currentConversation = get().startConversation();
          }

          const userMessage = createUserMessage(currentConversation.id, content);
          
          // 添加使用者訊息
          set(state => ({
            currentConversation: state.currentConversation ? {
              ...state.currentConversation,
              messages: [...state.currentConversation.messages, userMessage],
              lastActivityAt: new Date()
            } : null,
            conversations: state.conversations.map(c =>
              c.id === currentConversation!.id
                ? { ...c, messages: [...c.messages, userMessage], lastActivityAt: new Date() }
                : c
            ),
            isLoading: true,
            error: null
          }));

          try {
            // 處理 AI 查詢
            const result = await mockAIProcessing(content);
            
            // 創建 AI 回應訊息
            const aiResponseContent: MessageContent = {
              text: result.explanation?.summary,
              formatted: result.explanation ? {
                type: 'markdown',
                value: `## 分析結果\n\n${result.explanation.summary}\n\n### 關鍵發現\n${result.explanation.keyFindings.map(f => `- ${f}`).join('\n')}\n\n### 建議\n${result.explanation.recommendations.map(r => `- ${r}`).join('\n')}`
              } : undefined,
              chart: result.chartConfig && result.data ? {
                type: result.chartConfig.type,
                data: result.data.rows,
                config: result.chartConfig,
                interactive: true
              } : undefined,
              metadata: {
                queryId: result.queryId,
                executionTime: result.metadata.executionTime,
                confidence: result.explanation?.confidence || 'medium'
              }
            };

            const aiMessage = createAIMessage(currentConversation.id, aiResponseContent, result.queryId);

            // 添加 AI 回應
            set(state => ({
              currentConversation: state.currentConversation ? {
                ...state.currentConversation,
                messages: [...state.currentConversation.messages, aiMessage],
                lastActivityAt: new Date()
              } : null,
              conversations: state.conversations.map(c =>
                c.id === currentConversation!.id
                  ? { ...c, messages: [...c.messages, aiMessage], lastActivityAt: new Date() }
                  : c
              ),
              isLoading: false,
              suggestions: result.suggestions || get().suggestions
            }));

            // 更新建議使用次數
            if (result.suggestions) {
              get().loadSuggestions(content);
            }

            return result;

          } catch (error) {
            console.error('發送訊息失敗:', error);
            
            const errorMessage = createAIMessage(
              currentConversation.id,
              {
                text: error instanceof Error ? error.message : '發生未知錯誤，請稍後再試。'
              }
            );
            errorMessage.type = 'error';

            set(state => ({
              currentConversation: state.currentConversation ? {
                ...state.currentConversation,
                messages: [...state.currentConversation.messages, errorMessage],
                lastActivityAt: new Date()
              } : null,
              conversations: state.conversations.map(c =>
                c.id === currentConversation!.id
                  ? { ...c, messages: [...c.messages, errorMessage], lastActivityAt: new Date() }
                  : c
              ),
              isLoading: false,
              error: error instanceof Error ? error : new Error('未知錯誤')
            }));

            return null;
          }
        },

        resendMessage: async (messageId: string) => {
          const { currentConversation } = get();
          if (!currentConversation) return;

          const message = currentConversation.messages.find(m => m.id === messageId);
          if (!message || message.type !== 'user_query') return;

          await get().sendMessage(message.content.text || '');
        },

        editMessage: (messageId: string, newContent: string) => {
          set(state => ({
            currentConversation: state.currentConversation ? {
              ...state.currentConversation,
              messages: state.currentConversation.messages.map(m =>
                m.id === messageId
                  ? { ...m, content: { ...m.content, text: newContent }, isEdited: true, editedAt: new Date() }
                  : m
              )
            } : null
          }));
        },

        deleteMessage: (messageId: string) => {
          set(state => ({
            currentConversation: state.currentConversation ? {
              ...state.currentConversation,
              messages: state.currentConversation.messages.filter(m => m.id !== messageId)
            } : null
          }));
        },

        addReaction: (messageId: string, reaction: string) => {
          set(state => ({
            currentConversation: state.currentConversation ? {
              ...state.currentConversation,
              messages: state.currentConversation.messages.map(m =>
                m.id === messageId
                  ? {
                      ...m,
                      reactions: [
                        ...m.reactions.filter(r => r.type !== reaction),
                        { type: reaction, userId: 'current-user', timestamp: new Date() }
                      ]
                    }
                  : m
              )
            } : null
          }));
        },

        copyMessage: (messageId: string) => {
          const { currentConversation } = get();
          if (!currentConversation) return;

          const message = currentConversation.messages.find(m => m.id === messageId);
          if (message && message.content.text) {
            navigator.clipboard.writeText(message.content.text).catch(console.error);
          }
        },

        // ============================================================================
        // 輸入狀態管理
        // ============================================================================

        setInputValue: (value: string) => {
          set(state => ({
            inputState: { ...state.inputState, value }
          }));
        },

        setInputMode: (mode: 'text' | 'voice') => {
          set(state => ({
            inputState: { ...state.inputState, mode }
          }));
        },

        updateInputState: (newState: Partial<InputState>) => {
          set(state => ({
            inputState: { ...state.inputState, ...newState }
          }));
        },

        // ============================================================================
        // 建議管理
        // ============================================================================

        loadSuggestions: async (query?: string) => {
          const suggestions = generateSuggestions(query);
          set({ suggestions });
        },

        addCustomSuggestion: (suggestion: Omit<QuerySuggestion, 'id'>) => {
          const newSuggestion: QuerySuggestion = {
            ...suggestion,
            id: uuidv4()
          };

          set(state => ({
            suggestions: [newSuggestion, ...state.suggestions]
          }));
        },

        removeSuggestion: (suggestionId: string) => {
          set(state => ({
            suggestions: state.suggestions.filter(s => s.id !== suggestionId)
          }));
        },

        updateSuggestionUsage: (suggestionId: string) => {
          set(state => ({
            suggestions: state.suggestions.map(s =>
              s.id === suggestionId
                ? { ...s, usageCount: (s.usageCount || 0) + 1, lastUsed: new Date() }
                : s
            )
          }));
        },

        // ============================================================================
        // 錯誤處理
        // ============================================================================

        setError: (error: Error | null) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },

        // ============================================================================
        // 載入狀態
        // ============================================================================

        setLoading: (isLoading: boolean) => {
          set({ isLoading });
        },

        // ============================================================================
        // 歷史管理
        // ============================================================================

        toggleHistory: () => {
          set(state => ({ showHistory: !state.showHistory }));
        },

        searchHistory: (query: string) => {
          const { conversations } = get();
          return conversations.filter(c =>
            c.title?.toLowerCase().includes(query.toLowerCase()) ||
            c.messages.some(m => m.content.text?.toLowerCase().includes(query.toLowerCase()))
          );
        },

        exportHistory: async (conversationId?: string) => {
          const { conversations, currentConversation } = get();
          const targetConversations = conversationId
            ? conversations.filter(c => c.id === conversationId)
            : conversations;

          const exportData = {
            exportDate: new Date().toISOString(),
            conversations: targetConversations
          };

          return JSON.stringify(exportData, null, 2);
        },

        clearAllHistory: () => {
          set({
            conversations: [],
            currentConversation: null
          });
        }
      }),
      {
        name: 'donna-ai-chat-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          conversations: state.conversations.slice(0, 50), // 只保存最近 50 個對話
          suggestions: state.suggestions
        })
      }
    )
  )
);

export default useChatStore;