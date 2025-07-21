/**
 * 資料庫主頁面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { DataTable } from '@/components/common/DataTable';
import { SearchBar } from '@/components/common/SearchBar';
import { ToolbarIcons } from '@/components/common/ToolbarIcons';
import { FilterBadge, FilterCondition } from '@/components/common/FilterBadge';
import { useCustomerStore } from '@/stores/customerStore';
import { useRecordStore } from '@/stores/recordStore';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { TableColumn } from '@/types/table';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';

type TabType = 'customers' | 'records' | 'tasks';

interface Tab {
  id: TabType;
  title: string;
  count?: number;
}

// 輔助函數
const getTaskStatusStyle = (status: string) => {
  switch (status) {
    case 'completed':
      return styles.statusCompleted;
    case 'in_progress':
      return styles.statusInProgress;
    case 'cancelled':
      return styles.statusCancelled;
    default:
      return styles.statusTodo;
  }
};

const getTaskStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'in_progress':
      return '進行中';
    case 'cancelled':
      return '已取消';
    case 'todo':
      return '待開始';
    default:
      return status;
  }
};

export const DatabaseScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  
  const { user } = useAuthStore();
  const { customers, isLoading: customerLoading, fetchCustomers } = useCustomerStore();
  const { records, isLoading: recordLoading } = useRecordStore();
  const { tasks, isLoading: taskLoading } = useTaskStore();

  // 初始載入資料
  useEffect(() => {
    if (user) {
      console.log('📊 DatabaseScreen - 載入資料, 使用者:', user.email);
      fetchCustomers(user.id, user.teamIds?.[0] || '');
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
    { key: 'tags', title: '標籤' },
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
      <View style={[styles.statusBadge, getTaskStatusStyle(value)]}>
        <Text style={styles.statusText}>
          {getTaskStatusText(value)}
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
            tags: c.tags?.join(', ') || '-',
          })),
          columns: customerColumns,
          loading: customerLoading,
        };
      case 'records':
        return {
          data: records?.map(r => ({
            id: r.id || '',
            type: r.type,
            customerName: r.customerIds?.length > 0 ? '多位客戶' : '-',
            date: new Date(r.createdAt.seconds * 1000).toLocaleDateString('zh-TW'),
            summary: r.aiSummary || '-',
          })) || [],
          columns: recordColumns,
          loading: recordLoading,
        };
      case 'tasks':
        return {
          data: tasks?.map(t => ({
            id: t.id || '',
            title: t.title,
            assignee: t.assigneeId || '-',
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
    // 只在非多選模式下導航到詳細頁面
    if (!multiSelectMode) {
      switch (activeTab) {
        case 'customers':
          navigation.navigate('CustomerDetail', { customerId: item.id });
          break;
        case 'records':
          navigation.navigate('RecordDetail', { recordId: item.id });
          break;
        case 'tasks':
          navigation.navigate('TaskDetail', { taskId: item.id });
          break;
      }
    }
  };

  const handleSelect = (selectedIds: string[]) => {
    console.log('Selected items:', selectedIds);
  };

  return (
    <Layout style={styles.container}>
      {/* Tab 導航 */}
      <View style={styles.tabContainer}>
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
              numberOfLines={1}
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
      </View>
      
      {/* 整合工具列和搜尋欄 */}
      <View style={styles.toolbar}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="搜尋資料..."
          style={styles.searchBar}
        />
        <View style={styles.toolbarButtons}>
          <ToolbarIcons
            multiSelectMode={multiSelectMode}
            onFilterPress={() => console.log('Filter pressed')}
            onSortPress={() => console.log('Sort pressed')}
            onMultiSelectPress={() => setMultiSelectMode(!multiSelectMode)}
            onColumnsPress={() => console.log('Columns pressed')}
          />
        </View>
      </View>
      
      {/* 篩選條件顯示 */}
      <FilterBadge
        filters={activeFilters}
        onRemoveFilter={(key) => {
          setActiveFilters(activeFilters.filter(f => f.key !== key));
        }}
        onClearAll={() => setActiveFilters([])}
      />

      {/* 資料表格 */}
      <DataTable
        data={currentData.data}
        columns={currentData.columns}
        searchable={false}
        selectable
        showCheckboxes={multiSelectMode}
        onRowPress={handleRowPress}
        onSelect={handleSelect}
        refreshing={currentData.loading}
        onRefresh={() => {
          // 重新載入資料
          if (!user) return;
          
          switch (activeTab) {
            case 'customers':
              fetchCustomers(user.id, user.teamIds?.[0] || '');
              break;
            case 'records':
              useRecordStore.getState().fetchRecords(user.id);
              break;
            case 'tasks':
              useTaskStore.getState().fetchTasks(user.id);
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchBar: {
    flex: 1,
    marginRight: 16,
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
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
  toolButtonActive: {
    backgroundColor: '#007AFF',
  },
  toolButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  toolButtonTextActive: {
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '700',
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
  statusTodo: {
    backgroundColor: '#FEF3E2',
  },
  statusInProgress: {
    backgroundColor: '#E8F0FF',
  },
  statusCancelled: {
    backgroundColor: '#FFE5E5',
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