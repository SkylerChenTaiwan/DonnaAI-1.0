#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🧹 清理巢狀的 Platform.OS 檢查...\n');

const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'dist/**', 'build/**']
});

let cleanedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // 修復重複的巢狀 Platform.OS 檢查
  // 模式: ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { ... }) })
  content = content.replace(
    /\.\.\.\(Platform\.OS === 'web' \? \{\} : \{ \.\.\.\(Platform\.OS === 'web' \? \{\} : \{([^}]+)\}\) \}\)/g,
    (match, innerContent) => {
      modified = true;
      return `...(Platform.OS === 'web' ? {} : { ${innerContent} })`;
    }
  );
  
  // 修復重複的 Platform import
  if (content.includes("} from 'react-native'\nimport { Platform } from 'react-native'")) {
    content = content.replace(
      /\} from 'react-native'\nimport \{ Platform \} from 'react-native';?/g,
      ", Platform } from 'react-native'"
    );
    modified = true;
  }
  
  // 修復 ViewStyle, TextStyle 的 import
  if (content.includes("type { ViewStyle, TextStyle } , Platform } from 'react-native'")) {
    content = content.replace(
      /type \{ ViewStyle, TextStyle \} , Platform \} from 'react-native'/g,
      "{ ViewStyle, TextStyle, Platform } from 'react-native'"
    );
    modified = true;
  }
  
  // 修復無效的 transform 在 Web
  content = content.replace(
    /transform: isOpen \? 'rotate\(180deg\)' : 'rotate\(0deg\)'/g,
    `transform: \`rotate(\${isOpen ? 180 : 0}deg)\``
  );
  
  // 清理多餘的空行和格式問題
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  content = content.replace(/\}\s*\}\s*\}\s*\}\)/g, (match) => {
    const count = (match.match(/\}/g) || []).length;
    const parens = (match.match(/\)/g) || []).length;
    return '}' + ' }'.repeat(count - 1) + ')'.repeat(parens);
  });
  
  if (modified) {
    fs.writeFileSync(file, content);
    cleanedCount++;
    console.log(`✅ 清理 ${path.basename(file)}`);
  }
});

console.log(`\n✨ 清理完成！共清理 ${cleanedCount} 個檔案`);