/**
 * AI 建議確認介面
 * 顯示 AI 提取的客戶資料和任務建議，支援使用者修改和確認
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  TextInput
} from '@/components/adaptive';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAIConfirmationStore } from '@/stores/aiConfirmationStore';
// import { useRecordStore } from '@/stores/recordStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useTaskStore } from '@/stores/taskStore';
// import { AIFieldMapping } from '@/types/custom-fields';

interface ConfirmationInterfaceProps {
  recordId: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface FieldModification {
  fieldKey: string;
  originalValue: any;
  modifiedValue: any;
  isModified: boolean;
  confidence: number;
}

interface TaskSuggestion {
  id: string;
  title: string;
  description: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  isSelected: boolean;
  confidence: number;
}

export const ConfirmationInterface = ({
  recordId,
  onComplete,
  onCancel
}: ConfirmationInterfaceProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [customerFieldMappings, setCustomerFieldMappings] = useState<FieldModification[]>([]);
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([]);
  const [selectedCustomer] = useState<string | null>(null);
  const [processingMode, setProcessingMode] = useState<'review' | 'confirm' | 'complete'>('review');

  const { 
    fetchConfirmation,
    confirmRequest
  } = useAIConfirmationStore();
  const { updateCustomer } = useCustomerStore();
  const { createTask } = useTaskStore();

  // 載入 AI 確認資料
  useEffect(() => {
    loadConfirmationData();
  }, [recordId]);

  // 載入確認資料
  const loadConfirmationData = async () => {
    try {
      setIsLoading(true);
      await fetchConfirmation(recordId, 'current-user-id'); // 需要實際的用戶ID
      
      // 模擬處理客戶欄位對應（實際需要從記錄中獲取）
      const mockFieldMappings: FieldModification[] = [
        {
          fieldKey: '客戶姓名',
          originalValue: '張先生',
          modifiedValue: '張先生',
          isModified: false,
          confidence: 0.9
        },
        {
          fieldKey: '聯絡電話',
          originalValue: '0912-345-678',
          modifiedValue: '0912-345-678',
          isModified: false,
          confidence: 0.8
        }
      ];
      setCustomerFieldMappings(mockFieldMappings);

      // 模擬任務建議
      const mockTasks: TaskSuggestion[] = [
        {
          id: 'task_1',
          title: '發送報價單',
          description: '根據會議討論，準備詳細報價單',
          priority: 'high',
          isSelected: true,
          confidence: 0.9
        },
        {
          id: 'task_2',
          title: '安排後續會議',
          description: '一週後安排產品展示會議',
          priority: 'medium',
          isSelected: true,
          confidence: 0.8
        }
      ];
      setTaskSuggestions(mockTasks);

    } catch (error) {
      console.error('載入 AI 確認資料失敗:', error);
      Alert.alert('載入失敗', '無法載入 AI 分析結果');
    } finally {
      setIsLoading(false);
    }
  };

  // 處理欄位修改
  const handleFieldModification = (fieldKey: string, newValue: any) => {
    setCustomerFieldMappings(prev => prev.map(field => 
      field.fieldKey === fieldKey 
        ? { 
            ...field, 
            modifiedValue: newValue, 
            isModified: newValue !== field.originalValue 
          }
        : field
    ));
  };

  // 處理任務選擇
  const handleTaskSelection = (taskId: string, isSelected: boolean) => {
    setTaskSuggestions(prev => prev.map(task =>
      task.id === taskId ? { ...task, isSelected } : task
    ));
  };

  // 處理任務修改
  const handleTaskModification = (taskId: string, field: string, value: any) => {
    setTaskSuggestions(prev => prev.map(task =>
      task.id === taskId ? { ...task, [field]: value } : task
    ));
  };

  // 批次確認所有建議
  const handleBatchConfirm = async () => {
    try {
      setProcessingMode('confirm');
      
      // 確認客戶欄位修改
      const confirmedMappings = customerFieldMappings.filter(field => 
        field.confidence > 0.5 || field.isModified
      );

      await updateCustomerDataFromMappings(confirmedMappings);
      
      // 建立選中的任務
      const selectedTasks = taskSuggestions.filter(task => task.isSelected);
      await createTasksFromSuggestions(selectedTasks);

      // 確認 AI 建議
      await confirmRequest(recordId, 'current-user-id');
      
      setProcessingMode('complete');
      
      Alert.alert(
        '確認完成',
        `已更新 ${confirmedMappings.length} 個客戶欄位，建立 ${selectedTasks.length} 個任務`,
        [{ text: '確定', onPress: onComplete }]
      );

    } catch (error) {
      console.error('批次確認失敗:', error);
      Alert.alert('確認失敗', '處理 AI 建議時發生錯誤');
      setProcessingMode('review');
    }
  };

  // 選擇性確認
  const handleSelectiveConfirm = async () => {
    const highConfidenceFields = customerFieldMappings.filter(field => field.confidence > 0.8);
    const modifiedFields = customerFieldMappings.filter(field => field.isModified);
    const allConfirmedFields = [...highConfidenceFields, ...modifiedFields];

    if (allConfirmedFields.length === 0) {
      Alert.alert('沒有選擇', '請選擇要確認的欄位或任務');
      return;
    }

    try {
      setProcessingMode('confirm');
      
      await updateCustomerDataFromMappings(allConfirmedFields);
      
      const selectedTasks = taskSuggestions.filter(task => task.isSelected);
      await createTasksFromSuggestions(selectedTasks);

      await confirmRequest(recordId, 'current-user-id');
      
      setProcessingMode('complete');
      onComplete();

    } catch (error) {
      console.error('選擇性確認失敗:', error);
      Alert.alert('確認失敗', '處理選擇的項目時發生錯誤');
      setProcessingMode('review');
    }
  };

  // 從欄位對應更新客戶資料
  const updateCustomerDataFromMappings = async (mappings: FieldModification[]) => {
    if (!selectedCustomer) return;

    const customerUpdates: Record<string, any> = {};
    
    mappings.forEach(mapping => {
      customerUpdates[mapping.fieldKey] = mapping.modifiedValue;
    });

    if (Object.keys(customerUpdates).length > 0) {
      await updateCustomer(selectedCustomer, customerUpdates, 'current-user-id');
    }
  };

  // 從建議建立任務
  const createTasksFromSuggestions = async (tasks: TaskSuggestion[]) => {
    for (const task of tasks) {
      await createTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeId: task.assignedTo || '',
        recordId: recordId,
        teamId: '', // 需要從使用者資訊獲取
        organizationId: '', // 需要從使用者資訊獲取
        type: 'unscheduled',
        source: 'ai_extracted'
      }, 'current-user-id');
    }
  };

  // 渲染客戶資料建議
  const renderCustomerDataSuggestions = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>客戶資料建議</Text>
      <Text style={styles.sectionSubtitle}>
        AI 從會議內容中提取的客戶資訊，請檢視並修改
      </Text>
      
      {customerFieldMappings.map((field) => (
        <View key={field.fieldKey} style={styles.fieldContainer}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldName}>{field.fieldKey}</Text>
            <View style={StyleSheet.flatten([
              styles.confidenceBadge,
              { backgroundColor: getConfidenceColor(field.confidence) }
            ])}>
              <Text style={styles.confidenceText}>
                {Math.round(field.confidence * 100)}%
              </Text>
            </View>
          </View>
          
          <AdaptiveInput
            value={field.modifiedValue?.toString() || ''}
            onChangeText={(value) => handleFieldModification(field.fieldKey, value)}
            placeholder={`輸入${field.fieldKey}`}
            style={StyleSheet.flatten([
              styles.fieldInput,
              field.isModified && styles.modifiedInput
            ])}
          />
          
          {field.isModified && (
            <Text style={styles.modifiedIndicator}>已修改</Text>
          )}
        </View>
      ))}
    </View>
  );

  // 渲染任務建議
  const renderTaskSuggestions = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>任務建議</Text>
      <Text style={styles.sectionSubtitle}>
        AI 建議的後續任務，勾選要建立的項目
      </Text>
      
      {taskSuggestions.map((task) => (
        <View key={task.id} style={styles.taskContainer}>
          <View style={styles.taskHeader}>
            <View style={styles.taskCheckbox}>
              <AdaptiveButton
                title={task.isSelected ? "✓" : ""}
                onPress={() => handleTaskSelection(task.id, !task.isSelected)}
                style={task.isSelected ? StyleSheet.flatten([styles.checkbox, styles.checkedBox]) : styles.checkbox}
                textStyle={styles.checkboxText}
              />
              <View style={StyleSheet.flatten([
                styles.confidenceBadge,
                { backgroundColor: getConfidenceColor(task.confidence) }
              ])}>
                <Text style={styles.confidenceText}>
                  {Math.round(task.confidence * 100)}%
                </Text>
              </View>
            </View>
          </View>
          
          <AdaptiveInput
            value={task.title}
            onChangeText={(value) => handleTaskModification(task.id, 'title', value)}
            placeholder="任務標題"
            style={styles.taskTitleInput}
          />
          
          <AdaptiveInput
            value={task.description}
            onChangeText={(value) => handleTaskModification(task.id, 'description', value)}
            placeholder="任務描述"
            style={styles.taskDescriptionInput}
            multiline
          />
          
          <View style={styles.taskPriority}>
            <Text style={styles.taskPriorityLabel}>優先級:</Text>
            {['low', 'medium', 'high'].map((priority) => (
              <AdaptiveButton
                key={priority}
                title={priority === 'low' ? '低' : priority === 'medium' ? '中' : '高'}
                onPress={() => handleTaskModification(task.id, 'priority', priority)}
                style={task.priority === priority ? StyleSheet.flatten([styles.priorityButton, styles.selectedPriorityButton]) : styles.priorityButton}
                textStyle={
                  task.priority === priority
                    ? [styles.priorityButtonText, styles.selectedPriorityButtonText]
                    : styles.priorityButtonText
                }
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  // 渲染確認按鈕
  const renderConfirmationButtons = () => (
    <View style={styles.buttonContainer}>
      {processingMode === 'review' && (
        <>
          <AdaptiveButton
            title="全部確認"
            onPress={handleBatchConfirm}
            style={styles.confirmButton}
            textStyle={styles.confirmButtonText}
          />
          <AdaptiveButton
            title="選擇性確認"
            onPress={handleSelectiveConfirm}
            style={styles.selectiveButton}
            textStyle={styles.selectiveButtonText}
          />
          <AdaptiveButton
            title="取消"
            onPress={onCancel}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        </>
      )}
      
      {processingMode === 'confirm' && (
        <View style={styles.processingContainer}>
          <LoadingSpinner size="small" />
          <Text style={styles.processingText}>正在處理確認...</Text>
        </View>
      )}
    </View>
  );

  // 獲取信心分數顏色
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#22c55e';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>載入 AI 分析結果...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>AI 建議確認</Text>
        <Text style={styles.subtitle}>
          請檢視 AI 從會議內容中提取的資訊，確認或修改後套用到系統
        </Text>
      </View>

      {renderCustomerDataSuggestions()}
      {renderTaskSuggestions()}
      {renderConfirmationButtons()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb' },
  contentContainer: {
    padding: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff' },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280' },
  header: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20 },
  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8 },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 18 },
  fieldContainer: {
    marginBottom: 20 },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8 },
  fieldName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151' },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12 },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff' },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff' },
  modifiedInput: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff' },
  modifiedIndicator: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    marginTop: 4 },
  taskContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb' },
  taskHeader: {
    marginBottom: 12 },
  taskCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between' },
  checkbox: {
    width: 32,
    height: 32,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 6 },
  checkedBox: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6' },
  checkboxText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' },
  taskTitleInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8 },
  taskDescriptionInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    minHeight: 60 },
  taskPriority: {
    flexDirection: 'row',
    alignItems: 'center' },
  taskPriorityLabel: {
    fontSize: 14,
    color: '#374151',
    marginRight: 12,
    fontWeight: '500' },
  priorityButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8 },
  selectedPriorityButton: {
    backgroundColor: '#3b82f6' },
  priorityButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500' },
  selectedPriorityButtonText: {
    color: '#ffffff' },
  buttonContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20 },
  confirmButton: {
    backgroundColor: '#22c55e',
    marginBottom: 12 },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '600' },
  selectiveButton: {
    backgroundColor: '#3b82f6',
    marginBottom: 12 },
  selectiveButtonText: {
    color: '#ffffff',
    fontWeight: '600' },
  cancelButton: {
    backgroundColor: '#e5e7eb' },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600' },
  processingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center' },
  processingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#6b7280' } });