/**
 * 行內編輯模式切換元件
 * 在標準檢視和編輯模式之間切換
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { DataTable } from '@/components/common/DataTable';
import { EditableDataTable } from '@/components/common/EditableDataTable';
import { TableProps, TableColumn } from '@/types/table';
import { colors } from '@/theme/colors';

// 擴展 TableColumn 以支援編輯配置
interface EditableTableColumn extends TableColumn {
  editable?: boolean;
  validator?: (value: any) => string | null;
  formatter?: (value: any) => any;
  inputType?: 'text' | 'number' | 'email' | 'phone' | 'multiline';
}

interface InlineEditToggleProps extends Omit<TableProps, 'columns'> {
  columns: EditableTableColumn[];
  onSave?: (changes: Array<{ id: string; field: string; value: any }>) => Promise<void>;
  onRowSave?: (id: string, changes: Record<string, any>) => Promise<void>;
  saveMode?: 'batch' | 'realtime';
  allowEdit?: boolean;
  editPermissionCheck?: (item: any) => boolean;
}

export const InlineEditToggle: React.FC<InlineEditToggleProps> = ({
  columns,
  onSave,
  onRowSave,
  saveMode = 'batch',
  allowEdit = true,
  editPermissionCheck,
  ...tableProps
}) => {
  const [isEditMode, setIsEditMode] = useState(false);

  // 切換編輯模式
  const toggleEditMode = () => {
    if (!allowEdit) {
      Alert.alert('無權限', '您沒有編輯資料的權限');
      return;
    }

    setIsEditMode(prev => {
      if (prev) {
        // 從編輯模式切回檢視模式，確認是否有未儲存變更
        Alert.alert(
          '切換模式',
          '確定要退出編輯模式嗎？未儲存的變更將會遺失。',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '確定', 
              onPress: () => setIsEditMode(false),
              style: 'destructive' 
            },
          ]
        );
        return prev;
      } else {
        return true;
      }
    });
  };

  // 建立可編輯的欄位配置
  const editableColumns: EditableTableColumn[] = columns.map(col => ({
    ...col,
    // 預設所有文字欄位都可編輯（除非明確設定為 false）
    editable: col.editable !== false && col.key !== 'id',
    // 基本驗證器
    validator: col.validator || ((value: any) => {
      if (col.key === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : '請輸入有效的電子郵件格式';
      }
      if (col.key === 'phone' && value) {
        const phoneRegex = /^[\d\s\-+()]{8 }$/;
        return phoneRegex.test(value) ? null : '請輸入有效的電話號碼';
      }
      return null;
    }),
    // 基本格式化器
    formatter: col.formatter || ((value: any) => {
      if (col.key === 'email' && typeof value === 'string') {
        return value.trim().toLowerCase();
      }
      if (col.key === 'phone' && typeof value === 'string') {
        return value.replace(/[^\d+\-\s()]/g, '');
      }
      return value;
    }),
    // 輸入類型推斷
    inputType: (() => {
      if (col.key.includes('email')) return 'email';
      if (col.key.includes('phone')) return 'phone';
      if (col.key.includes('number') || col.key.includes('count')) return 'number';
      if (col.key.includes('description') || col.key.includes('note')) return 'multiline';
      return 'text';
    })() as 'text' | 'number' | 'email' | 'phone' | 'multiline' }));

  return (
    <View style={styles.container}>
      {/* 編輯模式切換按鈕 */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={StyleSheet.flatten([
            styles.editToggleButton,
            isEditMode && styles.editToggleButtonActive,
          ])}
          onPress={toggleEditMode}
          activeOpacity={0.7}
        >
          <Icon
            name={isEditMode ? 'create' : 'create-outline'}
            size={20}
            color={isEditMode ? colors.orange : '#1A1A1A'}
          />
        </TouchableOpacity>
      </View>

      {/* 表格元件 */}
      {isEditMode ? (
        <EditableDataTable
          {...tableProps}
          columns={editableColumns}
          onSave={onSave}
          onRowSave={onRowSave}
          saveMode={saveMode}
          showSaveButton={true}
          readOnly={false}
        />
      ) : (
        <DataTable
          {...tableProps}
          columns={columns}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC' },
  editToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    gap: 4 },
  editToggleButtonActive: {
    backgroundColor: colors.orangeBackground } });