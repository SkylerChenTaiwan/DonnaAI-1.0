#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🚀 執行終極樣式修復 - 完全重寫所有樣式系統\n');

// 1. 創建全域樣式包裝器
const styleWrapperContent = `/**
 * 全域樣式包裝器 - 確保 Web 平台安全
 */
import { Platform, StyleSheet } from 'react-native';

// 儲存原始的 StyleSheet.create
const originalCreate = StyleSheet.create;

// 覆寫 StyleSheet.create
StyleSheet.create = function(styles) {
  if (Platform.OS === 'web') {
    // Web 平台：深度清理所有樣式
    const cleanedStyles = {};
    
    for (const key in styles) {
      const style = styles[key];
      cleanedStyles[key] = cleanStyleForWeb(style);
    }
    
    return originalCreate.call(this, cleanedStyles);
  }
  
  // Native 平台：保持原樣
  return originalCreate.call(this, styles);
};

// 清理 Web 樣式的函數
function cleanStyleForWeb(style) {
  if (!style) return style;
  
  if (Array.isArray(style)) {
    return style.map(cleanStyleForWeb);
  }
  
  const cleaned = { ...style };
  
  // 移除所有 Native 專用屬性
  const nativeOnlyProps = [
    'shadowColor',
    'shadowOffset', 
    'shadowOpacity',
    'shadowRadius',
    'elevation',
    'overlayColor',
    'tintColor',
    'selectionColor'
  ];
  
  nativeOnlyProps.forEach(prop => {
    delete cleaned[prop];
  });
  
  // 處理 transform
  if (cleaned.transform && Array.isArray(cleaned.transform)) {
    delete cleaned.transform;
  }
  
  return cleaned;
}

// 導出清理函數供直接使用
export const webSafeStyle = (style) => {
  if (Platform.OS === 'web') {
    return cleanStyleForWeb(style);
  }
  return style;
};

// 導出陰影創建函數
export const createShadow = (level = 'md') => {
  if (Platform.OS === 'web') {
    const shadows = {
      none: { boxShadow: 'none' },
      sm: { boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' },
      md: { boxShadow: '0px 2px 8px rgba(0,0,0,0.15)' },
      lg: { boxShadow: '0px 4px 16px rgba(0,0,0,0.2)' },
      xl: { boxShadow: '0px 8px 32px rgba(0,0,0,0.25)' }
    };
    return shadows[level] || shadows.md;
  }
  
  // Native 陰影
  const shadows = {
    none: {
      shadowOpacity: 0,
      elevation: 0
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 1
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 3
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8
    }
  };
  
  return shadows[level] || shadows.md;
};

// 自動初始化
console.log('[StyleWrapper] Initialized - All styles will be cleaned for Web platform');
`;

fs.writeFileSync('src/utils/styleWrapper.ts', styleWrapperContent);
console.log('✅ 創建 styleWrapper.ts');

// 2. 修改 index.ts 以確保 styleWrapper 最先載入
const indexPath = 'index.ts';
if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // 在最頂部加入 styleWrapper
  if (!content.includes('styleWrapper')) {
    content = `// 必須最先載入的樣式包裝器
import './src/utils/styleWrapper';

${content}`;
    fs.writeFileSync(indexPath, content);
    console.log('✅ 修改 index.ts 載入 styleWrapper');
  }
}

// 3. 創建 React 元件包裝器
const componentWrapperContent = `/**
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
`;

fs.writeFileSync('src/utils/componentWrapper.ts', componentWrapperContent);
console.log('✅ 創建 componentWrapper.ts');

// 4. 修改 App.tsx 載入包裝器
const appPaths = ['App.tsx', 'src/App.tsx'];
for (const appPath of appPaths) {
  if (fs.existsSync(appPath)) {
    let content = fs.readFileSync(appPath, 'utf8');
    
    if (!content.includes('componentWrapper')) {
      // 在檔案最頂部加入
      content = `// 樣式系統包裝器（必須最先載入）
import './utils/styleWrapper';
import './utils/componentWrapper';

${content}`;
      fs.writeFileSync(appPath, content);
      console.log(`✅ 修改 ${appPath} 載入包裝器`);
    }
    break;
  }
}

// 5. 創建 Babel 插件來在編譯時處理
const babelPluginContent = `/**
 * Babel 插件 - 編譯時清理樣式
 */
module.exports = function() {
  return {
    visitor: {
      JSXAttribute(path) {
        if (path.node.name.name === 'style') {
          // 包裝 style 屬性
          const value = path.node.value;
          if (value && value.expression) {
            const wrappedExpression = {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: '__cleanStyle'
              },
              arguments: [value.expression]
            };
            value.expression = wrappedExpression;
          }
        }
      }
    }
  };
};
`;

fs.writeFileSync('babel-plugin-clean-styles.js', babelPluginContent);
console.log('✅ 創建 Babel 插件');

// 6. 更新 babel.config.js
const babelConfigPath = 'babel.config.js';
if (fs.existsSync(babelConfigPath)) {
  let content = fs.readFileSync(babelConfigPath, 'utf8');
  
  if (!content.includes('babel-plugin-clean-styles')) {
    content = content.replace(
      'plugins: [',
      `plugins: [
        // 清理樣式的插件
        './babel-plugin-clean-styles',`
    );
    
    // 如果沒有 plugins 陣列，則添加
    if (!content.includes('plugins:')) {
      content = content.replace(
        'presets:',
        `plugins: ['./babel-plugin-clean-styles'],
  presets:`
      );
    }
    
    fs.writeFileSync(babelConfigPath, content);
    console.log('✅ 更新 babel.config.js');
  }
}

// 7. 創建全域樣式清理函數
const globalCleanerContent = `/**
 * 全域樣式清理函數
 */
if (typeof window !== 'undefined') {
  // Web 環境
  window.__cleanStyle = function(style) {
    if (!style) return style;
    
    if (Array.isArray(style)) {
      return style.map(window.__cleanStyle);
    }
    
    if (typeof style === 'object') {
      const cleaned = {};
      for (const key in style) {
        if (key === 'shadowOffset' || 
            key === 'shadowColor' ||
            key === 'shadowOpacity' ||
            key === 'shadowRadius' ||
            key === 'elevation') {
          continue;
        }
        if (key === 'transform' && Array.isArray(style[key])) {
          continue;
        }
        cleaned[key] = style[key];
      }
      return cleaned;
    }
    
    return style;
  };
} else {
  // Native 環境
  global.__cleanStyle = function(style) {
    return style;
  };
}
`;

fs.writeFileSync('src/utils/globalCleaner.js', globalCleanerContent);
console.log('✅ 創建 globalCleaner.js');

console.log('\n🎯 終極修復完成！');
console.log('\n實施的策略：');
console.log('1. ✅ 覆寫 StyleSheet.create - 自動清理所有樣式');
console.log('2. ✅ 包裝 React.createElement - 清理所有 inline styles');
console.log('3. ✅ Babel 插件 - 編譯時處理');
console.log('4. ✅ 全域清理函數 - 運行時保護');
console.log('\n這是最徹底的解決方案，從多個層面攔截和清理樣式。');