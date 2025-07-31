/**
 * Notion 風格資料庫工具列組件
 * 整合搜尋、視圖切換、篩選、排序等功能
 */

import React from 'react';
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
  onFilter: () => void;
  onSort: () => void;
  onViewChange?: () => void;
  onSearch?: () => void;
  currentView?: 'table' | 'board' | 'calendar' | 'list' | 'gallery';
  hasActiveFilters?: boolean;
  hasActiveSort?: boolean;
}

export const DatabaseToolbar: React.FC<ToolbarProps> = ({ 
  onFilter, 
  onSort, 
  onViewChange,
  onSearch,
  currentView = 'table',
  hasActiveFilters = false,
  hasActiveSort = false,
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
          style={[
            styles.toolButton,
            hasActiveFilters && styles.activeToolButton
          ]} 
          onPress={onFilter}
          activeOpacity={0.7}
        >
          <Icon 
            name="filter" 
            size={16} 
            color={hasActiveFilters ? "#FF6B6B" : "#666"} 
          />
          <Text style={[
            styles.toolbarText,
            hasActiveFilters && styles.activeToolbarText
          ]}>
            篩選
          </Text>
          {hasActiveFilters && (
            <View style={styles.activeDot} />
          )}
        </TouchableOpacity>

        {/* 排序 */}
        <TouchableOpacity 
          style={[
            styles.toolButton,
            hasActiveSort && styles.activeToolButton
          ]} 
          onPress={onSort}
          activeOpacity={0.7}
        >
          <Icon 
            name="swap-vertical" 
            size={16} 
            color={hasActiveSort ? "#FF6B6B" : "#666"} 
          />
          <Text style={[
            styles.toolbarText,
            hasActiveSort && styles.activeToolbarText
          ]}>
            排序
          </Text>
        </TouchableOpacity>

        {/* 更多選項 */}
        <TouchableOpacity 
          style={styles.toolButton}
          activeOpacity={0.7}
        >
          <Icon name="ellipsis-horizontal" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsive({ mobile: 8, tablet: 12, desktop: 16 }),
    paddingVertical: responsive({ mobile: 6, tablet: 8, desktop: 10 }),
    backgroundColor: '#fff',
    minHeight: responsive({ mobile: 40, tablet: 44, desktop: 48 }),
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeec',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive({ mobile: 2, tablet: 4, desktop: 6 }),
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive({ mobile: 4, tablet: 6, desktop: 8 }),
    paddingHorizontal: responsive({ mobile: 10, tablet: 12, desktop: 14 }),
    paddingVertical: responsive({ mobile: 6, tablet: 7, desktop: 8 }),
    borderRadius: responsive({ mobile: 4, tablet: 5, desktop: 6 }),
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
    gap: responsive({ mobile: 4, tablet: 5, desktop: 6 }),
    paddingHorizontal: responsive({ mobile: 8, tablet: 10, desktop: 12 }),
    paddingVertical: responsive({ mobile: 5, tablet: 6, desktop: 7 }),
    borderRadius: responsive({ mobile: 3, tablet: 4, desktop: 5 }),
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
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  toolbarText: {
    fontSize: responsive({ mobile: 13, tablet: 14, desktop: 15 }),
    color: '#666',
    fontWeight: '500',
  },
  activeToolbarText: {
    color: '#FF6B6B',
  },
  activeDot: {
    position: 'absolute',
    top: responsive({ mobile: 4, tablet: 5, desktop: 6 }),
    right: responsive({ mobile: 4, tablet: 5, desktop: 6 }),
    width: responsive({ mobile: 4, tablet: 5, desktop: 6 }),
    height: responsive({ mobile: 4, tablet: 5, desktop: 6 }),
    borderRadius: responsive({ mobile: 2, tablet: 2.5, desktop: 3 }),
    backgroundColor: '#FF6B6B',
  },
});