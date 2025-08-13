/**
 * 欄位設定 Modal 元件
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
  Switch,
  Alert } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { TableColumn } from '@/types/table';

interface ColumnSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  columns: TableColumn[];
  visibleColumns: string[];
  onApply: (visibleColumns: string[]) => void;
}

export const ColumnSettingsModal: React.FC<ColumnSettingsModalProps> = ({
  visible,
  onClose,
  columns,
  visibleColumns: initialVisibleColumns,
  onApply }) => {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(initialVisibleColumns)
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map(col => col.key)
  );

  // 同步外部設定
  useEffect(() => {
    setVisibleColumns(new Set(initialVisibleColumns));
  }, [initialVisibleColumns]);

  const toggleColumn = (columnKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnKey)) {
      // 至少要保留一個欄位
      if (newVisible.size > 1) {
        newVisible.delete(columnKey);
      } else {
        Alert.alert('提示', '至少需要顯示一個欄位');
      }
    } else {
      newVisible.add(columnKey);
    }
    setVisibleColumns(newVisible);
  };

  const handleApply = () => {
    // 保持原始順序，只回傳可見的欄位
    const orderedVisibleColumns = columnOrder.filter(key => 
      visibleColumns.has(key)
    );
    onApply(orderedVisibleColumns);
    onClose();
  };

  const handleSelectAll = () => {
    setVisibleColumns(new Set(columns.map(col => col.key)));
  };

  const handleDeselectAll = () => {
    // 保留第一個欄位
    setVisibleColumns(new Set([columns[0].key]));
  };

  const handleReset = () => {
    Alert.alert(
      '重置欄位設定',
      '確定要恢復為預設設定嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: () => {
            const defaultColumns = columns.map(col => col.key);
            setVisibleColumns(new Set(defaultColumns));
            setColumnOrder(defaultColumns);
          } },
      ]
    );
  };

  // TODO: 實作拖曳排序功能
  // const moveColumn = (fromIndex: number, toIndex: number) => {
  //   const newOrder = [...columnOrder];
  //   const [movedColumn] = newOrder.splice(fromIndex, 1);
  //   newOrder.splice(toIndex, 0, movedColumn);
  //   setColumnOrder(newOrder);
  // };

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
          <Text style={styles.title}>欄位設定</Text>
          <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
            <Text style={styles.applyButtonText}>套用</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* 快速操作 */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleSelectAll}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>全選</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleDeselectAll}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>取消全選</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>重置</Text>
            </TouchableOpacity>
          </View>

          {/* 欄位列表 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>選擇要顯示的欄位</Text>
            <Text style={styles.sectionSubtitle}>
              已選擇 {visibleColumns.size} / {columns.length} 個欄位
            </Text>
          </View>

          {columnOrder.map((columnKey) => {
            const column = columns.find(col => col.key === columnKey);
            if (!column) return null;

            return (
              <View key={column.key} style={styles.columnItem}>
                <View style={styles.columnItemLeft}>
                  {/* TODO: 拖曳手柄 */}
                  <Icon name="reorder-three" size={24} color="#BEBEBE" />
                  <Text style={styles.columnLabel}>{column.title}</Text>
                </View>
                <Switch
                  value={visibleColumns.has(column.key)}
                  onValueChange={() => toggleColumn(column.key)}
                  trackColor={{ false: '#E3E1DC', true: '#1A1A1A' }}
                />
              </View>
            );
          })}

          {/* 提示文字 */}
          <View style={styles.tipContainer}>
            <Icon name="information-circle" size={20} color="#7A7A7A" />
            <Text style={styles.tipText}>
              提示：您可以拖曳欄位來調整顯示順序（開發中）
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingTop: StatusBar.currentHeight || 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC' },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A' },
  closeButton: {
    padding: 8 },
  closeButtonText: {
    fontSize: 17,
    color: '#1A1A1A' },
  applyButton: {
    padding: 8 },
  applyButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A' },
  content: {
    flex: 1 },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16 },
  quickActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0' },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A' },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4 },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7A7A7A' },
  columnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7' },
  columnItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 },
  columnLabel: {
    fontSize: 16,
    color: '#1A1A1A' },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8 },
  tipText: {
    fontSize: 14,
    color: '#7A7A7A',
    flex: 1 } });