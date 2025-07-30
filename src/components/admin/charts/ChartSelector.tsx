/**
 * 圖表類型選擇器元件
 * 用於切換不同的圖表顯示方式
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';

export type ChartType = 'line' | 'bar' | 'pie' | 'area';

interface ChartOption {
  id: ChartType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ChartSelectorProps {
  selectedType: ChartType;
  onSelectType: (type: ChartType) => void;
  availableTypes?: ChartType[];
}

const chartOptions: ChartOption[] = [
  { id: 'line', label: '線型圖', icon: 'analytics-outline' },
  { id: 'bar', label: '長條圖', icon: 'bar-chart-outline' },
  { id: 'pie', label: '圓餅圖', icon: 'pie-chart-outline' },
  { id: 'area', label: '區域圖', icon: 'trending-up-outline' },
];

export const ChartSelector: React.FC<ChartSelectorProps> = ({
  selectedType,
  onSelectType,
  availableTypes = ['line', 'bar', 'pie', 'area'],
}) => {
  const filteredOptions = chartOptions.filter(option => 
    availableTypes.includes(option.id)
  );

  return (
    <View style={styles.container}>
      {filteredOptions.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.option,
            selectedType === option.id && styles.optionActive,
          ]}
          onPress={() => onSelectType(option.id)}
        >
          <Icon
            name={option.icon}
            size={20}
            color={
              selectedType === option.id 
                ? DesignSystem.colors.primary 
                : DesignSystem.colors.text.secondary
            }
          />
          <Text style={[
            styles.optionText,
            selectedType === option.id && styles.optionTextActive,
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: 12,
    gap: 4,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  optionActive: {
    backgroundColor: DesignSystem.colors.background.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  optionTextActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
});