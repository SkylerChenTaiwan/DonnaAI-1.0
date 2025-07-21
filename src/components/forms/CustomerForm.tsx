/**
 * 客戶完整輸入表格
 * 使用 React Hook Form + Zod 驗證
 * 支援必填和選填欄位
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { FormField } from './FormField';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  CustomerFormSchema, 
  CustomerFormData,
  FormFieldConfig
} from '@/services/validation/form-schemas';

export interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<CustomerFormData>;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  loading = false,
  mode = 'create',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      industry: '',
      address: '',
      notes: '',
      tags: [],
      ...initialData,
    },
  });

  // 定義表格欄位配置
  const fieldConfigs: FormFieldConfig[] = [
    {
      name: 'name',
      label: '客戶姓名',
      type: 'text',
      required: true,
      placeholder: '請輸入客戶姓名',
    },
    {
      name: 'company',
      label: '公司名稱',
      type: 'text',
      required: true,
      placeholder: '請輸入公司名稱',
    },
    {
      name: 'email',
      label: '電子郵件',
      type: 'email',
      required: false,
      placeholder: 'example@company.com',
    },
    {
      name: 'phone',
      label: '聯絡電話',
      type: 'tel',
      required: false,
      placeholder: '0912-345-678',
    },
    {
      name: 'industry',
      label: '所屬產業',
      type: 'select',
      required: false,
      placeholder: '選擇產業類別',
      options: [
        { label: '科技業', value: '科技業' },
        { label: '製造業', value: '製造業' },
        { label: '服務業', value: '服務業' },
        { label: '零售業', value: '零售業' },
        { label: '金融業', value: '金融業' },
        { label: '醫療業', value: '醫療業' },
        { label: '教育業', value: '教育業' },
        { label: '建築業', value: '建築業' },
        { label: '運輸業', value: '運輸業' },
        { label: '其他', value: '其他' },
      ],
    },
    {
      name: 'address',
      label: '地址',
      type: 'textarea',
      required: false,
      placeholder: '請輸入公司地址',
    },
    {
      name: 'tags',
      label: '標籤',
      type: 'tags',
      required: false,
    },
    {
      name: 'notes',
      label: '備註',
      type: 'textarea',
      required: false,
      placeholder: '請輸入相關備註資訊',
    },
  ];

  // 提交處理
  const handleFormSubmit = useCallback(async (data: CustomerFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      
      if (mode === 'create') {
        // 創建模式：顯示成功訊息並重置表格
        Alert.alert(
          '成功',
          '客戶資料已成功建立！',
          [
            {
              text: '繼續新增',
              onPress: () => {
                reset();
              },
            },
            {
              text: '完成',
              onPress: onCancel,
            },
          ]
        );
      } else {
        // 編輯模式：顯示成功訊息
        Alert.alert(
          '成功',
          '客戶資料已成功更新！',
          [{ text: '確定', onPress: onCancel }]
        );
      }
    } catch (error) {
      console.error('客戶表格提交失敗:', error);
      Alert.alert(
        '提交失敗',
        error instanceof Error ? error.message : '未知錯誤，請稍後再試'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSubmit, mode, reset, onCancel]);

  // 取消處理
  const handleCancel = useCallback(() => {
    if (isDirty) {
      Alert.alert(
        '確認取消',
        '您有未儲存的變更，確定要取消嗎？',
        [
          { text: '繼續編輯', style: 'cancel' },
          {
            text: '確認取消',
            style: 'destructive',
            onPress: () => {
              reset();
              onCancel?.();
            },
          },
        ]
      );
    } else {
      onCancel?.();
    }
  }, [isDirty, reset, onCancel]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 標頭 */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {mode === 'create' ? '新增客戶' : '編輯客戶'}
        </Text>
        <Text style={styles.subtitle}>
          請填寫客戶的基本資訊，標有 * 的欄位為必填項目
        </Text>
      </View>

      {/* 表格內容 */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {fieldConfigs.map((fieldConfig) => (
            <Controller
              key={fieldConfig.name}
              name={fieldConfig.name as keyof CustomerFormData}
              control={control}
              render={({ field }) => (
                <FormField
                  config={fieldConfig}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors[fieldConfig.name as keyof CustomerFormData]?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          ))}
        </View>
      </ScrollView>

      {/* 底部按鈕 */}
      <View style={styles.footer}>
        <Button
          title="取消"
          variant="secondary"
          onPress={handleCancel}
          style={styles.button}
          disabled={isSubmitting}
        />
        <Button
          title={mode === 'create' ? '建立客戶' : '更新客戶'}
          onPress={handleSubmit(handleFormSubmit)}
          style={styles.button}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7A7A7A',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7A7A7A',
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
    gap: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E3E1DC',
  },
  button: {
    flex: 1,
  },
});