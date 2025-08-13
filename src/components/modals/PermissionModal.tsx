/**
 * 權限設定彈窗 - 視覺化權限矩陣
 */

import React, { useState, useEffect } from 'react';
import { View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator, Platform  } from 'react-native';
import {
  AdaptiveModal
} from '@/components/adaptive';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '../../theme/DesignSystem';
import { User } from '../../types/user';
import { updateUserRole, updateUserPermissions } from '../../services/firebase/userService';
import { clearUserPermissionCache } from '../../services/firebase/permissions-v2';

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface PermissionModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

// 權限模組定義
const PERMISSION_MODULES = {
  customers: {
    name: '客戶管理',
    permissions: [
      { id: 'view_customers', name: '查看客戶', description: '查看客戶列表和詳情' },
      { id: 'create_customers', name: '建立客戶', description: '新增客戶資料' },
      { id: 'edit_customers', name: '編輯客戶', description: '修改客戶資料' },
      { id: 'delete_customers', name: '刪除客戶', description: '刪除客戶資料' },
      { id: 'export_customers', name: '匯出客戶', description: '匯出客戶資料' },
    ] },
  records: {
    name: '紀錄管理',
    permissions: [
      { id: 'view_records', name: '查看紀錄', description: '查看會議和通話紀錄' },
      { id: 'create_records', name: '建立紀錄', description: '新增紀錄' },
      { id: 'edit_records', name: '編輯紀錄', description: '修改紀錄內容' },
      { id: 'delete_records', name: '刪除紀錄', description: '刪除紀錄' },
    ] },
  tasks: {
    name: '任務管理',
    permissions: [
      { id: 'view_tasks', name: '查看任務', description: '查看任務列表' },
      { id: 'create_tasks', name: '建立任務', description: '新增任務' },
      { id: 'edit_tasks', name: '編輯任務', description: '修改任務內容' },
      { id: 'delete_tasks', name: '刪除任務', description: '刪除任務' },
      { id: 'assign_tasks', name: '指派任務', description: '指派任務給其他人' },
    ] },
  team: {
    name: '團隊管理',
    permissions: [
      { id: 'view_team', name: '查看團隊', description: '查看團隊成員' },
      { id: 'manage_team', name: '管理團隊', description: '管理團隊成員' },
      { id: 'view_team_data', name: '查看團隊資料', description: '查看團隊成員的資料' },
    ] },
  organization: {
    name: '組織管理',
    permissions: [
      { id: 'view_org_structure', name: '查看組織架構', description: '查看完整組織架構' },
      { id: 'edit_org_structure', name: '編輯組織架構', description: '調整組織架構' },
      { id: 'manage_users', name: '管理使用者', description: '管理所有使用者' },
      { id: 'manage_permissions', name: '管理權限', description: '設定使用者權限' },
    ] },
  reports: {
    name: '報表分析',
    permissions: [
      { id: 'view_reports', name: '查看報表', description: '查看分析報表' },
      { id: 'create_reports', name: '建立報表', description: '建立自訂報表' },
      { id: 'export_reports', name: '匯出報表', description: '匯出報表資料' },
    ] } };

// 角色預設權限
const ROLE_PERMISSIONS = {
  admin: {
    name: '管理員',
    description: '擁有所有權限',
    permissions: Object.values(PERMISSION_MODULES).flatMap(module =>
      module.permissions.map(p => p.id)
    ) },
  manager: {
    name: '主管',
    description: '管理團隊和查看報表',
    permissions: [
      'view_customers', 'create_customers', 'edit_customers',
      'view_records', 'create_records', 'edit_records',
      'view_tasks', 'create_tasks', 'edit_tasks', 'assign_tasks',
      'view_team', 'manage_team', 'view_team_data',
      'view_reports', 'create_reports',
    ] },
  salesperson: {
    name: '業務員',
    description: '基本業務操作權限',
    permissions: [
      'view_customers', 'create_customers', 'edit_customers',
      'view_records', 'create_records', 'edit_records',
      'view_tasks', 'create_tasks', 'edit_tasks',
      'view_team',
    ] } };

export const PermissionModal: React.FC<PermissionModalProps> = ({
  visible,
  user,
  onClose,
  onUpdate }) => {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 初始化權限設定
    if (user.permissions?.modules) {
      setPermissions(new Set(user.permissions.modules));
    } else {
      // 使用角色預設權限
      setPermissions(new Set(ROLE_PERMISSIONS[user.role].permissions));
    }
  }, [user]);

  const handleRoleChange = (role: 'admin' | 'manager' | 'salesperson') => {
    setSelectedRole(role);
    // 套用角色預設權限
    setPermissions(new Set(ROLE_PERMISSIONS[role].permissions));
  };

  const togglePermission = (permissionId: string) => {
    const newPermissions = new Set(permissions);
    if (newPermissions.has(permissionId)) {
      newPermissions.delete(permissionId);
    } else {
      newPermissions.add(permissionId);
    }
    setPermissions(newPermissions);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 更新使用者角色
      if (selectedRole !== user.role) {
        await updateUserRole(user.id, selectedRole);
      }

      // 更新使用者權限
      await updateUserPermissions(user.id, {
        modules: Array.from(permissions),
        actions: [], // TODO: 實作動作權限
        dataAccess: selectedRole === 'admin' ? 'organization' : 
                    selectedRole === 'manager' ? 'team' : 'own' });

      // 清除權限快取
      clearUserPermissionCache(user.id);

      // 更新本地使用者資料
      const updatedUser = {
        ...user,
        role: selectedRole,
        permissions: {
          modules: Array.from(permissions),
          actions: [],
          dataAccess: selectedRole === 'admin' ? 'organization' : 
                     selectedRole === 'manager' ? 'team' : 'own' } };

      onUpdate(updatedUser);
      Alert.alert('成功', '權限設定已更新');
      onClose();
    } catch (error) {
      console.error('更新權限失敗:', error);
      Alert.alert('錯誤', '更新權限失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPermissionCheckbox = (permission: Permission, isChecked: boolean) => (
    <TouchableOpacity
      key={permission.id}
      style={styles.permissionItem}
      onPress={() => togglePermission(permission.id)}
      activeOpacity={0.7}
    >
      <View style={styles.checkboxContainer}>
        <View style={StyleSheet.flatten([styles.checkbox, isChecked && styles.checkboxChecked])}>
          {isChecked && (
            <Icon name="checkmark" size={16} color={DesignSystem.colors.text.inverse} />
          )}
        </View>
        <View style={styles.permissionInfo}>
          <Text style={styles.permissionName}>{permission.name}</Text>
          <Text style={styles.permissionDescription}>{permission.description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <AdaptiveModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* 標題列 */}
          <View style={styles.header}>
            <Text style={styles.title}>權限設定</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={DesignSystem.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* 使用者資訊 */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.displayName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>

          {/* 角色選擇 */}
          <View style={styles.roleSection}>
            <Text style={styles.sectionTitle}>角色</Text>
            <View style={styles.roleButtons}>
              {Object.entries(ROLE_PERMISSIONS).map(([role, info]) => (
                <TouchableOpacity
                  key={role}
                  style={StyleSheet.flatten([
                    styles.roleButton,
                    selectedRole === role && styles.roleButtonActive,
                  ])}
                  onPress={() => handleRoleChange(role as any)}
                >
                  <Text
                    style={StyleSheet.flatten([
                      styles.roleButtonText,
                      selectedRole === role && styles.roleButtonTextActive,
                    ])}
                  >
                    {info.name}
                  </Text>
                  <Text style={styles.roleDescription}>{info.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 權限矩陣 */}
          <ScrollView style={styles.permissionsContainer} showsVerticalScrollIndicator={false}>
            {Object.entries(PERMISSION_MODULES).map(([moduleKey, module]) => (
              <View key={moduleKey} style={styles.moduleSection}>
                <Text style={styles.moduleName}>{module.name}</Text>
                {module.permissions.map(permission =>
                  renderPermissionCheckbox(
                    { ...permission, module: moduleKey },
                    permissions.has(permission.id)
                  )
                )}
              </View>
            ))}
          </ScrollView>

          {/* 操作按鈕 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={StyleSheet.flatten([styles.button, styles.cancelButton])}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={StyleSheet.flatten([styles.button, styles.saveButton])}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={DesignSystem.colors.text.inverse} />
              ) : (
                <Text style={styles.saveButtonText}>儲存</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AdaptiveModal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center' },
  modalContent: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.radius.lg,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 4 } }) }),
    shadowOpacity: 0.15,
    shadowRadius: 12,
    ...(Platform.OS === 'web' ? {} : { elevation: 8 }) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  title: {
    fontSize: DesignSystem.typography.title.fontSize,
    fontWeight: DesignSystem.typography.title.fontWeight as any,
    color: DesignSystem.colors.text.primary },
  closeButton: {
    padding: DesignSystem.spacing.sm },
  userInfo: {
    padding: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  userName: {
    fontSize: DesignSystem.typography.heading.fontSize,
    fontWeight: DesignSystem.typography.heading.fontWeight as any,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs },
  userEmail: {
    fontSize: DesignSystem.typography.body.fontSize,
    color: DesignSystem.colors.text.secondary },
  roleSection: {
    padding: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  sectionTitle: {
    fontSize: DesignSystem.typography.subheading.fontSize,
    fontWeight: DesignSystem.typography.subheading.fontWeight as any,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md },
  roleButtons: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm },
  roleButton: {
    flex: 1,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.radius.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.default,
    alignItems: 'center' },
  roleButtonActive: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary },
  roleButtonText: {
    fontSize: DesignSystem.typography.body.fontSize,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600' },
  roleButtonTextActive: {
    color: DesignSystem.colors.text.inverse },
  roleDescription: {
    fontSize: DesignSystem.typography.caption.fontSize,
    color: DesignSystem.colors.text.tertiary,
    marginTop: DesignSystem.spacing.xs,
    textAlign: 'center' },
  permissionsContainer: {
    flex: 1,
    padding: DesignSystem.spacing.lg },
  moduleSection: {
    marginBottom: DesignSystem.spacing.lg },
  moduleName: {
    fontSize: DesignSystem.typography.subheading.fontSize,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md },
  permissionItem: {
    marginBottom: DesignSystem.spacing.sm },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: DesignSystem.radius.sm,
    borderWidth: 1.5,
    borderColor: DesignSystem.colors.border.default,
    marginRight: DesignSystem.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center' },
  checkboxChecked: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary },
  permissionInfo: {
    flex: 1 },
  permissionName: {
    fontSize: DesignSystem.typography.body.fontSize,
    color: DesignSystem.colors.text.primary,
    marginBottom: 2 },
  permissionDescription: {
    fontSize: DesignSystem.typography.caption.fontSize,
    color: DesignSystem.colors.text.secondary },
  footer: {
    flexDirection: 'row',
    padding: DesignSystem.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border.light,
    gap: DesignSystem.spacing.md },
  button: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44 },
  cancelButton: {
    backgroundColor: DesignSystem.colors.button.secondary.default },
  saveButton: {
    backgroundColor: DesignSystem.colors.button.primary.default },
  cancelButtonText: {
    fontSize: DesignSystem.typography.body.fontSize,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600' },
  saveButtonText: {
    fontSize: DesignSystem.typography.body.fontSize,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '600' } });