/**
 * 基本資訊步驟元件
 * Basic Information Step Component
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '@/theme/designSystem';
import { FormInput } from '../common/FormInput';
import { FormSelect } from '../common/FormSelect';
import { SectionHeader } from '../common/SectionHeader';

// 在 Web 平台導入覆蓋樣式
if (Platform.OS === 'web') {
  require('../styles/override.css');
}
import {
  StepProps,
  BasicInfoData,
} from '@/types/onboarding';

// 時區選項
const TIMEZONES = [
  { label: 'UTC+8 台北時間', value: 'Asia/Taipei' },
  { label: 'UTC+8 香港時間', value: 'Asia/Hong_Kong' },
  { label: 'UTC+8 新加坡時間', value: 'Asia/Singapore' },
  { label: 'UTC+8 上海時間', value: 'Asia/Shanghai' },
  { label: 'UTC+9 東京時間', value: 'Asia/Tokyo' },
  { label: 'UTC+9 首爾時間', value: 'Asia/Seoul' },
  { label: 'UTC+0 倫敦時間', value: 'Europe/London' },
  { label: 'UTC-8 太平洋時間', value: 'America/Los_Angeles' },
  { label: 'UTC-5 東部時間', value: 'America/New_York' },
];

// 語言選項
const LANGUAGES = [
  { label: '繁體中文', value: 'zh-TW' },
  { label: '簡體中文', value: 'zh-CN' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' },
  { label: '한국어', value: 'ko' },
];

// 貨幣選項
const CURRENCIES = [
  { label: 'TWD - 新台幣', value: 'TWD' },
  { label: 'USD - 美元', value: 'USD' },
  { label: 'CNY - 人民幣', value: 'CNY' },
  { label: 'HKD - 港幣', value: 'HKD' },
  { label: 'SGD - 新加坡幣', value: 'SGD' },
  { label: 'JPY - 日圓', value: 'JPY' },
  { label: 'KRW - 韓元', value: 'KRW' },
  { label: 'EUR - 歐元', value: 'EUR' },
  { label: 'GBP - 英鎊', value: 'GBP' },
];

const BasicInfoStep: React.FC<StepProps> = ({
  data,
  onChange,
  onValidate,
  isActive,
}) => {
  // 初始化資料
  const [formData, setFormData] = useState<BasicInfoData>({
    organizationName: '',
    companyInfo: {
      businessType: 'tech',
      industry: '',
      size: 'small',
      website: '',
    },
    contactPerson: {
      name: '',
      email: '',
      phone: '',
      title: '',
    },
    settings: {
      timezone: 'Asia/Taipei',
      language: 'zh-TW',
      currency: 'TWD',
    },
    ...data,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
    
    // 清除錯誤
    if (errors[path]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[path];
        return newErrors;
      });
    }
  };

  // 驗證表單
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.organizationName) {
      newErrors.organizationName = '請輸入組織名稱';
    }
    
    if (!formData.contactPerson.name) {
      newErrors['contactPerson.name'] = '請輸入聯絡人姓名';
    }
    
    if (!formData.contactPerson.email) {
      newErrors['contactPerson.email'] = '請輸入聯絡人信箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactPerson.email)) {
      newErrors['contactPerson.email'] = '請輸入有效的信箱地址';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 組織資訊區塊 */}
      <View style={styles.section}>
        <SectionHeader icon="business" title="組織資訊" />
        
        <FormInput
          label="組織名稱"
          value={formData.organizationName}
          onChangeText={(text) => updateField('organizationName', text)}
          placeholder="請輸入組織名稱"
          required
          error={errors.organizationName}
        />
        
        <FormSelect
          label="產業類別"
          value={formData.companyInfo.businessType}
          options={[
            { label: '科技業', value: 'tech' },
            { label: '製造業', value: 'manufacturing' },
            { label: '服務業', value: 'service' },
            { label: '零售業', value: 'retail' },
            { label: '金融業', value: 'finance' },
            { label: '醫療業', value: 'healthcare' },
            { label: '教育業', value: 'education' },
            { label: '其他', value: 'other' },
          ]}
          onChange={(value) => updateField('companyInfo.businessType', value)}
        />
        
        <FormSelect
          label="公司規模"
          value={formData.companyInfo.size}
          options={[
            { label: '1-10人', value: 'small' },
            { label: '11-50人', value: 'medium' },
            { label: '51-200人', value: 'large' },
            { label: '201-500人', value: 'xlarge' },
            { label: '500人以上', value: 'enterprise' },
          ]}
          onChange={(value) => updateField('companyInfo.size', value)}
        />
        
        <FormInput
          label="公司網站"
          value={formData.companyInfo.website || ''}
          onChangeText={(text) => updateField('companyInfo.website', text)}
          placeholder="https://example.com"
          keyboardType="url"
        />
      </View>

      {/* 聯絡人資訊區塊 */}
      <View style={styles.section}>
        <SectionHeader icon="person" title="主要聯絡人" />
        
        <FormInput
          label="姓名"
          value={formData.contactPerson.name}
          onChangeText={(text) => updateField('contactPerson.name', text)}
          placeholder="請輸入聯絡人姓名"
          required
          error={errors['contactPerson.name']}
        />
        
        <FormInput
          label="Email"
          value={formData.contactPerson.email}
          onChangeText={(text) => updateField('contactPerson.email', text)}
          placeholder="contact@example.com"
          required
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors['contactPerson.email']}
        />
        
        <FormInput
          label="電話"
          value={formData.contactPerson.phone || ''}
          onChangeText={(text) => updateField('contactPerson.phone', text)}
          placeholder="+886 912345678"
          keyboardType="phone-pad"
        />
        
        <FormInput
          label="職稱"
          value={formData.contactPerson.title || ''}
          onChangeText={(text) => updateField('contactPerson.title', text)}
          placeholder="例如：資訊部經理"
        />
      </View>

      {/* 系統設定區塊 */}
      <View style={styles.section}>
        <SectionHeader icon="settings" title="系統設定" />
        
        <FormSelect
          label="時區"
          value={formData.settings.timezone}
          options={TIMEZONES}
          onChange={(value) => updateField('settings.timezone', value)}
          required
        />
        
        <FormSelect
          label="預設語言"
          value={formData.settings.language}
          options={LANGUAGES}
          onChange={(value) => updateField('settings.language', value)}
          required
        />
        
        <FormSelect
          label="貨幣"
          value={formData.settings.currency}
          options={CURRENCIES}
          onChange={(value) => updateField('settings.currency', value)}
          required
        />
      </View>

      {/* 提示訊息 */}
      <View style={styles.infoBox}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={DesignSystem.colors.status.info}
        />
        <Text style={styles.infoText}>
          這些資訊將用於建立組織和發送通知。請確保聯絡資訊正確。
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.status.info + '10',
    borderRadius: DesignSystem.borderRadius.md,
    padding: 12,
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: DesignSystem.colors.status.info,
    lineHeight: 18,
  },
});

export default BasicInfoStep;