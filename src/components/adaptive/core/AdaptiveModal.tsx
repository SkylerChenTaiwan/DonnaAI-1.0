/**
 * AdaptiveModal - 跨平台統一模態框元件
 * 提供一致的模態框體驗和完整的互動控制
 */

import React, { forwardRef, useMemo, useCallback, useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import type { CSSProperties } from 'react';
import { PlatformAdapter } from '../platform/PlatformAdapter';
import { DesignSystem } from '../../../theme/designSystem';
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
      return { maxWidth: 800, width: '95%' };
    case 'fullscreen':
      return { width: '100%', height: '100%' };
    default:
      return { maxWidth: 600, width: '90%' };
  }
};

// Web Portal 實現
const WebPortal: React.FC<{ children: React.ReactNode; target?: Element }> = ({ 
  children, 
  target 
}) => {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  if (!mounted) return null;
  
  const portalTarget = target || document.body;
  return (window as any).ReactDOM?.createPortal(children, portalTarget) || children;
};

// Web 實現
const WebModal = forwardRef<HTMLDivElement, AdaptiveModalProps>(
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
    portal = true,
    portalTarget,
    className = '',
    testID,
    accessible,
    accessibilityLabel,
    accessibilityRole,
    ...props
  }, ref) => {
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    
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
    
    // 防止背景滾動
    useEffect(() => {
      if (!visible || !preventScroll) return;
      
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
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
    
    // 覆蓋層樣式
    const overlayStyleFinal = useMemo(() => {
      let finalStyle: CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: position === 'center' ? 'center' : 
                   position === 'top' ? 'flex-start' : 
                   position === 'bottom' ? 'flex-end' : 'center',
        justifyContent: position === 'left' ? 'flex-start' : 
                       position === 'right' ? 'flex-end' : 'center',
        zIndex: 1000,
        padding: size === 'fullscreen' ? 0 : DesignSystem.spacing.md,
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden',
        transition: animationType === 'fade' ? 'opacity 200ms ease-in-out' : 'none' };
      
      if (overlayStyle) {
        const convertedStyle = styleAdapter.adaptStyle(overlayStyle as any);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      return finalStyle;
    }, [overlayStyle, styleAdapter, visible, position, size, animationType]);
    
    // 內容樣式
    const contentStyleFinal = useMemo(() => {
      const dimensions = getModalDimensions(size);
      
      let finalStyle: CSSProperties = {
        backgroundColor: DesignSystem.colors.background.card,
        borderRadius: size === 'fullscreen' ? 0 : DesignSystem.borderRadius.lg,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: size === 'fullscreen' ? '100%' : '90vh',
        overflow: 'hidden',
        position: 'relative',
        transform: visible ? 'scale(1)' : 'scale(0.9)',
        transition: animationType === 'fade' ? 'transform 200ms ease-in-out' : 'none',
        ...dimensions };
      
      if (style) {
        const convertedStyle = styleAdapter.adaptStyle(style as any, webStyle);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      if (webStyle) {
        finalStyle = { ...finalStyle, ...webStyle };
      }
      
      if (contentStyle) {
        const convertedContentStyle = styleAdapter.adaptStyle(contentStyle as any);
        finalStyle = { ...finalStyle, ...convertedContentStyle };
      }
      
      return finalStyle;
    }, [style, webStyle, contentStyle, styleAdapter, size, visible, animationType]);
    
    // 標題區域樣式
    const headerStyleFinal = useMemo(() => {
      let finalStyle: CSSProperties = {
        padding: DesignSystem.spacing.lg,
        borderBottom: `1px solid ${DesignSystem.colors.border.light}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center' };
      
      if (headerStyle) {
        const convertedStyle = styleAdapter.adaptStyle(headerStyle as any);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      return finalStyle;
    }, [headerStyle, styleAdapter]);
    
    // 處理覆蓋層點擊
    const handleOverlayClick = useCallback((event: React.MouseEvent) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose?.();
      }
    }, [closeOnOverlayClick, onClose]);
    
    // 渲染按鈕區域
    const renderButtons = () => {
      if (!primaryButton && !secondaryButton) return null;
      
      return (
        <div style={{
          padding: DesignSystem.spacing.lg,
          borderTop: `1px solid ${DesignSystem.colors.border.light}`,
          display: 'flex',
          gap: DesignSystem.spacing.md,
          justifyContent: 'flex-end' }}>
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
        </div>
      );
    };
    
    const modalContent = (
      <div
        className={className}
        style={overlayStyleFinal}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-label={accessibilityLabel}
        data-testid={testID}
        {...props}
      >
        <div ref={ref} style={contentStyleFinal}>
          {(title || subtitle || showCloseButton) && (
            <div style={headerStyleFinal}>
              <div>
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
              </div>
              
              {showCloseButton && (
                <button
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: DesignSystem.colors.text.secondary,
                    padding: '4px' }}
                  aria-label="關閉"
                >
                  ×
                </button>
              )}
            </div>
          )}
          
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: DesignSystem.spacing.lg }}>
            {children}
          </div>
          
          {renderButtons()}
        </div>
      </div>
    );
    
    if (!visible) return null;
    
    return portal ? (
      <WebPortal target={portalTarget}>
        {modalContent}
      </WebPortal>
    ) : modalContent;
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
      
      let finalStyle = {
        backgroundColor: DesignSystem.colors.background.card,
        borderRadius: size === 'fullscreen' ? 0 : DesignSystem.borderRadius.lg,
        maxHeight: size === 'fullscreen' ? '100%' : '90%',
        overflow: 'hidden' as const,
        ...dimensions };
      
      if (style) {
        finalStyle = { ...finalStyle, ...style };
      }
      
      if (nativeStyle) {
        finalStyle = { ...finalStyle, ...nativeStyle };
      }
      
      if (contentStyle) {
        const convertedStyle = styleAdapter.adaptStyle(contentStyle);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      return styleAdapter.adaptStyle(finalStyle);
    }, [style, nativeStyle, contentStyle, styleAdapter, size]);
    
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