#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 開始深度掃描所有可能的樣式問題...\n');

const issues = {
  shadowOffset: [],
  transform: [],
  spreadOperator: [],
  arrayStyles: [],
  dynamicStyles: [],
  platformSelect: [],
  responsiveCalls: [],
  unknownPatterns: []
};

// 掃描所有 TypeScript 和 TSX 檔案
const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'dist/**', 'build/**', '**/*.test.*', '**/*.spec.*']
});

console.log(`掃描 ${files.length} 個檔案...\n`);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // 1. 檢查 shadowOffset (最關鍵的問題)
    if (line.includes('shadowOffset') && !line.includes('Platform.OS')) {
      // 檢查是否在條件判斷外
      const prevLines = lines.slice(Math.max(0, index - 3), index).join('\n');
      const nextLines = lines.slice(index + 1, Math.min(lines.length, index + 4)).join('\n');
      
      if (!prevLines.includes('Platform.OS') && !nextLines.includes('Platform.OS')) {
        issues.shadowOffset.push({
          file,
          line: lineNum,
          content: line.trim(),
          context: `${prevLines}\n>>> ${line} <<<\n${nextLines}`
        });
      }
    }
    
    // 2. 檢查 transform 陣列
    if (line.includes('transform:') && line.includes('[') && line.includes('{')) {
      if (!line.includes('Platform.OS')) {
        issues.transform.push({
          file,
          line: lineNum,
          content: line.trim()
        });
      }
    }
    
    // 3. 檢查危險的 spread operator 使用
    if (line.includes('...') && (line.includes('shadow') || line.includes('transform'))) {
      issues.spreadOperator.push({
        file,
        line: lineNum,
        content: line.trim()
      });
    }
    
    // 4. 檢查陣列樣式（可能不相容）
    if (line.match(/style\s*=\s*\[/) || line.match(/styles:\s*\[/)) {
      issues.arrayStyles.push({
        file,
        line: lineNum,
        content: line.trim()
      });
    }
    
    // 5. 檢查動態樣式計算（可能產生問題）
    if (line.includes('StyleSheet.flatten') || line.includes('StyleSheet.compose')) {
      issues.dynamicStyles.push({
        file,
        line: lineNum,
        content: line.trim()
      });
    }
    
    // 6. 檢查 Platform.select 使用
    if (line.includes('Platform.select')) {
      const fullStatement = extractFullStatement(lines, index);
      if (fullStatement.includes('shadowOffset') || fullStatement.includes('transform')) {
        issues.platformSelect.push({
          file,
          line: lineNum,
          content: fullStatement
        });
      }
    }
    
    // 7. 檢查 responsive() 函數調用
    if (line.includes('responsive(')) {
      const fullCall = extractFullStatement(lines, index);
      if (fullCall.includes('shadow') || fullCall.includes('transform')) {
        issues.responsiveCalls.push({
          file,
          line: lineNum,
          content: fullCall
        });
      }
    }
    
    // 8. 尋找其他可疑模式
    if (line.match(/\[\s*\{.*\}\s*\]/) && !line.includes('//') && !line.includes('/*')) {
      // 陣列內含物件的模式
      if (line.includes('style') || line.includes('Style')) {
        issues.unknownPatterns.push({
          file,
          line: lineNum,
          content: line.trim(),
          pattern: 'array-with-object'
        });
      }
    }
  });
});

// 輸出報告
console.log('===== 掃描結果報告 =====\n');

let totalIssues = 0;
let criticalIssues = [];

// shadowOffset 問題（最關鍵）
if (issues.shadowOffset.length > 0) {
  console.log(`❌ shadowOffset 問題: ${issues.shadowOffset.length} 處`);
  console.log('   這是造成 CSSStyleDeclaration 錯誤的主要原因！\n');
  issues.shadowOffset.slice(0, 3).forEach(issue => {
    console.log(`   📍 ${issue.file}:${issue.line}`);
    console.log(`      ${issue.content}`);
    criticalIssues.push(issue);
  });
  if (issues.shadowOffset.length > 3) {
    console.log(`   ... 還有 ${issues.shadowOffset.length - 3} 處\n`);
  }
  totalIssues += issues.shadowOffset.length;
}

// transform 問題
if (issues.transform.length > 0) {
  console.log(`⚠️  transform 陣列問題: ${issues.transform.length} 處`);
  issues.transform.slice(0, 2).forEach(issue => {
    console.log(`   📍 ${issue.file}:${issue.line}`);
  });
  console.log();
  totalIssues += issues.transform.length;
}

// spread operator 問題
if (issues.spreadOperator.length > 0) {
  console.log(`⚠️  Spread operator 風險: ${issues.spreadOperator.length} 處`);
  issues.spreadOperator.slice(0, 2).forEach(issue => {
    console.log(`   📍 ${issue.file}:${issue.line}`);
    console.log(`      ${issue.content}`);
  });
  console.log();
  totalIssues += issues.spreadOperator.length;
}

// Platform.select 問題
if (issues.platformSelect.length > 0) {
  console.log(`⚠️  Platform.select 包含不相容屬性: ${issues.platformSelect.length} 處`);
  issues.platformSelect.slice(0, 2).forEach(issue => {
    console.log(`   📍 ${issue.file}:${issue.line}`);
  });
  console.log();
  totalIssues += issues.platformSelect.length;
}

// responsive() 問題
if (issues.responsiveCalls.length > 0) {
  console.log(`⚠️  responsive() 函數問題: ${issues.responsiveCalls.length} 處`);
  issues.responsiveCalls.slice(0, 2).forEach(issue => {
    console.log(`   📍 ${issue.file}:${issue.line}`);
  });
  console.log();
  totalIssues += issues.responsiveCalls.length;
}

// 陣列樣式
if (issues.arrayStyles.length > 0) {
  console.log(`ℹ️  陣列樣式使用: ${issues.arrayStyles.length} 處`);
  totalIssues += issues.arrayStyles.length;
}

// 動態樣式
if (issues.dynamicStyles.length > 0) {
  console.log(`ℹ️  動態樣式計算: ${issues.dynamicStyles.length} 處`);
  totalIssues += issues.dynamicStyles.length;
}

// 未知模式
if (issues.unknownPatterns.length > 0) {
  console.log(`❓ 可疑模式: ${issues.unknownPatterns.length} 處`);
  issues.unknownPatterns.slice(0, 2).forEach(issue => {
    console.log(`   📍 ${issue.file}:${issue.line}`);
    console.log(`      Pattern: ${issue.pattern}`);
    console.log(`      ${issue.content}`);
  });
  console.log();
  totalIssues += issues.unknownPatterns.length;
}

console.log('===============================');
console.log(`總計發現 ${totalIssues} 個潛在問題`);

if (criticalIssues.length > 0) {
  console.log('\n🚨 關鍵問題詳情:');
  criticalIssues.forEach(issue => {
    console.log(`\n檔案: ${issue.file}:${issue.line}`);
    console.log('上下文:');
    console.log(issue.context);
  });
}

// 儲存詳細報告
const report = {
  timestamp: new Date().toISOString(),
  totalFiles: files.length,
  totalIssues,
  issues,
  criticalIssues
};

fs.writeFileSync('style-issues-report.json', JSON.stringify(report, null, 2));
console.log('\n詳細報告已儲存至 style-issues-report.json');

// 提供修復建議
console.log('\n💡 建議修復策略:');
console.log('1. 優先處理 shadowOffset 問題 - 這是錯誤的根源');
console.log('2. 確保所有 shadowOffset 都包裹在 Platform.OS 條件中');
console.log('3. 檢查 responsive() 函數的實作');
console.log('4. 審查所有 spread operator 的使用');

// Helper function
function extractFullStatement(lines, startIndex) {
  let statement = '';
  let braceCount = 0;
  let inStatement = false;
  
  for (let i = startIndex; i < Math.min(lines.length, startIndex + 20); i++) {
    const line = lines[i];
    statement += line + '\n';
    
    if (line.includes('Platform.select')) inStatement = true;
    if (!inStatement) continue;
    
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;
    
    if (inStatement && braceCount === 0) break;
  }
  
  return statement.trim();
}