/**
 * AI 查詢介面元件
 * 提供自然語言查詢業務資料的功能
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  Send, 
  Mic, 
  MicOff,
  Sparkles,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  FileText,
  Download,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// AI 查詢介面
export interface AIQuery {
  id: string;
  question: string;
  timestamp: Date;
  response?: AIResponse;
  status: 'pending' | 'processing' | 'completed' | 'error';
  processingTime?: number;
}

// AI 回應介面
export interface AIResponse {
  id: string;
  answer: string;
  confidence: number;
  sources: AISource[];
  suggestions: string[];
  visualizations?: AIVisualization[];
  actionables?: AIActionable[];
  relatedQueries?: string[];
}

// AI 資料來源
export interface AISource {
  type: 'dashboard' | 'database' | 'api' | 'report';
  name: string;
  description?: string;
  lastUpdated: Date;
  url?: string;
}

// AI 視覺化建議
export interface AIVisualization {
  type: 'chart' | 'table' | 'metric' | 'trend';
  title: string;
  description: string;
  data: any;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
}

// AI 可行動建議
export interface AIActionable {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'opportunity' | 'risk' | 'optimization' | 'alert';
  actionUrl?: string;
}

// 預設查詢建議
const QUICK_QUERIES = [
  '本月營收表現如何？',
  '哪些客戶最近沒有活動？',
  '團隊績效排名如何？',
  '預測下月的業績目標',
  '分析客戶流失的原因',
  '找出銷售機會最大的產品',
];

// 查詢分類
const QUERY_CATEGORIES = [
  { id: 'revenue', name: '營收分析', icon: DollarSign, color: 'text-green-600' },
  { id: 'customers', name: '客戶分析', icon: Users, color: 'text-blue-600' },
  { id: 'performance', name: '績效分析', icon: TrendingUp, color: 'text-purple-600' },
  { id: 'predictions', name: '預測分析', icon: Brain, color: 'text-orange-600' },
];

interface AIQueryInterfaceProps {
  onQuerySubmit?: (query: string) => Promise<AIResponse>;
  className?: string;
}

export function AIQueryInterface({ onQuerySubmit, className }: AIQueryInterfaceProps) {
  const [query, setQuery] = useState('');
  const [queries, setQueries] = useState<AIQuery[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // 語音識別相關
  const [recognition, setRecognition] = useState<any>(null);

  // 初始化語音識別
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'zh-TW';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('語音識別錯誤:', event.error);
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // 處理查詢提交
  const handleSubmit = useCallback(async (queryText: string = query) => {
    if (!queryText.trim() || isProcessing) return;

    const newQuery: AIQuery = {
      id: `query_${Date.now()}`,
      question: queryText.trim(),
      timestamp: new Date(),
      status: 'processing',
    };

    setQueries(prev => [newQuery, ...prev]);
    setQuery('');
    setIsProcessing(true);

    try {
      const startTime = Date.now();
      
      // 如果有自定義處理函數，使用它；否則使用模擬回應
      const response = onQuerySubmit 
        ? await onQuerySubmit(queryText.trim())
        : await generateMockResponse(queryText.trim());

      const processingTime = Date.now() - startTime;

      setQueries(prev => prev.map(q => 
        q.id === newQuery.id 
          ? { 
              ...q, 
              response, 
              status: 'completed',
              processingTime 
            }
          : q
      ));

    } catch (error) {
      console.error('AI 查詢錯誤:', error);
      setQueries(prev => prev.map(q => 
        q.id === newQuery.id 
          ? { ...q, status: 'error' }
          : q
      ));
    } finally {
      setIsProcessing(false);
    }
  }, [query, isProcessing, onQuerySubmit]);

  // 處理語音輸入
  const handleVoiceInput = useCallback(() => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  }, [recognition, isRecording]);

  // 處理快速查詢
  const handleQuickQuery = useCallback((queryText: string) => {
    setQuery(queryText);
    handleSubmit(queryText);
  }, [handleSubmit]);

  // 滾動到最新回應
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = 0;
    }
  }, [queries]);

  // 渲染查詢輸入區
  const renderQueryInput = () => (
    <Card className="p-4">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI 智能助理</h3>
          <p className="text-sm text-gray-500">用自然語言查詢您的業務資料</p>
        </div>
      </div>

      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="請輸入您的問題，例如：本月營收表現如何？"
          className="pr-20 py-3"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={isProcessing}
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {/* 語音輸入按鈕 */}
          {recognition && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceInput}
              className={cn(
                "w-8 h-8 p-0",
                isRecording && "text-red-500 animate-pulse"
              )}
              disabled={isProcessing}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          )}

          {/* 發送按鈕 */}
          <Button
            size="sm"
            onClick={() => handleSubmit()}
            disabled={!query.trim() || isProcessing}
            className="w-8 h-8 p-0"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 快速查詢建議 */}
      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2">快速查詢：</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUERIES.slice(0, 3).map((quickQuery, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuery(quickQuery)}
              disabled={isProcessing}
              className="text-xs"
            >
              {quickQuery}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );

  // 渲染查詢歷史
  const renderQueryHistory = () => (
    <div ref={chatRef} className="space-y-4 max-h-[600px] overflow-y-auto">
      {queries.map((queryItem) => (
        <QueryItem
          key={queryItem.id}
          query={queryItem}
          onRetry={(q) => handleSubmit(q)}
        />
      ))}
      
      {queries.length === 0 && (
        <Card className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">開始您的 AI 查詢</h3>
          <p className="text-gray-500 mb-6">
            使用自然語言詢問關於業務數據的任何問題
          </p>
          
          {/* 查詢分類 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUERY_CATEGORIES.map((category) => (
              <div
                key={category.id}
                className="p-3 border border-dashed border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                onClick={() => {
                  const categoryQueries = QUICK_QUERIES.filter(q => 
                    (category.id === 'revenue' && (q.includes('營收') || q.includes('業績'))) ||
                    (category.id === 'customers' && q.includes('客戶')) ||
                    (category.id === 'performance' && (q.includes('績效') || q.includes('排名'))) ||
                    (category.id === 'predictions' && (q.includes('預測') || q.includes('分析')))
                  );
                  if (categoryQueries.length > 0) {
                    handleQuickQuery(categoryQueries[0]);
                  }
                }}
              >
                <category.icon className={cn("w-6 h-6 mx-auto mb-2", category.color)} />
                <p className="text-xs text-gray-700">{category.name}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {renderQueryInput()}
      {renderQueryHistory()}
    </div>
  );
}

/**
 * 單個查詢項目組件
 */
interface QueryItemProps {
  query: AIQuery;
  onRetry: (question: string) => void;
}

function QueryItem({ query, onRetry }: QueryItemProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  
  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    // TODO: 發送反饋到後端
  };

  return (
    <Card className="p-4">
      {/* 問題 */}
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-sm text-gray-600">Q</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{query.question}</p>
          <p className="text-xs text-gray-500">
            {query.timestamp.toLocaleString('zh-TW')}
          </p>
        </div>
      </div>

      {/* 回應 */}
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1 space-y-3">
          {query.status === 'processing' && (
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-500">AI 正在思考中...</span>
            </div>
          )}

          {query.status === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">查詢處理時發生錯誤，請稍後再試。</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRetry(query.question)}
                className="mt-2"
              >
                重試
              </Button>
            </div>
          )}

          {query.response && query.status === 'completed' && (
            <>
              {/* AI 回答 */}
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-900">{query.response.answer}</p>
              </div>

              {/* 信心度 */}
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    query.response.confidence >= 80 ? 'text-green-600 border-green-200' :
                    query.response.confidence >= 60 ? 'text-yellow-600 border-yellow-200' :
                    'text-red-600 border-red-200'
                  )}
                >
                  可信度: {query.response.confidence}%
                </Badge>
                {query.processingTime && (
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {(query.processingTime / 1000).toFixed(1)}s
                  </Badge>
                )}
              </div>

              {/* 資料來源 */}
              {query.response.sources.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">資料來源:</h4>
                  <div className="flex flex-wrap gap-1">
                    {query.response.sources.map((source, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {source.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 視覺化建議 */}
              {query.response.visualizations && query.response.visualizations.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">建議圖表:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {query.response.visualizations.map((viz, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <BarChart3 className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-medium text-gray-900">{viz.title}</span>
                        </div>
                        <p className="text-xs text-gray-600">{viz.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 可行動建議 */}
              {query.response.actionables && query.response.actionables.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">建議行動:</h4>
                  <div className="space-y-2">
                    {query.response.actionables.map((action) => (
                      <div key={action.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <h5 className="text-sm font-medium text-gray-900">{action.title}</h5>
                        <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge 
                            variant="outline"
                            className={cn(
                              action.priority === 'critical' && 'text-red-600 border-red-200',
                              action.priority === 'high' && 'text-orange-600 border-orange-200',
                              action.priority === 'medium' && 'text-yellow-600 border-yellow-200',
                              action.priority === 'low' && 'text-green-600 border-green-200'
                            )}
                          >
                            {action.priority} 優先級
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 相關查詢建議 */}
              {query.response.relatedQueries && query.response.relatedQueries.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">您可能還想了解:</h4>
                  <div className="flex flex-wrap gap-1">
                    {query.response.relatedQueries.map((relatedQuery, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetry(relatedQuery)}
                        className="text-xs h-6 px-2 text-blue-600 hover:text-blue-700"
                      >
                        {relatedQuery}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* 反饋和操作 */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">這個回答有幫助嗎？</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback('up')}
                    className={cn(
                      "w-6 h-6 p-0",
                      feedback === 'up' && "text-green-600"
                    )}
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback('down')}
                    className={cn(
                      "w-6 h-6 p-0",
                      feedback === 'down' && "text-red-600"
                    )}
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                    <Share2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * 生成模擬 AI 回應
 */
async function generateMockResponse(query: string): Promise<AIResponse> {
  // 模擬 API 延遲
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // 基於查詢內容生成相應回應
  let answer = '';
  let confidence = 75;
  const sources: AISource[] = [
    {
      type: 'dashboard',
      name: '儀表板數據',
      description: '即時業務指標',
      lastUpdated: new Date(),
    },
  ];

  if (query.includes('營收') || query.includes('收入') || query.includes('業績')) {
    answer = '根據最新資料分析，本月營收表現良好，達到 $125,430，相較上月成長 12.5%。主要成長動力來自新客戶獲取和既有客戶的重複購買。建議繼續加強客戶關係維護，並探索新的市場機會。';
    confidence = 85;
  } else if (query.includes('客戶')) {
    answer = '客戶分析顯示，本月新增 34 位客戶，成長率為 8.3%。活躍客戶中有 3 位顯示流失風險，建議主動聯繫並提供個人化服務。整體客戶滿意度維持在 94% 的高水平。';
    confidence = 82;
  } else if (query.includes('績效') || query.includes('團隊')) {
    answer = '團隊整體績效良好，本週完成任務數為 89 項，完成率達 94%。李小華和王小美表現突出，張小明需要額外支援。建議調整工作分配以優化團隊產出。';
    confidence = 78;
  } else if (query.includes('預測')) {
    answer = '基於歷史數據和市場趨勢分析，預測下月營收可能達到 $138,000-$145,000，成長幅度約 10-15%。主要影響因素包括季節性需求和新產品發布。建議提前準備庫存和人力資源。';
    confidence = 70;
  } else {
    answer = '我已經分析了您的問題。根據現有資料，建議您檢視相關的業務指標和趨勢分析。如需更詳細的分析，請提供更具體的查詢條件。';
    confidence = 65;
  }

  return {
    id: `response_${Date.now()}`,
    answer,
    confidence,
    sources,
    suggestions: [
      '查看詳細的數據報告',
      '建立相關的監控警報',
      '與團隊分享這些洞察',
    ],
    visualizations: [
      {
        type: 'chart',
        title: '趨勢圖表',
        description: '顯示相關指標的時間序列變化',
        data: {},
        chartType: 'line',
      },
    ],
    actionables: [
      {
        id: 'action1',
        title: '主動聯繫高價值客戶',
        description: '針對重點客戶制定個人化服務方案',
        priority: 'high',
        category: 'opportunity',
      },
    ],
    relatedQueries: [
      '詳細的月度報告在哪裡？',
      '如何提高客戶滿意度？',
      '競爭對手的表現如何？',
    ],
  };
}