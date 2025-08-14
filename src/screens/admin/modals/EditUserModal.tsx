/**
 * 編輯用戶 Modal（Admin）
 * 用於管理員編輯現有用戶資料
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  AdaptiveSwitch,
  AdaptiveButton
} from '@/components/adaptive';
import { View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator } from 'react-native';
import { Layout } from '@/components/common/Layout';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FormField } from '@/components/forms/FormField';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { useAuthStore } from '@/stores/authStore';
import { useAdminStore } from '@/stores/adminStore';
import { showToast } from '@/utils/toast';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';
import { User } from '@/types/entities';

type RouteParams = {
  EditUserModal: {
    userId: string;
    userData: User;
    onUserUpdated?: () => void;
  };
};

interface UserFormData {
  name: string;
  role: 'salesperson' | 'manager' | 'admin';
  department?: string;
  phone?: string;
  isActive: boolean;
}

export const EditUserModal: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'EditUserModal'>>();
  const { userId, userData, onUserUpdated } = route.params || {};
  
  const { user: currentUser } = useAuthStore();
  const { refreshUsers } = useAdminStore();
  
  const [formData, setFormData] = useState<UserFormData>({
    name: userData?.name || '',
    role: userData?.role || 'salesperson',
    department: userData?.department || '',
    phone: userData?.phone || '',
    isActive: userData?.isActive !== false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // 確保有正確的參數
  useEffect(() => {
    if (!userId || !userData) {
      showToast('error', '缺少必要參數');
      navigation.goBack();
    }
  }, [userId, userData, navigation]);

  // 處理欄位變更
  const handleFieldChange = useCallback((field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '請輸入姓名';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單提交
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    if (!userId) {
      showToast('error', '缺少用戶 ID');
      return;
    }

    setLoading(true);
    try {
      // 更新 Firestore 中的用戶資料
      const userRef = doc(getFirebaseDb(), 'users', userId);
      await updateDoc(userRef, {
        name: formData.name,
        role: formData.role,
        department: formData.department || null,
        phone: formData.phone || null,
        isActive: formData.isActive,
        updatedAt: new Date() });

      showToast('success', '用戶資料已更新');
      
      // 刷新用戶列表
      await refreshUsers();
      
      onUserUpdated?.();
      navigation.goBack();
    } catch (error: any) {
      console.error('Error updating user:', error);
      showToast('error', '更新用戶資料失敗');
    } finally {
      setLoading(false);
    }
  }, [formData, userId, navigation, onUserUpdated, refreshUsers]);

  if (!userData) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={DesignSystem.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>編輯用戶</Text>
        <AdaptiveButton
          title="儲存"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          size="small"
          variant="primary"
        />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 用戶資訊 */}
          <View style={styles.userInfo}>
            <Icon name="person-circle" size={64} color={DesignSystem.colors.text.secondary} />
            <Text style={styles.userEmail}>{userData.email}</Text>
            <Text style={styles.userId}>ID: {userId}</Text>
          </View>

          {/* 基本資料 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本資料</Text>
            
            <FormField
              label="姓名"
              type="text"
              value={formData.name}
              onChange={(value) => handleFieldChange('name', value)}
              error={errors.name}
              placeholder="請輸入使用者姓名"
              required
            />
          </View>

          {/* 角色與部門 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>角色與部門</Text>
            
            <FormField
              label="角色"
              type="select"
              value={formData.role}
              onChange={(value) => handleFieldChange('role', value)}
              options={[
                { label: '業務人員', value: 'salesperson' },
                { label: '主管', value: 'manager' },
                { label: '管理員', value: 'admin' },
              ]}
            />

            <View style={styles.fieldContainer}>
              <FormField
                label="部門"
                type="text"
                value={formData.department || ''}
                onChange={(value) => handleFieldChange('department', value)}
                placeholder="請輸入部門名稱"
              />
            </View>
          </View>

          {/* 聯絡資訊 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>聯絡資訊</Text>
            
            <FormField
              label="電話"
              type="text"
              value={formData.phone || ''}
              onChange={(value) => handleFieldChange('phone', value)}
              placeholder="請輸入聯絡電話"
              keyboardType="phone-pad"
            />
          </View>

          {/* 帳號狀態 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>帳號狀態</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>啟用帳號</Text>
              <AdaptiveSwitch
                value={formData.isActive}
                onValueChange={(value) => handleFieldChange('isActive', value)}
                trackColor={{ 
                  false: DesignSystem.colors.gray300, 
                  true: DesignSystem.colors.primary 
                }}
                thumbColor={DesignSystem.colors.text.inverse}
              />
            </View>
            <Text style={styles.switchHint}>
              停用的帳號將無法登入系統
            </Text>
          </View>

          {/* 其他資訊 */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>建立時間</Text>
              <Text style={styles.infoValue}>
                {userData.createdAt ? new Date(userData.createdAt).toLocaleString('zh-TW') : '-'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>最後登入</Text>
              <Text style={styles.infoValue}>
                {userData.lastLoginAt ? new Date(userData.lastLoginAt).toLocaleString('zh-TW') : '從未登入'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  backButton: {
    marginRight: DesignSystem.spacing.md },
  title: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.text.primary,
    flex: 1 },
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background },
  content: {
    flex: 1 },
  contentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center' },
  userInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
    marginBottom: 24 },
  userEmail: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginTop: 12 },
  userId: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: 4 },
  section: {
    marginBottom: 32 },
  sectionTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: 16 },
  fieldContainer: {
    marginTop: 20 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12 },
  switchLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary },
  switchHint: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: 8 },
  infoSection: {
    backgroundColor: DesignSystem.colors.background.elevated,
    padding: 16,
    borderRadius: 8,
    marginTop: 16 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8 },
  infoLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary },
  infoValue: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary } });