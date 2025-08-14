#!/usr/bin/env node

/**
 * 修復所有錯誤的 DesignSystem 顏色引用
 */

const fs = require('fs');
const path = require('path');

// 修正規則
const replacements = [
  // status 顏色
  { from: /DesignSystem\.colors\.success(?![.])/g, to: 'DesignSystem.colors.status.success' },
  { from: /DesignSystem\.colors\.warning(?![.])/g, to: 'DesignSystem.colors.status.warning' },
  { from: /DesignSystem\.colors\.error(?![.])/g, to: 'DesignSystem.colors.status.error' },
  { from: /DesignSystem\.colors\.info(?![.])/g, to: 'DesignSystem.colors.status.info' },
  
  // gray 顏色
  { from: /DesignSystem\.colors\.gray50(?![0-9])/g, to: 'DesignSystem.colors.gray[50]' },
  { from: /DesignSystem\.colors\.gray100(?![0-9])/g, to: 'DesignSystem.colors.gray[100]' },
  { from: /DesignSystem\.colors\.gray200(?![0-9])/g, to: 'DesignSystem.colors.gray[200]' },
  { from: /DesignSystem\.colors\.gray300(?![0-9])/g, to: 'DesignSystem.colors.gray[300]' },
  { from: /DesignSystem\.colors\.gray400(?![0-9])/g, to: 'DesignSystem.colors.gray[400]' },
  { from: /DesignSystem\.colors\.gray500(?![0-9])/g, to: 'DesignSystem.colors.gray[500]' },
  { from: /DesignSystem\.colors\.gray600(?![0-9])/g, to: 'DesignSystem.colors.gray[600]' },
  { from: /DesignSystem\.colors\.gray700(?![0-9])/g, to: 'DesignSystem.colors.gray[700]' },
  { from: /DesignSystem\.colors\.gray800(?![0-9])/g, to: 'DesignSystem.colors.gray[800]' },
  { from: /DesignSystem\.colors\.gray900(?![0-9])/g, to: 'DesignSystem.colors.gray[900]' },
  
  // white 不存在
  { from: /DesignSystem\.colors\.white/g, to: 'DesignSystem.colors.text.inverse' },
];

// 排除的檔案和目錄
const excludePaths = [
  'node_modules',
  '.expo',
  'dist',
  'build',
  '.git',
  'scripts/fix-all-color-refs.js',
  'src/theme/designSystem.ts', // 定義檔案本身
];

// 遞迴搜尋檔案
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (excludePaths.some(exclude => filePath.includes(exclude))) {
      return;
    }
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (filePath.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 修復單個檔案
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const changes = [];
  
  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      modified = true;
      changes.push(`  ✓ ${matches.length} 次 ${from.source} → ${to}`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`📝 ${path.relative(process.cwd(), filePath)}`);
    changes.forEach(change => console.log(change));
    console.log('');
    return true;
  }
  
  return false;
}

// 主函數
function main() {
  console.log('🔍 搜尋需要修復的檔案...\n');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir);
  
  let fixedCount = 0;
  
  files.forEach(file => {
    if (fixFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`✨ 完成！修復了 ${fixedCount} 個檔案`);
  
  if (fixedCount > 0) {
    console.log('\n⚠️  請重新建構專案：');
    console.log('  npm run web:build');
  }
}

main();