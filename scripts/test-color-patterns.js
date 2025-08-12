#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');

function checkColorPatterns() {
  console.log('🔍 檢查顏色拼接模式...\n');
  
  const files = glob.sync('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/colorUtils.ts'],
  });
  
  const issues = [];
  
  // 危險模式列表
  const dangerousPatterns = [
    /\+\s*['"][0-9A-Fa-f]{2}['"]/g,  // 任何 + '20' 格式
    /color.*\+\s*['"][\w]+['"]/gi,    // color + 任何字串
  ];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      dangerousPatterns.forEach(pattern => {
        // 重置正則表達式的 lastIndex
        pattern.lastIndex = 0;
        if (pattern.test(line) && !line.includes('withAlpha')) {
          issues.push({
            file: file,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    });
  });
  
  if (issues.length > 0) {
    console.log('❌ 發現潛在的顏色拼接問題:\n');
    issues.forEach(issue => {
      console.log(`${issue.file}:${issue.line}`);
      console.log(`  ${issue.content}\n`);
    });
    process.exit(1);
  } else {
    console.log('✅ 沒有發現顏色拼接問題！');
  }
}

checkColorPatterns();