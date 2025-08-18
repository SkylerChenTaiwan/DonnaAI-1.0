/**
 * 簡化版視覺測試
 * 用於檢查基本的設計系統元素
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  screenshotsDir: path.join(__dirname, '..', 'docs', 'tests', 'screenshots')
};

async function runSimpleTest() {
  console.log('🚀 啟動簡化視覺測試...');
  
  let browser = null;
  const results = { passed: 0, failed: 0, tests: [], screenshots: [] };
  
  try {
    // 確保截圖目錄存在
    if (!fs.existsSync(TEST_CONFIG.screenshotsDir)) {
      fs.mkdirSync(TEST_CONFIG.screenshotsDir, { recursive: true });
    }
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    
    const page = await browser.newPage();
    await page.setDefaultTimeout(TEST_CONFIG.timeout);
    
    console.log('📱 測試主頁面...');
    await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle2' });
    
    // 測試字體載入
    const fonts = await page.evaluate(() => {
      const style = window.getComputedStyle(document.body);
      return {
        fontFamily: style.fontFamily,
        isGeistLoaded: style.fontFamily.includes('Geist')
      };
    });
    
    if (fonts.isGeistLoaded) {
      results.passed++;
      results.tests.push({ name: 'Geist 字體載入', status: 'passed', details: fonts.fontFamily });
      console.log('✅ Geist 字體載入成功');
    } else {
      results.failed++;
      results.tests.push({ name: 'Geist 字體載入', status: 'failed', details: fonts.fontFamily });
      console.log('❌ Geist 字體載入失敗:', fonts.fontFamily);
    }
    
    // 測試顏色變數
    const colors = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      return {
        primary: rootStyle.getPropertyValue('--primary').trim(),
        background: rootStyle.getPropertyValue('--background').trim(),
        textPrimary: rootStyle.getPropertyValue('--text-primary').trim()
      };
    });
    
    if (colors.primary === '#2C2C2C') {
      results.passed++;
      results.tests.push({ name: '主要顏色設定', status: 'passed', details: colors });
      console.log('✅ 主要顏色設定正確');
    } else {
      results.failed++;
      results.tests.push({ name: '主要顏色設定', status: 'failed', details: colors });
      console.log('❌ 主要顏色設定錯誤:', colors);
    }
    
    // 截圖測試不同斷點
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 1024 }
    ];
    
    for (const bp of breakpoints) {
      try {
        await page.setViewport({ width: bp.width, height: bp.height });
        await page.waitForTimeout(1000); // 等待佈局調整
        
        const screenshotPath = path.join(TEST_CONFIG.screenshotsDir, `${bp.name}-${bp.width}x${bp.height}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        results.screenshots.push({ breakpoint: bp.name, path: screenshotPath, status: 'success' });
        results.passed++;
        results.tests.push({ name: `${bp.name} 響應式截圖`, status: 'passed', details: screenshotPath });
        console.log(`✅ ${bp.name} 截圖已儲存: ${screenshotPath}`);
        
      } catch (error) {
        results.failed++;
        results.tests.push({ name: `${bp.name} 響應式截圖`, status: 'failed', details: error.message });
        console.log(`❌ ${bp.name} 截圖失敗:`, error.message);
      }
    }
    
    // 測試頁面基本元素
    const pageElements = await page.evaluate(() => {
      return {
        title: document.title,
        hasH1: !!document.querySelector('h1'),
        hasButtons: document.querySelectorAll('button').length,
        hasCards: document.querySelectorAll('[class*="card"]').length,
        totalElements: document.querySelectorAll('*').length
      };
    });
    
    if (pageElements.hasH1 && pageElements.hasButtons > 0) {
      results.passed++;
      results.tests.push({ name: '頁面基本結構', status: 'passed', details: pageElements });
      console.log('✅ 頁面基本結構正常');
    } else {
      results.failed++;
      results.tests.push({ name: '頁面基本結構', status: 'failed', details: pageElements });
      console.log('❌ 頁面基本結構有問題:', pageElements);
    }
    
  } catch (error) {
    results.failed++;
    results.tests.push({ name: '測試執行', status: 'failed', details: error.message });
    console.error('❌ 測試執行錯誤:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // 生成簡單報告
  const total = results.passed + results.failed;
  const successRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
  
  console.log('\n📊 測試結果摘要:');
  console.log(`✅ 通過: ${results.passed}`);
  console.log(`❌ 失敗: ${results.failed}`);
  console.log(`📊 總計: ${total}`);
  console.log(`🎯 成功率: ${successRate}%`);
  console.log(`📸 截圖: ${results.screenshots.length}`);
  
  return results;
}

// 執行測試
runSimpleTest().catch(error => {
  console.error('💥 測試執行失敗:', error);
  process.exit(1);
});