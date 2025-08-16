/**
 * 登入畫面
 */

import React, { useState } from 'react';
import {
  AdaptiveButton,
  AdaptiveInput,
  AdaptiveView,
  AdaptiveText,
  AdaptiveImage
} from '@/components/adaptive';
import {
  StyleSheet,
  Alert } from 'react-native';
import { Layout } from '@/components/common/Layout';
import { signIn } from '@/services/firebase/auth';
import { DesignSystem } from '@/theme/designSystem';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = '請輸入電子郵件';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '電子郵件格式無效';
    }

    if (!password.trim()) {
      newErrors.password = '請輸入密碼';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await signIn({ email: email.trim(), password });
      // 成功登入後，認證狀態會自動更新，導航會由父元件處理
    } catch (error) {
      const message = error instanceof Error ? error.message : '登入失敗';
      setErrors({ general: message });
      Alert.alert('登入失敗', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <AdaptiveView style={styles.container}>
        <AdaptiveView style={styles.header}>
          <AdaptiveImage 
            source={require('../../../assets/donna-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <AdaptiveText style={styles.title}>歡迎回到 DonnaAI</AdaptiveText>
          <AdaptiveText style={styles.subtitle}>您的 AI 業務助理</AdaptiveText>
        </AdaptiveView>

        <AdaptiveView style={styles.form}>
          <AdaptiveInput
            label="電子郵件"
            value={email}
            onChangeText={setEmail}
            placeholder="請輸入您的電子郵件"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            containerStyle={{ marginBottom: 16 }}
          />

          <AdaptiveInput
            label="密碼"
            value={password}
            onChangeText={setPassword}
            placeholder="請輸入您的密碼"
            secureTextEntry
            autoComplete="password"
            error={errors.password}
            containerStyle={{ marginBottom: 16 }}
          />

          {errors.general && (
            <AdaptiveText style={styles.errorText}>{errors.general}</AdaptiveText>
          )}

          <AdaptiveButton
            title="登入"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <AdaptiveView style={styles.footer}>
            <AdaptiveText style={styles.footerText}>
              還沒有帳號？{' '}
            </AdaptiveText>
            <AdaptiveButton
              title="立即註冊"
              onPress={onNavigateToRegister}
              variant="outline"
              size="small"
            />
          </AdaptiveView>
        </AdaptiveView>
      </AdaptiveView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center' },
  header: {
    alignItems: 'center',
    marginBottom: 48 },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 24 },
  title: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.text.primary,
    marginBottom: 8 },
  subtitle: {
    fontSize: 18,
    color: DesignSystem.colors.text.secondary },
  form: {
    width: '100%',
    marginTop: 16 },
  loginButton: {
    marginTop: 8,
    marginBottom: 24 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center' },
  footerText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary },
  errorText: {
    ...DesignSystem.typography.bodySmall,
    color: DesignSystem.colors.gray500,
    textAlign: 'center',
    marginBottom: 16 } });