/**
 * PRP-124 Phase 3: AI Analytics Chat Interface
 * 
 * @description ChatGPT 風格的 AI 分析對話介面
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Send, 
  Mic, 
  MicOff,
  Brain,
  MessageSquare,
  RotateCcw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  Sparkles,
  ChevronDown,
  Settings,
  History,
  Bookmark,
  Clock,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/lib/ai-analytics/chat-store';
import { ChartRenderer } from './chart-renderer';
import { LoadingStates } from './loading-states';
import { QuerySuggestions } from './query-suggestions';
import type { 
  Message,
  MessageType,
  QuerySuggestion,
  AIQuery,
  QueryResult,
  ChartConfig
} from '@/docs/types/ai-query-data-models';

// ============================================================================
// 介面定義
// ============================================================================

interface ChatInterfaceProps {
  /** 自訂 CSS 類別 */
  className?: string;
  /** 是否顯示歷史側邊欄 */
  showHistory?: boolean;
  /** 是否啟用語音輸入 */
  enableVoiceInput?: boolean;
  /** 是否為嵌入模式 */
  embedded?: boolean;
  /** 初始化查詢 */
  initialQuery?: string;
  /** 查詢處理函數 */
  onQuerySubmit?: (query: string) => Promise<QueryResult>;
  /** 訊息變更回調 */
  onMessageChange?: (messages: Message[]) => void;
}

// ============================================================================
// 主要組件
// ============================================================================

export function ChatInterface({
  className,
  showHistory = false,
  enableVoiceInput = true,
  embedded = false,
  initialQuery,
  onQuerySubmit,
  onMessageChange
}: ChatInterfaceProps) {
  // ============================================================================
  // State 管理
  // ============================================================================
  
  const {
    currentConversation,
    isLoading,
    error,
    inputState,
    suggestions,
    sendMessage,
    clearConversation,
    setInputValue,
    setInputMode,
    updateInputState
  } = useChatStore();

  const [isExpanded, setIsExpanded] = useState(!embedded);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // 語音輸入處理
  // ============================================================================
  
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window && enableVoiceInput) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'zh-TW';
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onstart = () => {
        updateInputState({ isRecording: true });
      };

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const isFinal = event.results[0].isFinal;
        
        if (isFinal) {
          setInputValue(transcript);
          updateInputState({ 
            isRecording: false,
            voiceInputState: { 
              ...inputState.voiceInputState!,
              status: 'idle',
              transcript 
            }
          });
        } else {
          updateInputState({
            voiceInputState: {
              ...inputState.voiceInputState!,
              transcript,
              status: 'listening'
            }
          });
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('語音識別錯誤:', event.error);
        updateInputState({ 
          isRecording: false,
          voiceInputState: {
            ...inputState.voiceInputState!,
            status: 'error'
          }
        });
      };

      recognitionInstance.onend = () => {
        updateInputState({ isRecording: false });
      };

      setRecognition(recognitionInstance);
    }
  }, [enableVoiceInput, updateInputState, inputState.voiceInputState, setInputValue]);

  // ============================================================================
  // 訊息處理
  // ============================================================================

  const handleSendMessage = useCallback(async (queryText: string = inputState.value) => {
    if (!queryText.trim() || isLoading) return;

    try {
      setInputValue('');
      setShowSuggestions(false);
      setIsComposing(false);

      const result = await sendMessage(queryText.trim());
      
      if (onMessageChange && currentConversation) {
        onMessageChange(currentConversation.messages);
      }

      return result;
    } catch (error) {
      console.error('發送訊息失敗:', error);
    }
  }, [inputState.value, isLoading, sendMessage, setInputValue, onMessageChange, currentConversation]);

  const handleVoiceToggle = useCallback(() => {
    if (!recognition) return;

    if (inputState.isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  }, [recognition, inputState.isRecording]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isComposing) {
        handleSendMessage();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // TODO: 實作歷史查詢導航
    }
  }, [handleSendMessage, isComposing]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // 顯示建議當輸入超過 2 個字符
    if (value.length > 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }

    updateInputState({ isTyping: value.length > 0 });
  }, [setInputValue, updateInputState]);

  const handleSuggestionSelect = useCallback((suggestion: QuerySuggestion) => {
    setInputValue(suggestion.text);
    setShowSuggestions(false);
    handleSendMessage(suggestion.text);
  }, [setInputValue, handleSendMessage]);

  // ============================================================================
  // 自動滾動
  // ============================================================================

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages]);

  // ============================================================================
  // 初始化處理
  // ============================================================================

  useEffect(() => {
    if (initialQuery && !currentConversation?.messages.length) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, currentConversation?.messages.length, handleSendMessage]);

  // ============================================================================
  // 渲染函數
  // ============================================================================

  const renderHeader = () => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI 分析助理</h2>
          <p className="text-sm text-gray-500">
            {isLoading ? '正在分析中...' : '準備回答您的問題'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {!embedded && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-gray-500"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearConversation}
              className="text-gray-500"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </>
        )}
        
        {embedded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500"
          >
            <ChevronDown 
              className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} 
            />
          </Button>
        )}
      </div>
    </div>
  );

  const renderMessage = (message: Message, index: number) => (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={cn(
        "flex items-start space-x-3 mb-6",
        message.sender.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
      )}
    >
      {/* 頭像 */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        message.sender.type === 'user' 
          ? 'bg-gray-100' 
          : 'bg-gradient-to-r from-blue-500 to-purple-600'
      )}>
        {message.sender.type === 'user' ? (
          <span className="text-sm font-medium text-gray-600">您</span>
        ) : (
          <Brain className="w-4 h-4 text-white" />
        )}
      </div>

      {/* 訊息內容 */}
      <div className={cn(
        "flex-1 max-w-[80%]",
        message.sender.type === 'user' ? 'items-end' : 'items-start'
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm",
          message.sender.type === 'user'
            ? 'bg-blue-500 text-white ml-auto'
            : 'bg-white border border-gray-200'
        )}>
          {message.type === 'user_query' && (
            <p className="text-sm">{message.content.text}</p>
          )}

          {message.type === 'ai_response' && message.content.text && (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-900 m-0">{message.content.text}</p>
            </div>
          )}

          {message.type === 'chart_result' && message.content.chart && (
            <div className="mt-3">
              <ChartRenderer
                type={message.content.chart.type}
                data={message.content.chart.data}
                config={message.content.chart.config}
                interactive={message.content.chart.interactive}
              />
            </div>
          )}

          {message.type === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{message.content.text}</p>
            </div>
          )}
        </div>

        {/* 訊息元資料 */}
        <div className={cn(
          "flex items-center space-x-2 mt-1 text-xs text-gray-500",
          message.sender.type === 'user' ? 'justify-end' : 'justify-start'
        )}>
          <span>{message.timestamp.toLocaleTimeString('zh-TW', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
          
          {message.status === 'sending' && (
            <span className="text-blue-500">發送中...</span>
          )}
          
          {message.status === 'failed' && (
            <span className="text-red-500">發送失敗</span>
          )}

          {message.sender.type === 'ai' && message.queryId && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>2.3s</span>
            </div>
          )}
        </div>

        {/* AI 訊息操作 */}
        {message.sender.type === 'ai' && message.status === 'delivered' && (
          <div className="flex items-center space-x-1 mt-2">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <ThumbsUp className="w-3 h-3 mr-1" />
              有用
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <ThumbsDown className="w-3 h-3 mr-1" />
              改進
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <Copy className="w-3 h-3 mr-1" />
              複製
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <Share2 className="w-3 h-3 mr-1" />
              分享
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderInputArea = () => (
    <div className="p-4 border-t border-gray-200 bg-white">
      {/* 建議區域 */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <QuerySuggestions
              query={inputState.value}
              onSelect={handleSuggestionSelect}
              className="max-h-32 overflow-y-auto"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 語音輸入提示 */}
      {inputState.isRecording && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-700">正在聆聽...</span>
            {inputState.voiceInputState?.transcript && (
              <span className="text-sm text-gray-600">
                "{inputState.voiceInputState.transcript}"
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* 輸入框 */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputState.value}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="輸入您的問題，例如：本月營收表現如何？"
          className="pr-20 py-3 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          disabled={isLoading}
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {/* 語音輸入按鈕 */}
          {enableVoiceInput && recognition && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceToggle}
              className={cn(
                "w-8 h-8 p-0",
                inputState.isRecording 
                  ? "text-red-500 animate-pulse" 
                  : "text-gray-400 hover:text-gray-600"
              )}
              disabled={isLoading}
            >
              {inputState.isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* 發送按鈕 */}
          <Button
            size="sm"
            onClick={() => handleSendMessage()}
            disabled={!inputState.value.trim() || isLoading}
            className="w-8 h-8 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 輸入提示 */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <span>按 Enter 發送，Shift+Enter 換行</span>
          {enableVoiceInput && (
            <span className="flex items-center space-x-1">
              <Mic className="w-3 h-3" />
              <span>支援語音輸入</span>
            </span>
          )}
        </div>
        
        {inputState.isTyping && (
          <div className="flex items-center space-x-1 text-xs text-blue-500">
            <Zap className="w-3 h-3" />
            <span>正在輸入...</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          開始您的 AI 分析對話
        </h3>
        <p className="text-gray-500 mb-6">
          使用自然語言詢問關於業務數據的任何問題，AI 助理會為您提供深度分析和洞察。
        </p>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-3">試試這些問題：</p>
          {[
            '本月營收表現如何？',
            '哪些客戶需要重點關注？',
            '團隊績效排名如何？',
            '預測下季度的業績'
          ].map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSendMessage(question)}
              className="block w-full text-left justify-start"
              disabled={isLoading}
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // 主要渲染
  // ============================================================================

  if (embedded && !isExpanded) {
    return (
      <Card className={cn("w-full", className)}>
        {renderHeader()}
      </Card>
    );
  }

  return (
    <Card className={cn(
      "flex flex-col h-full",
      embedded ? "h-96" : "h-[600px]",
      className
    )}>
      {renderHeader()}

      {/* 訊息區域 */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
      >
        {isLoading && currentConversation?.messages.length === 0 && (
          <LoadingStates phase="parsing" />
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-700">{error.message}</p>
          </motion.div>
        )}

        {currentConversation?.messages.length === 0 && !isLoading && !error && (
          renderEmptyState()
        )}

        {currentConversation?.messages.map((message, index) => 
          renderMessage(message, index)
        )}

        {isLoading && currentConversation?.messages.length > 0 && (
          <LoadingStates phase="generating" />
        )}

        <div ref={messagesEndRef} />
      </div>

      {renderInputArea()}
    </Card>
  );
}

export default ChatInterface;