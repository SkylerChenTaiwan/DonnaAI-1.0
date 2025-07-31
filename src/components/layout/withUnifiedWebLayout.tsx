/**
 * UnifiedWebLayout 高階元件 (HOC)
 * 簡化頁面遷移到統一的 Web 佈局系統
 * 
 * Created for: PRP-61 Web 響應式佈局統一化
 * Purpose: 提供簡單的方式將現有頁面包裝成使用 UnifiedWebLayout
 */

import React from 'react';
import { Platform } from 'react-native';
import { UnifiedWebLayout } from './UnifiedWebLayout';
import { Layout } from '@/components/common/Layout';
import { isDesktopWeb, isTabletWeb } from '@/utils/web-detector';
import { shouldShowSidebarForRoute } from '@/theme/responsive';
import { useRoute } from '@react-navigation/native';

export interface WithUnifiedWebLayoutOptions {
  scrollable?: boolean;
  maxWidth?: number;
  showSidebar?: boolean;
  containerStyle?: any;
  layoutProps?: any;
}

/**
 * 高階元件：自動為頁面添加 UnifiedWebLayout
 * 
 * @param Component 要包裝的元件
 * @param options 佈局選項
 * @returns 包裝後的元件
 * 
 * @example
 * // 基本用法
 * export default withUnifiedWebLayout(MyScreen);
 * 
 * // 帶選項的用法
 * export default withUnifiedWebLayout(MyScreen, {
 *   scrollable: true,
 *   maxWidth: 1400,
 *   showSidebar: true
 * });
 */
export function withUnifiedWebLayout<P extends object>(
  Component: React.ComponentType<P>,
  options: WithUnifiedWebLayoutOptions = {}
) {
  const {
    scrollable = true,
    maxWidth = 1200,
    showSidebar,
    containerStyle,
    layoutProps = {}
  } = options;

  return React.forwardRef<any, P>((props, ref) => {
    const route = useRoute();
    
    // 判斷是否應該使用 Web 佈局
    const shouldUseWebLayout = Platform.OS === 'web' && (isDesktopWeb() || isTabletWeb());
    
    // 判斷是否顯示側邊欄（如果沒有明確指定，根據路由名稱決定）
    const shouldShowSidebar = showSidebar !== undefined 
      ? showSidebar 
      : shouldShowSidebarForRoute(route.name);
    
    // Web 平台使用 UnifiedWebLayout
    if (shouldUseWebLayout) {
      return (
        <UnifiedWebLayout
          scrollable={scrollable}
          maxWidth={maxWidth}
          showSidebar={shouldShowSidebar}
          containerStyle={containerStyle}
        >
          <Component {...props} ref={ref} />
        </UnifiedWebLayout>
      );
    }
    
    // 其他平台使用原有 Layout
    return (
      <Layout {...layoutProps} scrollable={scrollable}>
        <Component {...props} ref={ref} />
      </Layout>
    );
  });
}

/**
 * Hook: 用於組件內部判斷是否正在使用 UnifiedWebLayout
 */
export function useIsUnifiedWebLayout(): boolean {
  const shouldUseWebLayout = Platform.OS === 'web' && (isDesktopWeb() || isTabletWeb());
  return shouldUseWebLayout;
}

/**
 * 輔助函數：將現有的頁面元件遷移到 UnifiedWebLayout
 * 這個函數設計用於最小化代碼改動
 * 
 * @example
 * // 原始代碼
 * export const MyScreen = () => {
 *   return (
 *     <Layout>
 *       <Content />
 *     </Layout>
 *   );
 * };
 * 
 * // 遷移後（方法一：使用 HOC）
 * const MyScreen = () => {
 *   return <Content />;
 * };
 * export default withUnifiedWebLayout(MyScreen);
 * 
 * // 遷移後（方法二：使用條件渲染）
 * export const MyScreen = () => {
 *   const content = <Content />;
 *   return migrateToUnifiedWebLayout(content, { maxWidth: 1400 });
 * };
 */
export function migrateToUnifiedWebLayout(
  content: React.ReactNode,
  options: WithUnifiedWebLayoutOptions = {}
): React.ReactElement {
  const route = useRoute();
  const shouldUseWebLayout = Platform.OS === 'web' && (isDesktopWeb() || isTabletWeb());
  
  const {
    scrollable = true,
    maxWidth = 1200,
    showSidebar,
    containerStyle,
    layoutProps = {}
  } = options;
  
  const shouldShowSidebar = showSidebar !== undefined 
    ? showSidebar 
    : shouldShowSidebarForRoute(route.name);
  
  if (shouldUseWebLayout) {
    return (
      <UnifiedWebLayout
        scrollable={scrollable}
        maxWidth={maxWidth}
        showSidebar={shouldShowSidebar}
        containerStyle={containerStyle}
      >
        {content}
      </UnifiedWebLayout>
    );
  }
  
  return (
    <Layout {...layoutProps} scrollable={scrollable}>
      {content}
    </Layout>
  );
}