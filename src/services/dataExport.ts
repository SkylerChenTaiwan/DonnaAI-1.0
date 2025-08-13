/**
 * 資料匯出服務
 * 收集並匯出使用者所有資料
 */

import { exportTableData, ExportFormat } from '@/utils/tableExport';
import { getCustomersOptimized } from './firebase/customers-v2';
import { getTasksOptimized } from './firebase/tasks-v2';
import { getRecordsOptimized } from './firebase/records-v2';
import { getUserPermissionContext } from './firebase/permissions-v2';
import { TableColumn, TableData } from '@/types/table';
import { CustomerDoc } from '@/types/customer';
import { TaskDoc } from '@/types/task';
import { RecordDoc } from '@/types/record';
import { Alert } from 'react-native';

interface DataExportOptions {
  format: ExportFormat;
  dataTypes: ('customers' | 'tasks' | 'meetings' | 'all')[];
  email?: string;
}

/**
 * 客戶資料的表格欄位定義
 */
const customerColumns: TableColumn[] = [
  { key: 'name', title: '客戶名稱', sortable: true },
  { key: 'company', title: '公司', sortable: true },
  { key: 'email', title: '電子郵件', sortable: true },
  { key: 'phone', title: '電話', sortable: true },
  { key: 'tags', title: '標籤', sortable: false },
  { key: 'lastContactDate', title: '最後聯絡日期', sortable: true },
  { key: 'nextFollowUpDate', title: '下次跟進日期', sortable: true },
  { key: 'notes', title: '備註', sortable: false },
  { key: 'createdAt', title: '建立時間', sortable: true },
];

/**
 * 任務資料的表格欄位定義
 */
const taskColumns: TableColumn[] = [
  { key: 'title', title: '任務標題', sortable: true },
  { key: 'description', title: '描述', sortable: false },
  { key: 'type', title: '類型', sortable: true },
  { key: 'priority', title: '優先級', sortable: true },
  { key: 'status', title: '狀態', sortable: true },
  { key: 'customerNames', title: '相關客戶', sortable: false },
  { key: 'scheduledAt', title: '排程時間', sortable: true },
  { key: 'dueDate', title: '截止日期', sortable: true },
  { key: 'completedAt', title: '完成時間', sortable: true },
  { key: 'tags', title: '標籤', sortable: false },
  { key: 'createdAt', title: '建立時間', sortable: true },
];

/**
 * 會議記錄的表格欄位定義
 */
const meetingColumns: TableColumn[] = [
  { key: 'title', title: '會議標題', sortable: true },
  { key: 'type', title: '類型', sortable: true },
  { key: 'status', title: '狀態', sortable: true },
  { key: 'customerNames', title: '參與客戶', sortable: false },
  { key: 'scheduledAt', title: '會議時間', sortable: true },
  { key: 'duration', title: '時長（分鐘）', sortable: true },
  { key: 'location', title: '地點', sortable: false },
  { key: 'content', title: '內容摘要', sortable: false },
  { key: 'aiSummary', title: 'AI 摘要', sortable: false },
  { key: 'createdAt', title: '建立時間', sortable: true },
];

/**
 * 轉換客戶資料為表格格式
 */
const transformCustomersToTableData = (customers: CustomerDoc[]): TableData[] => {
  return customers.map(customer => ({
    id: customer.id,
    name: customer.name || '',
    company: customer.company || '',
    email: customer.email || '',
    phone: customer.phone || '',
    tags: customer.tags?.join(', ') || '',
    lastContactDate: customer.lastContactDate ? 
      new Date(customer.lastContactDate).toLocaleDateString('zh-TW') : '',
    nextFollowUpDate: customer.nextFollowUpDate ? 
      new Date(customer.nextFollowUpDate).toLocaleDateString('zh-TW') : '',
    notes: customer.notes || '',
    createdAt: customer.createdAt ? 
      new Date(customer.createdAt).toLocaleDateString('zh-TW') : '' }));
};

/**
 * 轉換任務資料為表格格式
 */
const transformTasksToTableData = (
  tasks: TaskDoc[], 
  customersMap: Map<string, string>
): TableData[] => {
  return tasks.map(task => ({
    id: task.id,
    title: task.title || '',
    description: task.description || '',
    type: translateTaskType(task.type),
    priority: translatePriority(task.priority),
    status: translateTaskStatus(task.status),
    customerNames: task.customerIds?.map(id => customersMap.get(id) || id).join(', ') || '',
    scheduledAt: task.scheduledAt ? 
      new Date(task.scheduledAt).toLocaleDateString('zh-TW') : '',
    dueDate: task.dueDate ? 
      new Date(task.dueDate).toLocaleDateString('zh-TW') : '',
    completedAt: task.completedAt ? 
      new Date(task.completedAt).toLocaleDateString('zh-TW') : '',
    tags: task.tags?.join(', ') || '',
    createdAt: task.createdAt ? 
      new Date(task.createdAt).toLocaleDateString('zh-TW') : '' }));
};

/**
 * 轉換會議記錄為表格格式
 */
const transformMeetingsToTableData = (
  meetings: RecordDoc[], 
  customersMap: Map<string, string>
): TableData[] => {
  return meetings
    .filter(record => record.type === 'meeting')
    .map(meeting => ({
      id: meeting.id,
      title: meeting.title || '',
      type: translateRecordType(meeting.type),
      status: translateRecordStatus(meeting.status),
      customerNames: meeting.customerIds?.map(id => customersMap.get(id) || id).join(', ') || '',
      scheduledAt: meeting.scheduledAt ? 
        new Date(meeting.scheduledAt).toLocaleString('zh-TW') : '',
      duration: meeting.duration || 0,
      location: meeting.location || '',
      content: meeting.content || '',
      aiSummary: meeting.aiSummary?.summary || '',
      createdAt: meeting.createdAt ? 
        new Date(meeting.createdAt).toLocaleDateString('zh-TW') : '' }));
};

/**
 * 類型翻譯函數
 */
const translateTaskType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'contact': '聯絡',
    'followup': '跟進',
    'appointment': '預約',
    'document': '文件',
    'other': '其他' };
  return typeMap[type] || type;
};

const translatePriority = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'urgent': '緊急',
    'high': '高',
    'medium': '中',
    'low': '低' };
  return priorityMap[priority] || priority;
};

const translateTaskStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '待處理',
    'in_progress': '進行中',
    'completed': '已完成',
    'cancelled': '已取消' };
  return statusMap[status] || status;
};

const translateRecordType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'meeting': '會議',
    'call': '電話',
    'note': '筆記',
    'other': '其他' };
  return typeMap[type] || type;
};

const translateRecordStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '待處理',
    'processing': '處理中',
    'completed': '已完成',
    'failed': '失敗' };
  return statusMap[status] || status;
};

/**
 * 匯出使用者資料
 */
export const exportUserData = async (options: DataExportOptions): Promise<void> => {
  try {
    // 獲取權限上下文
    const permissionContext = await getUserPermissionContext();
    if (!permissionContext) {
      throw new Error('無法獲取使用者權限');
    }

    const exportData: {
      type: string;
      data: TableData[];
      columns: TableColumn[];
    }[] = [];

    // 建立客戶名稱對照表（用於顯示關聯的客戶名稱）
    let customersMap = new Map<string, string>();
    
    // 根據選擇的資料類型收集資料
    if (options.dataTypes.includes('all') || options.dataTypes.includes('customers')) {
      const customers = await getCustomersOptimized({}, permissionContext);
      customersMap = new Map(customers.map(c => [c.id, c.name || c.company || 'Unknown']));
      
      exportData.push({
        type: '客戶資料',
        data: transformCustomersToTableData(customers),
        columns: customerColumns });
    }

    if (options.dataTypes.includes('all') || options.dataTypes.includes('tasks')) {
      // 如果還沒有客戶資料，先載入以獲得名稱對照
      if (customersMap.size === 0) {
        const customers = await getCustomersOptimized({}, permissionContext);
        customersMap = new Map(customers.map(c => [c.id, c.name || c.company || 'Unknown']));
      }
      
      const tasks = await getTasksOptimized({}, permissionContext);
      exportData.push({
        type: '任務資料',
        data: transformTasksToTableData(tasks, customersMap),
        columns: taskColumns });
    }

    if (options.dataTypes.includes('all') || options.dataTypes.includes('meetings')) {
      // 如果還沒有客戶資料，先載入以獲得名稱對照
      if (customersMap.size === 0) {
        const customers = await getCustomersOptimized({}, permissionContext);
        customersMap = new Map(customers.map(c => [c.id, c.name || c.company || 'Unknown']));
      }
      
      const records = await getRecordsOptimized({ type: 'meeting' }, permissionContext);
      exportData.push({
        type: '會議記錄',
        data: transformMeetingsToTableData(records, customersMap),
        columns: meetingColumns });
    }

    // 檢查是否有資料
    if (exportData.length === 0 || exportData.every(d => d.data.length === 0)) {
      Alert.alert('沒有資料', '目前沒有可匯出的資料', [{ text: '確定' }]);
      return;
    }

    // 根據格式匯出資料
    if (options.format === 'json') {
      // JSON 格式：將所有資料組合成一個物件
      const combinedData: Record<string, any> = {
        exportDate: new Date().toISOString(),
        organization: permissionContext.organizationId,
        user: permissionContext.userId };

      exportData.forEach(({ type, data }) => {
        combinedData[type] = data;
      });

      // 使用 tableExport 工具匯出（需要稍微調整格式）
      await exportTableData(
        [combinedData], // 包裝成陣列
        [{ key: 'data', title: 'Exported Data', sortable: false }], // 簡單的欄位定義
        {
          format: 'json',
          filename: `donna_ai_export_${new Date().toISOString().split('T')[0]}`,
          email: options.email }
      );
    } else {
      // CSV 格式：分別匯出每種資料類型
      for (const { type, data, columns } of exportData) {
        if (data.length > 0) {
          await exportTableData(
            data,
            columns,
            {
              format: 'csv',
              includeHeaders: true,
              filename: `${type}_${new Date().toISOString().split('T')[0]}`,
              email: options.email }
          );
        }
      }
    }

    Alert.alert(
      '匯出成功',
      options.format === 'csv' ? 
        `已匯出 ${exportData.filter(d => d.data.length > 0).length} 個 CSV 檔案` :
        '已匯出 JSON 檔案',
      [{ text: '確定' }]
    );
  } catch (error) {
    console.error('匯出資料失敗:', error);
    Alert.alert(
      '匯出失敗',
      error instanceof Error ? error.message : '發生未知錯誤',
      [{ text: '確定' }]
    );
  }
};

/**
 * 預估匯出檔案大小
 */
export const estimateExportSize = async (
  dataTypes: ('customers' | 'tasks' | 'meetings' | 'all')[],
  format: ExportFormat
): Promise<string> => {
  try {
    const permissionContext = await getUserPermissionContext();
    if (!permissionContext) {
      return '無法估算';
    }

    let totalSize = 0;
    let recordCount = 0;

    if (dataTypes.includes('all') || dataTypes.includes('customers')) {
      const customers = await getCustomersOptimized({}, permissionContext);
      recordCount += customers.length;
      // 粗略估算每筆記錄的大小
      totalSize += customers.length * (format === 'csv' ? 200 : 500); // CSV 較小，JSON 較大
    }

    if (dataTypes.includes('all') || dataTypes.includes('tasks')) {
      const tasks = await getTasksOptimized({}, permissionContext);
      recordCount += tasks.length;
      totalSize += tasks.length * (format === 'csv' ? 250 : 600);
    }

    if (dataTypes.includes('all') || dataTypes.includes('meetings')) {
      const records = await getRecordsOptimized({ type: 'meeting' }, permissionContext);
      recordCount += records.length;
      totalSize += records.length * (format === 'csv' ? 300 : 800);
    }

    // 加上標題和格式開銷
    totalSize += format === 'csv' ? 1000 : 2000;

    // 格式化檔案大小
    if (totalSize < 1024) {
      return `約 ${totalSize} B (${recordCount} 筆記錄)`;
    } else if (totalSize < 1024 * 1024) {
      return `約 ${(totalSize / 1024).toFixed(1)} KB (${recordCount} 筆記錄)`;
    } else {
      return `約 ${(totalSize / (1024 * 1024)).toFixed(1)} MB (${recordCount} 筆記錄)`;
    }
  } catch (error) {
    console.error('估算檔案大小失敗:', error);
    return '無法估算';
  }
};