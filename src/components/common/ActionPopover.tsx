/**
 * 動作選擇 Popover 元件
 * 支援兩階段選擇：資料類型 → 輸入方式
 */

import React, { useState, useCallback } from 'react';
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
}

interface InputMethod {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

interface ActionPopoverProps {
  visible: boolean;
  onClose: () => void;
  onAction?: (action: Action) => void; // 保留向後相容
  fromRef: React.RefObject<any>;
  tabBarHeight?: number;
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

// 定義每個資料類型的輸入方式
const inputMethods: Record<string, InputMethod[]> = {
  customer: [
    {
      id: 'form',
      title: '表格填寫',
      icon: 'document-text',
      description: '手動輸入客戶資料'
    },
    {
      id: 'csv',
      title: 'CSV 匯入',
      icon: 'cloud-upload',
      description: '批量匯入客戶名單'
    }
  ],
  record: [
    {
      id: 'audio',
      title: '語音錄製',
      icon: 'mic',
      description: '錄音並自動轉文字'
    },
    {
      id: 'text',
      title: '文字輸入',
      icon: 'create',
      description: '直接輸入文字內容'
    }
  ],
  task: [
    {
      id: 'voice',
      title: '語音輸入',
      icon: 'mic',
      description: '說出任務內容'
    },
    {
      id: 'form',
      title: '表格填寫',
      icon: 'list',
      description: '填寫詳細任務資訊'
    }
  ]
};

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
  const [selectedAction, setSelectedAction] = React.useState<Action | null>(null);

  React.useEffect(() => {
    if (visible && fromRef.current) {
      fromRef.current.measureInWindow((x, y, width, height) => {
        const screenHeight = Dimensions.get('window').height;
        // 按鈕位置減去 paddingTop (10px) 得到導航欄實際頂部
        const navBarTop = y - 10; // paddingTop from tabBarStyle
        // 計算面板應該距離螢幕底部的距離
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

  // 處理動作選擇
  const handleActionSelect = useCallback((action: Action) => {
    // 如果該動作類型只有一種輸入方式，直接導航
    const methods = inputMethods[action.type];
    if (!methods || methods.length === 0) {
      // 向後相容：如果沒有定義輸入方式，使用舊的回調
      if (onAction) {
        onAction(action);
        onClose();
      }
      return;
    }
    
    if (methods.length === 1) {
      // 只有一種輸入方式，直接導航
      navigateToModal(action.type, methods[0].id);
    } else {
      // 多種輸入方式，顯示選擇
      setSelectedAction(action);
    }
  }, [onAction, onClose, navigateToModal]);

  // 處理輸入方式選擇
  const handleInputMethodSelect = useCallback((method: InputMethod) => {
    if (selectedAction) {
      navigateToModal(selectedAction.type, method.id);
    }
  }, [selectedAction, navigateToModal]);

  // 導航到對應的 Modal
  const navigateToModal = useCallback((type: string, mode: string) => {
    onClose();
    
    switch (type) {
      case 'customer':
        navigation.navigate('CreateCustomerModal', { mode });
        break;
      case 'record':
        navigation.navigate('CreateRecordModal', { mode });
        break;
      case 'task':
        navigation.navigate('CreateTaskModal', { mode });
        break;
    }
  }, [navigation, onClose]);

  // 返回到動作選擇
  const handleBack = useCallback(() => {
    setSelectedAction(null);
  }, []);

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
          {!selectedAction ? (
            // 第一階段：選擇資料類型
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
          ) : (
            // 第二階段：選擇輸入方式
            <View style={styles.inputMethodContainer}>
              <View style={styles.inputMethodHeader}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.inputMethodTitle}>{selectedAction.title}</Text>
                <View style={styles.headerSpacer} />
              </View>
              
              <View style={styles.methodList}>
                {inputMethods[selectedAction.type]?.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={styles.methodItem}
                    onPress={() => handleInputMethodSelect(method)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.methodIconContainer}>
                      <Ionicons name={method.icon} size={24} color="#FF6B35" />
                    </View>
                    <View style={styles.methodContent}>
                      <Text style={styles.methodTitle}>{method.title}</Text>
                      <Text style={styles.methodDescription}>{method.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

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
  // 輸入方式選擇樣式
  inputMethodContainer: {
    paddingBottom: 8,
  },
  inputMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  inputMethodTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  methodList: {
    paddingVertical: 8,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
});