/**
 * 記錄表單組件
 * 支援文字和語音輸入，整合客戶選擇功能
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DesignSystem } from '@/theme/designSystem';
import {
  AdaptiveModal,
  AdaptiveButton
} from '@/components/adaptive';
import { View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Icon } from '@/components/common/Icon';

import { RecordFormSchema, RecordFormData } from '@/services/validation/form-schemas';
import { FormField } from './FormField';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AudioInput } from '@/components/input/AudioInput';

export interface RecordFormProps {
  onSubmit: (data: RecordFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<RecordFormData>;
  isSubmitting?: boolean;
  userId: string;
  organizationId: string;
  teamId: string;
}

type InputMode = 'text' | 'voice';

export const RecordForm: React.FC<RecordFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting = false,
  userId,
  organizationId,
  teamId }) => {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [showAudioInput, setShowAudioInput] = useState(false);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [availableCustomers, setAvailableCustomers] = useState<Array<{
    id: string;
    name: string;
    company: string;
  }>>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset } = useForm<RecordFormData>({
    resolver: zodResolver(RecordFormSchema),
    defaultValues: {
      type: 'meeting',
      priority: 'medium',
      status: 'draft',
      tags: [],
      ...initialData } });

  const watchedContent = watch('content');
  const watchedCustomerId = watch('customerId');

  // 載入客戶列表
  const loadCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      // TODO: 實作從 Firebase 載入客戶列表
      // const customers = await getCustomers(organizationId, teamId);
      // setAvailableCustomers(customers);
      
      // 暫時使用模擬數據
      setAvailableCustomers([
        { id: '1', name: '王小明', company: 'ABC公司' },
        { id: '2', name: '李小華', company: 'XYZ企業' },
        { id: '3', name: '張小美', company: '123集團' },
      ]);
    } catch (error) {
      console.error('載入客戶列表失敗:', error);
      Alert.alert('錯誤', '無法載入客戶列表');
    } finally {
      setLoadingCustomers(false);
    }
  }, [organizationId, teamId]);

  // 初始化時載入客戶
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // 處理表單提交
  const onFormSubmit = useCallback(async (data: RecordFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('記錄創建失敗:', error);
      Alert.alert('錯誤', '記錄創建失敗，請重試');
    }
  }, [onSubmit]);

  // 處理語音輸入完成
  const handleAudioTranscription = useCallback((result: {
    transcription: string;
    audioUri: string;
    duration: number;
    confidence: number;
    purpose: string;
    metadata?: any;
  }) => {
    // 將語音轉錄內容設定到表單
    const currentContent = watchedContent || '';
    const separator = currentContent ? '\n\n--- 語音轉錄 ---\n' : '';
    const newContent = currentContent + separator + result.transcription;
    
    setValue('content', newContent, { shouldValidate: true });
    
    // 設定記錄類型（根據語音目的）
    if (result.purpose === 'meeting') {
      setValue('type', 'meeting');
    } else if (result.purpose === 'customer') {
      setValue('type', 'call');
    } else if (result.purpose === 'note') {
      setValue('type', 'note');
    }

    // 添加語音相關標籤
    const currentTags = watch('tags') || [];
    if (!currentTags.includes('語音輸入')) {
      setValue('tags', [...currentTags, '語音輸入']);
    }

    // 如果信心度較低，添加警告標籤
    if (result.confidence < 0.7) {
      if (!currentTags.includes('需驗證')) {
        setValue('tags', [...currentTags, '需驗證']);
      }
    }

    setShowAudioInput(false);
    
    Alert.alert(
      '語音轉錄完成',
      `已將語音內容加入記錄中（信心度: ${(result.confidence * 100).toFixed(1)}%）`,
      [{ text: '確定' }]
    );
  }, [watchedContent, setValue, watch]);

  // 處理客戶選擇
  const handleCustomerSelect = useCallback((customerId: string) => {
    setValue('customerId', customerId, { shouldValidate: true });
    setShowCustomerSelector(false);
  }, [setValue]);

  // 取得選中的客戶資訊
  const getSelectedCustomer = useCallback(() => {
    if (!watchedCustomerId) return null;
    return availableCustomers.find(c => c.id === watchedCustomerId);
  }, [watchedCustomerId, availableCustomers]);

  // 記錄類型選項
  const recordTypeOptions = [
    { label: '會議記錄', value: 'meeting' },
    { label: '通話記錄', value: 'call' },
    { label: '一般記錄', value: 'note' },
    { label: '待辦事項', value: 'todo' },
    { label: '想法筆記', value: 'idea' },
  ];

  // 優先級選項
  const priorityOptions = [
    { label: '低', value: 'low' },
    { label: '中', value: 'medium' },
    { label: '高', value: 'high' },
    { label: '緊急', value: 'urgent' },
  ];

  // 狀態選項
  const statusOptions = [
    { label: '草稿', value: 'draft' },
    { label: '待處理', value: 'pending' },
    { label: '進行中', value: 'in_progress' },
    { label: '已完成', value: 'completed' },
    { label: '已封存', value: 'archived' },
  ];

  // 輸入模式切換按鈕
  const renderInputModeToggle = () => (
    <View style={styles.inputModeContainer}>
      <Text style={styles.inputModeLabel}>輸入方式：</Text>
      <View style={styles.inputModeToggle}>
        <TouchableOpacity
          style={StyleSheet.flatten([
            styles.modeButton,
            inputMode === 'text' && styles.modeButtonActive,
          ])}
          onPress={() => setInputMode('text')}
        >
          <Icon 
            name="create-outline" 
            size={18} 
            color={inputMode === 'text' ? '#FFFFFF' : '#7A7A7A'} 
          />
          <Text style={StyleSheet.flatten([
            styles.modeButtonText,
            inputMode === 'text' && styles.modeButtonTextActive,
          ])}>
            文字輸入
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={StyleSheet.flatten([
            styles.modeButton,
            inputMode === 'voice' && styles.modeButtonActive,
          ])}
          onPress={() => setInputMode('voice')}
        >
          <Icon 
            name="mic-outline" 
            size={18} 
            color={inputMode === 'voice' ? '#FFFFFF' : '#7A7A7A'} 
          />
          <Text style={StyleSheet.flatten([
            styles.modeButtonText,
            inputMode === 'voice' && styles.modeButtonTextActive,
          ])}>
            語音輸入
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 客戶選擇器
  const renderCustomerSelector = () => (
    <AdaptiveModal
      visible={showCustomerSelector}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.customerSelectorModal}>
        <View style={styles.customerSelectorHeader}>
          <Text style={styles.customerSelectorTitle}>選擇客戶</Text>
          <TouchableOpacity
            style={styles.customerSelectorClose}
            onPress={() => setShowCustomerSelector(false)}
          >
            <Icon name="close" size={24} color="#7A7A7A" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.customerList}>
          {loadingCustomers ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner />
              <Text style={styles.loadingText}>載入客戶列表中...</Text>
            </View>
          ) : (
            <>
              {/* 無客戶選項 */}
              <TouchableOpacity
                style={styles.customerOption}
                onPress={() => handleCustomerSelect('')}
              >
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>無關聯客戶</Text>
                  <Text style={styles.customerCompany}>一般記錄</Text>
                </View>
                {!watchedCustomerId && (
                  <Icon name="checkmark" size={20} color="#22c55e" />
                )}
              </TouchableOpacity>
              
              {/* 客戶列表 */}
              {availableCustomers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={styles.customerOption}
                  onPress={() => handleCustomerSelect(customer.id)}
                >
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    <Text style={styles.customerCompany}>{customer.company}</Text>
                  </View>
                  {watchedCustomerId === customer.id && (
                    <Icon name="checkmark" size={20} color="#22c55e" />
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </AdaptiveModal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* 輸入模式選擇 */}
        {renderInputModeToggle()}

        {/* 記錄標題 */}
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="記錄標題"
              type="text"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.title?.message}
              placeholder="輸入記錄標題..."
              required
            />
          )}
        />

        {/* 記錄類型 */}
        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="記錄類型"
              type="select"
              value={value}
              onValueChange={onChange}
              options={recordTypeOptions}
              error={errors.type?.message}
              required
            />
          )}
        />

        {/* 客戶選擇 */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>關聯客戶</Text>
          <TouchableOpacity
            style={styles.customerSelector}
            onPress={() => setShowCustomerSelector(true)}
          >
            <View style={styles.customerSelectorContent}>
              {watchedCustomerId ? (
                <>
                  <View style={styles.selectedCustomer}>
                    <Text style={styles.selectedCustomerName}>
                      {getSelectedCustomer()?.name}
                    </Text>
                    <Text style={styles.selectedCustomerCompany}>
                      {getSelectedCustomer()?.company}
                    </Text>
                  </View>
                  <Icon name="person" size={20} color="#1A1A1A" />
                </>
              ) : (
                <>
                  <Text style={styles.customerPlaceholder}>選擇客戶（可選）</Text>
                  <Icon name="person-outline" size={20} color="#7A7A7A" />
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* 記錄內容 */}
        <View style={styles.fieldContainer}>
          <View style={styles.contentLabelRow}>
            <Text style={StyleSheet.flatten([styles.fieldLabel, styles.required])}>記錄內容</Text>
            {inputMode === 'voice' && (
              <TouchableOpacity
                style={styles.voiceInputButton}
                onPress={() => setShowAudioInput(true)}
              >
                <Icon name="mic" size={16} color="#FFFFFF" />
                <Text style={styles.voiceInputButtonText}>開始錄音</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Controller
            control={control}
            name="content"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                type="multiline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.content?.message}
                placeholder={
                  inputMode === 'text' 
                    ? "輸入記錄內容..." 
                    : "使用上方的錄音按鈕來添加語音內容，或在此輸入文字..."
                }
                minHeight={120}
                required
              />
            )}
          />
        </View>

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

        {/* 預計完成時間 */}
        <Controller
          control={control}
          name="dueDate"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="預計完成時間"
              type="date"
              value={value}
              onDateChange={onChange}
              error={errors.dueDate?.message}
            />
          )}
        />
      </ScrollView>

      {/* 底部按鈕 */}
      <View style={styles.footer}>
        {onCancel && (
          <AdaptiveButton
            title="取消"
            variant="secondary"
            onPress={onCancel}
            style={styles.footerButton}
          />
        )}
        <AdaptiveButton
          title={isSubmitting ? "創建中..." : "創建記錄"}
          onPress={handleSubmit(onFormSubmit)}
          disabled={!isValid || isSubmitting}
          style={styles.footerButton}
          icon={isSubmitting ? undefined : "add"}
        />
      </View>

      {/* 語音輸入 Modal */}
      <AdaptiveModal
        visible={showAudioInput}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <AudioInput
          onTranscriptionComplete={handleAudioTranscription}
          onCancel={() => setShowAudioInput(false)}
          userId={userId}
          language="zh-TW"
          enableQualityCheck={true}
        />
      </AdaptiveModal>

      {/* 客戶選擇器 Modal */}
      {renderCustomerSelector()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0' },
  form: {
    flex: 1,
    padding: 20 },
  
  // 輸入模式切換
  inputModeContainer: {
    marginBottom: 20 },
  inputModeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12 },
  inputModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E3E1DC' },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6 },
  modeButtonActive: {
    backgroundColor: '#1A1A1A' },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7A7A7A' },
  modeButtonTextActive: {
    color: '#FFFFFF' },

  // 表單欄位
  fieldContainer: {
    marginBottom: 20 },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8 },
  required: {
    color: '#1A1A1A' },
  contentLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8 },
  voiceInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'DesignSystem.colors.status.error',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4 },
  voiceInputButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF' },

  // 客戶選擇器
  customerSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E1DC',
    minHeight: 56 },
  customerSelectorContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12 },
  selectedCustomer: {
    flex: 1 },
  selectedCustomerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A' },
  selectedCustomerCompany: {
    fontSize: 14,
    color: '#7A7A7A',
    marginTop: 2 },
  customerPlaceholder: {
    fontSize: 16,
    color: '#7A7A7A' },

  // 客戶選擇器 Modal
  customerSelectorModal: {
    flex: 1,
    backgroundColor: '#F0F0F0' },
  customerSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC' },
  customerSelectorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A' },
  customerSelectorClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center' },
  customerList: {
    flex: 1,
    padding: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60 },
  loadingText: {
    fontSize: 16,
    color: '#7A7A7A',
    marginTop: 12 },
  customerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E3E1DC' },
  customerInfo: {
    flex: 1 },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A' },
  customerCompany: {
    fontSize: 14,
    color: '#7A7A7A',
    marginTop: 2 },

  // 底部按鈕
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E3E1DC' },
  footerButton: {
    flex: 1 } });