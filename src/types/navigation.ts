/**
 * 導航型別定義
 */

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
  CreateCustomerModal: undefined;
  CreateRecordModal: undefined;
  CreateTaskModal: undefined;
  // 詳細檢視頁面
  CustomerDetail: { customerId: string };
  RecordDetail: { recordId: string };
  TaskDetail: { taskId: string };
  // 開發者工具畫面
  StateInspector: undefined;
  ErrorLogs: undefined;
  PerformanceMonitor: undefined;
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