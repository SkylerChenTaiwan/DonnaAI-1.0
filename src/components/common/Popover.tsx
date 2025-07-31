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
  ScrollView,
} from 'react-native';

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
  minWidth = 320,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible && anchor.current) {
      // 測量錨點元素的位置
      anchor.current.measureInWindow((x: number, y: number, width: number, height: number) => {
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

        // 水平位置調整
        if (popX + minWidth > windowDimensions.width - 20) {
          popX = windowDimensions.width - minWidth - 20;
        }

        setPosition({ x: popX, y: popY });
        setActualPlacement(finalPlacement);
      });
    }

    // 動畫
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, anchor, placement, offset, maxHeight, minWidth]);

  if (Platform.OS === 'web') {
    // Web 平台使用絕對定位
    if (!visible) return null;

    return (
      <>
        {/* 點擊外部關閉的透明遮罩 */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={{
              position: 'fixed' as any,
              inset: 0,
              zIndex: 999,
            }}
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
              transform: [{ scale: scaleAnim }],
              maxHeight,
              minWidth,
            },
          ]}
        >
          {showArrow && (
            <View
              style={[
                styles.arrow,
                actualPlacement === 'bottom' ? styles.arrowTop : styles.arrowBottom,
              ]}
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
                  transform: [{ scale: scaleAnim }],
                  maxHeight,
                  minWidth,
                },
              ]}
            >
              {showArrow && (
                <View
                  style={[
                    styles.arrow,
                    actualPlacement === 'bottom' ? styles.arrowTop : styles.arrowBottom,
                  ]}
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
    backgroundColor: 'transparent',
  },
  popoverContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  arrow: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }],
    zIndex: -1,
  },
  arrowTop: {
    top: -6,
    left: 20,
    shadowColor: '#000',
    shadowOffset: { width: -1, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  arrowBottom: {
    bottom: -6,
    left: 20,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});