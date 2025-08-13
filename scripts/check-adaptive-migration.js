#!/usr/bin/env node

/**
 * PRP-114 Adaptive 元件遷移檢測工具
 * 檢測所有需要替換為 Adaptive 元件的檔案
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 需要檢查的問題模式
const PROBLEM_PATTERNS = {
  'common-button': {
    pattern: /from ['"]@\/components\/common\/Button['"]/g,
    replacement: "from '@/components/adaptive'",
    elementPattern: /<Button/g,
    elementReplacement: '<AdaptiveButton',
    description: '使用 common/Button 而非 AdaptiveButton'
  },
  'common-textinput': {
    pattern: /from ['"]@\/components\/common\/TextInput['"]/g,
    replacement: "from '@/components/adaptive'", 
    elementPattern: /<TextInput/g,
    elementReplacement: '<AdaptiveInput',
    description: '使用 common/TextInput 而非 AdaptiveInput'
  },
  'react-native-switch': {
    pattern: /import\s*\{[^}]*Switch[^}]*\}\s*from\s*['"]react-native['"]/g,
    replacement: "import { AdaptiveSwitch } from '@/components/adaptive'",
    elementPattern: /<Switch/g,
    elementReplacement: '<AdaptiveSwitch',
    description: '直接使用 react-native Switch'
  },
  'react-native-textinput': {
    pattern: /import\s*\{[^}]*TextInput[^}]*\}\s*from\s*['"]react-native['"]/g,
    replacement: "import { AdaptiveInput } from '@/components/adaptive'",
    elementPattern: /<TextInput/g,
    elementReplacement: '<AdaptiveInput',
    description: '直接使用 react-native TextInput'
  },
  'react-native-button': {
    pattern: /import\s*\{[^}]*Button[^}]*\}\s*from\s*['"]react-native['"]/g,
    replacement: "import { AdaptiveButton } from '@/components/adaptive'",
    elementPattern: /<Button/g,
    elementReplacement: '<AdaptiveButton',
    description: '直接使用 react-native Button'
  },
  'react-native-modal': {
    pattern: /import\s*\{[^}]*Modal[^}]*\}\s*from\s*['"]react-native['"]/g,
    replacement: "import { AdaptiveModal } from '@/components/adaptive'",
    elementPattern: /<Modal/g,
    elementReplacement: '<AdaptiveModal',
    description: '直接使用 react-native Modal'
  }
};

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    for (const [type, config] of Object.entries(PROBLEM_PATTERNS)) {
      const importMatches = content.match(config.pattern);
      const elementMatches = content.match(config.elementPattern);
      
      if (importMatches || elementMatches) {
        issues.push({
          type,
          description: config.description,
          importMatches: importMatches ? importMatches.length : 0,
          elementMatches: elementMatches ? elementMatches.length : 0,
          config
        });
      }
    }
    
    return issues;
  } catch (error) {
    console.error(`讀取檔案失敗: ${filePath}`, error.message);
    return [];
  }
}

function generateReport() {
  console.log('🔍 掃描 Adaptive 元件遷移狀況...\n');
  
  // 尋找所有 TSX 檔案
  const files = glob.sync('src/**/*.{tsx,ts}', { 
    ignore: [
      'src/**/*.test.{tsx,ts}',
      'src/**/*.spec.{tsx,ts}',
      'src/components/adaptive/**/*'  // 排除 Adaptive 元件本身
    ]
  });
  
  console.log(`📁 檢查 ${files.length} 個檔案...\n`);
  
  const results = [];
  const summaryByType = {};
  
  files.forEach(file => {
    const issues = checkFile(file);
    if (issues.length > 0) {
      results.push({ file, issues });
      
      issues.forEach(issue => {
        if (!summaryByType[issue.type]) {
          summaryByType[issue.type] = {
            description: issue.description,
            files: 0,
            totalImports: 0,
            totalElements: 0
          };
        }
        summaryByType[issue.type].files++;
        summaryByType[issue.type].totalImports += issue.importMatches;
        summaryByType[issue.type].totalElements += issue.elementMatches;
      });
    }
  });
  
  // 輸出摘要報告
  console.log('📊 問題摘要:\n');
  console.log('問題類型'.padEnd(25) + '檔案數'.padEnd(10) + '描述');
  console.log('─'.repeat(80));
  
  for (const [type, summary] of Object.entries(summaryByType)) {
    console.log(`${type}`.padEnd(25) + `${summary.files}`.padEnd(10) + summary.description);
  }
  
  console.log('\n📋 需要修正的檔案清單:\n');
  
  // 按優先級排序（問題數量多的優先）
  results.sort((a, b) => b.issues.length - a.issues.length);
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.file}`);
    result.issues.forEach(issue => {
      console.log(`   ❌ ${issue.description} (匯入: ${issue.importMatches}, 元件: ${issue.elementMatches})`);
    });
    console.log('');
  });
  
  // 生成修正建議
  console.log('🛠️  修正建議:\n');
  console.log('1. 優先修正 Modal 相關檔案（用戶直接可見）');
  console.log('2. 修正高頻使用的 Button 和 TextInput');
  console.log('3. 系統性替換所有 react-native 直接匯入');
  console.log('4. 執行測試確保功能正常\n');
  
  // 生成統計數據
  const totalFiles = results.length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  
  console.log('📈 統計數據:');
  console.log(`   總檢查檔案: ${files.length}`);
  console.log(`   有問題檔案: ${totalFiles} (${((totalFiles/files.length)*100).toFixed(1)}%)`);
  console.log(`   總問題數量: ${totalIssues}`);
  console.log(`   平均每個問題檔案: ${(totalIssues/totalFiles).toFixed(1)} 個問題\n`);
  
  // 輸出到檔案
  const reportContent = {
    timestamp: new Date().toISOString(),
    summary: summaryByType,
    files: results,
    statistics: {
      totalFiles: files.length,
      problemFiles: totalFiles,
      problemRate: ((totalFiles/files.length)*100).toFixed(1),
      totalIssues
    }
  };
  
  const reportPath = 'docs/adaptive-migration-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(reportContent, null, 2));
  console.log(`📄 詳細報告已儲存至: ${reportPath}`);
  
  return results;
}

function main() {
  try {
    const results = generateReport();
    
    if (results.length === 0) {
      console.log('🎉 恭喜！沒有發現需要遷移的檔案！');
      process.exit(0);
    } else {
      console.log(`\n⚠️  發現 ${results.length} 個檔案需要遷移到 Adaptive 元件`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 檢查過程中發生錯誤:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, PROBLEM_PATTERNS };