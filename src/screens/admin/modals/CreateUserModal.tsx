/**
 * 建立用戶 Modal（Admin）
 * 用於管理員建立新用戶
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Button } from '@/components/common/Button';
import { Layout } from '@/components/common/Layout';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FormField } from '@/components/forms/FormField';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/services/firebase/config';
import { useAuthStore } from '@/stores/authStore';
import { useAdminStore } from '@/stores/adminStore';
import { showToast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '@/theme/designSystem';
import { User } from '@/types/user';

type RouteParams = {
  CreateUserModal: {
    onUserCreated?: () => void;
  };
};

interface UserFormData {
  email: string;
  password: string;
  name: string;
  role: 'salesperson' | 'manager' | 'admin';
  department?: string;
  phone?: string;
}

export const CreateUserModal: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'CreateUserModal'>>();
  const { onUserCreated } = route.params || {};
  
  const { user: currentUser } = useAuthStore();
  const { refreshUsers } = useAdminStore();
  
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'salesperson',
    department: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // 處理欄位變更
  const handleFieldChange = useCallback((field: keyof UserFormData, value: string) => {
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

    if (!formData.email.trim()) {
      newErrors.email = '請輸入電子郵件';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件地址';
    }

    if (!formData.password.trim()) {
      newErrors.password = '請輸入密碼';
    } else if (formData.password.length < 6) {
      newErrors.password = '密碼至少需要 6 個字元';
    }

    if (!formData.name.trim()) {
      newErrors.name = '請輸入姓名';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單提交
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    if (!currentUser?.organizationId) {
      showToast('error', '系統錯誤，請重新登入');
      return;
    }

    setLoading(true);
    try {
      // 建立 Firebase Auth 使用者
      const userCredential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        formData.email,
        formData.password
      );
      const newUser = userCredential.user;

      // 更新使用者顯示名稱
      await updateProfile(newUser, { displayName: formData.name });

      // 建立使用者資料
      const userData: Omit<User, 'id'> = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        organizationId: currentUser.organizationId,
        department: formData.department || undefined,
        phone: formData.phone || undefined,
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      // 儲存到 Firestore
      const userRef = doc(getFirebaseDb(), 'users', newUser.uid);
      await setDoc(userRef, {
        ...userData,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
      });

      showToast('success', '用戶建立成功');
      
      // 刷新用戶列表
      await refreshUsers();
      
      onUserCreated?.();
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // 處理特定錯誤
      if (error.code === 'auth/email-already-in-use') {
        showToast('error', '此電子郵件已被使用');
      } else if (error.code === 'auth/weak-password') {
        showToast('error', '密碼強度不足');
      } else if (error.code === 'auth/invalid-email') {
        showToast('error', '電子郵件格式錯誤');
      } else {
        showToast('error', '建立用戶失敗');
      }
    } finally {
      setLoading(false);
    }
  }, [formData, currentUser, navigation, onUserCreated, refreshUsers]);

  return (
    <Layout>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>建立新用戶</Text>
        <Button
          title="建立"
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
          {/* 基本資料 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本資料</Text>
            
            <FormField
              label="電子郵件"
              type="text"
              value={formData.email}
              onChange={(value) => handleFieldChange('email', value)}
              error={errors.email}
              placeholder="請輸入電子郵件地址"
              required
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.fieldContainer}>
              <FormField
                label="密碼"
                type="text"
                value={formData.password}
                onChange={(value) => handleFieldChange('password', value)}
                error={errors.password}
                placeholder="至少 6 個字元"
                required
                secureTextEntry
              />
            </View>

            <View style={styles.fieldContainer}>
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

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={DesignSystem.colors.info} />
            <Text style={styles.infoText}>
              新用戶將會收到一封包含登入資訊的電子郵件
            </Text>
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
    borderBottomColor: DesignSystem.colors.border.light,
  },
  backButton: {
    marginRight: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.text.primary,
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: 16,
  },
  fieldContainer: {
    marginTop: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.info + '20',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
    lineHeight: 20,
  },
});