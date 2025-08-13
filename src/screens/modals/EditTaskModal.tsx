/**
 * 編輯任務 Modal
 */

import React, { useState, useEffect } from 'react';
import { View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert  } from 'react-native';
import { AdaptiveInput } from '@/components/adaptive';
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';
import { WebModal } from '@/components/web/WebModal';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { RootStackParamList } from '@/types/navigation';
import { TaskDoc } from '@/types/task';

type EditTaskRouteProp = RouteProp<RootStackParamList, 'EditTask'>;
type EditTaskNavigationProp = StackNavigationProp<RootStackParamList, 'EditTask'>;

export const EditTaskModal: React.FC = () => {
  const navigation = useNavigation<EditTaskNavigationProp>();
  const route = useRoute<EditTaskRouteProp>();
  const { taskId } = route.params;
  
  const { user } = useAuthStore();
  const { tasks, updateTask, isLoading } = useTaskStore();
  const task = tasks?.find(t => t.id === taskId);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'completed',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    type: 'unscheduled' as 'scheduled' | 'unscheduled' | 'pending' });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        type: task.type || 'unscheduled' });
    }
  }, [task]);

  const handleSave = async () => {
    if (!user || !task) return;
    
    if (!formData.title.trim()) {
      Alert.alert('錯誤', '請輸入任務標題');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updates: Partial<TaskDoc> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        type: formData.type };
      
      await updateTask(taskId, updates, user);
      navigation.goBack();
    } catch (error) {
      console.error('更新任務失敗:', error);
      Alert.alert('錯誤', '更新任務失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !task) {
    return (
      <WebModal>
        <Layout style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1A1A1A" />
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        </Layout>
      </WebModal>
    );
  }

  return (
    <WebModal>
      <Layout style={styles.container} scrollable={false}>
      {/* 標題列 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="close" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>編輯任務</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.headerButton}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#1A1A1A" />
          ) : (
            <Text style={styles.saveButtonText}>儲存</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* 標題 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>標題 *</Text>
            <AdaptiveInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="請輸入任務標題"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          {/* 狀態 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>狀態</Text>
            <View style={styles.optionContainer}>
              {[
                { value: 'todo', label: '待辦' },
                { value: 'completed', label: '已完成' },
              ].map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={StyleSheet.flatten([
                    styles.optionButton,
                    formData.status === status.value && styles.optionButtonActive,
                  ])}
                  onPress={() => setFormData(prev => ({ ...prev, status: status.value as any }))}
                >
                  <Text
                    style={StyleSheet.flatten([
                      styles.optionButtonText,
                      formData.status === status.value && styles.optionButtonTextActive,
                    ])}
                  >
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 優先級 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>優先級</Text>
            <View style={styles.optionContainer}>
              {[
                { value: 'urgent', label: '緊急' },
                { value: 'high', label: '高' },
                { value: 'medium', label: '中' },
                { value: 'low', label: '低' },
              ].map((priority) => (
                <TouchableOpacity
                  key={priority.value}
                  style={StyleSheet.flatten([
                    styles.optionButton,
                    formData.priority === priority.value && styles.optionButtonActive,
                  ])}
                  onPress={() => setFormData(prev => ({ ...prev, priority: priority.value as any }))}
                >
                  <Text
                    style={StyleSheet.flatten([
                      styles.optionButtonText,
                      formData.priority === priority.value && styles.optionButtonTextActive,
                    ])}
                  >
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 類型 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>類型</Text>
            <View style={styles.optionContainer}>
              {[
                { value: 'scheduled', label: '已排程' },
                { value: 'unscheduled', label: '未排程' },
                { value: 'pending', label: '待定' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={StyleSheet.flatten([
                    styles.optionButton,
                    formData.type === type.value && styles.optionButtonActive,
                  ])}
                  onPress={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
                >
                  <Text
                    style={StyleSheet.flatten([
                      styles.optionButtonText,
                      formData.type === type.value && styles.optionButtonTextActive,
                    ])}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 描述 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>描述</Text>
            <AdaptiveInput
              style={StyleSheet.flatten([styles.input, styles.textArea])}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="請輸入任務描述"
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
      </Layout>
    </WebModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA' },
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
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA' },
  headerButton: {
    padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E' },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C' },
  scrollView: {
    flex: 1 },
  form: {
    padding: 16 },
  formGroup: {
    marginBottom: 24 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA' },
  textArea: {
    minHeight: 100,
    paddingTop: 12 },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8 },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA' },
  optionButtonActive: {
    backgroundColor: '#2C2C2C',
    borderColor: '#2C2C2C' },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93' },
  optionButtonTextActive: {
    color: '#FFFFFF' } });