#!/usr/bin/env node

/**
 * 審查按鈕顏色使用情況
 * 找出所有使用了彩色而非灰階的按鈕
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// 不應該出現在按鈕中的顏色
const FORBIDDEN_COLORS = [
  // 藍色系
  '#007AFF',  // iOS 藍色
  '#0066CC',  // 深藍
  '#0070f3',  // Notion 藍
  '#2383e2',  // Notion alt 藍
  '#337ea9',  // Notion 進行中藍
  
  // 狀態色（只應用於狀態指示，不應用於按鈕背景）
  '#34C759',  // 成功綠
  '#FF3B30',  // 錯誤紅
  '#FF9500',  // 警告橙
  '#5856D6',  // 資訊紫
];

// 正確的灰階顏色
const CORRECT_COLORS = {
  primary: '#2C2C2C',
  primaryHover: '#3C3C3C',
  primaryPressed: '#1C1C1C',
  secondary: '#F7F7F7',
  secondaryHover: '#ECECEC',
  secondaryPressed: '#E0E0E0',
};

function getLineNumber(content, searchStr, startPos = 0) {
  const index = content.indexOf(searchStr, startPos);
  if (index === -1) return -1;
  
  const lines = content.substring(0, index).split('\n');
  return lines.length;
}

function extractContext(content, lineNum, contextLines = 2) {
  const lines = content.split('\n');
  const start = Math.max(0, lineNum - contextLines - 1);
  const end = Math.min(lines.length, lineNum + contextLines);
  
  return lines.slice(start, end).map((line, i) => {
    const currentLineNum = start + i + 1;
    const marker = currentLineNum === lineNum ? '>>> ' : '    ';
    return `${marker}${currentLineNum}: ${line}`;
  }).join('\n');
}

function auditButtonColors() {
  console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}    按鈕顏色審查工具${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);
  
  const files = glob.sync('src/**/*.{tsx,ts}', {
    ignore: [
      '**/node_modules/**',
      '**/*.test.{tsx,ts}',
      '**/*.spec.{tsx,ts}',
      '**/database/web/**',  // 排除 Notion database 相關
    ]
  });
  
  console.log(`${colors.gray}掃描 ${files.length} 個檔案...${colors.reset}\n`);
  
  const issues = {
    hardcodedColors: [],
    wrongDesignSystem: [],
    suspiciousPatterns: []
  };
  
  let scannedButtons = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 只檢查包含按鈕的檔案
    if (!content.match(/Button|button|btn|Btn/)) {
      return;
    }
    
    scannedButtons++;
    
    // 檢查硬編碼的禁用顏色
    FORBIDDEN_COLORS.forEach(color => {
      let lastIndex = 0;
      let index;
      
      while ((index = content.indexOf(color, lastIndex)) !== -1) {
        const lineNum = getLineNumber(content, color, lastIndex);
        const context = extractContext(content, lineNum);
        
        // 檢查是否在按鈕相關的上下文中
        const surroundingText = content.substring(
          Math.max(0, index - 100),
          Math.min(content.length, index + 100)
        );
        
        if (surroundingText.match(/button|Button|btn|Btn|press|Press|click|Click/i)) {
          issues.hardcodedColors.push({
            file: path.relative(process.cwd(), file),
            color,
            line: lineNum,
            context
          });
        }
        
        lastIndex = index + 1;
      }
    });
    
    // 檢查錯誤的 DesignSystem 使用
    const wrongPatterns = [
      {
        pattern: /backgroundColor:\s*DesignSystem\.colors\.(info|success|error|warning)/g,
        description: '按鈕使用了狀態色而非按鈕色'
      },
      {
        pattern: /backgroundColor:\s*['"`]#(?!2C2C2C|3C3C3C|1C1C1C|F7F7F7|ECECEC|E0E0E0|FFFFFF)[0-9A-Fa-f]{6}/g,
        description: '按鈕使用了非灰階顏色'
      },
      {
        pattern: /(?:Button|button)[\s\S]{0,200}backgroundColor:\s*['"`]#(?:00|FF)[0-9A-Fa-f]{4}/g,
        description: '按鈕附近有鮮豔顏色'
      }
    ];
    
    wrongPatterns.forEach(({ pattern, description }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = getLineNumber(content, match[0]);
        const context = extractContext(content, lineNum);
        
        issues.wrongDesignSystem.push({
          file: path.relative(process.cwd(), file),
          pattern: description,
          match: match[0],
          line: lineNum,
          context
        });
      }
    });
    
    // 檢查可疑的按鈕樣式模式
    const suspiciousPatterns = [
      /variant=['"`](success|danger|warning|info)['"`]/g,
      /color=['"`](blue|green|red|orange|purple)['"`]/g,
      /type=['"`](primary|secondary)['"`][\s\S]{0,100}color:/g
    ];
    
    suspiciousPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = getLineNumber(content, match[0]);
        const context = extractContext(content, lineNum, 1);
        
        issues.suspiciousPatterns.push({
          file: path.relative(process.cwd(), file),
          pattern: match[0],
          line: lineNum,
          context
        });
      }
    });
  });
  
  // 輸出報告
  console.log(`${colors.yellow}掃描完成！檢查了 ${scannedButtons} 個包含按鈕的檔案${colors.reset}\n`);
  
  // 硬編碼顏色問題
  if (issues.hardcodedColors.length > 0) {
    console.log(`${colors.red}❌ 發現 ${issues.hardcodedColors.length} 個硬編碼顏色問題：${colors.reset}\n`);
    issues.hardcodedColors.forEach(issue => {
      console.log(`${colors.yellow}檔案: ${issue.file}:${issue.line}${colors.reset}`);
      console.log(`${colors.red}顏色: ${issue.color}${colors.reset}`);
      console.log(`${colors.gray}${issue.context}${colors.reset}\n`);
    });
  }
  
  // 錯誤的設計系統使用
  if (issues.wrongDesignSystem.length > 0) {
    console.log(`${colors.red}❌ 發現 ${issues.wrongDesignSystem.length} 個錯誤的設計系統使用：${colors.reset}\n`);
    issues.wrongDesignSystem.forEach(issue => {
      console.log(`${colors.yellow}檔案: ${issue.file}:${issue.line}${colors.reset}`);
      console.log(`${colors.red}問題: ${issue.pattern}${colors.reset}`);
      console.log(`${colors.magenta}匹配: ${issue.match}${colors.reset}`);
      console.log(`${colors.gray}${issue.context}${colors.reset}\n`);
    });
  }
  
  // 可疑模式
  if (issues.suspiciousPatterns.length > 0) {
    console.log(`${colors.yellow}⚠️  發現 ${issues.suspiciousPatterns.length} 個可疑模式：${colors.reset}\n`);
    issues.suspiciousPatterns.forEach(issue => {
      console.log(`${colors.yellow}檔案: ${issue.file}:${issue.line}${colors.reset}`);
      console.log(`${colors.cyan}模式: ${issue.pattern}${colors.reset}`);
      console.log(`${colors.gray}${issue.context}${colors.reset}\n`);
    });
  }
  
  // 總結
  const totalIssues = issues.hardcodedColors.length + 
                      issues.wrongDesignSystem.length + 
                      issues.suspiciousPatterns.length;
  
  if (totalIssues === 0) {
    console.log(`${colors.green}✅ 太好了！沒有發現按鈕顏色問題${colors.reset}`);
  } else {
    console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.yellow}總計發現 ${totalIssues} 個潛在問題${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);
    
    console.log(`${colors.gray}正確的按鈕顏色應該是：${colors.reset}`);
    Object.entries(CORRECT_COLORS).forEach(([name, color]) => {
      console.log(`  ${name}: ${color}`);
    });
    
    console.log(`\n${colors.gray}建議執行修復腳本：${colors.reset}`);
    console.log(`  ${colors.cyan}node scripts/fix-button-colors.js${colors.reset}`);
  }
  
  // 生成 JSON 報告
  const report = {
    timestamp: new Date().toISOString(),
    filesScanned: files.length,
    filesWithButtons: scannedButtons,
    issues,
    summary: {
      hardcodedColors: issues.hardcodedColors.length,
      wrongDesignSystem: issues.wrongDesignSystem.length,
      suspiciousPatterns: issues.suspiciousPatterns.length,
      total: totalIssues
    }
  };
  
  fs.writeFileSync(
    'button-color-audit.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n${colors.gray}詳細報告已儲存至 button-color-audit.json${colors.reset}`);
  
  return totalIssues;
}

// 執行審查
const issueCount = auditButtonColors();
process.exit(issueCount > 0 ? 1 : 0);