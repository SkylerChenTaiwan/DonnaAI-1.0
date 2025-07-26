/**
 * 導航型別定義
 */

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
  // 創建模態框 - 支援模式參數
  CreateCustomerModal: { mode?: 'form' | 'csv' } | undefined;
  CreateRecordModal: { mode?: 'audio' | 'text'; customerId?: string } | undefined;
  CreateTaskModal: { mode?: 'voice' | 'form'; customerId?: string; recordId?: string } | undefined;
  AddRecordModal: { 
    tableType: 'customers' | 'records' | 'tasks';
    columns: any[];
    onSubmit: (data: Record<string, any>) => Promise<void>;
  } | undefined;
  AddUserModal: { 
    teamId?: string;
    onUserCreated?: () => void;
  } | undefined;
  // 編輯頁面
  EditCustomer: { customerId: string };
  EditRecord: { recordId: string };
  EditTask: { taskId: string };
  EditProfileModal: undefined;
  // 詳細檢視頁面
  CustomerDetail: { customerId: string };
  RecordDetail: { recordId: string };
  TaskDetail: { taskId: string };
  // 開發者工具畫面
  StateInspector: undefined;
  ErrorLogs: undefined;
  PerformanceMonitor: undefined;
  TestScreen: undefined;
  // 設定相關頁面
  HelpSupport: undefined;
  PrivacyPolicy: undefined;
  
  // Super Admin 頁面
  SuperAdminDashboard: undefined;
  OrganizationsScreen: undefined;
  CreateOrganizationScreen: undefined;
  OrganizationDetailScreen: { organizationId: string };
  PlatformDashboard: undefined;
  
  // Enterprise Admin 頁面
  AdminDashboard: undefined;
  UserManagementScreen: undefined;
  ToolManagementScreen: undefined;
  DataImportScreen: undefined;
  UsageReportsScreen: undefined;
  
  // Admin 通用頁面
  AdminSettings: undefined;
  
  // Admin Modals
  CreateUserModal: { 
    onUserCreated?: () => void;
  } | undefined;
  EditUserModal: { 
    userId: string;
    userData: any; // User type
    onUserUpdated?: () => void;
  } | undefined;
  
  // WebApp 容器
  WebApp: {
    toolId: string;
    title: string;
    source: { html?: string; uri?: string };
  };
};

export type MainTabParamList = {
  Home: undefined;
  Database: undefined;
  AddAction: undefined; // 僅用於觸發modal，不實際導航
  Tools: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};