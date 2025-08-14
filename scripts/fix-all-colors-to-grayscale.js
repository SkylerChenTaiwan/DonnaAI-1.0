#!/usr/bin/env node

/**
 * 全面修復所有彩色為灰階設計
 * 將 success, warning, error, info 全部替換為灰階
 */

const fs = require('fs');
const path = require('path');

// 顏色映射表
const colorMappings = {
  // 狀態顏色到灰階的映射
  'DesignSystem.colors.success': 'DesignSystem.colors.gray700',  // 深灰色代替綠色
  'DesignSystem.colors.warning': 'DesignSystem.colors.gray600',  // 中深灰代替橙色  
  'DesignSystem.colors.error': 'DesignSystem.colors.gray500',    // 中灰色代替紅色
  'DesignSystem.colors.info': 'DesignSystem.colors.gray600',     // 中深灰代替紫色
  
  // 其他可能的彩色參考
  'DesignSystem.colors.status.success': 'DesignSystem.colors.gray700',
  'DesignSystem.colors.status.warning': 'DesignSystem.colors.gray600',
  'DesignSystem.colors.status.error': 'DesignSystem.colors.gray500',
  'DesignSystem.colors.status.info': 'DesignSystem.colors.gray600',
};

// 需要排除的檔案
const excludeFiles = [
  'designSystem.ts',  // 設計系統定義檔案本身
  'colors.ts',         // 顏色定義檔案
  'AdaptiveText.tsx',  // Adaptive 元件可能需要保留顏色選項
];

// 需要檢查的目錄
const directories = [
  path.join(__dirname, '../src/screens'),
  path.join(__dirname, '../src/components'),
];

// 統計資訊
let filesFixed = 0;
let totalReplacements = 0;
const fixedFiles = [];

// 遞迴處理目錄
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // 檢查是否在排除清單中
      if (excludeFiles.some(exclude => file.includes(exclude))) {
        return;
      }
      
      processFile(filePath);
    }
  });
}

// 處理單個檔案
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fileReplacements = 0;
  
  // 執行所有顏色替換
  Object.entries(colorMappings).forEach(([oldColor, newColor]) => {
    const regex = new RegExp(escapeRegExp(oldColor), 'g');
    const matches = content.match(regex);
    
    if (matches) {
      content = content.replace(regex, newColor);
      modified = true;
      fileReplacements += matches.length;
      totalReplacements += matches.length;
    }
  });
  
  // 如果有修改，寫回檔案
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesFixed++;
    fixedFiles.push({
      path: filePath.replace(path.dirname(__dirname), ''),
      replacements: fileReplacements
    });
    console.log(`✅ 修復: ${path.basename(filePath)} (${fileReplacements} 處)`);
  }
}

// 輔助函數：轉義正則表達式特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 主執行函數
function main() {
  console.log('🎨 開始將所有彩色轉換為灰階設計...\n');
  
  directories.forEach(dir => {
    console.log(`📁 處理目錄: ${path.basename(dir)}`);
    processDirectory(dir);
  });
  
  // 顯示統計結果
  console.log('\n' + '='.repeat(60));
  console.log('📊 修復統計：');
  console.log('='.repeat(60));
  console.log(`📝 修復檔案數: ${filesFixed}`);
  console.log(`🔄 總替換次數: ${totalReplacements}`);
  
  if (fixedFiles.length > 0) {
    console.log('\n📋 修復的檔案列表：');
    fixedFiles.forEach(file => {
      console.log(`   ${file.path} (${file.replacements} 處)`);
    });
  }
  
  console.log('\n✨ 灰階設計轉換完成！');
  console.log('💡 請執行 npm run web:build 重新建立專案');
}

// 執行主函數
main();