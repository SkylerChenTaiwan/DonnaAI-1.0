/**
 * AdaptiveRadio Native 實作
 * 使用 React Native 元件建立 Radio 按鈕
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AdaptiveRadioProps, AdaptiveRadioGroupProps, DEFAULT_COLORS } from './AdaptiveRadio.types';

export const AdaptiveRadio: React.FC<AdaptiveRadioProps> = ({
  value = false,
  onPress,
  disabled = false,
  color = DEFAULT_COLORS.selected,
  size = 'medium',
  label,
  labelPosition = 'right',
  accessibilityLabel,
  testID,
}) => {
  // 尺寸映射
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24
  };
  
  const radioSize = sizeMap[size];
  const dotSize = radioSize * 0.4;
  const fontSize = size === 'small' ? 14 : size === 'large' ? 18 : 16;
  
  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };
  
  const renderRadio = () => (
    <View
      style={[
        styles.radioOuter,
        {
          width: radioSize,
          height: radioSize,
          borderColor: value ? color : DEFAULT_COLORS.unselected,
          opacity: disabled ? 0.5 : 1,
        }
      ]}
    >
      {value && (
        <View
          style={[
            styles.radioInner,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: color,
            }
          ]}
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
      
      {renderRadio()}
      
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
        accessibilityRole="radio"
        accessibilityState={{
          checked: value,
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
      accessibilityRole="radio"
      accessibilityState={{
        checked: value,
        disabled: false,
      }}
      accessibilityLabel={accessibilityLabel || label}
      testID={testID}
    >
      {content}
    </TouchableOpacity>
  );
};

// RadioGroup 元件
export const AdaptiveRadioGroup: React.FC<AdaptiveRadioGroupProps> = ({
  value,
  onValueChange,
  disabled = false,
  options,
  direction = 'vertical',
  color = DEFAULT_COLORS.selected,
  size = 'medium',
}) => {
  return (
    <View
      style={[
        styles.groupContainer,
        direction === 'horizontal' && styles.horizontalGroup
      ]}
      accessibilityRole="radiogroup"
    >
      {options.map((option) => (
        <AdaptiveRadio
          key={option.value}
          value={value === option.value}
          onPress={() => onValueChange?.(option.value)}
          disabled={disabled || option.disabled}
          label={option.label}
          color={color}
          size={size}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    borderWidth: 2,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    borderRadius: 100,
  },
  label: {
    flexShrink: 1,
  },
  groupContainer: {
    gap: 12,
  },
  horizontalGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
});