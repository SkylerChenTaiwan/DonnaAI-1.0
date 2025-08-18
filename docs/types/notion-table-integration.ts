/**
 * @fileoverview NotionTable 元件與主專案的型別整合範例
 * @description 展示如何將新的型別系統與現有的 DonnaAI 專案整合
 */

import type {
  TableColumn,
  TableRow,
  NotionTableProps,
  TableEditState,
  CellType,
  TableId,
  UserId,
  OrganizationId,
} from './component-library-types';

// 假設這些是從主專案匯入的現有型別
// import { Personnel } from '@/src/types/personnel';
// import { CustomField } from '@/src/types/custom-fields';

// ============================================================================
// DonnaAI 特定的 NotionTable 擴展
// ============================================================================

/**
 * 人員管理表格的資料型別
 */
export interface PersonnelTableData {
  id: string;
  userId: UserId;
  organizationId: OrganizationId;
  name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  salary: number;
  hireDate: Date;
  status: 'active' | 'inactive' | 'on-leave';
  customFields?: Record<string, any>;
  tags?: string[];
  avatar?: string;
  metadata?: {
    lastModified: Date;
    modifiedBy: UserId;
    version: number;
  };
}

/**
 * 自訂欄位的型別定義（與現有系統整合）
 */
export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CellType;
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ value: string; label: string; color?: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: (value: any) => boolean | string;
  };
  visibility?: {
    roles?: string[];
    conditions?: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    }>;
  };
}

/**
 * 擴展的 NotionTable 列定義，支援 DonnaAI 特定功能
 */
export interface DonnaTableColumn<T = any> extends TableColumn<T> {
  // AI 輔助功能
  aiAssisted?: {
    autoComplete?: boolean;
    suggestions?: boolean;
    validation?: boolean;
    dataExtraction?: boolean;
  };
  
  // 權限控制
  permissions?: {
    view?: string[];
    edit?: string[];
    delete?: string[];
  };
  
  // 資料來源綁定
  dataSource?: {
    type: 'api' | 'database' | 'computed' | 'relation';
    endpoint?: string;
    query?: string;
    refreshInterval?: number;
  };
  
  // 進階格式化
  formatting?: {
    numberFormat?: 'currency' | 'percentage' | 'decimal' | 'scientific';
    dateFormat?: string;
    textTransform?: 'uppercase' | 'lowercase' | 'capitalize';
    colorMapping?: Record<string, string>;
  };
  
  // 統計功能
  aggregation?: {
    type: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median' | 'custom';
    customFunction?: (values: any[]) => any;
    showInFooter?: boolean;
  };
}

/**
 * 人員管理表格的完整配置
 */
export const personnelTableColumns: DonnaTableColumn<PersonnelTableData>[] = [
  {
    id: 'avatar',
    name: '',
    type: 'url',
    width: 50,
    isResizable: false,
    isEditable: false,
    render: (value, row) => (
      `<img src="${value || '/default-avatar.png'}" alt="${row.name}" class="avatar" />`
    ),
  },
  {
    id: 'name',
    name: '姓名',
    type: 'text',
    isSortable: true,
    isFilterable: true,
    isEditable: true,
    validation: {
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    aiAssisted: {
      autoComplete: true,
      suggestions: true,
    },
    permissions: {
      view: ['all'],
      edit: ['admin', 'hr'],
    },
  },
  {
    id: 'email',
    name: '電子郵件',
    type: 'email',
    isSortable: true,
    isFilterable: true,
    isEditable: true,
    validation: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    aiAssisted: {
      validation: true,
    },
  },
  {
    id: 'department',
    name: '部門',
    type: 'select',
    isFilterable: true,
    isEditable: true,
    options: [
      { value: 'engineering', label: '工程部' },
      { value: 'design', label: '設計部' },
      { value: 'marketing', label: '市場部' },
      { value: 'sales', label: '業務部' },
      { value: 'hr', label: '人力資源部' },
      { value: 'finance', label: '財務部' },
    ],
    dataSource: {
      type: 'api',
      endpoint: '/api/departments',
      refreshInterval: 3600000, // 1 hour
    },
  },
  {
    id: 'position',
    name: '職位',
    type: 'text',
    isFilterable: true,
    isEditable: true,
    aiAssisted: {
      autoComplete: true,
      suggestions: true,
    },
  },
  {
    id: 'salary',
    name: '薪資',
    type: 'number',
    isSortable: true,
    isEditable: true,
    validation: {
      min: 0,
      max: 10000000,
    },
    formatting: {
      numberFormat: 'currency',
    },
    permissions: {
      view: ['admin', 'hr', 'finance'],
      edit: ['admin', 'hr'],
    },
    aggregation: {
      type: 'avg',
      showInFooter: true,
    },
  },
  {
    id: 'hireDate',
    name: '入職日期',
    type: 'date',
    isSortable: true,
    isFilterable: true,
    isEditable: true,
    formatting: {
      dateFormat: 'YYYY-MM-DD',
    },
  },
  {
    id: 'status',
    name: '狀態',
    type: 'select',
    isFilterable: true,
    isEditable: true,
    options: [
      { value: 'active', label: '在職', color: 'green' },
      { value: 'inactive', label: '離職', color: 'gray' },
      { value: 'on-leave', label: '請假中', color: 'yellow' },
    ],
    formatting: {
      colorMapping: {
        'active': '#10b981',
        'inactive': '#6b7280',
        'on-leave': '#f59e0b',
      },
    },
    render: (value, row, column) => {
      const option = column.options?.find(o => o.value === value);
      const color = column.formatting?.colorMapping?.[value] || '#000';
      return `<span style="color: ${color}; font-weight: 500;">${option?.label || value}</span>`;
    },
  },
  {
    id: 'tags',
    name: '標籤',
    type: 'multiselect',
    isFilterable: true,
    isEditable: true,
    options: [
      { value: 'remote', label: '遠端工作' },
      { value: 'full-time', label: '全職' },
      { value: 'part-time', label: '兼職' },
      { value: 'contractor', label: '約聘' },
      { value: 'intern', label: '實習生' },
    ],
    render: (value: string[], row) => {
      if (!value || value.length === 0) return '';
      return value.map(tag => `<span class="tag">${tag}</span>`).join(' ');
    },
  },
];

/**
 * NotionTable 的進階功能配置
 */
export interface DonnaTableFeatures {
  // AI 功能
  ai?: {
    enabled: boolean;
    features?: {
      smartFilter?: boolean;
      autoSort?: boolean;
      dataInsights?: boolean;
      anomalyDetection?: boolean;
      predictiveText?: boolean;
    };
  };
  
  // 批次操作
  bulkActions?: {
    enabled: boolean;
    actions?: Array<{
      id: string;
      label: string;
      icon?: string;
      action: (selectedRows: any[]) => void | Promise<void>;
      confirmRequired?: boolean;
      permissions?: string[];
    }>;
  };
  
  // 匯入匯出
  importExport?: {
    import?: {
      enabled: boolean;
      formats?: ('csv' | 'excel' | 'json')[];
      mapping?: boolean;
      validation?: boolean;
    };
    export?: {
      enabled: boolean;
      formats?: ('csv' | 'excel' | 'json' | 'pdf')[];
      customFileName?: (date: Date) => string;
    };
  };
  
  // 版本控制
  versioning?: {
    enabled: boolean;
    trackChanges?: boolean;
    showHistory?: boolean;
    allowRevert?: boolean;
    maxVersions?: number;
  };
  
  // 協作功能
  collaboration?: {
    enabled: boolean;
    realtime?: boolean;
    showActiveUsers?: boolean;
    lockOnEdit?: boolean;
    comments?: boolean;
  };
}

/**
 * 完整的 DonnaAI NotionTable 元件 Props
 */
export interface DonnaNotionTableProps<T = any> extends NotionTableProps<T> {
  // 組織和用戶資訊
  organizationId: OrganizationId;
  userId: UserId;
  
  // 自訂欄位
  customFields?: CustomFieldDefinition[];
  onCustomFieldAdd?: (field: CustomFieldDefinition) => void;
  onCustomFieldEdit?: (fieldId: string, field: CustomFieldDefinition) => void;
  onCustomFieldDelete?: (fieldId: string) => void;
  
  // 進階功能
  features?: DonnaTableFeatures;
  
  // 資料同步
  syncConfig?: {
    autoSync?: boolean;
    syncInterval?: number;
    conflictResolution?: 'local' | 'remote' | 'merge' | 'manual';
    onSyncError?: (error: Error) => void;
  };
  
  // 效能優化
  performance?: {
    virtualScroll?: boolean;
    lazyLoad?: boolean;
    debounceSearch?: number;
    throttleScroll?: number;
    cacheSize?: number;
  };
  
  // 分析和追蹤
  analytics?: {
    trackInteractions?: boolean;
    trackPerformance?: boolean;
    customEvents?: Record<string, (data: any) => void>;
  };
}

// ============================================================================
// 使用範例
// ============================================================================

/**
 * 人員管理表格元件範例
 */
export const PersonnelTableExample: React.FC = () => {
  const [data, setData] = useState<PersonnelTableData[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  
  const tableProps: DonnaNotionTableProps<PersonnelTableData> = {
    tableId: 'table_personnel' as TableId,
    organizationId: 'org_123' as OrganizationId,
    userId: 'user_456' as UserId,
    
    columns: [
      ...personnelTableColumns,
      // 動態新增自訂欄位的列
      ...customFields.map(field => ({
        id: `custom_${field.id}`,
        name: field.name,
        type: field.type,
        isEditable: true,
        validation: field.validation,
        options: field.options,
      } as DonnaTableColumn<PersonnelTableData>)),
    ],
    
    data,
    onDataChange: setData,
    
    // 自訂欄位管理
    customFields,
    onCustomFieldAdd: (field) => {
      setCustomFields([...customFields, field]);
    },
    onCustomFieldEdit: (fieldId, field) => {
      setCustomFields(customFields.map(f => 
        f.id === fieldId ? field : f
      ));
    },
    onCustomFieldDelete: (fieldId) => {
      setCustomFields(customFields.filter(f => f.id !== fieldId));
    },
    
    // 進階功能配置
    features: {
      ai: {
        enabled: true,
        features: {
          smartFilter: true,
          autoSort: true,
          dataInsights: true,
          predictiveText: true,
        },
      },
      bulkActions: {
        enabled: true,
        actions: [
          {
            id: 'export',
            label: '匯出選中項目',
            icon: 'download',
            action: async (rows) => {
              // 匯出邏輯
              console.log('Exporting', rows.length, 'rows');
            },
          },
          {
            id: 'delete',
            label: '刪除選中項目',
            icon: 'trash',
            action: async (rows) => {
              // 刪除邏輯
              console.log('Deleting', rows.length, 'rows');
            },
            confirmRequired: true,
            permissions: ['admin'],
          },
        ],
      },
      importExport: {
        import: {
          enabled: true,
          formats: ['csv', 'excel'],
          mapping: true,
          validation: true,
        },
        export: {
          enabled: true,
          formats: ['csv', 'excel', 'pdf'],
          customFileName: (date) => `personnel_${date.toISOString().split('T')[0]}`,
        },
      },
      versioning: {
        enabled: true,
        trackChanges: true,
        showHistory: true,
        allowRevert: true,
        maxVersions: 100,
      },
      collaboration: {
        enabled: true,
        realtime: true,
        showActiveUsers: true,
        lockOnEdit: true,
        comments: true,
      },
    },
    
    // 同步配置
    syncConfig: {
      autoSync: true,
      syncInterval: 30000, // 30 seconds
      conflictResolution: 'merge',
      onSyncError: (error) => {
        console.error('Sync error:', error);
      },
    },
    
    // 效能優化
    performance: {
      virtualScroll: data.length > 100,
      lazyLoad: true,
      debounceSearch: 300,
      throttleScroll: 100,
      cacheSize: 1000,
    },
    
    // 分析追蹤
    analytics: {
      trackInteractions: true,
      trackPerformance: true,
      customEvents: {
        onCellEdit: (data) => {
          // 發送分析事件
          console.log('Cell edited:', data);
        },
      },
    },
    
    // 其他標準配置
    showToolbar: true,
    showFooter: true,
    enableVirtualization: data.length > 100,
    rowHeight: 48,
    maxHeight: 600,
  };
  
  return <NotionTable {...tableProps} />;
};

// ============================================================================
// 型別輔助函數
// ============================================================================

/**
 * 建立表格列配置的輔助函數
 */
export function createTableColumn<T>(
  config: Partial<DonnaTableColumn<T>> & {
    id: string;
    name: string;
    type: CellType;
  }
): DonnaTableColumn<T> {
  return {
    isSortable: false,
    isFilterable: false,
    isEditable: false,
    isResizable: true,
    ...config,
  };
}

/**
 * 建立自訂欄位的輔助函數
 */
export function createCustomField(
  config: Partial<CustomFieldDefinition> & {
    name: string;
    type: CellType;
  }
): CustomFieldDefinition {
  return {
    id: `field_${Date.now()}`,
    required: false,
    ...config,
  };
}

/**
 * 驗證表格資料的輔助函數
 */
export function validateTableData<T>(
  data: T[],
  columns: TableColumn<T>[]
): Array<{ row: number; column: string; error: string }> {
  const errors: Array<{ row: number; column: string; error: string }> = [];
  
  data.forEach((row, rowIndex) => {
    columns.forEach(column => {
      if (column.validation) {
        const value = (row as any)[column.id];
        
        if (column.validation.required && !value) {
          errors.push({
            row: rowIndex,
            column: column.id,
            error: `${column.name} is required`,
          });
        }
        
        if (column.validation.min !== undefined && value < column.validation.min) {
          errors.push({
            row: rowIndex,
            column: column.id,
            error: `${column.name} must be at least ${column.validation.min}`,
          });
        }
        
        if (column.validation.custom) {
          const result = column.validation.custom(value, row);
          if (typeof result === 'string') {
            errors.push({
              row: rowIndex,
              column: column.id,
              error: result,
            });
          }
        }
      }
    });
  });
  
  return errors;
}

// ============================================================================
// 匯出型別
// ============================================================================

export type {
  PersonnelTableData,
  CustomFieldDefinition,
  DonnaTableColumn,
  DonnaTableFeatures,
  DonnaNotionTableProps,
};