/**
 * 通用 Popover 元件
 * 支援定位、動畫和點擊外部關閉
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Modal, 
  TouchableWithoutFeedback,
  Animated,
  Platform,
  Dimensions,
  StyleSheet,
  ScrollView } from 'react-native';

interface PopoverProps {
  visible: boolean;
  onClose: () => void;
  anchor: React.RefObject<any>;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  offset?: { x: number; y: number };
  showArrow?: boolean;
  maxHeight?: number;
  minWidth?: number;
}

export const Popover: React.FC<PopoverProps> = ({
  visible,
  onClose,
  anchor,
  children,
  placement = 'auto',
  offset = { x: 0, y: 8 },
  showArrow = true,
  maxHeight = 400,
  minWidth = 320 }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    console.log('🎯 Popover useEffect:', { visible, hasAnchor: !!anchor?.current });
    if (visible && anchor.current) {
      // Web 平台使用 getBoundingClientRect
      if (Platform.OS === 'web') {
        const element = anchor.current as HTMLElement;
        if (element && element.getBoundingClientRect) {
          const rect = element.getBoundingClientRect();
          console.log('📐 Web getBoundingClientRect:', rect);
          const windowDimensions = Dimensions.get('window');
          let popX = rect.left;
          let popY = rect.bottom + offset.y;
          let finalPlacement = placement;

          // 自動調整位置避免超出視窗
          if (placement === 'auto' || placement === 'bottom') {
            // 檢查是否有足夠空間在下方顯示
            if (popY + maxHeight > windowDimensions.height - 20) {
              // 嘗試顯示在上方
              popY = rect.top - maxHeight - offset.y;
              finalPlacement = 'top';
            } else {
              finalPlacement = 'bottom';
            }
          }

          // 水平位置調整 - 確保不會超出視窗
          if (popX + minWidth > windowDimensions.width - 20) {
            popX = windowDimensions.width - minWidth - 20;
          }
          
          // 確保不會超出左邊界
          if (popX < 20) {
            popX = 20;
          }

          setPosition({ x: popX, y: popY });
          setActualPlacement(finalPlacement);
        }
      } else {
        // Native 平台使用 measureInWindow
        console.log('📍 準備測量錨點位置');
        anchor.current.measureInWindow((x: number, y: number, width: number, height: number) => {
          console.log('📐 錨點測量結果:', { x, y, width, height });
          const windowDimensions = Dimensions.get('window');
          let popX = x;
          let popY = y + height + offset.y;
          let finalPlacement = placement;

          // 自動調整位置避免超出視窗
          if (placement === 'auto' || placement === 'bottom') {
            // 檢查是否有足夠空間在下方顯示
            if (popY + maxHeight > windowDimensions.height - 20) {
              // 嘗試顯示在上方
              popY = y - maxHeight - offset.y;
              finalPlacement = 'top';
            } else {
              finalPlacement = 'bottom';
            }
          }

          // 水平位置調整 - 確保不會超出視窗
          if (popX + minWidth > windowDimensions.width - 20) {
            popX = windowDimensions.width - minWidth - 20;
          }
          
          // 確保不會超出左邊界
          if (popX < 20) {
            popX = 20;
          }

          setPosition({ x: popX, y: popY });
          setActualPlacement(finalPlacement);
        });
      }
    }

    // 移除動畫，直接顯示/隱藏
    if (visible) {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
    }
  }, [visible, anchor, placement, offset, maxHeight, minWidth]);

  if (Platform.OS === 'web') {
    // Web 平台使用絕對定位
    if (!visible) return null;
    
    console.log('🌐 Popover Web 渲染模式', { position });

    return (
      <>
        {/* 點擊外部關閉的透明遮罩 */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={{
              position: 'fixed' as any,
              inset: 0,
              zIndex: 999 }}
          />
        </TouchableWithoutFeedback>

        {/* Popover 內容 */}
        <Animated.View
          style={[
            styles.popoverContainer,
            {
              position: 'fixed' as any,
              left: position.x,
              top: position.y,
              zIndex: 1000,
              opacity: fadeAnim,
              transform: Platform.OS === 'web' ? `scale(${scaleAnim})` : [{ scale: scaleAnim }],
              maxHeight,
              minWidth },
          ]}
        >
          {showArrow && (
            <View
              style={StyleSheet.flatten([
                styles.arrow,
                actualPlacement === 'bottom' ? styles.arrowTop : styles.arrowBottom,
              ])}
            />
          )}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </>
    );
  }

  // Native 實作使用 Modal
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.popoverContainer,
                {
                  position: 'absolute',
                  left: position.x,
                  top: position.y,
                  opacity: fadeAnim,
                  transform: Platform.OS === 'web' ? `scale(${scaleAnim})` : [{ scale: scaleAnim }],
                  maxHeight,
                  minWidth },
              ]}
            >
              {showArrow && (
                <View
                  style={StyleSheet.flatten([
                    styles.arrow,
                    actualPlacement === 'bottom' ? styles.arrowTop : styles.arrowBottom,
                  ])}
                />
              )}
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {children}
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent' },
  popoverContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }) }),
    shadowOpacity: 0.1,
    shadowRadius: 8,
    ...(Platform.OS === 'web' ? {} : { elevation: 5 }),
    overflow: 'hidden' },
  content: {
    flex: 1 },
  arrow: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    transform: Platform.OS === 'web' ? `rotate(45deg)` : [{ rotate: '45deg' }],
    zIndex: -1 },
  arrowTop: {
    top: -6,
    left: 20,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: -1, height: -1 } }),
    shadowOpacity: 0.1,
    shadowRadius: 2 },
  arrowBottom: {
    bottom: -6,
    left: 20,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 1, height: 1 } }) }),
    shadowOpacity: 0.1,
    shadowRadius: 2 } });