/**
 * FieldConfigurator - 動態欄位配置元件
 * 提供完整的欄位屬性設定，包含類型、驗證、安全等設定
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Platform, ScrollView, Alert } from 'react-native';
import {
  AdaptiveView,
  AdaptiveText,
  AdaptiveInput,
  AdaptiveButton,
  AdaptiveModal,
  AdaptiveSelect,
  AdaptiveSwitch,
  AdaptiveCheckbox,
  type AdaptiveViewProps,
} from '@/components/adaptive';
import { withAlpha } from '@/utils/colorUtils';
import {
  DynamicFieldConfig,
  FieldDataType,
  ValidationRule,
  ValidationRuleType,
  FieldSecurity,
  FieldSecurityLevel,
  PIIType,
  FieldFormatting,
} from '@/types/dynamic-field-mapping';
import { Timestamp } from 'firebase/firestore';

interface FieldConfiguratorProps {
  field: DynamicFieldConfig;
  onSave: (field: DynamicFieldConfig) => void;
  onCancel: () => void;
  visible: boolean;
  mode?: 'create' | 'edit';
}

interface ValidationRuleForm {
  type: ValidationRuleType;
  value: string;
  message: string;
  severity: 'error' | 'warning';
}

const DATA_TYPE_OPTIONS: Array<{ label: string; value: FieldDataType }> = [
  { label: '文字', value: 'text' },
  { label: '數字', value: 'number' },
  { label: '日期', value: 'date' },
  { label: '日期時間', value: 'datetime' },
  { label: '電子郵件', value: 'email' },
  { label: '電話號碼', value: 'phone' },
  { label: '網址', value: 'url' },
  { label: '布林值', value: 'boolean' },
  { label: 'JSON 物件', value: 'json' },
  { label: '陣列', value: 'array' },
  { label: '貨幣', value: 'currency' },
  { label: '百分比', value: 'percentage' },
  { label: '單選選項', value: 'select' },
  { label: '多選選項', value: 'multiselect' },
  { label: '長文字', value: 'longtext' },
  { label: '地址', value: 'address' },
];

const VALIDATION_RULE_OPTIONS: Array<{ label: string; value: ValidationRuleType }> = [
  { label: '必填', value: 'required' },
  { label: '最小長度', value: 'minLength' },
  { label: '最大長度', value: 'maxLength' },
  { label: '正則表達式', value: 'pattern' },
  { label: '最小值', value: 'min' },
  { label: '最大值', value: 'max' },
  { label: '允許的值', value: 'enum' },
  { label: '自定義驗證', value: 'custom' },
];

const SECURITY_LEVEL_OPTIONS: Array<{ label: string; value: FieldSecurityLevel }> = [
  { label: '公開', value: 'public' },
  { label: '內部使用', value: 'internal' },
  { label: '機密', value: 'confidential' },
  { label: '受限存取', value: 'restricted' },
];

const PII_TYPE_OPTIONS: Array<{ label: string; value: PIIType }> = [
  { label: '電子郵件', value: 'email' },
  { label: '電話號碼', value: 'phone' },
  { label: '身分證號', value: 'ssn' },
  { label: '信用卡號', value: 'creditCard' },
  { label: '證件號碼', value: 'idNumber' },
  { label: '護照號碼', value: 'passport' },
  { label: '銀行帳號', value: 'bankAccount' },
];

export const FieldConfigurator: React.FC<FieldConfiguratorProps> = ({
  field,
  onSave,
  onCancel,
  visible,
  mode = 'edit',
}) => {
  const [formData, setFormData] = useState<DynamicFieldConfig>(() => ({
    ...field,
    // 確保所有必要欄位都有預設值
    validationRules: field.validationRules || [],
    formatting: field.formatting || {},
    security: field.security || {
      level: 'public',
      readRoles: [],
      writeRoles: [],
      encrypted: false,
      auditLog: false,
      isPII: false,
    },
    usage: field.usage || {
      usageCount: 0,
      nullRatio: 0,
      uniqueValueCount: 0,
    },
    metadata: field.metadata || {
      createdBy: '',
      createdAt: Timestamp.now(),
      updatedBy: '',
      updatedAt: Timestamp.now(),
    },
  }));

  const [activeTab, setActiveTab] = useState<'basic' | 'validation' | 'formatting' | 'security'>('basic');
  const [newValidationRule, setNewValidationRule] = useState<ValidationRuleForm>({
    type: 'required',
    value: '',
    message: '',
    severity: 'error',
  });
  const [showAddValidation, setShowAddValidation] = useState(false);

  /**
   * 更新基本欄位資訊
   */
  const updateField = useCallback((updates: Partial<DynamicFieldConfig>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
      metadata: {
        ...prev.metadata,
        updatedAt: Timestamp.now(),
      },
    }));
  }, []);

  /**
   * 更新安全設定
   */
  const updateSecurity = useCallback((updates: Partial<FieldSecurity>) => {
    setFormData(prev => ({
      ...prev,
      security: {
        ...prev.security,
        ...updates,
      },
    }));
  }, []);

  /**
   * 更新格式化設定
   */
  const updateFormatting = useCallback((updates: Partial<FieldFormatting>) => {
    setFormData(prev => ({
      ...prev,
      formatting: {
        ...prev.formatting,
        ...updates,
      },
    }));
  }, []);

  /**
   * 新增驗證規則
   */
  const addValidationRule = useCallback(() => {
    if (!newValidationRule.message.trim()) {
      Alert.alert('錯誤', '請輸入錯誤訊息');
      return;
    }

    const rule: ValidationRule = {
      type: newValidationRule.type,
      value: newValidationRule.value || undefined,
      message: newValidationRule.message,
      severity: newValidationRule.severity,
    };

    setFormData(prev => ({
      ...prev,
      validationRules: [...prev.validationRules, rule],
    }));

    setNewValidationRule({
      type: 'required',
      value: '',
      message: '',
      severity: 'error',
    });
    setShowAddValidation(false);
  }, [newValidationRule]);

  /**
   * 移除驗證規則
   */
  const removeValidationRule = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      validationRules: prev.validationRules.filter((_, i) => i !== index),
    }));
  }, []);

  /**
   * 驗證表單
   */
  const validateForm = useCallback((): string | null => {
    if (!formData.displayName.trim()) {
      return '請輸入欄位顯示名稱';
    }

    if (!formData.fieldKey.trim()) {
      return '請輸入欄位鍵值';
    }

    // 檢查 fieldKey 格式（只允許字母、數字、底線）
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.fieldKey)) {
      return '欄位鍵值只能包含字母、數字和底線，且必須以字母或底線開頭';
    }

    return null;
  }, [formData]);

  /**
   * 儲存欄位
   */
  const handleSave = useCallback(() => {
    const error = validateForm();
    if (error) {
      Alert.alert('驗證錯誤', error);
      return;
    }

    onSave(formData);
  }, [formData, validateForm, onSave]);

  /**
   * 根據資料類型顯示相關的格式化選項
   */
  const renderFormattingOptions = useCallback(() => {
    const { dataType } = formData;
    const formatting = formData.formatting || {};

    switch (dataType) {
      case 'date':
      case 'datetime':
        return (
          <AdaptiveView style={{ marginTop: 16 }}>
            <AdaptiveText style={{ fontWeight: '600', marginBottom: 8 }}>日期格式</AdaptiveText>
            <AdaptiveInput
              value={formatting.dateFormat || ''}
              onChangeText={(text) => updateFormatting({ dateFormat: text })}
              placeholder="例如: YYYY-MM-DD"
              style={inputStyle}
            />
          </AdaptiveView>
        );

      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <AdaptiveView style={{ marginTop: 16 }}>
            <AdaptiveText style={{ fontWeight: '600', marginBottom: 8 }}>數字格式</AdaptiveText>
            <AdaptiveInput
              value={formatting.numberFormat?.decimals?.toString() || ''}
              onChangeText={(text) => updateFormatting({
                numberFormat: {
                  ...formatting.numberFormat,
                  decimals: parseInt(text) || 0,
                }
              })}
              placeholder="小數位數"
              keyboardType="numeric"
              style={[inputStyle, { marginBottom: 8 }]}
            />
            <AdaptiveInput
              value={formatting.numberFormat?.prefix || ''}
              onChangeText={(text) => updateFormatting({
                numberFormat: {
                  ...formatting.numberFormat,
                  prefix: text,
                }
              })}
              placeholder="前綴（例如: $）"
              style={[inputStyle, { marginBottom: 8 }]}
            />
            <AdaptiveInput
              value={formatting.numberFormat?.suffix || ''}
              onChangeText={(text) => updateFormatting({
                numberFormat: {
                  ...formatting.numberFormat,
                  suffix: text,
                }
              })}
              placeholder="後綴（例如: %）"
              style={inputStyle}
            />
          </AdaptiveView>
        );

      case 'text':
      case 'longtext':
        return (
          <AdaptiveView style={{ marginTop: 16 }}>
            <AdaptiveText style={{ fontWeight: '600', marginBottom: 8 }}>文字轉換</AdaptiveText>
            <AdaptiveSelect
              value={formatting.textTransform || 'none'}
              onValueChange={(value) => updateFormatting({ textTransform: value as any })}
              options={[
                { label: '無轉換', value: 'none' },
                { label: '全部大寫', value: 'uppercase' },
                { label: '全部小寫', value: 'lowercase' },
                { label: '首字母大寫', value: 'capitalize' },
              ]}
              style={inputStyle}
            />
          </AdaptiveView>
        );

      default:
        return null;
    }
  }, [formData.dataType, formData.formatting, updateFormatting]);

  /**
   * 渲染標籤頁
   */
  const renderTabs = () => (
    <AdaptiveView style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E3E1DC' }}>
      {[
        { key: 'basic', label: '基本設定' },
        { key: 'validation', label: '驗證規則' },
        { key: 'formatting', label: '格式化' },
        { key: 'security', label: '安全設定' },
      ].map((tab) => (
        <AdaptiveButton
          key={tab.key}
          onPress={() => setActiveTab(tab.key as any)}
          style={{
            flex: 1,
            paddingVertical: 12,
            backgroundColor: activeTab === tab.key ? '#007AFF' : 'transparent',
            borderRadius: 0,
          }}
        >
          <AdaptiveText
            style={{
              textAlign: 'center',
              fontWeight: activeTab === tab.key ? '600' : '400',
              color: activeTab === tab.key ? '#FFFFFF' : '#1C1C1E',
            }}
          >
            {tab.label}
          </AdaptiveText>
        </AdaptiveButton>
      ))}
    </AdaptiveView>
  );

  /**
   * 渲染基本設定標籤
   */
  const renderBasicTab = () => (
    <AdaptiveView style={{ padding: 16 }}>
      <AdaptiveView style={{ marginBottom: 16 }}>
        <AdaptiveText style={labelStyle}>顯示名稱 *</AdaptiveText>
        <AdaptiveInput
          value={formData.displayName}
          onChangeText={(text) => updateField({ displayName: text })}
          placeholder="輸入欄位顯示名稱"
          style={inputStyle}
        />
      </AdaptiveView>

      <AdaptiveView style={{ marginBottom: 16 }}>
        <AdaptiveText style={labelStyle}>欄位鍵值 *</AdaptiveText>
        <AdaptiveInput
          value={formData.fieldKey}
          onChangeText={(text) => updateField({ fieldKey: text })}
          placeholder="輸入欄位鍵值（僅限字母、數字、底線）"
          style={inputStyle}
          editable={!formData.isSystem}
        />
        {formData.isSystem && (
          <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginTop: 4 }}>
            系統欄位的鍵值無法修改
          </AdaptiveText>
        )}
      </AdaptiveView>

      <AdaptiveView style={{ marginBottom: 16 }}>
        <AdaptiveText style={labelStyle}>資料類型</AdaptiveText>
        <AdaptiveSelect
          value={formData.dataType}
          onValueChange={(value) => updateField({ dataType: value as FieldDataType })}
          options={DATA_TYPE_OPTIONS}
          style={inputStyle}
          disabled={formData.isSystem}
        />
      </AdaptiveView>

      <AdaptiveView style={{ marginBottom: 16 }}>
        <AdaptiveText style={labelStyle}>描述</AdaptiveText>
        <AdaptiveInput
          value={formData.description || ''}
          onChangeText={(text) => updateField({ description: text })}
          placeholder="輸入欄位描述（選填）"
          multiline
          numberOfLines={3}
          style={[inputStyle, { height: 80, textAlignVertical: 'top' }]}
        />
      </AdaptiveView>

      <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <AdaptiveView style={{ flex: 1, marginRight: 8 }}>
          <AdaptiveText style={labelStyle}>啟用狀態</AdaptiveText>
          <AdaptiveSwitch
            value={formData.isActive}
            onValueChange={(value) => updateField({ isActive: value })}
            disabled={formData.isSystem}
          />
        </AdaptiveView>

        <AdaptiveView style={{ flex: 1, marginLeft: 8 }}>
          <AdaptiveText style={labelStyle}>可搜尋</AdaptiveText>
          <AdaptiveSwitch
            value={formData.isSearchable}
            onValueChange={(value) => updateField({ isSearchable: value })}
          />
        </AdaptiveView>
      </AdaptiveView>

      <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AdaptiveView style={{ flex: 1, marginRight: 8 }}>
          <AdaptiveText style={labelStyle}>可排序</AdaptiveText>
          <AdaptiveSwitch
            value={formData.isSortable}
            onValueChange={(value) => updateField({ isSortable: value })}
          />
        </AdaptiveView>

        {formData.isSystem && (
          <AdaptiveView style={{ flex: 1, marginLeft: 8 }}>
            <AdaptiveText style={labelStyle}>系統欄位</AdaptiveText>
            <AdaptiveText style={{ fontSize: 14, color: '#FF9500', fontWeight: '600' }}>
              是
            </AdaptiveText>
          </AdaptiveView>
        )}
      </AdaptiveView>
    </AdaptiveView>
  );

  /**
   * 渲染驗證規則標籤
   */
  const renderValidationTab = () => (
    <AdaptiveView style={{ padding: 16 }}>
      <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <AdaptiveText style={{ fontSize: 16, fontWeight: '600' }}>驗證規則</AdaptiveText>
        <AdaptiveButton
          onPress={() => setShowAddValidation(true)}
          style={{
            backgroundColor: '#007AFF',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
          }}
        >
          <AdaptiveText style={{ color: '#FFFFFF', fontSize: 12 }}>新增規則</AdaptiveText>
        </AdaptiveButton>
      </AdaptiveView>

      {formData.validationRules.map((rule, index) => (
        <AdaptiveView
          key={index}
          style={{
            backgroundColor: '#F2F2F7',
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <AdaptiveView style={{ flex: 1 }}>
            <AdaptiveText style={{ fontWeight: '600', marginBottom: 4 }}>
              {VALIDATION_RULE_OPTIONS.find(opt => opt.value === rule.type)?.label || rule.type}
            </AdaptiveText>
            {rule.value && (
              <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginBottom: 2 }}>
                值: {rule.value}
              </AdaptiveText>
            )}
            <AdaptiveText style={{ fontSize: 12, color: '#8E8E93' }}>
              {rule.message}
            </AdaptiveText>
          </AdaptiveView>
          <AdaptiveButton
            onPress={() => removeValidationRule(index)}
            style={{
              backgroundColor: '#FF3B30',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
            }}
          >
            <AdaptiveText style={{ color: '#FFFFFF', fontSize: 12 }}>移除</AdaptiveText>
          </AdaptiveButton>
        </AdaptiveView>
      ))}

      {formData.validationRules.length === 0 && (
        <AdaptiveText style={{ textAlign: 'center', color: '#8E8E93', fontStyle: 'italic', marginTop: 32 }}>
          尚未設定驗證規則
        </AdaptiveText>
      )}

      {/* 新增驗證規則表單 */}
      {showAddValidation && (
        <AdaptiveView style={{
          marginTop: 16,
          padding: 16,
          backgroundColor: '#F2F2F7',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#007AFF',
        }}>
          <AdaptiveText style={{ fontWeight: '600', marginBottom: 12 }}>新增驗證規則</AdaptiveText>
          
          <AdaptiveView style={{ marginBottom: 12 }}>
            <AdaptiveText style={labelStyle}>規則類型</AdaptiveText>
            <AdaptiveSelect
              value={newValidationRule.type}
              onValueChange={(value) => setNewValidationRule(prev => ({ 
                ...prev, 
                type: value as ValidationRuleType 
              }))}
              options={VALIDATION_RULE_OPTIONS}
              style={inputStyle}
            />
          </AdaptiveView>

          {['minLength', 'maxLength', 'min', 'max', 'pattern', 'enum', 'custom'].includes(newValidationRule.type) && (
            <AdaptiveView style={{ marginBottom: 12 }}>
              <AdaptiveText style={labelStyle}>規則值</AdaptiveText>
              <AdaptiveInput
                value={newValidationRule.value}
                onChangeText={(text) => setNewValidationRule(prev => ({ ...prev, value: text }))}
                placeholder="輸入規則值"
                style={inputStyle}
              />
            </AdaptiveView>
          )}

          <AdaptiveView style={{ marginBottom: 12 }}>
            <AdaptiveText style={labelStyle}>錯誤訊息</AdaptiveText>
            <AdaptiveInput
              value={newValidationRule.message}
              onChangeText={(text) => setNewValidationRule(prev => ({ ...prev, message: text }))}
              placeholder="輸入驗證失敗時的錯誤訊息"
              style={inputStyle}
            />
          </AdaptiveView>

          <AdaptiveView style={{ marginBottom: 12 }}>
            <AdaptiveText style={labelStyle}>嚴重程度</AdaptiveText>
            <AdaptiveSelect
              value={newValidationRule.severity}
              onValueChange={(value) => setNewValidationRule(prev => ({ 
                ...prev, 
                severity: value as 'error' | 'warning' 
              }))}
              options={[
                { label: '錯誤', value: 'error' },
                { label: '警告', value: 'warning' },
              ]}
              style={inputStyle}
            />
          </AdaptiveView>

          <AdaptiveView style={{ flexDirection: 'row', gap: 8 }}>
            <AdaptiveButton
              onPress={addValidationRule}
              style={{
                flex: 1,
                backgroundColor: '#34C759',
                paddingVertical: 8,
                borderRadius: 6,
              }}
            >
              <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center' }}>確定</AdaptiveText>
            </AdaptiveButton>
            <AdaptiveButton
              onPress={() => setShowAddValidation(false)}
              style={{
                flex: 1,
                backgroundColor: '#8E8E93',
                paddingVertical: 8,
                borderRadius: 6,
              }}
            >
              <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center' }}>取消</AdaptiveText>
            </AdaptiveButton>
          </AdaptiveView>
        </AdaptiveView>
      )}
    </AdaptiveView>
  );

  /**
   * 渲染格式化標籤
   */
  const renderFormattingTab = () => (
    <AdaptiveView style={{ padding: 16 }}>
      <AdaptiveText style={{ fontSize: 16, fontWeight: '600', marginBottom: 16 }}>格式化設定</AdaptiveText>
      {renderFormattingOptions()}
      {!renderFormattingOptions() && (
        <AdaptiveText style={{ textAlign: 'center', color: '#8E8E93', fontStyle: 'italic', marginTop: 32 }}>
          此資料類型無額外格式化選項
        </AdaptiveText>
      )}
    </AdaptiveView>
  );

  /**
   * 渲染安全設定標籤
   */
  const renderSecurityTab = () => (
    <AdaptiveView style={{ padding: 16 }}>
      <AdaptiveText style={{ fontSize: 16, fontWeight: '600', marginBottom: 16 }}>安全設定</AdaptiveText>

      <AdaptiveView style={{ marginBottom: 16 }}>
        <AdaptiveText style={labelStyle}>安全層級</AdaptiveText>
        <AdaptiveSelect
          value={formData.security.level}
          onValueChange={(value) => updateSecurity({ level: value as FieldSecurityLevel })}
          options={SECURITY_LEVEL_OPTIONS}
          style={inputStyle}
        />
      </AdaptiveView>

      <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <AdaptiveView style={{ flex: 1, marginRight: 8 }}>
          <AdaptiveText style={labelStyle}>加密儲存</AdaptiveText>
          <AdaptiveSwitch
            value={formData.security.encrypted}
            onValueChange={(value) => updateSecurity({ encrypted: value })}
          />
        </AdaptiveView>

        <AdaptiveView style={{ flex: 1, marginLeft: 8 }}>
          <AdaptiveText style={labelStyle}>審計日誌</AdaptiveText>
          <AdaptiveSwitch
            value={formData.security.auditLog}
            onValueChange={(value) => updateSecurity({ auditLog: value })}
          />
        </AdaptiveView>
      </AdaptiveView>

      <AdaptiveView style={{ marginBottom: 16 }}>
        <AdaptiveText style={labelStyle}>個人識別資訊 (PII)</AdaptiveText>
        <AdaptiveSwitch
          value={formData.security.isPII}
          onValueChange={(value) => updateSecurity({ isPII: value })}
        />
      </AdaptiveView>

      {formData.security.isPII && (
        <AdaptiveView style={{ marginBottom: 16 }}>
          <AdaptiveText style={labelStyle}>PII 類型</AdaptiveText>
          <AdaptiveSelect
            value={formData.security.piiType || ''}
            onValueChange={(value) => updateSecurity({ piiType: value as PIIType })}
            options={[
              { label: '請選擇...', value: '' },
              ...PII_TYPE_OPTIONS,
            ]}
            style={inputStyle}
          />
        </AdaptiveView>
      )}

      {formData.security.isPII && (
        <AdaptiveView style={{ marginBottom: 16 }}>
          <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <AdaptiveText style={labelStyle}>資料遮罩</AdaptiveText>
            <AdaptiveSwitch
              value={formData.security.masking?.enabled || false}
              onValueChange={(value) => updateSecurity({
                masking: {
                  enabled: value,
                  pattern: formData.security.masking?.pattern || '',
                }
              })}
            />
          </AdaptiveView>

          {formData.security.masking?.enabled && (
            <AdaptiveInput
              value={formData.security.masking.pattern}
              onChangeText={(text) => updateSecurity({
                masking: {
                  enabled: true,
                  pattern: text,
                }
              })}
              placeholder="遮罩模式 (例如: ****-****-****-{last4})"
              style={inputStyle}
            />
          )}
        </AdaptiveView>
      )}
    </AdaptiveView>
  );

  const inputStyle = {
    borderWidth: 1,
    borderColor: '#E3E1DC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  };

  const labelStyle = {
    fontWeight: '600' as const,
    marginBottom: 8,
    color: '#1C1C1E',
  };

  return (
    <AdaptiveModal
      visible={visible}
      onRequestClose={onCancel}
      size="large"
      animationType="slide"
    >
      <AdaptiveView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* 標題欄 */}
        <AdaptiveView style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E3E1DC',
        }}>
          <AdaptiveText style={{ fontSize: 18, fontWeight: '600' }}>
            {mode === 'create' ? '建立新欄位' : '編輯欄位'}
          </AdaptiveText>
          <AdaptiveButton onPress={onCancel}>
            <AdaptiveText style={{ color: '#8E8E93', fontSize: 16 }}>✕</AdaptiveText>
          </AdaptiveButton>
        </AdaptiveView>

        {/* 標籤頁 */}
        {renderTabs()}

        {/* 內容區域 */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {activeTab === 'basic' && renderBasicTab()}
          {activeTab === 'validation' && renderValidationTab()}
          {activeTab === 'formatting' && renderFormattingTab()}
          {activeTab === 'security' && renderSecurityTab()}
        </ScrollView>

        {/* 底部按鈕 */}
        <AdaptiveView style={{
          flexDirection: 'row',
          gap: 12,
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: '#E3E1DC',
        }}>
          <AdaptiveButton
            onPress={onCancel}
            style={{
              flex: 1,
              backgroundColor: '#8E8E93',
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
              取消
            </AdaptiveText>
          </AdaptiveButton>
          
          <AdaptiveButton
            onPress={handleSave}
            style={{
              flex: 1,
              backgroundColor: '#007AFF',
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
              {mode === 'create' ? '建立' : '儲存'}
            </AdaptiveText>
          </AdaptiveButton>
        </AdaptiveView>
      </AdaptiveView>
    </AdaptiveModal>
  );
};

export default FieldConfigurator;