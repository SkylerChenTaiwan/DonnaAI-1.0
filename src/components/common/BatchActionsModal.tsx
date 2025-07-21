/**
 * 批量操作 Modal 元件
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface BatchAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'edit' | 'delete' | 'export' | 'tag' | 'assign';
  confirmRequired?: boolean;
  confirmMessage?: string;
}

interface BatchActionsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCount: number;
  actions: BatchAction[];
  onAction: (action: BatchAction) => void;
  loading?: boolean;
}

export const BatchActionsModal: React.FC<BatchActionsModalProps> = ({
  visible,
  onClose,
  selectedCount,
  actions,
  onAction,
  loading = false,
}) => {
  const handleAction = (action: BatchAction) => {
    if (action.confirmRequired) {
      Alert.alert(
        '確認操作',
        action.confirmMessage || `確定要對 ${selectedCount} 個項目執行${action.label}嗎？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '確定',
            style: action.type === 'delete' ? 'destructive' : 'default',
            onPress: () => {
              onAction(action);
              onClose();
            },
          },
        ]
      );
    } else {
      onAction(action);
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          {/* 標頭 */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>批量操作</Text>
            <Text style={styles.subtitle}>已選擇 {selectedCount} 個項目</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>處理中...</Text>
            </View>
          ) : (
            <ScrollView style={styles.content}>
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionItem}
                  onPress={() => handleAction(action)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.actionIconContainer,
                      action.type === 'delete' && styles.deleteIconContainer,
                    ]}
                  >
                    <Ionicons
                      name={action.icon}
                      size={24}
                      color={action.type === 'delete' ? '#FF3B30' : '#007AFF'}
                    />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text
                      style={[
                        styles.actionLabel,
                        action.type === 'delete' && styles.deleteActionLabel,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* 取消按鈕 */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area bottom
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: '#C7C7CC',
    borderRadius: 3,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  content: {
    paddingVertical: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deleteIconContainer: {
    backgroundColor: '#FFE5E5',
  },
  actionTextContainer: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  deleteActionLabel: {
    color: '#FF3B30',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});