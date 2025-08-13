#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * 修復 transform 陣列語法
 * 將 React Native 的 transform: [{ translateX: 280 }] 
 * 轉換為 Web 相容的條件判斷
 */

function fixTransformArrays(content, filePath) {
  let newContent = content;
  let fixCount = 0;
  
  // 檢查是否需要 Platform import
  const hasPlatformImport = /import.*Platform.*from.*react-native/.test(content);
  
  // 尋找 transform: [ 模式
  const transformArrayPattern = /transform:\s*\[\s*{([^}]+)}\s*\]/g;
  
  newContent = newContent.replace(transformArrayPattern, (match, transformContent) => {
    fixCount++;
    
    // 解析 transform 內容
    const transforms = transformContent.trim();
    
    // 特殊處理不同的 transform 類型
    if (transforms.includes('translateX')) {
      const value = transforms.match(/translateX:\s*([^,}]+)/)?.[1] || '0';
      return `transform: Platform.OS === 'web' ? \`translateX(\${${value}}px)\` : [{ translateX: ${value} }]`;
    } else if (transforms.includes('translateY')) {
      const value = transforms.match(/translateY:\s*([^,}]+)/)?.[1] || '0';
      return `transform: Platform.OS === 'web' ? \`translateY(\${${value}}px)\` : [{ translateY: ${value} }]`;
    } else if (transforms.includes('scale')) {
      const value = transforms.match(/scale:\s*([^,}]+)/)?.[1] || '1';
      return `transform: Platform.OS === 'web' ? \`scale(\${${value}})\` : [{ scale: ${value} }]`;
    } else if (transforms.includes('rotate')) {
      const value = transforms.match(/rotate:\s*([^,}]+)/)?.[1] || '0deg';
      // 如果已經有引號，移除它們
      const cleanValue = value.replace(/['"]/g, '');
      return `transform: Platform.OS === 'web' ? \`rotate(${cleanValue})\` : [{ rotate: '${cleanValue}' }]`;
    } else {
      // 保持原樣但加上平台檢查
      return `transform: Platform.OS === 'web' ? 'none' : [{ ${transforms} }]`;
    }
  });
  
  // 如果有修復且沒有 Platform import，添加 import
  if (fixCount > 0 && !hasPlatformImport) {
    // 尋找 react-native import
    const rnImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]react-native['"]/);
    if (rnImportMatch) {
      // 在現有的 react-native import 中加入 Platform
      const imports = rnImportMatch[1];
      if (!imports.includes('Platform')) {
        newContent = newContent.replace(
          rnImportMatch[0],
          `import {${imports}, Platform } from 'react-native'`
        );
      }
    }
  }
  
  return { content: newContent, fixCount };
}

// 主程式
function main() {
  console.log('🔍 掃描 transform 陣列語法問題...\n');
  
  const files = glob.sync('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  });
  
  let totalFixed = 0;
  const fixedFiles = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const { content: fixedContent, fixCount } = fixTransformArrays(content, file);
    
    if (fixCount > 0) {
      fs.writeFileSync(file, fixedContent);
      console.log(`✅ 修復 ${file}: ${fixCount} 處`);
      fixedFiles.push({ file, count: fixCount });
      totalFixed += fixCount;
    }
  });
  
  console.log('\n📊 修復統計:');
  console.log(`   檔案掃描: ${files.length} 個`);
  console.log(`   檔案修復: ${fixedFiles.length} 個`);
  console.log(`   總修復數: ${totalFixed} 處`);
  
  if (fixedFiles.length > 0) {
    console.log('\n📝 修復詳情:');
    fixedFiles.forEach(({ file, count }) => {
      console.log(`   ${path.relative('.', file)}: ${count} 處`);
    });
    console.log('\n⚠️  注意：請檢查修復後的程式碼，確保邏輯正確');
  }
}

main();