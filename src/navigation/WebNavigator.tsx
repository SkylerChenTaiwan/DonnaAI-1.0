/**
 * Web 平台專用導航器
 * 提供桌面版和平板版的側邊欄導航體驗
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { isDesktopWeb, isTabletWeb, isMobileWeb } from '@/utils/web-detector';
import { webStyles, responsive } from '@/styles/web';
import { DesignSystem } from '@/theme/designSystem';
import { useAuthStore } from '@/stores/authStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Import screens
import { HomeScreen } from '@/screens/home/HomeScreen';
import { DatabaseScreen } from '@/screens/database/DatabaseScreen';
import { ToolsScreen } from '@/screens/tools/ToolsScreen';
import { PersonnelScreen } from '@/screens/personnel/PersonnelScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

// Import components
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopBar } from '@/components/navigation/TopBar';
import { MainTabParamList } from '@/types/navigation';

const Stack = createStackNavigator<MainTabParamList>();

export const WebNavigator = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { mode } = useAuthStore();
  
  // 啟用鍵盤快捷鍵（桌面版）
  useKeyboardShortcuts();
  
  // 自動調整側邊欄狀態
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleResize = () => {
      // 平板模式下預設收合側邊欄
      if (isTabletWeb() && !isDesktopWeb()) {
        setSidebarCollapsed(true);
      } else if (isDesktopWeb()) {
        setSidebarCollapsed(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const showSidebar = isDesktopWeb() || (isTabletWeb() && !sidebarCollapsed);
  const showTopBar = isTabletWeb() || isMobileWeb();
  
  return (
    <View style={styles.container}>
      {/* 側邊欄 */}
      {showSidebar && (
        <Sidebar 
          collapsed={isTabletWeb() && sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}
      
      {/* 主內容區 */}
      <View style={styles.mainContent}>
        {/* 頂部導航欄（平板和手機） */}
        {showTopBar && (
          <TopBar 
            onMenuPress={() => setSidebarCollapsed(!sidebarCollapsed)}
            showMenu={isTabletWeb()}
          />
        )}
        
        {/* 路由內容 */}
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animationEnabled: Platform.OS === 'web' ? false : true,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Database" component={DatabaseScreen} />
          <Stack.Screen 
            name="Tools" 
            component={mode === 'manager' ? PersonnelScreen : ToolsScreen} 
          />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          
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
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 0, // 防止內容溢出
  },
});