/**
 * 動作選擇 Popover 元件
 * 直接導航到對應 Modal 的主要輸入方式
 */

import React, { useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';

interface Action {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  defaultMode: string;
}

interface ActionPopoverProps {
  visible: boolean;
  onClose: () => void;
  onAction?: (action: Action) => void;
  fromRef: React.RefObject<any>;
  tabBarHeight?: number;
}

// 定義動作與預設輸入方式
const actions: Action[] = [
  {
    id: '1',
    type: 'customer',
    title: '客戶',
    subtitle: '建立新的客戶資料',
    icon: 'person-add-outline',
    defaultMode: 'form',
  },
  {
    id: '2',
    type: 'record',
    title: '紀錄',
    subtitle: '記錄會議或通話內容',
    icon: 'document-text-outline',
    defaultMode: 'audio',
  },
  {
    id: '3',
    type: 'task',
    title: '任務',
    subtitle: '建立待辦事項',
    icon: 'checkbox-outline',
    defaultMode: 'voice',
  },
];

export const ActionPopover = ({
  visible,
  onClose,
  onAction,
  fromRef,
  tabBarHeight = 88,
}: ActionPopoverProps) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const [panelBottom, setPanelBottom] = React.useState(0);

  React.useEffect(() => {
    if (visible && fromRef.current) {
      fromRef.current.measureInWindow((x, y, width, height) => {
        const screenHeight = Dimensions.get('window').height;
        const navBarTop = y - 10;
        const bottomDistance = screenHeight - navBarTop;
        setPanelBottom(bottomDistance);
      });
    }
  }, [visible, fromRef]);

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

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  // 處理動作選擇 - 直接導航
  const handleActionSelect = useCallback((action: Action) => {
    onClose();
    
    switch (action.type) {
      case 'customer':
        navigation.navigate('CreateCustomerModal', { mode: action.defaultMode });
        break;
      case 'record':
        navigation.navigate('CreateRecordModal', { mode: action.defaultMode });
        break;
      case 'task':
        navigation.navigate('CreateTaskModal', { mode: action.defaultMode });
        break;
      default:
        if (onAction) {
          onAction(action);
        }
    }
  }, [navigation, onClose, onAction]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View 
            style={[
              styles.overlay, 
              { 
                opacity,
                bottom: panelBottom || (tabBarHeight + insets.bottom)
              }
            ]} 
          />
        </TouchableWithoutFeedback>
        
        <Animated.View
          style={[
            styles.actionPanel,
            {
              bottom: panelBottom || (tabBarHeight + insets.bottom),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.actionContainer}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionButton}
                onPress={() => handleActionSelect(action)}
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
  },
  actionPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 5,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  actionIconContainer: {
    width: 48,
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