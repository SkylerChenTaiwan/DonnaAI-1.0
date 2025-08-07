/**
 * 智能佈局元件
 * 根據配置自動選擇合適的佈局系統
 * 
 * Created for: PRP-80 Web Layout Optimization
 * Purpose: 統一所有頁面的佈局決策邏輯
 */

import React from 'react';
import { Platform, ViewStyle } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Layout } from '@/components/common/Layout';
import { UnifiedWebLayout } from '@/components/layout/UnifiedWebLayout';
import { getLayoutType, needsSidebar } from '@/navigation/layoutConfig';
import { isDesktopWeb, isTabletWeb } from '@/utils/web-detector';

interface SmartLayoutProps {
  children: React.ReactNode;
  /**
   * 頁面名稱，用於決定佈局類型
   * 如果不提供，會從 route 自動獲取
   */
  screenName?: string;
  /**
   * 是否可滾動
   */
  scrollable?: boolean;
  /**
   * 自定義 header 元件
   */
  customHeader?: React.ReactNode;
  /**
   * 容器樣式
   */
  style?: ViewStyle;
  /**
   * 內容樣式
   */
  contentStyle?: ViewStyle;
  /**
   * 最大寬度（僅 Web 平台生效）
   */
  maxWidth?: number;
  /**
   * 是否強制使用基本佈局（用於特殊情況）
   */
  forceBasicLayout?: boolean;
  /**
   * 是否啟用鍵盤避讓（移動端）
   */
  keyboardAvoidingEnabled?: boolean;
}

export const SmartLayout: React.FC<SmartLayoutProps> = ({
  children,
  screenName,
  scrollable = true,
  customHeader,
  style,
  contentStyle,
  maxWidth = 1200,
  forceBasicLayout = false,
  keyboardAvoidingEnabled = false,
}) => {
  const route = useRoute();
  
  // 獲取當前頁面名稱
  const currentScreenName = screenName || route.name;
  
  // 判斷是否為 Web 平台
  const isWeb = Platform.OS === 'web';
  
  // 判斷是否需要側邊欄
  const shouldUseSidebar = !forceBasicLayout && 
                           isWeb && 
                           (isDesktopWeb() || isTabletWeb()) &&
                           needsSidebar(currentScreenName);
  
  // 獲取佈局類型
  const layoutType = forceBasicLayout ? 'basic' : getLayoutType(currentScreenName);
  
  // 根據佈局類型返回對應的元件
  if (shouldUseSidebar && layoutType === 'sidebar') {
    // Web 平台且需要側邊欄：使用 UnifiedWebLayout
    return (
      <UnifiedWebLayout 
        scrollable={scrollable}
        maxWidth={maxWidth}
        containerStyle={contentStyle}
      >
        {customHeader}
        {children}
      </UnifiedWebLayout>
    );
  }
  
  // 其他情況：使用基本 Layout
  return (
    <Layout 
      scrollable={scrollable}
      style={style}
      contentStyle={contentStyle}
      keyboardAvoidingEnabled={keyboardAvoidingEnabled}
    >
      {customHeader}
      {children}
    </Layout>
  );
};

/**
 * HOC 版本的 SmartLayout
 * 用於包裝現有元件
 */
export function withSmartLayout<P extends object>(
  Component: React.ComponentType<P>,
  layoutProps?: Omit<SmartLayoutProps, 'children'>
) {
  return React.forwardRef<any, P>((props, ref) => {
    return (
      <SmartLayout {...layoutProps}>
        <Component {...props} ref={ref} />
      </SmartLayout>
    );
  });
}

/**
 * 用於條件渲染的輔助元件
 * 根據螢幕大小決定是否渲染子元件
 */
export const ResponsiveShow: React.FC<{
  desktop?: boolean;
  tablet?: boolean;
  mobile?: boolean;
  children: React.ReactNode;
}> = ({ desktop = true, tablet = true, mobile = true, children }) => {
  if (Platform.OS !== 'web') {
    return mobile ? <>{children}</> : null;
  }
  
  const isDesktop = isDesktopWeb();
  const isTablet = isTabletWeb() && !isDesktop;
  const isMobile = !isDesktop && !isTablet;
  
  if (isDesktop && !desktop) return null;
  if (isTablet && !tablet) return null;
  if (isMobile && !mobile) return null;
  
  return <>{children}</>;
};

/**
 * 用於條件隱藏的輔助元件
 * 根據螢幕大小決定是否隱藏子元件
 */
export const ResponsiveHide: React.FC<{
  desktop?: boolean;
  tablet?: boolean;
  mobile?: boolean;
  children: React.ReactNode;
}> = ({ desktop = false, tablet = false, mobile = false, children }) => {
  return (
    <ResponsiveShow 
      desktop={!desktop} 
      tablet={!tablet} 
      mobile={!mobile}
    >
      {children}
    </ResponsiveShow>
  );
};