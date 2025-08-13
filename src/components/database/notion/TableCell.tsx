/**
 * 表格儲存格元件 - 處理單個儲存格的顯示和編輯
 */

import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import { ColumnConfig, CellPosition, CellState } from './types';
import { tableStyles, getCellStyles } from './styles/tableStyles';
import { NotionColors, NotionTypography } from './constants';
import { Icon } from '@/components/common/Icon';

interface TableCellProps {
  value: any;
  column: ColumnConfig;
  position: CellPosition;
  state: CellState;
  onCellClick?: (position: CellPosition) => void;
  onCellDoubleClick?: (position: CellPosition) => void;
  onCellMouseEnter?: (position: CellPosition) => void;
  onCellMouseLeave?: (position: CellPosition) => void;
  onCellEdit?: (value: any) => void;
}

export const TableCell: React.FC<TableCellProps> = memo(({
  value,
  column,
  position,
  state,
  onCellClick,
  onCellDoubleClick,
  onCellMouseEnter,
  onCellMouseLeave,
  onCellEdit }) => {
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout>();
  const lastClickTime = useRef(0);
  
  // Read-only mode - never enter editing state
  useEffect(() => {
    setIsEditing(false);
  }, []);
  
  // Handle click - read-only mode
  const handleClick = useCallback(() => {
    onCellClick?.(position);
  }, [position, onCellClick]);
  
  // Handle edit confirm
  const handleEditConfirm = useCallback(() => {
    const parsedValue = parseValueFromEdit(editValue, column.type);
    onCellEdit?.(parsedValue);
    setIsEditing(false);
  }, [editValue, column.type, onCellEdit]);
  
  // Handle edit cancel
  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
  }, []);
  
  // Handle key press in edit mode
  const handleKeyPress = useCallback((e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEditCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleEditConfirm();
    }
  }, [handleEditConfirm, handleEditCancel]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);
  
  // Render cell content based on type
  const renderCellContent = () => {
    // Read-only mode - no editing
    
    switch (column.type) {
      case 'checkbox':
        return (
          <View
            style={StyleSheet.flatten([
              tableStyles.checkbox,
              value && tableStyles.checkboxChecked,
              { opacity: 0.6, cursor: 'default' }
            ])}
          >
            {value && (
              <Icon name="checkmark" size={12} color="#FFFFFF" />
            )}
          </View>
        );
        
      case 'select':
        if (!value) return null;
        const option = column.options?.find(opt => opt.value === value);
        if (!option) return <Text style={tableStyles.cellText}>{value}</Text>;
        
        return (
          <View
            style={StyleSheet.flatten([
              tableStyles.selectTag,
              { backgroundColor: getTagColor(option.color || 'gray', 'bg') },
            ])}
          >
            <Text
              style={StyleSheet.flatten([
                tableStyles.selectTagText,
                { color: getTagColor(option.color || 'gray', 'text') },
              ])}
            >
              {option.label}
            </Text>
          </View>
        );
        
      case 'multiselect':
      case 'tags':
        if (!value || !Array.isArray(value)) return null;
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {value.map((tag, index) => (
              <View
                key={index}
                style={StyleSheet.flatten([
                  tableStyles.selectTag,
                  { 
                    backgroundColor: getTagColor('blue', 'bg'),
                    marginBottom: 2 },
                ])}
              >
                <Text
                  style={StyleSheet.flatten([
                    tableStyles.selectTagText,
                    { color: getTagColor('blue', 'text') },
                  ])}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        );
        
      case 'date':
        if (!value) return null;
        const date = new Date(value);
        return (
          <Text style={tableStyles.cellText}>
            {date.toLocaleDateString('zh-TW')}
          </Text>
        );
        
      case 'number':
        return (
          <Text style={tableStyles.cellText}>
            {value != null ? value.toLocaleString() : ''}
          </Text>
        );
        
      case 'url':
        if (!value) return null;
        return (
          <Text
            style={StyleSheet.flatten([tableStyles.cellText, { color: NotionColors.ui.link }])}
            numberOfLines={1}
          >
            {value}
          </Text>
        );
        
      default:
        return (
          <Text style={tableStyles.cellText} numberOfLines={1}>
            {value || ''}
          </Text>
        );
    }
  };
  
  return (
    <TouchableOpacity
      onPress={handleClick}
      {...(Platform.OS === 'web' ? {
        onMouseEnter: () => onCellMouseEnter?.(position),
        onMouseLeave: () => onCellMouseLeave?.(position) } : {})}
      activeOpacity={1}
      style={StyleSheet.flatten([
        ...getCellStyles(state),
        { width: column.width || 180 },
      ])}
    >
      {renderCellContent()}
    </TouchableOpacity>
  );
});

TableCell.displayName = 'TableCell';

// Helper functions
function formatValueForEdit(value: any, type: string): string {
  switch (type) {
    case 'number':
      return value != null ? value.toString() : '';
    case 'date':
      if (!value) return '';
      const date = new Date(value);
      return date.toISOString().split('T')[0];
    case 'tags':
    case 'multiselect':
      return Array.isArray(value) ? value.join(', ') : '';
    default:
      return value?.toString() || '';
  }
}

function parseValueFromEdit(value: string, type: string): any {
  switch (type) {
    case 'number':
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    case 'date':
      return value ? new Date(value).toISOString() : null;
    case 'tags':
    case 'multiselect':
      return value
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    default:
      return value;
  }
}

function getTagColor(color: string, type: 'bg' | 'text'): string {
  const colorMap: Record<string, { bg: string; text: string }> = {
    gray: { bg: NotionColors.background.gray, text: NotionColors.text.gray },
    brown: { bg: NotionColors.background.brown, text: NotionColors.text.brown },
    orange: { bg: NotionColors.background.orange, text: NotionColors.text.orange },
    yellow: { bg: NotionColors.background.yellow, text: NotionColors.text.yellow },
    green: { bg: NotionColors.background.green, text: NotionColors.text.green },
    blue: { bg: NotionColors.background.blue, text: NotionColors.text.blue },
    purple: { bg: NotionColors.background.purple, text: NotionColors.text.purple },
    pink: { bg: NotionColors.background.pink, text: NotionColors.text.pink },
    red: { bg: NotionColors.background.red, text: NotionColors.text.red } };
  
  const colors = colorMap[color] || colorMap.gray;
  return type === 'bg' ? colors.bg : colors.text;
}