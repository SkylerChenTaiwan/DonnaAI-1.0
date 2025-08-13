/**
 * NotionTable 元件測試頁面
 */

import React from 'react';
import { View, Text, StyleSheet , Platform } from 'react-native';
import { NotionTable } from '@/components/database/notion';
import { Layout } from '@/components/common/Layout';

// 測試資料
const testData = [
  {
    id: '1',
    name: '測試客戶 1',
    company: '測試公司 A',
    phone: '0912345678',
    email: 'test1@example.com',
    status: 'active' },
  {
    id: '2',
    name: '測試客戶 2',
    company: '測試公司 B',
    phone: '0923456789',
    email: 'test2@example.com',
    status: 'pending' },
  {
    id: '3',
    name: '測試客戶 3',
    company: '測試公司 C',
    phone: '0934567890',
    email: 'test3@example.com',
    status: 'inactive' },
];

const testColumns = [
  {
    id: 'name',
    key: 'name',
    title: '客戶名稱',
    type: 'text' as const,
    width: 200,
    editable: true },
  {
    id: 'company',
    key: 'company',
    title: '公司',
    type: 'text' as const,
    width: 200,
    editable: true },
  {
    id: 'phone',
    key: 'phone',
    title: '電話',
    type: 'text' as const,
    width: 150,
    editable: true },
  {
    id: 'email',
    key: 'email',
    title: '電子郵件',
    type: 'text' as const,
    width: 250,
    editable: true },
  {
    id: 'status',
    key: 'status',
    title: '狀態',
    type: 'select' as const,
    width: 120,
    editable: true,
    options: [
      { value: 'active', label: '活躍', color: 'green' },
      { value: 'pending', label: '待處理', color: 'yellow' },
      { value: 'inactive', label: '非活躍', color: 'red' },
    ] },
];

export const NotionTableTest: React.FC = () => {
  console.log('🧪 NotionTableTest 頁面載入');

  const handleCellUpdate = async (rowId: string, columnKey: string, value: any) => {
    console.log('📝 更新儲存格:', { rowId, columnKey, value });
  };

  const handleRowClick = (row: any) => {
    console.log('🔍 點擊列:', row);
  };

  const handleAddRow = () => {
    console.log('➕ 新增列');
  };

  const handleAddColumn = () => {
    console.log('➕ 新增欄');
  };

  return (
    <Layout
      title="NotionTable 測試頁面"
      showBack
    >
      <View style={styles.container}>
        <Text style={styles.info}>
          這是 NotionTable 元件的測試頁面，使用假資料進行測試。
        </Text>
        
        <View style={styles.tableContainer}>
          <NotionTable
            data={testData}
            columns={testColumns}
            onCellUpdate={handleCellUpdate}
            onRowClick={handleRowClick}
            onRowAdd={handleAddRow}
            onColumnAdd={handleAddColumn}
            emptyMessage="沒有測試資料"
          />
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5' },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20 },
  tableContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }) }),
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    ...(Platform.OS === 'web' ? {} : { elevation: 5 }) } });