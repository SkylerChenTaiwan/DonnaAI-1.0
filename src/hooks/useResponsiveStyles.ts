/**
 * 響應式樣式 Hook
 * 提供統一的響應式樣式管理和動態樣式生成
 * 
 * Created for: PRP-61 Web 響應式佈局統一化
 * Purpose: 簡化響應式樣式的創建和應用
 */

import { useMemo } from 'react';
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useResponsiveLayout } from './useResponsiveLayout';
import { GRID_CONFIG, RESPONSIVE_PADDING, Breakpoint } from '@/theme/responsive';
import { DesignSystem } from '@/theme/designSystem';

type Style = ViewStyle | TextStyle | ImageStyle;

/**
 * 響應式樣式 Hook
 * 
 * @example
 * const styles = useResponsiveStyles();
 * 
 * return (
 *   <View style={styles.container}>
 *     <View style={styles.grid}>
 *       {items.map(item => (
 *         <View key={item.id} style={styles.gridItem}>
 *           {item.content}
 *         </View>
 *       ))}
 *     </View>
 *   </View>
 * );
 */
export function useResponsiveStyles() {
  const layout = useResponsiveLayout();
  const { breakpoint, isMobile, isTablet, isDesktop } = layout;
  
  return useMemo(() => {
    const gridConfig = GRID_CONFIG[breakpoint];
    const padding = RESPONSIVE_PADDING[breakpoint];
    
    return StyleSheet.create({
      // 容器樣式
      container: {
        flex: 1,
        paddingHorizontal: padding.horizontal,
        paddingVertical: padding.vertical,
        backgroundColor: DesignSystem.colors.background.primary,
      },
      
      // 內容容器（有最大寬度限制）
      contentContainer: {
        width: '100%',
        maxWidth: layout.contentMaxWidth,
        marginHorizontal: 'auto' as any,
        paddingHorizontal: layout.contentPadding,
      },
      
      // 響應式網格
      grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -gridConfig.gap / 2,
      },
      
      gridItem: {
        width: `${100 / gridConfig.columns}%`,
        paddingHorizontal: gridConfig.gap / 2,
        marginBottom: gridConfig.gap,
      },
      
      // 響應式卡片
      card: {
        backgroundColor: DesignSystem.colors.background.surface,
        borderRadius: DesignSystem.borderRadius.md,
        padding: isDesktop ? 24 : isTablet ? 20 : 16,
        ...DesignSystem.shadows.sm,
      },
      
      // 響應式文字
      title: {
        ...DesignSystem.typography.h1,
        fontSize: isDesktop ? 32 : isTablet ? 28 : 24,
        marginBottom: isDesktop ? 24 : isTablet ? 20 : 16,
      },
      
      subtitle: {
        ...DesignSystem.typography.h2,
        fontSize: isDesktop ? 24 : isTablet ? 22 : 20,
        marginBottom: isDesktop ? 20 : isTablet ? 16 : 12,
      },
      
      body: {
        ...DesignSystem.typography.body,
        fontSize: isDesktop ? 16 : isTablet ? 15 : 14,
        lineHeight: isDesktop ? 24 : isTablet ? 22 : 20,
      },
      
      // 響應式按鈕
      button: {
        paddingVertical: isDesktop ? 14 : isTablet ? 12 : 10,
        paddingHorizontal: isDesktop ? 24 : isTablet ? 20 : 16,
        borderRadius: DesignSystem.borderRadius.md,
      },
      
      // 響應式表單
      formField: {
        marginBottom: isDesktop ? 24 : isTablet ? 20 : 16,
      },
      
      input: {
        height: isDesktop ? 48 : isTablet ? 44 : 40,
        paddingHorizontal: isDesktop ? 16 : isTablet ? 14 : 12,
        fontSize: isDesktop ? 16 : isTablet ? 15 : 14,
      },
      
      // 響應式間距
      spacingXS: {
        margin: DesignSystem.spacing.xs,
      },
      spacingSM: {
        margin: DesignSystem.spacing.sm,
      },
      spacingMD: {
        margin: DesignSystem.spacing.md,
      },
      spacingLG: {
        margin: DesignSystem.spacing.lg,
      },
      spacingXL: {
        margin: DesignSystem.spacing.xl,
      },
      
      // 響應式列表
      listItem: {
        paddingVertical: isDesktop ? 16 : isTablet ? 14 : 12,
        paddingHorizontal: isDesktop ? 20 : isTablet ? 16 : 12,
      },
      
      // 響應式側邊欄佈局
      sidebarLayout: {
        flexDirection: isDesktop ? 'row' : 'column',
        gap: isDesktop ? 24 : 0,
      },
      
      sidebar: {
        width: isDesktop ? 300 : '100%',
        marginBottom: isDesktop ? 0 : 16,
      },
      
      mainContent: {
        flex: 1,
        minWidth: 0,
      },
      
      // 響應式 Modal
      modalOverlay: {
        padding: isMobile ? 16 : 24,
      },
      
      modalContent: {
        width: '100%',
        maxWidth: isDesktop ? 600 : isTablet ? 480 : '100%',
        maxHeight: '90vh',
        padding: isDesktop ? 32 : isTablet ? 24 : 20,
      },
      
      // 響應式表格
      tableContainer: {
        overflowX: isMobile ? 'scroll' : 'auto',
      },
      
      // 工具類
      hiddenOnMobile: {
        display: isMobile ? 'none' : 'flex',
      },
      
      hiddenOnTablet: {
        display: isTablet ? 'none' : 'flex',
      },
      
      hiddenOnDesktop: {
        display: isDesktop ? 'none' : 'flex',
      },
      
      visibleOnMobile: {
        display: isMobile ? 'flex' : 'none',
      },
      
      visibleOnTablet: {
        display: isTablet ? 'flex' : 'none',
      },
      
      visibleOnDesktop: {
        display: isDesktop ? 'flex' : 'none',
      },
    });
  }, [breakpoint, isMobile, isTablet, isDesktop, layout]);
}

/**
 * 創建響應式樣式的輔助函數
 * 
 * @example
 * const styles = createResponsiveStyles((breakpoint, layout) => ({
 *   container: {
 *     padding: breakpoint === 'desktop' ? 32 : 16,
 *   },
 *   text: {
 *     fontSize: layout.isDesktop ? 18 : 14,
 *   }
 * }));
 */
export function createResponsiveStyles<T extends Record<string, Style>>(
  stylesFn: (breakpoint: Breakpoint, layout: ReturnType<typeof useResponsiveLayout>) => T
): () => T {
  return () => {
    const layout = useResponsiveLayout();
    return useMemo(() => stylesFn(layout.breakpoint, layout), [layout]);
  };
}

/**
 * 響應式值選擇器
 * 根據當前斷點返回對應的值
 * 
 * @example
 * const padding = useResponsiveValue({
 *   mobile: 16,
 *   tablet: 24,
 *   desktop: 32,
 * });
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>> & { default?: T }): T | undefined {
  const { breakpoint } = useResponsiveLayout();
  
  return useMemo(() => {
    // 從當前斷點開始向下查找
    const breakpointOrder: Breakpoint[] = ['wideScreen', 'largeDesktop', 'desktop', 'tablet', 'mobile'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    
    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (values[bp] !== undefined) {
        return values[bp];
      }
    }
    
    return values.default;
  }, [breakpoint, values]);
}

/**
 * 響應式類名組合器
 * 根據條件動態組合樣式
 * 
 * @example
 * const className = useResponsiveClassName(
 *   styles.base,
 *   isMobile && styles.mobile,
 *   isTablet && styles.tablet,
 *   isDesktop && styles.desktop
 * );
 */
export function useResponsiveClassName(...styles: (Style | false | undefined | null)[]): Style[] {
  return useMemo(() => {
    return styles.filter(Boolean) as Style[];
  }, [styles]);
}