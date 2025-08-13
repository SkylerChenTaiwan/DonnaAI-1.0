#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 修復所有關鍵的樣式問題...\n');

// 從報告中讀取關鍵問題
const report = JSON.parse(fs.readFileSync('runtime-style-report.json', 'utf8'));
const criticalIssues = report.criticalIssues;

// 需要修復的檔案列表
const filesToFix = [
  'src/components/users/stages/UserFieldMapper.tsx',
  'src/components/database/web/TanStackNotionTableV3.tsx',
  'src/components/adaptive/core/AdaptiveSelect.tsx'
];

// 1. 修復 UserFieldMapper.tsx
const userFieldMapperPath = 'src/components/users/stages/UserFieldMapper.tsx';
if (fs.existsSync(userFieldMapperPath)) {
  let content = fs.readFileSync(userFieldMapperPath, 'utf8');
  
  // 確保有 Platform import
  if (!content.includes("import { Platform }") && !content.includes("Platform,")) {
    content = content.replace(
      /from 'react-native'/,
      `from 'react-native'
import { Platform } from 'react-native'`
    );
  }
  
  // 修復 inline styles - 包裝在 Platform 檢查中
  // 尋找並修復所有包含 transform 或 shadow 的 inline styles
  content = content.replace(
    /style=\{\{([^}]*(?:transform|shadow)[^}]*)\}\}/g,
    (match, styleContent) => {
      // 如果已經有 Platform 檢查，跳過
      if (styleContent.includes('Platform.OS')) {
        return match;
      }
      
      // 分離 Web 安全和不安全的樣式
      const lines = styleContent.split(',').map(l => l.trim());
      const safeStyles = [];
      const unsafeStyles = [];
      
      lines.forEach(line => {
        if (line.includes('transform') || 
            line.includes('shadow') || 
            line.includes('elevation')) {
          unsafeStyles.push(line);
        } else {
          safeStyles.push(line);
        }
      });
      
      if (unsafeStyles.length > 0) {
        // 建立條件樣式
        return `style={{
          ${safeStyles.join(',\n          ')},
          ...(Platform.OS !== 'web' ? {
            ${unsafeStyles.join(',\n            ')}
          } : {})
        }}`;
      }
      
      return match;
    }
  );
  
  fs.writeFileSync(userFieldMapperPath, content);
  console.log('✅ 修復 UserFieldMapper.tsx');
}

// 2. 修復 TanStackNotionTableV3.tsx
const tanstackPath = 'src/components/database/web/TanStackNotionTableV3.tsx';
if (fs.existsSync(tanstackPath)) {
  let content = fs.readFileSync(tanstackPath, 'utf8');
  
  // 這是 Web 專用元件，應該完全避免使用 Native 樣式
  // 移除所有 transform 和 shadow 相關屬性
  content = content.replace(
    /transform:\s*['"`][^'"`]*['"`],?/g,
    ''
  );
  
  content = content.replace(
    /shadow\w+:\s*[^,}]+,?/g,
    ''
  );
  
  // 清理多餘的逗號
  content = content.replace(/,\s*,/g, ',');
  content = content.replace(/,\s*\}/g, '}');
  
  fs.writeFileSync(tanstackPath, content);
  console.log('✅ 修復 TanStackNotionTableV3.tsx');
}

// 3. 修復 AdaptiveSelect.tsx
const adaptiveSelectPath = 'src/components/adaptive/core/AdaptiveSelect.tsx';
if (fs.existsSync(adaptiveSelectPath)) {
  let content = fs.readFileSync(adaptiveSelectPath, 'utf8');
  
  // 確保有 Platform import
  if (!content.includes("import { Platform }")) {
    content = content.replace(
      /from 'react-native'/,
      `, Platform } from 'react-native'`
    );
  }
  
  // 修復所有 inline styles
  content = content.replace(
    /style=\{\{([^}]+)\}\}/g,
    (match, styleContent) => {
      // 檢查是否包含危險屬性
      if (styleContent.includes('transform') || 
          styleContent.includes('shadow') || 
          styleContent.includes('elevation')) {
        
        if (!styleContent.includes('Platform.OS')) {
          // 需要添加 Platform 檢查
          return `style={{
            ...(Platform.OS === 'web' ? {
              ${styleContent.replace(/transform:|shadow\w+:|elevation:/g, '// $&')}
            } : {
              ${styleContent}
            })
          }}`;
        }
      }
      return match;
    }
  );
  
  fs.writeFileSync(adaptiveSelectPath, content);
  console.log('✅ 修復 AdaptiveSelect.tsx');
}

// 4. 修復所有 StyleSheet.create 中的問題
const glob = require('glob');
const allFiles = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'dist/**', 'build/**']
});

let fixedStyleSheets = 0;

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // 尋找 StyleSheet.create 區塊
  if (content.includes('StyleSheet.create')) {
    // 修復 shadowOffset
    content = content.replace(
      /shadowOffset:\s*\{\s*width:\s*[\d.]+,\s*height:\s*[\d.]+\s*\}/g,
      (match) => {
        modified = true;
        return `...(Platform.OS === 'web' ? {} : { ${match} })`;
      }
    );
    
    // 修復 transform 陣列
    content = content.replace(
      /transform:\s*\[([^\]]+)\]/g,
      (match, transforms) => {
        modified = true;
        return `...(Platform.OS === 'web' ? {} : { transform: [${transforms}] })`;
      }
    );
    
    // 修復 elevation
    content = content.replace(
      /elevation:\s*\d+/g,
      (match) => {
        if (!match.includes('Platform.OS')) {
          modified = true;
          return `...(Platform.OS === 'web' ? {} : { ${match} })`;
        }
        return match;
      }
    );
    
    if (modified) {
      // 確保有 Platform import
      if (!content.includes("import { Platform }") && !content.includes("Platform,")) {
        content = content.replace(
          /from ['"]react-native['"]/,
          (match) => {
            const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]react-native['"]/);
            if (importMatch) {
              const imports = importMatch[1];
              if (!imports.includes('Platform')) {
                return match.replace('{', '{ Platform, ');
              }
            }
            return match;
          }
        );
      }
      
      fs.writeFileSync(file, content);
      fixedStyleSheets++;
      console.log(`✅ 修復 StyleSheet 在 ${path.basename(file)}`);
    }
  }
});

console.log(`\n✨ 修復完成！`);
console.log(`📊 統計：`);
console.log(`  - 修復了 ${filesToFix.length} 個關鍵檔案`);
console.log(`  - 修復了 ${fixedStyleSheets} 個 StyleSheet.create 區塊`);
console.log(`\n下一步：重新建構並部署`);