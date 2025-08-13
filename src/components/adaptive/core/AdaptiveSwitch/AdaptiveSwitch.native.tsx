/**
 * AdaptiveSwitch Native 平台實作
 * 包裝 React Native 的 Switch 元件，提供統一的 API
 */

import React from 'react';
import { View, Text, Switch, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AdaptiveSwitchProps, DEFAULT_COLORS } from './AdaptiveSwitch.types';

export const AdaptiveSwitch: React.FC<AdaptiveSwitchProps> = ({
  value = false,
  onValueChange,
  disabled = false,
  trackColor = DEFAULT_COLORS.trackColor,
  thumbColor = DEFAULT_COLORS.thumbColor,
  ios_backgroundColor,
  label,
  labelPosition = 'right',
  accessibilityLabel,
  accessibilityRole = 'switch',
  accessibilityState,
  testID,
  style,
  ...props
}) => {
  // 合併顏色配置
  const colors = {
    trackFalse: trackColor?.false || DEFAULT_COLORS.trackColor.false,
    trackTrue: trackColor?.true || DEFAULT_COLORS.trackColor.true,
    thumb: disabled ? DEFAULT_COLORS.disabledThumbColor : thumbColor,
  };

  // Switch 元件
  const switchElement = (
    <Switch
      value={value}
      onValueChange={disabled ? undefined : onValueChange}
      disabled={disabled}
      trackColor={{
        false: colors.trackFalse,
        true: colors.trackTrue,
      }}
      thumbColor={colors.thumb}
      ios_backgroundColor={ios_backgroundColor || colors.trackFalse}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        ...accessibilityState,
        checked: value,
        disabled: disabled,
      }}
      testID={testID}
      {...props}
    />
  );

  // 如果沒有標籤，直接返回 Switch
  if (!label) {
    return <View style={[styles.container, style]}>{switchElement}</View>;
  }

  // 有標籤時，包裝在容器中
  return (
    <View style={[styles.container, style]}>
      {labelPosition === 'left' && (
        <Text style={[styles.label, disabled && styles.disabledLabel]}>
          {label}
        </Text>
      )}
      {switchElement}
      {labelPosition === 'right' && (
        <Text style={[styles.label, disabled && styles.disabledLabel]}>
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  label: {
    fontSize: 14,
    color: '#1A1A1A',
    marginHorizontal: 8,
    fontWeight: '400',
  } as TextStyle,
  disabledLabel: {
    color: '#999999',
  } as TextStyle,
});

// 導出預設值
export default AdaptiveSwitch;