#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('修復所有 import 語法錯誤...\n');

const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'dist/**', 'build/**']
});

let fixedCount = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let modified = content;
  
  // 修復多餘的逗號
  // 模式: , Platform } from 'react-native'
  modified = modified.replace(/,\s*,\s*Platform\s*\}/g, ', Platform }');
  
  // 模式: 行首的逗號
  modified = modified.replace(/^\s*,\s*Platform\s*\}/gm, '  Platform\n}');
  
  // 修復其他 import 中的雙逗號
  modified = modified.replace(/,\s*,/g, ',');
  
  // 修復 import 語句中的尾隨逗號後跟 }
  modified = modified.replace(/,\s*\}/g, ' }');
  
  if (modified !== content) {
    fs.writeFileSync(file, modified);
    console.log(`✓ 修復: ${file}`);
    fixedCount++;
  }
});

console.log(`\n完成！共修復 ${fixedCount} 個檔案`);