/**
 * PRP-124 Phase 3: Loading States and Error Handling
 * 
 * @description 載入狀態和錯誤處理組件
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Search,
  Database,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Zap,
  Target,
  TrendingUp,
  FileSearch,
  Lightbulb,
  Sparkles,
  AlertCircle,
  WifiOff,
  Server,
  Shield,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIErrorType } from '@/docs/types/ai-query-data-models';

// ============================================================================
// 介面定義
// ============================================================================

interface LoadingStatesProps {
  /** 載入階段 */
  phase: 'parsing' | 'querying' | 'generating' | 'rendering' | 'complete';
  /** 進度百分比 */
  progress?: number;
  /** 當前步驟描述 */
  currentStep?: string;
  /** 預估剩餘時間 */
  estimatedTime?: number;
  /** 自訂 CSS 類別 */
  className?: string;
  /** 顯示詳細資訊 */
  showDetails?: boolean;
  /** 是否可取消 */
  cancellable?: boolean;
  /** 取消回調 */
  onCancel?: () => void;
}

interface ErrorDisplayProps {
  /** 錯誤類型 */
  type: AIErrorType;
  /** 錯誤訊息 */
  message: string;
  /** 錯誤詳情 */
  details?: Record<string, unknown>;
  /** 建議解決方案 */
  suggestions?: string[];
  /** 是否可重試 */
  retryable?: boolean;
  /** 重試回調 */
  onRetry?: () => void;
  /** 報告錯誤回調 */
  onReport?: () => void;
  /** 自訂 CSS 類別 */
  className?: string;
}

interface ProgressIndicatorProps {
  /** 階段列表 */
  phases: LoadingPhase[];
  /** 當前階段 */
  currentPhase: string;
  /** 整體進度 */
  overallProgress?: number;
  /** 是否顯示時間 */
  showTime?: boolean;
  /** 緊湊模式 */
  compact?: boolean;
}

interface LoadingPhase {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  duration?: number;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface NetworkErrorProps {
  /** 是否離線 */
  offline?: boolean;
  /** 重連回調 */
  onReconnect?: () => void;
  /** 離線模式回調 */
  onOfflineMode?: () => void;
}

// ============================================================================
// 載入階段配置
// ============================================================================

const LOADING_PHASES: Record<string, LoadingPhase> = {
  parsing: {
    id: 'parsing',
    name: '理解查詢',
    description: 'AI 正在分析您的問題...',
    icon: Brain,
    duration: 2000,
    status: 'pending'
  },
  querying: {
    id: 'querying',
    name: '查詢資料',
    description: '從資料庫中獲取相關資訊...',
    icon: Database,
    duration: 3000,
    status: 'pending'
  },
  generating: {
    id: 'generating',
    name: '產生洞察',
    description: 'AI 正在分析資料並產生洞察...',
    icon: Lightbulb,
    duration: 2500,
    status: 'pending'
  },
  rendering: {
    id: 'rendering',
    name: '準備結果',
    description: '正在準備圖表和回應...',
    icon: BarChart3,
    duration: 1500,
    status: 'pending'
  },
  complete: {
    id: 'complete',
    name: '完成',
    description: '分析完成！',
    icon: CheckCircle,
    duration: 0,
    status: 'completed'
  }
};

// ============================================================================
// 錯誤配置
// ============================================================================

const ERROR_CONFIG: Record<AIErrorType, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  defaultMessage: string;
  suggestions: string[];
}> = {
  query_parse_error: {
    icon: HelpCircle,
    color: 'text-yellow-600',
    title: '查詢理解錯誤',
    defaultMessage: '抱歉，我無法理解您的查詢',
    suggestions: [
      '嘗試使用更簡單明確的表達',
      '參考查詢範例重新表達',
      '檢查是否有錯別字'
    ]
  },
  intent_recognition_error: {
    icon: Search,
    color: 'text-orange-600',
    title: '意圖識別錯誤',
    defaultMessage: '無法識別您的查詢意圖',
    suggestions: [
      '明確說明您想要查詢的內容',
      '使用具體的業務術語',
      '嘗試分解複雜的問題'
    ]
  },
  data_access_error: {
    icon: Database,
    color: 'text-red-600',
    title: '資料存取錯誤',
    defaultMessage: '無法存取所需的資料',
    suggestions: [
      '檢查您的資料存取權限',
      '確認資料來源是否正常',
      '嘗試查詢其他相關資料'
    ]
  },
  ai_service_error: {
    icon: Brain,
    color: 'text-red-600',
    title: 'AI 服務錯誤',
    defaultMessage: 'AI 服務暫時無法使用',
    suggestions: [
      '稍後再試',
      '檢查網路連接',
      '聯繫系統管理員'
    ]
  },
  rate_limit_error: {
    icon: Clock,
    color: 'text-orange-600',
    title: '使用頻率限制',
    defaultMessage: '查詢頻率過高，請稍後再試',
    suggestions: [
      '等待一段時間後再查詢',
      '減少查詢頻率',
      '考慮使用快取結果'
    ]
  },
  timeout_error: {
    icon: Clock,
    color: 'text-yellow-600',
    title: '查詢逾時',
    defaultMessage: '查詢執行時間過長',
    suggestions: [
      '嘗試簡化查詢條件',
      '縮小查詢範圍',
      '稍後再試'
    ]
  },
  permission_error: {
    icon: Shield,
    color: 'text-red-600',
    title: '權限不足',
    defaultMessage: '您沒有權限執行此查詢',
    suggestions: [
      '聯繫管理員申請權限',
      '嘗試查詢允許的資料範圍',
      '確認您的帳戶狀態'
    ]
  },
  validation_error: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    title: '輸入驗證錯誤',
    defaultMessage: '查詢參數不正確',
    suggestions: [
      '檢查輸入格式',
      '確認必填欄位',
      '參考範例重新輸入'
    ]
  },
  network_error: {
    icon: WifiOff,
    color: 'text-red-600',
    title: '網路連接錯誤',
    defaultMessage: '網路連接出現問題',
    suggestions: [
      '檢查網路連接',
      '重新整理頁面',
      '嘗試使用行動網路'
    ]
  }
};

// ============================================================================
// 載入動畫組件
// ============================================================================

function LoadingDots() {
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
}

function PulsingIcon({ Icon, className }: { Icon: React.ComponentType<{ className?: string }>; className?: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Icon className={cn("w-6 h-6", className)} />
    </motion.div>
  );
}

// ============================================================================
// 進度指示器組件
// ============================================================================

function ProgressIndicator({ 
  phases, 
  currentPhase, 
  overallProgress = 0, 
  showTime = true,
  compact = false 
}: ProgressIndicatorProps) {
  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
          </motion.div>
          <span className="text-sm text-gray-600">
            {phases.find(p => p.id === currentPhase)?.name || '處理中'}
          </span>
        </div>
        <div className="flex-1 max-w-24">
          <Progress value={overallProgress} className="h-1" />
        </div>
        <span className="text-xs text-gray-500">{Math.round(overallProgress)}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">處理進度</h4>
        <Badge variant="outline" className="text-xs">
          {Math.round(overallProgress)}%
        </Badge>
      </div>

      <Progress value={overallProgress} className="h-2" />

      <div className="space-y-2">
        {phases.map((phase) => {
          const isActive = phase.id === currentPhase;
          const isCompleted = phase.status === 'completed';
          const isError = phase.status === 'error';

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center space-x-3 p-2 rounded-lg transition-colors",
                isActive && "bg-blue-50 border border-blue-200",
                isCompleted && "bg-green-50",
                isError && "bg-red-50"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isActive && "bg-blue-500 text-white",
                isCompleted && "bg-green-500 text-white",
                isError && "bg-red-500 text-white",
                !isActive && !isCompleted && !isError && "bg-gray-100 text-gray-400"
              )}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isError ? (
                  <XCircle className="w-4 h-4" />
                ) : isActive ? (
                  <PulsingIcon Icon={phase.icon} className="w-4 h-4" />
                ) : (
                  <phase.icon className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  isActive ? "text-blue-900" : isCompleted ? "text-green-900" : isError ? "text-red-900" : "text-gray-700"
                )}>
                  {phase.name}
                </p>
                <p className={cn(
                  "text-xs",
                  isActive ? "text-blue-600" : isCompleted ? "text-green-600" : isError ? "text-red-600" : "text-gray-500"
                )}>
                  {phase.description}
                </p>
              </div>

              {isActive && showTime && phase.duration && (
                <div className="flex items-center space-x-1 text-xs text-blue-600">
                  <Clock className="w-3 h-3" />
                  <span>~{Math.round(phase.duration / 1000)}s</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 網路錯誤組件
// ============================================================================

function NetworkError({ offline = false, onReconnect, onOfflineMode }: NetworkErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 text-center"
    >
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <WifiOff className="w-8 h-8 text-red-500" />
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {offline ? '您目前處於離線狀態' : '網路連接出現問題'}
      </h3>

      <p className="text-gray-600 mb-6">
        {offline 
          ? '請檢查您的網路連接，或使用離線模式繼續瀏覽已載入的內容。'
          : '無法連接到伺服器，請檢查您的網路連接後重試。'
        }
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onReconnect && (
          <Button onClick={onReconnect} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>重新連接</span>
          </Button>
        )}
        
        {onOfflineMode && (
          <Button variant="outline" onClick={onOfflineMode} className="flex items-center space-x-2">
            <Server className="w-4 h-4" />
            <span>離線模式</span>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// 主要載入狀態組件
// ============================================================================

export function LoadingStates({
  phase,
  progress = 0,
  currentStep,
  estimatedTime,
  className,
  showDetails = true,
  cancellable = false,
  onCancel
}: LoadingStatesProps) {
  const phases = Object.values(LOADING_PHASES).map(p => ({
    ...p,
    status: p.id === phase ? 'active' as const :
            Object.keys(LOADING_PHASES).indexOf(p.id) < Object.keys(LOADING_PHASES).indexOf(phase) 
              ? 'completed' as const 
              : 'pending' as const
  }));

  const currentPhaseData = phases.find(p => p.id === phase);

  return (
    <Card className={cn("p-6", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {!showDetails ? (
            // 簡潔模式
            <div className="flex items-center space-x-3">
              <PulsingIcon 
                Icon={currentPhaseData?.icon || Brain} 
                className="text-blue-500" 
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {currentPhaseData?.name || '處理中'}
                </p>
                {currentStep && (
                  <p className="text-xs text-gray-500">{currentStep}</p>
                )}
              </div>
              <LoadingDots />
            </div>
          ) : (
            // 詳細模式
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <PulsingIcon 
                    Icon={currentPhaseData?.icon || Brain} 
                    className="text-blue-500" 
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentPhaseData?.name || '處理中'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {currentStep || currentPhaseData?.description || '請稍等...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {estimatedTime && (
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>約 {Math.round(estimatedTime / 1000)} 秒</span>
                    </div>
                  )}

                  {cancellable && onCancel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCancel}
                      className="text-gray-500 hover:text-red-600"
                    >
                      取消
                    </Button>
                  )}
                </div>
              </div>

              <ProgressIndicator
                phases={phases}
                currentPhase={phase}
                overallProgress={progress}
                showTime={!!estimatedTime}
              />

              {/* 處理提示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">正在進行的處理：</p>
                    <ul className="text-xs space-y-1 text-blue-700">
                      <li>• 分析您的查詢意圖和需求</li>
                      <li>• 從多個資料源獲取相關資訊</li>
                      <li>• 使用 AI 產生深度洞察和建議</li>
                      <li>• 選擇最適合的視覺化方式</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}

// ============================================================================
// 錯誤顯示組件
// ============================================================================

export function ErrorDisplay({
  type,
  message,
  details,
  suggestions,
  retryable = true,
  onRetry,
  onReport,
  className
}: ErrorDisplayProps) {
  const errorConfig = ERROR_CONFIG[type] || ERROR_CONFIG.ai_service_error;
  const Icon = errorConfig.icon;

  return (
    <Card className={cn("p-6", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
            errorConfig.color.includes('red') && "bg-red-100",
            errorConfig.color.includes('yellow') && "bg-yellow-100",
            errorConfig.color.includes('orange') && "bg-orange-100"
          )}>
            <Icon className={cn("w-8 h-8", errorConfig.color)} />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {errorConfig.title}
          </h3>

          <p className="text-gray-600 mb-4">
            {message || errorConfig.defaultMessage}
          </p>

          {/* 錯誤詳情 */}
          {details && Object.keys(details).length > 0 && (
            <details className="text-left mb-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                查看技術詳情
              </summary>
              <pre className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-700 overflow-auto">
                {JSON.stringify(details, null, 2)}
              </pre>
            </details>
          )}

          {/* 建議解決方案 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h4 className="text-sm font-medium text-gray-900 mb-2">建議解決方案：</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {(suggestions || errorConfig.suggestions).map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 操作按鈕 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {retryable && onRetry && (
              <Button onClick={onRetry} className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>重試</span>
              </Button>
            )}

            {onReport && (
              <Button variant="outline" onClick={onReport} className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>報告問題</span>
              </Button>
            )}

            <Button variant="ghost" onClick={() => window.location.reload()}>
              重新整理頁面
            </Button>
          </div>
        </div>
      </motion.div>
    </Card>
  );
}

// ============================================================================
// 匯出組件
// ============================================================================

export { NetworkError, ProgressIndicator };
export default LoadingStates;