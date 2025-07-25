/**
 * 新增組織頁面（Super Admin）
 * 建立新組織和設定管理員
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Layout } from '@/components/common/Layout';
import { TextInput } from '@/components/common/TextInput';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { createOrganization } from '@/services/firebase/admin/organizationService';
import { createUserWithCustomClaims } from '@/services/firebase/auth';
import { DesignSystem } from '@/theme/designSystem';
import { showToast } from '@/utils/toast';

export const CreateOrganizationScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  
  // 組織資料
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'basic' | 'professional' | 'enterprise'>('trial');
  const [seats, setSeats] = useState('5');
  
  // 管理員資料
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const plans = [
    { id: 'trial', name: '試用版', seats: 5, duration: '30天', aiMinutes: 60 },
    { id: 'basic', name: '基礎版', seats: 10, duration: '月付', aiMinutes: 300 },
    { id: 'professional', name: '專業版', seats: 50, duration: '月付', aiMinutes: 1200 },
    { id: 'enterprise', name: '企業版', seats: '無限制', duration: '年付', aiMinutes: '無限制' },
  ];

  const validateForm = () => {
    if (!orgName.trim()) {
      showToast.error('請輸入組織名稱');
      return false;
    }
    if (!orgEmail.trim() || !orgEmail.includes('@')) {
      showToast.error('請輸入有效的組織電子郵件');
      return false;
    }
    if (!adminName.trim()) {
      showToast.error('請輸入管理員姓名');
      return false;
    }
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      showToast.error('請輸入有效的管理員電子郵件');
      return false;
    }
    if (adminPassword.length < 6) {
      showToast.error('密碼至少需要 6 個字元');
      return false;
    }
    if (!seats || parseInt(seats) < 1) {
      showToast.error('座位數必須大於 0');
      return false;
    }
    return true;
  };

  const handleCreateOrganization = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // 1. 建立組織
      const organization = await createOrganization({
        name: orgName,
        email: orgEmail,
        plan: selectedPlan,
        adminEmail: adminEmail,
        adminName: adminName,
        seats: parseInt(seats),
      });

      // 2. 建立管理員帳號
      await createUserWithCustomClaims(adminEmail, adminPassword, {
        role: 'admin',
        organizationId: organization.id,
        organizationName: orgName,
        displayName: adminName,
      });

      showToast.success('組織建立成功！');
      
      // 導航回組織列表
      navigation.goBack();
    } catch (error: any) {
      console.error('建立組織失敗:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        showToast.error('此電子郵件已被使用');
      } else if (error.code === 'auth/weak-password') {
        showToast.error('密碼強度不足');
      } else {
        showToast.error('建立組織失敗：' + (error.message || '未知錯誤'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="正在建立組織..." />
      </Layout>
    );
  }

  return (
    <Layout scrollable={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 組織資訊 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>組織資訊</Text>
            
            <TextInput
              label="組織名稱"
              value={orgName}
              onChangeText={setOrgName}
              placeholder="例：XX 企業"
            />

            <TextInput
              label="組織電子郵件"
              value={orgEmail}
              onChangeText={setOrgEmail}
              placeholder="contact@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* 訂閱方案選擇 */}
            <View style={styles.planSection}>
              <Text style={styles.inputLabel}>
                訂閱方案 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.planGrid}>
                {plans.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      selectedPlan === plan.id && styles.planCardActive
                    ]}
                    onPress={() => setSelectedPlan(plan.id as any)}
                  >
                    <Text style={[
                      styles.planName,
                      selectedPlan === plan.id && styles.planNameActive
                    ]}>
                      {plan.name}
                    </Text>
                    <Text style={styles.planDetail}>
                      座位數：{plan.seats}
                    </Text>
                    <Text style={styles.planDetail}>
                      期限：{plan.duration}
                    </Text>
                    <Text style={styles.planDetail}>
                      AI：{typeof plan.aiMinutes === 'number' ? `${plan.aiMinutes}分鐘` : plan.aiMinutes}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              label="座位數"
              value={seats}
              onChangeText={setSeats}
              placeholder="5"
              keyboardType="number-pad"
            />
          </View>

          {/* 管理員資訊 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>管理員資訊</Text>
            
            <TextInput
              label="管理員姓名"
              value={adminName}
              onChangeText={setAdminName}
              placeholder="王小明"
            />

            <TextInput
              label="管理員電子郵件"
              value={adminEmail}
              onChangeText={setAdminEmail}
              placeholder="admin@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label="管理員密碼"
              value={adminPassword}
              onChangeText={setAdminPassword}
              placeholder="至少 6 個字元"
              secureTextEntry
            />
          </View>

          {/* 操作按鈕 */}
          <View style={styles.actions}>
            <Button
              title="建立組織"
              onPress={handleCreateOrganization}
              disabled={isLoading}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignSystem.spacing.lg,
  },
  section: {
    marginBottom: DesignSystem.spacing.xl,
  },
  sectionTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  planSection: {
    marginBottom: DesignSystem.spacing.md,
  },
  inputLabel: {
    ...DesignSystem.typography.bodySmall,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.sm,
  },
  required: {
    color: DesignSystem.colors.error,
  },
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.sm,
  },
  planCard: {
    flex: 1,
    minWidth: '45%',
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light,
  },
  planCardActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.primary + '10',
  },
  planName: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  planNameActive: {
    color: DesignSystem.colors.primary,
  },
  planDetail: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xs,
  },
  actions: {
    gap: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.xl,
  },
  cancelButton: {
    paddingVertical: DesignSystem.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
});