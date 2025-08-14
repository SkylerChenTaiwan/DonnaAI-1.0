#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 需要還原的錯誤顏色映射
const colorFixes = {
  // 還原錯誤的 gray 顏色引用
  'DesignSystem.colors.gray\\[400\\]': 'DesignSystem.colors.gray400',
  'DesignSystem.colors.gray\\[500\\]': 'DesignSystem.colors.gray500',
  'DesignSystem.colors.gray\\[600\\]': 'DesignSystem.colors.gray600',
  'DesignSystem.colors.gray\\[700\\]': 'DesignSystem.colors.gray700',
  'DesignSystem.colors.gray\\[300\\]': 'DesignSystem.colors.gray300',
  'DesignSystem.colors.gray\\[200\\]': 'DesignSystem.colors.gray200',
  'DesignSystem.colors.gray\\[100\\]': 'DesignSystem.colors.gray100',
  'DesignSystem.colors.gray\\[50\\]': 'DesignSystem.colors.gray50',
  'DesignSystem.colors.gray\\[800\\]': 'DesignSystem.colors.gray800',
  
  // 還原錯誤的 status 顏色
  'DesignSystem.colors.status.success': 'DesignSystem.colors.success',
  'DesignSystem.colors.status.warning': 'DesignSystem.colors.warning',
  'DesignSystem.colors.status.error': 'DesignSystem.colors.error',
  'DesignSystem.colors.status.info': 'DesignSystem.colors.info',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [pattern, replacement] of Object.entries(colorFixes)) {
    const regex = new RegExp(pattern, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      modified = true;
      console.log(`✓ Fixed ${pattern} in ${path.basename(filePath)}`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

function findAndFixFiles(dir) {
  let totalFixed = 0;
  
  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // 跳過 node_modules 和其他不需要的目錄
        if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist-web' && file !== 'build') {
          walkDir(filePath);
        }
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        if (processFile(filePath)) {
          totalFixed++;
        }
      }
    }
  }
  
  walkDir(dir);
  return totalFixed;
}

// 修復搜尋欄背景問題
function fixSearchBar() {
  const searchBarPath = path.join(__dirname, '../src/components/common/SearchBar.tsx');
  let content = fs.readFileSync(searchBarPath, 'utf8');
  
  // 修復 input 樣式 - 添加透明背景
  const oldInputStyle = `  input: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A' },`;
    
  const newInputStyle = `  input: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0 },`;
  
  if (content.includes(oldInputStyle)) {
    content = content.replace(oldInputStyle, newInputStyle);
    fs.writeFileSync(searchBarPath, content, 'utf8');
    console.log('✓ Fixed SearchBar input background');
    return true;
  }
  
  return false;
}

// 主執行函數
console.log('🔧 Fixing style issues...\n');

// 1. 修復顏色引用
console.log('📝 Fixing color references...');
const srcPath = path.join(__dirname, '../src');
const filesFixed = findAndFixFiles(srcPath);
console.log(`✅ Fixed ${filesFixed} files\n`);

// 2. 修復搜尋欄
console.log('🔍 Fixing SearchBar background...');
if (fixSearchBar()) {
  console.log('✅ SearchBar fixed\n');
} else {
  console.log('⚠️ SearchBar already fixed or not found\n');
}

console.log('✨ All style fixes completed!');