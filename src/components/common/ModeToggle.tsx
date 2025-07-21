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
          false: '#E3E1DC',
          true: '#FF5C00',
        }}
        thumbColor="#F7F6F3"
        ios_backgroundColor="#E3E1DC"
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
    fontSize: 14,
    fontWeight: '500',
    color: '#7A7A7A',
  },
  iosSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});