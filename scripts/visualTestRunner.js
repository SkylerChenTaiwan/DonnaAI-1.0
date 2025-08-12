const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class VisualTestRunner {
  async runTest() {
    const browser = await puppeteer.launch({
      headless: false, // 設為 false 以便查看實際操作
      devtools: true,
      slowMo: 100 // 放慢操作以便觀察
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // 建立截圖目錄
    const screenshotDir = path.join(__dirname, '../tests/screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const results = [];
    
    // 測試每個階段
    for (let stage = 1; stage <= 4; stage++) {
      console.log(`📸 測試階段 ${stage}...`);
      
      // 導航到頁面
      await page.goto('http://localhost:3002/admin/organization/test');
      
      // 等待頁面載入
      await page.waitForSelector('.import-wizard', { timeout: 5000 });
      
      // 擷取截圖
      const screenshotPath = path.join(screenshotDir, `stage${stage}-${Date.now()}.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      
      // 測試互動元素
      const interactionResults = await this.testInteractions(page, stage);
      
      // 檢查對比度
      const contrastResults = await this.checkContrast(page);
      
      results.push({
        stage,
        screenshot: screenshotPath,
        interactions: interactionResults,
        contrast: contrastResults,
        timestamp: new Date().toISOString()
      });
      
      // 顯示即時結果
      console.log(`✅ 階段 ${stage} 測試完成`);
      console.log(`   截圖: ${screenshotPath}`);
      console.log(`   對比度: ${contrastResults.passed ? '✅ 通過' : '❌ 失敗'}`);
      console.log(`   互動: ${interactionResults.passed ? '✅ 正常' : '❌ 有問題'}`);
    }
    
    // 產生報告
    await this.generateReport(results);
    
    // 詢問是否繼續
    console.log('\n📋 測試完成！按 Enter 關閉瀏覽器...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    
    await browser.close();
  }
  
  async testInteractions(page, stage) {
    const results = { passed: true, details: [] };
    
    try {
      if (stage === 3) {
        // 特別測試下拉選單
        const selects = await page.$$('select');
        for (let i = 0; i < selects.length; i++) {
          const select = selects[i];
          
          // 擷取點擊前
          await page.screenshot({ 
            path: `tests/screenshots/select-${i}-before.png` 
          });
          
          // 點擊下拉選單
          await select.click();
          await page.waitForTimeout(200);
          
          // 擷取展開狀態
          await page.screenshot({ 
            path: `tests/screenshots/select-${i}-open.png` 
          });
          
          // 檢查選項
          const options = await select.$$('option');
          if (options.length === 0) {
            results.passed = false;
            results.details.push(`下拉選單 ${i} 沒有選項`);
          }
        }
      }
    } catch (error) {
      results.passed = false;
      results.details.push(error.message);
    }
    
    return results;
  }
  
  async checkContrast(page) {
    const results = await page.evaluate(() => {
      // 在瀏覽器中執行對比度檢查
      function getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }
      
      function getContrast(rgb1, rgb2) {
        const l1 = getLuminance(...rgb1);
        const l2 = getLuminance(...rgb2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      }
      
      // 檢查所有文字元素
      const elements = document.querySelectorAll('*');
      const issues = [];
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;
        
        if (color && bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
          // 解析顏色
          const colorMatch = color.match(/\d+/g);
          const bgMatch = bgColor.match(/\d+/g);
          
          if (colorMatch && bgMatch) {
            const ratio = getContrast(
              colorMatch.slice(0, 3).map(Number),
              bgMatch.slice(0, 3).map(Number)
            );
            
            if (ratio < 4.5) {
              issues.push({
                element: el.tagName + (el.className ? `.${el.className}` : ''),
                color,
                bgColor,
                ratio: ratio.toFixed(2)
              });
            }
          }
        }
      });
      
      return {
        passed: issues.length === 0,
        issues
      };
    });
    
    return results;
  }
  
  async generateReport(results) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>視覺測試報告 - ${new Date().toLocaleString('zh-TW')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .header { background: #2C2C2C; color: white; padding: 20px; }
    .stage { margin: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .stage-header { background: #f5f5f5; padding: 15px; font-size: 18px; font-weight: bold; }
    .screenshot { max-width: 100%; margin: 20px; border: 1px solid #ddd; }
    .issues { background: #fff3cd; padding: 15px; margin: 20px; border-radius: 4px; }
    .issue { margin: 10px 0; padding: 10px; background: white; border-left: 4px solid #ff9800; }
    .passed { background: #d4edda; color: #155724; }
    .failed { background: #f8d7da; color: #721c24; }
    .contrast-table { width: 100%; border-collapse: collapse; margin: 20px; }
    .contrast-table th, .contrast-table td { padding: 10px; border: 1px solid #ddd; }
    .low-contrast { background: #ffebee; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 資料匯入精靈 - 視覺測試報告</h1>
    <p>測試時間: ${new Date().toLocaleString('zh-TW')}</p>
  </div>
  
  ${results.map(r => `
    <div class="stage">
      <div class="stage-header">階段 ${r.stage}</div>
      <img src="${r.screenshot}" class="screenshot" />
      
      <div class="${r.contrast.passed ? 'passed' : 'failed'}">
        對比度測試: ${r.contrast.passed ? '✅ 通過' : `❌ 失敗 (${r.contrast.issues.length} 個問題)`}
      </div>
      
      ${r.contrast.issues.length > 0 ? `
        <div class="issues">
          <h3>對比度問題：</h3>
          <table class="contrast-table">
            <tr>
              <th>元素</th>
              <th>文字顏色</th>
              <th>背景顏色</th>
              <th>對比度</th>
              <th>最低要求</th>
            </tr>
            ${r.contrast.issues.map(issue => `
              <tr class="low-contrast">
                <td>${issue.element}</td>
                <td style="color: ${issue.color}">${issue.color}</td>
                <td style="background: ${issue.bgColor}">${issue.bgColor}</td>
                <td>${issue.ratio}</td>
                <td>4.5:1</td>
              </tr>
            `).join('')}
          </table>
        </div>
      ` : ''}
      
      <div class="${r.interactions.passed ? 'passed' : 'failed'}">
        互動測試: ${r.interactions.passed ? '✅ 正常' : '❌ 有問題'}
        ${r.interactions.details.length > 0 ? `
          <ul>
            ${r.interactions.details.map(d => `<li>${d}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    </div>
  `).join('')}
</body>
</html>
    `;
    
    const reportPath = path.join(__dirname, '../tests/reports/visual-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`\n📊 報告已產生: ${reportPath}`);
    
    // 自動開啟報告
    const { exec } = require('child_process');
    exec(`open ${reportPath}`);
  }
}

// 執行測試
if (require.main === module) {
  const runner = new VisualTestRunner();
  runner.runTest().catch(console.error);
}

module.exports = VisualTestRunner;