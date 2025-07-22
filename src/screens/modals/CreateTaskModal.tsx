/**
 * 新增任務 Modal - 支援語音和表單輸入
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/common/Button';
import { Layout } from '@/components/common/Layout';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { TaskForm } from '@/components/forms/TaskForm';
import { VoiceTaskInput } from '@/components/input/VoiceTaskInput';
import { InputMethodLink } from '@/components/modals/InputMethodLink';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { createTask } from '@/services/firebase/tasks';
import { TaskCreateRequest } from '@/types/task';
import { TaskFormData } from '@/services/validation/form-schemas';
import { showToast } from '../../utils/toast';
import { Ionicons } from '@expo/vector-icons';

type RouteParams = {
  CreateTaskModal: {
    mode?: 'voice' | 'form';
    customerId?: string;
    recordId?: string;
  };
};

export const CreateTaskModal: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'CreateTaskModal'>>();
  const { user } = useAuth();
  const { currentOrganization, currentTeam } = useOrganization();
  
  // 從路由參數獲取模式，預設為表單
  const mode = route.params?.mode || 'form';
  const customerId = route.params?.customerId;
  const recordId = route.params?.recordId;
  
  const [loading, setLoading] = useState(false);
  
  // 切換到表格填寫模式
  const switchToForm = useCallback(() => {
    navigation.setParams({ mode: 'form' });
  }, [navigation]);
  
  // 切換到語音輸入模式
  const switchToVoice = useCallback(() => {
    navigation.setParams({ mode: 'voice' });
  }, [navigation]);

  // 處理表單提交
  const handleFormSubmit = useCallback(async (data: TaskFormData) => {
    if (!user || !currentOrganization || !currentTeam) {
      showToast('error', '請先登入');
      return;
    }

    setLoading(true);
    try {
      // 轉換中文優先級到英文
      const priorityMap: Record<string, 'low' | 'medium' | 'high'> = {
        '低': 'low',
        '中': 'medium',
        '高': 'high',
      };

      const taskData: TaskCreateRequest = {
        title: data.title,
        description: data.description,
        type: 'once',
        priority: priorityMap[data.priority] || 'medium',
        assigneeId: data.assignedTo || user.uid,
        source: 'manual',
        teamId: currentTeam.id,
        organizationId: currentOrganization.id,
        customerIds: data.customerId ? [data.customerId] : [],
        dueDate: data.dueDate,
        tags: data.tags,
      };

      await createTask(taskData, user.uid);
      
      showToast('success', '任務建立成功');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating task:', error);
      showToast('error', '建立任務失敗');
    } finally {
      setLoading(false);
    }
  }, [user, currentOrganization, currentTeam, navigation]);

  // 處理語音輸入完成
  const handleVoiceComplete = useCallback(async (taskData: Partial<TaskCreateRequest>) => {
    if (!user || !currentOrganization || !currentTeam) {
      showToast('error', '請先登入');
      return;
    }

    setLoading(true);
    try {
      const completeTaskData: TaskCreateRequest = {
        title: taskData.title || '新任務',
        type: 'once',
        priority: taskData.priority || 'medium',
        assigneeId: user.uid,
        source: 'voice',
        teamId: currentTeam.id,
        organizationId: currentOrganization.id,
        ...taskData,
        customerIds: customerId ? [customerId] : taskData.customerIds,
        recordId: recordId || taskData.recordId,
      };
      
      await createTask(completeTaskData, user.uid);
      showToast('success', '語音任務建立成功');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating voice task:', error);
      showToast('error', '建立語音任務失敗');
    } finally {
      setLoading(false);
    }
  }, [user, currentOrganization, currentTeam, customerId, recordId, navigation]);

  return (
    <Layout style={styles.container}>

      {/* 內容區域 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mode === 'form' ? (
          <>
            {/* 切換到語音輸入的連結 */}
            <InputMethodLink
              targetLabel="改用語音輸入"
              onSwitch={switchToVoice}
            />
            <TaskForm 
              onSubmit={handleFormSubmit}
              initialData={{
                customerIds: customerId ? [customerId] : [],
                recordId: recordId,
              }}
              isSubmitting={loading}
              userId={user?.uid || ''}
              organizationId={currentOrganization?.id || ''}
              teamId={currentTeam?.id || ''}
            />
          </>
        ) : (
          <>
            {/* 切換到表格填寫的連結 */}
            <InputMethodLink
              targetLabel="改用表格填寫"
              onSwitch={switchToForm}
            />
            <VoiceTaskInput 
              onComplete={handleVoiceComplete}
              initialCustomerId={customerId}
              initialRecordId={recordId}
              disabled={loading}
            />
          </>
        )}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
});