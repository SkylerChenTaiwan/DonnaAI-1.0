/**
 * 導航型別定義
 */

export type RootStackParamList = {
  MainTabs: undefined;
  CreateCustomerModal: undefined;
  CreateRecordModal: undefined;
  CreateTaskModal: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Database: undefined;
  AddAction: undefined; // 僅用於觸發modal，不實際導航
  Tools: undefined;
  Settings: undefined;
};