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

export const ActionPopover = ({
  visible,
  onClose,
  onAction,
  fromRef,
}: ActionPopoverProps) => {
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
      verticalOffset={-10}
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
              <Ionicons name={action.icon} size={28} color="#1A1A1A" />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
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
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    width: width * 0.9,
    maxWidth: 360,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  arrow: {
    width: 20,
    height: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
});