/**
 * 任務詳細資料頁面
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/components/common/Layout';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTaskStore } from '@/stores/taskStore';
import { useCustomerStore } from '@/stores/customerStore';
import { RootStackParamList } from '@/types/navigation';

type TaskDetailRouteProp = RouteProp<RootStackParamList, 'TaskDetail'>;
type TaskDetailNavigationProp = StackNavigationProp<RootStackParamList, 'TaskDetail'>;

export const TaskDetailScreen: React.FC = () => {
  const navigation = useNavigation<TaskDetailNavigationProp>();
  const route = useRoute<TaskDetailRouteProp>();
  const { taskId } = route.params;
  
  const { tasks, isLoading: taskLoading } = useTaskStore();
  const { customers } = useCustomerStore();
  
  const task = tasks?.find(t => t.id === taskId);
  const customer = task && task.customerIds && task.customerIds.length > 0 
    ? customers.find(c => task.customerIds!.includes(c.id!)) 
    : null;

  // 處理返回
  const handleBack = () => {
    navigation.goBack();
  };

  if (taskLoading || !task) {
    return (
      <Layout style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </Layout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return styles.statusCompleted;
      case 'in_progress':
        return styles.statusInProgress;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return styles.statusTodo;
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high':
        return { name: 'arrow-up-circle', color: '#FF3B30' };
      case 'medium':
        return { name: 'remove-circle', color: '#FF9500' };
      case 'low':
        return { name: 'arrow-down-circle', color: '#34C759' };
      default:
        return { name: 'help-circle', color: '#8E8E93' };
    }
  };

  return (
    <Layout style={styles.container} scrollable={false}>
      {/* 自定義標題列 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          任務詳情
        </Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditTask', { taskId })}
        >
          <Ionicons name="create-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 任務標題和狀態 */}
        <View style={styles.titleSection}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={[styles.statusBadge, getStatusColor(task.status)]}>
            <Text style={styles.statusText}>
              {task.status === 'completed' ? '已完成' : 
               task.status === 'in_progress' ? '進行中' : 
               task.status === 'cancelled' ? '已取消' : '待開始'}
            </Text>
          </View>
        </View>

        {/* 基本資訊區塊 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本資訊</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>負責人</Text>
            <Text style={styles.value}>{task.assigneeId || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>優先級</Text>
            <View style={styles.priorityContainer}>
              <Ionicons 
                name={getPriorityIcon(task.priority).name as any}
                size={20} 
                color={getPriorityIcon(task.priority).color} 
              />
              <Text style={[styles.priorityText, { color: getPriorityIcon(task.priority).color }]}>
                {task.priority === 'high' ? '高' : 
                 task.priority === 'medium' ? '中' : 
                 task.priority === 'low' ? '低' : '未設定'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>到期日</Text>
            <Text style={styles.value}>
              {task.dueDate ? 
                new Date(task.dueDate.seconds * 1000).toLocaleDateString('zh-TW') : 
                '未設定'}
            </Text>
          </View>
          {customer && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>相關客戶</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('CustomerDetail', { customerId: customer.id! })}
              >
                <Text style={[styles.value, styles.linkText]}>
                  {customer.name}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 任務描述區塊 */}
        {task.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>任務描述</Text>
            <View style={styles.contentContainer}>
              <Text style={styles.contentText}>
                {task.description}
              </Text>
            </View>
          </View>
        )}

        {/* 標籤區塊 */}
        {task.tags && task.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>標籤</Text>
            <View style={styles.tagsContainer}>
              {task.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 進度追蹤區塊 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>進度追蹤</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: task.status === 'completed' ? '100%' : 
                           task.status === 'in_progress' ? '50%' : '0%' }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {task.status === 'completed' ? '100%' : 
               task.status === 'in_progress' ? '50%' : '0%'}
            </Text>
          </View>
        </View>

        {/* 時間資訊 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>時間資訊</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>建立時間</Text>
            <Text style={styles.value}>
              {new Date(task.createdAt.seconds * 1000).toLocaleString('zh-TW')}
            </Text>
          </View>
          {task.updatedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>最後更新</Text>
              <Text style={styles.value}>
                {new Date(task.updatedAt.seconds * 1000).toLocaleString('zh-TW')}
              </Text>
            </View>
          )}
          {task.completedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>完成時間</Text>
              <Text style={styles.value}>
                {new Date(task.completedAt.seconds * 1000).toLocaleString('zh-TW')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginHorizontal: 16,
    textAlign: 'center',
  },
  editButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  label: {
    fontSize: 16,
    color: '#8E8E93',
    width: 100,
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusTodo: {
    backgroundColor: '#FEF3E2',
  },
  statusInProgress: {
    backgroundColor: '#E8F0FF',
  },
  statusCompleted: {
    backgroundColor: '#E3F2E6',
  },
  statusCancelled: {
    backgroundColor: '#FFE5E5',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityText: {
    fontSize: 16,
    fontWeight: '500',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  contentText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: '#E5E5EA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  progressContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});