/**
 * 資料庫主頁面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/components/common/Layout';
import { DataTable } from '@/components/common/DataTable';
import { useCustomerStore } from '@/stores/customerStore';
import { useRecordStore } from '@/stores/recordStore';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { TableColumn } from '@/types/table';

type TabType = 'customers' | 'records' | 'tasks';

interface Tab {
  id: TabType;
  title: string;
  count?: number;
}

export const DatabaseScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const { user } = useAuthStore();
  const { customers, isLoading: customerLoading, fetchCustomers } = useCustomerStore();
  const { records, loading: recordLoading } = useRecordStore();
  const { tasks, loading: taskLoading } = useTaskStore();

  // 初始載入資料
  useEffect(() => {
    if (user) {
      console.log('📊 DatabaseScreen - 載入資料, 使用者:', user.email);
      fetchCustomers(user.id, user.teamId);
    }
  }, [user]);

  const tabs: Tab[] = [
    { id: 'customers', title: '客戶', count: customers.length },
    { id: 'records', title: '紀錄', count: records?.length || 0 },
    { id: 'tasks', title: '任務', count: tasks?.length || 0 },
  ];

  // 客戶表格欄位
  const customerColumns: TableColumn[] = [
    { key: 'name', title: '姓名', sortable: true },
    { key: 'company', title: '公司', sortable: true },
    { key: 'phone', title: '電話' },
    { key: 'status', title: '狀態', sortable: true, render: (value) => (
      <View style={[styles.statusBadge, value === 'active' && styles.statusActive]}>
        <Text style={styles.statusText}>{value === 'active' ? '活躍' : '待開發'}</Text>
      </View>
    )},
  ];

  // 紀錄表格欄位
  const recordColumns: TableColumn[] = [
    { key: 'type', title: '類型', sortable: true, render: (value) => (
      <Text style={styles.typeText}>{value === 'meeting' ? '會議' : '通話'}</Text>
    )},
    { key: 'customerName', title: '客戶' },
    { key: 'date', title: '日期', sortable: true },
    { key: 'summary', title: '摘要' },
  ];

  // 任務表格欄位
  const taskColumns: TableColumn[] = [
    { key: 'title', title: '標題', sortable: true },
    { key: 'assignee', title: '負責人' },
    { key: 'dueDate', title: '到期日', sortable: true },
    { key: 'status', title: '狀態', sortable: true, render: (value) => (
      <View style={[styles.statusBadge, value === 'completed' && styles.statusCompleted]}>
        <Text style={styles.statusText}>
          {value === 'completed' ? '已完成' : value === 'inProgress' ? '進行中' : '待開始'}
        </Text>
      </View>
    )},
  ];

  // 取得當前標籤的資料
  const getCurrentData = () => {
    switch (activeTab) {
      case 'customers':
        return {
          data: customers.map(c => ({
            id: c.id || '',
            name: c.name,
            company: c.company || '-',
            phone: c.phone || '-',
            status: c.status || 'pending',
          })),
          columns: customerColumns,
          loading: customerLoading,
        };
      case 'records':
        return {
          data: records?.map(r => ({
            id: r.id,
            type: r.type,
            customerName: r.customerName || '-',
            date: new Date(r.createdAt.seconds * 1000).toLocaleDateString('zh-TW'),
            summary: r.summary || '-',
          })) || [],
          columns: recordColumns,
          loading: recordLoading,
        };
      case 'tasks':
        return {
          data: tasks?.map(t => ({
            id: t.id,
            title: t.title,
            assignee: t.assigneeName || '-',
            dueDate: t.dueDate ? new Date(t.dueDate.seconds * 1000).toLocaleDateString('zh-TW') : '-',
            status: t.status,
          })) || [],
          columns: taskColumns,
          loading: taskLoading,
        };
      default:
        return { data: [], columns: [], loading: false };
    }
  };

  const currentData = getCurrentData();

  const handleRowPress = (item: any) => {
    // 根據不同類型處理點擊事件
    console.log('Row pressed:', item);
  };

  const handleSelect = (selectedIds: string[]) => {
    console.log('Selected items:', selectedIds);
  };

  return (
    <Layout style={styles.container}>
      {/* 工具列 */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} activeOpacity={0.7}>
          <Ionicons name="filter" size={20} color="#007AFF" />
          <Text style={styles.toolButtonText}>篩選</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} activeOpacity={0.7}>
          <Ionicons name="swap-vertical" size={20} color="#007AFF" />
          <Text style={styles.toolButtonText}>排序</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} activeOpacity={0.7}>
          <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
          <Text style={styles.toolButtonText}>多選</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} activeOpacity={0.7}>
          <Ionicons name="list" size={20} color="#007AFF" />
          <Text style={styles.toolButtonText}>欄位</Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab 導航 */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.title}
              </Text>
              {tab.count !== undefined && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 資料表格 */}
      <DataTable
        data={currentData.data}
        columns={currentData.columns}
        searchable
        selectable
        onRowPress={handleRowPress}
        onSelect={handleSelect}
        refreshing={currentData.loading}
        onRefresh={() => {
          // 重新載入資料
          if (!user) return;
          
          switch (activeTab) {
            case 'customers':
              fetchCustomers(user.id, user.teamId);
              break;
            case 'records':
              useRecordStore.getState().fetchRecords();
              break;
            case 'tasks':
              useTaskStore.getState().fetchTasks();
              break;
          }
        }}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    justifyContent: 'space-around',
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    gap: 4,
  },
  toolButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
  },
  countBadge: {
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  statusBadge: {
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: '#E3F2E6',
  },
  statusCompleted: {
    backgroundColor: '#E3F2E6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  typeText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
});