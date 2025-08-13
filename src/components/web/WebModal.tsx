/**
 * Web 專用 Modal 包裝元件
 * 為 Web 端的 Modal 頁面提供關閉按鈕和 ESC 鍵關閉功能
 */

import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { useNavigation } from '@react-navigation/native';
import { isWebPlatform } from '@/utils/web-detector';
import { DesignSystem } from '@/theme/designSystem';

interface WebModalProps {
  children: React.ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export const WebModal: React.FC<WebModalProps> = ({ 
  children, 
  showCloseButton = true,
  onClose
}) => {
  const navigation = useNavigation();
  
  // 處理關閉事件
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };
  
  // ESC 鍵關閉功能（Web 端專用）
  useEffect(() => {
    if (!isWebPlatform()) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // 非 Web 平台或不顯示關閉按鈕時，直接返回子元件
  if (!isWebPlatform() || !showCloseButton) {
    return <>{children}</>;
  }
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={handleClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="close" size={24} color="#1A1A1A" />
      </TouchableOpacity>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative' },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1000,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    // Web 專用陰影
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' },
      default: {
        shadowColor: '#000',
        ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }),
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4 } }) } });