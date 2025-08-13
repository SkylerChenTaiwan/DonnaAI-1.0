/**
 * 統一的佈局配置系統
 * 決定每個頁面應該使用哪種佈局模式
 * 
 * Created for: PRP-80 Web Layout Optimization
 * Purpose: 解決佈局系統混用問題，提供集中化的配置管理
 */

export const LAYOUT_CONFIG = {
  /**
   * 需要側邊欄的頁面（Web 版使用 UnifiedWebLayout）
   * 這些頁面在 Web 平台會顯示側邊欄導航
   */
  withSidebar: [
    // 主要 Tab 頁面
    'Home',
    'Database',
    'Tools', 
    'Settings',
    
    // Super Admin 頁面
    'SuperAdminDashboard',
    'OrganizationsScreen',
    'OrganizationDetailScreen',
    'CreateOrganizationScreen',
    'PlatformDashboard',
    
    // Enterprise Admin 頁面
    'AdminDashboard',
    'UserManagementScreen',
    'ToolManagementScreen',
    'DataImportScreen',
    'LegacyDataImportScreen',
    'UsageReportsScreen',
    'AdminSettings',
    
    // 詳細檢視頁面
    'CustomerDetail',
    'RecordDetail',
    'TaskDetail',
    
    // 其他需要側邊欄的頁面
    'PersonnelScreen',
    'MeetingsScreen',
    'ProfileScreen',
    'WebAppContainer',
  ],
  
  /**
   * 不需要側邊欄的頁面（使用基本 Layout）
   * 這些頁面通常是 Modal 或獨立頁面
   */
  withoutSidebar: [
    // 認證相關頁面
    'Login',
    'Register',
    'ForgotPassword',
    'ResetPassword',
    
    // Modal 頁面
    'CreateCustomerModal',
    'EditCustomerModal',
    'CreateRecordModal',
    'EditRecordModal',
    'CreateTaskModal',
    'EditTaskModal',
    'EditProfileModal',
    'CreateUserModal',
    'EditUserModal',
    'AddRecordModal',
    'AddUserModal',
    
    // 獨立功能頁面
    'RecordingScreen',
    'AIRolePlayScreen',
    
    // 測試頁面
    'TestScreen',
    'NotionTableTest',
    'ErrorLogsScreen',
    'PerformanceMonitorScreen',
    'StateInspector',
  ],
  
  /**
   * 需要原生 header 的頁面
   * 這些頁面會使用 React Navigation 的原生 header
   */
  withNativeHeader: [
    'HelpSupport',
    'PrivacyPolicy',
  ],
  
  /**
   * 特殊處理的頁面
   * 這些頁面有自己的佈局邏輯
   */
  customLayout: [
    'MainTabs', // 使用 WebNavigator 或 MainTabNavigator
  ] };

/**
 * 檢查頁面是否需要側邊欄
 */
export function needsSidebar(screenName: string): boolean {
  return LAYOUT_CONFIG.withSidebar.includes(screenName);
}

/**
 * 檢查頁面是否需要原生 header
 */
export function needsNativeHeader(screenName: string): boolean {
  return LAYOUT_CONFIG.withNativeHeader.includes(screenName);
}

/**
 * 檢查頁面是否是 Modal
 */
export function isModalScreen(screenName: string): boolean {
  return screenName.includes('Modal') || 
         LAYOUT_CONFIG.withoutSidebar.includes(screenName);
}

/**
 * 獲取頁面的佈局類型
 */
export type LayoutType = 'sidebar' | 'basic' | 'custom';

export function getLayoutType(screenName: string): LayoutType {
  if (LAYOUT_CONFIG.customLayout.includes(screenName)) {
    return 'custom';
  }
  if (needsSidebar(screenName)) {
    return 'sidebar';
  }
  return 'basic';
}

/**
 * 根據佈局配置決定是否顯示 React Navigation header
 */
export function shouldShowHeader(screenName: string): boolean {
  // 有側邊欄的頁面不顯示原生 header（避免重疊）
  if (needsSidebar(screenName)) {
    return false;
  }
  
  // 明確需要原生 header 的頁面
  if (needsNativeHeader(screenName)) {
    return true;
  }
  
  // Modal 頁面通常不需要 header
  if (isModalScreen(screenName)) {
    return false;
  }
  
  // 預設不顯示
  return false;
}