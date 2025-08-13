/**
 * 統一的 Web 佈局元件
 * 根據 PRP-81 實作，解決多個佈局系統衝突的問題
 * 
 * 設計原則：
 * 1. 單一責任：只負責佈局，不處理導航
 * 2. 響應式設計：支援桌面、平板、手機三種模式
 * 3. 與 WebNavigator 協同工作：不重複處理側邊欄和頂部欄
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';
import { DesignSystem } from '@/theme/designSystem';

interface WebLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  maxWidth?: number;
  padding?: boolean;
  containerStyle?: any;
  contentStyle?: any;
}

/**
 * 統一的 Web 佈局元件
 * 
 * 使用方式：
 * 1. Web 平台的頁面應直接返回內容，由 WebNavigator 管理側邊欄
 * 2. 只在需要特定佈局控制時使用此元件
 * 3. 不要與 UnifiedWebLayout 或其他佈局元件混用
 */
export const WebLayout: React.FC<WebLayoutProps> = ({
  children,
  scrollable = true,
  maxWidth = 1440,
  padding = true,
  containerStyle,
  contentStyle }) => {
  const { isDesktop, isTablet, isMobile } = useResponsive();
  
  // 非 Web 平台直接返回子元素
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }
  
  // 計算內容的 padding
  const contentPadding = padding ? {
    paddingHorizontal: isDesktop ? 32 : isTablet ? 24 : 16,
    paddingVertical: isDesktop ? 24 : 20 } : {};
  
  // 內容容器
  const content = (
    <View style={[
      styles.contentContainer,
      { maxWidth },
      contentPadding,
      contentStyle,
    ]}>
      {children}
    </View>
  );
  
  // 根據 scrollable 屬性決定是否包裹 ScrollView
  if (scrollable) {
    return (
      <ScrollView
        style={[styles.scrollView, containerStyle]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }
  
  return (
    <View style={[styles.container, containerStyle]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary },
  scrollView: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center' },
  contentContainer: {
    width: '100%',
    alignSelf: 'center' } });

export default WebLayout;