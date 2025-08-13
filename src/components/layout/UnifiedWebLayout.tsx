/**
 * 統一的 Web 佈局元件
 * 解決響應式佈局架構衝突問題
 * 
 * Created by: backend-architect agent
 * Purpose: 統一所有 Web 頁面的響應式佈局
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { isDesktopWeb, isTabletWeb, isMobileWeb } from '@/utils/web-detector';
import { DesignSystem } from '@/theme/designSystem';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopBar } from '@/components/navigation/TopBar';
import { useAuthStore } from '@/stores/authStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// 側邊欄寬度常數
const SIDEBAR_WIDTH = {
  expanded: 220,
  collapsed: 80 };

interface UnifiedWebLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  maxWidth?: number;
  showSidebar?: boolean;
  containerStyle?: any;
}

export const UnifiedWebLayout: React.FC<UnifiedWebLayoutProps> = ({
  children,
  scrollable = true,
  maxWidth = 1200,
  showSidebar = true,
  containerStyle }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { mode } = useAuthStore();
  const route = useRoute();
  
  // 啟用鍵盤快捷鍵（桌面版）
  useKeyboardShortcuts();
  
  // 自動調整側邊欄狀態
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleResize = () => {
      // 平板橫向模式預設收合側邊欄
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
  
  // 決定是否顯示側邊欄
  const shouldShowSidebar = showSidebar && (isDesktopWeb() || (isTabletWeb() && !sidebarCollapsed));
  const shouldShowTopBar = showSidebar && (isTabletWeb() || isMobileWeb());
  
  // 計算側邊欄寬度
  const sidebarWidth = shouldShowSidebar ? 
    (sidebarCollapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded) : 0;
  
  // 非 Web 平台直接返回子元素
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }
  
  const content = (
    <View style={StyleSheet.flatten([
      styles.contentContainer,
      { maxWidth },
      containerStyle,
    ])}>
      {children}
    </View>
  );
  
  const scrollableContent = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  ) : content;
  
  return (
    <View style={styles.container}>
      {/* 側邊欄 */}
      {shouldShowSidebar && (
        <Sidebar 
          collapsed={isTabletWeb() && sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}
      
      {/* 主內容區 */}
      <View style={StyleSheet.flatten([
        styles.mainContent,
        shouldShowSidebar && { marginLeft: sidebarWidth },
      ])}>
        {/* 頂部導航欄（平板和手機） */}
        {shouldShowTopBar && (
          <TopBar 
            onMenuPress={() => setSidebarCollapsed(!sidebarCollapsed)}
            showMenu={isTabletWeb()}
          />
        )}
        
        {/* 頁面內容 */}
        <View style={styles.pageWrapper}>
          {scrollableContent}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.background.primary },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 0, // 防止內容溢出
    transition: 'margin-left 0.3s ease', // 平滑過渡動畫
  },
  pageWrapper: {
    flex: 1 },
  scrollView: {
    flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 24 },
  contentContainer: {
    width: '100%',
    paddingHorizontal: 24,
    alignSelf: 'center' } });