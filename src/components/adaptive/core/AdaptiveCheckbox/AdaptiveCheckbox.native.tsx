/**
 * AdaptiveCheckbox Native 實作
 * 使用 React Native 社群的 CheckBox 元件
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcon } from '@/components/common/MaterialIcon';
import { AdaptiveCheckboxProps, DEFAULT_COLORS } from './AdaptiveCheckbox.types';

export const AdaptiveCheckbox: React.FC<AdaptiveCheckboxProps> = ({
  value = false,
  onValueChange,
  disabled = false,
  color = DEFAULT_COLORS.checked,
  size = 'medium',
  label,
  labelPosition = 'right',
  indeterminate = false,
  accessibilityLabel,
  testID,
}) => {
  // 尺寸映射
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24
  };
  
  const checkboxSize = sizeMap[size];
  const iconSize = checkboxSize * 0.8;
  const fontSize = size === 'small' ? 14 : size === 'large' ? 18 : 16;
  
  const handlePress = () => {
    if (!disabled && onValueChange) {
      onValueChange(!value);
    }
  };
  
  const renderCheckbox = () => (
    <View
      style={[
        styles.checkbox,
        {
          width: checkboxSize,
          height: checkboxSize,
          borderColor: value || indeterminate ? color : DEFAULT_COLORS.unchecked,
          backgroundColor: value || indeterminate ? color : 'transparent',
          opacity: disabled ? 0.5 : 1,
        }
      ]}
    >
      {(value || indeterminate) && (
        <MaterialIcon
          name={indeterminate ? 'remove' : 'check'}
          size={iconSize}
          color="white"
        />
      )}
    </View>
  );
  
  const content = (
    <View style={styles.container}>
      {label && labelPosition === 'left' && (
        <Text
          style={[
            styles.label,
            {
              fontSize,
              color: disabled ? DEFAULT_COLORS.disabled : DEFAULT_COLORS.label,
              marginRight: 8,
            }
          ]}
        >
          {label}
        </Text>
      )}
      
      {renderCheckbox()}
      
      {label && labelPosition === 'right' && (
        <Text
          style={[
            styles.label,
            {
              fontSize,
              color: disabled ? DEFAULT_COLORS.disabled : DEFAULT_COLORS.label,
              marginLeft: 8,
            }
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
  
  if (disabled) {
    return (
      <View
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: indeterminate ? 'mixed' : value,
          disabled: true,
        }}
        accessibilityLabel={accessibilityLabel || label}
        testID={testID}
      >
        {content}
      </View>
    );
  }
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{
        checked: indeterminate ? 'mixed' : value,
        disabled: false,
      }}
      accessibilityLabel={accessibilityLabel || label}
      testID={testID}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flexShrink: 1,
  },
});