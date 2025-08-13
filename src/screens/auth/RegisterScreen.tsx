/**
 * 註冊畫面
 */

import React, { useState } from 'react';
import {
  TextInput,
  Button
} from '@/components/adaptive';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  Platform } from 'react-native';
import { Layout } from '@/components/common/Layout';
import { signUp } from '@/services/firebase/auth';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    organizationName: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
    organizationName?: string;
    general?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.email.trim()) {
      newErrors.email = '請輸入電子郵件';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '電子郵件格式無效';
    }

    if (!formData.password.trim()) {
      newErrors.password = '請輸入密碼';
    } else if (formData.password.length < 6) {
      newErrors.password = '密碼至少需要 6 個字元';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = '請確認密碼';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '密碼不一致';
    }

    if (!formData.name.trim()) {
      newErrors.name = '請輸入姓名';
    }

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = '請輸入公司名稱';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await signUp({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        organizationName: formData.organizationName.trim(),
        role: 'salesperson', // 預設為業務員角色
      });
      // 成功註冊後，認證狀態會自動更新，導航會由父元件處理
      Alert.alert('註冊成功', '歡迎加入 DonnaAI！');
    } catch (error) {
      const message = error instanceof Error ? error.message : '註冊失敗';
      setErrors({ general: message });
      Alert.alert('註冊失敗', message);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout 
      keyboardAvoidingEnabled={true}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Image 
            source={require('../../../assets/donna-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>加入 DonnaAI</Text>
          <Text style={styles.subtitle}>開始您的 AI 助理之旅</Text>
        </View>

        <View style={styles.form}>
          <AdaptiveInput
            label="姓名"
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            placeholder="請輸入您的姓名"
            autoComplete="name"
            error={errors.name}
          />

          <AdaptiveInput
            label="電子郵件"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            placeholder="請輸入您的電子郵件"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <AdaptiveInput
            label="公司名稱"
            value={formData.organizationName}
            onChangeText={(value) => updateFormData('organizationName', value)}
            placeholder="請輸入您的公司名稱"
            error={errors.organizationName}
          />

          <AdaptiveInput
            label="密碼"
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            placeholder="請輸入密碼（至少 6 個字元）"
            secureTextEntry
            autoComplete="password-new"
            error={errors.password}
          />

          <AdaptiveInput
            label="確認密碼"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            placeholder="請再次輸入密碼"
            secureTextEntry
            autoComplete="password-new"
            error={errors.confirmPassword}
          />

          {errors.general && (
            <Text style={styles.errorText}>{errors.general}</Text>
          )}

          <AdaptiveButton
            title="註冊"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              已有帳號？{' '}
            </Text>
            <AdaptiveButton
              title="立即登入"
              onPress={onNavigateToLogin}
              variant="outline"
              size="small"
            />
          </View>
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center' },
  header: {
    alignItems: 'center',
    marginBottom: 32 },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 24 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8 },
  subtitle: {
    fontSize: 18,
    color: '#8E8E93' },
  form: {
    width: '100%' },
  registerButton: {
    marginTop: 8,
    marginBottom: 24 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center' },
  footerText: {
    fontSize: 16,
    color: '#8E8E93' },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16 } });