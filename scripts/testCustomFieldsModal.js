const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class CustomFieldsModalTester {
  constructor() {
    this.baseUrl = 'http://localhost:52706';
    this.testResults = [];
    this.screenshotDir = path.join(__dirname, '../tests/screenshots/modal-testing');
    
    // 確保截圖目錄存在
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async runCompleteTest() {
    console.log('🚀 開始 CustomFieldsModal 視覺測試...');
    
    const browser = await puppeteer.launch({
      headless: false, // 顯示瀏覽器以便觀察
      devtools: true,
      slowMo: 200, // 放慢操作
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    try {
      const page = await browser.newPage();
      
      // 測試階段 1: 初始頁面載入
      console.log('📸 測試階段 1: 頁面初始狀態');
      await this.testInitialPageLoad(page);
      
      // 測試階段 2: 導航到協助標籤
      console.log('📸 測試階段 2: 導航到協助標籤');
      await this.testNavigationToAssistanceTab(page);
      
      // 測試階段 3: Modal 觸發
      console.log('📸 測試階段 3: Modal 觸發測試');
      await this.testModalTrigger(page);
      
      // 測試階段 4: Modal 功能驗證
      console.log('📸 測試階段 4: Modal 功能完整性');
      await this.testModalFunctionality(page);
      
      // 產生報告
      await this.generateReport();
      
      console.log('✅ 測試完成！按 Enter 關閉瀏覽器...');
      await new Promise(resolve => process.stdin.once('data', resolve));
      
    } catch (error) {
      console.error('❌ 測試過程中發生錯誤:', error);
    } finally {
      await browser.close();
    }
  }

  async testInitialPageLoad(page) {
    const stageName = 'initial-load';
    const result = { stage: stageName, issues: [], screenshots: [] };
    
    try {
      // 訪問應用程式首頁
      console.log(`   → 訪問 ${this.baseUrl}`);
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // 等待應用程式載入
      await page.waitForTimeout(3000);
      
      // 擷取初始狀態
      const screenshotPath = path.join(this.screenshotDir, `${stageName}-homepage.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshots.push(screenshotPath);
      console.log(`   ✅ 擷取首頁截圖: ${screenshotPath}`);
      
      // 檢查是否意外顯示了 Modal
      const modalVisible = await page.evaluate(() => {
        const modals = document.querySelectorAll('[data-testid="adaptive-modal"], .modal, [class*="modal"]');
        return Array.from(modals).some(modal => {
          const style = window.getComputedStyle(modal);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        });
      });
      
      if (modalVisible) {
        result.issues.push({
          severity: 'critical',
          description: '頁面載入時意外顯示了 Modal',
          expected: '頁面載入時不應顯示任何 Modal',
          actual: '檢測到可見的 Modal 元素'
        });
      } else {
        console.log('   ✅ 確認頁面載入時沒有顯示 Modal');
      }
      
    } catch (error) {
      result.issues.push({
        severity: 'critical',
        description: '初始頁面載入失敗',
        error: error.message
      });
    }
    
    this.testResults.push(result);
  }

  async testNavigationToAssistanceTab(page) {
    const stageName = 'navigation-assistance';
    const result = { stage: stageName, issues: [], screenshots: [] };
    
    try {
      // 嘗試導航到組織管理頁面
      // 注意：這可能需要根據實際的路由結構調整
      console.log('   → 嘗試導航到組織管理頁面');
      
      // 等待並尋找可能的導航元素
      await page.waitForTimeout(2000);
      
      // 檢查是否有管理或組織相關的連結
      const navigationFound = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a, button, [role="button"]'));
        const adminLink = links.find(link => 
          link.textContent.includes('管理') || 
          link.textContent.includes('組織') ||
          link.textContent.includes('Admin') ||
          link.href?.includes('admin')
        );
        
        if (adminLink) {
          adminLink.click();
          return true;
        }
        return false;
      });
      
      if (navigationFound) {
        await page.waitForTimeout(2000);
        console.log('   ✅ 找到並點擊了管理相關連結');
      } else {
        // 如果沒有找到導航，直接嘗試訪問組織詳情頁面
        const orgDetailUrl = `${this.baseUrl}/admin/organization/1HuFLKCrQBOQUp3cURLv`;
        console.log(`   → 直接訪問組織詳情頁面: ${orgDetailUrl}`);
        await page.goto(orgDetailUrl, { waitUntil: 'networkidle2' });
      }
      
      // 等待頁面載入
      await page.waitForTimeout(3000);
      
      // 擷取當前狀態
      const screenshotPath = path.join(this.screenshotDir, `${stageName}-current-page.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshots.push(screenshotPath);
      
      // 尋找協助標籤
      const assistanceTabFound = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button, [role="tab"], .tab'));
        return tabs.some(tab => 
          tab.textContent.includes('協助') ||
          tab.textContent.includes('assistance') ||
          tab.textContent.includes('幫助')
        );
      });
      
      if (assistanceTabFound) {
        console.log('   ✅ 找到協助標籤');
        
        // 點擊協助標籤
        await page.evaluate(() => {
          const tabs = Array.from(document.querySelectorAll('button, [role="tab"], .tab'));
          const assistanceTab = tabs.find(tab => 
            tab.textContent.includes('協助') ||
            tab.textContent.includes('assistance') ||
            tab.textContent.includes('幫助')
          );
          if (assistanceTab) {
            assistanceTab.click();
          }
        });
        
        await page.waitForTimeout(1000);
        
        // 擷取點擊協助標籤後的狀態
        const assistanceScreenshot = path.join(this.screenshotDir, `${stageName}-assistance-tab.png`);
        await page.screenshot({ path: assistanceScreenshot, fullPage: true });
        result.screenshots.push(assistanceScreenshot);
        
      } else {
        result.issues.push({
          severity: 'major',
          description: '未找到協助標籤',
          expected: '應該有協助標籤可以點擊',
          actual: '頁面中沒有找到協助相關的標籤'
        });
      }
      
    } catch (error) {
      result.issues.push({
        severity: 'critical',
        description: '導航到協助標籤失敗',
        error: error.message
      });
    }
    
    this.testResults.push(result);
  }

  async testModalTrigger(page) {
    const stageName = 'modal-trigger';
    const result = { stage: stageName, issues: [], screenshots: [] };
    
    try {
      console.log('   → 尋找「查看欄位」按鈕');
      
      // 擷取點擊前的狀態
      const beforeClickScreenshot = path.join(this.screenshotDir, `${stageName}-before-click.png`);
      await page.screenshot({ path: beforeClickScreenshot, fullPage: true });
      result.screenshots.push(beforeClickScreenshot);
      
      // 尋找並點擊「查看欄位」按鈕
      const buttonFound = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"], .button'));
        const viewFieldsButton = buttons.find(btn => 
          btn.textContent.includes('查看欄位') ||
          btn.textContent.includes('欄位') ||
          btn.textContent.includes('field')
        );
        
        if (viewFieldsButton) {
          console.log('找到查看欄位按鈕:', viewFieldsButton.textContent);
          viewFieldsButton.click();
          return true;
        }
        return false;
      });
      
      if (buttonFound) {
        console.log('   ✅ 找到並點擊了「查看欄位」按鈕');
        
        // 等待 Modal 出現
        await page.waitForTimeout(1000);
        
        // 檢查 Modal 是否出現
        const modalAppeared = await page.evaluate(() => {
          const modals = document.querySelectorAll('[data-testid="adaptive-modal"], .modal, [class*="modal"]');
          return Array.from(modals).some(modal => {
            const style = window.getComputedStyle(modal);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          });
        });
        
        // 擷取點擊後的狀態
        const afterClickScreenshot = path.join(this.screenshotDir, `${stageName}-after-click.png`);
        await page.screenshot({ path: afterClickScreenshot, fullPage: true });
        result.screenshots.push(afterClickScreenshot);
        
        if (modalAppeared) {
          console.log('   ✅ Modal 成功出現');
          
          // 檢查 Modal 標題
          const modalTitle = await page.evaluate(() => {
            const titleElements = document.querySelectorAll('h1, h2, h3, .modal-title, [class*="title"]');
            for (let title of titleElements) {
              if (title.textContent.includes('自訂欄位') || title.textContent.includes('欄位管理')) {
                return title.textContent.trim();
              }
            }
            return null;
          });
          
          if (modalTitle) {
            console.log(`   ✅ Modal 標題正確: ${modalTitle}`);
          } else {
            result.issues.push({
              severity: 'minor',
              description: 'Modal 標題不明確',
              expected: '應該顯示「自訂欄位管理」或類似標題',
              actual: '未找到明確的 Modal 標題'
            });
          }
          
        } else {
          result.issues.push({
            severity: 'critical',
            description: '點擊按鈕後 Modal 沒有出現',
            expected: '點擊「查看欄位」按鈕應該打開 Modal',
            actual: 'Modal 沒有顯示'
          });
        }
        
      } else {
        result.issues.push({
          severity: 'critical',
          description: '未找到「查看欄位」按鈕',
          expected: '協助標籤中應該有「查看欄位」按鈕',
          actual: '頁面中沒有找到相關按鈕'
        });
      }
      
    } catch (error) {
      result.issues.push({
        severity: 'critical',
        description: 'Modal 觸發測試失敗',
        error: error.message
      });
    }
    
    this.testResults.push(result);
  }

  async testModalFunctionality(page) {
    const stageName = 'modal-functionality';
    const result = { stage: stageName, issues: [], screenshots: [] };
    
    try {
      console.log('   → 測試 Modal 功能完整性');
      
      // 檢查 Modal 是否可見
      const modalVisible = await page.evaluate(() => {
        const modals = document.querySelectorAll('[data-testid="adaptive-modal"], .modal, [class*="modal"]');
        return Array.from(modals).some(modal => {
          const style = window.getComputedStyle(modal);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        });
      });
      
      if (modalVisible) {
        // 測試標籤頁功能
        const tabs = await page.evaluate(() => {
          const tabButtons = Array.from(document.querySelectorAll('button, [role="tab"]'));
          return tabButtons.filter(tab => 
            tab.textContent.includes('檢視') ||
            tab.textContent.includes('匯入') ||
            tab.textContent.includes('新增') ||
            tab.textContent.includes('CSV')
          ).map(tab => tab.textContent.trim());
        });
        
        if (tabs.length > 0) {
          console.log(`   ✅ 找到 ${tabs.length} 個標籤頁:`, tabs);
          
          // 測試點擊不同標籤
          for (let i = 0; i < Math.min(tabs.length, 3); i++) {
            await page.evaluate((index) => {
              const tabButtons = Array.from(document.querySelectorAll('button, [role="tab"]'));
              const targetTabs = tabButtons.filter(tab => 
                tab.textContent.includes('檢視') ||
                tab.textContent.includes('匯入') ||
                tab.textContent.includes('新增') ||
                tab.textContent.includes('CSV')
              );
              if (targetTabs[index]) {
                targetTabs[index].click();
              }
            }, i);
            
            await page.waitForTimeout(500);
            
            const tabScreenshot = path.join(this.screenshotDir, `${stageName}-tab-${i}.png`);
            await page.screenshot({ path: tabScreenshot, fullPage: true });
            result.screenshots.push(tabScreenshot);
          }
        } else {
          result.issues.push({
            severity: 'major',
            description: 'Modal 中沒有找到標籤頁',
            expected: 'Modal 應該包含檢視、匯入、新增等標籤頁',
            actual: '沒有找到標籤頁元素'
          });
        }
        
        // 測試關閉按鈕
        const closeButtonFound = await page.evaluate(() => {
          const closeButtons = Array.from(document.querySelectorAll('button'));
          return closeButtons.some(btn => 
            btn.textContent.includes('✕') ||
            btn.textContent.includes('×') ||
            btn.textContent.includes('關閉') ||
            btn.classList.contains('close')
          );
        });
        
        if (closeButtonFound) {
          console.log('   ✅ 找到關閉按鈕');
          
          // 點擊關閉按鈕
          await page.evaluate(() => {
            const closeButtons = Array.from(document.querySelectorAll('button'));
            const closeBtn = closeButtons.find(btn => 
              btn.textContent.includes('✕') ||
              btn.textContent.includes('×') ||
              btn.textContent.includes('關閉') ||
              btn.classList.contains('close')
            );
            if (closeBtn) {
              closeBtn.click();
            }
          });
          
          await page.waitForTimeout(500);
          
          // 檢查 Modal 是否關閉
          const modalClosed = await page.evaluate(() => {
            const modals = document.querySelectorAll('[data-testid="adaptive-modal"], .modal, [class*="modal"]');
            return !Array.from(modals).some(modal => {
              const style = window.getComputedStyle(modal);
              return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            });
          });
          
          const closeTestScreenshot = path.join(this.screenshotDir, `${stageName}-after-close.png`);
          await page.screenshot({ path: closeTestScreenshot, fullPage: true });
          result.screenshots.push(closeTestScreenshot);
          
          if (modalClosed) {
            console.log('   ✅ Modal 成功關閉');
          } else {
            result.issues.push({
              severity: 'major',
              description: 'Modal 關閉功能異常',
              expected: '點擊關閉按鈕應該關閉 Modal',
              actual: 'Modal 仍然可見'
            });
          }
          
        } else {
          result.issues.push({
            severity: 'major',
            description: 'Modal 中沒有找到關閉按鈕',
            expected: 'Modal 應該有關閉按鈕',
            actual: '沒有找到關閉按鈕'
          });
        }
        
      } else {
        result.issues.push({
          severity: 'critical',
          description: 'Modal 不可見，無法測試功能',
          expected: 'Modal 應該是可見狀態',
          actual: 'Modal 不可見'
        });
      }
      
    } catch (error) {
      result.issues.push({
        severity: 'critical',
        description: 'Modal 功能測試失敗',
        error: error.message
      });
    }
    
    this.testResults.push(result);
  }

  async generateReport() {
    const timestamp = new Date().toLocaleString('zh-TW');
    const reportPath = path.join(this.screenshotDir, 'test-report.html');
    
    // 計算統計資訊
    const totalIssues = this.testResults.reduce((sum, result) => sum + result.issues.length, 0);
    const criticalIssues = this.testResults.reduce((sum, result) => 
      sum + result.issues.filter(issue => issue.severity === 'critical').length, 0);
    const majorIssues = this.testResults.reduce((sum, result) => 
      sum + result.issues.filter(issue => issue.severity === 'major').length, 0);
    const minorIssues = this.testResults.reduce((sum, result) => 
      sum + result.issues.filter(issue => issue.severity === 'minor').length, 0);
    
    const html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CustomFieldsModal 視覺測試報告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #007AFF, #0056B3);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .summary-card .number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .critical { color: #FF3B30; }
        .major { color: #FF9500; }
        .minor { color: #FFCC00; }
        .success { color: #34C759; }
        
        .test-stage {
            background: white;
            margin-bottom: 30px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .stage-header {
            background: #F2F2F7;
            padding: 20px;
            border-bottom: 1px solid #E5E5EA;
        }
        .stage-title {
            font-size: 1.5em;
            font-weight: bold;
            color: #1C1C1E;
            margin: 0;
        }
        .stage-content {
            padding: 20px;
        }
        .screenshots {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .screenshot {
            border: 1px solid #E5E5EA;
            border-radius: 8px;
            overflow: hidden;
        }
        .screenshot img {
            width: 100%;
            height: auto;
            display: block;
        }
        .screenshot-caption {
            padding: 10px;
            background: #F9F9F9;
            font-size: 0.9em;
            color: #666;
        }
        .issues {
            margin-top: 20px;
        }
        .issue {
            background: #FFF3CD;
            border: 1px solid #FFE69C;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .issue.critical {
            background: #F8D7DA;
            border-color: #F5C6CB;
        }
        .issue.major {
            background: #FFF3CD;
            border-color: #FFE69C;
        }
        .issue.minor {
            background: #D1ECF1;
            border-color: #BEE5EB;
        }
        .issue-severity {
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            text-transform: uppercase;
        }
        .issue-severity.critical {
            background: #FF3B30;
            color: white;
        }
        .issue-severity.major {
            background: #FF9500;
            color: white;
        }
        .issue-severity.minor {
            background: #007AFF;
            color: white;
        }
        .no-issues {
            color: #34C759;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            background: #D4EDDA;
            border-radius: 8px;
        }
        .recommendations {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin-top: 30px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .recommendations h2 {
            color: #007AFF;
            margin-top: 0;
        }
        .recommendation {
            background: #F2F2F7;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid #007AFF;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 CustomFieldsModal 視覺測試報告</h1>
        <p>測試時間: ${timestamp}</p>
        <p>測試目標: 驗證 CustomFieldsModal 修復效果和功能完整性</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <div class="number critical">${criticalIssues}</div>
            <div>嚴重問題</div>
        </div>
        <div class="summary-card">
            <div class="number major">${majorIssues}</div>
            <div>重要問題</div>
        </div>
        <div class="summary-card">
            <div class="number minor">${minorIssues}</div>
            <div>輕微問題</div>
        </div>
        <div class="summary-card">
            <div class="number success">${this.testResults.length}</div>
            <div>測試階段</div>
        </div>
    </div>

    ${this.testResults.map(result => `
        <div class="test-stage">
            <div class="stage-header">
                <h2 class="stage-title">
                    ${this.getStageTitle(result.stage)}
                    ${result.issues.length === 0 ? '✅' : '⚠️'}
                </h2>
            </div>
            <div class="stage-content">
                ${result.screenshots.length > 0 ? `
                    <div class="screenshots">
                        ${result.screenshots.map(screenshot => `
                            <div class="screenshot">
                                <img src="${path.basename(screenshot)}" alt="測試截圖" />
                                <div class="screenshot-caption">
                                    ${path.basename(screenshot)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="issues">
                    ${result.issues.length === 0 ? `
                        <div class="no-issues">
                            ✅ 此階段沒有發現問題
                        </div>
                    ` : `
                        <h3>發現的問題 (${result.issues.length})</h3>
                        ${result.issues.map(issue => `
                            <div class="issue ${issue.severity}">
                                <div class="issue-severity ${issue.severity}">${issue.severity}</div>
                                <h4>${issue.description}</h4>
                                ${issue.expected ? `<p><strong>預期：</strong>${issue.expected}</p>` : ''}
                                ${issue.actual ? `<p><strong>實際：</strong>${issue.actual}</p>` : ''}
                                ${issue.error ? `<p><strong>錯誤：</strong><code>${issue.error}</code></p>` : ''}
                            </div>
                        `).join('')}
                    `}
                </div>
            </div>
        </div>
    `).join('')}

    <div class="recommendations">
        <h2>📋 測試總結與建議</h2>
        
        ${criticalIssues === 0 && majorIssues === 0 ? `
            <div class="recommendation">
                <h3>🎉 測試結果優秀</h3>
                <p>CustomFieldsModal 修復成功，沒有發現嚴重或重要問題。Modal 功能正常，用戶體驗良好。</p>
            </div>
        ` : ''}
        
        ${criticalIssues > 0 ? `
            <div class="recommendation">
                <h3>🚨 需要立即修復</h3>
                <p>發現 ${criticalIssues} 個嚴重問題，這些問題會影響核心功能的使用，建議優先修復。</p>
            </div>
        ` : ''}
        
        ${majorIssues > 0 ? `
            <div class="recommendation">
                <h3>⚠️ 需要關注</h3>
                <p>發現 ${majorIssues} 個重要問題，雖然不影響基本功能，但會降低用戶體驗，建議儘快修復。</p>
            </div>
        ` : ''}
        
        <div class="recommendation">
            <h3>🔄 後續改進建議</h3>
            <ul>
                <li>定期執行自動化視覺測試，確保修復不會引入新問題</li>
                <li>增加更多邊界情況測試，如不同螢幕尺寸和瀏覽器</li>
                <li>考慮增加鍵盤操作和無障礙功能測試</li>
                <li>監控實際用戶使用情況，收集反饋進行持續優化</li>
            </ul>
        </div>
    </div>
</body>
</html>
    `;

    fs.writeFileSync(reportPath, html);
    console.log(`\n📊 測試報告已產生: ${reportPath}`);
    
    // 自動開啟報告
    const { exec } = require('child_process');
    exec(`open "${reportPath}"`);
    
    return reportPath;
  }

  getStageTitle(stage) {
    const titles = {
      'initial-load': '階段 1: 頁面初始狀態檢查',
      'navigation-assistance': '階段 2: 導航到協助標籤',
      'modal-trigger': '階段 3: Modal 觸發測試',
      'modal-functionality': '階段 4: Modal 功能驗證'
    };
    return titles[stage] || stage;
  }
}

// 執行測試
if (require.main === module) {
  const tester = new CustomFieldsModalTester();
  tester.runCompleteTest().catch(console.error);
}

module.exports = CustomFieldsModalTester;