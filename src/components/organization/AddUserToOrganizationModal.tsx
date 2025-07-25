/**
 * 新增用戶到組織 Modal
 * 專門用於 Super Admin 在組織管理中新增用戶
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/services/firebase/config';
import { TextInput } from '@/components/common/TextInput';
import { Button } from '@/components/common/Button';
import { Organization, User } from '@/types/entities';
import { DesignSystem } from '@/theme/designSystem';
import { toast } from '@/utils/toast';

interface AddUserToOrganizationModalProps {
  visible: boolean;
  organization: Organization;
  onClose: () => void;
  onUserAdded?: () => void;
}

interface UserFormData {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  department?: string;
  position?: string;
}

export const AddUserToOrganizationModal: React.FC<AddUserToOrganizationModalProps> = ({
  visible,
  organization,
  onClose,
  onUserAdded,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'user',
    department: '',
    position: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleFieldChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      toast.error('請輸入電子郵件');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('請輸入有效的電子郵件地址');
      return false;
    }
    if (!formData.password.trim()) {
      toast.error('請輸入密碼');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('密碼至少需要 6 個字元');
      return false;
    }
    if (!formData.name.trim()) {
      toast.error('請輸入姓名');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // 1. 建立 Firebase Auth 使用者
      const userCredential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        formData.email,
        formData.password
      );
      const newUser = userCredential.user;

      // 2. 更新使用者顯示名稱
      await updateProfile(newUser, { displayName: formData.name });

      // 3. 建立使用者資料文件
      const userData: Omit<User, 'id'> = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        organizationId: organization.id,
        department: formData.department || undefined,
        position: formData.position || undefined,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date(),
      };

      // 4. 儲存到 Firestore
      const userRef = doc(getFirebaseDb(), 'users', newUser.uid);
      await setDoc(userRef, {
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
      });

      toast.success('用戶新增成功');
      
      // 重置表單
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'user',
        department: '',
        position: '',
      });
      
      onUserAdded?.();
      onClose();
    } catch (error: any) {
      console.error('新增用戶失敗:', error);
      
      // 處理特定錯誤
      if (error.code === 'auth/email-already-in-use') {
        toast.error('此電子郵件已被使用');
      } else if (error.code === 'auth/weak-password') {
        toast.error('密碼強度不足');
      } else {
        toast.error('新增用戶失敗：' + (error.message || '未知錯誤'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // 重置表單
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'user',
        department: '',
        position: '',
      });
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isLoading}
            >
              <Ionicons name="close" size={24} color={DesignSystem.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>新增用戶到 {organization.name}</Text>
          </View>
          <Button
            title="新增"
            onPress={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
            size="small"
          />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TextInput
            label="電子郵件"
            value={formData.email}
            onChangeText={(text) => handleFieldChange('email', text)}
            placeholder="user@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />

          <TextInput
            label="密碼"
            value={formData.password}
            onChangeText={(text) => handleFieldChange('password', text)}
            placeholder="至少 6 個字元"
            secureTextEntry
            required
          />

          <TextInput
            label="姓名"
            value={formData.name}
            onChangeText={(text) => handleFieldChange('name', text)}
            placeholder="用戶姓名"
            required
          />

          {/* 角色選擇 */}
          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>角色 <Text style={styles.required}>*</Text></Text>
            <View style={styles.roleOptions}>
              <TouchableOpacity
                style={[styles.roleOption, formData.role === 'user' && styles.roleOptionActive]}
                onPress={() => handleFieldChange('role', 'user')}
              >
                <Text style={[styles.roleOptionText, formData.role === 'user' && styles.roleOptionTextActive]}>
                  一般用戶
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, formData.role === 'admin' && styles.roleOptionActive]}
                onPress={() => handleFieldChange('role', 'admin')}
              >
                <Text style={[styles.roleOptionText, formData.role === 'admin' && styles.roleOptionTextActive]}>
                  管理員
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            label="部門"
            value={formData.department}
            onChangeText={(text) => handleFieldChange('department', text)}
            placeholder="選填"
          />

          <TextInput
            label="職位"
            value={formData.position}
            onChangeText={(text) => handleFieldChange('position', text)}
            placeholder="選填"
          />

          {/* 提示訊息 */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={DesignSystem.colors.primary} />
            <Text style={styles.infoText}>
              新用戶將會收到帳號資訊，請確保電子郵件地址正確。管理員角色可以管理組織設定和其他用戶。
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  closeButton: {
    padding: DesignSystem.spacing.sm,
    marginRight: DesignSystem.spacing.sm,
  },
  headerTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.lg,
  },
  roleSection: {
    marginBottom: DesignSystem.spacing.lg,
  },
  roleLabel: {
    ...DesignSystem.typography.bodySmall,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.sm,
  },
  required: {
    color: DesignSystem.colors.error,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm,
  },
  roleOption: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.default,
    borderRadius: DesignSystem.borderRadius.sm,
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.surface,
  },
  roleOptionActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.primary + '10',
  },
  roleOptionText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  roleOptionTextActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: DesignSystem.colors.primary + '10',
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.sm,
    marginTop: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.xl,
  },
  infoText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: DesignSystem.spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
});