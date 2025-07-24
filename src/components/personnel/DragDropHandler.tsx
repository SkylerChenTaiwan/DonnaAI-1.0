/**
 * 拖放處理器元件 - 管理組織圖的拖放邏輯
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { OrgNode, DragDropEvent } from '@/types/organization';
import { DesignSystem } from '@/theme/designSystem';

interface DragDropHandlerProps {
  children: React.ReactNode;
  node: OrgNode;
  onDragStart?: (node: OrgNode) => void;
  onDragEnd?: (event: DragDropEvent) => void;
  onDrop?: (sourceNode: OrgNode, targetNode: OrgNode) => void;
  enabled?: boolean;
}

export function DragDropHandler({
  children,
  node,
  onDragStart,
  onDragEnd,
  onDrop,
  enabled = true,
}: DragDropHandlerProps) {
  // 動畫值
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const zIndex = useSharedValue(0);

  // 拖動開始
  const handleDragStart = useCallback(() => {
    'worklet';
    scale.value = withSpring(1.1);
    opacity.value = withSpring(0.9);
    zIndex.value = 1000;
    
    if (onDragStart) {
      runOnJS(onDragStart)(node);
    }
  }, [node, onDragStart, scale, opacity, zIndex]);

  // 拖動結束
  const handleDragEnd = useCallback((event: DragDropEvent) => {
    'worklet';
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    scale.value = withSpring(1);
    opacity.value = withSpring(1);
    zIndex.value = 0;
    
    if (onDragEnd) {
      runOnJS(onDragEnd)(event);
    }
  }, [onDragEnd, translateX, translateY, scale, opacity, zIndex]);

  // 創建手勢
  const dragGesture = Gesture.Pan()
    .enabled(enabled)
    .onStart(() => {
      handleDragStart();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const dropEvent: DragDropEvent = {
        sourceNode: node,
        targetNode: null, // TODO: 需要實作碰撞檢測
        position: {
          x: event.absoluteX,
          y: event.absoluteY,
        },
        translation: {
          x: event.translationX,
          y: event.translationY,
        },
      };
      handleDragEnd(dropEvent);
    });

  // 長按手勢（觸發拖動）
  const longPressGesture = Gesture.LongPress()
    .enabled(enabled)
    .minDuration(500)
    .onStart(() => {
      scale.value = withSpring(0.95);
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  // 組合手勢
  const composedGesture = Gesture.Simultaneous(
    longPressGesture,
    dragGesture
  );

  // 動畫樣式
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      zIndex: zIndex.value,
      // 添加陰影效果
      shadowOpacity: interpolate(scale.value, [1, 1.1], [0.1, 0.3]),
      shadowRadius: interpolate(scale.value, [1, 1.1], [4, 8]),
      elevation: interpolate(scale.value, [1, 1.1], [2, 10]),
    };
  });

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

// 拖放區域提供者 - 用於包裹整個組織圖
export function DragDropProvider({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={styles.provider}>
      {children}
    </GestureHandlerRootView>
  );
}

// 放置目標指示器
export function DropTarget({
  node,
  isActive,
  children,
}: {
  node: OrgNode;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.dropTarget, isActive && styles.dropTargetActive]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  provider: {
    flex: 1,
  },
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
  },
  dropTarget: {
    position: 'relative',
  },
  dropTargetActive: {
    borderWidth: 2,
    borderColor: DesignSystem.colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
});