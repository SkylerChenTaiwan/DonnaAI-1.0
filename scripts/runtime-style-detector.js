#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔎 執行 Runtime 樣式檢測 - 找出所有可能在運行時產生問題的樣式\n');

const criticalIssues = [];
const suspiciousPatterns = [];

// 掃描所有檔案
const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'dist/**', 'build/**', '**/*.test.*', '**/*.spec.*']
});

console.log(`掃描 ${files.length} 個檔案...\n`);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // 1. 最關鍵：檢查直接傳遞給 style prop 的物件
    if (line.includes('style={') && !line.includes('StyleSheet.create')) {
      // 檢查是否包含危險的屬性
      const nextLines = lines.slice(index, Math.min(lines.length, index + 20)).join('\n');
      
      if (nextLines.includes('shadowOffset:') || 
          nextLines.includes('shadowOffset :') ||
          nextLines.includes('transform:') ||
          nextLines.includes('transform :')) {
        
        // 檢查是否有 Platform.OS 保護
        if (!nextLines.includes('Platform.OS')) {
          criticalIssues.push({
            file,
            line: lineNum,
            type: 'CRITICAL: Inline style with shadowOffset/transform',
            content: line.trim(),
            context: nextLines.substring(0, 200)
          });
        }
      }
    }
    
    // 2. 檢查陣列樣式（React Native Web 可能不支援）
    if (line.includes('style={[') || line.includes('style={ [')) {
      const styleMatch = line.match(/style=\{?\[([^\]]+)\]/);
      if (styleMatch) {
        suspiciousPatterns.push({
          file,
          line: lineNum,
          type: 'Array style',
          content: line.trim()
        });
      }
    }
    
    // 3. 檢查動態樣式計算
    if (line.includes('...') && line.includes('style')) {
      // 展開運算符在樣式中
      if (!line.includes('Platform.OS')) {
        suspiciousPatterns.push({
          file,
          line: lineNum,
          type: 'Spread operator in style without Platform check',
          content: line.trim()
        });
      }
    }
    
    // 4. 檢查條件樣式（可能包含不相容的屬性）
    if (line.match(/style=\{[^}]*\?[^}]*:/)) {
      const ternaryMatch = line.match(/style=\{([^}]+)\}/);
      if (ternaryMatch && (ternaryMatch[1].includes('shadow') || ternaryMatch[1].includes('transform'))) {
        criticalIssues.push({
          file,
          line: lineNum,
          type: 'Conditional style with shadow/transform',
          content: line.trim()
        });
      }
    }
    
    // 5. 檢查樣式物件定義
    if (line.match(/const\s+\w+Style\s*=\s*\{/) || line.match(/\w+Style\s*:\s*\{/)) {
      const blockEnd = findBlockEnd(lines, index);
      const styleBlock = lines.slice(index, blockEnd).join('\n');
      
      if (styleBlock.includes('shadowOffset:') && !styleBlock.includes('Platform.')) {
        criticalIssues.push({
          file,
          line: lineNum,
          type: 'Style object with unprotected shadowOffset',
          content: styleBlock.substring(0, 150)
        });
      }
    }
    
    // 6. 檢查 StyleSheet.create
    if (line.includes('StyleSheet.create')) {
      const blockEnd = findBlockEnd(lines, index);
      const styleBlock = lines.slice(index, blockEnd).join('\n');
      
      // 檢查是否有不安全的樣式
      const unsafeProps = ['shadowOffset:', 'transform:', 'elevation:'];
      unsafeProps.forEach(prop => {
        if (styleBlock.includes(prop)) {
          // 檢查是否在同一個區塊內有 Platform 檢查
          const propIndex = styleBlock.indexOf(prop);
          const nearbyCode = styleBlock.substring(Math.max(0, propIndex - 100), propIndex + 100);
          
          if (!nearbyCode.includes('Platform.')) {
            suspiciousPatterns.push({
              file,
              line: lineNum,
              type: `StyleSheet.create with ${prop}`,
              content: nearbyCode.trim()
            });
          }
        }
      });
    }
    
    // 7. 特別檢查 responsive() 函數
    if (line.includes('responsive(')) {
      const funcCall = extractFunctionCall(lines, index, 'responsive');
      if (funcCall.includes('shadow') || funcCall.includes('transform')) {
        criticalIssues.push({
          file,
          line: lineNum,
          type: 'responsive() with incompatible properties',
          content: funcCall.substring(0, 150)
        });
      }
    }
    
    // 8. 檢查匯入的樣式
    if (line.includes('import') && line.includes('styles')) {
      // 標記需要檢查的匯入
      suspiciousPatterns.push({
        file,
        line: lineNum,
        type: 'Style import - needs verification',
        content: line.trim()
      });
    }
  });
});

// 輸出報告
console.log('===== Runtime 樣式檢測報告 =====\n');

if (criticalIssues.length > 0) {
  console.log('🚨 關鍵問題（必須修復）:');
  console.log(`發現 ${criticalIssues.length} 個關鍵問題\n`);
  
  criticalIssues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue.type}`);
    console.log(`   📍 ${issue.file}:${issue.line}`);
    console.log(`   內容: ${issue.content.substring(0, 80)}...`);
    if (issue.context) {
      console.log(`   上下文: ${issue.context.substring(0, 100)}...`);
    }
    console.log();
  });
}

if (suspiciousPatterns.length > 0) {
  console.log('\n⚠️  可疑模式（需要檢查）:');
  console.log(`發現 ${suspiciousPatterns.length} 個可疑模式\n`);
  
  // 只顯示前 10 個
  suspiciousPatterns.slice(0, 10).forEach((pattern, idx) => {
    console.log(`${idx + 1}. ${pattern.type}`);
    console.log(`   📍 ${pattern.file}:${pattern.line}`);
    console.log(`   內容: ${pattern.content.substring(0, 80)}...`);
  });
  
  if (suspiciousPatterns.length > 10) {
    console.log(`\n... 還有 ${suspiciousPatterns.length - 10} 個可疑模式`);
  }
}

// 儲存詳細報告
const report = {
  timestamp: new Date().toISOString(),
  criticalCount: criticalIssues.length,
  suspiciousCount: suspiciousPatterns.length,
  criticalIssues,
  suspiciousPatterns: suspiciousPatterns.slice(0, 50) // 只儲存前 50 個
};

fs.writeFileSync('runtime-style-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 詳細報告已儲存至 runtime-style-report.json');

// 建議
console.log('\n💡 修復建議:');
console.log('1. 優先修復所有 CRITICAL 標記的問題');
console.log('2. 為所有 inline styles 添加 Platform.OS 檢查');
console.log('3. 將 shadowOffset 和 transform 移到 Platform.select 中');
console.log('4. 使用 webSafeStyles 工具函數包裝所有樣式');

if (criticalIssues.length > 0) {
  console.log('\n🛠 建議立即執行修復腳本');
  process.exit(1);
}

// Helper functions
function findBlockEnd(lines, startIndex) {
  let braceCount = 0;
  let inBlock = false;
  
  for (let i = startIndex; i < Math.min(lines.length, startIndex + 100); i++) {
    const line = lines[i];
    if (line.includes('{')) {
      braceCount += (line.match(/\{/g) || []).length;
      inBlock = true;
    }
    if (line.includes('}')) {
      braceCount -= (line.match(/\}/g) || []).length;
    }
    if (inBlock && braceCount === 0) {
      return i + 1;
    }
  }
  return Math.min(lines.length, startIndex + 20);
}

function extractFunctionCall(lines, startIndex, funcName) {
  let parenCount = 0;
  let result = '';
  let inFunc = false;
  
  for (let i = startIndex; i < Math.min(lines.length, startIndex + 10); i++) {
    const line = lines[i];
    if (line.includes(funcName + '(')) inFunc = true;
    if (!inFunc) continue;
    
    result += line + '\n';
    parenCount += (line.match(/\(/g) || []).length;
    parenCount -= (line.match(/\)/g) || []).length;
    
    if (inFunc && parenCount === 0) break;
  }
  
  return result;
}