/**
 * 區塊標題元件
 * Section Header Component
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';

interface SectionHeaderProps {
  icon: string;
  title: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
}) => {
  return (
    <View style={styles.container}>
      <Icon
        name={icon}
        size={20}
        color={DesignSystem.colors.primary}
      />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
});