#!/usr/bin/env node

/**
 * 修復按鈕顏色問題
 * 將所有彩色按鈕改回灰階設計
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// ANSI 顏色碼
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// 顏色替換映射
const COLOR_REPLACEMENTS = {
  // 藍色系替換為主色
  '#007AFF': 'DesignSystem.colors.primary',
  '#0066CC': 'DesignSystem.colors.primary',
  '#0070f3': 'DesignSystem.colors.primary',
  '#2383e2': 'DesignSystem.colors.primary',
  '#337ea9': 'DesignSystem.colors.primary',
  '#3182CE': 'DesignSystem.colors.primary',
  '#1976d2': 'DesignSystem.colors.primary',
  '#3b82f6': 'DesignSystem.colors.primary',
  
  // 綠色系替換為主色或邊框
  '#22c55e': 'DesignSystem.colors.primary',
  '#34C759': 'DesignSystem.colors.primary',
  
  // 紅色系替換為邊框樣式
  '#FF3B30': 'DesignSystem.colors.status.error',
  '#FF6B6B': 'DesignSystem.colors.status.error',
  '#ef4444': 'DesignSystem.colors.status.error',
  
  // 其他顏色替換為灰階
  '#F8F9FA': 'DesignSystem.colors.gray50',
  '#f5f5f5': 'DesignSystem.colors.gray50',
  '#F7FAFC': 'DesignSystem.colors.gray50',
  '#e5e7eb': 'DesignSystem.colors.gray200',
  '#E2E8F0': 'DesignSystem.colors.gray200',
  '#e0e0e0': 'DesignSystem.colors.gray300',
  '#f8f8f8': 'DesignSystem.colors.gray100',
  
  // 特殊背景色
  '#e8f5e9': 'DesignSystem.colors.gray50',  // 成功背景改為淺灰
  '#ffebee': 'DesignSystem.colors.gray50',  // 錯誤背景改為淺灰
  '#e3f2fd': 'DesignSystem.colors.gray50',  // 資訊背景改為淺灰
  '#FFF5F5': 'DesignSystem.colors.gray50',
  '#FFF4E6': 'DesignSystem.colors.gray50',
  '#FFE5E5': 'DesignSystem.colors.gray50',
  '#FFF5E6': 'DesignSystem.colors.gray50',
};

// 需要特殊處理的檔案
const SPECIAL_CASES = {
  'src/components/database/styles/notionStyles.ts': {
    // Notion database 特殊樣式保留
    skip: false,
    replacements: {
      "backgroundColor: '#2383e2'": "backgroundColor: DesignSystem.colors.primary",
      "borderColor: '#2383e2'": "borderColor: DesignSystem.colors.primary",
    }
  },
  'src/components/database/SortPopover.tsx': {
    replacements: {
      "backgroundColor: '#2383e2'": "backgroundColor: DesignSystem.colors.primary",
    }
  },
  'src/components/database/FilterPopover.tsx': {
    replacements: {
      "backgroundColor: '#2383e2'": "backgroundColor: DesignSystem.colors.primary",
    }
  },
  'src/screens/database/DatabaseScreen.tsx': {
    replacements: {
      "backgroundColor: '#2383e2'": "backgroundColor: DesignSystem.colors.primary",
    }
  },
  'src/screens/profile/ProfileScreen.tsx': {
    replacements: {
      "borderColor: '#FF3B30'": "borderColor: DesignSystem.colors.status.error",
      "color: '#FF3B30'": "color: DesignSystem.colors.status.error",
    }
  }
};

function fixFile(filePath, dryRun = false) {
  const relativePath = path.relative(process.cwd(), filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changes = [];
  
  // 特殊檔案處理
  if (SPECIAL_CASES[relativePath]) {
    const special = SPECIAL_CASES[relativePath];
    
    if (special.skip) {
      return { changed: false, changes: [] };
    }
    
    if (special.replacements) {
      Object.entries(special.replacements).forEach(([from, to]) => {
        if (content.includes(from)) {
          content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
          changes.push({ from, to });
        }
      });
    }
  }
  
  // 一般顏色替換
  Object.entries(COLOR_REPLACEMENTS).forEach(([color, replacement]) => {
    const regex = new RegExp(color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    
    if (regex.test(content)) {
      // 檢查是否在按鈕相關的上下文中
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.match(regex)) {
          // 檢查前後幾行是否有按鈕相關的關鍵字
          const context = lines.slice(Math.max(0, index - 3), Math.min(lines.length, index + 4)).join('\n');
          if (context.match(/button|Button|btn|Btn|press|Press|click|Click|applyButton|primaryButton|secondaryButton|submitButton|cancelButton|actionButton/i)) {
            content = content.replace(regex, replacement);
            changes.push({ from: color, to: replacement, line: index + 1 });
          }
        }
      });
    }
  });
  
  // 修正錯誤的 DesignSystem 使用
  const wrongPatterns = [
    {
      pattern: /backgroundColor:\s*DesignSystem\.colors\.info/g,
      replacement: 'backgroundColor: DesignSystem.colors.primary'
    },
    {
      pattern: /backgroundColor:\s*DesignSystem\.colors\.success/g,
      replacement: 'backgroundColor: DesignSystem.colors.primary'
    },
    {
      pattern: /backgroundColor:\s*DesignSystem\.colors\.error/g,
      replacement: 'backgroundColor: DesignSystem.colors.primary'
    },
    {
      pattern: /backgroundColor:\s*DesignSystem\.colors\.warning/g,
      replacement: 'backgroundColor: DesignSystem.colors.primary'
    }
  ];
  
  wrongPatterns.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      const matches = content.match(pattern);
      content = content.replace(pattern, replacement);
      if (matches) {
        changes.push({ 
          from: matches[0], 
          to: replacement,
          type: 'pattern'
        });
      }
    }
  });
  
  // 修正按鈕 variant
  const variantPatterns = [
    {
      pattern: /variant=['"`]success['"`]/g,
      replacement: 'variant="primary"'
    },
    {
      pattern: /variant=['"`]danger['"`]/g,
      replacement: 'variant="outline"'
    },
    {
      pattern: /variant=['"`]warning['"`]/g,
      replacement: 'variant="secondary"'
    },
    {
      pattern: /variant=['"`]info['"`]/g,
      replacement: 'variant="primary"'
    }
  ];
  
  variantPatterns.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      const matches = content.match(pattern);
      content = content.replace(pattern, replacement);
      if (matches) {
        changes.push({ 
          from: matches[0], 
          to: replacement,
          type: 'variant'
        });
      }
    }
  });
  
  // 檢查是否需要導入 DesignSystem
  if (changes.length > 0 && content !== originalContent) {
    // 檢查是否已經導入 DesignSystem
    if (!content.includes("import { DesignSystem }") && 
        !content.includes("import DesignSystem") &&
        content.includes("DesignSystem.colors")) {
      // 尋找第一個 import 語句的位置
      const importMatch = content.match(/^import .* from ['"].*['"];?$/m);
      if (importMatch) {
        const importIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
        const importStatement = "\nimport { DesignSystem } from '@/theme/designSystem';";
        content = content.slice(0, importIndex) + importStatement + content.slice(importIndex);
        changes.push({ 
          type: 'import',
          added: importStatement.trim()
        });
      }
    }
  }
  
  const changed = content !== originalContent;
  
  if (changed && !dryRun) {
    fs.writeFileSync(filePath, content);
  }
  
  return { changed, changes, content };
}

function main(dryRun = false) {
  console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}    按鈕顏色修復工具${colors.reset}`);
  console.log(`${colors.cyan}    模式: ${dryRun ? '預覽' : '執行'}${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);
  
  const files = glob.sync('src/**/*.{tsx,ts}', {
    ignore: [
      '**/node_modules/**',
      '**/*.test.{tsx,ts}',
      '**/*.spec.{tsx,ts}',
      '**/database/web/NotionTheme.ts',  // 保留 Notion 主題檔案
      '**/database/web/design-tokens/**',  // 保留設計 tokens
    ]
  });
  
  console.log(`${colors.gray}掃描 ${files.length} 個檔案...${colors.reset}\n`);
  
  let totalFixed = 0;
  const fixedFiles = [];
  const allChanges = [];
  
  files.forEach(file => {
    const result = fixFile(file, dryRun);
    
    if (result.changed) {
      totalFixed++;
      const relativePath = path.relative(process.cwd(), file);
      fixedFiles.push(relativePath);
      
      console.log(`${colors.green}✓${colors.reset} ${colors.yellow}${relativePath}${colors.reset}`);
      
      result.changes.forEach(change => {
        if (change.type === 'import') {
          console.log(`  ${colors.cyan}+ 新增導入: ${change.added}${colors.reset}`);
        } else if (change.type === 'pattern') {
          console.log(`  ${colors.gray}  ${change.from} → ${change.to}${colors.reset}`);
        } else if (change.type === 'variant') {
          console.log(`  ${colors.blue}  ${change.from} → ${change.to}${colors.reset}`);
        } else {
          console.log(`  ${colors.gray}  ${change.from} → ${change.to}${change.line ? ` (行 ${change.line})` : ''}${colors.reset}`);
        }
      });
      
      allChanges.push({
        file: relativePath,
        changes: result.changes
      });
    }
  });
  
  console.log(`\n${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
  
  if (totalFixed === 0) {
    console.log(`${colors.green}✅ 太好了！沒有需要修復的按鈕顏色問題${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ ${dryRun ? '將會修復' : '已修復'} ${totalFixed} 個檔案的按鈕顏色問題${colors.reset}`);
    
    if (dryRun) {
      console.log(`\n${colors.yellow}這只是預覽模式。要實際執行修復，請執行：${colors.reset}`);
      console.log(`  ${colors.cyan}node scripts/fix-button-colors.js --fix${colors.reset}`);
    } else {
      // 生成修復報告
      const report = {
        timestamp: new Date().toISOString(),
        mode: dryRun ? 'dry-run' : 'fixed',
        filesFixed: totalFixed,
        files: fixedFiles,
        changes: allChanges
      };
      
      fs.writeFileSync(
        'button-color-fix-report.json',
        JSON.stringify(report, null, 2)
      );
      
      console.log(`\n${colors.gray}修復報告已儲存至 button-color-fix-report.json${colors.reset}`);
      
      console.log(`\n${colors.yellow}建議執行以下命令驗證修復：${colors.reset}`);
      console.log(`  ${colors.cyan}npm run web:build${colors.reset}`);
      console.log(`  ${colors.cyan}npm run web${colors.reset}`);
      console.log(`  ${colors.cyan}node scripts/audit-button-colors.js${colors.reset}`);
    }
  }
  
  return totalFixed;
}

// 解析命令列參數
const args = process.argv.slice(2);
const dryRun = !args.includes('--fix');

if (args.includes('--help')) {
  console.log(`
使用方式:
  node scripts/fix-button-colors.js        # 預覽模式（不修改檔案）
  node scripts/fix-button-colors.js --fix  # 執行修復
  node scripts/fix-button-colors.js --help # 顯示說明
`);
  process.exit(0);
}

// 執行修復
const fixed = main(dryRun);
process.exit(fixed > 0 && dryRun ? 1 : 0);
