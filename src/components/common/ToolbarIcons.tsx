/**
 * 工具列圖示元件
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle } from 'react-native';
import { Icon } from '@/components/common/Icon';

interface ToolbarIconsProps {
  showFilter?: boolean;
  showSort?: boolean;
  showMultiSelect?: boolean;
  showColumns?: boolean;
  showModeToggle?: boolean;
  multiSelectMode?: boolean;
  currentMode?: 'business' | 'manager';
  onFilterPress?: () => void;
  onSortPress?: () => void;
  onMultiSelectPress?: () => void;
  onColumnsPress?: () => void;
  onModeToggle?: () => void;
  style?: ViewStyle;
}

export const ToolbarIcons: React.FC<ToolbarIconsProps> = ({
  showFilter = true,
  showSort = true,
  showMultiSelect = true,
  showColumns = true,
  showModeToggle = false,
  multiSelectMode = false,
  currentMode = 'business',
  onFilterPress,
  onSortPress,
  onMultiSelectPress,
  onColumnsPress,
  onModeToggle,
  style }) => {
  return (
    <View style={StyleSheet.flatten([styles.container, style])}>
      {showFilter && (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onFilterPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="filter-button"
        >
          <Icon name="filter" size={20} color="#6B6B6B" />
        </TouchableOpacity>
      )}
      {showSort && (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onSortPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="sort-button"
        >
          <Icon name="swap-vertical" size={20} color="#6B6B6B" />
        </TouchableOpacity>
      )}
      {showMultiSelect && (
        <TouchableOpacity
          style={StyleSheet.flatten([
            styles.iconButton,
            multiSelectMode && styles.iconButtonActive,
          ])}
          onPress={onMultiSelectPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="multi-select-button"
        >
          <Icon 
            name="checkmark-circle" 
            size={20} 
            color={multiSelectMode ? "#1A1A1A" : "#6B6B6B"} 
          />
        </TouchableOpacity>
      )}
      {showColumns && (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onColumnsPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="columns-button"
        >
          <Icon name="list" size={20} color="#6B6B6B" />
        </TouchableOpacity>
      )}
      {showModeToggle && (
        <TouchableOpacity
          style={StyleSheet.flatten([
            styles.iconButton,
            currentMode === 'manager' && styles.iconButtonActive,
          ])}
          onPress={onModeToggle}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="mode-toggle-button"
        >
          <Icon 
            name={currentMode === 'business' ? 'briefcase' : 'people'} 
            size={20} 
            color={currentMode === 'manager' ? "#1A1A1A" : "#6B6B6B"} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 },
  iconButton: {
    padding: 8,
    borderRadius: 6 },
  iconButtonActive: {
    backgroundColor: 'rgba(255, 92, 0, 0.1)' } });