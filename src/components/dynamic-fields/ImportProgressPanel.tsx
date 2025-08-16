/**
 * ImportProgressPanel - 匯入進度面板元件
 * 顯示即時進度、錯誤詳情，支援暫停/恢復操作
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Platform, ScrollView } from 'react-native';
import {
  AdaptiveView,
  AdaptiveText,
  AdaptiveButton,
  type AdaptiveViewProps,
} from '@/components/adaptive';
import { withAlpha } from '@/utils/colorUtils';
import { ImportError } from '@/types/dynamic-field-mapping';

interface ImportProgressPanelProps {
  total: number;
  processed: number;
  errors: ImportError[];
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  speed?: number; // 每秒處理記錄數
  estimatedTimeRemaining?: number; // 預估剩餘時間（秒）
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onClose?: () => void;
  showDetails?: boolean;
  style?: AdaptiveViewProps['style'];
}

interface ProgressStats {
  percentage: number;
  successfulRecords: number;
  failedRecords: number;
  remainingRecords: number;
}

const ERROR_TYPE_LABELS: Record<ImportError['type'], string> = {
  validation: '驗證錯誤',
  transformation: '轉換錯誤',
  storage: '儲存錯誤',
  network: '網路錯誤',
  permission: '權限錯誤',
  unknown: '未知錯誤',
};

const STATUS_LABELS: Record<ImportProgressPanelProps['status'], string> = {
  idle: '準備中',
  running: '匯入中',
  paused: '已暫停',
  completed: '已完成',
  failed: '已失敗',
  cancelled: '已取消',
};

const STATUS_COLORS: Record<ImportProgressPanelProps['status'], string> = {
  idle: '#8E8E93',
  running: '#007AFF',
  paused: '#FF9500',
  completed: '#34C759',
  failed: '#FF3B30',
  cancelled: '#8E8E93',
};

export const ImportProgressPanel: React.FC<ImportProgressPanelProps> = ({
  total,
  processed,
  errors,
  status,
  speed = 0,
  estimatedTimeRemaining,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onClose,
  showDetails = true,
  style,
}) => {
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [showAllErrors, setShowAllErrors] = useState(false);

  /**
   * 計算進度統計
   */
  const stats: ProgressStats = useMemo(() => {
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
    const failedRecords = errors.reduce((sum, error) => 
      sum + (error.affectedRecords?.length || 1), 0
    );
    const successfulRecords = processed - failedRecords;
    const remainingRecords = total - processed;

    return {
      percentage,
      successfulRecords: Math.max(0, successfulRecords),
      failedRecords,
      remainingRecords: Math.max(0, remainingRecords),
    };
  }, [total, processed, errors]);

  /**
   * 格式化時間
   */
  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}分鐘`;
    return `${Math.round(seconds / 3600)}小時`;
  }, []);

  /**
   * 格式化速度
   */
  const formatSpeed = useCallback((recordsPerSecond: number): string => {
    if (recordsPerSecond < 1) return `${Math.round(recordsPerSecond * 60)}/分鐘`;
    return `${Math.round(recordsPerSecond)}/秒`;
  }, []);

  /**
   * 切換錯誤詳情展開
   */
  const toggleErrorExpanded = useCallback((index: number) => {
    setExpandedErrors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  /**
   * 渲染進度條
   */
  const renderProgressBar = () => {
    const progressWidth = `${Math.max(0, Math.min(100, stats.percentage))}%`;

    return (
      <AdaptiveView style={{ marginBottom: 16 }}>
        <AdaptiveView style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <AdaptiveText style={{ fontSize: 18, fontWeight: '600', color: '#1C1C1E' }}>
            匯入進度
          </AdaptiveText>
          <AdaptiveText style={{ 
            fontSize: 24, 
            fontWeight: '700', 
            color: STATUS_COLORS[status] 
          }}>
            {stats.percentage}%
          </AdaptiveText>
        </AdaptiveView>

        {/* 進度條 */}
        <AdaptiveView style={{
          height: 8,
          backgroundColor: '#E3E1DC',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 8,
        }}>
          <AdaptiveView style={{
            height: '100%',
            width: progressWidth,
            backgroundColor: STATUS_COLORS[status],
            transition: Platform.OS === 'web' ? 'width 0.3s ease' : undefined,
          }} />
        </AdaptiveView>

        {/* 進度文字 */}
        <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', textAlign: 'center' }}>
          {processed.toLocaleString()} / {total.toLocaleString()} 筆記錄
        </AdaptiveText>
      </AdaptiveView>
    );
  };

  /**
   * 渲染狀態資訊
   */
  const renderStatusInfo = () => (
    <AdaptiveView style={{
      backgroundColor: '#F2F2F7',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    }}>
      <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <AdaptiveView>
          <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>
            狀態
          </AdaptiveText>
          <AdaptiveText style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: STATUS_COLORS[status] 
          }}>
            {STATUS_LABELS[status]}
          </AdaptiveText>
        </AdaptiveView>

        {speed > 0 && status === 'running' && (
          <AdaptiveView style={{ alignItems: 'flex-end' }}>
            <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>
              處理速度
            </AdaptiveText>
            <AdaptiveText style={{ fontSize: 16, fontWeight: '600', color: '#1C1C1E' }}>
              {formatSpeed(speed)}
            </AdaptiveText>
          </AdaptiveView>
        )}
      </AdaptiveView>

      <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AdaptiveView>
          <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>
            成功
          </AdaptiveText>
          <AdaptiveText style={{ fontSize: 16, fontWeight: '600', color: '#34C759' }}>
            {stats.successfulRecords.toLocaleString()}
          </AdaptiveText>
        </AdaptiveView>

        <AdaptiveView style={{ alignItems: 'center' }}>
          <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>
            錯誤
          </AdaptiveText>
          <AdaptiveText style={{ fontSize: 16, fontWeight: '600', color: '#FF3B30' }}>
            {stats.failedRecords.toLocaleString()}
          </AdaptiveText>
        </AdaptiveView>

        <AdaptiveView style={{ alignItems: 'flex-end' }}>
          <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>
            剩餘
          </AdaptiveText>
          <AdaptiveText style={{ fontSize: 16, fontWeight: '600', color: '#8E8E93' }}>
            {stats.remainingRecords.toLocaleString()}
          </AdaptiveText>
        </AdaptiveView>
      </AdaptiveView>

      {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && status === 'running' && (
        <AdaptiveView style={{ marginTop: 12, alignItems: 'center' }}>
          <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>
            預估剩餘時間
          </AdaptiveText>
          <AdaptiveText style={{ fontSize: 16, fontWeight: '600', color: '#007AFF' }}>
            {formatTime(estimatedTimeRemaining)}
          </AdaptiveText>
        </AdaptiveView>
      )}
    </AdaptiveView>
  );

  /**
   * 渲染控制按鈕
   */
  const renderControls = () => (
    <AdaptiveView style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
      {/* 暫停/恢復按鈕 */}
      {status === 'running' && onPause && (
        <AdaptiveButton
          onPress={onPause}
          style={{
            flex: 1,
            backgroundColor: '#FF9500',
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
            暫停
          </AdaptiveText>
        </AdaptiveButton>
      )}

      {status === 'paused' && onResume && (
        <AdaptiveButton
          onPress={onResume}
          style={{
            flex: 1,
            backgroundColor: '#34C759',
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
            恢復
          </AdaptiveText>
        </AdaptiveButton>
      )}

      {/* 取消按鈕 */}
      {['running', 'paused'].includes(status) && onCancel && (
        <AdaptiveButton
          onPress={onCancel}
          style={{
            flex: 1,
            backgroundColor: '#FF3B30',
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
            取消
          </AdaptiveText>
        </AdaptiveButton>
      )}

      {/* 重試按鈕 */}
      {status === 'failed' && onRetry && (
        <AdaptiveButton
          onPress={onRetry}
          style={{
            flex: 1,
            backgroundColor: '#007AFF',
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
            重試
          </AdaptiveText>
        </AdaptiveButton>
      )}

      {/* 關閉按鈕 */}
      {['completed', 'failed', 'cancelled'].includes(status) && onClose && (
        <AdaptiveButton
          onPress={onClose}
          style={{
            flex: 1,
            backgroundColor: '#8E8E93',
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
            關閉
          </AdaptiveText>
        </AdaptiveButton>
      )}
    </AdaptiveView>
  );

  /**
   * 渲染錯誤列表
   */
  const renderErrorList = () => {
    if (errors.length === 0) return null;

    const displayErrors = showAllErrors ? errors : errors.slice(0, 5);

    return (
      <AdaptiveView style={{ marginBottom: 16 }}>
        <AdaptiveView style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <AdaptiveText style={{ fontSize: 16, fontWeight: '600', color: '#FF3B30' }}>
            錯誤詳情 ({errors.length})
          </AdaptiveText>
          
          {errors.length > 5 && (
            <AdaptiveButton
              onPress={() => setShowAllErrors(!showAllErrors)}
              style={{ padding: 4 }}
            >
              <AdaptiveText style={{ fontSize: 12, color: '#007AFF' }}>
                {showAllErrors ? '收起' : '顯示全部'}
              </AdaptiveText>
            </AdaptiveButton>
          )}
        </AdaptiveView>

        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={true}>
          {displayErrors.map((error, index) => (
            <AdaptiveView
              key={index}
              style={{
                backgroundColor: withAlpha('#FF3B30', 0.05),
                borderWidth: 1,
                borderColor: withAlpha('#FF3B30', 0.2),
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
            >
              {/* 錯誤標題 */}
              <AdaptiveButton
                onPress={() => toggleErrorExpanded(index)}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: expandedErrors.has(index) ? 8 : 0,
                }}
              >
                <AdaptiveView style={{ flex: 1 }}>
                  <AdaptiveText style={{ fontSize: 14, fontWeight: '600', color: '#FF3B30' }}>
                    {ERROR_TYPE_LABELS[error.type]} ({error.code})
                  </AdaptiveText>
                  <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>
                    {new Date(error.timestamp.seconds * 1000).toLocaleString()}
                  </AdaptiveText>
                </AdaptiveView>
                <AdaptiveText style={{ fontSize: 16, color: '#8E8E93' }}>
                  {expandedErrors.has(index) ? '▼' : '▶'}
                </AdaptiveText>
              </AdaptiveButton>

              {/* 錯誤詳情 */}
              {expandedErrors.has(index) && (
                <AdaptiveView>
                  <AdaptiveText style={{ fontSize: 12, color: '#1C1C1E', marginBottom: 8 }}>
                    {error.message}
                  </AdaptiveText>

                  {error.affectedRecords && error.affectedRecords.length > 0 && (
                    <AdaptiveView style={{ marginBottom: 8 }}>
                      <AdaptiveText style={{ fontSize: 11, color: '#8E8E93', marginBottom: 4 }}>
                        影響記錄 ({error.affectedRecords.length}):
                      </AdaptiveText>
                      <AdaptiveText style={{ fontSize: 11, color: '#8E8E93' }}>
                        #{error.affectedRecords.slice(0, 10).map(r => r + 1).join(', ')}
                        {error.affectedRecords.length > 10 && ` 等 ${error.affectedRecords.length} 筆`}
                      </AdaptiveText>
                    </AdaptiveView>
                  )}

                  {error.retryable && (
                    <AdaptiveView style={{
                      backgroundColor: withAlpha('#34C759', 0.1),
                      padding: 6,
                      borderRadius: 4,
                      marginBottom: 8,
                    }}>
                      <AdaptiveText style={{ fontSize: 11, color: '#34C759', fontWeight: '600' }}>
                        ✓ 此錯誤可重試
                      </AdaptiveText>
                    </AdaptiveView>
                  )}

                  {error.details && Object.keys(error.details).length > 0 && (
                    <AdaptiveView style={{
                      backgroundColor: withAlpha('#8E8E93', 0.1),
                      padding: 8,
                      borderRadius: 4,
                    }}>
                      <AdaptiveText style={{ fontSize: 10, color: '#8E8E93', fontFamily: 'monospace' }}>
                        {JSON.stringify(error.details, null, 2)}
                      </AdaptiveText>
                    </AdaptiveView>
                  )}
                </AdaptiveView>
              )}
            </AdaptiveView>
          ))}
        </ScrollView>

        {!showAllErrors && errors.length > 5 && (
          <AdaptiveText style={{ 
            fontSize: 12, 
            color: '#8E8E93', 
            textAlign: 'center',
            fontStyle: 'italic',
            marginTop: 8,
          }}>
            還有 {errors.length - 5} 個錯誤...
          </AdaptiveText>
        )}
      </AdaptiveView>
    );
  };

  return (
    <AdaptiveView style={[{
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    }, style]}>
      {/* 進度條 */}
      {renderProgressBar()}

      {/* 狀態資訊 */}
      {showDetails && renderStatusInfo()}

      {/* 控制按鈕 */}
      {renderControls()}

      {/* 錯誤列表 */}
      {showDetails && renderErrorList()}

      {/* 完成訊息 */}
      {status === 'completed' && (
        <AdaptiveView style={{
          backgroundColor: withAlpha('#34C759', 0.1),
          borderWidth: 1,
          borderColor: '#34C759',
          borderRadius: 8,
          padding: 12,
          alignItems: 'center',
        }}>
          <AdaptiveText style={{ fontSize: 16, fontWeight: '600', color: '#34C759', marginBottom: 4 }}>
            ✅ 匯入完成！
          </AdaptiveText>
          <AdaptiveText style={{ fontSize: 12, color: '#34C759', textAlign: 'center' }}>
            成功處理 {stats.successfulRecords.toLocaleString()} 筆記錄
            {stats.failedRecords > 0 && `，${stats.failedRecords.toLocaleString()} 筆失敗`}
          </AdaptiveText>
        </AdaptiveView>
      )}

      {/* 失敗訊息 */}
      {status === 'failed' && (
        <AdaptiveView style={{
          backgroundColor: withAlpha('#FF3B30', 0.1),
          borderWidth: 1,
          borderColor: '#FF3B30',
          borderRadius: 8,
          padding: 12,
          alignItems: 'center',
        }}>
          <AdaptiveText style={{ fontSize: 16, fontWeight: '600', color: '#FF3B30', marginBottom: 4 }}>
            ❌ 匯入失敗
          </AdaptiveText>
          <AdaptiveText style={{ fontSize: 12, color: '#FF3B30', textAlign: 'center' }}>
            已處理 {processed.toLocaleString()} / {total.toLocaleString()} 筆記錄
          </AdaptiveText>
        </AdaptiveView>
      )}

      {/* 取消訊息 */}
      {status === 'cancelled' && (
        <AdaptiveView style={{
          backgroundColor: withAlpha('#8E8E93', 0.1),
          borderWidth: 1,
          borderColor: '#8E8E93',
          borderRadius: 8,
          padding: 12,
          alignItems: 'center',
        }}>
          <AdaptiveText style={{ fontSize: 16, fontWeight: '600', color: '#8E8E93', marginBottom: 4 }}>
            ⏹️ 匯入已取消
          </AdaptiveText>
          <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', textAlign: 'center' }}>
            已處理 {processed.toLocaleString()} / {total.toLocaleString()} 筆記錄
          </AdaptiveText>
        </AdaptiveView>
      )}
    </AdaptiveView>
  );
};

export default ImportProgressPanel;