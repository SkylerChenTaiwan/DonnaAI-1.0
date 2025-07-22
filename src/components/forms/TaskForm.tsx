/**
 * 任務表單組件
 * 支援文字和語音輸入，整合語音轉任務功能
 */

import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { SimplifiedAudioInput } from '@/components/input/SimplifiedAudioInput';

import { TaskFormSchema, TaskFormData } from '@/services/validation/form-schemas';
import { FormField } from './FormField';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export interface TaskFormProps {
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<TaskFormData>;
  isSubmitting?: boolean;
  userId: string;
  organizationId: string;
  teamId: string;
}


export const TaskForm = forwardRef<any, TaskFormProps>((props, ref) => {
  const {
    onSubmit,
    onCancel,
    initialData,
    isSubmitting = false,
    userId,
    organizationId,
    teamId,
  } = props;
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');

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
      priority: '中',
      status: '待處理',
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


  // 優先級選項
  const priorityOptions = [
    { label: '低', value: '低' },
    { label: '中', value: '中' },
    { label: '高', value: '高' },
  ];

  // 狀態選項
  const statusOptions = [
    { label: '待處理', value: '待處理' },
    { label: '進行中', value: '進行中' },
    { label: '已完成', value: '已完成' },
    { label: '已取消', value: '已取消' },
  ];

  // 暴露方法給父組件
  useImperativeHandle(ref, () => ({
    submit: () => {
      handleSubmit(onFormSubmit)();
    },
    reset: () => {
      reset();
    }
  }));

  return (
    <View style={styles.container}>
      {/* 輸入方式切換 */}
      <View style={styles.inputModeTabs}>
        <TouchableOpacity
          style={[styles.tabButton, inputMode === 'text' && styles.tabButtonActive]}
          onPress={() => setInputMode('text')}
        >
          <Ionicons 
            name="create-outline" 
            size={20} 
            color={inputMode === 'text' ? '#FFFFFF' : '#7A7A7A'} 
          />
          <Text style={[styles.tabText, inputMode === 'text' && styles.tabTextActive]}>
            文字輸入
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, inputMode === 'voice' && styles.tabButtonActive]}
          onPress={() => setInputMode('voice')}
        >
          <Ionicons 
            name="mic-outline" 
            size={20} 
            color={inputMode === 'voice' ? '#FFFFFF' : '#7A7A7A'} 
          />
          <Text style={[styles.tabText, inputMode === 'voice' && styles.tabTextActive]}>
            語音輸入
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {inputMode === 'text' ? (
          <>
            {/* 任務標題 - 必填 */}
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

        {/* 截止日期 - 重要欄位，放在第二位 */}
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

        {/* 地點 - 重要欄位，放在第三位 */}
        <Controller
          control={control}
          name="location"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="地點"
              type="text"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.location?.message}
              placeholder="任務執行地點（可選）"
            />
          )}
        />

        {/* 任務描述 - 選填 */}
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
              placeholder="詳細描述任務內容和要求（可選）..."
              minHeight={100}
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

        {/* 關聯客戶 */}
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
        ) : (
          <SimplifiedAudioInput
            onComplete={(audioUri, duration) => {
              // 處理錄音完成
              console.log('任務錄音完成:', audioUri, duration);
              // TODO: 處理語音轉任務邏輯
              Alert.alert('錄音完成', '將處理語音轉換成任務');
            }}
          />
        )}
      </ScrollView>

      {/* 底部按鈕 */}
      <View style={styles.footer}>
        <Button
          title="重置"
          variant="secondary"
          onPress={() => reset()}
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
          disabled={!isValid || isSubmitting}
          style={styles.footerButton}
          icon={isSubmitting ? undefined : "add"}
        />
      </View>
    </View>
  );
});

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
  inputModeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    padding: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#1C1C1E',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7A7A7A',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});