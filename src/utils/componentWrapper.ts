/**
 * React 元件樣式包裝器
 */
import React from 'react';
import { Platform } from 'react-native';

// 儲存原始的 createElement
const originalCreateElement = React.createElement;

// 包裝 createElement 以清理樣式
React.createElement = function(type, props, ...children) {
  if (props && props.style && Platform.OS === 'web') {
    // 清理 style prop
    props = {
      ...props,
      style: cleanInlineStyle(props.style)
    };
  }
  
  return originalCreateElement.call(this, type, props, ...children);
};

function cleanInlineStyle(style) {
  if (!style) return style;
  
  if (Array.isArray(style)) {
    return style.map(cleanInlineStyle);
  }
  
  if (typeof style === 'object') {
    const cleaned = { ...style };
    
    // 移除危險屬性
    delete cleaned.shadowColor;
    delete cleaned.shadowOffset;
    delete cleaned.shadowOpacity;
    delete cleaned.shadowRadius;
    delete cleaned.elevation;
    
    // 處理 transform
    if (cleaned.transform && Array.isArray(cleaned.transform)) {
      delete cleaned.transform;
    }
    
    return cleaned;
  }
  
  return style;
}

console.log('[ComponentWrapper] Initialized - All inline styles will be cleaned');
