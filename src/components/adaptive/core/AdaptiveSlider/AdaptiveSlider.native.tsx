/**
 * AdaptiveSlider Native 實作
 * 使用 React Native Slider
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { AdaptiveSliderProps, DEFAULT_COLORS } from './AdaptiveSlider.types';

export const AdaptiveSlider: React.FC<AdaptiveSliderProps> = ({
  value = 0,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  minimumTrackTintColor = DEFAULT_COLORS.minimumTrack,
  maximumTrackTintColor = DEFAULT_COLORS.maximumTrack,
  thumbTintColor = DEFAULT_COLORS.thumb,
  showValue = false,
  valuePrefix = '',
  valueSuffix = '',
  disabled = false,
  accessibilityLabel,
  testID,
}) => {
  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <Slider
        style={styles.slider}
        value={value}
        onValueChange={onValueChange}
        onSlidingStart={onSlidingStart}
        onSlidingComplete={onSlidingComplete}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        minimumTrackTintColor={minimumTrackTintColor}
        maximumTrackTintColor={maximumTrackTintColor}
        thumbTintColor={thumbTintColor}
        disabled={disabled}
        testID={testID}
        accessibilityLabel={accessibilityLabel || '滑動條'}
      />
      
      {showValue && (
        <Text style={styles.valueText}>
          {valuePrefix}{value}{valueSuffix}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  valueText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: DEFAULT_COLORS.value,
  },
});