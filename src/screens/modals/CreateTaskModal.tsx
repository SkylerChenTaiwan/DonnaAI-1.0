/**
 * 新增任務 Modal - 支援語音和表單輸入
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/common/Button';
import { Layout } from '@/components/common/Layout';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { TaskForm } from '@/components/forms/TaskForm';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { createTask } from '@/services/firebase/tasks';
import { TaskCreateRequest } from '@/types/task';
import { TaskFormData } from '@/services/validation/form-schemas';
import { showToast } from '../../utils/toast';
import { Ionicons } from '@expo/vector-icons';

type RouteParams = {
  CreateTaskModal: {
    customerId?: string;
    recordId?: string;
  };
};

export const CreateTaskModal: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'CreateTaskModal'>>();
  const { user } = useAuth();
  const { currentOrganization, currentTeam } = useOrganization();
  
  const customerId = route.params?.customerId;
  const recordId = route.params?.recordId;
  
  const [loading, setLoading] = useState(false);
  const formRef = useRef<any>(null);

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
        description: data.description || '',
        type: 'once',
        priority: priorityMap[data.priority] || 'medium',
        assigneeId: data.assignedTo || user.uid,
        source: 'manual',
        teamId: currentTeam.id,
        organizationId: currentOrganization.id,
        customerIds: data.customerId ? [data.customerId] : [],
        dueDate: data.dueDate,
        location: data.location,
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

  // 處理 header 儲存按鈕點擊
  const handleSavePress = useCallback(() => {
    if (formRef.current?.submit) {
      formRef.current.submit();
    }
  }, []);

  // 設置 navigation header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleSavePress}
          style={styles.headerButton}
          disabled={loading}
        >
          <Text style={[styles.headerButtonText, loading && styles.disabledText]}>
            儲存
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSavePress, loading]);

  return (
    <Layout style={styles.container}>

      {/* 內容區域 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TaskForm 
          ref={formRef}
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
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  disabledText: {
    opacity: 0.5,
  },
});