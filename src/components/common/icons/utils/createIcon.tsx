import React from 'react';
import { View, ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function createIcon(
  paths: string[], 
  viewBox: string = "0 0 24 24",
  fillRule?: 'nonzero' | 'evenodd'
) {
  return React.memo<IconProps>(({ size = 24, color = '#000', style }) => {
    // SSR support
    if (typeof window === 'undefined') {
      return null;
    }

    // Use inline styles for highest priority
    const svgStyle = {
      display: 'block',
      width: `${size}px`,
      height: `${size}px`
    };

    const containerStyle = {
      width: `${size}px`,
      height: `${size}px`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    };

    return (
      <div style={containerStyle}>
        <svg
          width={size}
          height={size}
          viewBox={viewBox}
          fill={color}
          style={svgStyle}
          xmlns="http://www.w3.org/2000/svg"
        >
          {paths.map((d, index) => (
            <path 
              key={index} 
              d={d} 
              fillRule={fillRule || 'nonzero'}
            />
          ))}
        </svg>
      </div>
    );
  });
}

// Create icon with multiple paths and custom viewBox
export function createComplexIcon(
  elements: Array<{
    type: 'path' | 'circle' | 'rect';
    props: any;
  }>,
  viewBox: string = "0 0 24 24"
) {
  return React.memo<IconProps>(({ size = 24, color = '#000', style }) => {
    if (typeof window === 'undefined') {
      return null;
    }

    const svgStyle = {
      display: 'block',
      width: `${size}px`,
      height: `${size}px`
    };

    const containerStyle = {
      width: `${size}px`,
      height: `${size}px`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    };

    return (
      <div style={containerStyle}>
        <svg
          width={size}
          height={size}
          viewBox={viewBox}
          fill={color}
          style={svgStyle}
          xmlns="http://www.w3.org/2000/svg"
        >
          {elements.map((element, index) => {
            const Element = element.type;
            return <Element key={index} {...element.props} fill={color} />;
          })}
        </svg>
      </div>
    );
  });
}