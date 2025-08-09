const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 找出所有需要修正的檔案
const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: [
    '**/node_modules/**',
    '**/*.native.tsx',
    '**/*.native.ts',
    '**/Icon.web.tsx',
    '**/Icon.native.tsx',
    '**/Icon.tsx',
    '**/MaterialIcon.web.tsx',
    '**/MaterialIcon.native.tsx',
    '**/MaterialIcon.tsx'
  ]
});

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // 檢查是否有 <Ionicons 使用
  if (content.includes('<Ionicons')) {
    // 替換 <Ionicons 為 <Icon
    content = content.replace(/<Ionicons\s+/g, '<Icon ');
    content = content.replace(/<\/Ionicons>/g, '</Icon>');
    
    // 移除 as any 轉型（Icon 元件已經處理了）
    content = content.replace(/name={([^}]+)\s+as\s+any}/g, 'name={$1}');
    
    // 確保有 Icon import
    if (!content.includes("import { Icon }") && content.includes("<Icon ")) {
      // 找到合適的位置插入 import
      const importRegex = /import\s+.*?from\s+['"]react-native['"];?\s*\n/;
      const match = content.match(importRegex);
      if (match) {
        const insertPos = match.index + match[0].length;
        content = content.slice(0, insertPos) + 
                  "import { Icon } from '@/components/common/Icon';\n" + 
                  content.slice(insertPos);
      }
    }
    
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`✅ 修正檔案: ${file}`);
    fixedCount++;
  }
});

console.log(`\n總共修正了 ${fixedCount} 個檔案`);