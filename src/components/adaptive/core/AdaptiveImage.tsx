/**
 * AdaptiveImage - 跨平台統一圖片元件
 * 提供一致的圖片載入、尺寸調整和錯誤處理
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { ViewStyle, ImageStyle } from 'react-native';
import type { CSSProperties } from 'react';
import { PlatformAdapter } from '../platform/PlatformAdapter';
import { DesignSystem } from '../../../theme/designSystem';
import AdaptiveView from './AdaptiveView';

// 圖片載入狀態
export type ImageLoadState = 'idle' | 'loading' | 'loaded' | 'error';

// 圖片縮放模式
export type ImageResizeMode = 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';

// AdaptiveImage 屬性介面
export interface AdaptiveImageProps {
  source?: string | { uri: string } | number;
  src?: string; // Web 優先
  uri?: string; // Native 優先
  alt?: string;
  width?: number | string;
  height?: number | string;
  resizeMode?: ImageResizeMode;
  
  // 樣式
  style?: ImageStyle | CSSProperties;
  webStyle?: CSSProperties;
  nativeStyle?: ImageStyle;
  containerStyle?: ViewStyle | CSSProperties;
  
  // 載入狀態處理
  placeholder?: React.ReactNode;
  errorComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  
  // 行為
  onLoad?: () => void;
  onError?: (error?: any) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  
  // Web 特有
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  crossOrigin?: 'anonymous' | 'use-credentials';
  decoding?: 'async' | 'sync' | 'auto';
  loading?: 'eager' | 'lazy';
  
  // Native 特有
  onPress?: () => void;
  onLongPress?: () => void;
  blurRadius?: number;
  
  // 無障礙
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  
  // HTML 屬性
  className?: string;
  id?: string;
  title?: string;
  role?: string;
  
  // 其他屬性透傳
  [key: string]: any;
}

// 預設佔位符元件
const DefaultPlaceholder: React.FC<{ width?: number | string; height?: number | string }> = ({ 
  width = '100%', 
  height = 200 
}) => (
  <AdaptiveView
    style={{
      width,
      height,
      backgroundColor: DesignSystem.colors.gray[100],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: DesignSystem.borderRadius.md,
    }}
  >
    <div style={{
      color: DesignSystem.colors.text.tertiary,
      fontSize: DesignSystem.typography.caption.fontSize,
    }}>
      📷
    </div>
  </AdaptiveView>
);

// 預設錯誤元件
const DefaultErrorComponent: React.FC<{ width?: number | string; height?: number | string }> = ({ 
  width = '100%', 
  height = 200 
}) => (
  <AdaptiveView
    style={{
      width,
      height,
      backgroundColor: DesignSystem.colors.gray[100],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: DesignSystem.borderRadius.md,
      borderWidth: 1,
      borderColor: DesignSystem.colors.border.light,
      borderStyle: 'dashed',
    }}
  >
    <div style={{
      color: DesignSystem.colors.text.secondary,
      fontSize: DesignSystem.typography.caption.fontSize,
      textAlign: 'center' as const,
    }}>
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>⚠️</div>
      圖片載入失敗
    </div>
  </AdaptiveView>
);

// 預設載入元件
const DefaultLoadingComponent: React.FC<{ width?: number | string; height?: number | string }> = ({ 
  width = '100%', 
  height = 200 
}) => (
  <AdaptiveView
    style={{
      width,
      height,
      backgroundColor: DesignSystem.colors.gray[50],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: DesignSystem.borderRadius.md,
    }}
  >
    <div style={{
      color: DesignSystem.colors.text.tertiary,
      fontSize: DesignSystem.typography.caption.fontSize,
      animation: 'pulse 1.5s infinite',
    }}>
      載入中...
    </div>
  </AdaptiveView>
);

// Web 實現
const WebImage = forwardRef<HTMLImageElement, AdaptiveImageProps>(
  ({
    source,
    src,
    uri,
    alt = '',
    width,
    height,
    resizeMode = 'cover',
    style,
    webStyle,
    containerStyle,
    placeholder,
    errorComponent,
    loadingComponent,
    onLoad,
    onError,
    onLoadStart,
    onLoadEnd,
    onClick,
    onMouseEnter,
    onMouseLeave,
    crossOrigin,
    decoding,
    loading,
    className = '',
    testID,
    accessible,
    accessibilityLabel,
    title,
    role,
    ...props
  }, ref) => {
    const [loadState, setLoadState] = useState<ImageLoadState>('idle');
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    
    // 解析圖片來源
    const imageSrc = useMemo(() => {
      if (src) return src;
      if (uri) return uri;
      if (typeof source === 'string') return source;
      if (typeof source === 'object' && source && 'uri' in source) return source.uri;
      if (typeof source === 'number') return source.toString();
      return '';
    }, [source, src, uri]);
    
    // 容器樣式
    const containerStyleFinal = useMemo(() => {
      let finalStyle: CSSProperties = {
        position: 'relative',
        display: 'inline-block',
        width,
        height,
      };
      
      if (containerStyle) {
        const convertedStyle = styleAdapter.adaptStyle(containerStyle as any);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      return finalStyle;
    }, [containerStyle, styleAdapter, width, height]);
    
    // 圖片樣式
    const imageStyleFinal = useMemo(() => {
      let finalStyle: CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: resizeMode as any,
        display: 'block',
      };
      
      if (style) {
        const convertedStyle = styleAdapter.adaptStyle(style as any, webStyle);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      if (webStyle) {
        finalStyle = { ...finalStyle, ...webStyle };
      }
      
      return finalStyle;
    }, [style, webStyle, styleAdapter, resizeMode]);
    
    // 事件處理
    const handleLoadStart = useCallback(() => {
      setLoadState('loading');
      onLoadStart?.();
    }, [onLoadStart]);
    
    const handleLoad = useCallback(() => {
      setLoadState('loaded');
      onLoad?.();
      onLoadEnd?.();
    }, [onLoad, onLoadEnd]);
    
    const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setLoadState('error');
      onError?.(event);
      onLoadEnd?.();
    }, [onError, onLoadEnd]);
    
    // 根據載入狀態渲染不同內容
    const renderContent = () => {
      switch (loadState) {
        case 'loading':
          return loadingComponent || <DefaultLoadingComponent width={width} height={height} />;
        case 'error':
          return errorComponent || <DefaultErrorComponent width={width} height={height} />;
        case 'loaded':
          return (
            <img
              ref={ref}
              src={imageSrc}
              alt={alt}
              style={imageStyleFinal}
              onLoad={handleLoad}
              onError={handleError}
              onClick={onClick}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              crossOrigin={crossOrigin}
              decoding={decoding}
              loading={loading}
              data-testid={testID}
              aria-label={accessibilityLabel || alt}
              title={title}
              role={role}
              {...props}
            />
          );
        case 'idle':
        default:
          if (!imageSrc) {
            return placeholder || <DefaultPlaceholder width={width} height={height} />;
          }
          
          // 開始載入圖片
          setTimeout(() => handleLoadStart(), 0);
          
          return (
            <>
              {loadingComponent || <DefaultLoadingComponent width={width} height={height} />}
              <img
                ref={ref}
                src={imageSrc}
                alt={alt}
                style={{ ...imageStyleFinal, opacity: 0, position: 'absolute' }}
                onLoad={handleLoad}
                onError={handleError}
                crossOrigin={crossOrigin}
                decoding={decoding}
                loading={loading}
                {...props}
              />
            </>
          );
      }
    };
    
    return (
      <div className={className} style={containerStyleFinal}>
        {renderContent()}
      </div>
    );
  }
);

// Native 實現
const NativeImage = forwardRef<any, AdaptiveImageProps>(
  ({
    source,
    src,
    uri,
    alt,
    width,
    height,
    resizeMode = 'cover',
    style,
    nativeStyle,
    containerStyle,
    placeholder,
    errorComponent,
    loadingComponent,
    onLoad,
    onError,
    onLoadStart,
    onLoadEnd,
    onPress,
    onLongPress,
    blurRadius,
    testID,
    accessible,
    accessibilityLabel,
    accessibilityHint,
    ...props
  }, ref) => {
    const [loadState, setLoadState] = useState<ImageLoadState>('idle');
    const { Image, TouchableOpacity } = require('react-native');
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    
    // 解析圖片來源
    const imageSource = useMemo(() => {
      if (uri) return { uri };
      if (src) return { uri: src };
      if (typeof source === 'string') return { uri: source };
      if (typeof source === 'object' && source) return source;
      if (typeof source === 'number') return source;
      return null;
    }, [source, src, uri]);
    
    // 容器樣式
    const containerStyleFinal = useMemo(() => {
      let finalStyle = {
        width,
        height,
        position: 'relative' as const,
      };
      
      if (containerStyle) {
        const convertedStyle = styleAdapter.adaptStyle(containerStyle as any);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      return finalStyle;
    }, [containerStyle, styleAdapter, width, height]);
    
    // 圖片樣式
    const imageStyleFinal = useMemo(() => {
      let finalStyle = {
        width: '100%',
        height: '100%',
        ...style,
      };
      
      if (nativeStyle) {
        finalStyle = { ...finalStyle, ...nativeStyle };
      }
      
      return styleAdapter.adaptStyle(finalStyle);
    }, [style, nativeStyle, styleAdapter]);
    
    // 事件處理
    const handleLoadStart = useCallback(() => {
      setLoadState('loading');
      onLoadStart?.();
    }, [onLoadStart]);
    
    const handleLoad = useCallback(() => {
      setLoadState('loaded');
      onLoad?.();
      onLoadEnd?.();
    }, [onLoad, onLoadEnd]);
    
    const handleError = useCallback((error: any) => {
      setLoadState('error');
      onError?.(error);
      onLoadEnd?.();
    }, [onError, onLoadEnd]);
    
    // 根據載入狀態渲染不同內容
    const renderContent = () => {
      switch (loadState) {
        case 'loading':
          return loadingComponent || <DefaultLoadingComponent width={width} height={height} />;
        case 'error':
          return errorComponent || <DefaultErrorComponent width={width} height={height} />;
        case 'loaded':
        case 'idle':
        default:
          if (!imageSource) {
            return placeholder || <DefaultPlaceholder width={width} height={height} />;
          }
          
          return (
            <Image
              ref={ref}
              source={imageSource}
              style={imageStyleFinal}
              resizeMode={resizeMode}
              blurRadius={blurRadius}
              onLoadStart={handleLoadStart}
              onLoad={handleLoad}
              onError={handleError}
              testID={testID}
              accessible={accessible !== false}
              accessibilityLabel={accessibilityLabel || alt}
              accessibilityHint={accessibilityHint}
              {...props}
            />
          );
      }
    };
    
    const imageContent = renderContent();
    
    // 如果有觸控事件，包裝在 TouchableOpacity 中
    if (onPress || onLongPress) {
      return (
        <AdaptiveView style={containerStyleFinal}>
          <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ width: '100%', height: '100%' }}
          >
            {imageContent}
          </TouchableOpacity>
        </AdaptiveView>
      );
    }
    
    return (
      <AdaptiveView style={containerStyleFinal}>
        {imageContent}
      </AdaptiveView>
    );
  }
);

// 主要 AdaptiveImage 元件
export const AdaptiveImage = forwardRef<any, AdaptiveImageProps>((props, ref) => {
  const platformAdapter = PlatformAdapter.getInstance();
  
  if (platformAdapter.isWeb) {
    return <WebImage {...props} ref={ref} />;
  } else {
    return <NativeImage {...props} ref={ref} />;
  }
});

// 設定顯示名稱
AdaptiveImage.displayName = 'AdaptiveImage';
WebImage.displayName = 'AdaptiveImage.Web';
NativeImage.displayName = 'AdaptiveImage.Native';

// 預設匯出
export default AdaptiveImage;

// 特殊類型的圖片元件
export const Avatar = forwardRef<any, AdaptiveImageProps & { size?: number }>((props, ref) => {
  const { size = 40, ...rest } = props;
  
  return (
    <AdaptiveImage
      {...rest}
      ref={ref}
      width={size}
      height={size}
      style={{
        borderRadius: size / 2,
        ...props.style,
      }}
      resizeMode="cover"
    />
  );
});

export const Logo = forwardRef<any, AdaptiveImageProps>((props, ref) => (
  <AdaptiveImage
    {...props}
    ref={ref}
    resizeMode="contain"
    style={{
      maxWidth: '100%',
      height: 'auto',
      ...props.style,
    }}
  />
));

export const Thumbnail = forwardRef<any, AdaptiveImageProps & { size?: number }>((props, ref) => {
  const { size = 80, ...rest } = props;
  
  return (
    <AdaptiveImage
      {...rest}
      ref={ref}
      width={size}
      height={size}
      style={{
        borderRadius: DesignSystem.borderRadius.sm,
        ...props.style,
      }}
      resizeMode="cover"
    />
  );
});

export const BackgroundImage = forwardRef<any, AdaptiveImageProps>((props, ref) => (
  <AdaptiveImage
    {...props}
    ref={ref}
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      ...props.style,
    }}
    resizeMode="cover"
  />
));

// 設定顯示名稱
Avatar.displayName = 'Avatar';
Logo.displayName = 'Logo';
Thumbnail.displayName = 'Thumbnail';
BackgroundImage.displayName = 'BackgroundImage';