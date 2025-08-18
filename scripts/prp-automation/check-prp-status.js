#!/usr/bin/env node

/**
 * PRP 狀態檢查器
 * 掃描所有 PRP 檔案，檢查完成狀態，識別不一致的情況
 */

const fs = require('fs').promises;
const path = require('path');
const { checkPrpCompletion } = require('./complete-prp');

// 配置
const CONFIG = {
  prpDir: path.join(__dirname, '../../PRPs'),
  readmePath: path.join(__dirname, '../../PRPs/README.md'),
  outputDir: path.join(__dirname, '../../docs/prp-status-reports'),
};

/**
 * 主要執行函數
 */
async function main() {
  try {
    console.log('🔍 開始掃描 PRP 狀態...\n');

    // 1. 取得所有 PRP 檔案
    const prpFiles = await getAllPrpFiles();
    console.log(`📁 找到 ${prpFiles.length} 個 PRP 檔案\n`);

    // 2. 分析每個 PRP
    const results = [];
    for (const prpFile of prpFiles) {
      const result = await analyzePrpFile(prpFile);
      results.push(result);
    }

    // 3. 讀取 README 狀態
    const readmeStatuses = await parseReadmeStatus();

    // 4. 比較檔案狀態與 README 狀態
    const comparison = await compareStatuses(results, readmeStatuses);

    // 5. 產生報告
    await generateStatusReport(results, comparison);

    // 6. 顯示摘要
    displaySummary(results, comparison);

  } catch (error) {
    console.error(`❌ 執行錯誤: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 取得所有 PRP 檔案
 */
async function getAllPrpFiles() {
  const files = await fs.readdir(CONFIG.prpDir);
  
  return files
    .filter(file => file.endsWith('.md') && file.match(/^\d+v?-.*\.md$/))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/^(\d+)/)[1]);
      const bNum = parseInt(b.match(/^(\d+)/)[1]);
      return aNum - bNum;
    })
    .map(file => path.join(CONFIG.prpDir, file));
}

/**
 * 分析單個 PRP 檔案
 */
async function analyzePrpFile(prpFilePath) {
  const fileName = path.basename(prpFilePath);
  const prpNumber = fileName.match(/^(\d+)v?-/)[1];
  const isMarkedComplete = fileName.includes(`${prpNumber}v-`);

  try {
    const completionStatus = await checkPrpCompletion(prpFilePath);
    
    return {
      number: prpNumber,
      fileName,
      filePath: prpFilePath,
      isMarkedComplete,
      actualCompletion: completionStatus,
      status: determineStatus(isMarkedComplete, completionStatus),
    };
  } catch (error) {
    return {
      number: prpNumber,
      fileName,
      filePath: prpFilePath,
      isMarkedComplete,
      actualCompletion: null,
      status: 'error',
      error: error.message,
    };
  }
}

/**
 * 判斷 PRP 狀態
 */
function determineStatus(isMarkedComplete, completionStatus) {
  if (!completionStatus) return 'error';
  
  if (isMarkedComplete && completionStatus.isComplete) {
    return 'correctly-completed';
  } else if (!isMarkedComplete && !completionStatus.isComplete) {
    return 'correctly-incomplete';
  } else if (isMarkedComplete && !completionStatus.isComplete) {
    return 'falsely-marked-complete';
  } else if (!isMarkedComplete && completionStatus.isComplete) {
    return 'ready-to-complete';
  }
  
  return 'unknown';
}

/**
 * 解析 README 狀態
 */
async function parseReadmeStatus() {
  const readmeContent = await fs.readFile(CONFIG.readmePath, 'utf-8');
  const lines = readmeContent.split('\n');
  
  const statuses = {};
  
  for (const line of lines) {
    const match = line.match(/\|\s*(\d+)v?\s*\|.*\|\s*(✅ 已完成|📋 待執行|🔄 進行中)/);
    if (match) {
      const prpNumber = match[1];
      const status = match[2];
      statuses[prpNumber] = {
        status,
        line: line.trim(),
        isComplete: status === '✅ 已完成'
      };
    }
  }
  
  return statuses;
}

/**
 * 比較檔案狀態與 README 狀態
 */
async function compareStatuses(prpResults, readmeStatuses) {
  const inconsistencies = [];
  
  for (const prp of prpResults) {
    const readmeStatus = readmeStatuses[prp.number];
    
    if (!readmeStatus) {
      inconsistencies.push({
        type: 'missing-in-readme',
        prp,
        issue: 'PRP 檔案存在但 README 中沒有對應記錄'
      });
      continue;
    }
    
    const fileComplete = prp.isMarkedComplete;
    const readmeComplete = readmeStatus.isComplete;
    
    if (fileComplete !== readmeComplete) {
      inconsistencies.push({
        type: 'status-mismatch',
        prp,
        readmeStatus,
        issue: `檔案狀態 (${fileComplete ? '完成' : '未完成'}) 與 README 狀態 (${readmeComplete ? '完成' : '未完成'}) 不一致`
      });
    }
  }
  
  // 檢查 README 中有但檔案中沒有的
  for (const [prpNumber, readmeStatus] of Object.entries(readmeStatuses)) {
    const fileExists = prpResults.find(prp => prp.number === prpNumber);
    if (!fileExists) {
      inconsistencies.push({
        type: 'missing-file',
        prpNumber,
        readmeStatus,
        issue: 'README 中有記錄但找不到對應的 PRP 檔案'
      });
    }
  }
  
  return inconsistencies;
}

/**
 * 產生狀態報告
 */
async function generateStatusReport(results, inconsistencies) {
  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  
  const today = new Date().toISOString().split('T')[0];
  const reportPath = path.join(CONFIG.outputDir, `prp-status-${today}.md`);

  const completedCount = results.filter(r => r.status === 'correctly-completed').length;
  const incompleteCount = results.filter(r => r.status === 'correctly-incomplete').length;
  const readyCount = results.filter(r => r.status === 'ready-to-complete').length;
  const falseCompleteCount = results.filter(r => r.status === 'falsely-marked-complete').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  const report = `# PRP 狀態檢查報告

**檢查日期**: ${today}
**檢查時間**: ${new Date().toLocaleString('zh-TW')}

## 📊 總體統計

- **總 PRP 數量**: ${results.length}
- **正確完成**: ${completedCount}
- **正確未完成**: ${incompleteCount}
- **準備完成**: ${readyCount}
- **錯誤標記為完成**: ${falseCompleteCount}
- **檢查錯誤**: ${errorCount}
- **狀態不一致**: ${inconsistencies.length}

## 🎯 狀態分類

### ✅ 正確完成 (${completedCount})
${results
  .filter(r => r.status === 'correctly-completed')
  .map(r => `- PRP-${r.number}: ${r.fileName} (${r.actualCompletion?.overallProgress}%)`)
  .join('\n')}

### 📋 正確未完成 (${incompleteCount})
${results
  .filter(r => r.status === 'correctly-incomplete')
  .map(r => `- PRP-${r.number}: ${r.fileName} (${r.actualCompletion?.overallProgress}%)`)
  .join('\n')}

### 🚀 準備完成 (${readyCount})
${results
  .filter(r => r.status === 'ready-to-complete')
  .map(r => `- PRP-${r.number}: ${r.fileName} (${r.actualCompletion?.overallProgress}%) - **可以執行自動完成**`)
  .join('\n')}

### ⚠️ 錯誤標記為完成 (${falseCompleteCount})
${results
  .filter(r => r.status === 'falsely-marked-complete')
  .map(r => `- PRP-${r.number}: ${r.fileName} (${r.actualCompletion?.overallProgress}%) - 需要補完或回退`)
  .join('\n')}

### ❌ 檢查錯誤 (${errorCount})
${results
  .filter(r => r.status === 'error')
  .map(r => `- PRP-${r.number}: ${r.fileName} - ${r.error}`)
  .join('\n')}

## 🔍 狀態不一致問題 (${inconsistencies.length})

${inconsistencies.map(inc => `
### ${inc.type}
- **PRP**: ${inc.prp?.number || inc.prpNumber}
- **問題**: ${inc.issue}
${inc.prp ? `- **檔案**: ${inc.prp.fileName}` : ''}
${inc.readmeStatus ? `- **README 狀態**: ${inc.readmeStatus.status}` : ''}
`).join('\n')}

## 🛠 建議行動

### 立即執行
${readyCount > 0 ? `
**可以自動完成的 PRP**:
${results
  .filter(r => r.status === 'ready-to-complete')
  .map(r => `\`node scripts/prp-automation/complete-prp.js ${r.number}\``)
  .join('\n')}
` : '目前沒有準備完成的 PRP'}

### 需要修復
${falseCompleteCount > 0 ? `
**錯誤標記為完成的 PRP**:
${results
  .filter(r => r.status === 'falsely-marked-complete')
  .map(r => `- PRP-${r.number}: 需要補完剩餘工作或使用 --force 強制完成`)
  .join('\n')}
` : '沒有錯誤標記的 PRP'}

${inconsistencies.length > 0 ? `
**狀態不一致問題**:
${inconsistencies.map(inc => `- ${inc.issue}`).join('\n')}
` : '沒有狀態不一致問題'}

---
*此報告由 PRP 狀態檢查器自動產生*
`;

  await fs.writeFile(reportPath, report);
  console.log(`📋 狀態報告已產生: ${reportPath}`);
}

/**
 * 顯示摘要
 */
function displaySummary(results, inconsistencies) {
  console.log('\n📊 PRP 狀態摘要:');
  console.log(`   總數: ${results.length}`);
  console.log(`   ✅ 正確完成: ${results.filter(r => r.status === 'correctly-completed').length}`);
  console.log(`   📋 正確未完成: ${results.filter(r => r.status === 'correctly-incomplete').length}`);
  console.log(`   🚀 準備完成: ${results.filter(r => r.status === 'ready-to-complete').length}`);
  console.log(`   ⚠️ 錯誤標記: ${results.filter(r => r.status === 'falsely-marked-complete').length}`);
  console.log(`   ❌ 檢查錯誤: ${results.filter(r => r.status === 'error').length}`);
  console.log(`   🔍 狀態不一致: ${inconsistencies.length}`);

  const readyToComplete = results.filter(r => r.status === 'ready-to-complete');
  if (readyToComplete.length > 0) {
    console.log('\n🚀 可以立即完成的 PRP:');
    readyToComplete.forEach(prp => {
      console.log(`   node scripts/prp-automation/complete-prp.js ${prp.number}`);
    });
  }

  if (inconsistencies.length > 0) {
    console.log('\n⚠️ 發現狀態不一致，請查看詳細報告');
  }
}

// 執行主函數
if (require.main === module) {
  main();
}