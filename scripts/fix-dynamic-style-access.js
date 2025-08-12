#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 要掃描的目錄
const DIRECTORIES = ['src'];

// 檔案副檔名
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

// 統計
let filesProcessed = 0;
let filesFixed = 0;
let totalFixes = 0;

/**
 * 修復動態樣式存取
 */
function fixDynamicStyleAccess(content, filePath) {
  let newContent = content;
  let fixCount = 0;

  // 修復模式 1: styles[`alert${type}`] -> 使用條件判斷
  // 針對 TeamDataSyncTool.tsx 的特定修復
  if (filePath.includes('TeamDataSyncTool')) {
    // 替換 styles[`alert${message.type}`] 為條件樣式
    newContent = newContent.replace(
      /styles\[`alert\$\{message\.type\}`\]/g,
      (match) => {
        fixCount++;
        return "message.type === 'success' ? styles.alertsuccess : message.type === 'error' ? styles.alerterror : styles.alertinfo";
      }
    );
  }

  // 修復模式 2: styles[variant] -> 使用展開運算符或條件判斷
  // 針對 Button.native.tsx
  if (filePath.includes('Button.native')) {
    // 修復 styles[variant]
    newContent = newContent.replace(
      /styles\[variant\]/g,
      (match) => {
        fixCount++;
        return "...(variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : variant === 'tertiary' ? styles.tertiary : variant === 'danger' ? styles.danger : {})";
      }
    );

    // 修復 styles[size]
    newContent = newContent.replace(
      /styles\[size\]/g,
      (match) => {
        fixCount++;
        return "...(size === 'small' ? styles.small : size === 'medium' ? styles.medium : size === 'large' ? styles.large : {})";
      }
    );

    // 修復 styles[`${variant}Text`]
    newContent = newContent.replace(
      /styles\[`\$\{variant\}Text`[^\]]*\]/g,
      (match) => {
        fixCount++;
        return "...(variant === 'primary' ? styles.primaryText : variant === 'secondary' ? styles.secondaryText : variant === 'tertiary' ? styles.tertiaryText : variant === 'danger' ? styles.dangerText : {})";
      }
    );

    // 修復 styles[`${size}Text`]
    newContent = newContent.replace(
      /styles\[`\$\{size\}Text`[^\]]*\]/g,
      (match) => {
        fixCount++;
        return "...(size === 'small' ? styles.smallText : size === 'medium' ? styles.mediumText : size === 'large' ? styles.largeText : {})";
      }
    );
  }

  // 修復模式 3: styles[breakpoint] 和 styles[bp] (responsive.ts 和 web.ts)
  if (filePath.includes('responsive.ts') || filePath.includes('web.ts')) {
    // 這些檔案的動態存取是合理的，但需要確保不會傳遞到 DOM
    // 暫時跳過這些檔案，因為它們是工具函數
    return { content: newContent, fixCount: 0 };
  }

  return { content: newContent, fixCount };
}

/**
 * 處理單個檔案
 */
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { content: fixedContent, fixCount } = fixDynamicStyleAccess(content, filePath);
  
  if (fixCount > 0) {
    fs.writeFileSync(filePath, fixedContent);
    console.log(`✅ 修復 ${filePath}: ${fixCount} 處`);
    filesFixed++;
    totalFixes += fixCount;
  }
  
  filesProcessed++;
}

/**
 * 遞迴掃描目錄
 */
function scanDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // 跳過 node_modules 和其他不需要的目錄
      if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== 'build') {
        scanDirectory(itemPath);
      }
    } else if (stat.isFile()) {
      // 檢查副檔名
      const ext = path.extname(item);
      if (EXTENSIONS.includes(ext)) {
        processFile(itemPath);
      }
    }
  }
}

// 主程式
console.log('🔍 開始掃描並修復動態樣式存取問題...\n');

for (const dir of DIRECTORIES) {
  if (fs.existsSync(dir)) {
    console.log(`📁 掃描目錄: ${dir}`);
    scanDirectory(dir);
  }
}

console.log('\n📊 修復統計:');
console.log(`   檔案掃描: ${filesProcessed} 個`);
console.log(`   檔案修復: ${filesFixed} 個`);
console.log(`   總修復數: ${totalFixes} 處`);

if (filesFixed > 0) {
  console.log('\n✅ 修復完成！請重新建構專案。');
} else {
  console.log('\n✅ 沒有發現需要修復的問題。');
}