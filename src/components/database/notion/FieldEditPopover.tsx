/**
 * 欄位編輯 Popover 元件
 * 提供 Notion 風格的欄位編輯介面
 */

import React, { useState, useEffect } from 'react';
import {
  AdaptiveInput,
  AdaptiveSwitch
} from '@/components/adaptive';
import { View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform
 } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Popover } from '@/components/common/Popover';
import { Icon } from '@/components/common/Icon';
import { processFieldDescription } from '@/services/api/ai-integration';
import { DesignSystem } from '@/theme/designSystem';
import { ColumnConfig } from './types';
import { FieldConfig } from '@/types/fieldDefinitions';

interface FieldEditPopoverProps {
  visible: boolean;
  onClose: () => void;
  anchor: React.RefObject<any>;
  fieldConfig: ColumnConfig;
  onUpdate: (fieldKey: string, updates: Partial<FieldConfig>) => Promise<void>;
  canEdit: boolean;
  activeTab: 'customers' | 'tasks' | 'records';
}

export const FieldEditPopover: React.FC<FieldEditPopoverProps> = ({
  visible,
  onClose,
  anchor,
  fieldConfig,
  onUpdate,
  canEdit,
  activeTab
}) => {
  console.log('🎯 FieldEditPopover 渲染:', {
    visible,
    hasAnchor: !!anchor,
    hasAnchorCurrent: !!anchor?.current,
    fieldTitle: fieldConfig?.title,
    canEdit
  });
  // 編輯狀態
  const [fieldName, setFieldName] = useState(fieldConfig?.title || '');
  const [fieldType, setFieldType] = useState(fieldConfig?.type || 'text');
  const [isRequired, setIsRequired] = useState(false); // ColumnConfig doesn't have required
  const [isVisible, setIsVisible] = useState(true); // ColumnConfig doesn't have visible
  
  // AI 處理狀態
  const [aiDescription, setAiDescription] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  
  // 保存狀態
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 初始化欄位資料
  useEffect(() => {
    if (fieldConfig) {
      setFieldName(fieldConfig.title || '');
      setFieldType(fieldConfig.type || 'text');
      // ColumnConfig 沒有 required 和 visible 屬性，使用預設值
      setIsRequired(false);
      setIsVisible(true);
      
      // 如果有 AI 欄位解釋，顯示使用者描述
      if ((fieldConfig as any).aiFieldInterpretation?.userDescription) {
        setAiDescription((fieldConfig as any).aiFieldInterpretation.userDescription);
        setAiResult((fieldConfig as any).aiFieldInterpretation);
      }
    }
  }, [fieldConfig]);

  // 監測變更
  useEffect(() => {
    const changed = 
      fieldName !== fieldConfig?.title ||
      fieldType !== fieldConfig?.type ||
      isRequired !== false || // Always compare with default since ColumnConfig doesn't have this
      isVisible !== true || // Always compare with default since ColumnConfig doesn't have this
      aiDescription !== (fieldConfig as any)?.aiFieldInterpretation?.userDescription;
    
    setHasChanges(changed);
  }, [fieldName, fieldType, isRequired, isVisible, aiDescription, fieldConfig]);

  // 處理 AI 描述
  const handleAIProcess = async () => {
    if (!aiDescription.trim()) return;
    
    setIsProcessingAI(true);
    try {
      const result = await processFieldDescription(
        aiDescription,
        fieldConfig.type
      );
      
      // 解析 AI 結果
      const aiProcessed = {
        userDescription: aiDescription,
        aiProcessedDescription: result,
        extractionRules: [], // TODO: 從 AI 結果中提取
        examples: [],        // TODO: 從 AI 結果中提取
        synonyms: []         // TODO: 從 AI 結果中提取
      };
      
      setAiResult(aiProcessed);
    } catch (error) {
      console.error('AI 處理失敗:', error);
      alert('AI 處理失敗，請稍後再試');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // 保存變更
  const handleSave = async () => {
    if (!hasChanges || !canEdit) return;
    
    setIsSaving(true);
    try {
      const updates: Partial<FieldConfig> = {
        label: fieldName, // This will be mapped to title in DatabaseScreen
        type: fieldType as any,
        required: isRequired,
        visible: isVisible };
      
      // 如果有 AI 結果，加入更新
      if (aiResult) {
        (updates as any).aiFieldInterpretation = aiResult;
      }
      
      await onUpdate(fieldConfig.key, updates);
      onClose();
    } catch (error) {
      console.error('保存失敗:', error);
      alert('保存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  if (!fieldConfig) return null;

  return (
    <Popover
      visible={visible}
      onClose={onClose}
      anchor={anchor}
      placement="bottom"
      offset={{ x: 0, y: 8 }}
      minWidth={320}
      maxHeight={500}
    >
      <View style={styles.container}>
        {/* 標題列 */}
        <View style={styles.header}>
          <Text style={styles.title}>欄位設定</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={20} color={DesignSystem.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 可編輯欄位 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>編輯設定</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>欄位名稱</Text>
              <AdaptiveInput
                style={StyleSheet.flatten([styles.input, !canEdit && styles.inputDisabled])}
                value={fieldName}
                onChangeText={setFieldName}
                placeholder="輸入欄位名稱"
                placeholderTextColor="#B0B0B0"
                editable={canEdit}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>欄位類型</Text>
              <View style={StyleSheet.flatten([styles.pickerContainer, !canEdit && styles.pickerDisabled])}>
                <Picker
                  selectedValue={fieldType}
                  onValueChange={(itemValue) => setFieldType(itemValue)}
                  enabled={canEdit}
                  style={styles.picker}
                  dropdownIconColor={DesignSystem.colors.text.secondary}
                >
                  {getFieldTypes().map((type) => (
                    <Picker.Item 
                      key={type.value} 
                      label={type.label} 
                      value={type.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.switchField}>
              <View>
                <Text style={styles.fieldLabel}>必填欄位</Text>
                <Text style={styles.fieldHint}>用戶必須填寫此欄位</Text>
              </View>
              <AdaptiveSwitch
                value={isRequired}
                onValueChange={setIsRequired}
                disabled={!canEdit}
                trackColor={{ false: '#E5E5E5', true: DesignSystem.colors.primary }}
              />
            </View>

            <View style={styles.switchField}>
              <View>
                <Text style={styles.fieldLabel}>顯示欄位</Text>
                <Text style={styles.fieldHint}>在表格中顯示此欄位</Text>
              </View>
              <AdaptiveSwitch
                value={isVisible}
                onValueChange={setIsVisible}
                disabled={!canEdit}
                trackColor={{ false: '#E5E5E5', true: DesignSystem.colors.primary }}
              />
            </View>
          </View>

          {/* AI 欄位備註 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>欄位說明</Text>
            <Text style={styles.sectionHint}>
              描述此欄位的用途和規則，讓 AI 更好地理解如何填寫
            </Text>

            <View style={styles.field}>
              <AdaptiveInput
                style={StyleSheet.flatten([styles.input, styles.textArea, !canEdit && styles.inputDisabled])}
                value={aiDescription}
                onChangeText={setAiDescription}
                placeholder="例如：記錄客戶最近一次購買的產品名稱和日期"
                placeholderTextColor="#B0B0B0"
                multiline
                numberOfLines={3}
                editable={canEdit}
              />
              
              {canEdit && aiDescription.trim() && (
                <TouchableOpacity
                  style={StyleSheet.flatten([styles.aiButton, isProcessingAI && styles.aiButtonDisabled])}
                  onPress={handleAIProcess}
                  disabled={isProcessingAI}
                >
                  {isProcessingAI ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="sparkles" size={16} color="#fff" />
                      <Text style={styles.aiButtonText}>AI 處理</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* AI 處理結果 */}
            {aiResult && (
              <View style={styles.aiResult}>
                <Text style={styles.aiResultLabel}>AI優化結果</Text>
                <Text style={styles.aiResultText}>
                  {aiResult.aiProcessedDescription}
                </Text>
                
                {aiResult.examples?.length > 0 && (
                  <View style={styles.aiExamples}>
                    <Text style={styles.aiResultLabel}>範例值</Text>
                    {aiResult.examples.map((example: string, index: number) => (
                      <Text key={index} style={styles.aiExample}>• {example}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* 底部按鈕 */}
        {canEdit && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={StyleSheet.flatten([
                styles.saveButton,
                (!hasChanges || isSaving) && styles.saveButtonDisabled
              ])}
              onPress={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>保存</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Popover>
  );
};

// 輔助函數：取得欄位類型標籤
function getFieldTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    text: '文字',
    number: '數字',
    date: '日期',
    datetime: '日期時間',
    select: '單選',
    multiselect: '多選',
    boolean: '是/否',
    email: '電子郵件',
    phone: '電話',
    url: '網址',
    textarea: '多行文字',
    tags: '標籤'
  };
  return typeLabels[type] || type;
}

// 輔助函數：取得所有欄位類型選項
function getFieldTypes() {
  return [
    { value: 'text', label: '文字' },
    { value: 'number', label: '數字' },
    { value: 'email', label: '電子郵件' },
    { value: 'phone', label: '電話' },
    { value: 'date', label: '日期' },
    { value: 'datetime', label: '日期時間' },
    { value: 'select', label: '單選' },
    { value: 'multiselect', label: '多選' },
    { value: 'boolean', label: '是/否' },
    { value: 'url', label: '網址' },
    { value: 'textarea', label: '多行文字' },
    { value: 'tags', label: '標籤' },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5' },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary },
  closeButton: {
    padding: 4 },
  content: {
    flex: 1 },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 4 },
  sectionHint: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
    marginBottom: 12 },
  field: {
    marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    color: DesignSystem.colors.text.secondary,
    marginBottom: 6 },
  fieldValue: {
    fontSize: 14,
    color: DesignSystem.colors.text.primary },
  fieldHint: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
    marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: DesignSystem.colors.text.primary,
    backgroundColor: '#FAFAFA' },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: DesignSystem.colors.text.secondary },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top' },
  switchField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16 },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start' },
  aiButtonDisabled: {
    opacity: 0.6 },
  aiButtonText: {
    color: '#fff',
    fontSize: 13,
    marginLeft: 4 },
  aiResult: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5E5' },
  aiResultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignSystem.colors.text.secondary,
    marginBottom: 4 },
  aiResultText: {
    fontSize: 13,
    color: DesignSystem.colors.text.primary,
    lineHeight: 18 },
  aiExamples: {
    marginTop: 8 },
  aiExample: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
    marginTop: 2 },
  fieldTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 },
  fieldTypeValue: {
    fontSize: 14,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500' },
  fieldTypeHint: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden' },
  pickerDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6 },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 44,
    width: '100%',
    fontSize: 14,
    color: DesignSystem.colors.text.primary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 8 },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5E5' },
  cancelButtonText: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: DesignSystem.colors.primary,
    minWidth: 60,
    alignItems: 'center' },
  saveButtonDisabled: {
    opacity: 0.6 },
  saveButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500' } });