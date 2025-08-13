/**
 * AdaptiveAvatar - 簡化版頭像元件
 */

import React from 'react';
import { Platform, View, Text, Image, StyleSheet } from 'react-native';

interface AdaptiveAvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: 'small' | 'medium' | 'large' | number;
  backgroundColor?: string;
  textColor?: string;
  rounded?: boolean;
  testID?: string;
}

const getSizeValue = (size: 'small' | 'medium' | 'large' | number): number => {
  if (typeof size === 'number') return size;
  const sizeMap = { small: 32, medium: 48, large: 64 };
  return sizeMap[size];
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const AdaptiveAvatarWeb: React.FC<AdaptiveAvatarProps> = ({
  source,
  name,
  size = 'medium',
  backgroundColor = '#FE7821',
  textColor = '#FFFFFF',
  rounded = true,
  testID,
}) => {
  const sizeValue = getSizeValue(size);
  const fontSize = sizeValue * 0.4;
  
  const style: React.CSSProperties = {
    width: `${sizeValue}px`,
    height: `${sizeValue}px`,
    borderRadius: rounded ? '50%' : `${sizeValue * 0.15}px`,
    backgroundColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  };
  
  const textStyle: React.CSSProperties = {
    color: textColor,
    fontSize: `${fontSize}px`,
    fontWeight: '600',
    userSelect: 'none',
  };
  
  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };
  
  return (
    <div style={style} data-testid={testID}>
      {source ? (
        <img
          src={typeof source === 'object' ? source.uri : ''}
          alt={name || 'Avatar'}
          style={imageStyle}
        />
      ) : (
        <span style={textStyle}>{getInitials(name)}</span>
      )}
    </div>
  );
};

const AdaptiveAvatarNative: React.FC<AdaptiveAvatarProps> = ({
  source,
  name,
  size = 'medium',
  backgroundColor = '#FE7821',
  textColor = '#FFFFFF',
  rounded = true,
  testID,
}) => {
  const sizeValue = getSizeValue(size);
  const fontSize = sizeValue * 0.4;
  
  return (
    <View
      style={[
        styles.container,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: rounded ? sizeValue / 2 : sizeValue * 0.15,
          backgroundColor,
        },
      ]}
      testID={testID}
    >
      {source ? (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: sizeValue,
              height: sizeValue,
              borderRadius: rounded ? sizeValue / 2 : sizeValue * 0.15,
            },
          ]}
        />
      ) : (
        <Text style={{ color: textColor, fontSize, fontWeight: '600' }}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
});

export const AdaptiveAvatar = Platform.select({
  web: AdaptiveAvatarWeb,
  default: AdaptiveAvatarNative,
}) as React.FC<AdaptiveAvatarProps>;