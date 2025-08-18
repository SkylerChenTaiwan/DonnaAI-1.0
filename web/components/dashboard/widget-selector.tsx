/**
 * 小工具選擇器組件
 * 提供添加和配置儀表板小工具的介面
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WidgetRegistry, WidgetCategory, WidgetMetadata } from './widget-registry';
import { WidgetType, WidgetConfig } from './dashboard-layout';
import { 
  Search, 
  Plus, 
  Grid3X3, 
  Filter,
  Star,
  Info,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widget: Omit<WidgetConfig, 'id'>) => void;
  existingWidgets?: WidgetConfig[];
  className?: string;
}

export function WidgetSelector({ 
  isOpen, 
  onClose, 
  onAddWidget, 
  existingWidgets = [],
  className 
}: WidgetSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all');
  const [selectedWidget, setSelectedWidget] = useState<WidgetType | null>(null);
  const [widgetTitle, setWidgetTitle] = useState('');

  // 獲取所有可用的小工具
  const allWidgets = useMemo(() => {
    return WidgetRegistry.getAllWidgets();
  }, []);

  // 過濾小工具
  const filteredWidgets = useMemo(() => {
    let widgets = allWidgets;

    // 按分類過濾
    if (selectedCategory !== 'all') {
      widgets = widgets.filter(widget => widget.metadata.category === selectedCategory);
    }

    // 按搜尋查詢過濾
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      widgets = widgets.filter(widget => 
        widget.metadata.name.toLowerCase().includes(query) ||
        widget.metadata.description.toLowerCase().includes(query)
      );
    }

    return widgets;
  }, [allWidgets, selectedCategory, searchQuery]);

  // 獲取所有分類
  const categories = useMemo(() => {
    const categorySet = new Set<WidgetCategory>();
    allWidgets.forEach(widget => categorySet.add(widget.metadata.category));
    return Array.from(categorySet);
  }, [allWidgets]);

  // 分類顯示名稱
  const getCategoryDisplayName = (category: WidgetCategory | 'all'): string => {
    const names = {
      all: '全部',
      metrics: '指標',
      charts: '圖表',
      lists: '清單',
      notifications: '通知',
      tools: '工具',
      ai: 'AI 功能',
      custom: '自訂',
    };
    return names[category] || category;
  };

  // 獲取分類統計
  const getCategoryCount = (category: WidgetCategory | 'all'): number => {
    if (category === 'all') return allWidgets.length;
    return allWidgets.filter(widget => widget.metadata.category === category).length;
  };

  // 處理小工具選擇
  const handleWidgetSelect = (type: WidgetType) => {
    setSelectedWidget(type);
    const metadata = WidgetRegistry.getMetadata(type);
    if (metadata) {
      setWidgetTitle(metadata.name);
    }
  };

  // 處理添加小工具
  const handleAddWidget = () => {
    if (!selectedWidget) return;

    const metadata = WidgetRegistry.getMetadata(selectedWidget);
    if (!metadata) return;

    // 找到合適的位置放置新小工具
    const position = findBestPosition(metadata.defaultSize);

    const newWidget: Omit<WidgetConfig, 'id'> = {
      type: selectedWidget,
      title: widgetTitle.trim() || metadata.name,
      position,
      props: {},
      isVisible: true,
      isLocked: false,
      minWidth: metadata.minSize.width,
      minHeight: metadata.minSize.height,
      maxWidth: metadata.maxSize?.width,
      maxHeight: metadata.maxSize?.height,
    };

    onAddWidget(newWidget);
    
    // 重置狀態
    setSelectedWidget(null);
    setWidgetTitle('');
    onClose();
  };

  // 找到放置新小工具的最佳位置
  const findBestPosition = (size: { width: number; height: number }) => {
    // 簡化的位置計算邏輯
    // TODO: 實作更智能的位置算法
    const occupiedPositions = new Set<string>();
    
    existingWidgets.forEach(widget => {
      for (let x = widget.position.x; x < widget.position.x + widget.position.width; x++) {
        for (let y = widget.position.y; y < widget.position.y + widget.position.height; y++) {
          occupiedPositions.add(`${x},${y}`);
        }
      }
    });

    // 尋找第一個可用位置
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 12; x++) {
        let canPlace = true;
        
        // 檢查是否有足夠空間
        for (let dx = 0; dx < size.width && canPlace; dx++) {
          for (let dy = 0; dy < size.height && canPlace; dy++) {
            if (occupiedPositions.has(`${x + dx},${y + dy}`)) {
              canPlace = false;
            }
          }
        }

        if (canPlace) {
          return { x, y, width: size.width, height: size.height };
        }
      }
    }

    // 如果找不到位置，放在 (0, 0)
    return { x: 0, y: 0, width: size.width, height: size.height };
  };

  // 重置表單
  const resetForm = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedWidget(null);
    setWidgetTitle('');
  };

  // 處理對話框關閉
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn("max-w-4xl max-h-[80vh]", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>添加小工具</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[60vh]">
          {/* 搜尋和過濾列 */}
          <div className="flex items-center space-x-4 mb-6">
            {/* 搜尋框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜尋小工具..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 分類選擇器 */}
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as WidgetCategory | 'all')}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  全部 ({getCategoryCount('all')})
                </SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {getCategoryDisplayName(category)} ({getCategoryCount(category)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 小工具網格 */}
          <div className="flex-1 overflow-y-auto">
            {filteredWidgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Grid3X3 className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">找不到相關小工具</h3>
                <p className="text-gray-500">請嘗試調整搜尋條件或選擇其他分類</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWidgets.map(({ type, metadata }) => (
                  <WidgetCard
                    key={type}
                    type={type}
                    metadata={metadata}
                    isSelected={selectedWidget === type}
                    onSelect={() => handleWidgetSelect(type)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 配置區域 */}
          {selectedWidget && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">小工具配置</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    小工具標題
                  </label>
                  <Input
                    value={widgetTitle}
                    onChange={(e) => setWidgetTitle(e.target.value)}
                    placeholder="輸入自訂標題"
                    className="max-w-md"
                  />
                </div>
                
                {/* TODO: 根據小工具類型顯示更多配置選項 */}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button 
            onClick={handleAddWidget} 
            disabled={!selectedWidget}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>添加小工具</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 小工具卡片組件
 */
interface WidgetCardProps {
  type: WidgetType;
  metadata: WidgetMetadata;
  isSelected: boolean;
  onSelect: () => void;
}

function WidgetCard({ type, metadata, isSelected, onSelect }: WidgetCardProps) {
  const IconComponent = metadata.icon;

  return (
    <Card 
      className={cn(
        "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start space-x-3">
        {/* 小工具圖標 */}
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          isSelected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
        )}>
          <IconComponent className="w-5 h-5" />
        </div>

        {/* 小工具資訊 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {metadata.name}
            </h4>
            {metadata.requiresData && (
              <Badge variant="secondary" className="text-xs">
                需要數據
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
            {metadata.description}
          </p>

          {/* 小工具屬性 */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {getCategoryDisplayName(metadata.category)}
            </Badge>
            
            <div className="flex items-center space-x-1">
              {metadata.configurable && (
                <Settings className="w-3 h-3 text-gray-400" title="可配置" />
              )}
              <span className="text-xs text-gray-400">
                {metadata.defaultSize.width}×{metadata.defaultSize.height}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 選中指示器 */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * 分類顯示名稱輔助函數
 */
function getCategoryDisplayName(category: WidgetCategory): string {
  const names = {
    metrics: '指標',
    charts: '圖表',
    lists: '清單',
    notifications: '通知',
    tools: '工具',
    ai: 'AI',
    custom: '自訂',
  };
  return names[category] || category;
}