/**
 * 編輯個人資料 Modal
 */

import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';
import { WebModal } from '@/components/web/WebModal';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '@/stores/authStore';
import { RootStackParamList } from '@/types/navigation';
import { updateUserName, updateUserEmail } from '@/services/firebase/auth';
import { DesignSystem } from '@/theme/designSystem';

type EditProfileNavigationProp = StackNavigationProp<RootStackParamList, 'EditProfileModal'>;

export const EditProfileModal: React.FC = () => {
  const navigation = useNavigation<EditProfileNavigationProp>();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
  });
  
  const [isEmailChanged, setIsEmailChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    currentPassword?: string;
  }>({});


  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
      });
    }
  }, [user]);

  useEffect(() => {
    // 檢查 email 是否有變更
    setIsEmailChanged(formData.email !== user?.email);
  }, [formData.email, user?.email]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    // 驗證姓名
    if (!formData.name.trim()) {
      newErrors.name = '請輸入姓名';
    }
    
    // 驗證電子郵件
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件地址';
    }
    
    // 如果 email 有變更，需要密碼
    if (isEmailChanged && !formData.currentPassword) {
      newErrors.currentPassword = '更改電子郵件需要輸入目前密碼';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuthError = (error: any) => {
    switch (error.code) {
      case 'auth/requires-recent-login':
        Alert.alert('需要重新登入', '為了安全考量，請重新登入後再嘗試更新電子郵件');
        break;
      case 'auth/email-already-in-use':
        Alert.alert('錯誤', '此電子郵件已被使用');
        break;
      case 'auth/invalid-email':
        Alert.alert('錯誤', '電子郵件格式無效');
        break;
      case 'auth/wrong-password':
        Alert.alert('錯誤', '密碼錯誤');
        break;
      default:
        Alert.alert('錯誤', error.message || '更新失敗，請稍後再試');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      let hasUpdates = false;
      
      // 更新名稱
      if (formData.name !== user.name) {
        await updateUserName(formData.name.trim());
        hasUpdates = true;
      }
      
      // 更新電子郵件
      if (isEmailChanged) {
        await updateUserEmail(formData.email.trim(), formData.currentPassword);
        hasUpdates = true;
      }
      
      if (hasUpdates) {
        // 更新本地狀態
        const authStore = useAuthStore.getState();
        await authStore.refreshUser();
        
        Alert.alert('成功', '個人資料已更新', [
          { text: '確定', onPress: () => navigation.goBack() }
        ]);
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('更新個人資料失敗:', error);
      handleAuthError(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <WebModal>
        <Layout style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        </Layout>
      </WebModal>
    );
  }

  // 設定導航標題列
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleSave} 
          style={{ marginRight: 16 }}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={DesignSystem.colors.primary} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '600', color: DesignSystem.colors.primary }}>儲存</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, isSaving, handleSave]);

  return (
    <WebModal>
      <Layout style={styles.container} scrollable={false}>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* 姓名 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>姓名 *</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              value={formData.name}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, name: text }));
                setErrors(prev => ({ ...prev, name: undefined }));
              }}
              placeholder="請輸入您的姓名"
              placeholderTextColor={DesignSystem.colors.text.tertiary}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* 電子郵件 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>電子郵件 *</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              value={formData.email}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, email: text }));
                setErrors(prev => ({ ...prev, email: undefined }));
              }}
              placeholder="example@email.com"
              placeholderTextColor={DesignSystem.colors.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            {isEmailChanged && !errors.email && (
              <Text style={styles.helperText}>
                變更電子郵件需要輸入密碼驗證
              </Text>
            )}
          </View>

          {/* 目前密碼（只在更改 email 時顯示） */}
          {isEmailChanged && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>目前密碼 *</Text>
              <TextInput
                style={[styles.input, errors.currentPassword ? styles.inputError : null]}
                value={formData.currentPassword}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, currentPassword: text }));
                  setErrors(prev => ({ ...prev, currentPassword: undefined }));
                }}
                placeholder="請輸入您的密碼"
                placeholderTextColor={DesignSystem.colors.text.tertiary}
                secureTextEntry
              />
              {errors.currentPassword && (
                <Text style={styles.errorText}>{errors.currentPassword}</Text>
              )}
            </View>
          )}

          {/* 注意事項 */}
          <View style={styles.noticeContainer}>
            <Icon 
              name="information-circle-outline" 
              size={20} 
              color={DesignSystem.colors.text.secondary} 
            />
            <Text style={styles.noticeText}>
              更新電子郵件後，下次登入時請使用新的電子郵件地址
            </Text>
          </View>
        </View>
      </ScrollView>
      </Layout>
    </WebModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: DesignSystem.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: DesignSystem.colors.text.primary,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
  },
  inputError: {
    borderColor: DesignSystem.colors.error,
  },
  errorText: {
    fontSize: 12,
    color: DesignSystem.colors.error,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
    marginTop: 4,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: DesignSystem.colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
    lineHeight: 20,
  },
});