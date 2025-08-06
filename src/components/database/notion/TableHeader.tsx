/**
 * 表格標頭元件 - 顯示欄位標題和控制欄位操作
 */

import React, { useCallback, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { ColumnConfig } from './types';
import { tableStyles } from './styles/tableStyles';
import { Icon } from '@/components/common/Icon';
import { NotionColors } from './constants';

interface TableHeaderProps {
  columns: ColumnConfig[];
  onColumnResize?: (columnId: string, newWidth: number) => void;
  onColumnReorder?: (columns: ColumnConfig[]) => void;
  onColumnClick?: (column: ColumnConfig) => void;
  onAddColumn?: () => void;
  multiSelectMode?: boolean;
  allSelected?: boolean;
  onSelectAll?: (selected: boolean) => void;
  canEditFields?: boolean;
  onFieldInfo?: (event: React.MouseEvent, column: ColumnConfig) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  columns,
  onColumnResize,
  onColumnReorder,
  onColumnClick,
  onAddColumn,
  multiSelectMode,
  allSelected,
  onSelectAll,
  canEditFields,
  onFieldInfo,
}) => {
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [columnStartWidth, setColumnStartWidth] = useState(0);
  
  return (
    <View style={tableStyles.headerContainer}>
      {/* Multi-select checkbox column */}
      {multiSelectMode && (
        <TouchableOpacity
          style={[tableStyles.headerCell, { width: 40 }]}
          onPress={() => onSelectAll?.(!allSelected)}
        >
          <View
            style={[
              tableStyles.checkbox,
              allSelected && tableStyles.checkboxChecked,
            ]}
          >
            {allSelected && (
              <Icon name="checkmark" size={12} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>
      )}
      
      {/* Column headers */}
      {columns.map((column, index) => (
        <HeaderCell
          key={column.id}
          column={column}
          index={index}
          onResize={onColumnResize}
          onReorder={onColumnReorder}
          onClick={onColumnClick}
          isResizing={resizingColumn === column.id}
          onResizeStart={() => setResizingColumn(column.id)}
          onResizeEnd={() => setResizingColumn(null)}
          canEditFields={canEditFields}
          onFieldInfo={onFieldInfo}
        />
      ))}
      
      {/* Add column button */}
      {onAddColumn && (
        <TouchableOpacity
          style={[tableStyles.headerCell, { width: 40, borderRightWidth: 0 }]}
          onPress={onAddColumn}
        >
          <Icon name="add" size={16} color={NotionColors.text.gray} />
        </TouchableOpacity>
      )}
    </View>
  );
};

interface HeaderCellProps {
  column: ColumnConfig;
  index: number;
  onResize?: (columnId: string, newWidth: number) => void;
  onReorder?: (columns: ColumnConfig[]) => void;
  onClick?: (column: ColumnConfig) => void;
  isResizing: boolean;
  onResizeStart: () => void;
  onResizeEnd: () => void;
  canEditFields?: boolean;
  onFieldInfo?: (event: React.MouseEvent, column: ColumnConfig) => void;
}

const HeaderCell: React.FC<HeaderCellProps> = ({
  column,
  index,
  onResize,
  onReorder,
  onClick,
  isResizing,
  onResizeStart,
  onResizeEnd,
  canEditFields,
  onFieldInfo,
}) => {
  const cellRef = useRef<View>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [columnStartWidth, setColumnStartWidth] = useState(column.width || 180);
  
  // Handle resize
  const handleResizeStart = useCallback((e: any) => {
    if (!onResize) return;
    
    e.stopPropagation();
    onResizeStart();
    
    const startX = Platform.OS === 'web' ? e.clientX : e.nativeEvent.pageX;
    setDragStartX(startX);
    setColumnStartWidth(column.width || 180);
    
    if (Platform.OS === 'web') {
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newWidth = Math.max(50, columnStartWidth + deltaX);
        onResize(column.id, newWidth);
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        onResizeEnd();
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [column, onResize, onResizeStart, onResizeEnd, columnStartWidth]);
  
  // Handle column click (for sorting)
  const handleClick = useCallback(() => {
    onClick?.(column);
  }, [column, onClick]);
  
  // Handle drag and drop for reordering
  const handleDragStart = useCallback((e: any) => {
    if (!onReorder || Platform.OS !== 'web') return;
    
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('columnIndex', index.toString());
  }, [index, onReorder]);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: any) => {
    if (!onReorder || Platform.OS !== 'web') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [onReorder]);
  
  const handleDrop = useCallback((e: any) => {
    if (!onReorder || Platform.OS !== 'web') return;
    
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData('columnIndex'), 10);
    
    if (draggedIndex !== index) {
      // Reorder columns logic would go here
      // This is a simplified version - you'd need to implement the actual reordering
    }
  }, [index, onReorder]);
  
  return (
    <View
      ref={cellRef}
      style={[
        tableStyles.headerCell,
        { 
          width: column.width || 180,
          opacity: isDragging ? 0.5 : 1,
        },
      ]}
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={handleClick}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
          activeOpacity={0.7}
          // Web-specific drag props
          {...(Platform.OS === 'web' && onReorder ? {
            draggable: true,
            onDragStart: handleDragStart,
            onDragEnd: handleDragEnd,
            onDragOver: handleDragOver,
            onDrop: handleDrop,
          } as any : {})}
        >
          <Text style={tableStyles.headerText}>
            {column.title}
          </Text>
        </TouchableOpacity>
        
        {/* 欄位編輯 info 按鈕 */}
        {console.log('🔍 HeaderCell info 按鈕檢查:', {
          columnTitle: column.title,
          columnId: column.id,
          canEditFields,
          shouldShow: canEditFields && column.id !== '_checkbox' && column.id !== '_actions'
        })}
        {canEditFields && column.id !== '_checkbox' && column.id !== '_actions' && (
          <TouchableOpacity
            onPress={(e) => {
              console.log('🔍 欄位 info 按鈕被點擊:', column.title);
              e.stopPropagation();
              onFieldInfo?.(e as any, column);
            }}
            style={{
              marginLeft: 6,
              padding: 4,
              borderRadius: 4,
              backgroundColor: 'transparent',
            }}
          >
            <Icon 
              name="information-circle-outline" 
              size={16} 
              color={NotionColors.text.gray}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Resize handle */}
      {column.resizable !== false && onResize && (
        <TouchableOpacity
          style={[
            tableStyles.headerResizeHandle,
            isResizing && { backgroundColor: NotionColors.interactive.focus },
          ]}
          onPressIn={handleResizeStart}
          activeOpacity={1}
          // Web-specific props
          {...(Platform.OS === 'web' ? {
            onMouseDown: handleResizeStart,
            style: {
              ...tableStyles.headerResizeHandle,
              cursor: 'col-resize',
            },
          } as any : {})}
        />
      )}
    </View>
  );
};