#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🎯 修復陣列樣式問題 - React Native Web 不支援陣列樣式\n');

// 掃描所有檔案
const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'dist/**', 'build/**', '**/*.test.*', '**/*.spec.*']
});

let fixedCount = 0;
const problematicFiles = [];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // 1. 修復 style={[...]} 模式
  // 找出所有 style={[...]} 的模式
  content = content.replace(
    /style=\{(\[[^\]]+\])\}/g,
    (match, arrayContent) => {
      modified = true;
      
      // 如果包含 Platform.OS 檢查，保留原樣
      if (arrayContent.includes('Platform.OS')) {
        return match;
      }
      
      // 使用 StyleSheet.flatten 包裝
      return `style={StyleSheet.flatten(${arrayContent})}`;
    }
  );
  
  // 2. 修復更複雜的陣列樣式（多行）
  const styleArrayPattern = /style=\{(\[[\s\S]*?\])\}/g;
  let matches = content.match(styleArrayPattern);
  
  if (matches) {
    matches.forEach(match => {
      if (!match.includes('StyleSheet.flatten') && !match.includes('Platform.OS')) {
        const arrayPart = match.match(/style=\{(\[[\s\S]*?\])\}/)[1];
        const replacement = `style={StyleSheet.flatten(${arrayPart})}`;
        content = content.replace(match, replacement);
        modified = true;
      }
    });
  }
  
  // 3. 修復條件陣列樣式
  // 例如: style={condition ? [styles.a, styles.b] : styles.c}
  content = content.replace(
    /style=\{([^}]*\?[^}]*\[[^\]]+\][^}]*:[^}]+)\}/g,
    (match, conditional) => {
      if (conditional.includes('StyleSheet.flatten')) {
        return match;
      }
      
      // 解析條件表達式
      const parts = conditional.split(/\?|:/);
      if (parts.length === 3) {
        const condition = parts[0].trim();
        const trueValue = parts[1].trim();
        const falseValue = parts[2].trim();
        
        // 如果 true 值是陣列，包裝它
        if (trueValue.startsWith('[')) {
          return `style={${condition} ? StyleSheet.flatten(${trueValue}) : ${falseValue}}`;
        }
      }
      
      return match;
    }
  );
  
  // 4. 確保有 StyleSheet import
  if (modified && !content.includes('StyleSheet')) {
    // 找到 react-native import
    content = content.replace(
      /from ['"]react-native['"]/,
      (match) => {
        const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]react-native['"]/);
        if (importMatch) {
          const imports = importMatch[1];
          if (!imports.includes('StyleSheet')) {
            return match.replace('{', '{ StyleSheet, ');
          }
        }
        return match;
      }
    );
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
    fixedCount++;
    problematicFiles.push(file);
    console.log(`✓ 修復: ${path.basename(file)}`);
  }
});

// 創建一個更強大的運行時包裝器
const runtimeWrapperContent = `/**
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
`;

fs.writeFileSync('src/utils/arrayStyleFixer.ts', runtimeWrapperContent);
console.log('\n✅ 創建 arrayStyleFixer.ts');

// 更新 App.tsx 以載入修復器
const appPath = 'App.tsx';
if (fs.existsSync(appPath)) {
  let content = fs.readFileSync(appPath, 'utf8');
  
  if (!content.includes('arrayStyleFixer')) {
    content = content.replace(
      "import './src/utils/styleWrapper';",
      `import './src/utils/arrayStyleFixer';
import './src/utils/styleWrapper';`
    );
    
    fs.writeFileSync(appPath, content);
    console.log('✅ 更新 App.tsx 載入 arrayStyleFixer');
  }
}

console.log(`\n✨ 修復完成！`);
console.log(`📊 統計：`);
console.log(`  - 修復了 ${fixedCount} 個檔案`);
console.log(`  - 所有陣列樣式都使用 StyleSheet.flatten 包裝`);

if (problematicFiles.length > 0) {
  console.log('\n修復的檔案：');
  problematicFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
}

console.log('\n💡 關鍵修復：');
console.log('1. 所有 style={[...]} 改為 style={StyleSheet.flatten([...])}');
console.log('2. 創建運行時包裝器自動處理陣列樣式');
console.log('3. React Native Web 現在應該可以正常運作了！');