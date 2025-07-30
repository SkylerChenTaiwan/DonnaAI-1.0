/**
 * 響應式佈局元件
 * 提供跨平台的統一佈局容器，自動適配不同螢幕尺寸
 */

import React from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  Platform,
  ViewStyle
} from 'react-native';
import { 
  isWebPlatform, 
  isDesktopWeb, 
  isTabletWeb,
  getWebScreenInfo 
} from '@/utils/web-detector';
import { webStyles, responsive, mediaQuery } from '@/styles/web';
import { DesignSystem } from '@/theme/designSystem';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  maxWidth?: number;
  padding?: boolean;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sidebar,
  header,
  scrollable = true,
  style,
  contentStyle,
  maxWidth = 1200,
  padding = true,
}) => {
  const isDesktop = isDesktopWeb();
  const isTablet = isTabletWeb();
  const isWeb = isWebPlatform();
  
  // 原生平台直接返回子元素
  if (!isWeb) {
    return scrollable ? (
      <ScrollView 
        style={[styles.nativeScrollView, style]}
        contentContainerStyle={[styles.nativeContent, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    ) : (
      <View style={[styles.nativeContainer, style]}>
        {children}
      </View>
    );
  }
  
  // Web 平台響應式佈局
  const containerContent = (
    <View style={[
      styles.contentWrapper,
      { maxWidth },
      padding && responsive({
        mobile: styles.paddingMobile,
        tablet: styles.paddingTablet,
        desktop: styles.paddingDesktop,
        default: styles.paddingMobile,
      }),
      contentStyle,
    ]}>
      {children}
    </View>
  );
  
  const mainContent = scrollable ? (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {containerContent}
    </ScrollView>
  ) : (
    containerContent
  );
  
  // 桌面版側邊欄佈局
  if (isDesktop && sidebar) {
    return (
      <View style={[styles.container, webStyles.sidebarLayout, style]}>
        <View style={webStyles.sidebar}>{sidebar}</View>
        <View style={webStyles.mainContent}>
          {header && <View style={styles.header}>{header}</View>}
          {mainContent}
        </View>
      </View>
    );
  }
  
  // 平板/手機版垂直佈局
  return (
    <View style={[styles.container, style]}>
      {header && <View style={styles.header}>{header}</View>}
      {mainContent}
    </View>
  );
};

const styles = StyleSheet.create({
  // 原生平台樣式
  nativeContainer: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  nativeScrollView: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  nativeContent: {
    flexGrow: 1,
  },
  
  // Web 平台樣式
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  scrollView: {
    flex: 1,
    ...webStyles.scrollView,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    ...Platform.select({
      web: {
        marginHorizontal: 'auto' as any,
      },
      default: {},
    }),
  },
  header: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
    ...Platform.select({
      web: webStyles.fixedHeader,
      default: {},
    }),
  },
  
  // 響應式內邊距
  paddingMobile: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  paddingTablet: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  paddingDesktop: {
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
});

// 匯出響應式網格樣式
export const responsiveGrid = StyleSheet.create({
  container: {
    ...Platform.select({
      web: responsive({
        mobile: {
          flexDirection: 'column' as const,
          gap: 16,
        },
        tablet: {
          display: 'grid' as any,
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
        },
        desktop: {
          display: 'grid' as any,
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        },
        default: {
          flexDirection: 'column' as const,
          gap: 16,
        },
      }),
      default: {
        flexDirection: 'column' as const,
        gap: 16,
      },
    }),
  },
  
  twoColumn: {
    ...Platform.select({
      web: responsive({
        mobile: {
          flexDirection: 'column' as const,
          gap: 16,
        },
        tablet: {
          display: 'grid' as any,
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
        },
        desktop: {
          display: 'grid' as any,
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
        },
        default: {
          flexDirection: 'column' as const,
          gap: 16,
        },
      }),
      default: {
        flexDirection: 'column' as const,
        gap: 16,
      },
    }),
  },
  
  sidebar: {
    ...Platform.select({
      web: responsive({
        mobile: {
          flexDirection: 'column' as const,
          gap: 16,
        },
        tablet: {
          display: 'grid' as any,
          gridTemplateColumns: '250px 1fr',
          gap: 20,
        },
        desktop: {
          display: 'grid' as any,
          gridTemplateColumns: '300px 1fr',
          gap: 24,
        },
        default: {
          flexDirection: 'column' as const,
          gap: 16,
        },
      }),
      default: {
        flexDirection: 'column' as const,
        gap: 16,
      },
    }),
  },
});