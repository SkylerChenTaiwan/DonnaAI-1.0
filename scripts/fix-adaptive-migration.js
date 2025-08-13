#!/usr/bin/env node

/**
 * PRP-114 Adaptive 元件自動替換工具
 * 自動將所有問題檔案遷移到 Adaptive 元件
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 替換規則配置
const MIGRATION_RULES = [
  // 1. common/Button → AdaptiveButton
  {
    name: 'common-button-import',
    pattern: /from ['"]@\/components\/common\/Button['"]/g,
    replacement: "from '@/components/adaptive'",
    description: '替換 common/Button 匯入'
  },
  {
    name: 'common-button-element',
    pattern: /<Button([^>]*>)/g,
    replacement: '<AdaptiveButton$1',
    description: '替換 Button 元件標籤'
  },
  {
    name: 'common-button-closing',
    pattern: /<\/Button>/g,
    replacement: '</AdaptiveButton>',
    description: '替換 Button 結束標籤'
  },

  // 2. common/TextInput → AdaptiveInput
  {
    name: 'common-textinput-import',
    pattern: /from ['"]@\/components\/common\/TextInput['"]/g,
    replacement: "from '@/components/adaptive'",
    description: '替換 common/TextInput 匯入'
  },
  {
    name: 'common-textinput-element',
    pattern: /<TextInput([^>]*\/?>)/g,
    replacement: '<AdaptiveInput$1',
    description: '替換 TextInput 元件標籤'
  },

  // 3. react-native Switch → AdaptiveSwitch
  {
    name: 'rn-switch-import',
    pattern: /import\s*\{\s*([^}]*?)Switch([^}]*?)\}\s*from\s*['"]react-native['"]/g,
    replacement: (match, before, after) => {
      // 移除 Switch 並清理逗號
      let newImports = (before + after).replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
      if (newImports.trim()) {
        return `import { ${newImports} } from 'react-native';\nimport { AdaptiveSwitch } from '@/components/adaptive'`;
      } else {
        return `import { AdaptiveSwitch } from '@/components/adaptive'`;
      }
    },
    description: '替換 react-native Switch 匯入'
  },
  {
    name: 'rn-switch-element',
    pattern: /<Switch([^>]*\/?>)/g,
    replacement: '<AdaptiveSwitch$1',
    description: '替換 Switch 元件標籤'
  },

  // 4. react-native TextInput → AdaptiveInput
  {
    name: 'rn-textinput-import',
    pattern: /import\s*\{\s*([^}]*?)TextInput([^}]*?)\}\s*from\s*['"]react-native['"]/g,
    replacement: (match, before, after) => {
      let newImports = (before + after).replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
      if (newImports.trim()) {
        return `import { ${newImports} } from 'react-native';\nimport { AdaptiveInput } from '@/components/adaptive'`;
      } else {
        return `import { AdaptiveInput } from '@/components/adaptive'`;
      }
    },
    description: '替換 react-native TextInput 匯入'
  },
  {
    name: 'rn-textinput-element',
    pattern: /<TextInput([^>]*\/?>)/g,
    replacement: '<AdaptiveInput$1',
    description: '替換 TextInput 元件標籤（當從 react-native 匯入時）'
  },

  // 5. react-native Button → AdaptiveButton
  {
    name: 'rn-button-import',
    pattern: /import\s*\{\s*([^}]*?)Button([^}]*?)\}\s*from\s*['"]react-native['"]/g,
    replacement: (match, before, after) => {
      let newImports = (before + after).replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
      if (newImports.trim()) {
        return `import { ${newImports} } from 'react-native';\nimport { AdaptiveButton } from '@/components/adaptive'`;
      } else {
        return `import { AdaptiveButton } from '@/components/adaptive'`;
      }
    },
    description: '替換 react-native Button 匯入'
  },
  {
    name: 'rn-button-element',
    pattern: /<Button([^>]*\/?>)/g,
    replacement: '<AdaptiveButton$1',
    description: '替換 Button 元件標籤（當從 react-native 匯入時）'
  },

  // 6. react-native Modal → AdaptiveModal
  {
    name: 'rn-modal-import',
    pattern: /import\s*\{\s*([^}]*?)Modal([^}]*?)\}\s*from\s*['"]react-native['"]/g,
    replacement: (match, before, after) => {
      let newImports = (before + after).replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
      if (newImports.trim()) {
        return `import { ${newImports} } from 'react-native';\nimport { AdaptiveModal } from '@/components/adaptive'`;
      } else {
        return `import { AdaptiveModal } from '@/components/adaptive'`;
      }
    },
    description: '替換 react-native Modal 匯入'
  },
  {
    name: 'rn-modal-element',
    pattern: /<Modal([^>]*>)/g,
    replacement: '<AdaptiveModal$1',
    description: '替換 Modal 元件標籤'
  },
  {
    name: 'rn-modal-closing',
    pattern: /<\/Modal>/g,
    replacement: '</AdaptiveModal>',
    description: '替換 Modal 結束標籤'
  }
];

function applyMigrationToFile(filePath, dryRun = false) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let appliedRules = [];

    // 應用所有替換規則
    for (const rule of MIGRATION_RULES) {
      const before = content;
      
      if (typeof rule.replacement === 'function') {
        content = content.replace(rule.pattern, rule.replacement);
      } else {
        content = content.replace(rule.pattern, rule.replacement);
      }
      
      if (before !== content) {
        appliedRules.push(rule.name);
      }
    }

    // 合併重複的 Adaptive 匯入
    content = consolidateAdaptiveImports(content);

    if (content !== originalContent) {
      if (!dryRun) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ 修正: ${filePath}`);
        appliedRules.forEach(rule => {
          console.log(`   - ${MIGRATION_RULES.find(r => r.name === rule).description}`);
        });
      } else {
        console.log(`🔄 預覽: ${filePath} (${appliedRules.length} 個修改)`);
      }
      return { modified: true, rules: appliedRules };
    }

    return { modified: false, rules: [] };
  } catch (error) {
    console.error(`❌ 處理檔案失敗: ${filePath}`, error.message);
    return { modified: false, rules: [], error: error.message };
  }
}

function consolidateAdaptiveImports(content) {
  // 找出所有 Adaptive 相關的匯入
  const adaptiveImportPattern = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]@\/components\/adaptive['"];?\n?/g;
  const matches = [...content.matchAll(adaptiveImportPattern)];
  
  if (matches.length <= 1) {
    return content; // 沒有需要合併的
  }

  // 收集所有匯入的元件名稱
  const allImports = new Set();
  matches.forEach(match => {
    const imports = match[1].split(',').map(imp => imp.trim()).filter(Boolean);
    imports.forEach(imp => allImports.add(imp));
  });

  // 移除所有現有的 Adaptive 匯入
  let newContent = content.replace(adaptiveImportPattern, '');

  // 在第一個匯入語句後添加合併的匯入
  const firstImportPattern = /^(import\s+[^;]+;?\n)/m;
  const firstImportMatch = newContent.match(firstImportPattern);
  
  if (firstImportMatch) {
    const consolidatedImport = `import {\n  ${Array.from(allImports).join(',\n  ')}\n} from '@/components/adaptive';\n`;
    newContent = newContent.replace(firstImportPattern, firstImportMatch[0] + consolidatedImport);
  } else {
    // 如果找不到其他匯入，在檔案開頭添加
    const consolidatedImport = `import {\n  ${Array.from(allImports).join(',\n  ')}\n} from '@/components/adaptive';\n\n`;
    newContent = consolidatedImport + newContent;
  }

  return newContent;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const filePattern = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-')) || 'src/**/*.{tsx,ts}';

  console.log(`🚀 開始 Adaptive 元件自動遷移${dryRun ? ' (預覽模式)' : ''}...\n`);

  // 尋找需要處理的檔案
  const files = glob.sync(filePattern, {
    ignore: [
      'src/**/*.test.{tsx,ts}',
      'src/**/*.spec.{tsx,ts}',
      'src/components/adaptive/**/*'  // 排除 Adaptive 元件本身
    ]
  });

  console.log(`📁 找到 ${files.length} 個檔案需要檢查\n`);

  let processedFiles = 0;
  let modifiedFiles = 0;
  let totalRulesApplied = 0;
  const results = [];

  files.forEach(file => {
    const result = applyMigrationToFile(file, dryRun);
    processedFiles++;
    
    if (result.modified) {
      modifiedFiles++;
      totalRulesApplied += result.rules.length;
    }
    
    results.push({ file, ...result });
  });

  console.log(`\n📊 處理摘要:`);
  console.log(`   檢查檔案: ${processedFiles}`);
  console.log(`   修改檔案: ${modifiedFiles}`);
  console.log(`   應用規則: ${totalRulesApplied}`);
  
  if (dryRun) {
    console.log(`\n💡 這是預覽模式，沒有實際修改檔案`);
    console.log(`   執行 'node scripts/fix-adaptive-migration.js' 來實際應用修改`);
  } else {
    console.log(`\n🎉 遷移完成！建議接下來：`);
    console.log(`   1. 執行 npm run lint 檢查語法`);
    console.log(`   2. 執行 npm run web:build 驗證 Web 版本`);
    console.log(`   3. 測試關鍵功能確保正常運作`);
  }

  return results;
}

if (require.main === module) {
  main();
}

module.exports = { applyMigrationToFile, MIGRATION_RULES };