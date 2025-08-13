/**
 * 運行時陣列樣式修復器
 * 自動將陣列樣式轉換為單一物件
 */
import { StyleSheet, Platform } from 'react-native';

// 儲存原始的 createElement
const React = require('react');
const originalCreateElement = React.createElement;

// 深度展平樣式
function deepFlattenStyle(style) {
  if (!style) return style;
  
  // 如果是陣列，使用 StyleSheet.flatten
  if (Array.isArray(style)) {
    return StyleSheet.flatten(style);
  }
  
  // 如果是物件，遞迴處理
  if (typeof style === 'object') {
    const flattened = {};
    for (const key in style) {
      if (key === 'style' && Array.isArray(style[key])) {
        flattened[key] = StyleSheet.flatten(style[key]);
      } else {
        flattened[key] = style[key];
      }
    }
    return flattened;
  }
  
  return style;
}

// 包裝 createElement
React.createElement = function(type, props, ...children) {
  if (props && props.style && Platform.OS === 'web') {
    // 確保樣式不是陣列
    props = {
      ...props,
      style: deepFlattenStyle(props.style)
    };
  }
  
  return originalCreateElement.call(this, type, props, ...children);
};

// 也包裝 cloneElement
const originalCloneElement = React.cloneElement;
React.cloneElement = function(element, props, ...children) {
  if (props && props.style && Platform.OS === 'web') {
    props = {
      ...props,
      style: deepFlattenStyle(props.style)
    };
  }
  
  return originalCloneElement.call(this, element, props, ...children);
};

console.log('[ArrayStyleFixer] Initialized - All array styles will be flattened for Web');
