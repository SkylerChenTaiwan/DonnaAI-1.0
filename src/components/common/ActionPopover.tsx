/**
 * 動作選擇 Popover 元件
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Action {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ActionPopoverProps {
  visible: boolean;
  onClose: () => void;
  onAction: (action: Action) => void;
  fromRef: React.RefObject<any>;
}

const actions: Action[] = [
  {
    id: '1',
    type: 'customer',
    title: '客戶',
    subtitle: '建立新的客戶資料',
    icon: 'person-add-outline',
  },
  {
    id: '2',
    type: 'record',
    title: '紀錄',
    subtitle: '記錄會議或通話內容',
    icon: 'document-text-outline',
  },
  {
    id: '3',
    type: 'task',
    title: '任務',
    subtitle: '建立待辦事項',
    icon: 'checkbox-outline',
  },
];

export const ActionPopover = ({
  visible,
  onClose,
  onAction,
  fromRef,
}: ActionPopoverProps) => {
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.actionPanel,
                {
                  bottom: 88 + insets.bottom - 1, // 減1消除縫隙
                  transform: [{ translateY }],
                },
              ]}
            >
              <View style={styles.actionContainer}>
                {actions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.actionButton}
                    onPress={() => {
                      onAction(action);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.actionIconContainer}>
                      <Ionicons name={action.icon} size={24} color="#1A1A1A" />
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent', // 移除背景遮罩
  },
  actionPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0, // 移除頂部邊框避免重複
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 5,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingVertical: 16, // 減小垂直內距
    paddingHorizontal: 24,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  actionIconContainer: {
    width: 48, // 減小圖標容器
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
  },
});