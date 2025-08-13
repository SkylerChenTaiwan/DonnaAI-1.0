/**
 * Notion 風格資料表格組件 - 調試版本
 * 簡化樣式以確保基本結構能正確顯示
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { TableColumn, TableData } from '@/types/table';

interface NotionStyleTableDebugProps {
  data: TableData[];
  columns: TableColumn[];
  onAddRow: () => void;
  onAddColumn?: () => void;
  onRowPress?: (item: TableData) => void;
}

export const NotionStyleTableDebug: React.FC<NotionStyleTableDebugProps> = ({
  data,
  columns,
  onAddRow,
  onAddColumn,
  onRowPress }) => {
  return (
    <View style={styles.container}>
      {/* 表頭 - 始終顯示 */}
      <View style={styles.header}>
        {columns.map((column) => (
          <View key={column.key} style={styles.headerCell}>
            <Text style={styles.headerText}>{column.title}</Text>
          </View>
        ))}
        {onAddColumn && (
          <TouchableOpacity style={styles.addColumnButton} onPress={onAddColumn}>
            <Icon name="add" size={16} color="#666" />
            <Text style={styles.addColumnText}>新增屬性</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 內容區域 */}
      <ScrollView style={styles.body}>
        {data.length === 0 ? (
          /* 空資料時顯示新增按鈕 */
          <TouchableOpacity style={styles.addFirstRow} onPress={onAddRow}>
            <Icon name="add" size={20} color="#FF6B6B" />
            <Text style={styles.addFirstRowText}>新增第一筆資料</Text>
          </TouchableOpacity>
        ) : (
          /* 顯示資料行 */
          <>
            {data.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.row}
                onPress={() => onRowPress?.(item)}
              >
                {columns.map((column) => (
                  <View key={column.key} style={styles.cell}>
                    <Text style={styles.cellText}>
                      {item[column.key] || '-'}
                    </Text>
                  </View>
                ))}
              </TouchableOpacity>
            ))}
            {/* 新增按鈕 */}
            <TouchableOpacity style={styles.addRow} onPress={onAddRow}>
              <Icon name="add" size={16} color="#666" />
              <Text style={styles.addRowText}>新增</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeec',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12 },
  headerCell: {
    flex: 1,
    paddingHorizontal: 8 },
  headerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#787774' },
  addColumnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4 },
  addColumnText: {
    fontSize: 13,
    color: '#787774' },
  body: {
    flex: 1 },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeec',
    paddingHorizontal: 16,
    paddingVertical: 12 },
  cell: {
    flex: 1,
    paddingHorizontal: 8 },
  cellText: {
    fontSize: 14,
    color: '#37352f' },
  addFirstRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8 },
  addFirstRowText: {
    fontSize: 16,
    color: '#787774' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6 },
  addRowText: {
    fontSize: 14,
    color: '#787774' } });