/**
 * Notion 風格空白狀態組件
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { responsive } from '@/styles/web';

interface EmptyStateProps {
  type: 'customers' | 'records' | 'tasks';
  onAdd: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAdd }) => {
  const getEmptyMessage = () => {
    switch (type) {
      case 'customers':
        return {
          icon: '👥',
          title: '開始建立您的客戶資料庫',
          description: '新增第一位客戶，開始管理您的業務關係',
          buttonText: '新增客戶'
        };
      case 'records':
        return {
          icon: '📝',
          title: '記錄您的第一次互動',
          description: '追蹤與客戶的每次接觸，建立完整的歷史記錄',
          buttonText: '新增紀錄'
        };
      case 'tasks':
        return {
          icon: '✓',
          title: '建立您的任務清單',
          description: '組織待辦事項，提高工作效率',
          buttonText: '新增任務'
        };
    }
  };

  const { icon, title, description, buttonText } = getEmptyMessage();

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      <TouchableOpacity 
        style={styles.emptyButton} 
        onPress={onAdd}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: responsive({ mobile: 48, tablet: 56, desktop: 64 }),
    marginBottom: responsive({ mobile: 16, tablet: 20, desktop: 24 }),
  },
  emptyTitle: {
    fontSize: responsive({ mobile: 18, tablet: 20, desktop: 22 }),
    fontWeight: '600',
    color: '#37352f',
    marginBottom: responsive({ mobile: 8, tablet: 10, desktop: 12 }),
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: responsive({ mobile: 14, tablet: 15, desktop: 16 }),
    color: '#787774',
    textAlign: 'center',
    marginBottom: responsive({ mobile: 24, tablet: 28, desktop: 32 }),
    paddingHorizontal: responsive({ mobile: 20, tablet: 40, desktop: 60 }),
    lineHeight: responsive({ mobile: 20, tablet: 22, desktop: 24 }),
  },
  emptyButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: responsive({ mobile: 20, tablet: 24, desktop: 28 }),
    paddingVertical: responsive({ mobile: 10, tablet: 12, desktop: 14 }),
    borderRadius: responsive({ mobile: 6, tablet: 8, desktop: 8 }),
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: responsive({ mobile: 14, tablet: 15, desktop: 16 }),
    fontWeight: '600',
  },
});