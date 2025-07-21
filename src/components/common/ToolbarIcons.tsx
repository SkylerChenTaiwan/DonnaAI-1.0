/**
 * 工具列圖示元件
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ToolbarIconsProps {
  showFilter?: boolean;
  showSort?: boolean;
  showMultiSelect?: boolean;
  showColumns?: boolean;
  multiSelectMode?: boolean;
  onFilterPress?: () => void;
  onSortPress?: () => void;
  onMultiSelectPress?: () => void;
  onColumnsPress?: () => void;
  style?: ViewStyle;
}

export const ToolbarIcons: React.FC<ToolbarIconsProps> = ({
  showFilter = true,
  showSort = true,
  showMultiSelect = true,
  showColumns = true,
  multiSelectMode = false,
  onFilterPress,
  onSortPress,
  onMultiSelectPress,
  onColumnsPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {showFilter && (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onFilterPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="filter-button"
        >
          <Ionicons name="filter" size={20} color="#6B6B6B" />
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
          <Ionicons name="swap-vertical" size={20} color="#6B6B6B" />
        </TouchableOpacity>
      )}
      {showMultiSelect && (
        <TouchableOpacity
          style={[
            styles.iconButton,
            multiSelectMode && styles.iconButtonActive,
          ]}
          onPress={onMultiSelectPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="multi-select-button"
        >
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={multiSelectMode ? "#FF5C00" : "#6B6B6B"} 
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
          <Ionicons name="list" size={20} color="#6B6B6B" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
  },
  iconButtonActive: {
    backgroundColor: 'rgba(255, 92, 0, 0.1)',
  },
});