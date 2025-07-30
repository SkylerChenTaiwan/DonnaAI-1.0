#!/usr/bin/env node
/**
 * 將所有測試檔案中的 jest 轉換為 vitest
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 要替換的模式
const replacements = [
  {
    pattern: /jest\.fn\(\)/g,
    replacement: 'vi.fn()'
  },
  {
    pattern: /jest\.spyOn\(/g,
    replacement: 'vi.spyOn('
  },
  {
    pattern: /jest\.mock\(/g,
    replacement: 'vi.mock('
  },
  {
    pattern: /jest\.mocked\(/g,
    replacement: 'vi.mocked('
  },
  {
    pattern: /jest\.clearAllMocks\(\)/g,
    replacement: 'vi.clearAllMocks()'
  },
  {
    pattern: /jest\.resetAllMocks\(\)/g,
    replacement: 'vi.resetAllMocks()'
  }
];

// 找到所有測試檔案
const testFiles = glob.sync('src/**/*.test.{ts,tsx}', {
  cwd: process.cwd(),
  absolute: true
});

console.log(`找到 ${testFiles.length} 個測試檔案`);

testFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let hasChanges = false;
  
  // 檢查是否需要添加 vitest import
  const hasVitestImport = content.includes("from 'vitest'");
  const hasJestUsage = replacements.some(r => r.pattern.test(content));
  
  if (hasJestUsage && !hasVitestImport) {
    // 在檔案開頭尋找適當的位置插入 import
    const importRegex = /import.*from\s+['"].*['"];?\n/g;
    const imports = content.match(importRegex);
    
    if (imports) {
      const lastImportIndex = content.lastIndexOf(imports[imports.length - 1]);
      const insertPosition = lastImportIndex + imports[imports.length - 1].length;
      
      // 檢查需要導入哪些函數
      const vitestFunctions = ['describe', 'it', 'expect', 'vi', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll'];
      const neededFunctions = vitestFunctions.filter(fn => {
        if (fn === 'vi') return hasJestUsage;
        return content.includes(fn + '(');
      });
      
      if (neededFunctions.length > 0) {
        const vitestImport = `import { ${neededFunctions.join(', ')} } from 'vitest';\n`;
        content = content.slice(0, insertPosition) + vitestImport + content.slice(insertPosition);
        hasChanges = true;
      }
    }
  }
  
  // 執行替換
  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ 更新: ${path.relative(process.cwd(), file)}`);
  }
});

console.log('完成！');