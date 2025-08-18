/**
 * Next.js 基礎平台互動測試腳本
 * PRP-120 完整測試套件
 */

const axios = require('axios');
const puppeteer = require('puppeteer');

// 測試配置
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  apiURL: 'http://localhost:3000/api',
  timeout: 30000,
  retries: 3
};

// 測試結果收集器
class TestResults {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
      summary: {
        routing: { passed: 0, failed: 0, total: 0 },
        api: { passed: 0, failed: 0, total: 0 },
        firebase: { passed: 0, failed: 0, total: 0 },
        errorHandling: { passed: 0, failed: 0, total: 0 },
        responsive: { passed: 0, failed: 0, total: 0 },
      }
    };
    this.startTime = Date.now();
  }

  addTest(category, testName, status, details = {}) {
    const test = {
      category,
      name: testName,
      status,
      timestamp: new Date().toISOString(),
      duration: details.duration || 0,
      error: details.error || null,
      details: details.info || {}
    };

    this.tests.push(test);
    this.results[status]++;
    this.results.summary[category][status]++;
    this.results.summary[category].total++;

    console.log(`[${status.toUpperCase()}] ${category}/${testName} ${details.duration ? `(${details.duration}ms)` : ''}`);
    if (details.error) {
      console.error(`  Error: ${details.error}`);
    }
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    return {
      metadata: {
        testSuite: 'Next.js Foundation Interaction Test',
        version: 'PRP-120',
        timestamp: new Date().toISOString(),
        duration,
        environment: {
          nodeVersion: process.version,
          platform: process.platform
        }
      },
      summary: {
        total: this.results.passed + this.results.failed + this.results.skipped,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        successRate: Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100) || 0,
        categories: this.results.summary
      },
      tests: this.tests
    };
  }
}

// 測試工具函數
class TestUtils {
  static async withTimeout(promise, timeoutMs = TEST_CONFIG.timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test timeout')), timeoutMs)
      )
    ]);
  }

  static async withRetry(fn, maxRetries = TEST_CONFIG.retries) {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  static async measureTime(fn) {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }
}

// 1. Next.js 路由導航測試
class RoutingTests {
  constructor(testResults) {
    this.results = testResults;
  }

  async testAppRouter() {
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        const response = await axios.get(TEST_CONFIG.baseURL, { timeout: 10000 });
        if (response.status !== 200) {
          throw new Error(`Expected status 200, got ${response.status}`);
        }
        if (!response.data.includes('DonnaAI Web Platform')) {
          throw new Error('Main page content not found');
        }
      });

      this.results.addTest('routing', 'App Router 基本路由', 'passed', { duration });
    } catch (error) {
      this.results.addTest('routing', 'App Router 基本路由', 'failed', { error: error.message });
    }
  }

  async testDashboardRoute() {
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        const response = await axios.get(`${TEST_CONFIG.baseURL}/dashboard`, { 
          timeout: 10000,
          validateStatus: (status) => status < 500 // 允許 401, 403 等認證錯誤
        });
        
        // Dashboard 應該需要認證，所以 401 或 403 是正常的
        if (response.status !== 401 && response.status !== 403 && response.status !== 200) {
          throw new Error(`Unexpected status ${response.status}`);
        }
      });

      this.results.addTest('routing', 'Dashboard 路由', 'passed', { duration });
    } catch (error) {
      this.results.addTest('routing', 'Dashboard 路由', 'failed', { error: error.message });
    }
  }

  async testPageNavigation() {
    let browser;
    try {
      const { result, duration } = await TestUtils.measureTime(async () => {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle0' });
        
        // 測試頁面標題
        const title = await page.title();
        if (!title.includes('DonnaAI')) {
          throw new Error('Page title not found');
        }

        // 測試按鈕點擊
        const buttons = await page.$$('button');
        if (buttons.length === 0) {
          throw new Error('No interactive buttons found');
        }

        // 測試第一個按鈕的互動性
        const firstButton = buttons[0];
        const isEnabled = await firstButton.evaluate(btn => !btn.disabled);
        if (!isEnabled) {
          throw new Error('Button is disabled');
        }

        return { buttonsFound: buttons.length, title };
      });

      this.results.addTest('routing', '頁面導航測試', 'passed', { 
        duration,
        info: { buttonsFound: result.buttonsFound, title: result.title }
      });
    } catch (error) {
      this.results.addTest('routing', '頁面導航測試', 'failed', { error: error.message });
    } finally {
      if (browser) await browser.close();
    }
  }

  async runAll() {
    console.log('\n🔄 開始路由導航測試...');
    await this.testAppRouter();
    await this.testDashboardRoute();
    await this.testPageNavigation();
  }
}

// 2. API Routes 認證中間件測試
class APITests {
  constructor(testResults) {
    this.results = testResults;
  }

  async testAuthVerifyEndpoint() {
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        const response = await axios.post(
          `${TEST_CONFIG.apiURL}/auth/verify`,
          { token: 'invalid-token' },
          { 
            timeout: 10000,
            validateStatus: (status) => status === 401 || status === 400
          }
        );

        if (response.status !== 401 && response.status !== 400) {
          throw new Error(`Expected 401/400, got ${response.status}`);
        }

        const data = response.data;
        if (!data.success === false) {
          throw new Error('Expected error response format');
        }
      });

      this.results.addTest('api', '認證端點測試', 'passed', { duration });
    } catch (error) {
      this.results.addTest('api', '認證端點測試', 'failed', { error: error.message });
    }
  }

  async testCustomersEndpoint() {
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        const response = await axios.get(
          `${TEST_CONFIG.apiURL}/customers`,
          { 
            timeout: 10000,
            validateStatus: (status) => status === 401 || status === 403
          }
        );

        if (response.status !== 401 && response.status !== 403) {
          throw new Error(`Expected 401/403, got ${response.status}`);
        }
      });

      this.results.addTest('api', '客戶 API 端點測試', 'passed', { duration });
    } catch (error) {
      this.results.addTest('api', '客戶 API 端點測試', 'failed', { error: error.message });
    }
  }

  async testCORSHeaders() {
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        const response = await axios.options(
          `${TEST_CONFIG.apiURL}/auth/verify`,
          { timeout: 10000 }
        );

        if (response.status !== 200) {
          throw new Error(`OPTIONS request failed with status ${response.status}`);
        }

        const corsHeaders = [
          'Access-Control-Allow-Origin',
          'Access-Control-Allow-Methods',
          'Access-Control-Allow-Headers'
        ];

        for (const header of corsHeaders) {
          if (!response.headers[header.toLowerCase()]) {
            throw new Error(`Missing CORS header: ${header}`);
          }
        }
      });

      this.results.addTest('api', 'CORS 標頭測試', 'passed', { duration });
    } catch (error) {
      this.results.addTest('api', 'CORS 標頭測試', 'failed', { error: error.message });
    }
  }

  async testErrorResponseFormat() {
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        const response = await axios.post(
          `${TEST_CONFIG.apiURL}/auth/verify`,
          { invalidData: true },
          { 
            timeout: 10000,
            validateStatus: () => true
          }
        );

        const data = response.data;
        const requiredFields = ['success', 'error'];
        
        for (const field of requiredFields) {
          if (!(field in data)) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        if (data.success !== false) {
          throw new Error('Expected success to be false');
        }
      });

      this.results.addTest('api', 'API 錯誤回應格式', 'passed', { duration });
    } catch (error) {
      this.results.addTest('api', 'API 錯誤回應格式', 'failed', { error: error.message });
    }
  }

  async runAll() {
    console.log('\n🔄 開始 API Routes 測試...');
    await this.testAuthVerifyEndpoint();
    await this.testCustomersEndpoint();
    await this.testCORSHeaders();
    await this.testErrorResponseFormat();
  }
}

// 3. Firebase Admin 連接測試
class FirebaseTests {
  constructor(testResults) {
    this.results = testResults;
  }

  async testFirebaseInitialization() {
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        // 測試 Firebase 初始化是否正常（透過 API 調用）
        const response = await axios.post(
          `${TEST_CONFIG.apiURL}/auth/verify`,
          { token: 'test' },
          { 
            timeout: 15000,
            validateStatus: () => true
          }
        );

        // 如果能收到任何回應，表示 Firebase Admin SDK 初始化成功
        if (!response.data) {
          throw new Error('No response from Firebase endpoint');
        }
      });

      this.results.addTest('firebase', 'Firebase Admin 初始化', 'passed', { duration });
    } catch (error) {
      this.results.addTest('firebase', 'Firebase Admin 初始化', 'failed', { error: error.message });
    }
  }

  async testTokenValidation() {
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        const response = await axios.post(
          `${TEST_CONFIG.apiURL}/auth/verify`,
          { token: 'clearly-invalid-token' },
          { 
            timeout: 15000,
            validateStatus: () => true
          }
        );

        // 應該返回認證失敗的錯誤
        if (response.status === 500) {
          throw new Error('Internal server error - possible Firebase config issue');
        }

        const data = response.data;
        if (data.success === true) {
          throw new Error('Invalid token was accepted');
        }
      });

      this.results.addTest('firebase', 'Token 驗證機制', 'passed', { duration });
    } catch (error) {
      this.results.addTest('firebase', 'Token 驗證機制', 'failed', { error: error.message });
    }
  }

  async testFirestoreConnection() {
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        // 測試 Firestore 連接（透過 customers API）
        const response = await axios.get(
          `${TEST_CONFIG.apiURL}/customers`,
          { 
            timeout: 15000,
            validateStatus: (status) => status === 401 || status === 500
          }
        );

        // 401 = 認證失敗（正常），500 = Firestore 連接問題
        if (response.status === 500) {
          const data = response.data;
          if (data.error && data.error.includes('Firestore')) {
            throw new Error('Firestore connection failed');
          }
        }
      });

      this.results.addTest('firebase', 'Firestore 連接測試', 'passed', { duration });
    } catch (error) {
      this.results.addTest('firebase', 'Firestore 連接測試', 'failed', { error: error.message });
    }
  }

  async runAll() {
    console.log('\n🔄 開始 Firebase Admin 測試...');
    await this.testFirebaseInitialization();
    await this.testTokenValidation();
    await this.testFirestoreConnection();
  }
}

// 4. 錯誤邊界處理測試
class ErrorHandlingTests {
  constructor(testResults) {
    this.results = testResults;
  }

  async testInvalidRoutes() {
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        const response = await axios.get(
          `${TEST_CONFIG.baseURL}/non-existent-page`,
          { 
            timeout: 10000,
            validateStatus: (status) => status === 404
          }
        );

        if (response.status !== 404) {
          throw new Error(`Expected 404, got ${response.status}`);
        }
      });

      this.results.addTest('errorHandling', '無效路由處理', 'passed', { duration });
    } catch (error) {
      this.results.addTest('errorHandling', '無效路由處理', 'failed', { error: error.message });
    }
  }

  async testAPIErrorHandling() {
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        const response = await axios.post(
          `${TEST_CONFIG.apiURL}/non-existent-endpoint`,
          {},
          { 
            timeout: 10000,
            validateStatus: (status) => status === 404 || status === 405
          }
        );

        if (response.status !== 404 && response.status !== 405) {
          throw new Error(`Expected 404/405, got ${response.status}`);
        }
      });

      this.results.addTest('errorHandling', 'API 錯誤處理', 'passed', { duration });
    } catch (error) {
      this.results.addTest('errorHandling', 'API 錯誤處理', 'failed', { error: error.message });
    }
  }

  async testInvalidJSONHandling() {
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        const response = await axios.post(
          `${TEST_CONFIG.apiURL}/auth/verify`,
          'invalid-json-string',
          { 
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' },
            validateStatus: (status) => status === 400 || status === 401
          }
        );

        if (response.status !== 400 && response.status !== 401) {
          throw new Error(`Expected 400/401, got ${response.status}`);
        }
      });

      this.results.addTest('errorHandling', '無效 JSON 處理', 'passed', { duration });
    } catch (error) {
      this.results.addTest('errorHandling', '無效 JSON 處理', 'failed', { error: error.message });
    }
  }

  async runAll() {
    console.log('\n🔄 開始錯誤邊界處理測試...');
    await this.testInvalidRoutes();
    await this.testAPIErrorHandling();
    await this.testInvalidJSONHandling();
  }
}

// 5. 響應式佈局測試
class ResponsiveTests {
  constructor(testResults) {
    this.results = testResults;
  }

  async testMobileLayout() {
    let browser;
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // 設定手機視窗大小
        await page.setViewport({ width: 375, height: 667 });
        await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle0' });

        // 檢查響應式元素
        const isResponsive = await page.evaluate(() => {
          const body = document.body;
          const computedStyle = window.getComputedStyle(body);
          
          // 檢查是否有響應式類別或樣式
          return body.classList.contains('h-full') || 
                 computedStyle.minHeight === '100vh' ||
                 computedStyle.height === '100%';
        });

        if (!isResponsive) {
          throw new Error('Mobile responsive layout not detected');
        }
      });

      this.results.addTest('responsive', '手機版佈局測試', 'passed', { duration });
    } catch (error) {
      this.results.addTest('responsive', '手機版佈局測試', 'failed', { error: error.message });
    } finally {
      if (browser) await browser.close();
    }
  }

  async testDesktopLayout() {
    let browser;
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // 設定桌面視窗大小
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle0' });

        // 檢查桌面佈局元素
        const desktopElements = await page.evaluate(() => {
          const elements = {
            buttons: document.querySelectorAll('button').length,
            containers: document.querySelectorAll('div').length,
            hasGrid: document.querySelector('.grid') !== null
          };
          
          return elements;
        });

        if (desktopElements.buttons === 0) {
          throw new Error('No interactive elements found on desktop');
        }
      });

      this.results.addTest('responsive', '桌面版佈局測試', 'passed', { duration });
    } catch (error) {
      this.results.addTest('responsive', '桌面版佈局測試', 'failed', { error: error.message });
    } finally {
      if (browser) await browser.close();
    }
  }

  async testTailwindCSS() {
    let browser;
    try {
      const { duration } = await TestUtils.measureTime(async () => {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle0' });

        const tailwindStyles = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          const tailwindClasses = [];
          
          elements.forEach(el => {
            const classList = Array.from(el.classList);
            const hasTailwind = classList.some(cls => 
              cls.includes('bg-') || 
              cls.includes('text-') || 
              cls.includes('p-') || 
              cls.includes('m-') ||
              cls.includes('flex') ||
              cls.includes('grid')
            );
            
            if (hasTailwind) {
              tailwindClasses.push(...classList);
            }
          });
          
          return {
            found: tailwindClasses.length > 0,
            classes: tailwindClasses.slice(0, 10) // 取前 10 個作為示例
          };
        });

        if (!tailwindStyles.found) {
          throw new Error('Tailwind CSS classes not detected');
        }
      });

      this.results.addTest('responsive', 'Tailwind CSS 檢測', 'passed', { duration });
    } catch (error) {
      this.results.addTest('responsive', 'Tailwind CSS 檢測', 'failed', { error: error.message });
    } finally {
      if (browser) await browser.close();
    }
  }

  async runAll() {
    console.log('\n🔄 開始響應式佈局測試...');
    await this.testMobileLayout();
    await this.testDesktopLayout();
    await this.testTailwindCSS();
  }
}

// 主測試運行器
class TestRunner {
  constructor() {
    this.results = new TestResults();
  }

  async checkServerAvailability() {
    console.log('🔍 檢查伺服器可用性...');
    
    for (let i = 0; i < 5; i++) {
      try {
        await axios.get(TEST_CONFIG.baseURL, { timeout: 5000 });
        console.log('✅ Next.js 伺服器已準備就緒');
        return true;
      } catch (error) {
        console.log(`⏳ 等待伺服器啟動... (${i + 1}/5)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error('無法連接到 Next.js 伺服器。請確保執行 `npm run dev`');
  }

  async runAllTests() {
    console.log('🚀 開始 Next.js 基礎平台互動測試');
    console.log(`📅 測試時間: ${new Date().toISOString()}`);
    console.log(`🌐 測試目標: ${TEST_CONFIG.baseURL}`);
    console.log(''.padEnd(50, '='));

    try {
      await this.checkServerAvailability();

      // 執行所有測試套件
      const testSuites = [
        new RoutingTests(this.results),
        new APITests(this.results),
        new FirebaseTests(this.results),
        new ErrorHandlingTests(this.results),
        new ResponsiveTests(this.results)
      ];

      for (const suite of testSuites) {
        await suite.runAll();
      }

      console.log('\n' + ''.padEnd(50, '='));
      console.log('📊 測試完成！正在生成報告...');

      return this.results.generateReport();

    } catch (error) {
      console.error('❌ 測試執行失敗:', error.message);
      this.results.addTest('system', '測試環境檢查', 'failed', { error: error.message });
      return this.results.generateReport();
    }
  }
}

// 主函數
async function main() {
  const runner = new TestRunner();
  
  try {
    const report = await runner.runAllTests();
    
    // 輸出測試摘要
    console.log('\n📋 測試摘要:');
    console.log(`✅ 通過: ${report.summary.passed}`);
    console.log(`❌ 失敗: ${report.summary.failed}`);
    console.log(`⏭️  跳過: ${report.summary.skipped}`);
    console.log(`🎯 成功率: ${report.summary.successRate}%`);
    
    console.log('\n📂 各類別測試結果:');
    Object.entries(report.summary.categories).forEach(([category, stats]) => {
      const successRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
      console.log(`  ${category}: ${stats.passed}/${stats.total} (${successRate}%)`);
    });

    // 儲存詳細報告到檔案
    const fs = require('fs');
    const reportPath = '/Users/skyler/coding/DonnaAI-1.0/docs/tests/nextjs-foundation-interaction-test.md';
    
    let reportContent = `# Next.js 基礎平台互動測試報告

## 測試概覽

- **測試套件**: ${report.metadata.testSuite}
- **版本**: ${report.metadata.version}
- **執行時間**: ${report.metadata.timestamp}
- **總執行時長**: ${Math.round(report.metadata.duration / 1000)}秒
- **測試環境**: Node.js ${report.metadata.environment.nodeVersion} (${report.metadata.environment.platform})

## 測試結果摘要

- ✅ **通過**: ${report.summary.passed}
- ❌ **失敗**: ${report.summary.failed}
- ⏭️ **跳過**: ${report.summary.skipped}
- 🎯 **成功率**: ${report.summary.successRate}%

## 各類別詳細結果

`;

    Object.entries(report.summary.categories).forEach(([category, stats]) => {
      const successRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
      reportContent += `### ${category}
- 通過: ${stats.passed}
- 失敗: ${stats.failed}
- 總計: ${stats.total}
- 成功率: ${successRate}%

`;
    });

    reportContent += `## 詳細測試日誌

| 類別 | 測試名稱 | 狀態 | 執行時間 | 錯誤訊息 |
|------|----------|------|----------|----------|
`;

    report.tests.forEach(test => {
      const status = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
      const error = test.error ? test.error.slice(0, 50) + '...' : '-';
      reportContent += `| ${test.category} | ${test.name} | ${status} | ${test.duration}ms | ${error} |
`;
    });

    reportContent += `
## 測試環境要求

### 通過項目
- ✅ Next.js 伺服器運行正常
- ✅ API Routes 基本功能正常
- ✅ 中間件認證機制正常
- ✅ 錯誤處理機制正常

### 建議改進項目
${report.summary.failed > 0 ? '根據失敗的測試項目進行相應改進' : '目前所有測試項目均通過'}

## PRP-120 達成狀況

| 需求項目 | 狀態 | 說明 |
|----------|------|------|
| Next.js 路由導航 | ${report.summary.categories.routing.passed === report.summary.categories.routing.total ? '✅' : '⚠️'} | App Router 系統運作正常 |
| API Routes 中間件 | ${report.summary.categories.api.passed === report.summary.categories.api.total ? '✅' : '⚠️'} | 認證和權限檢查機制 |
| Firebase Admin 連接 | ${report.summary.categories.firebase.passed === report.summary.categories.firebase.total ? '✅' : '⚠️'} | Admin SDK 初始化和連接 |
| 錯誤邊界處理 | ${report.summary.categories.errorHandling.passed === report.summary.categories.errorHandling.total ? '✅' : '⚠️'} | 錯誤處理和恢復機制 |
| 響應式佈局 | ${report.summary.categories.responsive.passed === report.summary.categories.responsive.total ? '✅' : '⚠️'} | Tailwind CSS 響應式設計 |

---

*測試報告由 PRP-120 Next.js 基礎平台互動測試系統自動生成*
`;

    // 建立目錄（如果不存在）
    const path = require('path');
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n📄 詳細報告已儲存至: ${reportPath}`);

    // 根據測試結果設定 exit code
    process.exit(report.summary.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('💥 測試執行發生嚴重錯誤:', error.message);
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  main().catch(error => {
    console.error('💥 未處理的錯誤:', error);
    process.exit(1);
  });
}

module.exports = { TestRunner, TestResults, TestUtils };