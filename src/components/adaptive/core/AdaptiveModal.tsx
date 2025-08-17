/**
 * AdaptiveModal - 跨平台統一模態框元件
 * 提供一致的模態框體驗和完整的互動控制
 */

import React, { forwardRef, useMemo, useCallback, useEffect } from 'react';
import './AdaptiveModal.css'; // 匯入專用樣式以確保正確顯示
import type { ViewStyle } from 'react-native';
import type { CSSProperties } from 'react';
import { PlatformAdapter } from '../platform/PlatformAdapter';
import { DesignSystem } from '../../../theme/designSystem';
import { StylePriority } from '../styles/types';
import type { StyleConfig } from '../styles/types';
import AdaptiveView from './AdaptiveView';
import AdaptiveText from './AdaptiveText';
import AdaptiveButton from './AdaptiveButton';

// 模態框大小
export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';

// 模態框動畫類型
export type ModalAnimationType = 'slide' | 'fade' | 'none';

// 模態框位置
export type ModalPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

// AdaptiveModal 屬性介面
export interface AdaptiveModalProps {
  visible?: boolean;
  onClose?: () => void;
  onShow?: () => void;
  onDismiss?: () => void;
  
  // 內容
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  
  // 樣式和佈局
  size?: ModalSize;
  position?: ModalPosition;
  animationType?: ModalAnimationType;
  style?: ViewStyle | CSSProperties;
  webStyle?: CSSProperties;
  nativeStyle?: ViewStyle;
  overlayStyle?: ViewStyle | CSSProperties;
  contentStyle?: ViewStyle | CSSProperties;
  headerStyle?: ViewStyle | CSSProperties;
  
  // 行為設定
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventScroll?: boolean;
  
  // 客製化按鈕
  primaryButton?: {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryButton?: {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    disabled?: boolean;
    loading?: boolean;
  };
  
  // Web 特有
  portal?: boolean;
  portalTarget?: Element;
  className?: string;
  
  // Native 特有
  presentationStyle?: 'pageSheet' | 'formSheet' | 'fullScreen' | 'overFullScreen';
  transparent?: boolean;
  hardwareAccelerated?: boolean;
  statusBarTranslucent?: boolean;
  
  // 無障礙
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  
  // 其他屬性透傳
  [key: string]: any;
}

// 模態框尺寸配置
const getModalDimensions = (size: ModalSize) => {
  switch (size) {
    case 'small':
      return { maxWidth: 400, width: '90%' };
    case 'medium':
      return { maxWidth: 600, width: '90%' };
    case 'large':
      return { maxWidth: 900, width: '95%', minHeight: '70vh' };
    case 'fullscreen':
      // 修正：不設定固定高度，讓內容決定高度，但限制最大高度
      return { width: '95vw', maxWidth: '95vw', maxHeight: '95vh' };
    default:
      return { maxWidth: 600, width: '90%' };
  }
};

// 注意：已移除 WebPortal 實現，改用 React Native Modal

// Web 實現 - 使用 React Native Modal
const WebModal = forwardRef<any, AdaptiveModalProps>(
  ({
    visible = false,
    onClose,
    onShow,
    onDismiss,
    children,
    title,
    subtitle,
    size = 'medium',
    position = 'center',
    animationType = 'fade',
    style,
    webStyle,
    overlayStyle,
    contentStyle,
    headerStyle,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    preventScroll = true,
    primaryButton,
    secondaryButton,
    portal = true, // 保留參數但不使用
    portalTarget, // 保留參數但不使用
    className = '',
    testID,
    accessible,
    accessibilityLabel,
    accessibilityRole,
    ...props
  }, ref) => {
    const { Modal, View, TouchableOpacity, SafeAreaView } = require('react-native');
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    const styleProcessor = platformAdapter.getStyleProcessor();
    
    // 處理 ESC 鍵關閉
    useEffect(() => {
      if (!visible || !closeOnEscape) return;
      
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose?.();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [visible, closeOnEscape, onClose]);
    
    // 防止背景滾動 - 強化版本
    useEffect(() => {
      if (!visible || !preventScroll) return;
      
      // 添加 modal-open 類別以便 CSS 控制
      document.body.classList.add('modal-open');
      
      // 備用樣式設定
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const originalHeight = document.body.style.height;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      return () => {
        // 清理類別和樣式
        document.body.classList.remove('modal-open');
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        document.body.style.height = originalHeight;
      };
    }, [visible, preventScroll]);
    
    // 顯示/隱藏回調
    useEffect(() => {
      if (visible) {
        onShow?.();
      } else {
        onDismiss?.();
      }
    }, [visible, onShow, onDismiss]);
    
    // 覆蓋層樣式 - 適配 React Native
    const overlayStyleFinal = useMemo(() => {
      let finalStyle = {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: position === 'center' ? 'center' : 
                       position === 'top' ? 'flex-start' : 
                       position === 'bottom' ? 'flex-end' : 'center',
        alignItems: position === 'left' ? 'flex-start' : 
                   position === 'right' ? 'flex-end' : 'center',
        padding: size === 'fullscreen' ? 0 : DesignSystem.spacing.md,
        zIndex: 10000,
      };
      
      if (overlayStyle) {
        const convertedStyle = styleAdapter.adaptStyle(overlayStyle);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      return finalStyle;
    }, [overlayStyle, styleAdapter, position, size]);
    
    // 內容樣式
    const contentStyleFinal = useMemo(() => {
      const dimensions = getModalDimensions(size);
      
      // 預設樣式 - 適配 React Native
      const defaultStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: size === 'fullscreen' ? 8 : DesignSystem.borderRadius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10, // Android shadow
        overflow: 'hidden' as const,
        position: 'relative' as const,
      };
      
      // 使用 StylePriorityManager 處理樣式優先級
      const styleConfigs: StyleConfig[] = [
        { 
          priority: StylePriority.DEFAULT, 
          style: defaultStyle,
          source: 'modal-defaults'
        },
        { 
          priority: StylePriority.SIZE_PRESET, 
          style: dimensions,
          source: `size-${size}`
        }
      ];
      
      // 添加用戶樣式
      if (style) {
        styleConfigs.push({
          priority: StylePriority.USER_STYLE,
          style: style as any,
          source: 'user-style'
        });
      }
      
      // 添加 Web 特定樣式
      if (webStyle) {
        styleConfigs.push({
          priority: StylePriority.PLATFORM_STYLE,
          style: webStyle,
          source: 'web-style'
        });
      }
      
      // 添加內容樣式
      if (contentStyle) {
        // 開發模式下檢查衝突
        if (typeof __DEV__ !== 'undefined' && __DEV__ && size === 'fullscreen') {
          const protectedProps = ['width', 'height', 'maxWidth', 'maxHeight', 'minHeight'];
          const conflictingProps = protectedProps.filter(
            prop => (contentStyle as any)[prop] !== undefined
          );
          
          if (conflictingProps.length > 0) {
            console.warn(
              `⚠️ AdaptiveModal: contentStyle 嘗試覆蓋 size="fullscreen" 的屬性: ${conflictingProps.join(', ')}。`,
              `這些屬性將被忽略以保持 fullscreen 效果。`
            );
          }
        }
        
        styleConfigs.push({
          priority: StylePriority.CONTENT_STYLE,
          style: contentStyle as any,
          source: 'content-style'
        });
      }
      
      // 如果是 fullscreen，保護尺寸屬性
      if (size === 'fullscreen') {
        const protectedProps = ['width', 'height', 'maxWidth', 'maxHeight', 'minHeight'];
        const protectedConfig = styleProcessor.protectProperties(
          dimensions,
          protectedProps,
          StylePriority.PROTECTED_SIZE
        );
        styleConfigs.push(protectedConfig);
      }
      
      // 合併樣式
      const result = styleProcessor.mergeStyles(styleConfigs, {
        platform: 'web',
        debug: false
      });
      
      return result.style;
    }, [style, webStyle, contentStyle, styleProcessor, size, visible, animationType]);
    
    // 標題區域樣式
    const headerStyleFinal = useMemo(() => {
      let finalStyle = {
        padding: DesignSystem.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: DesignSystem.colors.border.light,
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const
      };
      
      if (headerStyle) {
        const convertedStyle = styleAdapter.adaptStyle(headerStyle);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      return finalStyle;
    }, [headerStyle, styleAdapter]);
    
    // 處理覆蓋層點擊
    const handleOverlayPress = useCallback(() => {
      if (closeOnOverlayClick) {
        onClose?.();
      }
    }, [closeOnOverlayClick, onClose]);
    
    // 渲染按鈕區域
    const renderButtons = () => {
      if (!primaryButton && !secondaryButton) return null;
      
      return (
        <View style={{
          padding: DesignSystem.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: DesignSystem.colors.border.light,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: DesignSystem.spacing.md
        }}>
          {secondaryButton && (
            <AdaptiveButton
              variant={secondaryButton.variant || 'outline'}
              onPress={secondaryButton.onPress}
              disabled={secondaryButton.disabled}
              loading={secondaryButton.loading}
            >
              {secondaryButton.title}
            </AdaptiveButton>
          )}
          {primaryButton && (
            <AdaptiveButton
              variant={primaryButton.variant || 'primary'}
              onPress={primaryButton.onPress}
              disabled={primaryButton.disabled}
              loading={primaryButton.loading}
            >
              {primaryButton.title}
            </AdaptiveButton>
          )}
        </View>
      );
    };
    
    // 使用 React Native Modal
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType={animationType}
        onShow={onShow}
        onDismiss={onDismiss}
        onRequestClose={onClose}
        {...props}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <TouchableOpacity
            style={overlayStyleFinal}
            activeOpacity={1}
            onPress={handleOverlayPress}
          >
            <TouchableOpacity 
              activeOpacity={1}
              style={contentStyleFinal}
              onPress={(e) => e.stopPropagation()}
            >
              <View ref={ref}>
                {(title || subtitle || showCloseButton) && (
                  <View style={headerStyleFinal}>
                    <View>
                      {title && (
                        <AdaptiveText variant="h3" style={{ marginBottom: 4 }}>
                          {title}
                        </AdaptiveText>
                      )}
                      {subtitle && (
                        <AdaptiveText variant="bodySmall" color="secondary">
                          {subtitle}
                        </AdaptiveText>
                      )}
                    </View>
                    
                    {showCloseButton && (
                      <TouchableOpacity
                        onPress={onClose}
                        style={{ padding: 4 }}
                      >
                        <AdaptiveText style={{
                          fontSize: 20,
                          color: DesignSystem.colors.text.secondary
                        }}>
                          ×
                        </AdaptiveText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                
                <View style={{
                  flex: 1,
                  padding: size === 'fullscreen' ? 0 : DesignSystem.spacing.lg
                }}>
                  {children}
                </View>
                
                {renderButtons()}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }
);

// Native 實現
const NativeModal = forwardRef<any, AdaptiveModalProps>(
  ({
    visible = false,
    onClose,
    onShow,
    onDismiss,
    children,
    title,
    subtitle,
    size = 'medium',
    animationType = 'slide',
    style,
    nativeStyle,
    overlayStyle,
    contentStyle,
    headerStyle,
    closeOnOverlayClick = true,
    showCloseButton = true,
    primaryButton,
    secondaryButton,
    presentationStyle,
    transparent = true,
    hardwareAccelerated,
    statusBarTranslucent,
    testID,
    accessible,
    accessibilityLabel,
    ...props
  }, ref) => {
    const { Modal, ScrollView, TouchableOpacity, SafeAreaView } = require('react-native');
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    const styleProcessor = platformAdapter.getStyleProcessor();
    
    // 覆蓋層樣式
    const overlayStyleFinal = useMemo(() => {
      let finalStyle = {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        padding: size === 'fullscreen' ? 0 : DesignSystem.spacing.md };
      
      if (overlayStyle) {
        const convertedStyle = styleAdapter.adaptStyle(overlayStyle);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      return finalStyle;
    }, [overlayStyle, styleAdapter, size]);
    
    // 內容樣式
    const contentStyleFinal = useMemo(() => {
      const dimensions = getModalDimensions(size);
      
      // 預設樣式
      const defaultStyle = {
        backgroundColor: DesignSystem.colors.background.card,
        borderRadius: size === 'fullscreen' ? 0 : DesignSystem.borderRadius.lg,
        maxHeight: size === 'fullscreen' ? '100%' : '90%',
        overflow: 'hidden' as const
      };
      
      // 使用 StylePriorityManager 處理樣式優先級
      const styleConfigs: StyleConfig[] = [
        { 
          priority: StylePriority.DEFAULT, 
          style: defaultStyle,
          source: 'modal-defaults'
        },
        { 
          priority: StylePriority.SIZE_PRESET, 
          style: dimensions,
          source: `size-${size}`
        }
      ];
      
      // 添加用戶樣式
      if (style) {
        styleConfigs.push({
          priority: StylePriority.USER_STYLE,
          style: style,
          source: 'user-style'
        });
      }
      
      // 添加 Native 特定樣式
      if (nativeStyle) {
        styleConfigs.push({
          priority: StylePriority.PLATFORM_STYLE,
          style: nativeStyle,
          source: 'native-style'
        });
      }
      
      // 添加內容樣式
      if (contentStyle) {
        // 開發模式下檢查衝突
        if ((typeof __DEV__ !== 'undefined' && __DEV__) && size === 'fullscreen') {
          const protectedProps = ['width', 'height', 'maxWidth', 'maxHeight', 'minHeight'];
          const conflictingProps = protectedProps.filter(
            prop => (contentStyle as any)[prop] !== undefined
          );
          
          if (conflictingProps.length > 0) {
            console.warn(
              `⚠️ AdaptiveModal: contentStyle 嘗試覆蓋 size="fullscreen" 的屬性: ${conflictingProps.join(', ')}。`,
              `這些屬性將被忽略以保持 fullscreen 效果。`
            );
          }
        }
        
        styleConfigs.push({
          priority: StylePriority.CONTENT_STYLE,
          style: contentStyle,
          source: 'content-style'
        });
      }
      
      // 如果是 fullscreen，保護尺寸屬性
      if (size === 'fullscreen') {
        const protectedProps = ['width', 'height', 'maxWidth', 'maxHeight', 'minHeight'];
        const protectedConfig = styleProcessor.protectProperties(
          dimensions,
          protectedProps,
          StylePriority.PROTECTED_SIZE
        );
        styleConfigs.push(protectedConfig);
      }
      
      // 合併樣式
      const result = styleProcessor.mergeStyles(styleConfigs, {
        platform: 'native',
        debug: (typeof __DEV__ !== 'undefined' && __DEV__) || false
      });
      
      return result.style;
    }, [style, nativeStyle, contentStyle, styleProcessor, size]);
    
    // 標題區域樣式
    const headerStyleFinal = useMemo(() => {
      let finalStyle = {
        padding: DesignSystem.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: DesignSystem.colors.border.light,
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const };
      
      if (headerStyle) {
        const convertedStyle = styleAdapter.adaptStyle(headerStyle);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      return finalStyle;
    }, [headerStyle, styleAdapter]);
    
    // 處理覆蓋層點擊
    const handleOverlayPress = useCallback(() => {
      if (closeOnOverlayClick) {
        onClose?.();
      }
    }, [closeOnOverlayClick, onClose]);
    
    // 渲染按鈕區域
    const renderButtons = () => {
      if (!primaryButton && !secondaryButton) return null;
      
      return (
        <AdaptiveView style={{
          padding: DesignSystem.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: DesignSystem.colors.border.light,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: DesignSystem.spacing.md }}>
          {secondaryButton && (
            <AdaptiveButton
              variant={secondaryButton.variant || 'outline'}
              onPress={secondaryButton.onPress}
              disabled={secondaryButton.disabled}
              loading={secondaryButton.loading}
            >
              {secondaryButton.title}
            </AdaptiveButton>
          )}
          {primaryButton && (
            <AdaptiveButton
              variant={primaryButton.variant || 'primary'}
              onPress={primaryButton.onPress}
              disabled={primaryButton.disabled}
              loading={primaryButton.loading}
            >
              {primaryButton.title}
            </AdaptiveButton>
          )}
        </AdaptiveView>
      );
    };
    
    return (
      <Modal
        visible={visible}
        animationType={animationType}
        transparent={transparent}
        presentationStyle={presentationStyle}
        hardwareAccelerated={hardwareAccelerated}
        statusBarTranslucent={statusBarTranslucent}
        onShow={onShow}
        onDismiss={onDismiss}
        onRequestClose={onClose}
        {...props}
      >
        <SafeAreaView style={overlayStyleFinal}>
          <TouchableOpacity
            style={{ flex: 1, width: '100%' }}
            activeOpacity={1}
            onPress={handleOverlayPress}
          >
            <AdaptiveView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <TouchableOpacity activeOpacity={1} style={contentStyleFinal}>
                <AdaptiveView ref={ref}>
                  {(title || subtitle || showCloseButton) && (
                    <AdaptiveView style={headerStyleFinal}>
                      <AdaptiveView>
                        {title && (
                          <AdaptiveText variant="h3" style={{ marginBottom: 4 }}>
                            {title}
                          </AdaptiveText>
                        )}
                        {subtitle && (
                          <AdaptiveText variant="bodySmall" color="secondary">
                            {subtitle}
                          </AdaptiveText>
                        )}
                      </AdaptiveView>
                      
                      {showCloseButton && (
                        <TouchableOpacity
                          onPress={onClose}
                          style={{ padding: 4 }}
                        >
                          <AdaptiveText style={{
                            fontSize: 20,
                            color: DesignSystem.colors.text.secondary }}>
                            ×
                          </AdaptiveText>
                        </TouchableOpacity>
                      )}
                    </AdaptiveView>
                  )}
                  
                  <ScrollView 
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: DesignSystem.spacing.lg }}
                    testID={testID}
                    accessible={accessible !== false}
                    accessibilityLabel={accessibilityLabel}
                  >
                    {children}
                  </ScrollView>
                  
                  {renderButtons()}
                </AdaptiveView>
              </TouchableOpacity>
            </AdaptiveView>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }
);

// 主要 AdaptiveModal 元件
export const AdaptiveModal = forwardRef<any, AdaptiveModalProps>((props, ref) => {
  const platformAdapter = PlatformAdapter.getInstance();
  
  if (platformAdapter.isWeb) {
    return <WebModal {...props} ref={ref} />;
  } else {
    return <NativeModal {...props} ref={ref} />;
  }
});

// 設定顯示名稱
AdaptiveModal.displayName = 'AdaptiveModal';
WebModal.displayName = 'AdaptiveModal.Web';
NativeModal.displayName = 'AdaptiveModal.Native';

// 預設匯出
export default AdaptiveModal;

// 特殊類型的模態框元件
export const ConfirmModal = forwardRef<any, AdaptiveModalProps & {
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}>((props, ref) => {
  const {
    onConfirm,
    onCancel,
    confirmText = '確認',
    cancelText = '取消',
    onClose,
    ...rest
  } = props;
  
  const handleConfirm = useCallback(() => {
    onConfirm?.();
    onClose?.();
  }, [onConfirm, onClose]);
  
  const handleCancel = useCallback(() => {
    onCancel?.();
    onClose?.();
  }, [onCancel, onClose]);
  
  return (
    <AdaptiveModal
      {...rest}
      ref={ref}
      onClose={handleCancel}
      primaryButton={{
        title: confirmText,
        onPress: handleConfirm,
        variant: 'primary' }}
      secondaryButton={{
        title: cancelText,
        onPress: handleCancel,
        variant: 'outline' }}
    />
  );
});

export const AlertModal = forwardRef<any, AdaptiveModalProps & {
  onOK?: () => void;
  okText?: string;
}>((props, ref) => {
  const { onOK, okText = '確定', onClose, ...rest } = props;
  
  const handleOK = useCallback(() => {
    onOK?.();
    onClose?.();
  }, [onOK, onClose]);
  
  return (
    <AdaptiveModal
      {...rest}
      ref={ref}
      onClose={handleOK}
      primaryButton={{
        title: okText,
        onPress: handleOK,
        variant: 'primary' }}
      showCloseButton={false}
    />
  );
});

// 設定顯示名稱
ConfirmModal.displayName = 'ConfirmModal';
AlertModal.displayName = 'AlertModal';