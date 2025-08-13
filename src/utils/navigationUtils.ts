/**
 * 導航工具函數
 * 提供跨平台的導航輔助功能
 */

import { Platform } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';

/**
 * 判斷是否應該使用 Web 導航器
 */
export const shouldUseWebNavigator = (): boolean => {
  if (Platform.OS !== 'web') return false;
  
  // 僅在桌面版和平板版使用 WebNavigator
  const width = typeof window !== 'undefined' ? window.innerWidth : 0;
  return width >= 768; // 平板以上寬度
};

/**
 * 獲取麵包屑路徑
 * 根據當前路由生成麵包屑導航項目
 */
export interface BreadcrumbItem {
  id: string;
  label: string;
  onPress?: () => void;
}

export const getBreadcrumbsForRoute = (
  routeName: keyof RootStackParamList,
  navigation: NavigationProp<RootStackParamList>
): BreadcrumbItem[] => {
  const breadcrumbs = [
    {
      id: 'home',
      label: '首頁',
      onPress: () => navigation.navigate('Home' as any) },
  ];
  
  // 根據路由添加對應的麵包屑
  switch (routeName) {
    case 'OrganizationsScreen':
      breadcrumbs.push({
        id: 'organizations',
        label: '組織管理' });
      break;
      
    case 'OrganizationDetailScreen':
      breadcrumbs.push({
        id: 'organizations',
        label: '組織管理',
        onPress: () => navigation.navigate('OrganizationsScreen' as any) });
      breadcrumbs.push({
        id: 'detail',
        label: '組織詳情' });
      break;
      
    case 'SuperAdminDashboard':
      breadcrumbs.push({
        id: 'superadmin',
        label: 'Super Admin 控制台' });
      break;
      
    case 'PlatformDashboard':
      breadcrumbs.push({
        id: 'platform',
        label: '平台統計' });
      break;
      
    case 'AdminDashboard':
      breadcrumbs.push({
        id: 'admin',
        label: '管理中心' });
      break;
      
    case 'UserManagementScreen':
      breadcrumbs.push({
        id: 'admin',
        label: '管理中心',
        onPress: () => navigation.navigate('AdminDashboard' as any) });
      breadcrumbs.push({
        id: 'users',
        label: '用戶管理' });
      break;
      
    case 'DataImportScreen':
      breadcrumbs.push({
        id: 'admin',
        label: '管理中心',
        onPress: () => navigation.navigate('AdminDashboard' as any) });
      breadcrumbs.push({
        id: 'import',
        label: '資料匯入' });
      break;
      
    case 'UsageReportsScreen':
      breadcrumbs.push({
        id: 'admin',
        label: '管理中心',
        onPress: () => navigation.navigate('AdminDashboard' as any) });
      breadcrumbs.push({
        id: 'reports',
        label: '使用報表' });
      break;
      
    default:
      // 預設情況只顯示當前頁面
      breadcrumbs.push({
        id: 'current',
        label: routeName });
  }
  
  return breadcrumbs;
};

/**
 * 安全導航函數
 * 嘗試返回，如果不能則導航到指定頁面
 */
export const safeGoBack = (
  navigation: NavigationProp<RootStackParamList>,
  fallbackRoute?: keyof RootStackParamList
) => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else if (fallbackRoute) {
    navigation.navigate(fallbackRoute as any);
  } else {
    // 預設返回首頁
    navigation.navigate('Home' as any);
  }
};

/**
 * 判斷當前路由是否為 Admin 路由
 */
export const isAdminRoute = (routeName: string): boolean => {
  const adminRoutes = [
    'SuperAdminDashboard',
    'OrganizationsScreen',
    'OrganizationDetailScreen',
    'CreateOrganizationScreen',
    'PlatformDashboard',
    'AdminDashboard',
    'UserManagementScreen',
    'ToolManagementScreen',
    'DataImportScreen',
    'UsageReportsScreen',
    'AdminSettings',
  ];
  
  return adminRoutes.includes(routeName);
};

/**
 * 獲取路由標題
 */
export const getRouteTitle = (routeName: string): string => {
  const titles: Record<string, string> = {
    Home: '首頁',
    Database: '資料庫',
    Tools: '小工具',
    Settings: '設定',
    OrganizationsScreen: '組織管理',
    OrganizationDetailScreen: '組織詳情',
    SuperAdminDashboard: 'Super Admin 控制台',
    PlatformDashboard: '平台統計',
    AdminDashboard: '管理中心',
    UserManagementScreen: '用戶管理',
    ToolManagementScreen: '工具管理',
    DataImportScreen: '資料匯入',
    UsageReportsScreen: '使用報表',
    AdminSettings: '管理員設定' };
  
  return titles[routeName] || routeName;
};

/**
 * 檢查用戶是否有訪問特定路由的權限
 */
export const canAccessRoute = (
  routeName: string,
  userRole?: string,
  isSuperAdmin?: boolean
): boolean => {
  // Super Admin 可以訪問所有路由
  if (isSuperAdmin) return true;
  
  // Super Admin 專屬路由
  const superAdminOnlyRoutes = [
    'SuperAdminDashboard',
    'OrganizationsScreen',
    'OrganizationDetailScreen',
    'CreateOrganizationScreen',
    'PlatformDashboard',
  ];
  
  if (superAdminOnlyRoutes.includes(routeName)) {
    return isSuperAdmin === true;
  }
  
  // Enterprise Admin 路由
  const adminRoutes = [
    'AdminDashboard',
    'UserManagementScreen',
    'ToolManagementScreen',
    'DataImportScreen',
    'UsageReportsScreen',
    'AdminSettings',
  ];
  
  if (adminRoutes.includes(routeName)) {
    return userRole === 'admin' || isSuperAdmin === true;
  }
  
  // 其他路由所有用戶都可以訪問
  return true;
};