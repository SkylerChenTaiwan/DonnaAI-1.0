/**
 * 階段 3: 用戶資料預覽與編輯
 * 提供資料驗證、編輯和批量操作功能
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  AdaptiveInput,
  AdaptiveButton
} from '@/components/adaptive';
import { View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert  } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';
import {
  ImportUserData,
  UserImportConfigExtended,
  UserImportStats } from '@/types/userImport';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

interface UserDataPreviewProps {
  data: ImportUserData[];
  config: UserImportConfigExtended;
  onDataEdit: (updatedData: ImportUserData[]) => void;
  onConfigUpdate: (config: Partial<UserImportConfigExtended>) => void;
  onImport: () => void;
}

const UserDataPreview: React.FC<UserDataPreviewProps> = ({
  data,
  config,
  onDataEdit,
  onConfigUpdate,
  onImport }) => {
  const [editingCell, setEditingCell] = useState<{ userId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(
    new Set(data.filter(u => u.isSelected).map(u => u.id))
  );
  const [showInvalid, setShowInvalid] = useState(true);
  const [searchText, setSearchText] = useState('');

  // 計算統計資料
  const stats = useMemo<UserImportStats>(() => {
    return {
      total: data.length,
      valid: data.filter(u => u.isValid).length,
      invalid: data.filter(u => !u.isValid).length,
      duplicates: data.filter(u => u.isDuplicate).length,
      selected: selectedUsers.size,
      errors: data.reduce((sum, u) => sum + u.validationErrors.length, 0) };
  }, [data, selectedUsers]);

  // 過濾顯示的資料
  const filteredData = useMemo(() => {
    let filtered = data;

    // 根據有效性過濾
    if (!showInvalid) {
      filtered = filtered.filter(u => u.isValid);
    }

    // 根據搜索文字過濾
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(searchLower) ||
        u.name.toLowerCase().includes(searchLower) ||
        u.department?.toLowerCase().includes(searchLower) ||
        u.position?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [data, showInvalid, searchText]);

  /**
   * 開始編輯單元格
   */
  const startEdit = (userId: string, field: string, currentValue: string) => {
    setEditingCell({ userId, field });
    setEditValue(currentValue);
  };

  /**
   * 保存編輯
   */
  const saveEdit = () => {
    if (!editingCell) return;

    const updatedData = data.map(user => {
      if (user.id === editingCell.userId) {
        const updated = {
          ...user,
          [editingCell.field]: editValue,
          isEdited: true };
        
        // 重新驗證
        if (editingCell.field === 'email') {
          updated.isValid = validateEmail(editValue) && user.name !== '';
          updated.validationErrors = updated.isValid ? [] : ['無效的電子郵件格式'];
        }
        
        return updated;
      }
      return user;
    });

    onDataEdit(updatedData);
    setEditingCell(null);
    setEditValue('');
  };

  /**
   * 取消編輯
   */
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  /**
   * 驗證電子郵件
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * 切換用戶選擇
   */
  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);

    // 更新資料
    const updatedData = data.map(user => ({
      ...user,
      isSelected: newSelected.has(user.id) }));
    onDataEdit(updatedData);
  };

  /**
   * 全選/取消全選
   */
  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredData.length) {
      // 取消全選
      setSelectedUsers(new Set());
      const updatedData = data.map(user => ({ ...user, isSelected: false }));
      onDataEdit(updatedData);
    } else {
      // 全選當前過濾的資料
      const newSelected = new Set(filteredData.map(u => u.id));
      setSelectedUsers(newSelected);
      const updatedData = data.map(user => ({
        ...user,
        isSelected: newSelected.has(user.id) }));
      onDataEdit(updatedData);
    }
  };

  /**
   * 批量設定角色
   */
  const batchSetRole = (role: 'user' | 'admin') => {
    const updatedData = data.map(user => {
      if (selectedUsers.has(user.id)) {
        return { ...user, role, isEdited: true };
      }
      return user;
    });
    onDataEdit(updatedData);
    showSuccessToast(`已將 ${selectedUsers.size} 個用戶設為${role === 'admin' ? '管理員' : '一般用戶'}`);
  };

  /**
   * 批量設定部門
   */
  const batchSetDepartment = () => {
    Alert.prompt(
      '設定部門',
      '請輸入部門名稱',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: (department) => {
            if (department) {
              const updatedData = data.map(user => {
                if (selectedUsers.has(user.id)) {
                  return { ...user, department, isEdited: true };
                }
                return user;
              });
              onDataEdit(updatedData);
              showSuccessToast(`已設定 ${selectedUsers.size} 個用戶的部門`);
            }
          } },
      ],
      'plain-text'
    );
  };

  /**
   * 移除無效資料
   */
  const removeInvalidData = () => {
    Alert.alert(
      '確認移除',
      `確定要移除 ${stats.invalid} 筆無效資料嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: () => {
            const validData = data.filter(u => u.isValid);
            onDataEdit(validData);
            showSuccessToast(`已移除 ${stats.invalid} 筆無效資料`);
          },
          style: 'destructive' },
      ]
    );
  };

  /**
   * 渲染資料行
   */
  const renderDataRow = (user: ImportUserData, index: number) => {
    const isEditing = editingCell?.userId === user.id;

    return (
      <View
        key={user.id}
        style={StyleSheet.flatten([
          styles.dataRow,
          !user.isValid && styles.dataRowInvalid,
          user.isDuplicate && styles.dataRowDuplicate,
        ])}
      >
        {/* 選擇框 */}
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleUserSelection(user.id)}
        >
          <View style={StyleSheet.flatten([
            styles.checkboxInner,
            selectedUsers.has(user.id) && styles.checkboxChecked,
          ])}>
            {selectedUsers.has(user.id) && (
              <Icon name="checkmark" size={12} color={DesignSystem.colors.text.inverse} />
            )}
          </View>
        </TouchableOpacity>

        {/* 狀態指示器 */}
        <View style={styles.statusIndicator}>
          {!user.isValid ? (
            <Icon name="alert-circle" size={16} color={DesignSystem.colors.status.error} />
          ) : user.isDuplicate ? (
            <Icon name="copy-outline" size={16} color={DesignSystem.colors.status.warning} />
          ) : (
            <Icon name="checkmark-circle" size={16} color={DesignSystem.colors.status.success} />
          )}
        </View>

        {/* 資料欄位 */}
        {['email', 'name', 'role', 'department', 'position', 'phoneNumber'].map(field => {
          const value = user[field as keyof ImportUserData] || '';
          const isEditingThis = isEditing && editingCell?.field === field;

          return (
            <TouchableOpacity
              key={field}
              style={styles.dataCell}
              onPress={() => !isEditing && startEdit(user.id, field, String(value))}
            >
              {isEditingThis ? (
                <AdaptiveInput
                  style={styles.editInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  onBlur={saveEdit}
                  onSubmitEditing={saveEdit}
                  autoFocus
                />
              ) : (
                <Text style={StyleSheet.flatten([
                  styles.dataCellText,
                  !value && styles.dataCellEmpty,
                ])}>
                  {value || '-'}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* 操作按鈕 */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => {
            const updatedData = data.filter(u => u.id !== user.id);
            onDataEdit(updatedData);
          }}
        >
          <Icon name="trash-outline" size={16} color={DesignSystem.colors.status.error} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 工具欄 */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Icon name="search-outline" size={16} color={DesignSystem.colors.text.tertiary} />
          <AdaptiveInput
            style={styles.searchInput}
            placeholder="搜尋用戶..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <TouchableOpacity
          style={StyleSheet.flatten([styles.filterButton, !showInvalid && styles.filterButtonActive])}
          onPress={() => setShowInvalid(!showInvalid)}
        >
          <Icon name="filter-outline" size={16} />
          <Text style={styles.filterButtonText}>
            {showInvalid ? '顯示全部' : '僅有效'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 批量操作 */}
      {selectedUsers.size > 0 && (
        <View style={styles.batchActions}>
          <Text style={styles.batchActionsText}>
            已選擇 {selectedUsers.size} 個用戶
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.batchButton}
              onPress={() => batchSetRole('user')}
            >
              <Text style={styles.batchButtonText}>設為一般用戶</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.batchButton}
              onPress={() => batchSetRole('admin')}
            >
              <Text style={styles.batchButtonText}>設為管理員</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.batchButton}
              onPress={batchSetDepartment}
            >
              <Text style={styles.batchButtonText}>設定部門</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 資料表格 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.table}>
          {/* 表頭 */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={toggleSelectAll}
            >
              <View style={StyleSheet.flatten([
                styles.checkboxInner,
                selectedUsers.size === filteredData.length && filteredData.length > 0 && styles.checkboxChecked,
              ])}>
                {selectedUsers.size === filteredData.length && filteredData.length > 0 && (
                  <Icon name="checkmark" size={12} color={DesignSystem.colors.text.inverse} />
                )}
              </View>
            </TouchableOpacity>
            <Text style={StyleSheet.flatten([styles.headerCell, styles.statusHeader])}>狀態</Text>
            <Text style={styles.headerCell}>電子郵件</Text>
            <Text style={styles.headerCell}>姓名</Text>
            <Text style={styles.headerCell}>角色</Text>
            <Text style={styles.headerCell}>部門</Text>
            <Text style={styles.headerCell}>職位</Text>
            <Text style={styles.headerCell}>電話</Text>
            <Text style={StyleSheet.flatten([styles.headerCell, styles.actionHeader])}>操作</Text>
          </View>

          {/* 資料列 */}
          <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
            {filteredData.map((user, index) => renderDataRow(user, index))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* 統計資訊 */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Icon name="people-outline" size={16} color={DesignSystem.colors.text.secondary} />
          <Text style={styles.statText}>總計: {stats.total}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="checkmark-circle-outline" size={16} color={DesignSystem.colors.status.success} />
          <Text style={styles.statText}>有效: {stats.valid}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="alert-circle-outline" size={16} color={DesignSystem.colors.status.error} />
          <Text style={styles.statText}>無效: {stats.invalid}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="copy-outline" size={16} color={DesignSystem.colors.status.warning} />
          <Text style={styles.statText}>重複: {stats.duplicates}</Text>
        </View>
      </View>

      {/* 匯入設定 */}
      <View style={styles.importSettings}>
        <Text style={styles.settingsTitle}>匯入選項</Text>
        <View style={styles.settingsGrid}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => onConfigUpdate({ skipDuplicates: !config.skipDuplicates })}
          >
            <View style={StyleSheet.flatten([
              styles.settingCheckbox,
              config.skipDuplicates && styles.settingCheckboxChecked,
            ])}>
              {config.skipDuplicates && (
                <Icon name="checkmark" size={12} color={DesignSystem.colors.text.inverse} />
              )}
            </View>
            <Text style={styles.settingLabel}>跳過重複用戶</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => onConfigUpdate({ sendWelcomeEmail: !config.sendWelcomeEmail })}
          >
            <View style={StyleSheet.flatten([
              styles.settingCheckbox,
              config.sendWelcomeEmail && styles.settingCheckboxChecked,
            ])}>
              {config.sendWelcomeEmail && (
                <Icon name="checkmark" size={12} color={DesignSystem.colors.text.inverse} />
              )}
            </View>
            <Text style={styles.settingLabel}>發送歡迎郵件</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => onConfigUpdate({ generatePasswords: !config.generatePasswords })}
          >
            <View style={StyleSheet.flatten([
              styles.settingCheckbox,
              config.generatePasswords && styles.settingCheckboxChecked,
            ])}>
              {config.generatePasswords && (
                <Icon name="checkmark" size={12} color={DesignSystem.colors.text.inverse} />
              )}
            </View>
            <Text style={styles.settingLabel}>自動生成密碼</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 操作按鈕 */}
      <View style={styles.actions}>
        {stats.invalid > 0 && (
          <AdaptiveButton
            title={`移除無效資料 (${stats.invalid})`}
            onPress={removeInvalidData}
            variant="outline"
            style={styles.actionButton}
          />
        )}
        <AdaptiveButton
          title={`匯入 ${stats.selected} 個用戶`}
          onPress={onImport}
          disabled={stats.selected === 0 || stats.valid === 0}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1 },
  toolbar: {
    flexDirection: 'row',
    marginBottom: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.sm,
    paddingHorizontal: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light },
  searchInput: {
    flex: 1,
    ...DesignSystem.typography.body,
    marginLeft: DesignSystem.spacing.xs,
    paddingVertical: DesignSystem.spacing.xs },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light },
  filterButtonActive: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary },
  filterButtonText: {
    ...DesignSystem.typography.caption,
    marginLeft: DesignSystem.spacing.xs },
  batchActions: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.sm,
    marginBottom: DesignSystem.spacing.md },
  batchActionsText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.xs },
  batchButton: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: DesignSystem.borderRadius.xs,
    marginRight: DesignSystem.spacing.sm },
  batchButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.inverse },
  table: {
    minWidth: 900 },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 2,
    borderBottomColor: DesignSystem.colors.border.medium,
    paddingVertical: DesignSystem.spacing.sm },
  headerCell: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
    width: 120,
    paddingHorizontal: DesignSystem.spacing.sm },
  statusHeader: {
    width: 40 },
  actionHeader: {
    width: 60 },
  tableBody: {
    maxHeight: 400 },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
    paddingVertical: DesignSystem.spacing.xs,
    backgroundColor: DesignSystem.colors.background.primary },
  dataRowInvalid: {
    backgroundColor: `${DesignSystem.colors.status.error}10` },
  dataRowDuplicate: {
    backgroundColor: `${DesignSystem.colors.status.warning}10` },
  checkbox: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center' },
  checkboxInner: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center' },
  checkboxChecked: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary },
  statusIndicator: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center' },
  dataCell: {
    width: 120,
    paddingHorizontal: DesignSystem.spacing.sm,
    justifyContent: 'center' },
  dataCellText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary },
  dataCellEmpty: {
    color: DesignSystem.colors.text.tertiary,
    fontStyle: 'italic' },
  editInput: {
    ...DesignSystem.typography.caption,
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary,
    borderRadius: DesignSystem.borderRadius.xs,
    paddingHorizontal: DesignSystem.spacing.xs,
    paddingVertical: 2,
    backgroundColor: DesignSystem.colors.background.primary },
  removeButton: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center' },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: DesignSystem.spacing.md,
    marginVertical: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.sm },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center' },
  statText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: DesignSystem.spacing.xs },
  importSettings: {
    marginBottom: DesignSystem.spacing.lg },
  settingsTitle: {
    ...DesignSystem.typography.h5,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.md },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center' },
  settingCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignSystem.spacing.sm },
  settingCheckboxChecked: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary },
  settingLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: DesignSystem.spacing.md },
  actionButton: {
    minWidth: 120 } });

export default UserDataPreview;