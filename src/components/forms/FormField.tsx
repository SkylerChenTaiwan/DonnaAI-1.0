/**
 * 通用表格欄位組件
 * 支持文字、選擇、開關、標籤等多種輸入類型
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { TextInput } from '@/components/common/TextInput';
import { FormFieldConfig } from '@/services/validation/form-schemas';

interface FormFieldProps {
  config: FormFieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  config,
  value,
  onChange,
  error,
  containerStyle,
  disabled = false,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const renderField = () => {
    switch (config.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <TextInput
            label={config.label}
            value={value || ''}
            onChangeText={onChange}
            placeholder={config.placeholder}
            keyboardType={
              config.type === 'email' 
                ? 'email-address' 
                : config.type === 'tel' 
                ? 'phone-pad' 
                : 'default'
            }
            autoCapitalize={config.type === 'email' ? 'none' : 'sentences'}
            error={error}
            editable={!disabled}
          />
        );

      case 'textarea':
        return (
          <TextInput
            label={config.label}
            value={value || ''}
            onChangeText={onChange}
            placeholder={config.placeholder}
            multiline
            numberOfLines={4}
            style={styles.textarea}
            error={error}
            editable={!disabled}
          />
        );

      case 'select':
        return (
          <View>
            <Text style={styles.fieldLabel}>{config.label}</Text>
            <View style={[styles.pickerContainer, error ? styles.errorBorder : null]}>
              <Picker
                selectedValue={value || ''}
                onValueChange={(itemValue) => onChange(itemValue)}
                enabled={!disabled}
                style={styles.picker}
              >
                <Picker.Item 
                  label={config.placeholder || `選擇${config.label}`} 
                  value="" 
                />
                {config.options?.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      case 'multiselect':
        return (
          <View>
            <Text style={styles.fieldLabel}>{config.label}</Text>
            <TouchableOpacity
              style={[styles.multiselectButton, error ? styles.errorBorder : null]}
              onPress={() => !disabled && setShowOptions(!showOptions)}
              disabled={disabled}
            >
              <Text style={styles.multiselectText}>
                {Array.isArray(value) && value.length > 0
                  ? `已選擇 ${value.length} 項`
                  : config.placeholder || `選擇${config.label}`
                }
              </Text>
              <Ionicons 
                name={showOptions ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#7A7A7A" 
              />
            </TouchableOpacity>
            
            {showOptions && (
              <View style={styles.optionsContainer}>
                <ScrollView style={styles.optionsScrollView}>
                  {config.options?.map((option) => {
                    const isSelected = Array.isArray(value) && value.includes(option.value);
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.optionItem, isSelected ? styles.selectedOption : null]}
                        onPress={() => {
                          const currentValues = Array.isArray(value) ? value : [];
                          const newValues = isSelected
                            ? currentValues.filter(v => v !== option.value)
                            : [...currentValues, option.value];
                          onChange(newValues);
                        }}
                      >
                        <Text style={[
                          styles.optionText,
                          isSelected ? styles.selectedOptionText : null
                        ]}>
                          {option.label}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={20} color="#1A1A1A" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      case 'date':
        return (
          <TextInput
            label={config.label}
            value={value || ''}
            onChangeText={onChange}
            placeholder={config.placeholder || 'YYYY-MM-DD'}
            keyboardType="numeric"
            error={error}
            editable={!disabled}
          />
        );

      case 'switch':
        return (
          <View style={styles.switchContainer}>
            <Text style={styles.fieldLabel}>{config.label}</Text>
            <Switch
              value={Boolean(value)}
              onValueChange={onChange}
              trackColor={{ false: '#E3E1DC', true: '#1A1A1A' }}
              thumbColor={value ? '#FFFFFF' : '#7A7A7A'}
              disabled={disabled}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      case 'tags':
        return (
          <View>
            <Text style={styles.fieldLabel}>{config.label}</Text>
            <View style={styles.tagsContainer}>
              {/* 顯示現有標籤 */}
              <View style={styles.tagsDisplay}>
                {Array.isArray(value) && value.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tag}
                    onPress={() => {
                      if (!disabled) {
                        const newTags = value.filter((_, i) => i !== index);
                        onChange(newTags);
                      }
                    }}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                    <Ionicons name="close" size={16} color="#7A7A7A" />
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* 新增標籤輸入 */}
              {!disabled && (
                <View style={styles.tagInputContainer}>
                  <TextInput
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="輸入標籤後按確認"
                    style={styles.tagInput}
                    onSubmitEditing={() => {
                      if (tagInput.trim()) {
                        const currentTags = Array.isArray(value) ? value : [];
                        const newTag = tagInput.trim();
                        if (!currentTags.includes(newTag)) {
                          onChange([...currentTags, newTag]);
                        }
                        setTagInput('');
                      }
                    }}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={styles.addTagButton}
                    onPress={() => {
                      if (tagInput.trim()) {
                        const currentTags = Array.isArray(value) ? value : [];
                        const newTag = tagInput.trim();
                        if (!currentTags.includes(newTag)) {
                          onChange([...currentTags, newTag]);
                        }
                        setTagInput('');
                      }
                    }}
                  >
                    <Ionicons name="add" size={20} color="#1A1A1A" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      default:
        return (
          <TextInput
            label={config.label}
            value={value || ''}
            onChangeText={onChange}
            placeholder={config.placeholder}
            error={error}
            editable={!disabled}
          />
        );
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {renderField()}
      {config.required && (
        <View style={styles.requiredIndicator}>
          <Text style={styles.requiredText}>*</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E3E1DC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  multiselectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E3E1DC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  multiselectText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  optionsContainer: {
    borderWidth: 1,
    borderColor: '#E3E1DC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
    maxHeight: 150,
  },
  optionsScrollView: {
    maxHeight: 150,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedOption: {
    backgroundColor: '#F0F0F0',
  },
  optionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagsContainer: {
    marginTop: 4,
  },
  tagsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    marginBottom: 0,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requiredIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  requiredText: {
    color: '#A94438',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorBorder: {
    borderColor: '#A94438',
  },
  errorText: {
    fontSize: 14,
    color: '#A94438',
    marginTop: 4,
  },
});