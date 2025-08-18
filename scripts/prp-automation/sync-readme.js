#!/usr/bin/env node

/**
 * README 同步更新器
 * 自動同步 PRP 檔案狀態到 README.md
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { checkPrpCompletion } = require('./complete-prp');

// 配置
const CONFIG = {
  prpDir: path.join(__dirname, '../../PRPs'),
  readmePath: path.join(__dirname, '../../PRPs/README.md'),
};

/**
 * 主要執行函數
 */
async function main() {
  try {
    console.log('🔄 開始同步 README.md...\n');

    // 1. 取得所有 PRP 檔案
    const prpFiles = await getAllPrpFiles();
    console.log(`📁 找到 ${prpFiles.length} 個 PRP 檔案`);

    // 2. 分析每個 PRP
    const prpStatuses = new Map();
    for (const prpFile of prpFiles) {
      const status = await analyzePrpFile(prpFile);
      prpStatuses.set(status.number, status);
    }

    // 3. 讀取並更新 README
    const updated = await updateReadme(prpStatuses);

    if (updated) {
      console.log('\n✅ README.md 已更新');
      
      // 4. 提交變更
      if (process.argv.includes('--commit')) {
        await commitChanges();
        console.log('📤 變更已提交到 git');
      } else {
        console.log('💡 使用 --commit 參數來自動提交變更');
      }
    } else {
      console.log('\n✅ README.md 已是最新狀態');
    }

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
      isMarkedComplete,
      description: completionStatus.description,
      overallProgress: completionStatus.overallProgress,
      shouldBeComplete: completionStatus.isComplete
    };
  } catch (error) {
    console.warn(`⚠️ 無法分析 PRP-${prpNumber}: ${error.message}`);
    return {
      number: prpNumber,
      fileName,
      isMarkedComplete,
      description: '分析失敗',
      overallProgress: 0,
      shouldBeComplete: false
    };
  }
}

/**
 * 更新 README
 */
async function updateReadme(prpStatuses) {
  const readmeContent = await fs.readFile(CONFIG.readmePath, 'utf-8');
  const lines = readmeContent.split('\n');
  const today = new Date().toISOString().split('T')[0];
  
  let hasChanges = false;
  const updatedLines = [];

  for (const line of lines) {
    // 尋找 PRP 狀態行
    const match = line.match(/\|\s*(\d+)v?\s*\|/);
    if (match) {
      const prpNumber = match[1];
      const prpStatus = prpStatuses.get(prpNumber);
      
      if (prpStatus) {
        const currentParts = line.split('|').map(p => p.trim());
        
        if (currentParts.length >= 6) {
          const newId = prpStatus.isMarkedComplete ? `${prpNumber}v` : prpNumber;
          const newStatus = prpStatus.isMarkedComplete ? '✅ 已完成' : '📋 待執行';
          const newDate = prpStatus.isMarkedComplete ? today : '-';
          
          // 檢查是否需要更新
          const needsUpdate = 
            currentParts[1] !== newId ||
            currentParts[2] !== prpStatus.fileName ||
            currentParts[3] !== newStatus ||
            (prpStatus.isMarkedComplete && currentParts[5] === '-');

          if (needsUpdate) {
            hasChanges = true;
            const newLine = `| ${newId} | ${prpStatus.fileName} | ${newStatus} | ${prpStatus.description.substring(0, 80)}${prpStatus.description.length > 80 ? '...' : ''} | ${newDate} |`;
            updatedLines.push(newLine);
            console.log(`🔄 更新 PRP-${prpNumber}: ${newStatus}`);
          } else {
            updatedLines.push(line);
          }
        } else {
          updatedLines.push(line);
        }
      } else {
        // PRP 在 README 中但找不到對應檔案
        console.warn(`⚠️ PRP-${prpNumber} 在 README 中但找不到對應檔案`);
        updatedLines.push(line);
      }
    } else {
      updatedLines.push(line);
    }
  }

  if (hasChanges) {
    await fs.writeFile(CONFIG.readmePath, updatedLines.join('\n'));
    return true;
  }
  
  return false;
}

/**
 * 提交變更
 */
async function commitChanges() {
  const projectRoot = path.dirname(CONFIG.prpDir);

  try {
    execSync('git add PRPs/README.md', { cwd: projectRoot });
    
    const commitMessage = `sync: 自動同步 PRP README 狀態

根據檔案實際狀態更新 README.md 中的 PRP 追蹤表

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

    execSync(`git commit --no-verify -m "${commitMessage}"`, { cwd: projectRoot });
    
  } catch (error) {
    if (!error.message.includes('nothing to commit')) {
      throw error;
    }
  }
}

// 執行主函數
if (require.main === module) {
  main();
}