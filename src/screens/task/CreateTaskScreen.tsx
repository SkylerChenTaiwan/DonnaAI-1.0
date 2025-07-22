/**
 * 新增任務頁面 - 作為 Tab Screen 而非 Modal
 * 預設顯示語音輸入，支援切換到文字輸入
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/components/common/Layout';
import { TaskForm } from '@/components/forms/TaskForm';
import { SimplifiedVoiceTaskInput } from '@/components/input/SimplifiedVoiceTaskInput';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { createTask } from '@/services/firebase/tasks';
import { TaskCreateRequest } from '@/types/task';
import { TaskFormData } from '@/services/validation/form-schemas';
import { showToast } from '@/utils/toast';
import { useNavigation } from '@react-navigation/native';

export const CreateTaskScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { currentOrganization, currentTeam } = useOrganization();
  
  // 預設為語音模式
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [loading, setLoading] = useState(false);
  const formRef = useRef<any>(null);

  // 切換到文字輸入模式
  const switchToText = useCallback(() => {
    setMode('text');
  }, []);
  
  // 切換到語音輸入模式
  const switchToVoice = useCallback(() => {
    setMode('voice');
  }, []);

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
      
      // 重置表單
      if (formRef.current?.reset) {
        formRef.current.reset();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      showToast('error', '建立任務失敗');
    } finally {
      setLoading(false);
    }
  }, [user, currentOrganization, currentTeam]);

  // 處理語音任務建立完成
  const handleVoiceTaskCreated = useCallback(async () => {
    showToast('success', '任務已成功建立');
    // 語音任務建立後不需要特別處理，因為 SimplifiedVoiceTaskInput 會處理一切
  }, []);

  return (
    <Layout style={styles.container}>
      {mode === 'voice' ? (
        <View style={styles.voiceContent}>
          {/* 切換到文字輸入的連結 - 小而不突兀 */}
          <TouchableOpacity
            style={styles.textInputLink}
            onPress={switchToText}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>使用文字輸入</Text>
            <Ionicons name="arrow-forward" size={16} color="#7A7A7A" />
          </TouchableOpacity>
          
          {/* 全螢幕語音輸入介面 */}
          <SimplifiedVoiceTaskInput
            onTaskCreated={handleVoiceTaskCreated}
            userId={user?.uid || ''}
            organizationId={currentOrganization?.id || ''}
            teamId={currentTeam?.id || ''}
          />
        </View>
      ) : (
        <ScrollView style={styles.textContent} showsVerticalScrollIndicator={false}>
          {/* 切換到語音輸入的連結 */}
          <TouchableOpacity
            style={styles.voiceInputLink}
            onPress={switchToVoice}
            activeOpacity={0.7}
          >
            <Ionicons name="mic" size={20} color="#FF6B6B" />
            <Text style={styles.voiceLinkText}>改用語音輸入</Text>
            <Ionicons name="arrow-forward" size={16} color="#FF6B6B" />
          </TouchableOpacity>
          
          <TaskForm 
            ref={formRef}
            onSubmit={handleFormSubmit}
            isSubmitting={loading}
            userId={user?.uid || ''}
            organizationId={currentOrganization?.id || ''}
            teamId={currentTeam?.id || ''}
          />
        </ScrollView>
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  voiceContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  textContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  textInputLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
  },
  linkText: {
    fontSize: 14,
    color: '#7A7A7A',
  },
  voiceInputLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E0',
    marginBottom: 16,
  },
  voiceLinkText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
    flex: 1,
  },
});