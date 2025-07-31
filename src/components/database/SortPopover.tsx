/**
 * 排序 Popover 元件
 * 使用小型浮動卡片取代全螢幕 Modal
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { Popover } from '@/components/common/Popover';
import { TableColumn } from '@/types/table';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface SortPopoverProps {
  visible: boolean;
  onClose: () => void;
  anchor: React.RefObject<any>;
  columns: TableColumn[];
  currentSort: SortConfig | null;
  onApply: (sort: SortConfig | null) => void;
}

export const SortPopover: React.FC<SortPopoverProps> = ({
  visible,
  onClose,
  anchor,
  columns,
  currentSort,
  onApply,
}) => {
  const [selectedSort, setSelectedSort] = useState<SortConfig | null>(currentSort);

  useEffect(() => {
    setSelectedSort(currentSort);
  }, [currentSort]);

  const sortableColumns = columns.filter(col => col.sortable !== false);

  const handleSelectSort = (key: string, direction: 'asc' | 'desc') => {
    if (selectedSort?.key === key && selectedSort?.direction === direction) {
      // 如果點擊相同的排序選項，則取消排序
      setSelectedSort(null);
    } else {
      setSelectedSort({ key, direction });
    }
  };

  const handleApply = () => {
    onApply(selectedSort);
    onClose();
  };

  const handleClear = () => {
    setSelectedSort(null);
  };

  const getSortIcon = (direction: 'asc' | 'desc') => {
    return direction === 'asc' ? 'arrow-up' : 'arrow-down';
  };

  const isSelected = (key: string, direction: 'asc' | 'desc') => {
    return selectedSort?.key === key && selectedSort?.direction === direction;
  };

  return (
    <Popover
      visible={visible}
      onClose={onClose}
      anchor={anchor}
      placement="bottom"
      minWidth={280}
      maxHeight={400}
    >
      <View style={styles.container}>
        {/* 標題區 */}
        <View style={styles.header}>
          <Text style={styles.title}>排序</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        {/* 排序選項列表 */}
        <ScrollView style={styles.content}>
          {sortableColumns.map((column) => (
            <View key={column.key} style={styles.columnSection}>
              <Text style={styles.columnTitle}>{column.title}</Text>
              
              {/* 升序選項 */}
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  isSelected(column.key, 'asc') && styles.sortOptionSelected
                ]}
                onPress={() => handleSelectSort(column.key, 'asc')}
                activeOpacity={0.7}
              >
                <Icon 
                  name={getSortIcon('asc')} 
                  size={16} 
                  color={isSelected(column.key, 'asc') ? '#2383e2' : '#666'} 
                />
                <Text style={[
                  styles.sortOptionText,
                  isSelected(column.key, 'asc') && styles.sortOptionTextSelected
                ]}>升序排列</Text>
                {isSelected(column.key, 'asc') && (
                  <View style={styles.checkIcon}>
                    <Icon name="checkmark" size={14} color="#2383e2" />
                  </View>
                )}
              </TouchableOpacity>
              
              {/* 降序選項 */}
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  isSelected(column.key, 'desc') && styles.sortOptionSelected
                ]}
                onPress={() => handleSelectSort(column.key, 'desc')}
                activeOpacity={0.7}
              >
                <Icon 
                  name={getSortIcon('desc')} 
                  size={16} 
                  color={isSelected(column.key, 'desc') ? '#2383e2' : '#666'} 
                />
                <Text style={[
                  styles.sortOptionText,
                  isSelected(column.key, 'desc') && styles.sortOptionTextSelected
                ]}>降序排列</Text>
                {isSelected(column.key, 'desc') && (
                  <View style={styles.checkIcon}>
                    <Icon name="checkmark" size={14} color="#2383e2" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        
        {/* 底部操作區 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
            disabled={!selectedSort}
          >
            <Text style={[
              styles.clearButtonText,
              !selectedSort && styles.disabledText
            ]}>清除</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
            activeOpacity={0.7}
          >
            <Text style={styles.applyButtonText}>套用</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Popover>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 280,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9e9e7',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37352f',
  },
  content: {
    padding: 16,
  },
  columnSection: {
    marginBottom: 16,
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#787774',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
    gap: 8,
  },
  sortOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  sortOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#37352f',
  },
  sortOptionTextSelected: {
    color: '#2383e2',
    fontWeight: '500',
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(35, 131, 226, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9e9e7',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#2383e2',
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  applyButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.4,
  },
});