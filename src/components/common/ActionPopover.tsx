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
} from 'react-native';
import Popover from 'react-native-popover-view';
import { Ionicons } from '@expo/vector-icons';

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
    title: '新增客戶',
    subtitle: '建立新的客戶資料',
    icon: 'person-add-outline',
  },
  {
    id: '2',
    type: 'record',
    title: '新增紀錄',
    subtitle: '記錄會議或通話內容',
    icon: 'document-text-outline',
  },
  {
    id: '3',
    type: 'task',
    title: '新增任務',
    subtitle: '建立待辦事項',
    icon: 'checkbox-outline',
  },
];

export const ActionPopover: React.FC<ActionPopoverProps> = ({
  visible,
  onClose,
  onAction,
  fromRef,
}) => {
  return (
    <Popover
      isVisible={visible}
      onRequestClose={onClose}
      from={fromRef}
      placement="top"
      popoverStyle={styles.popover}
      backgroundStyle={styles.backdrop}
      animationConfig={{
        duration: 200,
      }}
      arrowStyle={styles.arrow}
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
              <Ionicons name={action.icon} size={24} color="#007AFF" />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Popover>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  popover: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    width: width * 0.8,
    maxWidth: 320,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  arrow: {
    width: 16,
    height: 8,
  },
  actionContainer: {
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
  },
});