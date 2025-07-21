/**
 * 資料庫主頁面
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { DataTable } from '@/components/common/DataTable';
import { SearchBar } from '@/components/common/SearchBar';
import { ToolbarIcons } from '@/components/common/ToolbarIcons';
import { FilterBadge, FilterCondition } from '@/components/common/FilterBadge';
import { FilterModal } from '@/components/common/FilterModal';
import { SortModal, SortConfig } from '@/components/common/SortModal';
import { BatchActionsModal, BatchAction } from '@/components/common/BatchActionsModal';
import { BatchEditForm } from '@/components/database/BatchEditForm';
import { ColumnSettingsModal } from '@/components/common/ColumnSettingsModal';
import { useColumnSettings } from '@/hooks/useColumnSettings';
import { ExportOptions } from '@/components/database/ExportOptions';
import { exportTableData } from '@/utils/tableExport';
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
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortConfig | null>(null);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  const { user } = useAuthStore();
  const { customers, isLoading: customerLoading, fetchCustomers } = useCustomerStore();
  const { records, isLoading: recordLoading } = useRecordStore();
  const { tasks, isLoading: taskLoading } = useTaskStore();

  // 初始載入資料
  useEffect(() => {
    if (user) {
      console.log('📊 DatabaseScreen - 載入資料, 使用者:', user.email);
      fetchCustomers(user.id, user.teamIds?.[0] || '');
      // 載入其他資料
      useRecordStore.getState().fetchRecords(user.id);
      useTaskStore.getState().fetchTasks(user.id);
    }
  }, [user?.id, user?.teamIds?.[0]]);

  // 調試：監控重新渲染
  console.log('🔄 DatabaseScreen render:', {
    activeTab,
    customersLength: customers.length,
    recordsLength: records?.length,
    tasksLength: tasks?.length,
    customerLoading,
    recordLoading,
    taskLoading
  });

  const tabs = useMemo((): Tab[] => [
    { id: 'customers', title: '客戶', count: customers.length },
    { id: 'records', title: '紀錄', count: records?.length || 0 },
    { id: 'tasks', title: '任務', count: tasks?.length || 0 },
  ], [customers.length, records?.length, tasks?.length]);

  // 客戶表格欄位
  const customerColumns: TableColumn[] = useMemo(() => [
    { key: 'name', title: '姓名', sortable: true, filterable: true },
    { key: 'company', title: '公司', sortable: true, filterable: true },
    { key: 'phone', title: '電話', filterable: true },
    { key: 'tags', title: '標籤', filterable: true },
  ], []);

  // 紀錄表格欄位
  const recordColumns: TableColumn[] = useMemo(() => [
    { key: 'type', title: '類型', sortable: true, filterable: true, render: (value) => (
      <Text style={styles.typeText}>{value === 'meeting' ? '會議' : '通話'}</Text>
    )},
    { key: 'customerName', title: '客戶', filterable: true },
    { key: 'date', title: '日期', sortable: true, filterable: true },
    { key: 'summary', title: '摘要', filterable: true },
  ], []);

  // 任務表格欄位
  const taskColumns: TableColumn[] = useMemo(() => [
    { key: 'title', title: '標題', sortable: true, filterable: true },
    { key: 'assignee', title: '負責人', filterable: true },
    { key: 'dueDate', title: '到期日', sortable: true, filterable: true },
    { key: 'status', title: '狀態', sortable: true, filterable: true, render: (value) => (
      <View style={[styles.statusBadge, getTaskStatusStyle(value)]}>
        <Text style={styles.statusText}>
          {getTaskStatusText(value)}
        </Text>
      </View>
    )},
  ], []);

  // 取得當前標籤的資料（使用 useMemo 優化）
  const currentData = useMemo(() => {
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
          data: (records || []).map(r => ({
            id: r.id || '',
            type: r.type || '',
            customerName: r.customerIds?.length > 0 ? '多位客戶' : '-',
            date: r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString('zh-TW') : '-',
            summary: r.aiSummary || '-',
          })),
          columns: recordColumns,
          loading: recordLoading,
        };
      case 'tasks':
        return {
          data: (tasks || []).map(t => ({
            id: t.id || '',
            title: t.title || '',
            assignee: t.assigneeId || '-',
            dueDate: t.dueDate?.seconds ? new Date(t.dueDate.seconds * 1000).toLocaleDateString('zh-TW') : '-',
            status: t.status || 'todo',
          })),
          columns: taskColumns,
          loading: taskLoading,
        };
      default:
        return { data: [], columns: [], loading: false };
    }
  }, [activeTab, customers, records, tasks, customerLoading, recordLoading, taskLoading]);
  
  // 使用 useMemo 穩定 allColumns 參考
  const allColumns = useMemo(() => {
    switch (activeTab) {
      case 'customers':
        return customerColumns;
      case 'records':
        return recordColumns;
      case 'tasks':
        return taskColumns;
      default:
        return customerColumns;
    }
  }, [activeTab]);
  
  // 使用欄位設定管理
  const defaultColumnKeys = useMemo(() => allColumns.map(col => col.key), [allColumns]);
  const { settings: columnSettings, saveSettings } = useColumnSettings(
    activeTab,
    defaultColumnKeys
  );
  
  // 根據設定過濾顯示的欄位（使用 useMemo 優化）
  const currentColumns = useMemo(() => {
    return columnSettings 
      ? allColumns.filter(col => columnSettings.visibleColumns.includes(col.key))
      : allColumns;
  }, [allColumns, columnSettings?.visibleColumns]);

  const handleRowPress = useCallback((item: any) => {
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
  }, [multiSelectMode, activeTab, navigation]);

  const handleSelect = useCallback((selectedIds: string[]) => {
    setSelectedItems(selectedIds);
    // 當有選中項目且在多選模式下時，顯示批量操作
    if (selectedIds.length > 0 && multiSelectMode) {
      setShowBatchActions(true);
    }
  }, [multiSelectMode]);

  // 取得當前 Tab 的批量操作（使用 useMemo 優化）
  const batchActions = useMemo((): BatchAction[] => {
    switch (activeTab) {
      case 'customers':
        return [
          { id: 'edit', label: '批量編輯', icon: 'create-outline', type: 'edit' },
          { id: 'tag', label: '新增標籤', icon: 'pricetag-outline', type: 'tag' },
          { id: 'export', label: '匯出資料', icon: 'download-outline', type: 'export' },
          { 
            id: 'delete', 
            label: '批量刪除', 
            icon: 'trash-outline', 
            type: 'delete',
            confirmRequired: true,
            confirmMessage: `確定要刪除 ${selectedItems.length} 個客戶嗎？此操作無法撤銷。`
          },
        ];
      case 'records':
        return [
          { id: 'export', label: '匯出資料', icon: 'download-outline', type: 'export' },
          { 
            id: 'delete', 
            label: '批量刪除', 
            icon: 'trash-outline', 
            type: 'delete',
            confirmRequired: true,
            confirmMessage: `確定要刪除 ${selectedItems.length} 筆紀錄嗎？此操作無法撤銷。`
          },
        ];
      case 'tasks':
        return [
          { id: 'edit', label: '批量編輯', icon: 'create-outline', type: 'edit' },
          { id: 'assign', label: '指派給', icon: 'person-outline', type: 'assign' },
          { 
            id: 'delete', 
            label: '批量刪除', 
            icon: 'trash-outline', 
            type: 'delete',
            confirmRequired: true,
            confirmMessage: `確定要刪除 ${selectedItems.length} 個任務嗎？此操作無法撤銷。`
          },
        ];
      default:
        return [];
    }
  }, [activeTab, selectedItems.length]);

  // 處理批量操作
  const handleBatchAction = async (action: BatchAction) => {
    switch (action.id) {
      case 'edit':
        setShowBatchActions(false);
        setShowBatchEdit(true);
        break;
      case 'delete':
        // TODO: 實作批量刪除
        console.log('批量刪除:', selectedItems);
        break;
      case 'export':
        setShowBatchActions(false);
        setShowExportOptions(true);
        break;
      case 'tag':
        // TODO: 實作批量標籤
        console.log('新增標籤:', selectedItems);
        break;
      case 'assign':
        // TODO: 實作批量指派
        console.log('批量指派:', selectedItems);
        break;
    }
  };

  // 取得批量編輯欄位
  const getBatchEditFields = () => {
    switch (activeTab) {
      case 'customers':
        return [
          { key: 'company', label: '公司', type: 'text' as const },
          { key: 'tags', label: '標籤', type: 'tags' as const },
          { key: 'assignedTo', label: '負責人', type: 'select' as const, options: [
            { label: '張三', value: 'user1' },
            { label: '李四', value: 'user2' },
          ]},
        ];
      case 'tasks':
        return [
          { key: 'status', label: '狀態', type: 'select' as const, options: [
            { label: '待開始', value: 'todo' },
            { label: '進行中', value: 'in_progress' },
            { label: '已完成', value: 'completed' },
            { label: '已取消', value: 'cancelled' },
          ]},
          { key: 'assignee', label: '負責人', type: 'select' as const, options: [
            { label: '張三', value: 'user1' },
            { label: '李四', value: 'user2' },
          ]},
          { key: 'priority', label: '優先級', type: 'select' as const, options: [
            { label: '高', value: 'high' },
            { label: '中', value: 'medium' },
            { label: '低', value: 'low' },
          ]},
        ];
      default:
        return [];
    }
  };

  // 處理批量編輯提交
  const handleBatchEditSubmit = async (updates: Record<string, any>) => {
    // TODO: 實作批量更新
    console.log('批量更新:', selectedItems, updates);
    setShowBatchEdit(false);
    setMultiSelectMode(false);
    setSelectedItems([]);
  };

  // 取得選中的資料
  const getSelectedData = () => {
    return currentData.data.filter(item => selectedItems.includes(item.id));
  };

  // 處理資料匯出
  const handleExport = async (options: any) => {
    try {
      const selectedData = getSelectedData();
      await exportTableData(selectedData, currentColumns, options);
      setShowExportOptions(false);
      setMultiSelectMode(false);
      setSelectedItems([]);
    } catch (error) {
      console.error('匯出失敗:', error);
    }
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
            onPress={() => {
              setActiveTab(tab.id);
              // 切換 Tab 時清除選擇狀態
              setMultiSelectMode(false);
              setSelectedItems([]);
              setShowBatchActions(false);
            }}
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
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="搜尋"
            style={styles.searchBar}
          />
        </View>
        <ToolbarIcons
          multiSelectMode={multiSelectMode}
          onFilterPress={() => setShowFilterModal(true)}
          onSortPress={() => setShowSortModal(true)}
          onMultiSelectPress={() => {
            setMultiSelectMode(!multiSelectMode);
            if (multiSelectMode) {
              setSelectedItems([]);
              setShowBatchActions(false);
            }
          }}
          onColumnsPress={() => setShowColumnSettings(true)}
        />
      </View>
      
      {/* 篩選條件顯示 */}
      <FilterBadge
        filters={activeFilters}
        onRemoveFilter={useCallback((key: string) => {
          setActiveFilters(prev => prev.filter(f => f.key !== key));
        }, [])}
        onClearAll={useCallback(() => setActiveFilters([]), [])}
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
        filters={activeFilters}
        sortConfig={currentSort}
        onRefresh={useCallback(() => {
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
        }, [user, activeTab, fetchCustomers])}
      />

      {/* 篩選器 Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        columns={currentColumns}
        filters={activeFilters}
        onApply={setActiveFilters}
        tabType={activeTab}
      />

      {/* 排序選擇器 Modal */}
      <SortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        columns={currentColumns}
        currentSort={currentSort}
        onApply={setCurrentSort}
      />

      {/* 批量操作 Modal */}
      <BatchActionsModal
        visible={showBatchActions}
        onClose={() => setShowBatchActions(false)}
        selectedCount={selectedItems.length}
        actions={batchActions}
        onAction={handleBatchAction}
      />

      {/* 批量編輯 Modal */}
      {showBatchEdit && (
        <Modal
          visible={showBatchEdit}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowBatchEdit(false)}
        >
          <BatchEditForm
            fields={getBatchEditFields()}
            selectedCount={selectedItems.length}
            onSubmit={handleBatchEditSubmit}
            onCancel={() => setShowBatchEdit(false)}
            tabType={activeTab}
          />
        </Modal>
      )}

      {/* 欄位設定 Modal */}
      <ColumnSettingsModal
        visible={showColumnSettings}
        onClose={() => setShowColumnSettings(false)}
        columns={allColumns}
        visibleColumns={columnSettings?.visibleColumns || allColumns.map(col => col.key)}
        onApply={async (visibleColumns) => {
          await saveSettings({
            visibleColumns,
            columnOrder: visibleColumns,
          });
          setShowColumnSettings(false);
        }}
      />

      {/* 匯出選項 Modal */}
      {showExportOptions && (
        <Modal
          visible={showExportOptions}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowExportOptions(false)}
        >
          <ExportOptions
            data={getSelectedData()}
            columns={currentColumns}
            onExport={handleExport}
            onCancel={() => setShowExportOptions(false)}
          />
        </Modal>
      )}
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
    gap: 16,
  },
  searchContainer: {
    flex: 1,
    minWidth: 200,
  },
  searchBar: {
    width: '100%',
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