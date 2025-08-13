/**
 * 任務詳細資料頁面
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { WebLayout } from '@/components/layout/WebLayout';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTaskStore } from '@/stores/taskStore';
import { useCustomerStore } from '@/stores/customerStore';
import { RootStackParamList } from '@/types/navigation';
import { showToast } from '@/utils/toast';
import { useAuth } from '@/hooks/useAuth';

type TaskDetailRouteProp = RouteProp<RootStackParamList, 'TaskDetail'>;
type TaskDetailNavigationProp = StackNavigationProp<RootStackParamList, 'TaskDetail'>;

export const TaskDetailScreen: React.FC = () => {
  const navigation = useNavigation<TaskDetailNavigationProp>();
  const route = useRoute<TaskDetailRouteProp>();
  const { taskId } = route.params;
  
  const { tasks, isLoading: taskLoading, updateTask } = useTaskStore();
  const { customers } = useCustomerStore();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const task = tasks?.find(t => t.id === taskId);
  const customer = task && task.customerIds && task.customerIds.length > 0 
    ? customers.find(c => task.customerIds!.includes(c.id!)) 
    : null;

  // 處理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 處理狀態切換
  const handleStatusToggle = useCallback(async () => {
    if (!task || !user || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      
      await updateTask(task.id!, { 
        status: newStatus as any,
        completedAt: newStatus === 'completed' ? new Date() : null }, user.uid);
      
      showToast('success', `任務已標記為${newStatus === 'completed' ? '已完成' : '待開始'}`);
    } catch (error) {
      console.error('更新狀態失敗:', error);
      showToast('error', '更新狀態失敗');
    } finally {
      setIsUpdating(false);
    }
  }, [task, user, isUpdating, updateTask]);

  if (taskLoading || !task) {
    const loadingContent = (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A1A1A" />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
    
    if (Platform.OS === 'web') {
      return loadingContent;
    }
    
    return (
      <WebLayout style={styles.container}>
        {loadingContent}
      </WebLayout>
    );
  }

  const getStatusColor = (status: string) => {
    return status === 'completed' ? styles.statusCompleted : styles.statusTodo;
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

  const content = (
    <View style={styles.container}>
      {/* 自定義標題列 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          任務詳情
        </Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditTask', { taskId })}
        >
          <Icon name="create-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 任務標題和狀態 */}
        <View style={styles.titleSection}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <TouchableOpacity 
            style={StyleSheet.flatten([styles.statusBadge, getStatusColor(task.status)])}
            onPress={handleStatusToggle}
            disabled={isUpdating}
            activeOpacity={0.7}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.statusText}>
                {task.status === 'completed' ? '已完成' : '待開始'}
              </Text>
            )}
          </TouchableOpacity>
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
              <Icon 
                name={getPriorityIcon(task.priority).name as any}
                size={20} 
                color={getPriorityIcon(task.priority).color} 
              />
              <Text style={StyleSheet.flatten([styles.priorityText, { color: getPriorityIcon(task.priority).color }])}>
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
                <Text style={StyleSheet.flatten([styles.value, styles.linkText])}>
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

      </ScrollView>
    </View>
  );
  
  if (Platform.OS === 'web') {
    return content;
  }
  
  return (
    <WebLayout scrollable={false}>
      {content}
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center' },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA' },
  backButton: {
    padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginHorizontal: 16,
    textAlign: 'center' },
  editButton: {
    padding: 4 },
  scrollView: {
    flex: 1 },
  titleSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA' },
  taskTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12 },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5EA' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingHorizontal: 16,
    marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7' },
  label: {
    fontSize: 16,
    color: '#8E8E93',
    width: 100 },
  value: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E' },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline' },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start' },
  statusTodo: {
    backgroundColor: '#FEF3E2' },
  statusCompleted: {
    backgroundColor: '#E3F2E6' },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E' },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 },
  priorityText: {
    fontSize: 16,
    fontWeight: '500' },
  contentContainer: {
    paddingHorizontal: 16 },
  contentText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24 },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8 },
  tag: {
    backgroundColor: '#E5E5EA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6 },
  tagText: {
    fontSize: 14,
    color: '#1C1C1E' } });