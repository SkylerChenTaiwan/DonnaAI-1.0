/**
 * 動態表單產生器
 * 根據欄位定義動態生成表單欄位
 */

import React, { useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Controller, useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { 
  FieldConfig, 
  FieldType,
  DynamicFormData,
  FormErrors,
  SelectOption
} from '@/types/fieldDefinitions';
import { Icon } from '@/components/common/Icon';

export interface DynamicFormBuilderProps {
  fields: FieldConfig[];
  data?: DynamicFormData;
  onChange?: (fieldKey: string, value: any) => void;
  onSubmit?: (data: DynamicFormData) => Promise<void>;
  errors?: FormErrors;
  disabled?: boolean;
  mode?: 'create' | 'edit';
}

export interface DynamicFormBuilderRef {
  submit: () => void;
  reset: () => void;
  getValues: () => DynamicFormData;
}

/**
 * 根據欄位配置生成 Zod 驗證 schema
 */
function generateValidationSchema(fields: FieldConfig[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  fields.forEach(field => {
    let fieldSchema: z.ZodTypeAny;
    
    // 根據欄位類型建立基礎驗證
    switch (field.type) {
      case 'email':
        fieldSchema = z.string().email('請輸入有效的電子郵件');
        break;
      case 'number':
        fieldSchema = z.number();
        break;
      case 'boolean':
        fieldSchema = z.boolean();
        break;
      case 'date':
      case 'datetime':
        fieldSchema = z.string(); // 日期以字串形式儲存
        break;
      case 'tags':
        fieldSchema = z.array(z.string());
        break;
      case 'multiselect':
        fieldSchema = z.array(z.string());
        break;
      default:
        fieldSchema = z.string();
    }
    
    // 套用自訂驗證規則
    if (field.validation) {
      field.validation.forEach(rule => {
        switch (rule.type) {
          case 'minLength':
            if (fieldSchema instanceof z.ZodString) {
              fieldSchema = fieldSchema.min(rule.value, rule.message);
            }
            break;
          case 'maxLength':
            if (fieldSchema instanceof z.ZodString) {
              fieldSchema = fieldSchema.max(rule.value, rule.message);
            }
            break;
          case 'min':
            if (fieldSchema instanceof z.ZodNumber) {
              fieldSchema = fieldSchema.min(rule.value, rule.message);
            }
            break;
          case 'max':
            if (fieldSchema instanceof z.ZodNumber) {
              fieldSchema = fieldSchema.max(rule.value, rule.message);
            }
            break;
          case 'pattern':
            if (fieldSchema instanceof z.ZodString) {
              fieldSchema = fieldSchema.regex(new RegExp(rule.value), rule.message);
            }
            break;
        }
      });
    }
    
    // 處理必填欄位
    if (!field.required && field.type !== 'boolean') {
      fieldSchema = fieldSchema.optional();
    }
    
    shape[field.key] = fieldSchema;
  });
  
  return z.object(shape);
}

/**
 * 產生表單預設值
 */
function generateDefaultValues(fields: FieldConfig[], initialData?: DynamicFormData): DynamicFormData {
  const defaultValues: DynamicFormData = {};
  
  fields.forEach(field => {
    if (initialData && field.key in initialData) {
      defaultValues[field.key] = initialData[field.key];
    } else if (field.defaultValue !== undefined) {
      defaultValues[field.key] = field.defaultValue;
    } else {
      // 設定類型預設值
      switch (field.type) {
        case 'boolean':
          defaultValues[field.key] = false;
          break;
        case 'number':
          defaultValues[field.key] = 0;
          break;
        case 'tags':
        case 'multiselect':
          defaultValues[field.key] = [];
          break;
        default:
          defaultValues[field.key] = '';
      }
    }
  });
  
  return defaultValues;
}

export const DynamicFormBuilder = forwardRef<DynamicFormBuilderRef, DynamicFormBuilderProps>(({
  fields,
  data,
  onChange,
  onSubmit,
  errors: externalErrors,
  disabled = false,
  mode = 'create'
}, ref) => {
  console.log('DynamicFormBuilder 收到欄位:', fields.length, '個');
  console.log('DynamicFormBuilder 欄位詳情:', fields.map(f => ({ key: f.key, label: f.label })));
  // 動態生成驗證 schema
  const validationSchema = React.useMemo(() => generateValidationSchema(fields), [fields]);
  
  // 初始化表單
  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
    reset,
    setValue,
    getValues
  } = useForm<DynamicFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: generateDefaultValues(fields, data)
  });
  
  // 合併外部錯誤和表單錯誤
  const errors = { ...formErrors, ...externalErrors };
  
  // 暴露方法給父組件
  useImperativeHandle(ref, () => ({
    submit: () => handleSubmit(handleFormSubmit)(),
    reset: () => reset(generateDefaultValues(fields)),
    getValues: () => getValues()
  }));
  
  // 處理表單提交
  const handleFormSubmit = useCallback(async (formData: DynamicFormData) => {
    if (onSubmit) {
      await onSubmit(formData);
    }
  }, [onSubmit]);
  
  // 處理欄位變更
  const handleFieldChange = useCallback((fieldKey: string, value: any) => {
    setValue(fieldKey, value);
    if (onChange) {
      onChange(fieldKey, value);
    }
  }, [setValue, onChange]);
  
  // 渲染單一欄位
  const renderField = (field: FieldConfig, value: any, onChange: (value: any) => void) => {
    const error = errors[field.key]?.message;
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
      case 'number':
        return (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={String(value || '')}
              onChangeText={(text) => {
                const val = field.type === 'number' ? Number(text) || 0 : text;
                onChange(val);
              }}
              placeholder={field.placeholder}
              keyboardType={
                field.type === 'email' ? 'email-address' :
                field.type === 'phone' ? 'phone-pad' :
                field.type === 'number' ? 'numeric' :
                field.type === 'url' ? 'url' :
                'default'
              }
              editable={!disabled}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );
        
      case 'textarea':
        return (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>
            <TextInput
              style={[styles.textarea, error && styles.inputError]}
              value={String(value || '')}
              onChangeText={onChange}
              placeholder={field.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!disabled}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );
        
      case 'select':
        return (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>
            {Platform.OS === 'web' ? (
              <select
                style={styles.webSelect}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
              >
                <option value="">{field.placeholder || '請選擇'}</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <View style={[styles.pickerContainer, error && styles.inputError]}>
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  enabled={!disabled}
                >
                  <Picker.Item label={field.placeholder || '請選擇'} value="" />
                  {field.options?.map(option => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      enabled={!option.disabled}
                    />
                  ))}
                </Picker>
              </View>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );
        
      case 'boolean':
        return (
          <View style={styles.booleanContainer}>
            <View style={styles.booleanRow}>
              <Text style={styles.label}>
                {field.label}
                {field.required && <Text style={styles.required}> *</Text>}
              </Text>
              <Switch
                value={Boolean(value)}
                onValueChange={onChange}
                disabled={disabled}
                trackColor={{ false: '#E5E5EA', true: '#2EAADC' }}
                thumbColor="#ffffff"
              />
            </View>
            {field.description && (
              <Text style={styles.fieldDescription}>{field.description}</Text>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );
        
      case 'date':
        return (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={value || ''}
              onChangeText={onChange}
              placeholder={field.placeholder || 'YYYY-MM-DD'}
              editable={!disabled}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );
        
      case 'tags':
        return (
          <TagsField
            field={field}
            value={value || []}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.form}>
        {fields.map((field) => (
          <Controller
            key={field.key}
            name={field.key}
            control={control}
            render={({ field: { value, onChange } }) => (
              <>
                {renderField(field, value, (newValue) => {
                  onChange(newValue);
                  handleFieldChange(field.key, newValue);
                })}
              </>
            )}
          />
        ))}
      </View>
    </ScrollView>
  );
});

/**
 * 標籤輸入元件
 */
const TagsField: React.FC<{
  field: FieldConfig;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
}> = ({ field, value, onChange, error, disabled }) => {
  const [inputValue, setInputValue] = React.useState('');
  
  const handleAddTag = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };
  
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {field.label}
        {field.required && <Text style={styles.required}> *</Text>}
      </Text>
      
      <View style={styles.tagsContainer}>
        {value.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            {!disabled && (
              <TouchableOpacity onPress={() => handleRemoveTag(tag)} style={styles.tagRemove}>
                <Icon name="close" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
      
      {!disabled && (
        <View style={styles.tagInputRow}>
          <TextInput
            style={[styles.tagInput, error && styles.inputError]}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="輸入標籤後按新增"
            onSubmitEditing={handleAddTag}
            editable={!disabled}
          />
          <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
            <Text style={styles.addTagButtonText}>新增</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 20,
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
    minHeight: 100,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  webSelect: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  booleanContainer: {
    marginBottom: 16,
  },
  booleanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
  tagRemove: {
    marginLeft: 8,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  addTagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2EAADC',
    borderRadius: 8,
    justifyContent: 'center',
  },
  addTagButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});