/**
 * 多步驟表格容器組件
 * 提供進度指示器、導航控制和狀態管理
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { FormField } from './FormField';
import {
  AdaptiveButton
} from '@/components/adaptive';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FormFieldConfig } from '@/services/validation/form-schemas';

interface MultiStepFormStep {
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  schema?: z.ZodSchema<any>;
}

interface MultiStepFormProps {
  title: string;
  steps: MultiStepFormStep[];
  onSubmit: (data: any) => Promise<void> | void;
  onCancel?: () => void;
  initialData?: Record<string, any>;
  loading?: boolean;
}

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  title,
  steps,
  onSubmit,
  onCancel,
  initialData = {},
  loading = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 建立完整的表格 schema
  const fullSchema = useMemo(() => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    
    steps.forEach(step => {
      step.fields.forEach(field => {
        let fieldSchema: z.ZodTypeAny;
        
        switch (field.type) {
          case 'email':
            fieldSchema = z.string().email("請輸入有效的電子郵件地址");
            break;
          case 'tags':
          case 'multiselect':
            fieldSchema = z.array(z.string()).default([]);
            break;
          case 'switch':
            fieldSchema = z.boolean().default(false);
            break;
          default:
            fieldSchema = z.string();
        }
        
        if (!field.required && field.type !== 'tags' && field.type !== 'multiselect') {
          fieldSchema = fieldSchema.optional().or(z.literal(""));
        } else if (field.required) {
          if (field.type === 'tags' || field.type === 'multiselect') {
            fieldSchema = z.array(z.string()).min(1, `${field.label}為必填`);
          } else {
            fieldSchema = z.string().min(1, `${field.label}為必填`);
          }
        }
        
        schemaFields[field.name] = fieldSchema;
      });
    });
    
    return z.object(schemaFields);
  }, [steps]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
    reset } = useForm({
    resolver: zodResolver(fullSchema),
    defaultValues: initialData });

  const currentStepData = steps[currentStep];

  // 驗證當前步驟
  const validateCurrentStep = useCallback(async () => {
    const currentFields = currentStepData.fields.map(field => field.name);
    const isValid = await trigger(currentFields);
    return isValid;
  }, [currentStep, trigger, currentStepData]);

  // 下一步
  const handleNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length, validateCurrentStep]);

  // 上一步
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // 提交表格
  const handleFormSubmit = useCallback(async (data: any) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      // 成功後重置表格
      reset();
      setCurrentStep(0);
    } catch (error) {
      console.error('表格提交失敗:', error);
      Alert.alert('提交失敗', error instanceof Error ? error.message : '未知錯誤');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSubmit, reset]);

  // 取消表格
  const handleCancel = useCallback(() => {
    Alert.alert(
      '確認取消',
      '您確定要取消嗎？未儲存的資料將會遺失。',
      [
        { text: '繼續編輯', style: 'cancel' },
        { 
          text: '確認取消', 
          style: 'destructive',
          onPress: () => {
            reset();
            setCurrentStep(0);
            onCancel?.();
          }
        },
      ]
    );
  }, [reset, onCancel]);

  // 進度指示器
  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View 
          style={StyleSheet.flatten([
            styles.progressFill,
            { width: `${((currentStep + 1) / steps.length) * 100}%` }
          ])} 
        />
      </View>
      <Text style={styles.progressText}>
        步驟 {currentStep + 1} / {steps.length}
      </Text>
    </View>
  );

  // 步驟指示器
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View 
            style={StyleSheet.flatten([
              styles.stepCircle,
              index === currentStep ? styles.currentStepCircle : null,
              index < currentStep ? styles.completedStepCircle : null,
            ])}
          >
            {index < currentStep ? (
              <Icon name="checkmark" size={16} color="#FFFFFF" />
            ) : (
              <Text 
                style={StyleSheet.flatten([
                  styles.stepNumber,
                  index === currentStep ? styles.currentStepNumber : null,
                ])}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <Text 
            style={StyleSheet.flatten([
              styles.stepTitle,
              index === currentStep ? styles.currentStepTitle : null,
            ])}
            numberOfLines={1}
          >
            {step.title}
          </Text>
        </View>
      ))}
    </View>
  );

  if (loading || isSubmitting) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>
          {isSubmitting ? '提交中...' : '載入中...'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 標頭 */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleCancel}
        >
          <Icon name="close" size={24} color="#7A7A7A" />
        </TouchableOpacity>
      </View>

      {/* 進度指示器 */}
      {renderProgressIndicator()}

      {/* 步驟指示器 */}
      {renderStepIndicator()}

      {/* 當前步驟內容 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          {currentStepData.description && (
            <Text style={styles.stepDescription}>
              {currentStepData.description}
            </Text>
          )}

          {/* 表格欄位 */}
          <View style={styles.fields}>
            {currentStepData.fields.map((fieldConfig) => (
              <Controller
                key={fieldConfig.name}
                name={fieldConfig.name}
                control={control}
                render={({ field }) => (
                  <FormField
                    config={fieldConfig}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors[fieldConfig.name]?.message as string}
                  />
                )}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 底部按鈕 */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          {/* 上一步按鈕 */}
          {currentStep > 0 && (
            <AdaptiveButton
              title="上一步"
              variant="secondary"
              onPress={handlePrevious}
              style={styles.button}
            />
          )}

          {/* 取消按鈕 */}
          <AdaptiveButton
            title="取消"
            variant="secondary"
            onPress={handleCancel}
            style={styles.button}
          />

          {/* 下一步/提交按鈕 */}
          {currentStep < steps.length - 1 ? (
            <AdaptiveButton
              title="下一步"
              onPress={handleNext}
              style={styles.button}
            />
          ) : (
            <AdaptiveButton
              title="提交"
              onPress={handleSubmit(handleFormSubmit)}
              style={styles.button}
              disabled={isSubmitting}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0' },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7A7A7A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC' },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A' },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center' },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC' },
  progressBar: {
    height: 4,
    backgroundColor: '#E3E1DC',
    borderRadius: 2,
    marginBottom: 8 },
  progressFill: {
    height: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 2 },
  progressText: {
    fontSize: 14,
    color: '#7A7A7A',
    textAlign: 'center' },
  stepIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC' },
  stepItem: {
    flex: 1,
    alignItems: 'center' },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E3E1DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#FFFFFF' },
  currentStepCircle: {
    borderColor: '#1A1A1A',
    backgroundColor: '#1A1A1A' },
  completedStepCircle: {
    borderColor: '#1A1A1A',
    backgroundColor: '#1A1A1A' },
  stepNumber: {
    fontSize: 14,
    color: '#7A7A7A',
    fontWeight: '600' },
  currentStepNumber: {
    color: '#FFFFFF' },
  stepTitle: {
    fontSize: 12,
    color: '#7A7A7A',
    textAlign: 'center' },
  currentStepTitle: {
    color: '#1A1A1A',
    fontWeight: '600' },
  content: {
    flex: 1 },
  stepContent: {
    padding: 20 },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8 },
  stepDescription: {
    fontSize: 16,
    color: '#7A7A7A',
    lineHeight: 24,
    marginBottom: 24 },
  fields: {
    gap: 16 },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E3E1DC',
    paddingHorizontal: 20,
    paddingVertical: 16 },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12 },
  button: {
    flex: 1 } });