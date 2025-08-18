/**
 * 共用連線狀態顯示元件
 * 統一管理即時連線狀態的視覺化
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConnectionStatusProps {
  isConnected: boolean;
  onReconnect?: () => void;
  lastUpdate?: Date;
  eventCount?: number;
  compact?: boolean;
  showEventCount?: boolean;
  showLastUpdate?: boolean;
  className?: string;
}

export function ConnectionStatus({
  isConnected,
  onReconnect,
  lastUpdate,
  eventCount = 0,
  compact = false,
  showEventCount = false,
  showLastUpdate = false,
  className
}: ConnectionStatusProps) {
  const statusText = isConnected ? '即時連線' : '已斷線';
  const IconComponent = isConnected ? Wifi : WifiOff;

  return (
    <div className={cn(
      "flex items-center space-x-2",
      compact ? "text-xs" : "text-sm",
      className
    )}>
      {/* 主要狀態指示器 */}
      <div className={cn(
        "flex items-center space-x-2 rounded-full border",
        compact ? "px-2 py-1" : "px-3 py-1.5",
        isConnected 
          ? "bg-green-50 border-green-200 text-green-700" 
          : "bg-red-50 border-red-200 text-red-700"
      )}>
        {/* 連線狀態點 */}
        <div className={cn(
          "rounded-full",
          compact ? "w-1.5 h-1.5" : "w-2 h-2",
          isConnected 
            ? "bg-green-500 animate-pulse" 
            : "bg-red-500"
        )} />
        
        {/* 狀態文字 */}
        {!compact && (
          <span className="hidden sm:inline font-medium">
            {statusText}
          </span>
        )}
        
        {/* 狀態圖標 */}
        <IconComponent className={cn(
          compact ? "w-3 h-3" : "w-4 h-4"
        )} />
        
        {/* 重新連線按鈕 */}
        {!isConnected && onReconnect && (
          <button 
            onClick={onReconnect}
            className={cn(
              "transition-colors hover:scale-110",
              "text-red-600 hover:text-red-700"
            )}
            title="重新連線"
          >
            <Zap className={cn(
              compact ? "w-3 h-3" : "w-3 h-3"
            )} />
          </button>
        )}
      </div>

      {/* 事件計數 */}
      {showEventCount && eventCount > 0 && (
        <Badge 
          variant="outline" 
          className={cn(
            "flex items-center space-x-1",
            compact ? "text-xs px-1.5 py-0.5" : "text-xs"
          )}
        >
          <Activity className="w-3 h-3" />
          <span>{eventCount} 事件</span>
        </Badge>
      )}

      {/* 最後更新時間 */}
      {showLastUpdate && lastUpdate && (
        <div className={cn(
          "text-gray-500",
          compact ? "text-xs" : "text-sm"
        )}>
          <span className="hidden md:inline">更新: </span>
          <span>
            {lastUpdate.toLocaleTimeString('zh-TW', {
              hour: '2-digit',
              minute: '2-digit',
              ...(compact ? {} : { second: '2-digit' })
            })}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 緊湊版連線狀態（用於工具列等空間受限的地方）
 */
export function CompactConnectionStatus(props: Omit<ConnectionStatusProps, 'compact'>) {
  return <ConnectionStatus {...props} compact />;
}

/**
 * 詳細版連線狀態（用於狀態頁面等需要完整資訊的地方）
 */
export function DetailedConnectionStatus(props: Omit<ConnectionStatusProps, 'showEventCount' | 'showLastUpdate'>) {
  return (
    <ConnectionStatus 
      {...props} 
      showEventCount 
      showLastUpdate 
    />
  );
}

/**
 * 連線狀態 Hook
 * 提供標準化的連線狀態管理
 */
export function useConnectionStatus(realTimeData: {
  isConnected: boolean;
  lastEvent?: any;
  eventCount?: number;
  reconnect: () => void;
}) {
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  // 監聽連線狀態變化
  React.useEffect(() => {
    if (realTimeData.isConnected) {
      setLastUpdate(new Date());
    }
  }, [realTimeData.isConnected]);

  // 監聽事件更新
  React.useEffect(() => {
    if (realTimeData.lastEvent) {
      setLastUpdate(new Date());
    }
  }, [realTimeData.lastEvent]);

  return {
    isConnected: realTimeData.isConnected,
    lastUpdate,
    eventCount: realTimeData.eventCount || 0,
    onReconnect: realTimeData.reconnect,
  };
}