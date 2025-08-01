/**
 * Notion 風格資料庫工具列組件
 * 整合搜尋、視圖切換、篩選、排序等功能
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { responsive, webOnly } from '@/styles/web';

interface ToolbarProps {
  onFilter: (ref: React.RefObject<any>) => void;
  onSort: (ref: React.RefObject<any>) => void;
  onViewChange?: () => void;
  onSearch?: () => void;
  onMultiSelect?: () => void;
  onAddColumn?: () => void;
  currentView?: 'table' | 'board' | 'calendar' | 'list' | 'gallery';
  hasActiveFilters?: boolean;
  hasActiveSort?: boolean;
  multiSelectMode?: boolean;
}

export const DatabaseToolbar: React.FC<ToolbarProps> = ({ 
  onFilter, 
  onSort, 
  onViewChange,
  onSearch,
  onMultiSelect,
  onAddColumn,
  currentView = 'table',
  hasActiveFilters = false,
  hasActiveSort = false,
  multiSelectMode = false,
}) => {
  // 視圖類型對應的圖標和文字
  const viewConfig = {
    table: { icon: 'grid-outline', label: '表格' },
    board: { icon: 'albums-outline', label: '看板' },
    calendar: { icon: 'calendar-outline', label: '日曆' },
    list: { icon: 'list-outline', label: '列表' },
    gallery: { icon: 'images-outline', label: '圖庫' },
  };

  const currentViewConfig = viewConfig[currentView];
  
  // 建立按鈕的 refs
  const filterButtonRef = useRef<any>(null);
  const sortButtonRef = useRef<any>(null);

  return (
    <View style={styles.toolbar}>
      <View style={styles.toolbarLeft}>
        {/* 視圖切換 */}
        {onViewChange && (
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={onViewChange}
            activeOpacity={0.7}
          >
            <Icon name={currentViewConfig.icon} size={16} color="#666" />
            <Text style={styles.toolbarText}>{currentViewConfig.label}</Text>
            <Icon name="chevron-down" size={12} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.toolbarRight}>
        {/* 搜尋 */}
        {onSearch && (
          <TouchableOpacity 
            style={styles.toolButton} 
            onPress={onSearch}
            activeOpacity={0.7}
          >
            <Icon name="search" size={16} color="#666" />
            <Text style={styles.toolbarText}>搜尋</Text>
          </TouchableOpacity>
        )}

        {/* 篩選 */}
        <TouchableOpacity 
          ref={filterButtonRef}
          style={[
            styles.toolButton,
            hasActiveFilters && styles.activeToolButton
          ]} 
          onPress={() => onFilter(filterButtonRef)}
          activeOpacity={0.7}
        >
          <Icon 
            name="filter" 
            size={16} 
            color={hasActiveFilters ? "#37352f" : "#666"} 
          />
          <Text style={[
            styles.toolbarText,
            hasActiveFilters && styles.activeToolbarText
          ]}>
            篩選
          </Text>
        </TouchableOpacity>

        {/* 排序 */}
        <TouchableOpacity 
          ref={sortButtonRef}
          style={[
            styles.toolButton,
            hasActiveSort && styles.activeToolButton
          ]} 
          onPress={() => onSort(sortButtonRef)}
          activeOpacity={0.7}
        >
          <Icon 
            name="swap-vertical" 
            size={16} 
            color={hasActiveSort ? "#37352f" : "#666"} 
          />
          <Text style={[
            styles.toolbarText,
            hasActiveSort && styles.activeToolbarText
          ]}>
            排序
          </Text>
        </TouchableOpacity>

        {/* 多選 */}
        {onMultiSelect && (
          <TouchableOpacity 
            style={[
              styles.toolButton,
              multiSelectMode && styles.activeToolButton
            ]} 
            onPress={onMultiSelect}
            activeOpacity={0.7}
          >
            <Icon 
              name="checkbox-outline" 
              size={16} 
              color={multiSelectMode ? "#37352f" : "#666"} 
            />
            <Text style={[
              styles.toolbarText,
              multiSelectMode && styles.activeToolbarText
            ]}>
              多選
            </Text>
          </TouchableOpacity>
        )}

        {/* 新增屬性 */}
        {onAddColumn && (
          <TouchableOpacity 
            style={styles.toolButton} 
            onPress={onAddColumn}
            activeOpacity={0.7}
          >
            <Icon 
              name="add" 
              size={16} 
              color="#666" 
            />
            <Text style={styles.toolbarText}>
              新增屬性
            </Text>
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f9f8f7',
    ...webOnly({
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#eeeeec',
      },
    }),
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    position: 'relative',
    ...webOnly({
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#f7f7f7',
      },
    }),
  },
  activeToolButton: {
    backgroundColor: '#f0f0f0',
  },
  toolbarText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  activeToolbarText: {
    color: '#37352f',
    fontWeight: '600',
  },
});