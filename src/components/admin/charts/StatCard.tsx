/**
 * 可重用的統計卡片元件
 * 用於顯示關鍵指標
 */

import React from 'react';
import { withAlpha } from '@/utils/colorUtils';
import { View, Text, StyleSheet , Platform } from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';
import { StatCardData } from '@/types/charts';

interface StatCardProps extends StatCardData {
  icon?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  change,
  changeType = 'neutral',
  icon,
  color = DesignSystem.colors.primary,
  size = 'medium' }) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return DesignSystem.colors.gray700;
      case 'negative':
        return DesignSystem.colors.gray500;
      default:
        return DesignSystem.colors.text.secondary;
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return 'trending-up';
      case 'negative':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          value: styles.valueSmall,
          label: styles.labelSmall };
      case 'large':
        return {
          container: styles.containerLarge,
          value: styles.valueLarge,
          label: styles.labelLarge };
      default:
        return {
          container: {},
          value: {},
          label: {} };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={StyleSheet.flatten([styles.container, sizeStyles.container])}>
      {icon && (
        <View style={StyleSheet.flatten([styles.iconContainer, { backgroundColor: withAlpha(color, 0.125) }])}>
          <Icon name={icon} size={24} color={color} />
        </View>
      )}
      
      <Text style={StyleSheet.flatten([styles.label, sizeStyles.label])}>{label}</Text>
      
      <View style={styles.valueContainer}>
        <Text style={StyleSheet.flatten([styles.value, sizeStyles.value])}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      
      {change && (
        <View style={styles.changeContainer}>
          <Icon
            name={getChangeIcon()}
            size={16}
            color={getChangeColor()}
          />
          <Text style={StyleSheet.flatten([styles.change, { color: getChangeColor() }])}>
            {change}
          </Text>
        </View>
      )}
    </View>
  );
};

export const StatCardRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <View style={styles.row}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: 16,
    borderRadius: 12,
    minWidth: 150,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }) }),
    shadowOpacity: 0.05,
    shadowRadius: 4,
    ...(Platform.OS === 'web' ? {} : { elevation: 2 }) },
  containerSmall: {
    padding: 12,
    minWidth: 120 },
  containerLarge: {
    padding: 20,
    minWidth: 180 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12 },
  label: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: 8 },
  labelSmall: {
    fontSize: 11,
    marginBottom: 6 },
  labelLarge: {
    fontSize: 14,
    marginBottom: 10 },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4 },
  value: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.text.primary,
    fontWeight: '700' },
  valueSmall: {
    fontSize: 20 },
  valueLarge: {
    fontSize: 32 },
  unit: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: 4 },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 },
  change: {
    ...DesignSystem.typography.caption,
    fontWeight: '600' },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12 } });