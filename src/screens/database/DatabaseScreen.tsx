/**
 * 資料庫主頁面 - Notion 風格重新設計版本
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';
import { ResponsiveLayout } from '@/components/common/ResponsiveLayout';
import { SearchBar } from '@/components/common/SearchBar';
import { FilterBadge, FilterCondition } from '@/components/common/FilterBadge';
import { ColumnSettingsModal } from '@/components/common/ColumnSettingsModal';
import { FilterPopover } from '@/components/database/FilterPopover';
import { SortPopover } from '@/components/database/SortPopover';
import { EmptyState } from '@/components/database/EmptyState';
import { NotionStyleTable } from '@/components/database/NotionStyleTable';
import { NotionStyleTableDebug } from '@/components/database/NotionStyleTableDebug';
import { NotionStyleTableV2 } from '@/components/database/NotionStyleTableV2';
import { TanStackNotionTableV3 } from '@/components/database/web/TanStackNotionTableV3';
import { NotionTable } from '@/components/database/notion';
import { NotionDatabase } from '@/components/database/web/NotionDatabase';
import { DatabaseToolbar } from '@/components/database/DatabaseToolbar';
import { convertToTanStackColumns } from '@/components/database/web/columnHelpers';
import { AddColumnDialog, ColumnType, ColumnConfig } from '@/components/database/AddColumnDialog';
import { SkeletonLoader } from '@/components/database/SkeletonLoader';
import { BatchEditForm } from '@/components/database/BatchEditForm';
import { ExportOptions } from '@/components/database/ExportOptions';
import { useDatabaseKeyboardShortcuts } from '@/hooks/useDatabaseKeyboardShortcuts';
import { isDesktopWeb } from '@/utils/web-detector';
import { responsive, webOnly } from '@/styles/web';
import { useColumnSettings } from '@/hooks/useColumnSettings';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { usePendingChanges } from '@/hooks/usePendingChanges';
import { useDebouncedUpdate } from '@/hooks/useDebouncedUpdate';
import { exportTableData } from '@/utils/tableExport';
import { useCustomerStore } from '@/stores/customerStore';
import { useRecordStore } from '@/stores/recordStore';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { TableColumn } from '@/types/table';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { createCustomer, updateCustomer } from '@/services/firebase/customers';
import { createRecord, updateRecord } from '@/services/firebase/records';
import { createTask, updateTask } from '@/services/firebase/tasks';
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

export const DatabaseScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const [activeTab, setActiveTab] = useState<TabType>(
    route.params?.activeTab || 'customers'
  );
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showSortPopover, setShowSortPopover] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortConfig | null>(null);
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showAddColumnDialog, setShowAddColumnDialog] = useState(false);
  const [customColumns, setCustomColumns] = useState<Record<TabType, ColumnConfig[]>>({
    customers: [],
    records: [],
    tasks: [],
  });
  
  const { user } = useAuthStore();
  const { customers, isLoading: customerLoading, fetchCustomers } = useCustomerStore();
  const { records, isLoading: recordLoading, fetchRecords } = useRecordStore();
  const { tasks, isLoading: taskLoading, fetchTasks } = useTaskStore();

  // 載入資料
  useEffect(() => {
    if (user) {
      console.log('🔄 DatabaseScreen 載入資料，使用者:', user.email);
      fetchCustomers(user);
      fetchRecords(user);
      fetchTasks(user);
    }
  }, [user]);

  // Pending changes hook
  const {
    pendingChanges,
    hasUnsavedChanges,
    updatePendingChange,
    addDraftRow,
    getDraftRows,
    getValidationError,
    validateAllChanges,
    clearPendingChanges,
    removeDraftRow,
  } = usePendingChanges(activeTab);

  // State for popover anchors
  const [filterAnchor, setFilterAnchor] = useState<React.RefObject<any> | null>(null);
  const [sortAnchor, setSortAnchor] = useState<React.RefObject<any> | null>(null);

  // 初始載入資料
  useEffect(() => {
    if (user) {
      console.log('📊 DatabaseScreen - 載入資料, 使用者:', user.email);
      fetchCustomers(user);
      fetchRecords(user);
      fetchTasks(user);
    }
  }, [user, fetchCustomers, fetchRecords, fetchTasks]);

  // 處理路由參數變化
  useEffect(() => {
    if (route.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
  }, [route.params?.activeTab]);

  const tabs = useMemo((): Tab[] => [
    { id: 'customers', title: '客戶', count: customers.length },
    { id: 'records', title: '紀錄', count: records?.length },
    { id: 'tasks', title: '任務', count: tasks?.length },
  ], [customers.length, records?.length, tasks?.length]);

  // 處理切換標籤時的未儲存變更
  const handleTabChange = useCallback((newTab: TabType) => {
    if (hasUnsavedChanges) {
      Alert.alert(
        '未儲存的變更',
        '您有未儲存的變更，切換標籤將會遺失這些變更。確定要繼續嗎？',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '捨棄變更',
            style: 'destructive',
            onPress: () => {
              clearPendingChanges();
              setActiveTab(newTab);
              setMultiSelectMode(false);
              setSelectedItems([]);
            },
          },
        ],
      );
    } else {
      setActiveTab(newTab);
      setMultiSelectMode(false);
      setSelectedItems([]);
    }
  }, [hasUnsavedChanges, clearPendingChanges]);

  // 基礎欄位定義（可被自訂欄位擴展）
  const baseColumns = useMemo(() => ({
    customers: [
      { key: 'name', title: '姓名', sortable: true, filterable: true, type: 'text' as const },
      { key: 'company', title: '公司', sortable: true, filterable: true, type: 'text' as const },
      { key: 'phone', title: '電話', sortable: true, filterable: true, type: 'phone' as const },
      { key: 'tags', title: '標籤', sortable: true, filterable: true, type: 'tags' as const },
    ],
    records: [
      { key: 'type', title: '類型', sortable: true, filterable: true, type: 'select' as const, 
        options: ['meeting', 'call'] },
      { key: 'customerName', title: '客戶', sortable: true, filterable: true, type: 'text' as const },
      { key: 'date', title: '日期', sortable: true, filterable: true, type: 'date' as const },
      { key: 'summary', title: '摘要', sortable: true, filterable: true, type: 'text' as const },
    ],
    tasks: [
      { key: 'title', title: '標題', sortable: true, filterable: true, type: 'text' as const },
      { key: 'assignee', title: '負責人', sortable: true, filterable: true, type: 'text' as const },
      { key: 'dueDate', title: '到期日', sortable: true, filterable: true, type: 'date' as const },
      { key: 'status', title: '狀態', sortable: true, filterable: true, type: 'select' as const,
        options: ['todo', 'in_progress', 'completed', 'cancelled'], render: (value: any) => {
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
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#37352f' }}>
              {value === 'completed' ? '已完成' : value === 'todo' ? '待開始' : value}
            </Text>
          </View>
        );
      } },
    ],
  }), []);

  // 合併基礎欄位和自訂欄位
  const allColumns = useMemo(() => {
    const base = baseColumns[activeTab];
    const custom = customColumns[activeTab].map(col => ({
      key: col.id,
      title: col.title,
      sortable: true,
      filterable: true,
      custom: true,
    }));
    return [...base, ...custom];
  }, [activeTab, baseColumns, customColumns]);

  // 使用欄位設定管理
  const defaultColumnKeys = useMemo(() => allColumns.map(col => col.key), [allColumns]);
  const { settings: columnSettings, saveSettings } = useColumnSettings(
    activeTab,
    defaultColumnKeys
  );
  
  // 使用欄位順序管理
  const { getOrderedColumns, saveColumnOrder } = useColumnOrder(
    activeTab,
    allColumns
  );
  
  // 根據設定過濾並排序顯示的欄位
  const currentColumns = useMemo(() => {
    const visibleColumns = columnSettings 
      ? allColumns.filter(col => columnSettings.visibleColumns.includes(col.key))
      : allColumns;
    
    // 應用使用者自訂的欄位順序
    return getOrderedColumns(visibleColumns);
  }, [allColumns, columnSettings?.visibleColumns, getOrderedColumns]);

  // 取得當前標籤的資料
  const currentData = useMemo(() => {
    const draftRows = getDraftRows();
    
    console.log('📊 DatabaseScreen 資料狀態:', {
      activeTab,
      tasksLength: tasks?.length || 0,
      customersLength: customers?.length || 0,
      recordsLength: records?.length || 0,
      draftRowsLength: draftRows.length,
      taskLoading,
      customerLoading,
      recordLoading,
    });
    
    switch (activeTab) {
      case 'customers':
        const customerData = customers.map(c => ({
          id: c.id || '',
          name: c.name,
          company: c.company || '-',
          phone: c.phone || '-',
          tags: c.tags?.join(', ') || '-',
          ...customColumns.customers.reduce((acc, col) => ({
            ...acc,
            [col.id]: c[col.id] || col.defaultValue || '-'
          }), {})
        }));
        
        // 加入草稿列
        const draftCustomerData = draftRows.map(draft => ({
          id: draft.id,
          name: draft.data.name || '',
          company: draft.data.company || '',
          phone: draft.data.phone || '',
          tags: draft.data.tags || '',
          ...customColumns.customers.reduce((acc, col) => ({
            ...acc,
            [col.id]: draft.data[col.id] || col.defaultValue || ''
          }), {}),
          _isDraft: true
        }));
        
        return {
          data: [...customerData, ...draftCustomerData],
          loading: customerLoading,
        };
      case 'records':
        const recordData = (records || []).map(r => ({
          id: r.id || '',
          type: r.type || '',
          customerName: r.customerIds?.length > 0 ? '多位客戶' : '-',
          date: r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString('zh-TW') : '-',
          summary: r.aiSummary || '-',
          ...customColumns.records.reduce((acc, col) => ({
            ...acc,
            [col.id]: r[col.id] || col.defaultValue || '-'
          }), {})
        }));
        
        // 加入草稿列
        const draftRecordData = draftRows.map(draft => ({
          id: draft.id,
          type: draft.data.type || '',
          customerName: draft.data.customerName || '',
          date: draft.data.date || '',
          summary: draft.data.summary || '',
          ...customColumns.records.reduce((acc, col) => ({
            ...acc,
            [col.id]: draft.data[col.id] || col.defaultValue || ''
          }), {}),
          _isDraft: true
        }));
        
        return {
          data: [...recordData, ...draftRecordData],
          loading: recordLoading,
        };
      case 'tasks':
        const taskData = (tasks || []).map(t => ({
          id: t.id || '',
          title: t.title || '',
          assignee: t.assigneeId || '-',
          dueDate: t.dueDate?.seconds ? new Date(t.dueDate.seconds * 1000).toLocaleDateString('zh-TW') : '-',
          status: t.status || 'todo',
          ...customColumns.tasks.reduce((acc, col) => ({
            ...acc,
            [col.id]: t[col.id] || col.defaultValue || '-'
          }), {})
        }));
        
        // 加入草稿列
        const draftTaskData = draftRows.map(draft => ({
          id: draft.id,
          title: draft.data.title || '',
          assignee: draft.data.assignee || '',
          dueDate: draft.data.dueDate || '',
          status: draft.data.status || 'todo',
          ...customColumns.tasks.reduce((acc, col) => ({
            ...acc,
            [col.id]: draft.data[col.id] || col.defaultValue || ''
          }), {}),
          _isDraft: true
        }));
        
        return {
          data: [...taskData, ...draftTaskData],
          loading: taskLoading,
        };
      default:
        return { data: [], loading: false };
    }
  }, [activeTab, customers, records, tasks, customerLoading, recordLoading, taskLoading, customColumns, getDraftRows]);

  // 統一的重新載入方法
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

  const handleAddRowWithData = useCallback(async (data: Record<string, any>) => {
    try {
      switch (activeTab) {
        case 'customers':
          await createCustomer({
            ...data,
            organizationId: user?.organizationId || '',
            createdBy: user?.uid || '',
          });
          break;
          
        case 'records':
          await createRecord({
            ...data,
            organizationId: user?.organizationId || '',
            createdBy: user?.uid || '',
          });
          break;
          
        case 'tasks':
          await createTask({
            ...data,
            type: data.type || 'unscheduled',
            priority: data.priority || 'medium',
            organizationId: user?.organizationId || '',
            teamId: user?.teamId || '',
            assigneeId: data.assigneeId || user?.uid || '',
            source: 'manual',
          }, user?.uid || '');
          break;
      }
      
      await handleRefresh();
      showToast('success', `成功新增${tabs.find(t => t.id === activeTab)?.title}`);
    } catch (error) {
      console.error('Error creating row:', error);
      showToast('error', '新增失敗');
      throw error;
    }
  }, [activeTab, user, handleRefresh, tabs]);

  const handleAddRow = useCallback(async (rowData?: Record<string, any>) => {
    if (!rowData) {
      // 新增草稿列（不立即儲存到 Firebase）
      const draftId = addDraftRow();
      console.log('新增草稿列:', draftId);
      
      // 可以選擇性地滾動到新列或聚焦到第一個欄位
      // TODO: 實作滾動到新列的邏輯
    } else {
      // 有資料時，檢查是否為草稿列的儲存
      if (rowData.id && rowData.id.startsWith('draft_')) {
        // 草稿列要儲存到 Firebase
        const validation = validateAllChanges();
        if (!validation) {
          showToast('error', '請填寫所有必填欄位');
          return;
        }
        
        // 取得草稿資料
        const draftRow = pendingChanges.get(rowData.id);
        if (draftRow) {
          await handleAddRowWithData(draftRow.data);
          // 成功後移除草稿
          removeDraftRow(rowData.id);
        }
      } else {
        // 舊模式：內聯新增（保留向後相容）
        await handleAddRowWithData(rowData);
      }
    }
  }, [activeTab, addDraftRow, validateAllChanges, pendingChanges, handleAddRowWithData, removeDraftRow]);

  const handleAddColumn = useCallback((column: ColumnConfig) => {
    setCustomColumns(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], column]
    }));
    showToast('success', `成功新增欄位：${column.title}`);
  }, [activeTab]);

  const handleSort = useCallback((sort: SortConfig | null) => {
    setCurrentSort(sort);
    setShowSortPopover(false);
  }, []);

  // 鍵盤快捷鍵
  const { shortcuts } = useDatabaseKeyboardShortcuts({
    onAddRow: handleAddRow,
    onSearch: () => {
      // 聚焦到搜尋框
      const searchInput = document.querySelector('input[placeholder*="搜尋"]') as HTMLInputElement;
      searchInput?.focus();
    },
    onFilter: (ref: React.RefObject<any>) => {
      setFilterAnchor(ref);
      setShowFilterPopover(true);
    },
    onSort: (ref: React.RefObject<any>) => {
      setSortAnchor(ref);
      setShowSortPopover(true);
    },
    onMultiSelect: () => setMultiSelectMode(!multiSelectMode),
    onEditMode: () => {
      // 如果有編輯模式，在這裡切換
      showToast('info', '編輯模式尚未實作');
    },
    onEscape: () => {
      if (multiSelectMode) {
        setMultiSelectMode(false);
        setSelectedItems([]);
      }
    },
    onSelectAll: () => {
      if (multiSelectMode) {
        setSelectedItems(currentData.data.map(item => item.id));
      }
    },
    onDelete: () => {
      if (selectedItems.length > 0) {
        Alert.alert(
          '確認刪除',
          `確定要刪除 ${selectedItems.length} 筆資料嗎？`,
          [
            { text: '取消', style: 'cancel' },
            { text: '刪除', style: 'destructive', onPress: handleBatchDelete },
          ]
        );
      }
    },
  });

  const handleBatchDelete = async () => {
    // TODO: 實作批量刪除
    showToast('info', '批量刪除功能尚未實作');
  };

  const isDesktop = isDesktopWeb();

  // 建立 debounced 更新函數
  const handleCellUpdate = useCallback(async (rowId: string, columnKey: string, value: any) => {
    try {
      // 檢查是否為草稿列
      const isDraft = rowId.startsWith('draft_');
      
      if (isDraft) {
        // 更新 pending changes
        updatePendingChange(rowId, columnKey, value);
      } else {
        // 更新現有資料
        switch (activeTab) {
          case 'customers':
            await updateCustomer(rowId, { [columnKey]: value });
            break;
          case 'records':
            await updateRecord(rowId, { [columnKey]: value });
            break;
          case 'tasks':
            await updateTask(rowId, { [columnKey]: value });
            break;
        }
        showToast('success', '已自動儲存');
      }
    } catch (error) {
      console.error('更新失敗:', error);
      showToast('error', '更新失敗');
    }
  }, [activeTab, updatePendingChange]);

  const { debouncedUpdate } = useDebouncedUpdate(handleCellUpdate, 500);

  // 偵錯資訊：檢查平台偵測
  console.log('🔍 DatabaseScreen 平台偵測:', {
    Platform: Platform.OS,
    isDesktop,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    windowSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'
  });

  // 使用新的 NotionTable 元件
  console.log('🔍 使用新的 NotionTable 元件');

  const renderContent = () => (
    <>
      <View style={[styles.container, isDesktop && styles.desktopContainer]}>
        <View style={styles.contentWrapper}>
          {/* Tab 導航 - 水平顯示（僅行動版） */}
          {!isDesktop && (
            <View style={styles.tabContainer}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    activeTab === tab.id && styles.activeTab,
                  ]}
                  onPress={() => handleTabChange(tab.id)}
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
                    <Text style={[
                      styles.tabCount,
                      activeTab === tab.id && styles.activeTabCount,
                    ]}>
                      {tab.count}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* 工具列與搜尋欄 */}
          <View style={styles.toolbarContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`搜尋${tabs.find(t => t.id === activeTab)?.title}...`}
              style={styles.searchBar}
            />
            <DatabaseToolbar
              onFilter={(ref) => {
                setFilterAnchor(ref);
                setShowFilterPopover(true);
              }}
              onSort={(ref) => {
                setSortAnchor(ref);
                setShowSortPopover(true);
              }}
              onMultiSelect={() => setMultiSelectMode(!multiSelectMode)}
              onAddColumn={() => setShowAddColumnDialog(true)}
              multiSelectMode={multiSelectMode}
              hasActiveFilters={activeFilters.length > 0}
              hasActiveSort={currentSort !== null}
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

          {/* 未儲存變更提示 */}
          {hasUnsavedChanges && (
            <View style={styles.unsavedChangesBar}>
              <View style={styles.unsavedChangesContent}>
                <Icon name="alert-circle" size={14} color="#e03e3e" />
                <Text style={styles.unsavedChangesText}>
                  您有未儲存的變更
                </Text>
              </View>
              <View style={styles.unsavedChangesActions}>
                <TouchableOpacity
                  style={styles.discardButton}
                  onPress={() => {
                    Alert.alert(
                      '捨棄變更',
                      '確定要捨棄所有未儲存的變更嗎？',
                      [
                        { text: '取消', style: 'cancel' },
                        {
                          text: '捨棄',
                          style: 'destructive',
                          onPress: clearPendingChanges,
                        },
                      ],
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.discardButtonText}>捨棄</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={async () => {
                    const isValid = validateAllChanges();
                    if (!isValid) {
                      showToast('error', '請填寫所有必填欄位');
                      return;
                    }
                    
                    // 儲存所有草稿列
                    const draftRows = getDraftRows();
                    for (const draft of draftRows) {
                      try {
                        await handleAddRowWithData(draft.data);
                        removeDraftRow(draft.id);
                      } catch (error) {
                        console.error('儲存失敗:', error);
                        showToast('error', '部分資料儲存失敗');
                        return;
                      }
                    }
                    
                    clearPendingChanges();
                    showToast('success', '已儲存所有變更');
                    await handleRefresh();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveButtonText}>儲存變更</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 資料內容區域 */}
          <View style={styles.tableContainer}>
            {currentData.loading ? (
              <SkeletonLoader 
                rows={5} 
                columns={currentColumns.length}
                showHeader={true}
              />
            ) : Platform.OS === 'web' ? (
              <NotionTable
                data={currentData.data}
                columns={currentColumns.map(col => ({
                  id: col.key,
                  key: col.key,
                  title: col.title,
                  type: col.type as any,
                  width: col.width,
                  editable: col.editable !== false,
                  options: col.options,
                }))}
                onCellUpdate={(rowId, columnKey, value) => {
                  console.log('更新儲存格:', { rowId, columnKey, value, activeTab });
                  // 使用 debounced 更新
                  debouncedUpdate(rowId, columnKey, value);
                }}
                onRowClick={handleRowPress}
                onRowAdd={handleAddRow}
                onColumnAdd={() => setShowAddColumnDialog(true)}
                multiSelect={multiSelectMode}
                selectedRows={selectedItems}
                onSelectionChange={setSelectedItems}
                loading={currentData.loading}
                emptyMessage="沒有資料，點擊新增列開始"
              />
            ) : (
              <NotionStyleTableV2
                data={currentData.data}
                columns={currentColumns}
                onAddRow={handleAddRow}
                onAddColumn={() => setShowAddColumnDialog(true)}
                onRowPress={handleRowPress}
                multiSelectMode={multiSelectMode}
                selectedItems={selectedItems}
                onSelect={setSelectedItems}
                refreshing={currentData.loading}
                onRefresh={handleRefresh}
                sortConfig={currentSort}
                onSort={(key) => {
                  // 處理列標題點擊的排序
                  const newSort = currentSort?.key === key 
                    ? { key, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' as const }
                    : { key, direction: 'asc' as const };
                  setCurrentSort(newSort);
                }}
                onUpdateCell={async (rowId, columnKey, value) => {
                  // 根據 activeTab 更新對應的資料
                  showToast('info', '儲存格編輯功能開發中');
                }}
                onColumnsReorder={async (reorderedColumns) => {
                  // 儲存新的欄位順序
                  const newOrder = reorderedColumns.map(col => col.key);
                  await saveColumnOrder(newOrder);
                  showToast('success', '已儲存欄位順序');
                }}
                enableColumnDrag={true}
              />
            )}
          </View>
        </View>

        {/* Desktop Side Panel */}
        {isDesktop && (
          <ResponsiveLayout mobileComponent={null}>
            <View style={styles.sidePanel}>
              {/* Side panel content */}
            </View>
          </ResponsiveLayout>
        )}
      </View>

      {/* 篩選器 Popover */}
      {filterAnchor && (
        <FilterPopover
          visible={showFilterPopover}
          onClose={() => setShowFilterPopover(false)}
          anchor={filterAnchor}
          columns={currentColumns}
          filters={activeFilters}
          onApply={setActiveFilters}
        />
      )}

      {/* 排序 Popover */}
      {sortAnchor && (
        <SortPopover
          visible={showSortPopover}
          onClose={() => setShowSortPopover(false)}
          anchor={sortAnchor}
          columns={currentColumns}
          currentSort={currentSort}
          onApply={handleSort}
        />
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

      {/* 新增欄位對話框 */}
      <AddColumnDialog
        isVisible={showAddColumnDialog}
        onClose={() => setShowAddColumnDialog(false)}
        onAdd={handleAddColumn}
        existingColumns={allColumns.map(col => col.title)}
      />

      {/* 批量操作工列 */}
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
    </>
  );

  // 根據平台渲染
  if (Platform.OS === 'web') {
    return renderContent();
  }

  return (
    <Layout scrollable={false}>
      {renderContent()}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: {
        backgroundColor: '#fbfbfa', // Notion 背景色
      },
    }),
  },
  desktopContainer: {
    // 不需要設定 marginLeft，WebNavigator 會處理佈局
  },
  contentWrapper: {
    flex: 1,
  },
  toolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E7',
    gap: 16,
  },
  searchBar: {
    width: 200,
    backgroundColor: '#f9f8f7',
    borderWidth: 0,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        flex: 'unset' as any,
        height: '100%',
      },
    }),
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeec',
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
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#787774',
  },
  activeTabText: {
    color: '#37352f',
    fontWeight: '600',
  },
  tabCount: {
    fontSize: 14,
    color: '#787774',
    backgroundColor: '#f9f8f7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeTabCount: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    color: '#FF6B6B',
  },
  
  
  // 批量操作工具列
  batchActionsBar: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    backgroundColor: '#37352f',
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
    color: '#F7F6F3',
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
    color: '#F7F6F3',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F7F6F3',
  },
  
  // 未儲存變更提示列
  unsavedChangesBar: {
    backgroundColor: '#FFF4E6',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unsavedChangesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unsavedChangesText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E65100',
  },
  unsavedChangesActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  discardButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  discardButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#757575',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});