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
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { createTask } from '@/services/firebase/tasks';
import { TaskCreateRequest } from '@/types/task';
import { showToast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';

type RouteParams = {
  CreateTaskModal: {
    mode?: 'voice' | 'form';
    customerId?: string;
    recordId?: string;
  };
};

export const CreateTaskModal: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'CreateTaskModal'>>();
  const { user } = useAuth();
  const { currentOrganization, currentTeam } = useOrganization();
  
  // 從路由參數獲取模式，預設為表單
  const initialMode = route.params?.mode || 'form';
  const customerId = route.params?.customerId;
  const recordId = route.params?.recordId;
  
  const [mode, setMode] = useState<'voice' | 'form'>(initialMode);
  const [loading, setLoading] = useState(false);

  // 處理表單提交
  const handleFormSubmit = useCallback(async (data: TaskCreateRequest) => {
    if (!user || !currentOrganization || !currentTeam) {
      showToast('error', '請先登入');
      return;
    }

    setLoading(true);
    try {
      await createTask({
        ...data,
        teamId: currentTeam.id,
        organizationId: currentOrganization.id,
      }, user.uid);
      
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
      {/* 標題欄 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.title}>建立任務</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 模式切換標籤 */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, mode === 'form' && styles.activeTab]}
          onPress={() => setMode('form')}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={mode === 'form' ? '#FF6B35' : '#8E8E93'} 
          />
          <Text style={[styles.tabText, mode === 'form' && styles.activeTabText]}>
            表格填寫
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, mode === 'voice' && styles.activeTab]}
          onPress={() => setMode('voice')}
        >
          <Ionicons 
            name="mic" 
            size={20} 
            color={mode === 'voice' ? '#FF6B35' : '#8E8E93'} 
          />
          <Text style={[styles.tabText, mode === 'voice' && styles.activeTabText]}>
            語音輸入
          </Text>
        </TouchableOpacity>
      </View>

      {/* 內容區域 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mode === 'form' && (
          <TaskForm 
            onSubmit={handleFormSubmit}
            initialCustomerId={customerId}
            initialRecordId={recordId}
            loading={loading}
          />
        )}
        
        {mode === 'voice' && (
          <VoiceTaskInput 
            onComplete={handleVoiceComplete}
            initialCustomerId={customerId}
            initialRecordId={recordId}
            disabled={loading}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerSpacer: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#FFF5F0',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FF6B35',
  },
  content: {
    flex: 1,
  },
});