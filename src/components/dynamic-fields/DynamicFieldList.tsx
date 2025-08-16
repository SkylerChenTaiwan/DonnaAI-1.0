/**
 * DynamicFieldList - 動態欄位列表元件
 * 支援虛擬滾動、即時搜尋、批次選擇和跨平台適配
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Platform, ListRenderItem, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  AdaptiveView,
  AdaptiveText,
  AdaptiveInput,
  AdaptiveButton,
  AdaptiveCheckbox,
  AdaptiveSelect,
  type AdaptiveViewProps,
} from '@/components/adaptive';
import { withAlpha } from '@/utils/colorUtils';
import { DynamicFieldConfig, FieldDataType } from '@/types/dynamic-field-mapping';

interface DynamicFieldListProps {
  fields: DynamicFieldConfig[];
  onFieldUpdate: (field: DynamicFieldConfig) => void;
  onBatchSelect: (fieldIds: string[]) => void;
  onFieldDelete?: (fieldId: string) => void;
  onFieldSelect?: (field: DynamicFieldConfig) => void;
  loading?: boolean;
  searchable?: boolean;
  selectable?: boolean;
  virtualScrolling?: boolean;
  viewMode?: 'list' | 'grid';
  style?: AdaptiveViewProps['style'];
}

interface FieldListItem extends DynamicFieldConfig {
  isSelected: boolean;
}

interface FilterOptions {
  dataType: FieldDataType | 'all';
  status: 'all' | 'active' | 'inactive' | 'system';
  searchTerm: string;
}

const DATA_TYPE_LABELS: Record<FieldDataType, string> = {
  text: '文字',
  number: '數字',
  date: '日期',
  datetime: '日期時間',
  email: '電子郵件',
  phone: '電話',
  url: '網址',
  boolean: '布林值',
  json: 'JSON',
  array: '陣列',
  currency: '貨幣',
  percentage: '百分比',
  select: '單選',
  multiselect: '多選',
  longtext: '長文字',
  address: '地址',
};

export const DynamicFieldList: React.FC<DynamicFieldListProps> = ({
  fields,
  onFieldUpdate,
  onBatchSelect,
  onFieldDelete,
  onFieldSelect,
  loading = false,
  searchable = true,
  selectable = true,
  virtualScrolling = true,
  viewMode = 'list',
  style,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>({
    dataType: 'all',
    status: 'all',
    searchTerm: '',
  });
  const [showBatchActions, setShowBatchActions] = useState(false);

  const flashListRef = useRef<FlashList<FieldListItem>>(null);

  /**
   * 過濾和搜尋欄位
   */
  const filteredFields = useMemo(() => {
    let filtered = [...fields];

    // 文字搜尋
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(field =>
        field.displayName.toLowerCase().includes(searchLower) ||
        field.fieldKey.toLowerCase().includes(searchLower) ||
        field.description?.toLowerCase().includes(searchLower)
      );
    }

    // 資料類型篩選
    if (filters.dataType !== 'all') {
      filtered = filtered.filter(field => field.dataType === filters.dataType);
    }

    // 狀態篩選
    if (filters.status !== 'all') {
      switch (filters.status) {
        case 'active':
          filtered = filtered.filter(field => field.isActive);
          break;
        case 'inactive':
          filtered = filtered.filter(field => !field.isActive);
          break;
        case 'system':
          filtered = filtered.filter(field => field.isSystem);
          break;
      }
    }

    // 加入選擇狀態
    return filtered.map(field => ({
      ...field,
      isSelected: selectedIds.has(field.fieldId),
    }));
  }, [fields, filters, selectedIds]);

  /**
   * 處理單個欄位選擇
   */
  const handleFieldSelect = useCallback((fieldId: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(fieldId);
      } else {
        newSet.delete(fieldId);
      }
      
      // 通知父元件
      onBatchSelect(Array.from(newSet));
      
      return newSet;
    });
  }, [onBatchSelect]);

  /**
   * 全選/反選
   */
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const allIds = new Set(filteredFields.map(field => field.fieldId));
      setSelectedIds(allIds);
      onBatchSelect(Array.from(allIds));
    } else {
      setSelectedIds(new Set());
      onBatchSelect([]);
    }
  }, [filteredFields, onBatchSelect]);

  /**
   * 處理欄位類型變更
   */
  const handleFieldTypeChange = useCallback((fieldId: string, newType: FieldDataType) => {
    const field = fields.find(f => f.fieldId === fieldId);
    if (field) {
      const updatedField = { ...field, dataType: newType };
      onFieldUpdate(updatedField);
    }
  }, [fields, onFieldUpdate]);

  /**
   * 處理欄位啟用/停用
   */
  const handleFieldToggle = useCallback((fieldId: string, isActive: boolean) => {
    const field = fields.find(f => f.fieldId === fieldId);
    if (field) {
      const updatedField = { ...field, isActive };
      onFieldUpdate(updatedField);
    }
  }, [fields, onFieldUpdate]);

  /**
   * 處理欄位刪除
   */
  const handleFieldDelete = useCallback((fieldId: string) => {
    const field = fields.find(f => f.fieldId === fieldId);
    if (!field) return;

    if (field.isSystem) {
      Alert.alert('無法刪除', '系統欄位無法刪除');
      return;
    }

    Alert.alert(
      '確認刪除',
      `確定要刪除欄位 "${field.displayName}" 嗎？此操作無法復原。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: () => {
            onFieldDelete?.(fieldId);
            // 同時從選擇中移除
            setSelectedIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(fieldId);
              return newSet;
            });
          },
        },
      ]
    );
  }, [fields, onFieldDelete]);

  /**
   * 批次操作
   */
  const handleBatchOperation = useCallback((operation: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.size === 0) {
      Alert.alert('提示', '請先選擇要操作的欄位');
      return;
    }

    const selectedFields = fields.filter(field => selectedIds.has(field.fieldId));
    
    switch (operation) {
      case 'activate':
        selectedFields.forEach(field => {
          onFieldUpdate({ ...field, isActive: true });
        });
        break;
      case 'deactivate':
        selectedFields.forEach(field => {
          onFieldUpdate({ ...field, isActive: false });
        });
        break;
      case 'delete':
        const systemFields = selectedFields.filter(field => field.isSystem);
        if (systemFields.length > 0) {
          Alert.alert('無法刪除', '選擇中包含系統欄位，無法刪除');
          return;
        }
        
        Alert.alert(
          '確認批次刪除',
          `確定要刪除選中的 ${selectedIds.size} 個欄位嗎？此操作無法復原。`,
          [
            { text: '取消', style: 'cancel' },
            {
              text: '刪除',
              style: 'destructive',
              onPress: () => {
                selectedFields.forEach(field => {
                  onFieldDelete?.(field.fieldId);
                });
                setSelectedIds(new Set());
              },
            },
          ]
        );
        break;
    }
  }, [selectedIds, fields, onFieldUpdate, onFieldDelete]);

  /**
   * 渲染單個欄位項目
   */
  const renderFieldItem: ListRenderItem<FieldListItem> = useCallback(({ item }) => {
    if (Platform.OS === 'web') {
      // Web 表格行視圖
      return (
        <AdaptiveView
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#E3E1DC',
            backgroundColor: item.isSelected ? withAlpha('#007AFF', 0.1) : '#FFFFFF',
          }}
        >
          {/* 選擇框 */}
          {selectable && (
            <AdaptiveCheckbox
              value={item.isSelected}
              onValueChange={(selected) => handleFieldSelect(item.fieldId, selected)}
              style={{ marginRight: 12 }}
            />
          )}

          {/* 欄位名稱 */}
          <AdaptiveView style={{ flex: 2, marginRight: 16 }}>
            <AdaptiveText style={{ fontWeight: '600', color: '#1C1C1E' }}>
              {item.displayName}
            </AdaptiveText>
            <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>
              {item.fieldKey}
            </AdaptiveText>
          </AdaptiveView>

          {/* 資料類型 */}
          <AdaptiveView style={{ flex: 1, marginRight: 16 }}>
            <AdaptiveSelect
              value={item.dataType}
              onValueChange={(value) => handleFieldTypeChange(item.fieldId, value as FieldDataType)}
              options={Object.entries(DATA_TYPE_LABELS).map(([key, label]) => ({
                label,
                value: key,
              }))}
              style={{ minWidth: 120 }}
              disabled={item.isSystem}
            />
          </AdaptiveView>

          {/* 狀態 */}
          <AdaptiveView style={{ flex: 1, marginRight: 16, alignItems: 'center' }}>
            <AdaptiveCheckbox
              value={item.isActive}
              onValueChange={(isActive) => handleFieldToggle(item.fieldId, isActive)}
              disabled={item.isSystem}
            />
          </AdaptiveView>

          {/* 系統標記 */}
          <AdaptiveView style={{ flex: 1, marginRight: 16, alignItems: 'center' }}>
            {item.isSystem && (
              <AdaptiveText style={{ fontSize: 12, color: '#FF9500', fontWeight: '600' }}>
                系統
              </AdaptiveText>
            )}
          </AdaptiveView>

          {/* 操作按鈕 */}
          <AdaptiveView style={{ flexDirection: 'row', gap: 8 }}>
            {!item.isSystem && onFieldDelete && (
              <AdaptiveButton
                onPress={() => handleFieldDelete(item.fieldId)}
                style={{
                  backgroundColor: '#FF3B30',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 4,
                }}
              >
                <AdaptiveText style={{ color: '#FFFFFF', fontSize: 12 }}>
                  刪除
                </AdaptiveText>
              </AdaptiveButton>
            )}
          </AdaptiveView>
        </AdaptiveView>
      );
    } else {
      // Mobile 卡片視圖
      return (
        <AdaptiveView
          style={{
            backgroundColor: item.isSelected ? withAlpha('#007AFF', 0.1) : '#FFFFFF',
            marginHorizontal: 16,
            marginVertical: 6,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: item.isSelected ? '#007AFF' : '#E3E1DC',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          {/* 標題行 */}
          <AdaptiveView style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            {selectable && (
              <AdaptiveCheckbox
                value={item.isSelected}
                onValueChange={(selected) => handleFieldSelect(item.fieldId, selected)}
                style={{ marginRight: 12 }}
              />
            )}
            <AdaptiveView style={{ flex: 1 }}>
              <AdaptiveText style={{ fontWeight: '600', fontSize: 16, color: '#1C1C1E' }}>
                {item.displayName}
              </AdaptiveText>
              <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>
                {item.fieldKey}
              </AdaptiveText>
            </AdaptiveView>
            {item.isSystem && (
              <AdaptiveText style={{ fontSize: 11, color: '#FF9500', fontWeight: '600' }}>
                系統欄位
              </AdaptiveText>
            )}
          </AdaptiveView>

          {/* 詳情 */}
          <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <AdaptiveView style={{ flex: 1 }}>
              <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>
                資料類型
              </AdaptiveText>
              <AdaptiveText style={{ fontWeight: '500', color: '#1C1C1E' }}>
                {DATA_TYPE_LABELS[item.dataType]}
              </AdaptiveText>
            </AdaptiveView>
            <AdaptiveView style={{ alignItems: 'center' }}>
              <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>
                狀態
              </AdaptiveText>
              <AdaptiveText 
                style={{ 
                  fontWeight: '500', 
                  color: item.isActive ? '#34C759' : '#8E8E93' 
                }}
              >
                {item.isActive ? '啟用' : '停用'}
              </AdaptiveText>
            </AdaptiveView>
          </AdaptiveView>

          {/* 描述 */}
          {item.description && (
            <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginBottom: 12 }}>
              {item.description}
            </AdaptiveText>
          )}

          {/* 操作按鈕 */}
          <AdaptiveView style={{ flexDirection: 'row', gap: 8 }}>
            <AdaptiveButton
              onPress={() => handleFieldToggle(item.fieldId, !item.isActive)}
              disabled={item.isSystem}
              style={{
                backgroundColor: item.isActive ? '#FF9500' : '#34C759',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 6,
                flex: 1,
              }}
            >
              <AdaptiveText style={{ color: '#FFFFFF', fontSize: 12, textAlign: 'center' }}>
                {item.isActive ? '停用' : '啟用'}
              </AdaptiveText>
            </AdaptiveButton>
            
            {!item.isSystem && onFieldDelete && (
              <AdaptiveButton
                onPress={() => handleFieldDelete(item.fieldId)}
                style={{
                  backgroundColor: '#FF3B30',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 6,
                  flex: 1,
                }}
              >
                <AdaptiveText style={{ color: '#FFFFFF', fontSize: 12, textAlign: 'center' }}>
                  刪除
                </AdaptiveText>
              </AdaptiveButton>
            )}
          </AdaptiveView>
        </AdaptiveView>
      );
    }
  }, [selectable, handleFieldSelect, handleFieldTypeChange, handleFieldToggle, handleFieldDelete, onFieldDelete]);

  /**
   * 渲染表格標題（僅 Web）
   */
  const renderTableHeader = () => {
    if (Platform.OS !== 'web') return null;

    return (
      <AdaptiveView
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          backgroundColor: '#F2F2F7',
          borderBottomWidth: 2,
          borderBottomColor: '#E3E1DC',
        }}
      >
        {selectable && (
          <AdaptiveCheckbox
            value={selectedIds.size > 0 && selectedIds.size === filteredFields.length}
            onValueChange={handleSelectAll}
            style={{ marginRight: 12 }}
          />
        )}
        <AdaptiveText style={{ flex: 2, fontWeight: '600', color: '#1C1C1E', marginRight: 16 }}>
          欄位名稱
        </AdaptiveText>
        <AdaptiveText style={{ flex: 1, fontWeight: '600', color: '#1C1C1E', marginRight: 16 }}>
          資料類型
        </AdaptiveText>
        <AdaptiveText style={{ flex: 1, fontWeight: '600', color: '#1C1C1E', marginRight: 16, textAlign: 'center' }}>
          啟用
        </AdaptiveText>
        <AdaptiveText style={{ flex: 1, fontWeight: '600', color: '#1C1C1E', marginRight: 16, textAlign: 'center' }}>
          系統
        </AdaptiveText>
        <AdaptiveText style={{ fontWeight: '600', color: '#1C1C1E' }}>
          操作
        </AdaptiveText>
      </AdaptiveView>
    );
  };

  return (
    <AdaptiveView style={[{ flex: 1 }, style]}>
      {/* 搜尋和篩選 */}
      {searchable && (
        <AdaptiveView style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E3E1DC' }}>
          <AdaptiveInput
            value={filters.searchTerm}
            onChangeText={(text) => setFilters(prev => ({ ...prev, searchTerm: text }))}
            placeholder="搜尋欄位名稱、鍵值或描述..."
            style={{
              marginBottom: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: '#E3E1DC',
              borderRadius: 8,
            }}
          />
          
          <AdaptiveView style={{ flexDirection: 'row', gap: 12 }}>
            <AdaptiveSelect
              value={filters.dataType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dataType: value as FieldDataType | 'all' }))}
              options={[
                { label: '所有類型', value: 'all' },
                ...Object.entries(DATA_TYPE_LABELS).map(([key, label]) => ({
                  label,
                  value: key,
                }))
              ]}
              style={{ flex: 1 }}
            />
            
            <AdaptiveSelect
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as FilterOptions['status'] }))}
              options={[
                { label: '所有狀態', value: 'all' },
                { label: '已啟用', value: 'active' },
                { label: '已停用', value: 'inactive' },
                { label: '系統欄位', value: 'system' },
              ]}
              style={{ flex: 1 }}
            />
          </AdaptiveView>
        </AdaptiveView>
      )}

      {/* 批次操作欄 */}
      {selectable && selectedIds.size > 0 && (
        <AdaptiveView style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          backgroundColor: withAlpha('#007AFF', 0.1),
          borderBottomWidth: 1,
          borderBottomColor: '#007AFF',
        }}>
          <AdaptiveText style={{ flex: 1, fontWeight: '600', color: '#007AFF' }}>
            已選擇 {selectedIds.size} 個欄位
          </AdaptiveText>
          
          <AdaptiveView style={{ flexDirection: 'row', gap: 8 }}>
            <AdaptiveButton
              onPress={() => handleBatchOperation('activate')}
              style={{ backgroundColor: '#34C759', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 }}
            >
              <AdaptiveText style={{ color: '#FFFFFF', fontSize: 12 }}>啟用</AdaptiveText>
            </AdaptiveButton>
            
            <AdaptiveButton
              onPress={() => handleBatchOperation('deactivate')}
              style={{ backgroundColor: '#FF9500', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 }}
            >
              <AdaptiveText style={{ color: '#FFFFFF', fontSize: 12 }}>停用</AdaptiveText>
            </AdaptiveButton>
            
            {onFieldDelete && (
              <AdaptiveButton
                onPress={() => handleBatchOperation('delete')}
                style={{ backgroundColor: '#FF3B30', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 }}
              >
                <AdaptiveText style={{ color: '#FFFFFF', fontSize: 12 }}>刪除</AdaptiveText>
              </AdaptiveButton>
            )}
          </AdaptiveView>
        </AdaptiveView>
      )}

      {/* 表格標題（Web only） */}
      {renderTableHeader()}

      {/* 欄位列表 */}
      {loading ? (
        <AdaptiveView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <AdaptiveText style={{ color: '#8E8E93' }}>載入中...</AdaptiveText>
        </AdaptiveView>
      ) : filteredFields.length === 0 ? (
        <AdaptiveView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <AdaptiveText style={{ fontSize: 16, color: '#8E8E93', textAlign: 'center' }}>
            {filters.searchTerm || filters.dataType !== 'all' || filters.status !== 'all'
              ? '沒有符合條件的欄位'
              : '尚未建立任何欄位'}
          </AdaptiveText>
        </AdaptiveView>
      ) : (
        <FlashList
          ref={flashListRef}
          data={filteredFields}
          renderItem={renderFieldItem}
          keyExtractor={(item) => item.fieldId}
          estimatedItemSize={Platform.OS === 'web' ? 60 : 160}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={Platform.OS !== 'web' ? { paddingBottom: 16 } : undefined}
        />
      )}

      {/* 統計資訊 */}
      <AdaptiveView style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#E3E1DC',
        backgroundColor: '#F2F2F7',
      }}>
        <AdaptiveText style={{ fontSize: 12, color: '#8E8E93' }}>
          顯示 {filteredFields.length} / {fields.length} 個欄位
        </AdaptiveText>
        
        {selectable && selectedIds.size > 0 && (
          <AdaptiveButton
            onPress={() => setSelectedIds(new Set())}
            style={{ padding: 4 }}
          >
            <AdaptiveText style={{ fontSize: 12, color: '#007AFF' }}>
              清除選擇
            </AdaptiveText>
          </AdaptiveButton>
        )}
      </AdaptiveView>
    </AdaptiveView>
  );
};

export default DynamicFieldList;