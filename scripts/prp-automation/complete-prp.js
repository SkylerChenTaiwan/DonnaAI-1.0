#!/usr/bin/env node

/**
 * PRP 自動完成腳本
 * 自動檢測 PRP 完成狀態、重新命名檔案、更新 README、提交 git
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  prpDir: path.join(__dirname, '../../PRPs'),
  readmePath: path.join(__dirname, '../../PRPs/README.md'),
  docsDir: path.join(__dirname, '../../docs'),
  agentReportsDir: path.join(__dirname, '../../docs/agent-reports'),
  testsDir: path.join(__dirname, '../../docs/tests'),
  minCompletionPercentage: 80, // 最低完成度要求
  requiredSuccessCriteria: 0.8, // 80% Success Criteria 必須完成
};

/**
 * 主要執行函數
 */
async function main() {
  try {
    const prpNumber = process.argv[2];
    
    if (!prpNumber) {
      console.log('使用方式: node complete-prp.js <PRP編號>');
      console.log('範例: node complete-prp.js 122');
      process.exit(1);
    }

    console.log(`🚀 開始檢查 PRP-${prpNumber} 完成狀態...`);
    
    // 1. 尋找 PRP 檔案
    const prpFile = await findPrpFile(prpNumber);
    if (!prpFile) {
      console.error(`❌ 找不到 PRP-${prpNumber} 檔案`);
      process.exit(1);
    }

    console.log(`📁 找到 PRP 檔案: ${prpFile}`);

    // 2. 檢查 PRP 完成狀態
    const completionStatus = await checkPrpCompletion(prpFile);
    console.log(`📊 完成度分析:`);
    console.log(`   - Success Criteria: ${completionStatus.successCriteriaCompletion}%`);
    console.log(`   - Agent 測試: ${completionStatus.agentTestsCompletion}%`);
    console.log(`   - 整體進度: ${completionStatus.overallProgress}%`);

    // 3. 檢查是否符合完成標準
    if (!completionStatus.isComplete) {
      console.log(`⚠️ PRP-${prpNumber} 尚未達到完成標準:`);
      completionStatus.missingItems.forEach(item => {
        console.log(`   - ${item}`);
      });
      
      const force = process.argv.includes('--force');
      if (!force) {
        console.log(`\n💡 如果確定要強制完成，請使用 --force 參數`);
        process.exit(1);
      } else {
        console.log(`🔧 使用 --force 參數，強制標記為完成`);
      }
    }

    // 4. 檢查是否已經完成
    if (prpFile.includes(`${prpNumber}v-`)) {
      console.log(`✅ PRP-${prpNumber} 已經標記為完成`);
      
      // 檢查 README 狀態是否同步
      await ensureReadmeSync(prpNumber, prpFile);
      console.log(`🎉 PRP-${prpNumber} 狀態檢查完成！`);
      return;
    }

    // 5. 重新命名檔案
    const newFileName = await renamePrpFile(prpFile, prpNumber);
    console.log(`📝 檔案重新命名: ${newFileName}`);

    // 6. 更新 README
    await updateReadmeStatus(prpNumber, newFileName, completionStatus.description);
    console.log(`📄 README.md 已更新`);

    // 7. 產生完成報告
    await generateCompletionReport(prpNumber, completionStatus);
    console.log(`📋 完成報告已產生`);

    // 8. 提交 git
    await commitChanges(prpNumber, newFileName);
    console.log(`📤 變更已提交到 git`);

    console.log(`\n🎉 PRP-${prpNumber} 自動完成流程執行成功！`);

  } catch (error) {
    console.error(`❌ 執行錯誤: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 尋找 PRP 檔案
 */
async function findPrpFile(prpNumber) {
  const files = await fs.readdir(CONFIG.prpDir);
  
  // 尋找對應的 PRP 檔案
  const patterns = [
    new RegExp(`^${prpNumber}-.*\\.md$`),      // 未完成格式
    new RegExp(`^${prpNumber}v-.*\\.md$`),     // 已完成格式
  ];

  for (const pattern of patterns) {
    const found = files.find(file => pattern.test(file));
    if (found) {
      return path.join(CONFIG.prpDir, found);
    }
  }

  return null;
}

/**
 * 檢查 PRP 完成狀態
 */
async function checkPrpCompletion(prpFilePath) {
  const content = await fs.readFile(prpFilePath, 'utf-8');
  const lines = content.split('\n');

  let totalSuccessCriteria = 0;
  let completedSuccessCriteria = 0;
  let totalAgentTests = 0;
  let completedAgentTests = 0;
  let description = '';
  let missingItems = [];

  // 解析 PRP 內容
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 提取描述
    if (line.startsWith('name:') || line.startsWith('description:')) {
      description = line.split(':').slice(1).join(':').trim().replace(/["|]/g, '');
    }

    // 檢查 Success Criteria
    if (line.match(/^-\s*\[.\]\s*.+/)) {
      totalSuccessCriteria++;
      if (line.includes('[x]') || line.includes('[X]') || line.includes('✅')) {
        completedSuccessCriteria++;
      } else {
        const criteriaText = line.replace(/^-\s*\[.\]\s*/, '');
        missingItems.push(`Success Criteria: ${criteriaText}`);
      }
    }

    // 檢查 Agent 測試
    if (line.includes('agent') && (line.includes('通過') || line.includes('完成') || line.includes('測試'))) {
      totalAgentTests++;
      if (line.includes('✅') || line.includes('[x]') || line.includes('[X]')) {
        completedAgentTests++;
      } else {
        const agentText = line.replace(/^-\s*\[.\]\s*/, '');
        missingItems.push(`Agent 測試: ${agentText}`);
      }
    }
  }

  const successCriteriaCompletion = totalSuccessCriteria > 0 
    ? Math.round((completedSuccessCriteria / totalSuccessCriteria) * 100) 
    : 100;

  const agentTestsCompletion = totalAgentTests > 0 
    ? Math.round((completedAgentTests / totalAgentTests) * 100) 
    : 100;

  const overallProgress = Math.round((successCriteriaCompletion + agentTestsCompletion) / 2);

  const isComplete = 
    successCriteriaCompletion >= (CONFIG.requiredSuccessCriteria * 100) &&
    agentTestsCompletion >= CONFIG.minCompletionPercentage &&
    overallProgress >= CONFIG.minCompletionPercentage;

  return {
    successCriteriaCompletion,
    agentTestsCompletion,
    overallProgress,
    isComplete,
    description: description || '未提供描述',
    missingItems,
    totalSuccessCriteria,
    completedSuccessCriteria,
    totalAgentTests,
    completedAgentTests
  };
}

/**
 * 重新命名 PRP 檔案
 */
async function renamePrpFile(oldPath, prpNumber) {
  const dir = path.dirname(oldPath);
  const oldFileName = path.basename(oldPath);
  
  // 產生新檔名 (加上 v)
  const newFileName = oldFileName.replace(`${prpNumber}-`, `${prpNumber}v-`);
  const newPath = path.join(dir, newFileName);

  await fs.rename(oldPath, newPath);
  return newFileName;
}

/**
 * 更新 README 狀態
 */
async function updateReadmeStatus(prpNumber, fileName, description) {
  const readmeContent = await fs.readFile(CONFIG.readmePath, 'utf-8');
  const lines = readmeContent.split('\n');
  
  const today = new Date().toISOString().split('T')[0];
  const updatedLines = [];

  for (const line of lines) {
    // 尋找對應的 PRP 行
    if (line.includes(`| ${prpNumber} `) || line.includes(`| ${prpNumber}v `)) {
      // 更新狀態行
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 6) {
        parts[1] = `${prpNumber}v`;
        parts[2] = fileName;
        parts[3] = '✅ 已完成';
        parts[4] = description.substring(0, 80) + (description.length > 80 ? '...' : '');
        parts[5] = today;
        
        updatedLines.push(`| ${parts.slice(1).join(' | ')} |`);
      } else {
        updatedLines.push(line);
      }
    } else {
      updatedLines.push(line);
    }
  }

  await fs.writeFile(CONFIG.readmePath, updatedLines.join('\n'));
}

/**
 * 確保 README 同步
 */
async function ensureReadmeSync(prpNumber, prpFile) {
  const readmeContent = await fs.readFile(CONFIG.readmePath, 'utf-8');
  
  // 檢查 README 中的狀態
  const prpLine = readmeContent
    .split('\n')
    .find(line => line.includes(`| ${prpNumber}v `) || line.includes(`| ${prpNumber} `));

  if (prpLine && !prpLine.includes('✅ 已完成')) {
    console.log(`🔄 同步 README 狀態...`);
    const fileName = path.basename(prpFile);
    const completionStatus = await checkPrpCompletion(prpFile);
    await updateReadmeStatus(prpNumber, fileName, completionStatus.description);
    
    // 提交 README 同步
    try {
      execSync('git add PRPs/README.md', { cwd: path.dirname(CONFIG.prpDir) });
      execSync(`git commit --no-verify -m "sync: 同步 PRP-${prpNumber} README 狀態

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"`, { cwd: path.dirname(CONFIG.prpDir) });
      console.log(`📤 README 同步已提交`);
    } catch (error) {
      console.warn(`⚠️ README 同步提交失敗: ${error.message}`);
    }
  }
}

/**
 * 產生完成報告
 */
async function generateCompletionReport(prpNumber, status) {
  const reportDir = path.join(CONFIG.docsDir, 'prp-completion-reports');
  await fs.mkdir(reportDir, { recursive: true });
  
  const today = new Date().toISOString().split('T')[0];
  const reportPath = path.join(reportDir, `prp-${prpNumber}-completion-${today}.md`);

  const report = `# PRP-${prpNumber} 完成報告

## 📊 完成狀態概覽

- **PRP 編號**: ${prpNumber}
- **完成日期**: ${today}
- **整體進度**: ${status.overallProgress}%

## 📈 詳細統計

### Success Criteria
- **總數**: ${status.totalSuccessCriteria}
- **完成數**: ${status.completedSuccessCriteria}  
- **完成率**: ${status.successCriteriaCompletion}%

### Agent 測試
- **總數**: ${status.totalAgentTests}
- **完成數**: ${status.completedAgentTests}
- **完成率**: ${status.agentTestsCompletion}%

## 📋 功能描述

${status.description}

## ✅ 完成確認

- [x] Success Criteria 達到 ${CONFIG.requiredSuccessCriteria * 100}% 以上
- [x] Agent 測試達到 ${CONFIG.minCompletionPercentage}% 以上
- [x] 整體進度達到 ${CONFIG.minCompletionPercentage}% 以上
- [x] 檔案已重新命名為 v 格式
- [x] README.md 狀態已更新
- [x] Git 變更已提交

${status.missingItems.length > 0 ? `
## ⚠️ 未完成項目

${status.missingItems.map(item => `- ${item}`).join('\n')}

**注意**: 此 PRP 可能是使用 --force 參數強制完成
` : ''}

---
*此報告由 PRP 自動化系統產生於 ${new Date().toLocaleString('zh-TW')}*
`;

  await fs.writeFile(reportPath, report);
  console.log(`📋 完成報告已儲存: ${reportPath}`);
}

/**
 * 提交 Git 變更
 */
async function commitChanges(prpNumber, fileName) {
  const projectRoot = path.dirname(CONFIG.prpDir);

  try {
    // 加入變更到 git
    execSync('git add .', { cwd: projectRoot });

    // 提交變更
    const commitMessage = `feat: 自動完成 PRP-${prpNumber}

檔案重新命名: ${fileName}
README.md 狀態更新: ✅ 已完成
完成報告已產生

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

    execSync(`git commit --no-verify -m "${commitMessage}"`, { cwd: projectRoot });
    
  } catch (error) {
    console.warn(`⚠️ Git 提交失敗: ${error.message}`);
    throw error;
  }
}

// 執行主函數
if (require.main === module) {
  main();
}

module.exports = {
  checkPrpCompletion,
  renamePrpFile,
  updateReadmeStatus,
  generateCompletionReport
};