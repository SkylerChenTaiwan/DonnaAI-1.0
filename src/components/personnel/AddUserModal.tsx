/**
 * 新增使用者 Modal
 * 用於人事管理頁面新增下屬功能
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert } from 'react-native';
import { Button } from '@/components/adaptive';
import { Layout } from '@/components/common/Layout';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FormField } from '@/components/forms/FormField';
import { isManagerOfTeam, isOrgAdmin } from '@/services/firebase/permissions';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/services/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { showToast } from '@/utils/toast';
import { Icon } from '@/components/common/Icon';
import { colors } from '@/theme/colors';
import { User } from '@/types/entities';

type RouteParams = {
  AddUserModal: {
    teamId?: string;
    onUserCreated?: () => void;
  };
};

interface UserFormData {
  email: string;
  password: string;
  name: string;
  role: 'salesperson' | 'manager';
}

export const AddUserModal: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'AddUserModal'>>();
  
  const { teamId, onUserCreated } = route.params || {};
  const { user: currentUser } = useAuth();
  const { currentOrganization, currentTeam } = useOrganization();
  
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'salesperson' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // 檢查權限
  useEffect(() => {
    const checkPermission = async () => {
      if (!currentUser) {
        setHasPermission(false);
        return;
      }

      try {
        // 檢查是否為組織管理員
        const isAdmin = await isOrgAdmin(currentUser.uid);
        if (isAdmin) {
          setHasPermission(true);
          return;
        }

        // 檢查是否為團隊主管
        const targetTeamId = teamId || currentTeam?.id;
        if (targetTeamId) {
          const isManager = await isManagerOfTeam(currentUser.uid, targetTeamId);
          setHasPermission(isManager);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [currentUser, teamId, currentTeam]);

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
    if (!currentUser || !currentOrganization || !currentTeam) {
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
      const targetTeamId = teamId || currentTeam.id;
      const userData: Omit<User, 'id'> = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        organizationId: currentOrganization.id,
        teamIds: [targetTeamId],
        managedTeamIds: formData.role === 'manager' ? [targetTeamId] : undefined,
        createdAt: new Date(),
        lastLoginAt: new Date() };

      // 儲存到 Firestore
      const userRef = doc(getFirebaseDb(), 'users', newUser.uid);
      await setDoc(userRef, {
        ...userData,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now() });

      showToast('success', '使用者建立成功');
      onUserCreated?.();
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // 處理特定錯誤
      if (error.code === 'auth/email-already-in-use') {
        showToast('error', '此電子郵件已被使用');
      } else if (error.code === 'auth/weak-password') {
        showToast('error', '密碼強度不足');
      } else {
        showToast('error', '建立使用者失敗');
      }
    } finally {
      setLoading(false);
    }
  }, [formData, currentUser, currentOrganization, currentTeam, teamId, navigation, onUserCreated]);

  // 如果沒有權限，顯示錯誤訊息
  if (hasPermission === false) {
    return (
      <Layout>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>新增下屬</Text>
        </View>
        
        <View style={styles.noPermissionContainer}>
          <Icon name="lock-closed" size={48} color={colors.textSecondary} />
          <Text style={styles.noPermissionText}>您沒有權限新增下屬</Text>
          <Text style={styles.noPermissionSubtext}>
            只有團隊主管或組織管理員可以新增團隊成員
          </Text>
        </View>
      </Layout>
    );
  }

  // 權限載入中
  if (hasPermission === null) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <Text>載入中...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>新增下屬</Text>
        </View>
        <AdaptiveButton
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
          <FormField
            label="電子郵件"
            type="text"
            value={formData.email}
            onChange={(value) => handleFieldChange('email', value)}
            error={errors.email}
            placeholder="請輸入電子郵件地址"
            required
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

          <View style={styles.fieldContainer}>
            <FormField
              label="角色"
              type="select"
              value={formData.role}
              onChange={(value) => handleFieldChange('role', value)}
              options={[
                { label: '業務人員', value: 'salesperson' },
                { label: '主管', value: 'manager' },
              ]}
            />
          </View>

          <View style={styles.infoBox}>
            <Icon name="information-circle" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              新使用者將會收到一封包含登入資訊的電子郵件
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center' },
  closeButton: {
    padding: 8,
    marginRight: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text },
  container: {
    flex: 1,
    backgroundColor: colors.background },
  content: {
    flex: 1 },
  contentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16 },
  fieldContainer: {
    marginTop: 20 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    marginTop: 24 },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center' },
  noPermissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32 },
  noPermissionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8 },
  noPermissionSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20 } });