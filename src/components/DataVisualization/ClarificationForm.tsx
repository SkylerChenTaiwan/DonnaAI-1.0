/**
 * 澄清表單元件
 * 收集查詢所需的額外資訊
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { ClarificationField, ClarificationRequest } from '../../types/data-visualization';
import { colors } from '../../theme/colors';

interface ClarificationFormProps {
  request: ClarificationRequest;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
}

export const ClarificationForm: React.FC<ClarificationFormProps> = ({
  request,
  onSubmit,
  onCancel
}) => {
  // 初始化表單資料
  const [formData, setFormData] = useState(() => {
    const initialData: any = {};
    request.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialData[field.name] = field.defaultValue;
      } else if (field.options?.find(o => o.default)) {
        initialData[field.name] = field.options.find(o => o.default)!.value;
      } else if (field.options && field.options.length > 0) {
        initialData[field.name] = field.options[0].value;
      }
    });
    return initialData;
  });

  // 更新欄位值
  const updateField = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // 檢查表單是否有效
  const isFormValid = () => {
    return request.fields.every(field => {
      if (field.required === false) return true;
      const value = formData[field.name];
      return value !== undefined && value !== null && value !== '';
    });
  };

  // 渲染欄位
  const renderField = (field: ClarificationField) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'select':
        return (
          <View key={field.name} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.optionsContainer}>
              {field.options?.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    value === option.value && styles.optionButtonSelected
                  ]}
                  onPress={() => updateField(field.name, option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    value === option.value && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'multiselect':
        return (
          <View key={field.name} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.optionsContainer}>
              {field.options?.map(option => {
                const selectedValues = Array.isArray(value) ? value : [];
                const isSelected = selectedValues.includes(option.value);
                
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected
                    ]}
                    onPress={() => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = isSelected
                        ? currentValues.filter(v => v !== option.value)
                        : [...currentValues, option.value];
                      updateField(field.name, newValues);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 'dateRange':
        return (
          <View key={field.name} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.optionsContainer}>
              {[
                { value: 'thisWeek', label: '本週' },
                { value: 'thisMonth', label: '本月' },
                { value: 'thisQuarter', label: '本季' },
                { value: 'lastMonth', label: '上月' },
                { value: 'lastQuarter', label: '上季' }
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    value === option.value && styles.optionButtonSelected
                  ]}
                  onPress={() => updateField(field.name, option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    value === option.value && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>請提供以下資訊以生成圖表</Text>
        <Text style={styles.subtitle}>
          我們需要一些額外資訊來準確理解您的查詢需求
        </Text>
      </View>

      <ScrollView style={styles.formContent}>
        {request.fields.map(renderField)}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            !isFormValid() && styles.submitButtonDisabled
          ]}
          onPress={() => onSubmit(formData)}
          disabled={!isFormValid()}
        >
          <Text style={[
            styles.submitButtonText,
            !isFormValid() && styles.submitButtonTextDisabled
          ]}>
            生成圖表
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  formContent: {
    flex: 1,
    padding: 20
  },
  fieldContainer: {
    marginBottom: 25
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  optionTextSelected: {
    color: 'white'
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666'
  },
  submitButton: {
    backgroundColor: colors.primary
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc'
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white'
  },
  submitButtonTextDisabled: {
    color: '#999'
  }
});