/**
 * 模式切換開關
 */

import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';
import { DesignSystem } from '@/theme/designSystem';

interface ModeToggleProps {
  value: 'business' | 'manager';
  onToggle: (value: 'business' | 'manager') => void;
  label?: string;
}

export const ModeToggle = ({
  value,
  onToggle,
  label = '主管模式',
}: ModeToggleProps) => {
  const isManagerMode = value === 'manager';

  const handleToggle = (newValue: boolean) => {
    onToggle(newValue ? 'manager' : 'business');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={isManagerMode}
        onValueChange={handleToggle}
        trackColor={{
          false: DesignSystem.colors.border.light,
          true: DesignSystem.colors.gray700, // 使用較深的灰色以保持辨識度
        }}
        thumbColor={DesignSystem.colors.background.surface}
        ios_backgroundColor={DesignSystem.colors.border.light}
        style={Platform.OS === 'ios' ? styles.iosSwitch : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    ...DesignSystem.typography.bodySmall,
    fontWeight: '500',
    color: DesignSystem.colors.text.secondary,
  },
  iosSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});