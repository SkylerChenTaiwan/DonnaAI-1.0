#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('開始針對性修復 shadowOffset 問題...\n');

// 需要修復的檔案模式
const patterns = [
  'src/**/*.{ts,tsx}',
  '!src/**/*.test.{ts,tsx}',
  '!src/**/*.spec.{ts,tsx}'
];

let totalFixed = 0;
const fixedFiles = [];

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { 
    ignore: ['node_modules/**', 'dist/**', 'build/**']
  });
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let modified = content;
    let fileFixed = false;
    
    // 修復 shadowOffset 在 Platform.select 中的問題
    // 模式 1: ...Platform.select({ 內含 shadowOffset
    const platformSelectPattern = /\.\.\.Platform\.select\s*\(\s*\{[^}]*shadowOffset[^}]*\}\s*\)/g;
    if (platformSelectPattern.test(modified)) {
      // 將整個 Platform.select 改為條件判斷
      modified = modified.replace(
        /\.\.\.Platform\.select\s*\(\s*\{([^}]*)\}\s*\)/g,
        (match, content) => {
          if (content.includes('shadowOffset')) {
            // 解析 web 和 default 的內容
            const webMatch = content.match(/web\s*:\s*\{([^}]*)\}/);
            const defaultMatch = content.match(/default\s*:\s*\{([^}]*)\}/);
            
            if (webMatch && defaultMatch) {
              const webStyles = webMatch[1].trim();
              const defaultStyles = defaultMatch[1].trim();
              
              // 轉換為條件判斷
              return `...(Platform.OS === 'web' ? { ${webStyles} } : { ${defaultStyles} })`;
            }
          }
          return match;
        }
      );
      fileFixed = true;
    }
    
    // 模式 2: 直接的 shadowOffset: { width: x, height: y }
    const directShadowPattern = /shadowOffset\s*:\s*\{\s*width\s*:\s*[^,]+,\s*height\s*:\s*[^}]+\}/g;
    if (directShadowPattern.test(modified)) {
      modified = modified.replace(
        directShadowPattern,
        (match) => {
          // 提取 width 和 height 的值
          const widthMatch = match.match(/width\s*:\s*([-\d.]+)/);
          const heightMatch = match.match(/height\s*:\s*([-\d.]+)/);
          
          if (widthMatch && heightMatch) {
            const width = widthMatch[1];
            const height = heightMatch[1];
            
            // 包裝在 Platform 條件中
            return `...(Platform.OS === 'web' ? {} : { shadowOffset: { width: ${width}, height: ${height} } })`;
          }
          return match;
        }
      );
      fileFixed = true;
    }
    
    // 模式 3: 修復 shadows 物件中的問題
    if (file.includes('designSystem') || file.includes('theme')) {
      // 特殊處理 theme 檔案
      const shadowsPattern = /shadows\s*:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
      modified = modified.replace(shadowsPattern, (match, content) => {
        if (content.includes('shadowOffset')) {
          // 重構整個 shadows 物件
          const levels = ['none', 'sm', 'md', 'lg', 'xl'];
          const newShadows = levels.map(level => {
            if (level === 'none') {
              return `    ${level}: Platform.OS === 'web' 
      ? { boxShadow: 'none' }
      : { 
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0
        }`;
            }
            
            const shadowConfigs = {
              sm: { web: '0px 1px 4px rgba(0,0,0,0.1)', height: 1, radius: 3, opacity: 0.1, elevation: 1 },
              md: { web: '0px 2px 8px rgba(0,0,0,0.15)', height: 2, radius: 5, opacity: 0.15, elevation: 3 },
              lg: { web: '0px 4px 16px rgba(0,0,0,0.2)', height: 4, radius: 8, opacity: 0.2, elevation: 5 },
              xl: { web: '0px 8px 32px rgba(0,0,0,0.25)', height: 8, radius: 12, opacity: 0.25, elevation: 8 }
            };
            
            const config = shadowConfigs[level];
            return `    ${level}: Platform.OS === 'web'
      ? { boxShadow: '${config.web}' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: ${config.height} },
          shadowOpacity: ${config.opacity},
          shadowRadius: ${config.radius},
          elevation: ${config.elevation}
        }`;
          }).join(',\n');
          
          return `shadows: {\n${newShadows}\n  }`;
        }
        return match;
      });
      fileFixed = true;
    }
    
    if (fileFixed && modified !== content) {
      // 確保有 Platform import
      if (!modified.includes("import { Platform }") && !modified.includes("import { Platform,")) {
        // 找到 react-native import
        const rnImportMatch = modified.match(/from\s+['"]react-native['"]/);
        if (rnImportMatch) {
          // 添加 Platform 到現有的 import
          modified = modified.replace(
            /import\s+\{([^}]+)\}\s+from\s+['"]react-native['"]/,
            (match, imports) => {
              if (!imports.includes('Platform')) {
                return `import {${imports}, Platform } from 'react-native'`;
              }
              return match;
            }
          );
        } else {
          // 添加新的 import
          modified = `import { Platform } from 'react-native';\n${modified}`;
        }
      }
      
      fs.writeFileSync(file, modified);
      totalFixed++;
      fixedFiles.push(file);
      console.log(`✓ 修復: ${file}`);
    }
  });
});

console.log(`\n完成！共修復 ${totalFixed} 個檔案`);
if (fixedFiles.length > 0) {
  console.log('\n修復的檔案列表:');
  fixedFiles.forEach(file => console.log(`  - ${file}`));
}