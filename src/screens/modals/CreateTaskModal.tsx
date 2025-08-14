/**
 * 新增任務 Modal - 支援語音和表單輸入
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DesignSystem } from '@/theme/designSystem';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/adaptive';
import { Layout } from '@/components/common/Layout';
import { WebModal } from '@/components/web/WebModal';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { TaskForm } from '@/components/forms/TaskForm';
import { SimplifiedVoiceTaskInput } from '@/components/input/SimplifiedVoiceTaskInput';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { createTask } from '@/services/firebase/tasks';
import { TaskCreateRequest } from '@/types/task';
import { TaskFormData } from '@/services/validation/form-schemas';
import { showToast } from '../../utils/toast';
import { Icon } from '@/components/common/Icon';

type RouteParams = {
  CreateTaskModal: {
    mode?: 'voice' | 'form';  // 新增模式參數
    customerId?: string;
    recordId?: string;
  };
};

export const CreateTaskModal: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'CreateTaskModal'>>();
  const { user } = useAuth();
  const { currentOrganization, currentTeam } = useOrganization();
  
  // 預設模式改為語音
  const mode = route.params?.mode || 'voice';
  const customerId = route.params?.customerId;
  const recordId = route.params?.recordId;
  
  const [loading, setLoading] = useState(false);
  const formRef = useRef<any>(null);

  // 切換到文字輸入模式
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
        '高': 'high' };

      // 基礎任務資料
      const taskData: TaskCreateRequest = {
        title: data.title,
        description: data.description || '',
        type: 'unscheduled', // 改為 unscheduled 作為預設
        priority: priorityMap[data.priority] || 'medium',
        assigneeId: data.assignedTo || user.uid,
        source: 'manual',
        teamId: currentTeam.id,
        organizationId: currentOrganization.id,
        customerIds: data.customerId ? [data.customerId] : [],
        tags: data.tags || [] };
      
      // 只有在有值時才添加 optional 欄位
      if (data.dueDate) {
        taskData.dueDate = data.dueDate;
      }

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

  // 處理語音任務建立完成
  const handleVoiceTaskCreated = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 處理 header 儲存按鈕點擊
  const handleSavePress = useCallback(() => {
    if (formRef.current?.submit) {
      formRef.current.submit();
    }
  }, []);

  // 設置 navigation header
  useEffect(() => {
    if (mode === 'form') {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleSavePress}
            style={styles.headerButton}
            disabled={loading}
          >
            <Text style={StyleSheet.flatten([styles.headerButtonText, loading && styles.disabledText])}>
              儲存
            </Text>
          </TouchableOpacity>
        ) });
    } else {
      navigation.setOptions({
        headerRight: null });
    }
  }, [navigation, handleSavePress, loading, mode]);

  return (
    <WebModal>
      <Layout style={styles.container}>
      {mode === 'voice' ? (
        <View style={styles.voiceContent}>
          {/* 切換到文字輸入的連結 - 小而不突兀 */}
          <TouchableOpacity
            style={styles.textInputLink}
            onPress={switchToForm}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>使用文字輸入</Text>
            <Icon name="arrow-forward" size={16} color="#7A7A7A" />
          </TouchableOpacity>
          
          {/* 語音輸入介面 */}
          <SimplifiedVoiceTaskInput
            onTaskCreated={handleVoiceTaskCreated}
            userId={user?.uid || ''}
            organizationId={currentOrganization?.id || ''}
            teamId={currentTeam?.id || ''}
          />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 切換到語音輸入的連結 */}
          <TouchableOpacity
            style={styles.voiceInputLink}
            onPress={switchToVoice}
            activeOpacity={0.7}
          >
            <Icon name="mic" size={20} color={DesignSystem.colors.status.error} />
            <Text style={styles.voiceLinkText}>改用語音輸入</Text>
            <Icon name="arrow-forward" size={16} color={DesignSystem.colors.status.error} />
          </TouchableOpacity>
          
          <TaskForm 
            ref={formRef}
            onSubmit={handleFormSubmit}
            initialData={{
              customerIds: customerId ? [customerId] : [],
              recordId: recordId }}
            isSubmitting={loading}
            userId={user?.uid || ''}
            organizationId={currentOrganization?.id || ''}
            teamId={currentTeam?.id || ''}
            hideInputToggle={true}
          />
        </ScrollView>
      )}
      </Layout>
    </WebModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA' },
  content: {
    flex: 1 },
  voiceContent: {
    flex: 1,
    backgroundColor: '#FFFFFF' },
  textInputLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC' },
  linkText: {
    fontSize: 14,
    color: '#7A7A7A' },
  voiceInputLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E0',
    marginBottom: 16 },
  voiceLinkText: {
    fontSize: 16,
    color: DesignSystem.colors.status.error,
    fontWeight: '500',
    flex: 1 },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8 },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A' },
  disabledText: {
    opacity: 0.5 } });