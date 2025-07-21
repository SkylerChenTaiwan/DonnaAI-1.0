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
import { Ionicons } from '@expo/vector-icons';

export interface FilterCondition {
  key: string;
  label: string;
  value: string;
}

interface FilterBadgeProps {
  filters: FilterCondition[];
  onRemoveFilter: (key: string) => void;
  onClearAll?: () => void;
}

export const FilterBadge: React.FC<FilterBadgeProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
}) => {
  if (filters.length === 0) {
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
                {filter.label}: {filter.value}
              </Text>
              <TouchableOpacity
                onPress={() => onRemoveFilter(filter.key)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={16} color="#8E8E93" />
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
    borderBottomColor: '#E5E5EA',
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
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    gap: 4,
    maxWidth: 150,
  },
  filterText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});