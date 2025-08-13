/**
 * AdaptiveDivider - 簡化版分隔線元件
 */

import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';

interface AdaptiveDividerProps {
  thickness?: number;
  color?: string;
  marginVertical?: number;
  marginHorizontal?: number;
  orientation?: 'horizontal' | 'vertical';
  testID?: string;
}

const AdaptiveDividerWeb: React.FC<AdaptiveDividerProps> = ({
  thickness = 1,
  color = '#E3E1DC',
  marginVertical = 8,
  marginHorizontal = 0,
  orientation = 'horizontal',
  testID,
}) => {
  const style: React.CSSProperties = {
    backgroundColor: color,
    margin: 0,
    ...(orientation === 'horizontal' ? {
      width: '100%',
      height: `${thickness}px`,
      marginTop: `${marginVertical}px`,
      marginBottom: `${marginVertical}px`,
      marginLeft: `${marginHorizontal}px`,
      marginRight: `${marginHorizontal}px`,
    } : {
      width: `${thickness}px`,
      height: '100%',
      marginLeft: `${marginVertical}px`,
      marginRight: `${marginVertical}px`,
      marginTop: `${marginHorizontal}px`,
      marginBottom: `${marginHorizontal}px`,
    }),
  };
  
  return <div style={style} data-testid={testID} />;
};

const AdaptiveDividerNative: React.FC<AdaptiveDividerProps> = ({
  thickness = 1,
  color = '#E3E1DC',
  marginVertical = 8,
  marginHorizontal = 0,
  orientation = 'horizontal',
  testID,
}) => {
  return (
    <View
      style={[
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        {
          backgroundColor: color,
          ...(orientation === 'horizontal' ? {
            height: thickness,
            marginVertical,
            marginHorizontal,
          } : {
            width: thickness,
            marginHorizontal: marginVertical,
            marginVertical: marginHorizontal,
          }),
        },
      ]}
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
});

export const AdaptiveDivider = Platform.select({
  web: AdaptiveDividerWeb,
  default: AdaptiveDividerNative,
}) as React.FC<AdaptiveDividerProps>;