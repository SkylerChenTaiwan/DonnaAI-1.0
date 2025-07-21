/**
 * 排序選擇器 Modal 元件
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TableColumn } from '@/types/table';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
  label?: string;
}

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  columns: TableColumn[];
  currentSort?: SortConfig | null;
  onApply: (sort: SortConfig | null) => void;
}

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  onClose,
  columns,
  currentSort,
  onApply,
}) => {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(
    currentSort?.key || null
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    currentSort?.direction || 'asc'
  );

  // 同步外部排序設定
  useEffect(() => {
    if (currentSort) {
      setSelectedColumn(currentSort.key);
      setSortDirection(currentSort.direction);
    }
  }, [currentSort]);

  // 只顯示可排序的欄位
  const sortableColumns = columns.filter(col => col.sortable);

  const handleColumnSelect = (columnKey: string) => {
    if (selectedColumn === columnKey) {
      // 如果點擊相同欄位，切換排序方向
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 選擇新欄位，預設升序
      setSelectedColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleApply = () => {
    if (selectedColumn) {
      const column = columns.find(col => col.key === selectedColumn);
      onApply({
        key: selectedColumn,
        direction: sortDirection,
        label: column?.title,
      });
    } else {
      onApply(null);
    }
    onClose();
  };

  const handleClear = () => {
    setSelectedColumn(null);
    setSortDirection('asc');
    onApply(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* 標頭 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>排序</Text>
          <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
            <Text style={styles.applyButtonText}>套用</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>選擇排序欄位</Text>
            
            {sortableColumns.map((column) => {
              const isSelected = selectedColumn === column.key;
              return (
                <TouchableOpacity
                  key={column.key}
                  style={[styles.optionItem, isSelected && styles.selectedOption]}
                  onPress={() => handleColumnSelect(column.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText
                    ]}>
                      {column.title}
                    </Text>
                    {isSelected && (
                      <View style={styles.directionIndicator}>
                        <Ionicons
                          name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                          size={16}
                          color="#999999"
                        />
                        <Text style={styles.directionText}>
                          {sortDirection === 'asc' ? '升序' : '降序'}
                        </Text>
                      </View>
                    )}
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color="#1A1A1A" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 方向切換按鈕 */}
          {selectedColumn && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>排序方向</Text>
              <View style={styles.directionButtons}>
                <TouchableOpacity
                  style={[
                    styles.directionButton,
                    sortDirection === 'asc' && styles.activeDirectionButton,
                  ]}
                  onPress={() => setSortDirection('asc')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="arrow-up" 
                    size={20} 
                    color={sortDirection === 'asc' ? '#FFFFFF' : '#FF5C00'} 
                  />
                  <Text style={[
                    styles.directionButtonText,
                    sortDirection === 'asc' && styles.activeDirectionButtonText,
                  ]}>
                    升序 (A-Z, 0-9)
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.directionButton,
                    sortDirection === 'desc' && styles.activeDirectionButton,
                  ]}
                  onPress={() => setSortDirection('desc')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="arrow-down" 
                    size={20} 
                    color={sortDirection === 'desc' ? '#FFFFFF' : '#FF5C00'} 
                  />
                  <Text style={[
                    styles.directionButtonText,
                    sortDirection === 'desc' && styles.activeDirectionButtonText,
                  ]}>
                    降序 (Z-A, 9-0)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 清除排序按鈕 */}
          {selectedColumn && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>清除排序</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 17,
    color: '#FF5C00',
  },
  applyButton: {
    padding: 8,
  },
  applyButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF5C00',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A7A7A',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    backgroundColor: '#F0F0F0',
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  selectedOptionText: {
    fontWeight: '600',
    color: '#FF5C00',
  },
  directionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  directionText: {
    fontSize: 14,
    color: '#FF5C00',
  },
  directionButtons: {
    paddingHorizontal: 16,
    gap: 12,
  },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  activeDirectionButton: {
    backgroundColor: '#007AFF',
  },
  directionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF5C00',
  },
  activeDirectionButtonText: {
    color: '#FFFFFF',
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A94438',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});