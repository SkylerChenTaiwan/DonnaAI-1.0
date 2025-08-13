/**
 * AdaptiveCard - 簡化版卡片元件
 */

import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';

interface AdaptiveCardProps {
  children?: React.ReactNode;
  padding?: number;
  margin?: number;
  backgroundColor?: string;
  borderRadius?: number;
  shadow?: boolean;
  testID?: string;
}

const AdaptiveCardWeb: React.FC<AdaptiveCardProps> = ({
  children,
  padding = 16,
  margin = 8,
  backgroundColor = '#FFFFFF',
  borderRadius = 8,
  shadow = true,
  testID,
}) => {
  const style: React.CSSProperties = {
    padding: `${padding}px`,
    margin: `${margin}px`,
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    boxShadow: shadow ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
    transition: 'all 0.2s ease',
  };
  
  return (
    <div style={style} data-testid={testID}>
      {children}
    </div>
  );
};

const AdaptiveCardNative: React.FC<AdaptiveCardProps> = ({
  children,
  padding = 16,
  margin = 8,
  backgroundColor = '#FFFFFF',
  borderRadius = 8,
  shadow = true,
  testID,
}) => {
  return (
    <View
      style={[
        styles.card,
        {
          padding,
          margin,
          backgroundColor,
          borderRadius,
        },
        shadow && styles.shadow,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {},
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

export const AdaptiveCard = Platform.select({
  web: AdaptiveCardWeb,
  default: AdaptiveCardNative,
}) as React.FC<AdaptiveCardProps>;