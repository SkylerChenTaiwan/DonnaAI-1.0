/**
 * 新增任務 Modal
 * 支援多模態輸入（文字、語音轉任務）的任務創建界面
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { Layout } from '@/components/common/Layout';
import { TaskForm } from '@/components/forms/TaskForm';
import { TaskFormData } from '@/services/validation/form-schemas';
import { createTask } from '@/services/firebase/tasks';
import { TaskCreateRequest, TaskType, TaskPriority, TaskSource } from '@/types/task';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';

interface CreateTaskModalParams {
  customerId?: string;
  initialData?: Partial<TaskFormData>;
}

type CreateTaskRouteProp = RouteProp<{
  CreateTaskModal: CreateTaskModalParams;
}, 'CreateTaskModal'>;

export const CreateTaskModal: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CreateTaskRouteProp>();
  const { user } = useAuth();
  const { currentOrganization, currentTeam } = useOrganization();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 從路由參數取得初始資料
  const { customerId, initialData } = route.params || {};

  // 轉換表單資料為 TaskCreateRequest 格式
  const convertFormDataToTaskRequest = (
    formData: TaskFormData
  ): TaskCreateRequest => {
    // 處理日期轉換
    let scheduledAt: Date | undefined;
    let dueDate: Date | undefined;
    
    if (formData.dueDate) {
      try {
        dueDate = new Date(formData.dueDate);
      } catch (error) {
        console.error('截止日期格式錯誤:', error);
      }
    }

    // 處理客戶 ID 陣列
    let customerIds: string[] | undefined;
    if (formData.customerId) {
      customerIds = [formData.customerId];
    }

    return {
      title: formData.title,
      description: formData.description,
      type: determineTaskType(formData),
      scheduledAt,
      dueDate,
      priority: mapFormPriorityToTaskPriority(formData.priority),
      assigneeId: formData.assignedTo || currentTeam!.id, // 預設指派給當前用戶
      customerIds,
      source: 'manual' as TaskSource,
      tags: formData.tags,
      teamId: currentTeam!.id,
      organizationId: currentOrganization!.id,
    };
  };

  // 決定任務類型
  const determineTaskType = (formData: TaskFormData): TaskType => {
    // 如果有截止日期或排程時間，視為排程任務
    if (formData.dueDate) {
      return 'scheduled';
    }
    // 如果是待處理狀態，視為未排程任務
    if (formData.status === 'pending') {
      return 'unscheduled';
    }
    // 其他情況視為待處理
    return 'pending';
  };

  // 優先級映射
  const mapFormPriorityToTaskPriority = (formPriority: string): TaskPriority => {
    switch (formPriority) {
      case 'urgent':
        return 'urgent';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  };

  const handleSubmit = useCallback(async (data: TaskFormData) => {
    if (!user || !currentOrganization || !currentTeam) {
      Alert.alert('錯誤', '缺少必要的使用者資訊');
      return;
    }

    try {
      setIsSubmitting(true);

      // 轉換表單資料為 TaskCreateRequest 格式
      const taskRequest = convertFormDataToTaskRequest(data);
      
      // 如果有從路由傳入的 customerId，覆蓋表單中的設定
      if (customerId && !taskRequest.customerIds) {
        taskRequest.customerIds = [customerId];
      }

      // 創建任務
      const createdTask = await createTask(taskRequest, user.uid);

      // 顯示成功訊息
      Alert.alert(
        '成功',
        '任務已成功創建',
        [
          {
            text: '確定',
            onPress: () => {
              navigation.goBack();
              // TODO: 可以在這裡導航到任務詳細頁面
              // navigation.navigate('TaskDetail', { taskId: createdTask.id });
            }
          }
        ]
      );

    } catch (error) {
      console.error('創建任務失敗:', error);
      Alert.alert(
        '創建失敗',
        error instanceof Error ? error.message : '任務創建失敗，請重試'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [user, currentOrganization, currentTeam, customerId, navigation]);

  const handleCancel = useCallback(() => {
    if (isSubmitting) {
      Alert.alert(
        '確認取消',
        '正在創建任務中，確定要取消嗎？',
        [
          { text: '繼續創建', style: 'cancel' },
          { text: '取消', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [isSubmitting, navigation]);

  if (!user || !currentOrganization || !currentTeam) {
    return (
      <Layout style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>載入中...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout style={styles.container}>
      <TaskForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialData={initialData}
        isSubmitting={isSubmitting}
        userId={user.uid}
        organizationId={currentOrganization.id}
        teamId={currentTeam.id}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
  },
});