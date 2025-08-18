/**
 * Next.js 基礎平台簡化互動測試
 * PRP-120 快速驗證版本
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 測試配置
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  apiURL: 'http://localhost:3000/api',
  timeout: 10000
};

// 測試結果收集器
class TestResults {
  constructor() {
    this.results = { passed: 0, failed: 0, tests: [] };
    this.startTime = Date.now();
  }

  addTest(category, name, status, details = {}) {
    this.results.tests.push({
      category,
      name,
      status,
      timestamp: new Date().toISOString(),
      duration: details.duration || 0,
      error: details.error || null
    });

    this.results[status]++;
    console.log(`[${status.toUpperCase()}] ${category}/${name}`);
    if (details.error) console.error(`  Error: ${details.error}`);
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;

    return {
      summary: {
        total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate,
        duration
      },
      tests: this.results.tests
    };
  }
}

// 測試工具函數
async function measureTime(fn) {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

// 主測試類別
class NextJSFoundationTests {
  constructor() {
    this.results = new TestResults();
  }

  async checkServerAvailability() {
    console.log('🔍 檢查伺服器可用性...');
    
    for (let i = 0; i < 3; i++) {
      try {
        await axios.get(TEST_CONFIG.baseURL, { timeout: 5000 });
        console.log('✅ Next.js 伺服器已準備就緒');
        return true;
      } catch (error) {
        console.log(`⏳ 等待伺服器啟動... (${i + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error('無法連接到 Next.js 伺服器。請確保執行 `npm run dev`');
  }

  async testBasicRouting() {
    try {
      const { duration } = await measureTime(async () => {
        const response = await axios.get(TEST_CONFIG.baseURL, { timeout: TEST_CONFIG.timeout });
        if (response.status !== 200) {
          throw new Error(`Expected status 200, got ${response.status}`);
        }
        if (!response.data.includes('DonnaAI')) {
          throw new Error('Main page content not found');
        }
      });
      this.results.addTest('routing', '基本路由測試', 'passed', { duration });
    } catch (error) {
      this.results.addTest('routing', '基本路由測試', 'failed', { error: error.message });
    }
  }

  async testDashboardRoute() {
    try {
      const { duration } = await measureTime(async () => {
        const response = await axios.get(`${TEST_CONFIG.baseURL}/dashboard`, { 
          timeout: TEST_CONFIG.timeout,
          validateStatus: (status) => status < 500
        });
        // Dashboard 應該需要認證或正常顯示，但不應該是 500 錯誤
        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status}`);
        }
      });
      this.results.addTest('routing', 'Dashboard 路由', 'passed', { duration });
    } catch (error) {
      this.results.addTest('routing', 'Dashboard 路由', 'failed', { error: error.message });
    }
  }

  async testAuthVerifyAPI() {
    try {
      const { duration } = await measureTime(async () => {
        const response = await axios.post(
          `${TEST_CONFIG.apiURL}/auth/verify`,
          { token: 'invalid-token' },
          { 
            timeout: TEST_CONFIG.timeout,
            validateStatus: () => true
          }
        );

        // 檢查回應格式
        if (typeof response.data !== 'object') {
          throw new Error('Invalid response format');
        }

        const data = response.data;
        if (!('success' in data)) {
          throw new Error('Missing success field in response');
        }
      });
      this.results.addTest('api', '認證 API 測試', 'passed', { duration });
    } catch (error) {
      this.results.addTest('api', '認證 API 測試', 'failed', { error: error.message });
    }
  }

  async testCustomersAPI() {
    try {
      const { duration } = await measureTime(async () => {
        const response = await axios.get(
          `${TEST_CONFIG.apiURL}/customers`,
          { 
            timeout: TEST_CONFIG.timeout,
            validateStatus: () => true
          }
        );

        // 應該返回認證錯誤或正常回應，但不應該是內部錯誤
        if (response.status === 500 && response.data.error && response.data.error.includes('Firebase')) {
          throw new Error('Firebase configuration issue detected');
        }
      });
      this.results.addTest('api', '客戶 API 測試', 'passed', { duration });
    } catch (error) {
      this.results.addTest('api', '客戶 API 測試', 'failed', { error: error.message });
    }
  }

  async testCORSHeaders() {
    try {
      const { duration } = await measureTime(async () => {
        const response = await axios.options(`${TEST_CONFIG.apiURL}/auth/verify`, { 
          timeout: TEST_CONFIG.timeout 
        });

        if (response.status !== 200) {
          throw new Error(`OPTIONS request failed with status ${response.status}`);
        }

        const requiredHeaders = ['access-control-allow-origin', 'access-control-allow-methods'];
        for (const header of requiredHeaders) {
          if (!response.headers[header]) {
            throw new Error(`Missing CORS header: ${header}`);
          }
        }
      });
      this.results.addTest('api', 'CORS 標頭測試', 'passed', { duration });
    } catch (error) {
      this.results.addTest('api', 'CORS 標頭測試', 'failed', { error: error.message });
    }
  }

  async testErrorHandling() {
    try {
      const { duration } = await measureTime(async () => {
        const response = await axios.get(`${TEST_CONFIG.baseURL}/non-existent-page`, {
          timeout: TEST_CONFIG.timeout,
          validateStatus: (status) => status === 404
        });

        if (response.status !== 404) {
          throw new Error(`Expected 404, got ${response.status}`);
        }
      });
      this.results.addTest('errorHandling', '404 錯誤處理', 'passed', { duration });
    } catch (error) {
      this.results.addTest('errorHandling', '404 錯誤處理', 'failed', { error: error.message });
    }
  }

  async testInvalidJSON() {
    try {
      const { duration } = await measureTime(async () => {
        const response = await axios.post(
          `${TEST_CONFIG.apiURL}/auth/verify`,
          'invalid-json',
          { 
            timeout: TEST_CONFIG.timeout,
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

  async runAllTests() {
    console.log('🚀 開始 Next.js 基礎平台互動測試');
    console.log(`📅 測試時間: ${new Date().toISOString()}`);
    console.log(`🌐 測試目標: ${TEST_CONFIG.baseURL}`);
    console.log(''.padEnd(50, '='));

    try {
      await this.checkServerAvailability();

      console.log('\n🔄 執行測試項目...');
      await this.testBasicRouting();
      await this.testDashboardRoute();
      await this.testAuthVerifyAPI();
      await this.testCustomersAPI();
      await this.testCORSHeaders();
      await this.testErrorHandling();
      await this.testInvalidJSON();

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

// 生成 Markdown 報告
function generateMarkdownReport(report) {
  return `# Next.js 基礎平台互動測試報告

## 測試概覽

- **執行時間**: ${new Date().toISOString()}
- **總執行時長**: ${Math.round(report.summary.duration / 1000)}秒
- **測試環境**: Node.js ${process.version} (${process.platform})

## 測試結果摘要

- ✅ **通過**: ${report.summary.passed}
- ❌ **失敗**: ${report.summary.failed}
- 📊 **總計**: ${report.summary.total}
- 🎯 **成功率**: ${report.summary.successRate}%

## 詳細測試結果

| 類別 | 測試名稱 | 狀態 | 執行時間 |
|------|----------|------|----------|
${report.tests.map(test => {
  const status = test.status === 'passed' ? '✅' : '❌';
  return `| ${test.category} | ${test.name} | ${status} | ${test.duration}ms |`;
}).join('\n')}

## PRP-120 需求達成狀況

### 1. Next.js 路由導航系統
${report.tests.filter(t => t.category === 'routing').map(t => 
  `- ${t.status === 'passed' ? '✅' : '❌'} ${t.name}`
).join('\n')}

### 2. API Routes 認證中間件
${report.tests.filter(t => t.category === 'api').map(t => 
  `- ${t.status === 'passed' ? '✅' : '❌'} ${t.name}`
).join('\n')}

### 3. 錯誤邊界處理
${report.tests.filter(t => t.category === 'errorHandling').map(t => 
  `- ${t.status === 'passed' ? '✅' : '❌'} ${t.name}`
).join('\n')}

## 失敗測試詳情

${report.tests.filter(t => t.status === 'failed').map(test => 
  `### ${test.category}/${test.name}
- **錯誤**: ${test.error}
- **時間**: ${test.timestamp}
`).join('\n')}

## 建議改進項目

${report.summary.failed > 0 ? 
  '根據上述失敗測試項目，建議檢查相關配置和實作。' : 
  '✅ 所有基礎測試項目均通過，Next.js 平台基礎架構運作正常。'}

## 下一步測試建議

1. **效能測試**: 測試 API 回應時間和頁面載入速度
2. **安全性測試**: 深入測試認證和授權機制
3. **整合測試**: 測試與 Firebase 的完整整合流程
4. **使用者介面測試**: 測試前端元件互動功能

---

*報告由 PRP-120 Next.js 基礎平台測試系統自動生成*
`;
}

// 主函數
async function main() {
  const tester = new NextJSFoundationTests();
  
  try {
    const report = await tester.runAllTests();
    
    // 輸出測試摘要到控制台
    console.log('\n📋 測試摘要:');
    console.log(`✅ 通過: ${report.summary.passed}`);
    console.log(`❌ 失敗: ${report.summary.failed}`);
    console.log(`📊 總計: ${report.summary.total}`);
    console.log(`🎯 成功率: ${report.summary.successRate}%`);
    
    // 生成並儲存 Markdown 報告
    const reportContent = generateMarkdownReport(report);
    const reportDir = path.join(__dirname, '..', 'docs', 'tests');
    const reportPath = path.join(reportDir, 'nextjs-foundation-interaction-test.md');
    
    // 建立目錄（如果不存在）
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n📄 詳細報告已儲存至: ${reportPath}`);
    
    // 輸出關鍵測試結果
    if (report.summary.failed === 0) {
      console.log('\n🎉 所有測試通過！Next.js 基礎平台運作正常。');
    } else {
      console.log(`\n⚠️  發現 ${report.summary.failed} 個問題需要處理。`);
      const failedTests = report.tests.filter(t => t.status === 'failed');
      failedTests.forEach(test => {
        console.log(`   - ${test.category}/${test.name}: ${test.error}`);
      });
    }
    
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

module.exports = NextJSFoundationTests;