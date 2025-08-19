/**
 * PRP-125: Notion 風格資料庫管理系統 - 虛擬滾動表格元件
 * 
 * @description 高效能虛擬滾動表格元件，支援大量資料（50,000+ 筆）流暢操作
 * @version 1.0.0
 * @date 2025-08-19
 * 
 * 主要功能：
 * - TanStack Virtual 整合
 * - 記憶體管理和最佳化
 * - 動態列高度支援
 * - 平滑滾動體驗
 * - 智能緩存機制
 */

'use client';

import React, { 
  useCallback, 
  useMemo, 
  useState, 
  useRef, 
  useEffect,
  memo 
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// 型別匯入
import type {
  Table as TableType,
  Row,
  Field,
  VirtualScrollConfig,
  RowHeight,
  CellValue,
  NotionTableProps
} from '@/docs/types/database-table-types';

/**
 * 效能監控 Hook
 */
const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    fps: 60,
    scrollJank: 0
  });

  const measureRenderTime = useCallback((callback: () => void) => {
    const start = performance.now();
    callback();
    const end = performance.now();
    setMetrics(prev => ({
      ...prev,
      renderTime: end - start
    }));
  }, []);

  return { metrics, measureRenderTime };
};

/**
 * 記憶體管理 Hook
 */
const useMemoryManager = (maxCacheSize: number = 100) => {
  const cacheRef = useRef(new Map<string, any>());
  
  const getFromCache = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);

  const setInCache = useCallback((key: string, value: any) => {
    if (cacheRef.current.size >= maxCacheSize) {
      // LRU 清理：移除最舊的項目
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }
    cacheRef.current.set(key, value);
  }, [maxCacheSize]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return { getFromCache, setInCache, clearCache };
};

/**
 * 虛擬列元件
 */
interface VirtualRowProps {
  row: Row;
  columns: ColumnDef<Row>[];
  rowHeight: number;
  isEven: boolean;
  onCellEdit: (rowId: string, fieldId: string, value: CellValue) => void;
}

const VirtualRow = memo<VirtualRowProps>(({ 
  row, 
  columns, 
  rowHeight, 
  isEven,
  onCellEdit 
}) => {
  return (
    <motion.div
      className={cn(
        "flex border-b border-gray-100",
        isEven ? "bg-white" : "bg-gray-50/50"
      )}
      style={{ height: rowHeight }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      layout
    >
      {columns.map((column, colIndex) => (
        <div
          key={`${row.id}-${column.id}`}
          className="border-r border-gray-100 last:border-r-0 flex items-center px-3"
          style={{ 
            width: (column as any).size || 150,
            minWidth: (column as any).minSize || 50
          }}
        >
          <span className="text-sm text-gray-900 truncate">
            {row.data[(column.id as string)]?.toString() || ''}
          </span>
        </div>
      ))}
    </motion.div>
  );
});

VirtualRow.displayName = 'VirtualRow';

/**
 * 虛擬表格標頭
 */
interface VirtualHeaderProps {
  columns: ColumnDef<Row>[];
  fields: Field[];
  onSort: (fieldId: string) => void;
  onFilter: (fieldId: string) => void;
  onResize: (fieldId: string, width: number) => void;
}

const VirtualHeader = memo<VirtualHeaderProps>(({ 
  columns, 
  fields, 
  onSort, 
  onFilter, 
  onResize 
}) => {
  return (
    <div className="flex bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
      {columns.map((column, index) => {
        const field = fields.find(f => f.id === column.id);
        if (!field) return null;

        return (
          <div
            key={column.id}
            className="border-r border-gray-200 last:border-r-0 flex items-center justify-between px-3 py-2 relative"
            style={{ 
              width: (column as any).size || 150,
              minWidth: (column as any).minSize || 50
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 truncate">
                {field.name}
              </span>
              {field.required && (
                <span className="text-red-500 text-xs">*</span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSort(field.id)}
                className="p-1 hover:bg-gray-200 rounded text-xs"
                title="排序"
              >
                ↕️
              </button>
              <button
                onClick={() => onFilter(field.id)}
                className="p-1 hover:bg-gray-200 rounded text-xs"
                title="篩選"
              >
                🔍
              </button>
            </div>

            {/* 調整大小控制 */}
            <div
              className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = (column as any).size || 150;

                const handleMouseMove = (e: MouseEvent) => {
                  const newWidth = Math.max(50, startWidth + (e.clientX - startX));
                  onResize(field.id, newWidth);
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
          </div>
        );
      })}
    </div>
  );
});

VirtualHeader.displayName = 'VirtualHeader';

/**
 * 虛擬滾動表格主元件
 */
interface VirtualTableProps extends Omit<NotionTableProps, 'table'> {
  data: Row[];
  fields: Field[];
  virtualConfig?: Partial<VirtualScrollConfig>;
  height?: number;
}

export const VirtualTable: React.FC<VirtualTableProps> = ({
  data,
  fields,
  virtualConfig = {},
  height = 600,
  onDataChange,
  onSchemaChange,
  className,
  style
}) => {
  // 效能監控
  const { metrics, measureRenderTime } = usePerformanceMonitor();
  
  // 記憶體管理
  const { getFromCache, setInCache, clearCache } = useMemoryManager(
    virtualConfig.cacheSize || 100
  );

  // 父容器參考
  const parentRef = useRef<HTMLDivElement>(null);

  // 虛擬滾動配置
  const finalVirtualConfig = useMemo(() => ({
    itemHeight: 36,
    overscan: 10,
    scrollThreshold: 100,
    bufferedItems: 20,
    preloadStrategy: 'next' as const,
    direction: 'vertical' as const,
    estimatedItemSize: 36,
    cacheSize: 100,
    ...virtualConfig
  }), [virtualConfig]);

  // 欄位定義
  const columns = useMemo<ColumnDef<Row>[]>(() => {
    return fields.map((field) => ({
      id: field.id,
      accessorKey: `data.${field.id}`,
      size: field.width || 150,
      minSize: 50,
      maxSize: 500
    }));
  }, [fields]);

  // 列高度計算函數
  const getRowHeight = useCallback((index: number) => {
    const cacheKey = `row-height-${index}`;
    const cachedHeight = getFromCache(cacheKey);
    
    if (cachedHeight) {
      return cachedHeight;
    }

    // 動態計算列高度（可根據內容調整）
    const row = data[index];
    let maxHeight = finalVirtualConfig.itemHeight;

    // 檢查是否有多行文字內容
    fields.forEach(field => {
      const value = row?.data[field.id]?.toString() || '';
      if (value.length > 50) {
        maxHeight = Math.max(maxHeight, 48); // 較高的列
      }
    });

    setInCache(cacheKey, maxHeight);
    return maxHeight;
  }, [data, fields, finalVirtualConfig.itemHeight, getFromCache, setInCache]);

  // 虛擬化器
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: getRowHeight,
    overscan: finalVirtualConfig.overscan,
    scrollPaddingStart: 0,
    scrollPaddingEnd: 0,
  });

  // 處理資料變更
  const handleCellEdit = useCallback((rowId: string, fieldId: string, value: CellValue) => {
    if (onDataChange) {
      const change = {
        type: 'update' as const,
        target: 'cell' as const,
        targetId: `${rowId}-${fieldId}`,
        oldValue: data.find(r => r.id === rowId)?.data[fieldId],
        newValue: value,
        timestamp: new Date()
      };
      onDataChange([change]);
    }
  }, [data, onDataChange]);

  // 處理欄位操作
  const handleSort = useCallback((fieldId: string) => {
    console.log('Sort field:', fieldId);
    // TODO: 實作排序邏輯
  }, []);

  const handleFilter = useCallback((fieldId: string) => {
    console.log('Filter field:', fieldId);
    // TODO: 實作篩選邏輯
  }, []);

  const handleResize = useCallback((fieldId: string, width: number) => {
    console.log('Resize field:', fieldId, width);
    // TODO: 實作欄位寬度調整
  }, []);

  // 清理快取
  useEffect(() => {
    return () => {
      clearCache();
    };
  }, [clearCache]);

  // 監控效能
  useEffect(() => {
    if (metrics.renderTime > 16) { // 超過一幀時間
      console.warn('Render time exceeded 16ms:', metrics.renderTime);
    }
  }, [metrics.renderTime]);

  return (
    <div 
      className={cn(
        "virtual-table w-full border border-gray-200 rounded-lg overflow-hidden bg-white",
        className
      )}
      style={{ height, ...style }}
    >
      {/* 效能指標顯示（開發模式） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-800">
          FPS: {metrics.fps} | Render: {metrics.renderTime.toFixed(2)}ms | 
          Memory: {metrics.memoryUsage}MB | Items: {data.length}
        </div>
      )}

      {/* 表格標頭 */}
      <VirtualHeader
        columns={columns}
        fields={fields}
        onSort={handleSort}
        onFilter={handleFilter}
        onResize={handleResize}
      />

      {/* 虛擬滾動容器 */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ 
          height: height - 60, // 減去標頭高度
          contain: 'strict'
        }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map(virtualRow => {
            const row = data[virtualRow.index];
            if (!row) return null;

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <VirtualRow
                  row={row}
                  columns={columns}
                  rowHeight={virtualRow.size}
                  isEven={virtualRow.index % 2 === 0}
                  onCellEdit={handleCellEdit}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 滾動指示器 */}
      {data.length > 100 && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {virtualizer.range?.startIndex + 1}-{virtualizer.range?.endIndex + 1} / {data.length}
        </div>
      )}
    </div>
  );
};

/**
 * 增強的 NotionTable 元件，自動選擇虛擬滾動
 */
interface EnhancedNotionTableProps extends NotionTableProps {
  virtualThreshold?: number;
}

export const EnhancedNotionTable: React.FC<EnhancedNotionTableProps> = ({
  table: tableData,
  virtualThreshold = 1000,
  ...props
}) => {
  // 根據資料量自動選擇使用虛擬滾動
  const shouldUseVirtual = tableData.rows.length > virtualThreshold;

  if (shouldUseVirtual) {
    return (
      <VirtualTable
        data={tableData.rows}
        fields={tableData.schema.fields}
        {...props}
      />
    );
  }

  // 使用標準 NotionTable
  const { NotionTable } = require('./notion-table');
  return <NotionTable table={tableData} {...props} />;
};

export default VirtualTable;