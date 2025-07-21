/**
 * 任務表單組件
 * 支援文字和語音輸入，整合語音轉任務功能
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';

import { TaskFormSchema, TaskFormData } from '@/services/validation/form-schemas';
import { FormField } from './FormField';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { VoiceTaskInput } from '@/components/input/VoiceTaskInput';
import { VoiceToTaskResult } from '@/services/ai/voice-to-task';

export interface TaskFormProps {
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<TaskFormData>;
  isSubmitting?: boolean;
  userId: string;
  organizationId: string;
  teamId: string;
}

type InputMode = 'text' | 'voice';

export const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting = false,
  userId,
  organizationId,
  teamId,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [voiceTaskResult, setVoiceTaskResult] = useState<VoiceToTaskResult | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      priority: 'medium',
      status: 'pending',
      tags: [],
      ...initialData,
    },
  });

  const watchedTitle = watch('title');
  const watchedDescription = watch('description');

  // 處理表單提交
  const onFormSubmit = useCallback(async (data: TaskFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('任務創建失敗:', error);
      Alert.alert('錯誤', '任務創建失敗，請重試');
    }
  }, [onSubmit]);

  // 處理語音任務提取完成
  const handleVoiceTaskExtracted = useCallback((
    taskData: Partial<TaskFormData>,
    result: VoiceToTaskResult
  ) => {
    // 將語音提取的資料設定到表單
    Object.keys(taskData).forEach(key => {
      const value = taskData[key as keyof TaskFormData];
      if (value !== undefined) {
        setValue(key as keyof TaskFormData, value, { shouldValidate: true });
      }
    });

    // 儲存語音轉任務結果以供後續參考
    setVoiceTaskResult(result);
    
    // 切換到文字模式以便用戶檢視和編輯
    setInputMode('text');
    setShowVoiceInput(false);

    // 顯示成功訊息
    if (result.extractedTask) {
      const confidence = (result.extractedTask.confidence * 100).toFixed(0);
      Alert.alert(
        '語音轉任務完成',
        `已成功提取任務資訊（準確度: ${confidence}%）\n您可以檢視並編輯任務內容後創建任務。`,
        [{ text: '確定' }]
      );
    }
  }, [setValue]);

  // 清空表單並重新開始
  const handleReset = useCallback(() => {
    reset();
    setVoiceTaskResult(null);
    setInputMode('text');
  }, [reset]);

  // 優先級選項
  const priorityOptions = [
    { label: '低', value: 'low' },
    { label: '中', value: 'medium' },
    { label: '高', value: 'high' },
    { label: '緊急', value: 'urgent' },
  ];

  // 狀態選項
  const statusOptions = [
    { label: '待處理', value: 'pending' },
    { label: '進行中', value: 'in_progress' },
    { label: '已完成', value: 'completed' },
    { label: '已取消', value: 'cancelled' },
  ];

  // 輸入模式切換按鈕
  const renderInputModeToggle = () => (
    <View style={styles.inputModeContainer}>
      <Text style={styles.inputModeLabel}>輸入方式：</Text>
      <View style={styles.inputModeToggle}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            inputMode === 'text' && styles.modeButtonActive,
          ]}
          onPress={() => setInputMode('text')}
        >
          <Ionicons 
            name="create-outline" 
            size={18} 
            color={inputMode === 'text' ? '#FFFFFF' : '#7A7A7A'} 
          />
          <Text style={[
            styles.modeButtonText,
            inputMode === 'text' && styles.modeButtonTextActive,
          ]}>
            文字輸入
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.modeButton,
            inputMode === 'voice' && styles.modeButtonActive,
          ]}
          onPress={() => setInputMode('voice')}
        >
          <Ionicons 
            name="mic-outline" 
            size={18} 
            color={inputMode === 'voice' ? '#FFFFFF' : '#7A7A7A'} 
          />
          <Text style={[
            styles.modeButtonText,
            inputMode === 'voice' && styles.modeButtonTextActive,
          ]}>
            語音輸入
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 語音輸入提示和按鈕
  const renderVoiceInputSection = () => {
    if (inputMode !== 'voice') return null;

    return (
      <View style={styles.voiceInputSection}>
        <View style={styles.voiceInputHeader}>
          <Ionicons name="mic" size={24} color="#ef4444" />
          <Text style={styles.voiceInputTitle}>語音創建任務</Text>
        </View>
        
        <Text style={styles.voiceInputDescription}>
          使用語音快速創建任務！說出任務內容，AI 將自動識別任務標題、優先級、截止時間等資訊。
        </Text>

        <View style={styles.voiceInputTips}>
          <Text style={styles.tipsTitle}>📝 語音輸入建議：</Text>
          <Text style={styles.tipText}>• 清楚描述任務目標和要求</Text>
          <Text style={styles.tipText}>• 提及時間要求（如：「下週五前完成」）</Text>
          <Text style={styles.tipText}>• 說明重要程度（如：「很重要」、「不急」）</Text>
        </View>

        <Button
          title="開始語音輸入"
          onPress={() => setShowVoiceInput(true)}
          style={styles.voiceInputButton}
          icon="mic"
        />

        {voiceTaskResult && (
          <View style={styles.voiceResultBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.voiceResultText}>
              已從語音提取任務資訊，您可以繼續編輯
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* 輸入模式選擇 */}
        {renderInputModeToggle()}

        {/* 語音輸入區域 */}
        {renderVoiceInputSection()}

        {/* 表單欄位（文字模式或語音後編輯） */}
        {inputMode === 'text' && (
          <>
            {/* 任務標題 */}
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="任務標題"
                  type="text"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.title?.message}
                  placeholder="輸入任務標題..."
                  required
                />
              )}
            />

            {/* 任務描述 */}
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="任務描述"
                  type="multiline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.description?.message}
                  placeholder="詳細描述任務內容和要求..."
                  minHeight={120}
                  required
                />
              )}
            />

            {/* 客戶 ID（可選） */}
            <Controller
              control={control}
              name="customerId"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="關聯客戶"
                  type="text"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.customerId?.message}
                  placeholder="客戶 ID（可選）"
                />
              )}
            />

            {/* 優先級 */}
            <Controller
              control={control}
              name="priority"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="優先級"
                  type="select"
                  value={value}
                  onValueChange={onChange}
                  options={priorityOptions}
                  error={errors.priority?.message}
                />
              )}
            />

            {/* 狀態 */}
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="狀態"
                  type="select"
                  value={value}
                  onValueChange={onChange}
                  options={statusOptions}
                  error={errors.status?.message}
                />
              )}
            />

            {/* 截止日期 */}
            <Controller
              control={control}
              name="dueDate"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="截止日期"
                  type="date"
                  value={value}
                  onDateChange={onChange}
                  error={errors.dueDate?.message}
                />
              )}
            />

            {/* 指派人員 */}
            <Controller
              control={control}
              name="assignedTo"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="指派給"
                  type="text"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.assignedTo?.message}
                  placeholder="指派給某位成員（可選）"
                />
              )}
            />

            {/* 標籤 */}
            <Controller
              control={control}
              name="tags"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="標籤"
                  type="tags"
                  value={value}
                  onValueChange={onChange}
                  error={errors.tags?.message}
                  placeholder="添加標籤..."
                />
              )}
            />
          </>
        )}
      </ScrollView>

      {/* 底部按鈕 */}
      <View style={styles.footer}>
        <Button
          title="重置"
          variant="secondary"
          onPress={handleReset}
          style={styles.footerButton}
          icon="refresh"
        />
        
        {onCancel && (
          <Button
            title="取消"
            variant="secondary"
            onPress={onCancel}
            style={styles.footerButton}
          />
        )}
        
        <Button
          title={isSubmitting ? "創建中..." : "創建任務"}
          onPress={handleSubmit(onFormSubmit)}
          disabled={!isValid || isSubmitting || inputMode === 'voice'}
          style={styles.footerButton}
          icon={isSubmitting ? undefined : "add"}
        />
      </View>

      {/* 語音任務輸入 Modal */}
      <Modal
        visible={showVoiceInput}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <VoiceTaskInput
          onTaskExtracted={handleVoiceTaskExtracted}
          onCancel={() => setShowVoiceInput(false)}
          userId={userId}
          options={{
            extractDeadline: true,
            extractPriority: true,
            extractAssignee: true,
            autoDetectTaskType: true,
          }}
          maxDuration={300} // 5分鐘
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  
  // 輸入模式切換
  inputModeContainer: {
    marginBottom: 20,
  },
  inputModeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  inputModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E3E1DC',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#1A1A1A',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7A7A7A',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },

  // 語音輸入區域
  voiceInputSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E3E1DC',
  },
  voiceInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  voiceInputTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  voiceInputDescription: {
    fontSize: 16,
    color: '#7A7A7A',
    lineHeight: 22,
    marginBottom: 16,
  },
  voiceInputTips: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#7A7A7A',
    lineHeight: 18,
    marginBottom: 4,
  },
  voiceInputButton: {
    backgroundColor: '#ef4444',
    marginBottom: 16,
  },
  voiceResultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  voiceResultText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },

  // 底部按鈕
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E3E1DC',
  },
  footerButton: {
    flex: 1,
  },
});