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
  Alert, Platform } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';
import { ResponsiveLayout, responsiveGrid } from '@/components/common/ResponsiveLayout';
import { DataTable } from '@/components/common/DataTable';
import { EditableDataTable } from '@/components/common/EditableDataTable';
import { SearchBar } from '@/components/common/SearchBar';
import { ToolbarIcons } from '@/components/common/ToolbarIcons';
import { FilterBadge, FilterCondition } from '@/components/common/FilterBadge';
import { FilterModal } from '@/components/common/FilterModal';
import { isDesktopWeb, isTabletWeb } from '@/utils/web-detector';
import { responsive, webOnly } from '@/styles/web';
import { BatchEditForm } from '@/components/database/BatchEditForm';
import { ColumnSettingsModal } from '@/components/common/ColumnSettingsModal';
import { useColumnSettings } from '@/hooks/useColumnSettings';
import { BatchAction } from '@/components/common/BatchActionsModal';
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
import { createCustomer } from '@/services/firebase/customers';
import { createRecord } from '@/services/firebase/records';
import { createTask } from '@/services/firebase/tasks';
import { showToast } from '@/utils/toast';

interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

type TabType = 'customers' | 'records' | 'tasks';

interface Tab {
  id: TabType;
  title: string;
  count?: number;
}

// 將 styles 移到組件內部以避免初始化問題
const createStyles = () => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5' },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5' },
  contentWrapper: {
    flex: 1 },
  tableContainer: {
    flex: 1 },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
    alignItems: 'center',
    gap: 12 },
  searchContainer: {
    flex: 1,
    minWidth: 200 },
  searchBar: {
    width: '100%' },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 },
  iconButton: {
    padding: 8,
    borderRadius: 6 },
  iconButtonActive: {
    backgroundColor: '#FFF5E6', // 橘色背景，與多選模式保持一致
    borderColor: '#FFE4B5',
    borderWidth: 1 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC' },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8 },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1A1A1A' },
  tabText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7A7A7A' },
  activeTabText: {
    color: '#1A1A1A',
    fontWeight: '700' },
  statusBadge: {
    backgroundColor: '#E3E1DC',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start' },
  statusActive: {
    backgroundColor: '#E3F2E6' },
  statusCompleted: {
    backgroundColor: '#E3F2E6' },
  statusTodo: {
    backgroundColor: '#FEF3E2' },
  statusInProgress: {
    backgroundColor: '#E8F0FF' },
  statusCancelled: {
    backgroundColor: '#FFE5E5' },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A' },
  typeText: {
    fontSize: 14,
    color: '#1A1A1A' },
  // 批量操作工具列樣式
  batchActionsBar: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: -2 } }),
    shadowOpacity: 0.1,
    shadowRadius: 4 },
  batchActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center' },
  batchActionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F7F6F3' },
  batchActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 },
  batchActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6 },
  batchActionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F7F6F3' },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F7F6F3' },
  // 批量編輯容器樣式
  batchEditContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000 },
  batchEditOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  batchEditContent: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 10,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 4 } }),
    shadowOpacity: 0.3,
    shadowRadius: 12,
    overflow: 'hidden' },
  
  // 桌面版樣式
  desktopSidebar: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 16 },
  desktopTabContainer: {
    gap: 8 },
  desktopTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    ...webOnly({
      transition: 'all 0.2s ease',
      cursor: 'pointer' }) },
  activeDesktopTab: {
    backgroundColor: '#F7F7F7',
    borderLeftWidth: 3,
    borderLeftColor: '#FF5C00' },
  desktopTabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7A7A7A' },
  activeDesktopTabText: {
    color: '#1A1A1A',
    fontWeight: '600' },
  desktopActions: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E3E1DC',
    gap: 12 },
  desktopActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    ...webOnly({
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      ':hover': {
        backgroundColor: '#F7F7F7' } }) },
  desktopActionText: {
    fontSize: 14,
    color: '#6B6B6B' } });

// 輔助函數 - 不依賴 styles 的版本
const getTaskStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'todo':
      return '待開始';
    default:
      return status;
  }
};

export const DatabaseScreen: React.FC = () => {
  // 在組件內部創建 styles 以確保正確的初始化順序
  const styles = React.useMemo(() => createStyles(), []);
  
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortConfig | null>(null);
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { user } = useAuthStore();
  const { customers, isLoading: customerLoading, fetchCustomers } = useCustomerStore();
  const { records, isLoading: recordLoading, fetchRecords } = useRecordStore();
  const { tasks, isLoading: taskLoading, fetchTasks } = useTaskStore();

  // 初始載入資料
  useEffect(() => {
    if (user) {
      console.log('📊 DatabaseScreen - 載入資料, 使用者:', user.email);
      fetchCustomers(user); // 傳遞完整的 user 物件
      // 載入其他資料 - 傳遞完整的 user 物件
      fetchRecords(user);
      fetchTasks(user);
    }
  }, [user, fetchCustomers, fetchRecords, fetchTasks]);

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
    { id: 'customers', title: '客戶' },
    { id: 'records', title: '紀錄' },
    { id: 'tasks', title: '任務' },
  ], []);

  // 客戶表格欄位
  const customerColumns: TableColumn[] = useMemo(() => [
    { key: 'name', title: '姓名', sortable: true, filterable: true },
    { key: 'company', title: '公司', sortable: true, filterable: true },
    { key: 'phone', title: '電話', sortable: true, filterable: true },
    { key: 'tags', title: '標籤', sortable: true, filterable: true },
  ], []);

  // 紀錄表格欄位
  const recordColumns: TableColumn[] = useMemo(() => [
    { key: 'type', title: '類型', sortable: true, filterable: true, render: (value: any) => (
      <Text style={{ fontSize: 14, color: '#1C1C1E' }}>{value === 'meeting' ? '會議' : '通話'}</Text>
    ) },
    { key: 'customerName', title: '客戶', sortable: true, filterable: true },
    { key: 'date', title: '日期', sortable: true, filterable: true },
    { key: 'summary', title: '摘要', sortable: true, filterable: true },
  ], []);

  // 任務表格欄位
  const taskColumns: TableColumn[] = useMemo(() => [
    { key: 'title', title: '標題', sortable: true, filterable: true },
    { key: 'assignee', title: '負責人', sortable: true, filterable: true },
    { key: 'dueDate', title: '到期日', sortable: true, filterable: true },
    { key: 'status', title: '狀態', sortable: true, filterable: true, render: (value: any) => {
      const statusStyle = (() => {
        switch (value) {
          case 'completed':
            return { backgroundColor: '#E3F2E6' };
          case 'in_progress':
            return { backgroundColor: '#E8F0FF' };
          case 'cancelled':
            return { backgroundColor: '#FFE5E5' };
          default:
            return { backgroundColor: '#FEF3E2' };
        }
      })();
      return (
        <View style={[{ borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 }, statusStyle]}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#1C1C1E' }}>
            {getTaskStatusText(value)}
          </Text>
        </View>
      );
    } },
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
            tags: c.tags?.join(', ') || '-' })),
          columns: customerColumns,
          loading: customerLoading };
      case 'records':
        return {
          data: (records || []).map(r => ({
            id: r.id || '',
            type: r.type || '',
            customerName: r.customerIds?.length > 0 ? '多位客戶' : '-',
            date: r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString('zh-TW') : '-',
            summary: r.aiSummary || '-' })),
          columns: recordColumns,
          loading: recordLoading };
      case 'tasks':
        return {
          data: (tasks || []).map(t => ({
            id: t.id || '',
            title: t.title || '',
            assignee: t.assigneeId || '-',
            dueDate: t.dueDate?.seconds ? new Date(t.dueDate.seconds * 1000).toLocaleDateString('zh-TW') : '-',
            status: t.status || 'todo' })),
          columns: taskColumns,
          loading: taskLoading };
      default:
        return { data: [], columns: [], loading: false };
    }
  }, [activeTab, customers, records, tasks, customerLoading, recordLoading, taskLoading]);
  
  // 定義缺少的變數
  const [showBatchActions, setShowBatchActions] = useState(false);
  
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

  // 統一的重新載入方法 - 移到 handleAddRow 之前定義
  const handleRefresh = useCallback(async () => {
    if (!user) return;
    
    switch (activeTab) {
      case 'customers':
        await fetchCustomers(user);
        break;
      case 'records':
        await fetchRecords(user);
        break;
      case 'tasks':
        await fetchTasks(user);
        break;
    }
  }, [user, activeTab, fetchCustomers, fetchRecords, fetchTasks]);

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

  const handleAddRow = useCallback(() => {
    // 根據當前標籤取得對應的欄位定義
    let columns: TableColumn[] = [];
    let onSubmit: (data: Record<string, any>) => Promise<void>;
    
    switch (activeTab) {
      case 'customers':
        columns = customerColumns;
        onSubmit = async (data) => {
          try {
            await createCustomer({
              ...data,
              organizationId: user?.organizationId || '',
              createdBy: user?.uid || '' });
            await handleRefresh();
          } catch (error) {
            console.error('Error creating customer:', error);
            throw error;
          }
        };
        break;
        
      case 'records':
        columns = recordColumns;
        onSubmit = async (data) => {
          try {
            await createRecord({
              ...data,
              organizationId: user?.organizationId || '',
              createdBy: user?.uid || '' });
            await handleRefresh();
          } catch (error) {
            console.error('Error creating record:', error);
            throw error;
          }
        };
        break;
        
      case 'tasks':
        columns = taskColumns;
        onSubmit = async (data) => {
          try {
            await createTask({
              ...data,
              type: 'unscheduled',
              priority: 'medium',
              organizationId: user?.organizationId || '',
              teamId: user?.teamId || '',
              assigneeId: user?.uid || '',
              source: 'manual' }, user?.uid || '');
            await handleRefresh();
          } catch (error) {
            console.error('Error creating task:', error);
            throw error;
          }
        };
        break;
    }
    
    // 導航到新增記錄 Modal
    navigation.navigate('AddRecordModal' as any, {
      tableType: activeTab,
      columns,
      onSubmit });
  }, [activeTab, navigation, user, customerColumns, recordColumns, taskColumns, handleRefresh]);

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
            { label: '已完成', value: 'completed' },
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
          // 如果不是管理員，只更新自己負責的客戶
          let itemsToUpdate = selectedItems;
          if (user.role !== 'admin') {
            const editableItems = customers
              .filter(c => selectedItems.includes(c.id!) && c.assignedTo === user.id)
              .map(c => c.id!);
            
            if (editableItems.length < selectedItems.length) {
              const skippedCount = selectedItems.length - editableItems.length;
              console.warn(`⚠️ 跳過 ${skippedCount} 個非負責客戶`);
              alert(`您只能編輯自己負責的客戶。將更新 ${editableItems.length} 個客戶，跳過 ${skippedCount} 個。`);
            }
            itemsToUpdate = editableItems;
          }
          
          if (itemsToUpdate.length > 0) {
            await useCustomerStore.getState().batchUpdateCustomers(
              itemsToUpdate,
              processedUpdates,
              user.id
            );
          } else {
            alert('您沒有權限編輯所選的客戶');
            return;
          }
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

  // 處理行內編輯批次儲存
  const handleInlineEditSave = async (changes: Array<{ id: string; field: string; value: any }>) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('用戶未登入');
    }

    console.log('🔄 行內編輯批次儲存:', { activeTab, changes });

    // 按項目 ID 分組變更
    const changesByItem = new Map<string, Record<string, any>>();
    changes.forEach(change => {
      if (!changesByItem.has(change.id)) {
        changesByItem.set(change.id, {});
      }
      changesByItem.get(change.id)![change.field] = change.value;
    });

    // 執行批次更新
    for (const [itemId, updates] of changesByItem.entries()) {
      switch (activeTab) {
        case 'customers':
          await useCustomerStore.getState().updateCustomer(itemId, updates, user.id);
          break;
        case 'records':
          await useRecordStore.getState().updateRecord(itemId, updates, user.id);
          break;
        case 'tasks':
          await useTaskStore.getState().updateTask(itemId, updates, user.id);
          break;
      }
    }

    // 重新載入資料
    await handleRefresh();
  };

  // 處理行內編輯即時儲存
  const handleInlineEditRowSave = async (itemId: string, changes: Record<string, any>) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('用戶未登入');
    }

    console.log('🔄 行內編輯即時儲存:', { activeTab, itemId, changes });

    switch (activeTab) {
      case 'customers':
        await useCustomerStore.getState().updateCustomer(itemId, changes, user.id);
        break;
      case 'records':
        await useRecordStore.getState().updateRecord(itemId, changes, user.id);
        break;
      case 'tasks':
        await useTaskStore.getState().updateTask(itemId, changes, user.id);
        break;
    }
  };


  // 檢查編輯權限
  const checkEditPermission = (item: any) => {
    if (!user) return false;
    
    // 管理員可以編輯所有項目
    if (user.role === 'admin') return true;
    
    // 一般用戶只能編輯自己負責的項目
    switch (activeTab) {
      case 'customers':
        return item.assignedTo === user.id;
      case 'records':
        return item.createdBy === user.id;
      case 'tasks':
        return item.assigneeId === user.id || item.createdBy === user.id;
      default:
        return false;
    }
  };

  const isDesktop = isDesktopWeb();
  
  // 桌面版側邊欄內容 - 改為函數以避免初始化問題
  const renderSidebarContent = () => {
    if (!isDesktop) return null;
    return (
    <View style={styles.desktopSidebar}>
      {/* Tab 導航 - 垂直排列 */}
      <View style={styles.desktopTabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.desktopTab,
              activeTab === tab.id && styles.activeDesktopTab,
            ]}
            onPress={() => {
              setActiveTab(tab.id);
              // 切換 Tab 時清除選擇狀態和編輯模式
              setMultiSelectMode(false);
              setSelectedItems([]);
              setShowBatchActions(false);
              setIsEditMode(false);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.desktopTabText,
                activeTab === tab.id && styles.activeDesktopTabText,
              ]}
              numberOfLines={1}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* 篩選器和操作按鈕 */}
      <View style={styles.desktopActions}>
        <TouchableOpacity
          style={styles.desktopActionButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Icon name="filter" size={20} color="#6B6B6B" />
          <Text style={styles.desktopActionText}>篩選器</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.desktopActionButton}
          onPress={() => setShowColumnSettings(true)}
        >
          <Icon name="options" size={20} color="#6B6B6B" />
          <Text style={styles.desktopActionText}>欄位設定</Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  return (
    <>
      <ResponsiveLayout
        sidebar={renderSidebarContent()}
        scrollable={false}
        style={styles.container}
      >
      <View style={styles.contentWrapper}>
        {/* Tab 導航 - 行動版保持水平 */}
        {!isDesktop && (
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
                  // 切換 Tab 時清除選擇狀態和編輯模式
                  setMultiSelectMode(false);
                  setSelectedItems([]);
                  setShowBatchActions(false);
                  setIsEditMode(false);
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
              </TouchableOpacity>
            ))}
          </View>
        )}
      
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
        <View style={styles.toolbarButtons}>
          <ToolbarIcons
            multiSelectMode={multiSelectMode}
            showSort={false}
            onFilterPress={() => setShowFilterModal(true)}
            onMultiSelectPress={() => {
              const newMode = !multiSelectMode;
              setMultiSelectMode(newMode);
              if (!newMode) {
                // 關閉多選模式時清除選擇
                setSelectedItems([]);
                setShowBatchEdit(false);
              }
              // 切換多選模式時關閉編輯模式
              if (newMode) {
                setIsEditMode(false);
              }
            }}
            onColumnsPress={() => setShowColumnSettings(true)}
          />
          {/* 行內編輯模式切換按鈕 - 移到最右方 */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              isEditMode && styles.iconButtonActive,
            ]}
            onPress={() => {
              if (!user) {
                Alert.alert('無權限', '您沒有編輯資料的權限');
                return;
              }
              // 切換編輯模式時關閉多選模式
              if (!isEditMode) {
                setMultiSelectMode(false);
                setSelectedItems([]);
              }
              setIsEditMode(!isEditMode);
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID="edit-button"
          >
            <Icon
              name={isEditMode ? 'create' : 'create-outline'}
              size={20}
              color={isEditMode ? "#FF5C00" : "#6B6B6B"}
              style={isEditMode ? { fontWeight: 'bold' } : undefined}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 篩選條件顯示 */}
      <FilterBadge
        filters={activeFilters}
        onRemoveFilter={useCallback((key: string) => {
          setActiveFilters(prev => prev.filter(f => f.key !== key));
        }, [])}
        onClearAll={useCallback(() => setActiveFilters([]), [])}
      />

          {/* 資料表格 - 包裝在可滾動的容器中 */}
          <View style={styles.tableContainer}>
            {isEditMode ? (
              // 編輯模式：使用 EditableDataTable
              <EditableDataTable
                data={currentData.data}
                columns={currentData.columns.map(col => ({
                  ...col,
                  editable: col.key !== 'id', // 除了 ID 以外都可編輯
                  validator: col.key === 'email' ? ((value: any) => {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return value && !emailRegex.test(value) ? '請輸入有效的電子郵件格式' : null;
                  }) : col.key === 'phone' ? ((value: any) => {
                    const phoneRegex = /^[\d\s\-+()]{8 }$/;
                    return value && !phoneRegex.test(value) ? '請輸入有效的電話號碼' : null;
                  }) : undefined }))}
                searchable={false}
                selectable={false}
                showCheckboxes={false}
                onRowPress={handleRowPress}
                refreshing={currentData.loading}
                filters={activeFilters}
                sortConfig={currentSort}
                onRefresh={handleRefresh}
                onSave={handleInlineEditSave}
                onRowSave={handleInlineEditRowSave}
                onAddRow={handleAddRow}
                saveMode="realtime"
                showSaveButton={false}
                showAddButton={true}
                addButtonText="新增"
                readOnly={false}
              />
            ) : (
              // 檢視模式：使用標準 DataTable
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
                onRefresh={handleRefresh}
              />
            )}
          </View>
        </View>

      {/* 篩選器 Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        columns={currentColumns}
        filters={activeFilters}
        onApply={setActiveFilters}
        tabType={activeTab}
      />


      {/* 欄位設定 Modal */}
      <ColumnSettingsModal
        visible={showColumnSettings}
        onClose={() => setShowColumnSettings(false)}
        columns={allColumns}
        visibleColumns={columnSettings?.visibleColumns || allColumns.map(col => col.key)}
        onApply={async (visibleColumns) => {
          await saveSettings({
            visibleColumns,
            columnOrder: visibleColumns });
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
      </ResponsiveLayout>
      
      {/* 批量操作工列 - 固定在視窗底部 */}
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
              <Icon name="create-outline" size={20} color="#F7F6F3" />
              <Text style={styles.batchActionButtonText}>編輯</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.batchActionButton}
              onPress={handleBatchDelete}
              activeOpacity={0.7}
            >
              <Icon name="trash-outline" size={20} color="#F7F6F3" />
              <Text style={styles.batchActionButtonText}>刪除</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.batchActionButton}
              onPress={() => setShowExportOptions(true)}
              activeOpacity={0.7}
            >
              <Icon name="download-outline" size={20} color="#F7F6F3" />
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
      
      {/* 批量編輯表單 - 移到最外層確保正確覆蓋 */}
      {showBatchEdit && (
        <View style={styles.batchEditContainer}>
          <TouchableOpacity
            style={styles.batchEditOverlay}
            activeOpacity={1}
            onPress={() => setShowBatchEdit(false)}
          />
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
    </>
  );
};

