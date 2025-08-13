/**
 * 批量操作 Modal 元件
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator } from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { Icon } from '@/components/common/Icon';
import { AdaptiveModal } from '@/components/adaptive/core/AdaptiveModal';

export interface BatchAction {
  id: string;
  label: string;
  icon: string;
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
  loading = false }) => {
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
            } },
        ]
      );
    } else {
      onAction(action);
      onClose();
    }
  };

  return (
    <AdaptiveModal
      visible={visible}
      onClose={onClose}
      animationType="slide"
      position="bottom"
      size="large"
      showCloseButton={false}
      title="批量操作"
      subtitle={`已選擇 ${selectedCount} 個項目`}
      secondaryButton={{
        title: '取消',
        onPress: onClose
      }}
    >

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1A1A1A" />
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
                    style={StyleSheet.flatten([
                      styles.actionIconContainer,
                      action.type === 'delete' && styles.deleteIconContainer,
                    ])}
                  >
                    <Icon
                      name={action.icon}
                      size={24}
                      color={action.type === 'delete' ? '#A94438' : '#1A1A1A'}
                    />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text
                      style={StyleSheet.flatten([
                        styles.actionLabel,
                        action.type === 'delete' && styles.deleteActionLabel,
                      ])}
                    >
                      {action.label}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={16} color="#BEBEBE" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

    </AdaptiveModal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8 },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60 },
  loadingText: {
    fontSize: 16,
    color: '#7A7A7A',
    marginTop: 12 },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20 },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12 },
  deleteIconContainer: {
    backgroundColor: '#FFE5E5' },
  actionTextContainer: {
    flex: 1 },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A' },
  deleteActionLabel: {
    color: '#A94438' } });