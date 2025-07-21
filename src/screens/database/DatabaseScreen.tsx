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
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/components/common/Layout';
import { DataTable } from '@/components/common/DataTable';
import { SearchBar } from '@/components/common/SearchBar';
import { ToolbarIcons } from '@/components/common/ToolbarIcons';
import { FilterBadge, FilterCondition } from '@/components/common/FilterBadge';
import { FilterModal } from '@/components/common/FilterModal';
import { SortModal, SortConfig } from '@/components/common/SortModal';
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
      fetchCustomers(user); // 傳遞完整的 user 物件
      // 載入其他資料 - 傳遞完整的 user 物件
      useRecordStore.getState().fetchRecords(user);
      useTaskStore.getState().fetchTasks(user);
    }
  }, [user, fetchCustomers]);

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
  }, []);

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
        handleBatchDelete();
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
    // 獲取團隊成員作為選項（暫時使用模擬資料）
    const teamMembers = [
      { label: '張三', value: 'user1' },
      { label: '李四', value: 'user2' },
      { label: '王五', value: 'user3' },
    ];

    switch (activeTab) {
      case 'customers':
        return [
          { key: 'company', label: '公司', type: 'text' as const },
          { key: 'email', label: '電子郵件', type: 'text' as const },
          { key: 'phone', label: '電話', type: 'text' as const },
          { key: 'tags', label: '標籤', type: 'tags' as const },
          { key: 'assignedTo', label: '負責人', type: 'select' as const, options: teamMembers },
          { key: 'notes', label: '備註', type: 'text' as const },
        ];
      case 'records':
        return [
          { key: 'type', label: '類型', type: 'select' as const, options: [
            { label: '會議', value: 'meeting' },
            { label: '電話', value: 'call' },
            { label: '筆記', value: 'note' },
            { label: '其他', value: 'other' },
          ]},
          { key: 'status', label: '狀態', type: 'select' as const, options: [
            { label: '草稿', value: 'draft' },
            { label: '處理中', value: 'processing' },
            { label: '已完成', value: 'completed' },
          ]},
          { key: 'location', label: '地點', type: 'text' as const },
          { key: 'title', label: '標題', type: 'text' as const },
        ];
      case 'tasks':
        return [
          { key: 'status', label: '狀態', type: 'select' as const, options: [
            { label: '待辦', value: 'todo' },
            { label: '進行中', value: 'in_progress' },
            { label: '已完成', value: 'completed' },
            { label: '已取消', value: 'cancelled' },
          ]},
          { key: 'assigneeId', label: '負責人', type: 'select' as const, options: teamMembers },
          { key: 'priority', label: '優先級', type: 'select' as const, options: [
            { label: '緊急', value: 'urgent' },
            { label: '高', value: 'high' },
            { label: '中', value: 'medium' },
            { label: '低', value: 'low' },
          ]},
          { key: 'type', label: '類型', type: 'select' as const, options: [
            { label: '已排程', value: 'scheduled' },
            { label: '未排程', value: 'unscheduled' },
            { label: '待定', value: 'pending' },
          ]},
          { key: 'tags', label: '標籤', type: 'tags' as const },
        ];
      default:
        return [];
    }
  };

  // 處理批量刪除
  const handleBatchDelete = async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      console.error('用戶未登入');
      return;
    }

    // TODO: 顯示確認對話框
    const confirmDelete = true; // 暫時設為 true，之後需要實作確認對話框
    if (!confirmDelete) {
      return;
    }

    try {
      // 根據當前標籤頁執行不同的批量刪除
      switch (activeTab) {
        case 'customers':
          await useCustomerStore.getState().batchDeleteCustomers(
            selectedItems,
            user.id
          );
          break;
          
        case 'records':
          await useRecordStore.getState().batchDeleteRecords(
            selectedItems,
            user.id
          );
          break;
          
        case 'tasks':
          // 任務使用 batchOperateTasks 方法
          await useTaskStore.getState().batchOperateTasks(
            {
              taskIds: selectedItems,
              operation: 'delete'
            },
            user
          );
          break;
      }
      
      // 重新載入資料
      switch (activeTab) {
        case 'customers':
          await useCustomerStore.getState().fetchCustomers(user);
          break;
        case 'records':
          await useRecordStore.getState().fetchRecords(user);
          break;
        case 'tasks':
          await useTaskStore.getState().fetchTasks(user);
          break;
      }
      
      // 清除選擇狀態
      setShowBatchActions(false);
      setMultiSelectMode(false);
      setSelectedItems([]);
      
      // TODO: 顯示成功訊息
      console.log(`✅ 成功刪除 ${selectedItems.length} 筆資料`);
    } catch (error) {
      console.error('批量刪除失敗:', error);
      // TODO: 顯示錯誤訊息
    }
  };

  // 處理批量編輯提交
  const handleBatchEditSubmit = async (updates: Record<string, any>) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      console.error('用戶未登入');
      return;
    }

    // 處理特殊欄位（如標籤）
    const processedUpdates = { ...updates };
    if (processedUpdates.tags && typeof processedUpdates.tags === 'string') {
      // 將逗號分隔的字串轉換為陣列
      processedUpdates.tags = processedUpdates.tags
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);
    }

    console.log('🔄 批量更新開始:', {
      activeTab,
      selectedItems,
      processedUpdates,
      userId: user.id
    });

    try {
      // 根據當前標籤頁執行不同的批量更新
      switch (activeTab) {
        case 'customers':
          await useCustomerStore.getState().batchUpdateCustomers(
            selectedItems,
            processedUpdates,
            user.id
          );
          break;
          
        case 'records':
          await useRecordStore.getState().batchUpdateRecords(
            selectedItems,
            processedUpdates,
            user.id
          );
          break;
          
        case 'tasks':
          // 任務使用 batchOperateTasks 方法
          await useTaskStore.getState().batchOperateTasks(
            {
              taskIds: selectedItems,
              operation: 'update',
              updates: processedUpdates
            },
            user
          );
          break;
      }
      
      // 重新載入資料
      switch (activeTab) {
        case 'customers':
          await useCustomerStore.getState().fetchCustomers(user);
          break;
        case 'records':
          await useRecordStore.getState().fetchRecords(user);
          break;
        case 'tasks':
          await useTaskStore.getState().fetchTasks(user);
          break;
      }
      
      // 清除選擇狀態
      setShowBatchEdit(false);
      setMultiSelectMode(false);
      setSelectedItems([]);
      
      // TODO: 顯示成功訊息
      console.log(`✅ 成功更新 ${selectedItems.length} 筆資料`);
    } catch (error) {
      console.error('批量更新失敗:', error);
      // TODO: 顯示錯誤訊息
    }
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
            const newMode = !multiSelectMode;
            setMultiSelectMode(newMode);
            if (!newMode) {
              // 關閉多選模式時清除選擇
              setSelectedItems([]);
              setShowBatchEdit(false);
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
        selectable={multiSelectMode}
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
              fetchCustomers(user);
              break;
            case 'records':
              useRecordStore.getState().fetchRecords(user);
              break;
            case 'tasks':
              useTaskStore.getState().fetchTasks(user);
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

      {/* 批量操作工具列 - 類似 Notion 的設計 */}
      {multiSelectMode && selectedItems.length > 0 && (
        <View style={styles.batchActionsBar}>
          <View style={styles.batchActionsLeft}>
            <Text style={styles.batchActionsText}>
              已選擇 {selectedItems.length} 個項目
            </Text>
          </View>
          <View style={styles.batchActionsRight}>
            <TouchableOpacity
              style={styles.batchActionButton}
              onPress={() => setShowBatchEdit(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.batchActionButtonText}>編輯</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.batchActionButton}
              onPress={handleBatchDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.batchActionButtonText}>刪除</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.batchActionButton}
              onPress={() => setShowExportOptions(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="download-outline" size={20} color="#FFFFFF" />
              <Text style={styles.batchActionButtonText}>匯出</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.batchActionButton, styles.cancelButton]}
              onPress={() => {
                setSelectedItems([]);
                setMultiSelectMode(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 批量編輯表單 - 在當前頁面顯示 */}
      {showBatchEdit && (
        <View style={styles.batchEditContainer}>
          <View style={styles.batchEditContent}>
            <BatchEditForm
              fields={getBatchEditFields()}
              selectedCount={selectedItems.length}
              onSubmit={handleBatchEditSubmit}
              onCancel={() => setShowBatchEdit(false)}
              tabType={activeTab}
            />
          </View>
        </View>
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
  // 批量操作工具列樣式
  batchActionsBar: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  batchActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batchActionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  batchActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  batchActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  batchActionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // 批量編輯容器樣式
  batchEditContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  batchEditContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
});