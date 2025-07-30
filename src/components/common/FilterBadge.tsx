/**
 * 篩選條件顯示元件
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Icon } from '@/components/common/Icon';

const getOperatorLabel = (operator?: string): string => {
  switch (operator) {
    case 'equals':
      return '等於';
    case 'contains':
      return '包含';
    case 'startsWith':
      return '開頭是';
    case 'endsWith':
      return '結尾是';
    default:
      return '包含';
  }
};

export interface FilterCondition {
  key: string;
  label?: string;
  value: string;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith';
}

interface FilterBadgeProps {
  filters: FilterCondition[];
  onRemoveFilter: (key: string) => void;
  onClearAll?: () => void;
}

export const FilterBadge: React.FC<FilterBadgeProps> = ({
  filters = [],
  onRemoveFilter,
  onClearAll,
}) => {
  if (!filters || filters.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.filtersContainer}>
          {filters.map((filter) => (
            <View key={filter.key} style={styles.filterItem}>
              <Text style={styles.filterText} numberOfLines={1}>
                {filter.label || filter.key} {getOperatorLabel(filter.operator)} {filter.value}
              </Text>
              <TouchableOpacity
                onPress={() => onRemoveFilter(filter.key)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close-circle" size={16} color="#7A7A7A" />
              </TouchableOpacity>
            </View>
          ))}
          {onClearAll && filters.length > 1 && (
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={onClearAll}
              activeOpacity={0.7}
            >
              <Text style={styles.clearAllText}>清除全部</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
  },
  scrollView: {
    flexGrow: 0,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    gap: 4,
    maxWidth: 150,
  },
  filterText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#A94438',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F7F6F3',
  },
});