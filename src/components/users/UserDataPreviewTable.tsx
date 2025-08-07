/**
 * 用戶資料預覽表格組件
 * 支援批量操作、篩選、統計和虛擬滾動
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ImportUserData, UserEditEvent, BatchOperationOptions, UserImportStats } from '@/types/userImport';
import { DesignSystem } from '@/theme/designSystem';
import { Icon } from '@/components/common/Icon';
import { Button } from '@/components/common/Button';
import EditableUserRow from './EditableUserRow';

export interface UserDataPreviewTableProps {
  users: ImportUserData[];
  onUserEdit: (event: UserEditEvent) => void;
  onBatchOperation: (operation: BatchOperationOptions) => void;
  onUserSelect?: (userId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  stats: UserImportStats;
  showSelection?: boolean;
  maxHeight?: number;
  style?: object;
}

type FilterType = 'all' | 'valid' | 'invalid' | 'duplicates' | 'selected' | 'edited';

interface FilterOption {
  key: FilterType;
  label: string;
  icon: string;
  count: number;
}

/**
 * 用戶資料預覽表格
 */
export const UserDataPreviewTable: React.FC<UserDataPreviewTableProps> = ({
  users,
  onUserEdit,
  onBatchOperation,
  onUserSelect,
  onSelectAll,
  stats,
  showSelection = true,
  maxHeight = 600,
  style
}) => {
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [showBatchActions, setShowBatchActions] = useState(false);

  /**
   * 篩選選項
   */
  const filterOptions: FilterOption[] = useMemo(() => [
    { key: 'all', label: '全部', icon: 'list-outline', count: stats.total },
    { key: 'valid', label: '有效', icon: 'checkmark-circle-outline', count: stats.valid },
    { key: 'invalid', label: '無效', icon: 'alert-circle-outline', count: stats.invalid },
    { key: 'duplicates', label: '重複', icon: 'copy-outline', count: stats.duplicates },
    { key: 'selected', label: '已選', icon: 'checkbox-outline', count: stats.selected },
    { key: 'edited', label: '已編輯', icon: 'create-outline', count: users.filter(u => u.isEdited).length }
  ], [stats, users]);

  /**
   * 篩選用戶資料
   */
  const filteredUsers = useMemo(() => {
    switch (currentFilter) {
      case 'valid':
        return users.filter(user => user.isValid);
      case 'invalid':
        return users.filter(user => !user.isValid);
      case 'duplicates':
        return users.filter(user => user.isDuplicate);
      case 'selected':
        return users.filter(user => user.isSelected);
      case 'edited':
        return users.filter(user => user.isEdited);
      default:
        return users;
    }
  }, [users, currentFilter]);

  /**
   * 選中用戶的數量
   */
  const selectedUsersInFilter = useMemo(() => {
    return filteredUsers.filter(user => user.isSelected).length;
  }, [filteredUsers]);

  /**
   * 全選/取消全選
   */
  const handleSelectAll = useCallback(() => {
    const allSelected = selectedUsersInFilter === filteredUsers.length && filteredUsers.length > 0;
    if (onSelectAll) {
      onSelectAll(!allSelected);
    } else {
      // 如果沒有提供 onSelectAll，使用批量操作
      onBatchOperation({
        operation: 'toggleSelection',
        value: String(!allSelected),
        targetIds: filteredUsers.map(user => user.id)
      });
    }
  }, [selectedUsersInFilter, filteredUsers, onSelectAll, onBatchOperation]);

  /**
   * 批量設定角色
   */
  const handleBatchSetRole = useCallback((role: 'user' | 'admin') => {
    const selectedIds = filteredUsers.filter(user => user.isSelected).map(user => user.id);
    
    if (selectedIds.length === 0) {
      Alert.alert('提示', '請先選擇要修改的用戶');
      return;
    }

    const roleName = role === 'admin' ? '管理員' : '一般用戶';
    Alert.alert(
      '確認操作',
      `確定要將選中的 ${selectedIds.length} 個用戶設為${roleName}嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: () => {
            onBatchOperation({
              operation: 'setRole',
              value: role,
              targetIds: selectedIds
            });
            setShowBatchActions(false);
          }
        }
      ]
    );
  }, [filteredUsers, onBatchOperation]);

  /**
   * 批量設定部門
   */
  const handleBatchSetDepartment = useCallback(() => {
    const selectedIds = filteredUsers.filter(user => user.isSelected).map(user => user.id);
    
    if (selectedIds.length === 0) {
      Alert.alert('提示', '請先選擇要修改的用戶');
      return;
    }

    // 這裡應該顯示一個輸入對話框，現在先使用簡單的提示
    Alert.prompt(
      '設定部門',
      `為選中的 ${selectedIds.length} 個用戶設定部門：`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: (department) => {
            if (department && department.trim()) {
              onBatchOperation({
                operation: 'setDepartment',
                value: department.trim(),
                targetIds: selectedIds
              });
              setShowBatchActions(false);
            }
          }
        }
      ],
      'plain-text'
    );
  }, [filteredUsers, onBatchOperation]);

  /**
   * 清除錯誤
   */
  const handleClearErrors = useCallback(() => {
    const selectedIds = filteredUsers.filter(user => user.isSelected && !user.isValid).map(user => user.id);
    
    if (selectedIds.length === 0) {
      Alert.alert('提示', '沒有選中的無效用戶');
      return;
    }

    onBatchOperation({
      operation: 'clearErrors',
      targetIds: selectedIds
    });
  }, [filteredUsers, onBatchOperation]);

  /**
   * 渲染用戶列
   */
  const renderUserRow = useCallback(({ item, index }: { item: ImportUserData; index: number }) => (
    <EditableUserRow
      key={item.id}
      user={item}
      onEdit={onUserEdit}
      onSelect={onUserSelect}
      showSelection={showSelection}
      style={[
        styles.userRow,
        index === filteredUsers.length - 1 && styles.userRowLast
      ]}
    />
  ), [onUserEdit, onUserSelect, showSelection, filteredUsers.length]);

  return (
    <View style={[styles.container, style]}>
      {/* 統計資訊 */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>匯入統計</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>總計</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.statNumberValid]}>{stats.valid}</Text>
            <Text style={styles.statLabel}>有效</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.statNumberInvalid]}>{stats.invalid}</Text>
            <Text style={styles.statLabel}>無效</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.statNumberDuplicate]}>{stats.duplicates}</Text>
            <Text style={styles.statLabel}>重複</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.statNumberSelected]}>{stats.selected}</Text>
            <Text style={styles.statLabel}>已選</Text>
          </View>
        </View>
      </View>

      {/* 篩選選項 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filterOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            onPress={() => setCurrentFilter(option.key)}
            style={[
              styles.filterChip,
              currentFilter === option.key && styles.filterChipActive
            ]}
          >
            <Icon
              name={option.icon}
              size={16}
              color={
                currentFilter === option.key
                  ? DesignSystem.colors.text.inverse
                  : DesignSystem.colors.text.secondary
              }
            />
            <Text style={[
              styles.filterChipText,
              currentFilter === option.key && styles.filterChipTextActive
            ]}>
              {option.label}
            </Text>
            <Text style={[
              styles.filterChipCount,
              currentFilter === option.key && styles.filterChipCountActive
            ]}>
              {option.count}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 表格工具列 */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          {showSelection && (
            <TouchableOpacity
              onPress={handleSelectAll}
              style={styles.selectAllButton}
            >
              <Icon
                name={
                  selectedUsersInFilter === filteredUsers.length && filteredUsers.length > 0
                    ? 'checkbox'
                    : selectedUsersInFilter > 0
                    ? 'square'
                    : 'square-outline'
                }
                size={20}
                color={DesignSystem.colors.primary}
              />
              <Text style={styles.selectAllText}>
                {selectedUsersInFilter > 0
                  ? `已選 ${selectedUsersInFilter}/${filteredUsers.length}`
                  : '全選'
                }
              </Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.countText}>
            顯示 {filteredUsers.length} 筆資料
          </Text>
        </View>

        <View style={styles.toolbarRight}>
          {selectedUsersInFilter > 0 && (
            <TouchableOpacity
              onPress={() => setShowBatchActions(!showBatchActions)}
              style={styles.batchActionsButton}
            >
              <Icon
                name="options-outline"
                size={20}
                color={DesignSystem.colors.primary}
              />
              <Text style={styles.batchActionsText}>批量操作</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 批量操作面板 */}
      {showBatchActions && selectedUsersInFilter > 0 && (
        <View style={styles.batchActionsPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Button
              title="設為一般用戶"
              onPress={() => handleBatchSetRole('user')}
              variant="outline"
              size="small"
              style={styles.batchActionButton}
            />
            <Button
              title="設為管理員"
              onPress={() => handleBatchSetRole('admin')}
              variant="outline"
              size="small"
              style={styles.batchActionButton}
            />
            <Button
              title="設定部門"
              onPress={handleBatchSetDepartment}
              variant="outline"
              size="small"
              style={styles.batchActionButton}
            />
            <Button
              title="清除錯誤"
              onPress={handleClearErrors}
              variant="outline"
              size="small"
              style={styles.batchActionButton}
            />
          </ScrollView>
        </View>
      )}

      {/* 用戶列表 */}
      <View style={[styles.tableContainer, { maxHeight }]}>
        {filteredUsers.length > 0 ? (
          <FlashList
            data={filteredUsers}
            renderItem={renderUserRow}
            estimatedItemSize={120}
            showsVerticalScrollIndicator={true}
            keyExtractor={(item) => item.id}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon
              name="document-text-outline"
              size={48}
              color={DesignSystem.colors.text.tertiary}
            />
            <Text style={styles.emptyText}>
              {currentFilter === 'all' ? '沒有用戶資料' : '沒有符合條件的用戶'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignSystem.colors.background.primary,
  },
  statsContainer: {
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  statsTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
  },
  statNumberValid: {
    color: DesignSystem.colors.success,
  },
  statNumberInvalid: {
    color: DesignSystem.colors.error,
  },
  statNumberDuplicate: {
    color: DesignSystem.colors.warning,
  },
  statNumberSelected: {
    color: DesignSystem.colors.primary,
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xxs,
  },
  filtersContainer: {
    marginBottom: DesignSystem.spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: DesignSystem.spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    marginRight: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
    backgroundColor: DesignSystem.colors.background.surface,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
  },
  filterChipActive: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary,
  },
  filterChipText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginLeft: DesignSystem.spacing.xxs,
    marginRight: DesignSystem.spacing.xxs,
  },
  filterChipTextActive: {
    color: DesignSystem.colors.text.inverse,
  },
  filterChipCount: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.tertiary,
    backgroundColor: DesignSystem.colors.background.secondary,
    paddingHorizontal: DesignSystem.spacing.xs,
    paddingVertical: 2,
    borderRadius: DesignSystem.borderRadius.xs,
    fontSize: 11,
    minWidth: 20,
    textAlign: 'center',
  },
  filterChipCountActive: {
    color: DesignSystem.colors.text.inverse,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: DesignSystem.spacing.md,
  },
  selectAllText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    marginLeft: DesignSystem.spacing.xs,
  },
  countText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  batchActionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batchActionsText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.primary,
    marginLeft: DesignSystem.spacing.xs,
  },
  batchActionsPanel: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  batchActionButton: {
    marginRight: DesignSystem.spacing.sm,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  userRow: {
    marginHorizontal: DesignSystem.spacing.md,
  },
  userRowLast: {
    marginBottom: DesignSystem.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.xl,
  },
  emptyText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.tertiary,
    textAlign: 'center',
    marginTop: DesignSystem.spacing.md,
  },
});

export default UserDataPreviewTable;