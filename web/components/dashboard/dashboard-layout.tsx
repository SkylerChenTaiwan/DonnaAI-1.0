/**
 * 響應式儀表板佈局元件
 * 提供可自定義的網格佈局系統
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { useRealTimeData } from '@/hooks/use-real-time-data';
import { 
  Settings, 
  Grid3X3, 
  LayoutDashboard, 
  Maximize2, 
  Minimize2,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Move,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react';

// 佈局配置介面
export interface LayoutConfig {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
  widgets: WidgetConfig[];
}

// 小工具配置介面
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  props?: Record<string, any>;
  isLocked?: boolean;
  isVisible?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// 小工具類型
export type WidgetType = 
  | 'metrics-overview'
  | 'revenue-chart'
  | 'customer-growth'
  | 'task-summary'
  | 'team-performance'
  | 'recent-activities'
  | 'ai-insights'
  | 'ai-query'
  | 'notifications'
  | 'quick-actions'
  | 'custom-chart';

// 網格設定
export interface GridSettings {
  cols: number;
  rows: number;
  gap: number;
  cellWidth: number;
  cellHeight: number;
  containerPadding: number;
}

// 響應式斷點
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// 響應式網格設定
const RESPONSIVE_GRID_SETTINGS: Record<keyof typeof BREAKPOINTS, GridSettings> = {
  xs: { cols: 2, rows: 12, gap: 8, cellWidth: 120, cellHeight: 80, containerPadding: 16 },
  sm: { cols: 4, rows: 12, gap: 12, cellWidth: 140, cellHeight: 100, containerPadding: 20 },
  md: { cols: 6, rows: 10, gap: 16, cellWidth: 160, cellHeight: 120, containerPadding: 24 },
  lg: { cols: 8, rows: 8, gap: 20, cellWidth: 180, cellHeight: 140, containerPadding: 32 },
  xl: { cols: 12, rows: 8, gap: 24, cellWidth: 200, cellHeight: 160, containerPadding: 40 },
  '2xl': { cols: 16, rows: 6, gap: 24, cellWidth: 220, cellHeight: 180, containerPadding: 48 },
};

// 佈局模式
export type LayoutMode = 'view' | 'edit' | 'customize';

interface DashboardLayoutProps {
  layoutConfig: LayoutConfig;
  children: React.ReactNode;
  mode?: LayoutMode;
  onLayoutChange?: (layout: LayoutConfig) => void;
  onWidgetAdd?: (widget: Omit<WidgetConfig, 'id'>) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onWidgetEdit?: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  className?: string;
}

export function DashboardLayout({
  layoutConfig,
  children,
  mode = 'view',
  onLayoutChange,
  onWidgetAdd,
  onWidgetRemove,
  onWidgetEdit,
  className
}: DashboardLayoutProps) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<keyof typeof BREAKPOINTS>('lg');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // 即時資料更新
  const { 
    status: realTimeStatus, 
    lastEvent, 
    isConnected,
    reconnect 
  } = useRealTimeData({
    subscribeToEvents: ['dashboard_data_updated', 'metric_changed'],
    onEvent: (event) => {
      // 處理即時更新事件
      if (event.type === 'dashboard_data_updated' && onLayoutChange) {
        // 觸發佈局更新
        const updatedLayout = {
          ...layoutConfig,
          updatedAt: new Date(),
        };
        onLayoutChange(updatedLayout);
      }
    },
    onStatusChange: (status) => {
      console.log('Real-time connection status:', status);
    }
  });

  // 獲取當前網格設定
  const currentGridSettings = RESPONSIVE_GRID_SETTINGS[currentBreakpoint];

  // 響應式監聽
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let breakpoint: keyof typeof BREAKPOINTS = 'xs';
      
      for (const [bp, minWidth] of Object.entries(BREAKPOINTS)) {
        if (width >= minWidth) {
          breakpoint = bp as keyof typeof BREAKPOINTS;
        }
      }
      
      setCurrentBreakpoint(breakpoint);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 計算小工具的實際樣式
  const getWidgetStyle = useCallback((widget: WidgetConfig) => {
    const { position } = widget;
    const { cellWidth, cellHeight, gap } = currentGridSettings;
    
    return {
      position: 'absolute' as const,
      left: position.x * cellWidth + (position.x * gap),
      top: position.y * cellHeight + (position.y * gap),
      width: position.width * cellWidth + (position.width - 1) * gap,
      height: position.height * cellHeight + (position.height - 1) * gap,
      zIndex: draggedWidget === widget.id ? 1000 : selectedWidget === widget.id ? 100 : 1,
    };
  }, [currentGridSettings, draggedWidget, selectedWidget]);

  // 處理小工具拖拽開始
  const handleDragStart = useCallback((widgetId: string, e: React.MouseEvent) => {
    if (mode !== 'edit') return;
    
    setIsDragging(true);
    setDraggedWidget(widgetId);
    setSelectedWidget(widgetId);
    
    // 防止文字選取
    e.preventDefault();
  }, [mode]);

  // 處理小工具拖拽結束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedWidget(null);
  }, []);

  // 處理小工具點選
  const handleWidgetClick = useCallback((widgetId: string, e: React.MouseEvent) => {
    if (mode === 'view') return;
    
    e.stopPropagation();
    setSelectedWidget(selectedWidget === widgetId ? null : widgetId);
  }, [mode, selectedWidget]);

  // 處理容器點選（取消選取）
  const handleContainerClick = useCallback(() => {
    setSelectedWidget(null);
  }, []);

  // 處理全螢幕切換
  const handleFullscreenToggle = useCallback((widgetId: string) => {
    setIsFullscreen(isFullscreen === widgetId ? null : widgetId);
  }, [isFullscreen]);

  // 處理小工具鎖定/解鎖
  const handleWidgetLockToggle = useCallback((widgetId: string) => {
    const widget = layoutConfig.widgets.find(w => w.id === widgetId);
    if (!widget || !onWidgetEdit) return;
    
    onWidgetEdit(widgetId, { isLocked: !widget.isLocked });
  }, [layoutConfig.widgets, onWidgetEdit]);

  // 處理小工具刪除
  const handleWidgetRemove = useCallback((widgetId: string) => {
    if (!onWidgetRemove) return;
    onWidgetRemove(widgetId);
    setSelectedWidget(null);
  }, [onWidgetRemove]);

  // 渲染小工具控制選單
  const renderWidgetControls = (widget: WidgetConfig) => {
    if (mode === 'view' || selectedWidget !== widget.id) return null;

    return (
      <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-1 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleWidgetLockToggle(widget.id)}
          className="w-6 h-6 p-0"
          title={widget.isLocked ? '解鎖' : '鎖定'}
        >
          {widget.isLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFullscreenToggle(widget.id)}
          className="w-6 h-6 p-0"
          title="全螢幕"
        >
          {isFullscreen === widget.id ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </Button>
        
        <div className="relative group">
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0"
            title="更多選項"
          >
            <MoreVertical className="w-3 h-3" />
          </Button>
          
          <div className="absolute right-0 top-full mt-1 w-32 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="py-1">
              <button className="flex items-center w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                <Edit3 className="w-3 h-3 mr-2" />
                編輯
              </button>
              <button className="flex items-center w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                <Copy className="w-3 h-3 mr-2" />
                複製
              </button>
              <button className="flex items-center w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                <Move className="w-3 h-3 mr-2" />
                移動
              </button>
              <hr className="my-1" />
              <button
                onClick={() => handleWidgetRemove(widget.id)}
                className="flex items-center w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 如果有全螢幕小工具，特殊渲染
  if (isFullscreen) {
    const fullscreenWidget = layoutConfig.widgets.find(w => w.id === isFullscreen);
    if (fullscreenWidget) {
      return (
        <div className="fixed inset-0 z-50 bg-gray-50">
          <div className="h-full flex flex-col">
            {/* 全螢幕標題欄 */}
            <div className="flex items-center justify-between p-4 bg-white border-b">
              <div className="flex items-center space-x-3">
                <LayoutDashboard className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">{fullscreenWidget.title}</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFullscreenToggle(isFullscreen)}
                className="flex items-center space-x-2"
              >
                <Minimize2 className="w-4 h-4" />
                <span>退出全螢幕</span>
              </Button>
            </div>
            
            {/* 全螢幕內容 */}
            <div className="flex-1 p-6">
              <Card className="h-full">
                {children}
              </Card>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "dashboard-layout",
        "relative w-full min-h-screen bg-gray-50",
        mode === 'edit' && "edit-mode",
        isDragging && "dragging",
        className
      )}
      onClick={handleContainerClick}
    >
      {/* 佈局工具欄 */}
      {mode !== 'view' && (
        <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Grid3X3 className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{layoutConfig.name}</h2>
                <p className="text-sm text-gray-500">
                  {mode === 'edit' ? '編輯模式' : '自定義模式'} • {layoutConfig.widgets.length} 個小工具
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* 即時連線狀態指示器 */}
              <div className={cn(
                "flex items-center space-x-1 px-2 py-1 rounded-full text-xs border",
                isConnected ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                )} />
                <span>{isConnected ? '即時連線' : '已斷線'}</span>
                {!isConnected && (
                  <button 
                    onClick={reconnect}
                    className="ml-1 text-red-600 hover:text-red-700"
                    title="重新連線"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                佈局設定
              </Button>
              <Button size="sm">
                儲存變更
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 網格容器 */}
      <div 
        ref={gridRef}
        className="relative"
        style={{
          padding: currentGridSettings.containerPadding,
          minHeight: `${currentGridSettings.rows * currentGridSettings.cellHeight + 
                      (currentGridSettings.rows - 1) * currentGridSettings.gap}px`,
        }}
      >
        {/* 網格背景（編輯模式下顯示） */}
        {mode === 'edit' && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: `
                ${currentGridSettings.cellWidth + currentGridSettings.gap}px
                ${currentGridSettings.cellHeight + currentGridSettings.gap}px
              `,
              margin: currentGridSettings.containerPadding,
            }}
          />
        )}

        {/* 渲染所有小工具 */}
        {layoutConfig.widgets
          .filter(widget => widget.isVisible !== false)
          .map((widget) => (
            <div
              key={widget.id}
              className={cn(
                "dashboard-widget",
                "transition-all duration-200 ease-in-out",
                selectedWidget === widget.id && "ring-2 ring-blue-500 ring-opacity-50",
                widget.isLocked && "locked",
                isDragging && draggedWidget === widget.id && "dragging opacity-80"
              )}
              style={getWidgetStyle(widget)}
              onClick={(e) => handleWidgetClick(widget.id, e)}
              onMouseDown={(e) => handleDragStart(widget.id, e)}
              onMouseUp={handleDragEnd}
            >
              {/* 小工具內容卡片 */}
              <Card className={cn(
                "h-full w-full overflow-hidden",
                mode !== 'view' && "cursor-move",
                widget.isLocked && "cursor-default"
              )}>
                {/* 小工具標題欄 */}
                <div className="flex items-center justify-between p-3 bg-white border-b">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {widget.title}
                  </h3>
                  {mode !== 'view' && (
                    <div className="flex items-center space-x-1">
                      {widget.isLocked && (
                        <Lock className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* 小工具內容區 */}
                <div className="p-4 h-[calc(100%-60px)] overflow-auto">
                  {children}
                </div>

                {/* 小工具控制選單 */}
                {renderWidgetControls(widget)}
              </Card>
            </div>
          ))}

        {/* 空狀態提示 */}
        {layoutConfig.widgets.length === 0 && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <LayoutDashboard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">開始自定義您的儀表板</h3>
              <p className="text-gray-500 mb-6 max-w-sm">
                添加小工具來顯示重要的業務指標和數據分析
              </p>
              <Button>
                <Grid3X3 className="w-4 h-4 mr-2" />
                添加小工具
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 佈局配置管理器
 */
export class LayoutManager {
  private static layouts: Map<string, LayoutConfig> = new Map();
  
  static saveLayout(layout: LayoutConfig): void {
    this.layouts.set(layout.id, {
      ...layout,
      updatedAt: new Date(),
    });
    
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      const saved = Array.from(this.layouts.values());
      localStorage.setItem('dashboard-layouts', JSON.stringify(saved));
    }
  }
  
  static loadLayout(layoutId: string): LayoutConfig | null {
    return this.layouts.get(layoutId) || null;
  }
  
  static getAllLayouts(): LayoutConfig[] {
    return Array.from(this.layouts.values());
  }
  
  static deleteLayout(layoutId: string): boolean {
    const deleted = this.layouts.delete(layoutId);
    if (deleted && typeof window !== 'undefined') {
      const saved = Array.from(this.layouts.values());
      localStorage.setItem('dashboard-layouts', JSON.stringify(saved));
    }
    return deleted;
  }
  
  static createDefaultLayout(): LayoutConfig {
    return {
      id: `layout_${Date.now()}`,
      name: '預設佈局',
      description: '系統預設的儀表板佈局',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      widgets: [],
    };
  }
  
  // 初始化：從 localStorage 載入
  static initialize(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('dashboard-layouts');
      if (saved) {
        const layouts = JSON.parse(saved) as LayoutConfig[];
        layouts.forEach(layout => {
          this.layouts.set(layout.id, {
            ...layout,
            createdAt: new Date(layout.createdAt),
            updatedAt: new Date(layout.updatedAt),
          });
        });
      }
    } catch (error) {
      console.error('Failed to load layouts:', error);
    }
  }
}

// 組件掛載時初始化佈局管理器
if (typeof window !== 'undefined') {
  LayoutManager.initialize();
}