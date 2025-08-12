#!/usr/bin/env node

/**
 * 自動修復顏色字串連接問題的腳本
 * 將 color + 'XX' 格式轉換為 withAlpha(color, alpha) 格式
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 透明度對照表
const alphaMap = {
  '10': 0.063,
  '15': 0.094,
  '20': 0.125,
  '30': 0.188,
  '40': 0.250,
  '50': 0.314,
  '60': 0.376,
  '70': 0.439,
  '80': 0.502,
  '90': 0.565,
  'A0': 0.627,
  'B0': 0.690,
  'C0': 0.753,
  'CC': 0.800,
  'D0': 0.816,
  'E0': 0.878,
  'F0': 0.941,
};

function convertAlpha(hexValue) {
  const upperHex = hexValue.toUpperCase();
  return alphaMap[upperHex] || (parseInt(hexValue, 16) / 255).toFixed(3);
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let hasColorUtils = false;

  // 檢查是否已經導入 colorUtils
  if (content.includes('colorUtils')) {
    hasColorUtils = true;
  }

  // 匹配所有顏色字串連接的模式
  const pattern = /((?:DesignSystem\.)?colors?\.[\w.]+|[\w]+Color)\s*\+\s*['"]([0-9A-Fa-f]+)['"]/g;
  
  let newContent = content.replace(pattern, (match, colorExpr, alphaHex) => {
    modified = true;
    const alpha = convertAlpha(alphaHex);
    return `withAlpha(${colorExpr}, ${alpha})`;
  });

  if (modified) {
    // 如果修改了內容且沒有導入 colorUtils，添加導入
    if (!hasColorUtils) {
      // 找到最後一個 import 語句的位置
      const lastImportMatch = content.match(/^import[^;]+;$/gm);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const insertPos = content.indexOf(lastImport) + lastImport.length;
        const importStatement = "\nimport { withAlpha } from '@/utils/colorUtils';";
        newContent = newContent.slice(0, insertPos) + importStatement + newContent.slice(insertPos);
      }
    }

    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }

  return false;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetPath = args.find(arg => !arg.startsWith('--')) || 'src/**/*.{ts,tsx}';

  console.log('🔍 搜尋需要修復的檔案...');
  
  const files = glob.sync(targetPath, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  });

  let fixedCount = 0;
  const filesToFix = [];

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const pattern = /((?:DesignSystem\.)?colors?\.[\w.]+|[\w]+Color)\s*\+\s*['"]([0-9A-Fa-f]+)['"]/g;
    
    if (pattern.test(content)) {
      filesToFix.push(file);
      
      if (!dryRun) {
        if (processFile(file)) {
          console.log(`✅ 修復: ${file}`);
          fixedCount++;
        }
      }
    }
  });

  if (dryRun) {
    console.log('\n📋 需要修復的檔案:');
    filesToFix.forEach(file => console.log(`  - ${file}`));
    console.log(`\n總計: ${filesToFix.length} 個檔案需要修復`);
    console.log('執行不帶 --dry-run 參數來實際修復這些檔案');
  } else {
    console.log(`\n✨ 完成！修復了 ${fixedCount} 個檔案`);
  }
}

// 執行腳本
main();