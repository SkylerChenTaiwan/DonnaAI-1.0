/**
 * 資料庫主頁面 - Notion 風格重新設計版本
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// 在開發模式下載入測試工具
if (__DEV__) {
  import('@/utils/create-test-task').catch(console.error);
}
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Platform,
  ScrollView,
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
import { NotionTable } from '@/components/database/notion/NotionTable';
import { NotionStyleTableDebug } from '@/components/database/NotionStyleTableDebug';
import { NotionStyleTableV2 } from '@/components/database/NotionStyleTableV2';
import { TanStackNotionTableV3 } from '@/components/database/web/TanStackNotionTableV3';
import { DatabaseToolbar } from '@/components/database/DatabaseToolbar';
import { convertToTanStackColumns } from '@/components/database/web/columnHelpers';
import { AddColumnDialog, ColumnType, ColumnConfig } from '@/components/database/AddColumnDialog';
import { SkeletonLoader } from '@/components/database/SkeletonLoader';
import { BatchEditForm } from '@/components/database/BatchEditForm';
import { ExportOptions } from '@/components/database/ExportOptions';
import { CSVUploader } from '@/components/input/CSVUploader';
import { DynamicFormBuilder, DynamicFormBuilderRef } from '@/components/database/forms/DynamicFormBuilder';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useDatabaseKeyboardShortcuts } from '@/hooks/useDatabaseKeyboardShortcuts';
import { isDesktopWeb } from '@/utils/web-detector';
import { responsive, webOnly } from '@/styles/web';
// import { SyncStatusIndicator } from '@/components/database/SyncStatusIndicator'; // 已移除 - 唯讀模式不需要
import { useColumnSettings } from '@/hooks/useColumnSettings';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { useNotionDraftSystem } from '@/hooks/useNotionDraftSystem';
// import { useDebouncedUpdate } from '@/hooks/useDebouncedUpdate'; // 移除，直接使用 handleCellUpdate
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
import { subscribeToFieldDefinitions, updateFieldDefinitionByOrganization } from '@/services/firebase/fieldDefinitions';
import { FieldConfig as DynamicFieldConfig } from '@/types/fieldDefinitions';
import { useOrganization } from '@/hooks/useOrganization';
import { canEditCustomFieldDefinition } from '@/services/firebase/permissions';

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalMode, setCreateModalMode] = useState<'form' | 'csv'>('form');
  const [customColumns, setCustomColumns] = useState<Record<TabType, ColumnConfig[]>>({
    customers: [],
    records: [],
    tasks: [],
  });
  const [dynamicFields, setDynamicFields] = useState<Record<TabType, DynamicFieldConfig[]>>({
    customers: [],
    records: [],
    tasks: [],
  });
  
  const { user } = useAuthStore();
  const { currentOrganization } = useOrganization();
  const { customers, isLoading: customerLoading, fetchCustomers, subscribeToCustomers } = useCustomerStore();
  const { records, isLoading: recordLoading, fetchRecords } = useRecordStore();
  const { tasks, isLoading: taskLoading, fetchTasks } = useTaskStore();

  // 載入資料和訂閱即時更新
  useEffect(() => {
    console.log('🔄 DatabaseScreen useEffect - user:', user?.email || 'null');
    if (user) {
      console.log('📥 開始載入資料...');
      
      // 初始載入
      fetchCustomers(user);
      fetchRecords(user);
      fetchTasks(user);
      
      // 訂閱客戶資料即時更新
      console.log('📡 訂閱客戶資料即時更新');
      const unsubscribe = subscribeToCustomers(user);
      
      // 清理訂閱
      return () => {
        console.log('🔌 取消訂閱客戶資料');
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } else {
      console.log('⚠️ 沒有使用者，無法載入資料');
    }
  }, [user, fetchCustomers, fetchRecords, fetchTasks, subscribeToCustomers]);

  // 訂閱動態欄位定義
  useEffect(() => {
    if (!currentOrganization) return;
    
    console.log('📡 訂閱動態欄位定義');
    const unsubscribes: (() => void)[] = [];
    
    // 訂閱每個集合的欄位定義
    (['customers', 'records', 'tasks'] as TabType[]).forEach(collectionName => {
      const unsubscribe = subscribeToFieldDefinitions(
        collectionName,
        currentOrganization.id,
        (fields) => {
          console.log(`收到 ${collectionName} 欄位定義:`, fields);
          setDynamicFields(prev => ({ ...prev, [collectionName]: fields }));
        }
      );
      unsubscribes.push(unsubscribe);
    });
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentOrganization]);

  // 為每個標籤頁準備同步函數
  const handleSyncCustomer = useCallback(async (id: string, data: any, isNew: boolean) => {
    console.log('🔄 同步客戶:', { id, data, isNew });
    
    // 檢查是否為草稿 ID（即使 isNew 為 false）
    const isDraftId = id.startsWith('draft_');
    
    if (isNew || isDraftId) {
      // 檢查必填欄位
      if (!data.name || !data.company) {
        console.log('⚠️ 缺少必填欄位，暫不同步');
        throw new Error('缺少必填欄位：姓名和公司為必填'); // 拋出錯誤讓草稿系統知道同步失敗
      }
      
      // 新建客戶 - 移除草稿 ID
      const { id: draftId, ...customerData } = data;
      const newCustomer = await createCustomer({
        ...customerData,
        organizationId: user?.organizationId || '',
        createdBy: user?.uid || '',
      }, user?.uid || '');
      
      console.log('✅ 客戶創建成功，新 ID:', newCustomer.id);
      
      // 返回新的 ID，讓草稿系統可以更新
      return { newId: newCustomer.id };
    } else {
      // 更新現有客戶
      await updateCustomer(id, data);
      console.log('✅ 客戶更新成功');
    }
  }, [user]);

  const handleSyncRecord = useCallback(async (id: string, data: any, isNew: boolean) => {
    console.log('🔄 同步記錄:', { id, data, isNew });
    
    // 檢查是否為草稿 ID
    const isDraftId = id.startsWith('draft_');
    
    if (isNew || isDraftId) {
      // 檢查必填欄位
      if (!data.summary) {
        console.log('⚠️ 缺少必填欄位，暫不同步');
        throw new Error('缺少必填欄位：摘要為必填');
      }
      
      const { id: draftId, ...recordData } = data;
      const newRecord = await createRecord({
        ...recordData,
        organizationId: user?.organizationId || '',
        createdBy: user?.uid || '',
      }, user?.uid || '');
      console.log('✅ 記錄創建成功，新 ID:', newRecord.id);
      return { newId: newRecord.id };
    } else {
      await updateRecord(id, data);
      console.log('✅ 記錄更新成功');
    }
  }, [user]);

  const handleSyncTask = useCallback(async (id: string, data: any, isNew: boolean) => {
    console.log('🔄 同步任務:', { id, data, isNew });
    
    // 檢查是否為草稿 ID
    const isDraftId = id.startsWith('draft_');
    
    if (isNew || isDraftId) {
      // 檢查必填欄位
      if (!data.title) {
        console.log('⚠️ 缺少必填欄位，暫不同步');
        throw new Error('缺少必填欄位：標題為必填');
      }
      
      const { id: draftId, ...taskData } = data;
      const newTask = await createTask({
        ...taskData,
        organizationId: user?.organizationId || '',
        createdBy: user?.uid || '',
      }, user?.uid || '');
      console.log('✅ 任務創建成功，新 ID:', newTask.id);
      return { newId: newTask.id };
    } else {
      await updateTask(id, data);
      console.log('✅ 任務更新成功');
    }
  }, [user]);

  // 使用草稿系統 - 增加同步延遲時間
  const customerDraftSystem = useNotionDraftSystem({
    sourceData: customers,
    onSync: handleSyncCustomer,
    syncDelay: 3000  // 延長到 3 秒
  });

  const recordDraftSystem = useNotionDraftSystem({
    sourceData: records || [],
    onSync: handleSyncRecord,
    syncDelay: 3000  // 延長到 3 秒
  });

  const taskDraftSystem = useNotionDraftSystem({
    sourceData: tasks || [],
    onSync: handleSyncTask,
    syncDelay: 3000  // 延長到 3 秒
  });

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
  
  // 處理離開頁面前的提醒
  useEffect(() => {
    // 只在 Web 平台執行
    if (Platform.OS !== 'web') return;
    
    console.log('🎯 註冊 beforeunload 事件監聽器');
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('🚨 beforeunload 事件觸發！');
      
      // 檢查各個標籤的未同步草稿
      const customerUnsyncedDrafts = customerDraftSystem.getUnsyncedDrafts();
      const recordUnsyncedDrafts = recordDraftSystem.getUnsyncedDrafts();
      const taskUnsyncedDrafts = taskDraftSystem.getUnsyncedDrafts();
      
      console.log('📋 未同步的草稿數量:', {
        customers: customerUnsyncedDrafts.length,
        records: recordUnsyncedDrafts.length,
        tasks: taskUnsyncedDrafts.length,
        customerUnsyncedDrafts,
        recordUnsyncedDrafts,
        taskUnsyncedDrafts
      });
      
      const totalUnsyncedCount = 
        customerUnsyncedDrafts.length + 
        recordUnsyncedDrafts.length + 
        taskUnsyncedDrafts.length;
      
      if (totalUnsyncedCount > 0) {
        // 嘗試自動同步可以同步的項目
        const autoSyncDrafts = async () => {
          // 處理客戶草稿
          for (const draft of customerUnsyncedDrafts) {
            if (!customerDraftSystem.hasRequiredFieldsEmpty(draft, ['name', 'company'])) {
              await customerDraftSystem.syncItem(draft.id);
            } else {
              console.log('⚠️ 客戶草稿缺少必填欄位，無法自動同步:', draft.id);
            }
          }
          
          // 處理記錄草稿
          for (const draft of recordUnsyncedDrafts) {
            if (!recordDraftSystem.hasRequiredFieldsEmpty(draft, ['summary'])) {
              await recordDraftSystem.syncItem(draft.id);
            }
          }
          
          // 處理任務草稿
          for (const draft of taskUnsyncedDrafts) {
            if (!taskDraftSystem.hasRequiredFieldsEmpty(draft, ['title'])) {
              await taskDraftSystem.syncItem(draft.id);
            }
          }
        };
        
        // 檢查是否有必填欄位未填的草稿
        let hasInvalidDrafts = false;
        
        // 檢查客戶草稿
        customerUnsyncedDrafts.forEach(draft => {
          if (customerDraftSystem.hasRequiredFieldsEmpty(draft, ['name', 'company'])) {
            hasInvalidDrafts = true;
            console.log('⚠️ 客戶草稿缺少必填欄位:', draft);
          }
        });
        
        // 檢查記錄草稿
        recordUnsyncedDrafts.forEach(draft => {
          if (recordDraftSystem.hasRequiredFieldsEmpty(draft, ['summary'])) {
            hasInvalidDrafts = true;
            console.log('⚠️ 記錄草稿缺少必填欄位:', draft);
          }
        });
        
        // 檢查任務草稿
        taskUnsyncedDrafts.forEach(draft => {
          if (taskDraftSystem.hasRequiredFieldsEmpty(draft, ['title'])) {
            hasInvalidDrafts = true;
            console.log('⚠️ 任務草稿缺少必填欄位:', draft);
          }
        });
        
        // 設定瀏覽器提示
        const message = hasInvalidDrafts 
          ? '您有未填寫完整的草稿，離開將會遺失這些資料。確定要離開嗎？'
          : '您有未儲存的變更。系統將嘗試自動儲存，但建議您稍等片刻再離開。';
        
        e.preventDefault();
        e.returnValue = message;
        
        // 嘗試同步有效的草稿（在背景執行）
        setTimeout(() => {
          autoSyncDrafts();
        }, 0);
        
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [customerDraftSystem, recordDraftSystem, taskDraftSystem]);

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
    // 檢查當前標籤是否有未儲存的變更
    let hasUnsaved = false;
    switch (activeTab) {
      case 'customers':
        hasUnsaved = customerDraftSystem.hasUnsavedChanges;
        break;
      case 'records':
        hasUnsaved = recordDraftSystem.hasUnsavedChanges;
        break;
      case 'tasks':
        hasUnsaved = taskDraftSystem.hasUnsavedChanges;
        break;
    }
    
    if (hasUnsaved) {
      Alert.alert(
        '未儲存的變更',
        '您有未儲存的變更，切換標籤將會遺失這些變更。確定要繼續嗎？',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '儲存並切換',
            onPress: async () => {
              // 同步當前標籤的所有變更
              switch (activeTab) {
                case 'customers':
                  await customerDraftSystem.syncAll();
                  break;
                case 'records':
                  await recordDraftSystem.syncAll();
                  break;
                case 'tasks':
                  await taskDraftSystem.syncAll();
                  break;
              }
              setActiveTab(newTab);
              setMultiSelectMode(false);
              setSelectedItems([]);
            },
          },
          {
            text: '捨棄變更',
            style: 'destructive',
            onPress: () => {
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
  }, [activeTab, customerDraftSystem, recordDraftSystem, taskDraftSystem]);

  // 基礎欄位定義（可被自訂欄位擴展）
  // 將動態欄位轉換為表格欄位格式
  const baseColumns = useMemo(() => {
    const customerFields = dynamicFields.customers;
    const recordFields = dynamicFields.records;
    const taskFields = dynamicFields.tasks;
    
    // 如果還沒有載入動態欄位，使用預設欄位
    return {
      customers: customerFields.length > 0 ? customerFields.map(field => ({
        key: field.key,
        title: field.label,
        sortable: true,
        filterable: true,
        type: field.type as any,
        required: field.required || false,
        options: field.options?.map(opt => opt.value),
      })) : [
        { key: 'name', title: '客戶姓名', sortable: true, filterable: true, type: 'text' as const, required: true },
        { key: 'company', title: '公司名稱', sortable: true, filterable: true, type: 'text' as const, required: true },
        { key: 'email', title: '電子郵件', sortable: true, filterable: true, type: 'email' as const },
        { key: 'phone', title: '聯絡電話', sortable: true, filterable: true, type: 'phone' as const },
      ],
      records: recordFields.length > 0 ? recordFields.map(field => ({
        key: field.key,
        title: field.label,
        sortable: true,
        filterable: true,
        type: field.type as any,
        required: field.required || false,
        options: field.options?.map(opt => opt.value),
      })) : [
        { key: 'type', title: '類型', sortable: true, filterable: true, type: 'select' as const, 
          options: ['meeting', 'call'] },
        { key: 'customerName', title: '客戶', sortable: true, filterable: true, type: 'text' as const },
        { key: 'date', title: '日期', sortable: true, filterable: true, type: 'date' as const },
        { key: 'summary', title: '摘要', sortable: true, filterable: true, type: 'text' as const, required: true },
      ],
      tasks: taskFields.length > 0 ? taskFields.map(field => ({
        key: field.key,
        title: field.label,
        sortable: true,
        filterable: true,
        type: field.type as any,
        required: field.required || false,
        options: field.options?.map(opt => opt.value),
        // 特殊處理狀態欄位的渲染
        ...(field.key === 'status' ? {
          render: (value: any) => {
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
          }
        } : {}),
      })) : [
        { key: 'title', title: '任務標題', sortable: true, filterable: true, type: 'text' as const, required: true },
        { key: 'assignee', title: '負責人', sortable: true, filterable: true, type: 'text' as const },
        { key: 'dueDate', title: '到期日期', sortable: true, filterable: true, type: 'date' as const },
        { key: 'status', title: '狀態', sortable: true, filterable: true, type: 'select' as const,
          options: ['todo', 'in_progress', 'completed', 'cancelled'] },
      ],
    };
  }, [dynamicFields]);

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

  // 取得當前標籤的資料（從草稿系統）
  const currentData = useMemo(() => {
    console.log('📊 DatabaseScreen 資料狀態:', {
      activeTab,
      taskLoading,
      customerLoading,
      recordLoading,
    });
    
    switch (activeTab) {
      case 'customers':
        // 使用草稿系統的資料，已經包含了 Firebase 資料和本地修改
        const customerData = customerDraftSystem.draftData.map(c => ({
          ...c,
          tags: Array.isArray(c.tags) ? c.tags.join(', ') : c.tags || '-',
          ...customColumns.customers.reduce((acc, col) => ({
            ...acc,
            [col.id]: c[col.id] || col.defaultValue || '-'
          }), {})
        }));
        
        return {
          data: customerData,
          loading: customerLoading,
          syncStatus: customerDraftSystem.syncStatus,
        };
      case 'records':
        const recordData = recordDraftSystem.draftData.map(r => ({
          ...r,
          customerName: r.customerIds?.length > 0 ? '多位客戶' : '-',
          date: r.createdAt?.seconds 
            ? new Date(r.createdAt.seconds * 1000).toLocaleDateString('zh-TW') 
            : r.date || '-',
          summary: r.aiSummary || r.summary || '-',
          ...customColumns.records.reduce((acc, col) => ({
            ...acc,
            [col.id]: r[col.id] || col.defaultValue || '-'
          }), {})
        }));
        
        return {
          data: recordData,
          loading: recordLoading,
          syncStatus: recordDraftSystem.syncStatus,
        };
      case 'tasks':
        const taskData = taskDraftSystem.draftData.map(t => ({
          ...t,
          assignee: t.assigneeId || t.assignee || '-',
          dueDate: t.dueDate?.seconds 
            ? new Date(t.dueDate.seconds * 1000).toLocaleDateString('zh-TW')
            : t.dueDate || '-',
          status: t.status || 'todo',
          ...customColumns.tasks.reduce((acc, col) => ({
            ...acc,
            [col.id]: t[col.id] || col.defaultValue || '-'
          }), {})
        }));
        
        return {
          data: taskData,
          loading: taskLoading,
          syncStatus: taskDraftSystem.syncStatus,
        };
      default:
        return { data: [], loading: false, syncStatus: 'idle' };
    }
  }, [
    activeTab, 
    customerDraftSystem.draftData, 
    recordDraftSystem.draftData, 
    taskDraftSystem.draftData,
    customerDraftSystem.syncStatus,
    recordDraftSystem.syncStatus,
    taskDraftSystem.syncStatus,
    customerLoading, 
    recordLoading, 
    taskLoading, 
    customColumns
  ]);

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
    // 如果是草稿列，不導航到詳細頁面
    if (item.id && item.id.startsWith('draft_')) {
      console.log('👆 點擊了草稿列，不導航');
      return;
    }
    
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

  // 處理列編輯
  const handleRowEdit = useCallback((rowId: string) => {
    console.log('📝 編輯列:', rowId);
    switch (activeTab) {
      case 'customers':
        navigation.navigate('EditCustomer', { customerId: rowId });
        break;
      case 'records':
        navigation.navigate('EditRecord', { recordId: rowId });
        break;
      case 'tasks':
        navigation.navigate('EditTask', { taskId: rowId });
        break;
    }
  }, [activeTab, navigation]);

  // 處理列刪除
  const handleRowDelete = useCallback(async (rowId: string) => {
    console.log('🗑️ 刪除列:', rowId);
    try {
      switch (activeTab) {
        case 'customers':
          await useCustomerStore.getState().deleteCustomer(rowId);
          showToast('success', '客戶已刪除');
          break;
        case 'records':
          await useRecordStore.getState().deleteRecord(rowId);
          showToast('success', '記錄已刪除');
          break;
        case 'tasks':
          await useTaskStore.getState().deleteTask(rowId);
          showToast('success', '任務已刪除');
          break;
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      showToast('error', '刪除失敗，請稍後再試');
    }
  }, [activeTab]);

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

  const handleAddRow = useCallback(() => {
    console.log('🎯 DatabaseScreen handleAddRow 被調用', { activeTab });
    
    // 顯示內部的新增 Modal
    setShowCreateModal(true);
  }, [activeTab]);

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
    onImport: () => setShowImportModal(true),
    onExport: () => setShowExportOptions(true),
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

  const handleAddNew = useCallback(() => {
    handleAddRow();
  }, [handleAddRow]);

  const getHeaderTitle = (tab: TabType): string => {
    switch (tab) {
      case 'customers':
        return '客戶資料庫';
      case 'records':
        return '紀錄資料庫';
      case 'tasks':
        return '任務資料庫';
      default:
        return '資料庫';
    }
  };

  const isDesktop = isDesktopWeb();

  // 使用草稿系統的更新函數
  const handleCellUpdate = useCallback((rowId: string, columnKey: string, value: any) => {
    console.log('✏️ 更新儲存格:', { rowId, columnKey, value });
    
    // 根據當前標籤更新對應的草稿系統
    switch (activeTab) {
      case 'customers':
        customerDraftSystem.updateDraft(rowId, columnKey, value);
        // 立即檢查草稿狀態
        setTimeout(() => {
          const unsyncedDrafts = customerDraftSystem.getUnsyncedDrafts();
          console.log('📋 客戶更新後的未同步草稿數:', unsyncedDrafts.length, unsyncedDrafts);
          console.log('📋 hasUnsavedChanges:', customerDraftSystem.hasUnsavedChanges);
        }, 100);
        break;
      case 'records':
        recordDraftSystem.updateDraft(rowId, columnKey, value);
        setTimeout(() => {
          const unsyncedDrafts = recordDraftSystem.getUnsyncedDrafts();
          console.log('📋 記錄更新後的未同步草稿數:', unsyncedDrafts.length, unsyncedDrafts);
        }, 100);
        break;
      case 'tasks':
        taskDraftSystem.updateDraft(rowId, columnKey, value);
        setTimeout(() => {
          const unsyncedDrafts = taskDraftSystem.getUnsyncedDrafts();
          console.log('📋 任務更新後的未同步草稿數:', unsyncedDrafts.length, unsyncedDrafts);
        }, 100);
        break;
    }
  }, [activeTab, customerDraftSystem, recordDraftSystem, taskDraftSystem]);

  // 移除 debounced update，直接使用 handleCellUpdate
  // 因為 draft system 內部已經有 debounce 機制
  // const { debouncedUpdate } = useDebouncedUpdate(handleCellUpdate, 500);

  // 偵錯資訊：檢查平台偵測
  console.log('🔍 DatabaseScreen 平台偵測:', {
    Platform: Platform.OS,
    isDesktop,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    windowSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'
  });

  // 使用新的 NotionTable 元件
  console.log('🔍 使用新的 NotionTable 元件');

  // 記憶化 NotionTable 的 columns，避免每次都創建新陣列導致重新渲染
  const notionColumns = useMemo(() => {
    return currentColumns.map(col => ({
      id: col.key,
      key: col.key,
      title: col.title,
      type: col.type as any,
      width: col.width,
      editable: col.editable !== false,
      options: col.options,
      required: col.required || false,
    }));
  }, [currentColumns]);

  // 記憶化回調函數
  const handleColumnReorder = useCallback(async (updatedColumns) => {
    console.log('欄位順序或寬度更新:', updatedColumns);
    // TODO: 保存欄位順序和寬度到資料庫
    // 暫時只在控制台顯示
    const columnWidths = updatedColumns.reduce((acc, col) => {
      acc[col.id] = col.width;
      return acc;
    }, {} as Record<string, number>);
    console.log('儲存欄位寬度:', columnWidths);
  }, []);

  const handleCellUpdateCallback = useCallback((rowId, columnKey, value) => {
    console.log('更新儲存格:', { rowId, columnKey, value, activeTab });
    // 直接調用 handleCellUpdate，不使用 debouncedUpdate
    handleCellUpdate(rowId, columnKey, value);
  }, [activeTab, handleCellUpdate]);

  const handleColumnAdd = useCallback(() => {
    setShowAddColumnDialog(true);
  }, []);

  // 處理欄位更新
  const handleFieldUpdate = useCallback(async (
    fieldKey: string,
    updates: Partial<DynamicFieldConfig>
  ) => {
    if (!user || !currentOrganization) {
      showToast('error', '無法獲取用戶資訊');
      return;
    }

    try {
      // 權限檢查 - 使用簡化的權限檢查
      const hasPermission = await canEditCustomFieldDefinition(
        user.uid,
        user.uid, // 創建者通常是當前用戶
        undefined // 權限物件
      );
      
      if (!hasPermission) {
        showToast('error', '您沒有權限修改欄位定義');
        return;
      }
      
      // 獲取當前欄位定義
      const currentFields = dynamicFields[activeTab];
      const updatedFields = currentFields.map(field =>
        field.key === fieldKey ? { ...field, ...updates } : field
      );
      
      // 更新到 Firebase
      await updateFieldDefinitionByOrganization(
        activeTab,
        currentOrganization.id,
        updatedFields,
        user.uid,
        `更新欄位 ${fieldKey}`
      );
      
      showToast('success', '欄位更新成功');
    } catch (error) {
      console.error('欄位更新失敗:', error);
      showToast('error', '欄位更新失敗，請稍後再試');
    }
  }, [activeTab, dynamicFields, user, currentOrganization]);

  // 測試函數 - 手動檢查未同步草稿
  const testUnsyncedDrafts = () => {
    console.log('🧪 測試未同步草稿狀態');
    const customerUnsyncedDrafts = customerDraftSystem.getUnsyncedDrafts();
    const recordUnsyncedDrafts = recordDraftSystem.getUnsyncedDrafts();
    const taskUnsyncedDrafts = taskDraftSystem.getUnsyncedDrafts();
    
    console.log('📊 測試結果:', {
      客戶未同步: customerUnsyncedDrafts.length,
      記錄未同步: recordUnsyncedDrafts.length,
      任務未同步: taskUnsyncedDrafts.length,
      客戶詳細: customerUnsyncedDrafts,
      記錄詳細: recordUnsyncedDrafts,
      任務詳細: taskUnsyncedDrafts
    });
  };

  const renderContent = () => {
    // 已移除 getCurrentSyncStatus - 唯讀模式不需要同步狀態

    // 使用有完整功能的 NotionTable
    return (
      <View style={styles.fullScreenContainer}>
        {/* 已移除同步狀態指示器和測試按鈕 - 唯讀模式不需要 */}
        <NotionTable
          data={currentData.data}
          columns={notionColumns}
          onRowClick={handleRowPress}
          onRowAdd={handleAddRow}
          onRowEdit={handleRowEdit}
          onRowDelete={handleRowDelete}
          onColumnAdd={handleColumnAdd}
          onColumnReorder={handleColumnReorder}
          onFieldUpdate={handleFieldUpdate}
          multiSelect={multiSelectMode}
          selectedRows={selectedItems}
          onSelectionChange={setSelectedItems}
          loading={currentData.loading}
          emptyMessage="沒有資料，點擊新增列開始"
          activeTab={activeTab}
        />
        
        {/* CSV 匯入 Modal */}
        {showImportModal && (
          <Modal
            visible={showImportModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowImportModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>匯入 CSV 檔案</Text>
                  <TouchableOpacity
                    onPress={() => setShowImportModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Icon name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <CSVUploader
                  dataType={activeTab === 'customers' ? 'customer' : activeTab === 'records' ? 'record' : 'task'}
                  onComplete={(items) => {
                    console.log('CSV 匯入完成:', items.length, '筆資料');
                    setShowImportModal(false);
                    showToast('success', `成功匯入 ${items.length} 筆資料`);
                    // 重新載入資料
                    switch (activeTab) {
                      case 'customers':
                        fetchCustomers(user!);
                        break;
                      case 'records':
                        fetchRecords(user!);
                        break;
                      case 'tasks':
                        fetchTasks(user!);
                        break;
                    }
                  }}
                  onError={(error) => {
                    console.error('CSV 匯入錯誤:', error);
                    showToast('error', `匯入失敗: ${error.message}`);
                  }}
                />
              </View>
            </View>
          </Modal>
        )}
        
        {/* 匯出選項 Modal */}
        {showExportOptions && (
          <Modal
            visible={showExportOptions}
            transparent
            animationType="fade"
            onRequestClose={() => setShowExportOptions(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>匯出資料</Text>
                  <TouchableOpacity
                    onPress={() => setShowExportOptions(false)}
                    style={styles.modalCloseButton}
                  >
                    <Icon name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ExportOptions
                  data={currentData.data}
                  columns={currentColumns}
                  fileName={`${activeTab}_export_${new Date().toISOString().split('T')[0]}`}
                  onExport={(format) => {
                    console.log('匯出格式:', format);
                    setShowExportOptions(false);
                    showToast('success', `資料已匯出為 ${format.toUpperCase()} 格式`);
                  }}
                />
              </View>
            </View>
          </Modal>
        )}
        
        {/* 新增資料 Modal */}
        {showCreateModal && Platform.OS === 'web' && (
          <Modal
            visible={showCreateModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCreateModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { maxHeight: '90%', overflow: 'hidden' }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {activeTab === 'customers' ? '新增客戶' : 
                     activeTab === 'records' ? '新增紀錄' : '新增任務'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowCreateModal(false);
                      setCreateModalMode('form'); // 重置為表單模式
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Icon name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                {/* 模式切換 */}
                <View style={styles.modalModeSwitch}>
                  <TouchableOpacity
                    style={[
                      styles.modeSwitchButton,
                      createModalMode === 'form' && styles.modeSwitchButtonActive
                    ]}
                    onPress={() => setCreateModalMode('form')}
                  >
                    <Icon name="create-outline" size={20} color={createModalMode === 'form' ? '#2196F3' : '#666'} />
                    <Text style={[
                      styles.modeSwitchText,
                      createModalMode === 'form' && styles.modeSwitchTextActive
                    ]}>
                      單筆新增
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.modeSwitchButton,
                      createModalMode === 'csv' && styles.modeSwitchButtonActive
                    ]}
                    onPress={() => setCreateModalMode('csv')}
                  >
                    <Icon name="cloud-upload-outline" size={20} color={createModalMode === 'csv' ? '#2196F3' : '#666'} />
                    <Text style={[
                      styles.modeSwitchText,
                      createModalMode === 'csv' && styles.modeSwitchTextActive
                    ]}>
                      批量匯入
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* 內容區域 */}
                <ScrollView 
                  style={[styles.modalScrollContent, { flex: 1 }]} 
                  contentContainerStyle={{ padding: 20 }}
                  showsVerticalScrollIndicator={false}
                >
                  {activeTab === 'customers' && createModalMode === 'form' && (
                    <View style={{ width: '100%', maxWidth: 400 }}>
                      {dynamicFields.customers.length > 0 ? (
                        <DynamicFormBuilder
                          fields={dynamicFields.customers}
                          onSubmit={async (formData) => {
                            try {
                              // 準備客戶數據
                              const customerData: any = {
                                // 基本必填欄位
                                name: formData.name || '',
                                company: formData.company || '',
                                // 系統欄位
                                assignedTo: user!.uid,
                                teamId: currentTeam?.id || '',
                                organizationId: currentOrganization?.id || '',
                              };
                              
                              // 處理動態欄位
                              dynamicFields.customers.forEach(field => {
                                if (field.key in formData) {
                                  // 根據欄位類型處理值
                                  if (field.type === 'tags' || field.type === 'multiselect') {
                                    customerData[field.key] = formData[field.key] || [];
                                  } else if (formData[field.key] !== '' && formData[field.key] !== null && formData[field.key] !== undefined) {
                                    customerData[field.key] = formData[field.key];
                                  }
                                }
                              });

                              await createCustomer(customerData, user!.uid);
                              showToast('success', '客戶新增成功');
                              setShowCreateModal(false);
                              setCreateModalMode('form'); // 重置模式
                              // 重新載入資料
                              fetchCustomers(user!);
                            } catch (error) {
                              console.error('新增客戶失敗:', error);
                              showToast('error', '新增失敗，請稍後再試');
                              throw error; // 讓 DynamicFormBuilder 知道提交失敗
                            }
                          }}
                          mode="create"
                        />
                      ) : (
                        <View style={styles.loadingContainer}>
                          <LoadingSpinner size="large" />
                          <Text style={styles.loadingText}>載入欄位定義中...</Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {activeTab === 'customers' && createModalMode === 'csv' && (
                    <View style={{ width: '100%' }}>
                      <CSVUploader
                        dataType="customer"
                        onComplete={(items) => {
                          console.log('CSV 匯入完成:', items.length, '筆資料');
                          setShowCreateModal(false);
                          setCreateModalMode('form'); // 重置模式
                          showToast('success', `成功匯入 ${items.length} 筆客戶資料`);
                          // 重新載入資料
                          fetchCustomers(user!);
                        }}
                        onError={(error) => {
                          console.error('CSV 匯入錯誤:', error);
                          showToast('error', `匯入失敗: ${error.message}`);
                        }}
                      />
                    </View>
                  )}
                  
                  {/* TODO: 加入 Records 和 Tasks 的表單/CSV 上傳 */}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  // 根據平台渲染
  // Web 平台直接渲染內容，不使用 Layout
  if (Platform.OS === 'web') {
    return renderContent();
  }

  // 使用 Layout 包裹內容
  return (
    <Layout 
      headerProps={{
        title: getHeaderTitle(activeTab),
        showBackButton: false,
        rightComponent: (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {activeTab !== 'templates' && (
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgb(46, 170, 220)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  height: 30,
                  justifyContent: 'center',
                }}
                onPress={handleAddNew}
              >
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>新建</Text>
              </TouchableOpacity>
            )}
          </View>
        ),
      }}
      scrollable={false}
    >
      {renderContent()}
    </Layout>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    width: '100%',
    height: '100vh',
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: {
        backgroundColor: '#fbfbfa', // Notion 背景色
      },
    }),
  },
  // syncStatusContainer 已移除 - 唯讀模式不需要
  databaseContainer: {
    flex: 1,
    padding: '0 96px',
  },
  pageHeader: {
    paddingTop: 40,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: '#37352f',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
    marginBottom: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    cursor: 'pointer',
  },
  activeTab: {
    borderBottom: '2px solid #2383e2',
  },
  tabText: {
    fontSize: 14,
    color: '#787774',
  },
  activeTabText: {
    color: '#37352f',
    fontWeight: '500',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  toolbarLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  toolbarRight: {
    flexDirection: 'row',
    gap: 8,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
    cursor: 'pointer',
  },
  toolButtonText: {
    fontSize: 14,
    color: '#787774',
  },
  primaryButton: {
    backgroundColor: '#2383e2',
  },
  primaryButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
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
  
  // Modal 樣式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 480,
    maxHeight: '85%',
    display: 'flex',
    flexDirection: 'column',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollContent: {
    flex: 1,
  },
  
  // 模式切換樣式
  modalModeSwitch: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 15,
  },
  modeSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  modeSwitchButtonActive: {
    backgroundColor: '#e3f2fd',
  },
  modeSwitchText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modeSwitchTextActive: {
    color: '#2196F3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7A7A7A',
  },
});