/**
 * 可拖動的表格標題組件 - 支援欄位順序調整
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { TableColumn } from '@/types/table';

interface DraggableTableHeaderProps {
  columns: TableColumn[];
  onColumnsReorder: (columns: TableColumn[]) => void;
  multiSelectMode?: boolean;
  onSort?: (key: string) => void;
  sortConfig?: {
    key: string | null;
    direction: 'asc' | 'desc';
  };
  onAddColumn?: () => void;
}

// Web 平台專用的拖動處理組件
const WebDraggableHeader: React.FC<DraggableTableHeaderProps> = ({
  columns,
  onColumnsReorder,
  multiSelectMode,
  onSort,
  sortConfig,
  onAddColumn,
}) => {
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);
  const [columnOrder, setColumnOrder] = useState(columns.map((_, i) => i));
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 當 columns 改變時重置順序
  useEffect(() => {
    setColumnOrder(columns.map((_, i) => i));
  }, [columns.length]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumn(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // 設置拖動時的圖像
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(2deg)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex !== dropIndex) {
      const newOrder = [...columnOrder];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, removed);
      
      setColumnOrder(newOrder);
      
      // 重新排序實際的 columns 陣列
      const reorderedColumns = newOrder.map(i => columns[i]);
      onColumnsReorder(reorderedColumns);
    }
    
    setDraggedColumn(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverIndex(null);
  };

  return (
    <View style={styles.tableHeader}>
      {/* 核取方塊欄 - 始終顯示 */}
      <View style={styles.checkboxColumn}>
        <TouchableOpacity style={styles.headerCheckbox}>
          <View style={styles.checkbox}>
            {/* TODO: 處理全選狀態 */}
          </View>
        </TouchableOpacity>
      </View>
      
      {/* 可拖動的欄位標題 */}
      {columnOrder.map((originalIndex, currentIndex) => {
        const column = columns[originalIndex];
        const isDragging = draggedColumn === currentIndex;
        const isDragOver = dragOverIndex === currentIndex;
        
        return (
          <div
            key={column.key}
            draggable
            onDragStart={(e) => handleDragStart(e, currentIndex)}
            onDragOver={(e) => handleDragOver(e, currentIndex)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, currentIndex)}
            onDragEnd={handleDragEnd}
            style={{
              flex: column.width ? 0 : 1,
              width: column.width,
              opacity: isDragging ? 0.5 : 1,
              borderLeft: isDragOver ? '2px solid #2383e2' : 'none',
              transition: 'border-left 0.2s ease',
            }}
          >
            <TouchableOpacity
              style={[
                styles.headerCell,
              ]}
              onPress={() => column.sortable && onSort && onSort(column.key)}
              disabled={!column.sortable || !onSort}
              activeOpacity={0.7}
            >
              <Icon 
                name="drag-indicator" 
                size={14} 
                color="#b4b3af" 
                style={styles.dragHandle}
              />
              <Text style={styles.headerText}>{column.title}</Text>
              {column.sortable && sortConfig && sortConfig.key === column.key && (
                <Icon
                  name={sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color="#37352f"
                  style={styles.sortIcon}
                />
              )}
            </TouchableOpacity>
          </div>
        );
      })}
      
      {/* 新增欄位按鈕 */}
      {onAddColumn && (
        <TouchableOpacity 
          style={styles.addColumnButton} 
          onPress={onAddColumn}
          activeOpacity={0.7}
        >
          <Icon name="add" size={16} color="#37352f" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Native 平台的標題組件（暫時不支援拖動）
const NativeDraggableHeader: React.FC<DraggableTableHeaderProps> = ({
  columns,
  onColumnsReorder,
  multiSelectMode,
  onSort,
  sortConfig,
  onAddColumn,
}) => {
  return (
    <View style={styles.tableHeader}>
      {/* 核取方塊欄 - 始終顯示 */}
      <View style={styles.checkboxColumn}>
        <TouchableOpacity style={styles.headerCheckbox}>
          <View style={styles.checkbox}>
            {/* TODO: 處理全選狀態 */}
          </View>
        </TouchableOpacity>
      </View>
      
      {/* 欄位標題 */}
      {columns.map((column, index) => (
        <TouchableOpacity
          key={column.key}
          style={[
            styles.headerCell,
            column.width ? { width: column.width } : { flex: 1 }
          ]}
          onPress={() => column.sortable && onSort && onSort(column.key)}
          disabled={!column.sortable || !onSort}
          activeOpacity={0.7}
        >
          <Text style={styles.headerText}>{column.title}</Text>
          {column.sortable && sortConfig && sortConfig.key === column.key && (
            <Icon
              name={sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
              size={14}
              color="#37352f"
              style={styles.sortIcon}
            />
          )}
        </TouchableOpacity>
      ))}
      
      {/* 新增欄位按鈕 */}
      {onAddColumn && (
        <TouchableOpacity 
          style={styles.addColumnButton} 
          onPress={onAddColumn}
          activeOpacity={0.7}
        >
          <Icon name="add" size={16} color="#37352f" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// 根據平台選擇組件
export const DraggableTableHeader: React.FC<DraggableTableHeaderProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebDraggableHeader {...props} />;
  }
  return <NativeDraggableHeader {...props} />;
};

const styles = StyleSheet.create({
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E7',
    backgroundColor: '#ffffff',
    minHeight: 36,
    alignItems: 'center',
  },
  
  headerCell: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    cursor: Platform.OS === 'web' ? 'move' : 'default',
  },
  
  firstHeaderCell: {
    paddingLeft: 16,
  },
  
  headerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#787774',
    marginRight: 4,
  },
  
  dragHandle: {
    marginRight: 4,
    cursor: 'grab',
  },
  
  sortIcon: {
    marginLeft: 2,
  },
  
  // 核取方塊樣式
  checkboxColumn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerCheckbox: {
    padding: 4,
  },
  
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#DDDDDB',
    borderRadius: 3,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 新增欄位按鈕
  addColumnButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderRadius: 3,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
});