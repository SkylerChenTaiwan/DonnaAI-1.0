#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 透明度對照表（從現有 fix-color-styles.js 複製）
const alphaMap = {
  '10': 0.063, '15': 0.094, '20': 0.125, '30': 0.188,
  '40': 0.250, '50': 0.314, '60': 0.376, '70': 0.439,
  '80': 0.502, '90': 0.565, 'A0': 0.627, 'B0': 0.690,
  'C0': 0.753, 'CC': 0.800, 'D0': 0.816, 'E0': 0.878,
  'F0': 0.941,
};

function fixColorConcatenation(content, filePath) {
  let newContent = content;
  let fixCount = 0;
  
  // 檢查是否已經 import withAlpha
  const hasWithAlphaImport = /import.*withAlpha.*from.*colorUtils/.test(content);
  
  // 更全面的正則表達式模式
  const patterns = [
    // 模式 1: 任何以 color/Color 結尾的變數或屬性
    /(\w+\.color|\w+Color|color)\s*\+\s*['"]([0-9A-Fa-f]{2})['"]/g,
    
    // 模式 2: 函數調用返回顏色
    /(get\w*Color\([^)]*\))\s*\+\s*['"]([0-9A-Fa-f]{2})['"]/g,
    
    // 模式 3: 條件表達式中的顏色
    /(\?[^:]+:\s*['"][#\w]+['"])\s*\+\s*['"]([0-9A-Fa-f]{2})['"]/g,
    
    // 模式 4: DesignSystem 顏色（保留原有模式）
    /(DesignSystem\.colors?\.[\w.]+)\s*\+\s*['"]([0-9A-Fa-f]{2})['"]/g,
  ];
  
  // 對每個模式進行替換
  patterns.forEach(pattern => {
    newContent = newContent.replace(pattern, (match, colorExpr, alphaHex) => {
      fixCount++;
      const alpha = alphaMap[alphaHex] || (parseInt(alphaHex, 16) / 255);
      return `withAlpha(${colorExpr}, ${alpha})`;
    });
  });
  
  // 如果有修復且沒有 import，添加 import
  if (fixCount > 0 && !hasWithAlphaImport) {
    // 尋找第一個 import 語句的位置
    const importMatch = content.match(/^import\s+.*$/m);
    if (importMatch) {
      const insertPos = content.indexOf(importMatch[0]) + importMatch[0].length;
      newContent = 
        newContent.slice(0, insertPos) + 
        "\nimport { withAlpha } from '@/utils/colorUtils';" +
        newContent.slice(insertPos);
    } else {
      // 如果沒有 import，加在檔案開頭
      newContent = "import { withAlpha } from '@/utils/colorUtils';\n\n" + newContent;
    }
  }
  
  return { content: newContent, fixCount };
}

// 主程式
function main() {
  console.log('🔍 全面掃描顏色拼接問題...\n');
  
  const files = glob.sync('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/colorUtils.ts'],
  });
  
  let totalFixed = 0;
  const fixedFiles = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const { content: fixedContent, fixCount } = fixColorConcatenation(content, file);
    
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
  }
}

main();