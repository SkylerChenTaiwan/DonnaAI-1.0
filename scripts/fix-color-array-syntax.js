#!/usr/bin/env node

/**
 * 修復 DesignSystem.colors.gray[xxx] 等陣列索引語法
 * 改為 DesignSystem.colors.gray500 等點標記法
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 匹配所有顏色陣列索引模式
  // 例如：DesignSystem.colors.gray[500] -> DesignSystem.colors.gray500
  const patterns = [
    {
      regex: /DesignSystem\.colors\.gray\[(\d+)\]/g,
      replacement: 'DesignSystem.colors.gray$1'
    },
    {
      regex: /DesignSystem\.colors\.red\[(\d+)\]/g,
      replacement: 'DesignSystem.colors.red$1'
    },
    {
      regex: /DesignSystem\.colors\.blue\[(\d+)\]/g,
      replacement: 'DesignSystem.colors.blue$1'
    },
    {
      regex: /DesignSystem\.colors\.green\[(\d+)\]/g,
      replacement: 'DesignSystem.colors.green$1'
    },
    {
      regex: /DesignSystem\.colors\.yellow\[(\d+)\]/g,
      replacement: 'DesignSystem.colors.yellow$1'
    },
    {
      regex: /DesignSystem\.colors\.purple\[(\d+)\]/g,
      replacement: 'DesignSystem.colors.purple$1'
    },
    {
      regex: /colors\.gray\[(\d+)\]/g,
      replacement: 'colors.gray$1'
    },
    {
      regex: /colors\.red\[(\d+)\]/g,
      replacement: 'colors.red$1'
    },
    {
      regex: /colors\.blue\[(\d+)\]/g,
      replacement: 'colors.blue$1'
    },
    {
      regex: /colors\.green\[(\d+)\]/g,
      replacement: 'colors.green$1'
    }
  ];
  
  patterns.forEach(({ regex, replacement }) => {
    if (regex.test(content)) {
      modified = true;
      content = content.replace(regex, replacement);
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
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
    const hasIssue = /colors\.\w+\[\d+\]/g.test(content);
    
    if (hasIssue) {
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