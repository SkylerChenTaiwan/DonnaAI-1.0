/**
 * 步驟 1: 組織基本資訊
 * Step 1: Organization Basic Information
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { DesignSystem } from '@/theme/designSystem';
import {
  StepProps,
  BasicInfoData,
  COMPANY_SIZES,
  INDUSTRIES,
  TIMEZONES,
  LANGUAGES,
  CURRENCIES,
} from '@/types/onboarding';

const BasicInfoStep: React.FC<StepProps> = ({
  data,
  onChange,
  onValidate,
  isActive,
}) => {
  const colors = DesignSystem.colors;
  
  // 初始化資料
  const [formData, setFormData] = useState<BasicInfoData>({
    organizationName: '',
    contactPerson: {
      name: '',
      email: '',
      phone: '',
      title: '',
    },
    companyInfo: {
      size: 'small',
      industry: 'technology',
      website: '',
    },
    settings: {
      timezone: 'Asia/Taipei',
      language: 'zh-TW',
      currency: 'TWD',
    },
    ...data,
  });

  // 當資料變更時通知父元件
  useEffect(() => {
    if (isActive) {
      onChange(formData);
    }
  }, [formData, isActive]);

  // 更新表單資料
  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  // 渲染輸入欄位
  const renderInput = (
    label: string,
    value: string,
    path: string,
    placeholder?: string,
    required?: boolean,
    keyboardType?: any
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) => updateField(path, text)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  // 渲染選擇器
  const renderPicker = (
    label: string,
    value: string,
    path: string,
    options: Array<{ value: string; label: string }>,
    required?: boolean
  ) => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
          <View style={styles.pickerContainer}>
            <select
              style={styles.webSelect}
              value={value}
              onChange={(e) => updateField(path, e.target.value)}
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <MaterialIcons 
              name="arrow-drop-down" 
              size={24} 
              color={colors.gray600}
              style={styles.pickerIcon}
            />
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={value}
            onValueChange={(itemValue) => updateField(path, itemValue)}
            style={styles.picker}
          >
            {options.map(option => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 組織資訊區塊 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="business" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>組織資訊</Text>
        </View>
        
        {renderInput(
          '組織名稱',
          formData.organizationName,
          'organizationName',
          '請輸入組織名稱',
          true
        )}
        
        {renderPicker(
          '公司規模',
          formData.companyInfo.size,
          'companyInfo.size',
          COMPANY_SIZES,
          true
        )}
        
        {renderPicker(
          '產業類別',
          formData.companyInfo.industry,
          'companyInfo.industry',
          INDUSTRIES,
          true
        )}
        
        {renderInput(
          '公司網站',
          formData.companyInfo.website || '',
          'companyInfo.website',
          'https://example.com'
        )}
      </View>

      {/* 聯絡人資訊區塊 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="person" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>主要聯絡人</Text>
        </View>
        
        {renderInput(
          '姓名',
          formData.contactPerson.name,
          'contactPerson.name',
          '請輸入聯絡人姓名',
          true
        )}
        
        {renderInput(
          'Email',
          formData.contactPerson.email,
          'contactPerson.email',
          'contact@example.com',
          true,
          'email-address'
        )}
        
        {renderInput(
          '電話',
          formData.contactPerson.phone || '',
          'contactPerson.phone',
          '+886 912345678',
          false,
          'phone-pad'
        )}
        
        {renderInput(
          '職稱',
          formData.contactPerson.title || '',
          'contactPerson.title',
          '例如：資訊部經理'
        )}
      </View>

      {/* 系統設定區塊 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="settings" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>系統設定</Text>
        </View>
        
        {renderPicker(
          '時區',
          formData.settings.timezone,
          'settings.timezone',
          TIMEZONES,
          true
        )}
        
        {renderPicker(
          '預設語言',
          formData.settings.language,
          'settings.language',
          LANGUAGES,
          true
        )}
        
        {renderPicker(
          '貨幣',
          formData.settings.currency,
          'settings.currency',
          CURRENCIES,
          true
        )}
      </View>

      {/* 提示訊息 */}
      <View style={styles.infoBox}>
        <MaterialIcons name="info-outline" size={16} color={colors.info} />
        <Text style={styles.infoText}>
          這些資訊將用於建立組織和發送通知。請確保聯絡資訊正確。
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: DesignSystem.colors.gray700,
    marginBottom: 8,
    fontWeight: '500',
  },
  required: {
    color: DesignSystem.colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: DesignSystem.colors.text,
    backgroundColor: DesignSystem.colors.white,
  },
  pickerContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray300,
    borderRadius: 8,
    backgroundColor: DesignSystem.colors.white,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    color: DesignSystem.colors.text,
  },
  webSelect: {
    width: '100%',
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: DesignSystem.colors.text,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    paddingRight: 32,
  } as any,
  pickerIcon: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -12 }],
    pointerEvents: 'none',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.info + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: DesignSystem.colors.info,
    lineHeight: 18,
  },
});

export default BasicInfoStep;