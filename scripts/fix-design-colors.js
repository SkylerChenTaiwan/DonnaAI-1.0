#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 顏色映射規則
const colorMappings = [
  // Gray scale mappings
  { from: /DesignSystem\.colors\.gray50/g, to: 'DesignSystem.colors.gray[50]' },
  { from: /DesignSystem\.colors\.gray100/g, to: 'DesignSystem.colors.gray[100]' },
  { from: /DesignSystem\.colors\.gray200/g, to: 'DesignSystem.colors.gray[200]' },
  { from: /DesignSystem\.colors\.gray300/g, to: 'DesignSystem.colors.gray[300]' },
  { from: /DesignSystem\.colors\.gray400/g, to: 'DesignSystem.colors.gray[400]' },
  { from: /DesignSystem\.colors\.gray500/g, to: 'DesignSystem.colors.gray[500]' },
  { from: /DesignSystem\.colors\.gray600/g, to: 'DesignSystem.colors.gray[600]' },
  { from: /DesignSystem\.colors\.gray700/g, to: 'DesignSystem.colors.gray[700]' },
  { from: /DesignSystem\.colors\.gray800/g, to: 'DesignSystem.colors.gray[800]' },
  { from: /DesignSystem\.colors\.gray900/g, to: 'DesignSystem.colors.gray[900]' },
  
  // Direct color mappings
  { from: /DesignSystem\.colors\.white(?!\.)/g, to: 'DesignSystem.colors.background.surface' },
  { from: /DesignSystem\.colors\.text(?!\.)/g, to: 'DesignSystem.colors.text.primary' },
  { from: /DesignSystem\.colors\.error(?!\.)/g, to: 'DesignSystem.colors.status.error' },
  { from: /DesignSystem\.colors\.warning(?!\.)/g, to: 'DesignSystem.colors.status.warning' },
  { from: /DesignSystem\.colors\.success(?!\.)/g, to: 'DesignSystem.colors.status.success' },
  { from: /DesignSystem\.colors\.info(?!\.)/g, to: 'DesignSystem.colors.status.info' },
];

// 要處理的檔案
const files = glob.sync('src/components/superadmin/onboarding/**/*.tsx', {
  cwd: path.resolve(__dirname, '..'),
  absolute: true
});

console.log(`找到 ${files.length} 個檔案需要處理`);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  colorMappings.forEach(mapping => {
    const newContent = content.replace(mapping.from, mapping.to);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`✅ 更新: ${path.basename(file)}`);
  }
});

console.log('完成！');