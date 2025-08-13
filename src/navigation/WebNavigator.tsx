/**
 * Web 平台專用導航器
 * 提供桌面版和平板版的側邊欄導航體驗
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { isWebPlatform, getWebScreenInfo } from '@/utils/web-detector';
import { webStyles, responsive } from '@/styles/web';
import { DesignSystem } from '@/theme/designSystem';
import { useAuthStore } from '@/stores/authStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { UNIFIED_BREAKPOINTS } from '@/theme/responsive';

// Import screens
import { HomeScreen } from '@/screens/home/HomeScreen';
import { DatabaseScreen } from '@/screens/database/DatabaseScreen';
import { ToolsScreen } from '@/screens/tools/ToolsScreen';
import { PersonnelScreen } from '@/screens/personnel/PersonnelScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

// Import Super Admin screens
import { SuperAdminDashboard } from '@/screens/superadmin/SuperAdminDashboard';
import { OrganizationsScreen } from '@/screens/superadmin/OrganizationsScreen';
import { OrganizationDetailScreen } from '@/screens/superadmin/OrganizationDetailScreen';
import { CreateOrganizationScreen } from '@/screens/superadmin/CreateOrganizationScreen';
import { OnboardingWizardScreen } from '@/screens/superadmin/OnboardingWizardScreen';
import { PlatformDashboard } from '@/screens/superadmin/PlatformDashboard';

// Import Enterprise Admin screens
import { AdminDashboard } from '@/screens/admin/AdminDashboard';
import { UserManagementScreen } from '@/screens/admin/UserManagementScreen';
import { ToolManagementScreen } from '@/screens/admin/ToolManagementScreen';
import { DataImportScreen } from '@/screens/admin/DataImportScreen';
import { UsageReportsScreen } from '@/screens/admin/UsageReportsScreen';
import { AdminSettings } from '@/screens/admin/AdminSettings';
import { LegacyDataImportScreen } from '@/components/screens/admin/LegacyDataImportScreen';

// Import components
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopBar } from '@/components/navigation/TopBar';
import { RootStackParamList } from '@/types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export const WebNavigator = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const { mode } = useAuthStore();
  
  // 啟用鍵盤快捷鍵（桌面版）
  useKeyboardShortcuts();
  
  // 根據視窗大小判斷設備類型
  const isDesktop = windowWidth >= UNIFIED_BREAKPOINTS.desktop;
  const isTablet = windowWidth >= UNIFIED_BREAKPOINTS.tablet && windowWidth < UNIFIED_BREAKPOINTS.desktop;
  const isMobile = windowWidth < UNIFIED_BREAKPOINTS.tablet;
  
  // 自動調整側邊欄狀態
  useEffect(() => {
    if (!isWebPlatform()) return;
    
    const handleResize = () => {
      const { width } = getWebScreenInfo();
      setWindowWidth(width);
      
      // 初次載入時的預設狀態
      if (!windowWidth) {
        // 平板和手機模式下預設收合側邊欄
        if (width < UNIFIED_BREAKPOINTS.desktop) {
          setSidebarCollapsed(true);
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowWidth]);
  
  // 添加調試日誌
  const handleSidebarToggle = () => {
    console.log('[WebNavigator] Toggle sidebar:', !sidebarCollapsed);
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // 側邊欄顯示邏輯：桌面模式始終顯示（但可收合），平板和手機模式根據狀態顯示
  const showSidebar = true; // 始終渲染側邊欄組件，通過 collapsed 控制收合
  const showTopBar = isTablet || isMobile;
  
  return (
    <View style={styles.container}>
      {/* 側邊欄遮罩層（手機模式） */}
      {isMobile && !sidebarCollapsed && (
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleSidebarToggle}
        />
      )}
      
      {/* 側邊欄 */}
      {showSidebar && (
        <View style={[
          styles.sidebarContainer,
          isMobile && styles.mobileSidebar,
          isMobile && !sidebarCollapsed && styles.mobileSidebarVisible
        ]}>
          <Sidebar 
            collapsed={sidebarCollapsed}  // 所有模式都使用統一的收合狀態
            onToggle={handleSidebarToggle}
          />
        </View>
      )}
      
      {/* 主內容區 */}
      <View style={styles.mainContent}>
        {/* 頂部導航欄（平板和手機） */}
        {showTopBar && (
          <TopBar 
            onMenuPress={handleSidebarToggle}
            showMenu={true}  // 平板和手機都需要菜單按鈕
          />
        )}
        
        {/* 路由內容 */}
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animationEnabled: Platform.OS === 'web' ? false : true,
          }}
        >
          {/* 主要頁面 */}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Database" component={DatabaseScreen} />
          <Stack.Screen 
            name="Tools" 
            component={mode === 'manager' ? PersonnelScreen : ToolsScreen} 
          />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          
          {/* Super Admin 頁面 */}
          <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboard} />
          <Stack.Screen name="OrganizationsScreen" component={OrganizationsScreen} />
          <Stack.Screen name="OrganizationDetailScreen" component={OrganizationDetailScreen} />
          <Stack.Screen name="CreateOrganizationScreen" component={CreateOrganizationScreen} />
          <Stack.Screen name="OnboardingWizardScreen" component={OnboardingWizardScreen} />
          <Stack.Screen name="PlatformDashboard" component={PlatformDashboard} />
          
          {/* Enterprise Admin 頁面 */}
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="UserManagementScreen" component={UserManagementScreen} />
          <Stack.Screen name="ToolManagementScreen" component={ToolManagementScreen} />
          <Stack.Screen name="DataImportScreen" component={DataImportScreen} />
          <Stack.Screen name="UsageReportsScreen" component={UsageReportsScreen} />
          <Stack.Screen name="AdminSettings" component={AdminSettings} />
          <Stack.Screen name="LegacyDataImportScreen" component={LegacyDataImportScreen} />
          
          {/* AddAction 是一個特殊的路由，不需要實際頁面 */}
          <Stack.Screen 
            name="AddAction" 
            component={EmptyComponent}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </View>
    </View>
  );
};

// 空元件用於 AddAction
const EmptyComponent = () => null;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.background.primary,
    position: 'relative' as any,
    height: '100vh',
  },
  sidebarContainer: {
    height: '100%',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 0, // 防止內容溢出
  },
  overlay: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  mobileSidebar: {
    position: 'absolute' as any,
    top: 0,
    left: -280, // 預設隱藏在左側
    bottom: 0,
    width: 280,
    zIndex: 999,
    backgroundColor: DesignSystem.colors.background.surface,
    transition: 'transform 0.3s ease-in-out',
  },
  mobileSidebarVisible: {
    transform: Platform.OS === 'web' ? `translateX(${280}px)` : [{ translateX: 280 }],
  },
});