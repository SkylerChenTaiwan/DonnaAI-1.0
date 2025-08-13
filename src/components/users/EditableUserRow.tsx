/**
 * 可編輯用戶列組件
 * 支援內嵌編輯用戶資料、驗證狀態顯示、選擇功能
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert } from 'react-native';
import { ImportUserData, UserEditEvent } from '@/types/userImport';
import { DesignSystem } from '@/theme/designSystem';
import { Icon } from '@/components/common/Icon';

export interface EditableUserRowProps {
  user: ImportUserData;
  onEdit: (event: UserEditEvent) => void;
  onSelect?: (userId: string, selected: boolean) => void;
  showSelection?: boolean;
  style?: object;
  compact?: boolean;
  disabled?: boolean;
}

type EditingField = keyof ImportUserData | null;

/**
 * 可編輯用戶列組件
 */
export const EditableUserRow: React.FC<EditableUserRowProps> = ({
  user,
  onEdit,
  onSelect,
  showSelection = true,
  style,
  compact = false,
  disabled = false
}) => {
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // 輸入框引用
  const emailRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const roleRef = useRef<TextInput>(null);
  const departmentRef = useRef<TextInput>(null);
  const positionRef = useRef<TextInput>(null);
  const phoneNumberRef = useRef<TextInput>(null);
  
  const inputRefs = {
    email: emailRef,
    name: nameRef,
    role: roleRef,
    department: departmentRef,
    position: positionRef,
    phoneNumber: phoneNumberRef };

  /**
   * 開始編輯欄位
   */
  const handleStartEdit = useCallback((field: keyof ImportUserData) => {
    if (disabled || !user.isValid) return;
    
    setEditingField(field);
    setEditingValue(String(user[field] || ''));
    
    // 延遲聚焦，確保輸入框已渲染
    setTimeout(() => {
      if (field in inputRefs) {
        inputRefs[field as keyof typeof inputRefs].current?.focus();
      }
    }, 50);
  }, [disabled, user]);

  /**
   * 完成編輯
   */
  const handleFinishEdit = useCallback((field: keyof ImportUserData, value: string) => {
    const oldValue = user[field];
    const newValue = value.trim();
    
    // 如果值沒有變化，取消編輯
    if (String(oldValue) === newValue) {
      setEditingField(null);
      return;
    }
    
    // 特殊處理角色欄位
    if (field === 'role') {
      const normalizedRole = newValue.toLowerCase();
      if (normalizedRole !== 'user' && normalizedRole !== 'admin') {
        Alert.alert('無效的角色', '角色必須是 "user" 或 "admin"');
        return;
      }
    }
    
    // 發出編輯事件
    onEdit({
      userId: user.id,
      field,
      value: field === 'role' ? (newValue.toLowerCase() as 'user' | 'admin') : newValue,
      oldValue
    });
    
    setEditingField(null);
  }, [user, onEdit]);


  /**
   * 處理選擇變更
   */
  const handleToggleSelection = useCallback(() => {
    if (!onSelect) return;
    onSelect(user.id, !user.isSelected);
  }, [user.id, user.isSelected, onSelect]);

  /**
   * 渲染可編輯欄位
   */
  const renderEditableField = (
    field: keyof ImportUserData,
    label: string,
    value: string | undefined,
    options?: {
      placeholder?: string;
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      maxLength?: number;
      multiline?: boolean;
    }
  ) => {
    const isEditing = editingField === field;
    const hasError = user.validationErrors.some(error => 
      error.toLowerCase().includes(label.toLowerCase())
    );
    
    return (
      <View style={StyleSheet.flatten([
        styles.fieldContainer,
        compact && styles.fieldContainerCompact
      ])}>
        <Text style={StyleSheet.flatten([
          styles.fieldLabel,
          compact && styles.fieldLabelCompact
        ])}>
          {label}
        </Text>
        
        {isEditing ? (
          <TextInput
            ref={inputRefs[field as keyof typeof inputRefs]}
            value={editingValue}
            onChangeText={setEditingValue}
            onBlur={() => handleFinishEdit(field, editingValue)}
            onSubmitEditing={() => handleFinishEdit(field, editingValue)}
            placeholder={options?.placeholder}
            keyboardType={options?.keyboardType || 'default'}
            maxLength={options?.maxLength}
            multiline={options?.multiline}
            style={StyleSheet.flatten([
              styles.fieldInput,
              hasError && styles.fieldInputError,
              compact && styles.fieldInputCompact
            ])}
            autoCapitalize="none"
            returnKeyType="done"
            blurOnSubmit
          />
        ) : (
          <TouchableOpacity
            onPress={() => handleStartEdit(field)}
            disabled={disabled || !user.isValid}
            style={StyleSheet.flatten([
              styles.fieldValue,
              hasError && styles.fieldValueError,
              compact && styles.fieldValueCompact,
              (!user.isValid || disabled) && styles.fieldValueDisabled
            ])}
          >
            <Text style={StyleSheet.flatten([
              styles.fieldValueText,
              hasError && styles.fieldValueTextError,
              (!user.isValid || disabled) && styles.fieldValueTextDisabled,
              compact && styles.fieldValueTextCompact
            ])}>
              {value || options?.placeholder || '未填寫'}
            </Text>
            {!disabled && user.isValid && (
              <Icon
                name="create-outline"
                size={compact ? 12 : 14}
                color={DesignSystem.colors.text.tertiary}
                style={styles.editIcon}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={StyleSheet.flatten([
      styles.container,
      !user.isValid && styles.containerInvalid,
      user.isDuplicate && styles.containerDuplicate,
      user.isEdited && styles.containerEdited,
      compact && styles.containerCompact,
      style
    ])}>
      {/* 選擇框 */}
      {showSelection && (
        <TouchableOpacity
          onPress={handleToggleSelection}
          style={styles.selectionContainer}
        >
          <View style={StyleSheet.flatten([
            styles.checkbox,
            user.isSelected && styles.checkboxSelected,
            !user.isValid && styles.checkboxDisabled
          ])}>
            {user.isSelected && (
              <Icon
                name="checkmark"
                size={14}
                color={DesignSystem.colors.text.inverse}
              />
            )}
          </View>
        </TouchableOpacity>
      )}
      
      {/* 用戶資料欄位 */}
      <View style={styles.fieldsContainer}>
        <View style={styles.fieldsRow}>
          {/* 電子郵件 */}
          <View style={styles.fieldWrapper}>
            {renderEditableField('email', '電子郵件', user.email, {
              placeholder: 'user@example.com',
              keyboardType: 'email-address',
              maxLength: 100
            })}
          </View>
          
          {/* 姓名 */}
          <View style={styles.fieldWrapper}>
            {renderEditableField('name', '姓名', user.name, {
              placeholder: '請輸入姓名',
              maxLength: 50
            })}
          </View>
        </View>
        
        <View style={styles.fieldsRow}>
          {/* 角色 */}
          <View style={styles.fieldWrapper}>
            {renderEditableField('role', '角色', user.role === 'admin' ? '管理員' : '一般用戶', {
              placeholder: '選擇角色'
            })}
          </View>
          
          {/* 部門 */}
          <View style={styles.fieldWrapper}>
            {renderEditableField('department', '部門', user.department, {
              placeholder: '請輸入部門',
              maxLength: 50
            })}
          </View>
        </View>
        
        <View style={styles.fieldsRow}>
          {/* 職位 */}
          <View style={styles.fieldWrapper}>
            {renderEditableField('position', '職位', user.position, {
              placeholder: '請輸入職位',
              maxLength: 50
            })}
          </View>
          
          {/* 電話 */}
          <View style={styles.fieldWrapper}>
            {renderEditableField('phoneNumber', '電話', user.phoneNumber, {
              placeholder: '09xx-xxx-xxx',
              keyboardType: 'phone-pad',
              maxLength: 20
            })}
          </View>
        </View>
      </View>
      
      {/* 狀態指示器 */}
      <View style={styles.statusContainer}>
        {/* 驗證狀態 */}
        {!user.isValid && (
          <View style={styles.statusItem}>
            <Icon
              name="alert-circle-outline"
              size={16}
              color={DesignSystem.colors.error}
            />
            <Text style={styles.statusText}>
              {user.validationErrors[0]}
            </Text>
          </View>
        )}
        
        {/* 重複標記 */}
        {user.isDuplicate && (
          <View style={styles.statusItem}>
            <Icon
              name="copy-outline"
              size={16}
              color={DesignSystem.colors.warning}
            />
            <Text style={StyleSheet.flatten([styles.statusText, styles.statusTextWarning])}>
              重複資料
            </Text>
          </View>
        )}
        
        {/* 已編輯標記 */}
        {user.isEdited && (
          <View style={styles.statusItem}>
            <Icon
              name="create-outline"
              size={16}
              color={DesignSystem.colors.info}
            />
            <Text style={StyleSheet.flatten([styles.statusText, styles.statusTextInfo])}>
              已編輯
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light },
  containerCompact: {
    padding: DesignSystem.spacing.sm },
  containerInvalid: {
    borderColor: DesignSystem.colors.error,
    backgroundColor: `${DesignSystem.colors.error}10` },
  containerDuplicate: {
    borderColor: DesignSystem.colors.warning,
    backgroundColor: `${DesignSystem.colors.warning}08` },
  containerEdited: {
    borderColor: DesignSystem.colors.info },
  selectionContainer: {
    paddingRight: DesignSystem.spacing.sm,
    paddingTop: DesignSystem.spacing.xs },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.primary },
  checkboxSelected: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary },
  checkboxDisabled: {
    borderColor: DesignSystem.colors.border.light,
    backgroundColor: DesignSystem.colors.background.secondary },
  fieldsContainer: {
    flex: 1 },
  fieldsRow: {
    flexDirection: 'row',
    marginBottom: DesignSystem.spacing.sm },
  fieldWrapper: {
    flex: 1,
    marginRight: DesignSystem.spacing.sm },
  fieldContainer: {
    marginBottom: DesignSystem.spacing.xs },
  fieldContainerCompact: {
    marginBottom: DesignSystem.spacing.xxs },
  fieldLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: 2,
    fontSize: 11 },
  fieldLabelCompact: {
    fontSize: 10 },
  fieldInput: {
    ...DesignSystem.typography.body,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.medium,
    borderRadius: DesignSystem.borderRadius.sm,
    padding: DesignSystem.spacing.xs,
    minHeight: 32,
    backgroundColor: DesignSystem.colors.background.primary },
  fieldInputCompact: {
    minHeight: 28,
    fontSize: 12 },
  fieldInputError: {
    borderColor: DesignSystem.colors.error },
  fieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
    paddingHorizontal: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent' },
  fieldValueCompact: {
    minHeight: 28 },
  fieldValueError: {
    backgroundColor: `${DesignSystem.colors.error}08` },
  fieldValueDisabled: {
    opacity: 0.6 },
  fieldValueText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    flex: 1 },
  fieldValueTextCompact: {
    fontSize: 12 },
  fieldValueTextError: {
    color: DesignSystem.colors.error },
  fieldValueTextDisabled: {
    color: DesignSystem.colors.text.disabled },
  editIcon: {
    marginLeft: DesignSystem.spacing.xs },
  statusContainer: {
    paddingLeft: DesignSystem.spacing.sm,
    paddingTop: DesignSystem.spacing.xs },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xxs },
  statusText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.error,
    marginLeft: DesignSystem.spacing.xxs,
    fontSize: 10 },
  statusTextWarning: {
    color: DesignSystem.colors.warning },
  statusTextInfo: {
    color: DesignSystem.colors.info } });

export default EditableUserRow;