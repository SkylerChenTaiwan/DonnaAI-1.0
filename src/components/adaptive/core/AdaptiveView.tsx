/**
 * AdaptiveView - 跨平台統一容器元件
 * 替換 View/div 的統一實現，自動處理平台差異和樣式適配
 */

import React, { forwardRef, useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import type { CSSProperties } from 'react';
import { PlatformAdapter } from '../platform/PlatformAdapter';

// 跨平台屬性介面
export interface AdaptiveViewProps {
  children?: React.ReactNode;
  style?: ViewStyle | CSSProperties;
  webStyle?: CSSProperties;
  nativeStyle?: ViewStyle;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityHint?: string;
  
  // Web 特有屬性
  className?: string;
  id?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  
  // Native 特有屬性  
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  
  // 佈局屬性
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
  
  // HTML 屬性（Web 專用）
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  
  // 其他原生屬性透傳
  [key: string]: any;
}

// Web 實現元件
const WebView = forwardRef<HTMLDivElement, AdaptiveViewProps>(
  ({ 
    children, 
    style, 
    webStyle, 
    className = '', 
    onClick,
    onMouseEnter,
    onMouseLeave,
    testID,
    accessible,
    accessibilityLabel,
    accessibilityRole,
    role,
    tabIndex,
    pointerEvents,
    ...props 
  }, ref) => {
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    
    // 合併和轉換樣式
    const adaptedStyle = useMemo(() => {
      let finalStyle: CSSProperties = {};
      
      // 基礎樣式轉換
      if (style) {
        finalStyle = styleAdapter.adaptStyle(style as any, webStyle);
      }
      
      // Web 特定樣式
      if (webStyle) {
        finalStyle = { ...finalStyle, ...webStyle };
      }
      
      // 處理 pointerEvents
      if (pointerEvents) {
        finalStyle.pointerEvents = pointerEvents;
      }
      
      return finalStyle;
    }, [style, webStyle, styleAdapter, pointerEvents]);
    
    // 處理無障礙屬性
    const accessibilityProps = useMemo(() => {
      const props: any = {};
      
      if (accessible !== false && (accessibilityLabel || accessibilityRole || role)) {
        props['aria-label'] = accessibilityLabel;
        props.role = accessibilityRole || role || 'group';
        
        if (tabIndex !== undefined) {
          props.tabIndex = tabIndex;
        } else if (onClick) {
          props.tabIndex = 0; // 可點擊元素應該可聚焦
        }
      }
      
      return props;
    }, [accessible, accessibilityLabel, accessibilityRole, role, tabIndex, onClick]);
    
    return (
      <div
        ref={ref}
        className={className}
        style={adaptedStyle}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-testid={testID}
        {...accessibilityProps}
        {...props}
      >
        {children}
      </div>
    );
  }
);

// Native 實現元件
const NativeView = forwardRef<any, AdaptiveViewProps>(
  ({ 
    children, 
    style, 
    nativeStyle, 
    onPress,
    onPressIn,
    onPressOut,
    onLongPress,
    testID,
    accessible,
    accessibilityLabel,
    accessibilityRole,
    accessibilityHint,
    pointerEvents,
    ...props 
  }, ref) => {
    const { View, TouchableOpacity } = require('react-native');
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    
    // 合併和適配樣式
    const adaptedStyle = useMemo(() => {
      let finalStyle = style || {};
      
      // Native 特定樣式
      if (nativeStyle) {
        finalStyle = { ...finalStyle, ...nativeStyle };
      }
      
      return styleAdapter.adaptStyle(finalStyle);
    }, [style, nativeStyle, styleAdapter]);
    
    // 決定使用哪個元件
    const hasPress = onPress || onPressIn || onPressOut || onLongPress;
    const Component = hasPress ? TouchableOpacity : View;
    
    // TouchableOpacity 屬性
    const touchableProps = hasPress ? {
      onPress,
      onPressIn,
      onPressOut,
      onLongPress,
      activeOpacity: 0.8,
    } : {};
    
    // 無障礙屬性
    const accessibilityProps = {
      accessible: accessible !== false,
      accessibilityLabel,
      accessibilityRole: accessibilityRole as any,
      accessibilityHint,
    };
    
    return (
      <Component
        ref={ref}
        style={adaptedStyle}
        testID={testID}
        pointerEvents={pointerEvents}
        {...touchableProps}
        {...accessibilityProps}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

// 主要 AdaptiveView 元件
export const AdaptiveView = forwardRef<any, AdaptiveViewProps>((props, ref) => {
  const platformAdapter = PlatformAdapter.getInstance();
  
  if (platformAdapter.isWeb) {
    return <WebView {...props} ref={ref} />;
  } else {
    return <NativeView {...props} ref={ref} />;
  }
});

// 設定顯示名稱
AdaptiveView.displayName = 'AdaptiveView';
WebView.displayName = 'AdaptiveView.Web';
NativeView.displayName = 'AdaptiveView.Native';

// 預設匯出
export default AdaptiveView;

// 便利函數：建立帶有預設樣式的 AdaptiveView
export const createStyledAdaptiveView = (defaultStyle: ViewStyle | CSSProperties) => {
  return forwardRef<any, AdaptiveViewProps>((props, ref) => {
    const mergedStyle = {
      ...defaultStyle,
      ...props.style,
    };
    
    return (
      <AdaptiveView
        {...props}
        ref={ref}
        style={mergedStyle}
      />
    );
  });
};

// 常用的預設樣式變體
export const FlexView = createStyledAdaptiveView({
  display: 'flex',
});

export const CenterView = createStyledAdaptiveView({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

export const RowView = createStyledAdaptiveView({
  display: 'flex',
  flexDirection: 'row',
});

export const ColumnView = createStyledAdaptiveView({
  display: 'flex',
  flexDirection: 'column',
});

export const ScrollView = createStyledAdaptiveView({
  overflow: 'auto',
});

// 響應式容器
export const ResponsiveView = forwardRef<any, AdaptiveViewProps & {
  mobileStyle?: ViewStyle | CSSProperties;
  tabletStyle?: ViewStyle | CSSProperties;
  desktopStyle?: ViewStyle | CSSProperties;
}>((props, ref) => {
  const { mobileStyle, tabletStyle, desktopStyle, style, ...restProps } = props;
  const platformAdapter = PlatformAdapter.getInstance();
  
  let responsiveStyle = style || {};
  
  if (platformAdapter.isWeb) {
    // 在 Web 環境中根據螢幕尺寸選擇樣式
    if (platformAdapter.isMobile && mobileStyle) {
      responsiveStyle = { ...responsiveStyle, ...mobileStyle };
    } else if (platformAdapter.isTablet && tabletStyle) {
      responsiveStyle = { ...responsiveStyle, ...tabletStyle };
    } else if (platformAdapter.isDesktop && desktopStyle) {
      responsiveStyle = { ...responsiveStyle, ...desktopStyle };
    }
  }
  
  return (
    <AdaptiveView
      {...restProps}
      ref={ref}
      style={responsiveStyle}
    />
  );
});

ResponsiveView.displayName = 'ResponsiveView';