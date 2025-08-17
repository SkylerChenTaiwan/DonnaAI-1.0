const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * CustomFieldsModal 修復驗證測試
 * 直接從組織詳情頁面開始測試
 */
class ModalFixTester {
  constructor() {
    this.baseUrl = 'http://localhost:8081';
    this.orgId = '1HuFLKCrQBOQUp3cURLv'; // 測試用組織 ID
    this.screenshotDir = path.join(__dirname, '../tests/screenshots/modal-fix');
    this.reportPath = path.join(__dirname, '../docs/modal-fix-report.md');
    
    // 確保目錄存在
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async runTest() {
    console.log('🚀 開始 CustomFieldsModal 修復驗證測試...\n');
    
    const browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: ['--window-size=1920,1080']
    });
    
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
    
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      // 測試 1: 檢查組織詳情頁面初始載入
      console.log('📋 測試 1: 檢查頁面初始載入...');
      const test1 = await this.testInitialLoad(page);
      testResults.tests.push(test1);
      
      // 測試 2: 檢查協助標籤
      console.log('📋 測試 2: 檢查協助標籤功能...');
      const test2 = await this.testAssistanceTab(page);
      testResults.tests.push(test2);
      
      // 測試 3: 測試 Modal 觸發
      console.log('📋 測試 3: 測試 Modal 觸發...');
      const test3 = await this.testModalTrigger(page);
      testResults.tests.push(test3);
      
      // 測試 4: 測試 Modal 功能
      console.log('📋 測試 4: 測試 Modal 功能完整性...');
      const test4 = await this.testModalFunctionality(page);
      testResults.tests.push(test4);
      
      // 計算總結
      testResults.tests.forEach(test => {
        testResults.summary.total++;
        if (test.passed) testResults.summary.passed++;
        else testResults.summary.failed++;
        if (test.severity === 'critical') testResults.summary.critical++;
      });
      
      // 產生報告
      await this.generateMarkdownReport(testResults);
      
      console.log('\n✅ 測試完成！');
      console.log(`📊 總計: ${testResults.summary.total} 個測試`);
      console.log(`✅ 通過: ${testResults.summary.passed}`);
      console.log(`❌ 失敗: ${testResults.summary.failed}`);
      console.log(`🔴 嚴重: ${testResults.summary.critical}`);
      console.log(`\n📄 報告已產生: ${this.reportPath}`);
      
      // 等待用戶確認
      console.log('\n按 Enter 關閉瀏覽器...');
      await new Promise(resolve => process.stdin.once('data', resolve));
      
    } catch (error) {
      console.error('❌ 測試執行失敗:', error);
    } finally {
      await browser.close();
    }
  }

  async testInitialLoad(page) {
    const testName = '頁面初始載入';
    const result = {
      name: testName,
      passed: true,
      severity: 'normal',
      issues: [],
      screenshots: []
    };
    
    try {
      // 直接訪問組織詳情頁面
      const url = `${this.baseUrl}/admin/organization/${this.orgId}`;
      console.log(`   → 訪問: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // 等待頁面載入
      await page.waitForTimeout(3000);
      
      // 擷取初始狀態
      const screenshotFile = `initial-load-${Date.now()}.png`;
      const screenshotPath = path.join(this.screenshotDir, screenshotFile);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshots.push(screenshotFile);
      
      // 檢查是否有 Modal 意外顯示
      const modalVisible = await page.evaluate(() => {
        // 檢查多種可能的 Modal 選擇器
        const selectors = [
          '[data-testid="adaptive-modal"]',
          '.modal',
          '[class*="modal"]',
          '[role="dialog"]',
          '.custom-fields-modal'
        ];
        
        for (let selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (let element of elements) {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            
            // 檢查元素是否真的可見
            if (style.display !== 'none' && 
                style.visibility !== 'hidden' && 
                parseFloat(style.opacity) > 0 &&
                rect.width > 0 && 
                rect.height > 0) {
              console.log('找到可見的 Modal:', selector, {
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                width: rect.width,
                height: rect.height
              });
              return true;
            }
          }
        }
        return false;
      });
      
      if (modalVisible) {
        result.passed = false;
        result.severity = 'critical';
        result.issues.push({
          type: 'modal-auto-show',
          message: '頁面載入時自動顯示了 Modal（應該隱藏）'
        });
        console.log('   ❌ 檢測到 Modal 自動顯示！');
      } else {
        console.log('   ✅ 頁面載入正常，沒有意外的 Modal');
      }
      
      // 檢查頁面結構是否正常
      const pageStructureOk = await page.evaluate(() => {
        const header = document.querySelector('header, [role="banner"], .header');
        const content = document.querySelector('main, [role="main"], .content');
        return header && content;
      });
      
      if (!pageStructureOk) {
        result.passed = false;
        result.issues.push({
          type: 'page-structure',
          message: '頁面結構異常，可能 UI 被破壞'
        });
      }
      
    } catch (error) {
      result.passed = false;
      result.severity = 'critical';
      result.issues.push({
        type: 'error',
        message: error.message
      });
    }
    
    return result;
  }

  async testAssistanceTab(page) {
    const testName = '協助標籤功能';
    const result = {
      name: testName,
      passed: true,
      severity: 'normal',
      issues: [],
      screenshots: []
    };
    
    try {
      // 尋找並點擊協助標籤
      const tabFound = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
        const assistanceTab = tabs.find(tab => 
          tab.textContent.includes('協助') ||
          tab.textContent.includes('Assistance') ||
          tab.textContent.includes('幫助')
        );
        
        if (assistanceTab) {
          assistanceTab.click();
          return true;
        }
        return false;
      });
      
      if (!tabFound) {
        result.passed = false;
        result.issues.push({
          type: 'tab-not-found',
          message: '找不到協助標籤'
        });
        console.log('   ❌ 找不到協助標籤');
        return result;
      }
      
      console.log('   ✅ 成功點擊協助標籤');
      await page.waitForTimeout(1000);
      
      // 擷取協助標籤內容
      const screenshotFile = `assistance-tab-${Date.now()}.png`;
      const screenshotPath = path.join(this.screenshotDir, screenshotFile);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshots.push(screenshotFile);
      
      // 檢查是否有「查看欄位」按鈕
      const buttonExists = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => 
          btn.textContent.includes('查看欄位') ||
          btn.textContent.includes('欄位') ||
          btn.textContent.includes('Fields')
        );
      });
      
      if (!buttonExists) {
        result.passed = false;
        result.issues.push({
          type: 'button-not-found',
          message: '協助標籤中找不到「查看欄位」按鈕'
        });
        console.log('   ❌ 找不到「查看欄位」按鈕');
      } else {
        console.log('   ✅ 找到「查看欄位」按鈕');
      }
      
    } catch (error) {
      result.passed = false;
      result.issues.push({
        type: 'error',
        message: error.message
      });
    }
    
    return result;
  }

  async testModalTrigger(page) {
    const testName = 'Modal 觸發測試';
    const result = {
      name: testName,
      passed: true,
      severity: 'normal',
      issues: [],
      screenshots: []
    };
    
    try {
      // 擷取點擊前的狀態
      const beforeFile = `before-click-${Date.now()}.png`;
      const beforePath = path.join(this.screenshotDir, beforeFile);
      await page.screenshot({ path: beforePath });
      result.screenshots.push(beforeFile);
      
      // 點擊「查看欄位」按鈕
      const buttonClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const viewFieldsBtn = buttons.find(btn => 
          btn.textContent.includes('查看欄位') ||
          btn.textContent.includes('欄位')
        );
        
        if (viewFieldsBtn) {
          console.log('點擊按鈕:', viewFieldsBtn.textContent);
          viewFieldsBtn.click();
          return true;
        }
        return false;
      });
      
      if (!buttonClicked) {
        result.passed = false;
        result.severity = 'critical';
        result.issues.push({
          type: 'button-click-failed',
          message: '無法點擊「查看欄位」按鈕'
        });
        console.log('   ❌ 無法點擊按鈕');
        return result;
      }
      
      console.log('   ✅ 成功點擊「查看欄位」按鈕');
      await page.waitForTimeout(1500);
      
      // 擷取點擊後的狀態
      const afterFile = `after-click-${Date.now()}.png`;
      const afterPath = path.join(this.screenshotDir, afterFile);
      await page.screenshot({ path: afterPath });
      result.screenshots.push(afterFile);
      
      // 檢查 Modal 是否出現
      const modalAppeared = await page.evaluate(() => {
        const selectors = [
          '[data-testid="adaptive-modal"]',
          '.modal',
          '[role="dialog"]'
        ];
        
        for (let selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (let element of elements) {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            
            if (style.display !== 'none' && 
                rect.width > 0 && 
                rect.height > 0) {
              return true;
            }
          }
        }
        return false;
      });
      
      if (!modalAppeared) {
        result.passed = false;
        result.severity = 'critical';
        result.issues.push({
          type: 'modal-not-shown',
          message: '點擊按鈕後 Modal 沒有出現'
        });
        console.log('   ❌ Modal 沒有出現');
      } else {
        console.log('   ✅ Modal 成功顯示');
      }
      
    } catch (error) {
      result.passed = false;
      result.issues.push({
        type: 'error',
        message: error.message
      });
    }
    
    return result;
  }

  async testModalFunctionality(page) {
    const testName = 'Modal 功能測試';
    const result = {
      name: testName,
      passed: true,
      severity: 'normal',
      issues: [],
      screenshots: []
    };
    
    try {
      // 檢查 Modal 標題
      const modalTitle = await page.evaluate(() => {
        const titles = document.querySelectorAll('h1, h2, h3, .modal-title');
        for (let title of titles) {
          if (title.textContent.includes('自訂欄位') || 
              title.textContent.includes('欄位管理')) {
            return title.textContent.trim();
          }
        }
        return null;
      });
      
      if (modalTitle) {
        console.log(`   ✅ Modal 標題: ${modalTitle}`);
      } else {
        result.issues.push({
          type: 'title-missing',
          message: 'Modal 標題不明確'
        });
      }
      
      // 檢查標籤頁
      const tabs = await page.evaluate(() => {
        const tabButtons = Array.from(document.querySelectorAll('button'));
        return tabButtons.filter(btn => 
          btn.textContent.includes('檢視') ||
          btn.textContent.includes('匯入') ||
          btn.textContent.includes('新增')
        ).map(btn => btn.textContent.trim());
      });
      
      if (tabs.length > 0) {
        console.log(`   ✅ 找到 ${tabs.length} 個標籤頁`);
      } else {
        result.passed = false;
        result.issues.push({
          type: 'tabs-missing',
          message: 'Modal 中沒有標籤頁'
        });
      }
      
      // 測試關閉功能
      const closeButtonFound = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const closeBtn = buttons.find(btn => 
          btn.textContent.includes('✕') ||
          btn.textContent.includes('×') ||
          btn.textContent.includes('關閉')
        );
        
        if (closeBtn) {
          closeBtn.click();
          return true;
        }
        return false;
      });
      
      if (closeButtonFound) {
        console.log('   ✅ 成功點擊關閉按鈕');
        await page.waitForTimeout(1000);
        
        // 檢查 Modal 是否關閉
        const modalClosed = await page.evaluate(() => {
          const selectors = [
            '[data-testid="adaptive-modal"]',
            '.modal',
            '[role="dialog"]'
          ];
          
          for (let selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (let element of elements) {
              const style = window.getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              
              if (style.display !== 'none' && 
                  rect.width > 0 && 
                  rect.height > 0) {
                return false;
              }
            }
          }
          return true;
        });
        
        if (modalClosed) {
          console.log('   ✅ Modal 成功關閉');
        } else {
          result.passed = false;
          result.issues.push({
            type: 'close-failed',
            message: 'Modal 關閉功能異常'
          });
        }
      } else {
        result.issues.push({
          type: 'close-button-missing',
          message: '找不到關閉按鈕'
        });
      }
      
      // 擷取最終狀態
      const finalFile = `final-state-${Date.now()}.png`;
      const finalPath = path.join(this.screenshotDir, finalFile);
      await page.screenshot({ path: finalPath });
      result.screenshots.push(finalFile);
      
    } catch (error) {
      result.passed = false;
      result.issues.push({
        type: 'error',
        message: error.message
      });
    }
    
    return result;
  }

  async generateMarkdownReport(testResults) {
    const report = `# CustomFieldsModal 修復驗證報告

## 測試摘要
- **測試時間**: ${new Date(testResults.timestamp).toLocaleString('zh-TW')}
- **測試總數**: ${testResults.summary.total}
- **通過**: ${testResults.summary.passed}
- **失敗**: ${testResults.summary.failed}
- **嚴重問題**: ${testResults.summary.critical}

## 測試結果

${testResults.tests.map(test => `
### ${test.passed ? '✅' : '❌'} ${test.name}
- **狀態**: ${test.passed ? '通過' : '失敗'}
- **嚴重度**: ${test.severity === 'critical' ? '🔴 嚴重' : '🟡 一般'}
${test.issues.length > 0 ? `
- **發現問題**:
${test.issues.map(issue => `  - ${issue.message}`).join('\n')}
` : ''}
${test.screenshots.length > 0 ? `
- **截圖**:
${test.screenshots.map(file => `  - ${file}`).join('\n')}
` : ''}
`).join('')}

## 結論

${testResults.summary.critical > 0 ? `
### 🔴 嚴重問題需要立即修復
發現 ${testResults.summary.critical} 個嚴重問題會影響用戶使用。
` : ''}

${testResults.summary.passed === testResults.summary.total ? `
### ✅ 所有測試通過
CustomFieldsModal 修復成功，功能正常運作。
` : `
### ⚠️ 部分測試失敗
有 ${testResults.summary.failed} 個測試失敗，需要進一步檢查。
`}

## 截圖位置
所有截圖保存在: \`${this.screenshotDir}\`

## 建議後續行動
1. ${testResults.summary.critical > 0 ? '立即修復嚴重問題' : '持續監控系統狀態'}
2. 定期執行自動化測試
3. 增加更多邊界案例測試
4. 收集用戶反饋持續優化

---
*報告產生時間: ${new Date().toLocaleString('zh-TW')}*
`;
    
    fs.writeFileSync(this.reportPath, report);
    console.log(`\n📄 Markdown 報告已產生: ${this.reportPath}`);
  }
}

// 執行測試
if (require.main === module) {
  const tester = new ModalFixTester();
  tester.runTest().catch(console.error);
}

module.exports = ModalFixTester;