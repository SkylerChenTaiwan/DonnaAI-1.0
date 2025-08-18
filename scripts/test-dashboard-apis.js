#!/usr/bin/env node

/**
 * Dashboard API 整合測試腳本
 * 測試所有 Dashboard 相關的 API 端點
 */

const https = require('https');
const http = require('http');

// 測試配置
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  testTimeout: 10000,
  retryAttempts: 3,
  // 測試用的模擬認證 token（實際使用時需要真實的 JWT）
  authToken: process.env.TEST_AUTH_TOKEN || 'mock-auth-token',
  organizationId: process.env.TEST_ORG_ID || 'test-org-123',
  userId: process.env.TEST_USER_ID || 'test-user-456',
};

// 測試結果統計
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// HTTP 請求輔助函數
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null,
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: error.message,
          });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.setTimeout(CONFIG.testTimeout);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// 測試輔助函數
async function runTest(testName, testFn) {
  testResults.total++;
  
  try {
    logInfo(`執行測試: ${testName}`);
    await testFn();
    testResults.passed++;
    logSuccess(`通過: ${testName}`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ testName, error: error.message });
    logError(`失敗: ${testName} - ${error.message}`);
  }
}

// 具體測試案例

// 測試 Dashboard 指標 API
async function testDashboardMetrics() {
  const options = {
    hostname: new URL(CONFIG.baseUrl).hostname,
    port: new URL(CONFIG.baseUrl).port || (new URL(CONFIG.baseUrl).protocol === 'https:' ? 443 : 80),
    path: `/api/dashboard/metrics?orgId=${CONFIG.organizationId}&timeRange=7d`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.authToken}`,
    },
  };
  
  const response = await makeRequest(options);
  
  if (response.statusCode === 401) {
    throw new Error('認證失敗 - 需要有效的認證 token');
  }
  
  if (response.statusCode !== 200) {
    throw new Error(`API 回應錯誤: ${response.statusCode}`);
  }
  
  if (!response.body || !response.body.success) {
    throw new Error('API 回應格式錯誤');
  }
  
  const data = response.body.data;
  if (!data.overview || !data.trends || !data.team) {
    throw new Error('API 回應缺少必要的資料欄位');
  }
}

// 測試 Dashboard 趨勢 API
async function testDashboardTrends() {
  const options = {
    hostname: new URL(CONFIG.baseUrl).hostname,
    port: new URL(CONFIG.baseUrl).port || (new URL(CONFIG.baseUrl).protocol === 'https:' ? 443 : 80),
    path: `/api/dashboard/trends?orgId=${CONFIG.organizationId}&period=month`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.authToken}`,
    },
  };
  
  const response = await makeRequest(options);
  
  if (response.statusCode === 401) {
    throw new Error('認證失敗 - 需要有效的認證 token');
  }
  
  if (response.statusCode !== 200) {
    throw new Error(`API 回應錯誤: ${response.statusCode}`);
  }
}

// 測試 Dashboard 團隊狀態 API
async function testTeamStatus() {
  const options = {
    hostname: new URL(CONFIG.baseUrl).hostname,
    port: new URL(CONFIG.baseUrl).port || (new URL(CONFIG.baseUrl).protocol === 'https:' ? 443 : 80),
    path: `/api/dashboard/team/status?orgId=${CONFIG.organizationId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.authToken}`,
    },
  };
  
  const response = await makeRequest(options);
  
  if (response.statusCode === 401) {
    throw new Error('認證失敗 - 需要有效的認證 token');
  }
  
  if (response.statusCode !== 200) {
    throw new Error(`API 回應錯誤: ${response.statusCode}`);
  }
}

// 測試 AI 分析 API
async function testAIAnalytics() {
  const options = {
    hostname: new URL(CONFIG.baseUrl).hostname,
    port: new URL(CONFIG.baseUrl).port || (new URL(CONFIG.baseUrl).protocol === 'https:' ? 443 : 80),
    path: `/api/dashboard/ai/analytics`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.authToken}`,
    },
  };
  
  const requestData = {
    organizationId: CONFIG.organizationId,
    query: '本月營收表現如何？',
    analysisType: 'revenue',
  };
  
  const response = await makeRequest(options, requestData);
  
  if (response.statusCode === 401) {
    throw new Error('認證失敗 - 需要有效的認證 token');
  }
  
  if (response.statusCode !== 200) {
    throw new Error(`API 回應錯誤: ${response.statusCode}`);
  }
}

// 測試 SSE 連線
async function testSSEConnection() {
  return new Promise((resolve, reject) => {
    const EventSource = require('eventsource');
    const url = `${CONFIG.baseUrl}/api/realtime/events?userId=${CONFIG.userId}&orgId=${CONFIG.organizationId}&events=dashboard_data_updated,metric_changed`;
    
    const eventSource = new EventSource(url, {
      headers: {
        'Authorization': `Bearer ${CONFIG.authToken}`,
      },
    });
    
    let connected = false;
    let eventReceived = false;
    
    const timeout = setTimeout(() => {
      eventSource.close();
      if (!connected) {
        reject(new Error('SSE 連線超時'));
      } else if (!eventReceived) {
        logWarning('SSE 連線成功但未收到事件（這在測試環境中是正常的）');
        resolve();
      }
    }, 5000);
    
    eventSource.onopen = () => {
      connected = true;
      logInfo('SSE 連線已建立');
    };
    
    eventSource.onmessage = (event) => {
      eventReceived = true;
      clearTimeout(timeout);
      eventSource.close();
      logInfo('收到 SSE 事件');
      resolve();
    };
    
    eventSource.onerror = (error) => {
      eventSource.close();
      clearTimeout(timeout);
      
      if (error.status === 401) {
        reject(new Error('SSE 認證失敗'));
      } else {
        reject(new Error(`SSE 連線錯誤: ${error.message || 'Unknown error'}`));
      }
    };
  });
}

// 測試快取機制
async function testCachePerformance() {
  const startTime = Date.now();
  
  // 第一次請求
  const options = {
    hostname: new URL(CONFIG.baseUrl).hostname,
    port: new URL(CONFIG.baseUrl).port || (new URL(CONFIG.baseUrl).protocol === 'https:' ? 443 : 80),
    path: `/api/dashboard/metrics?orgId=${CONFIG.organizationId}&timeRange=7d`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.authToken}`,
    },
  };
  
  const firstResponse = await makeRequest(options);
  const firstRequestTime = Date.now() - startTime;
  
  if (firstResponse.statusCode === 401) {
    throw new Error('認證失敗 - 需要有效的認證 token');
  }
  
  if (firstResponse.statusCode !== 200) {
    throw new Error(`第一次請求失敗: ${firstResponse.statusCode}`);
  }
  
  // 等待一小段時間後再次請求（測試快取）
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const secondStartTime = Date.now();
  const secondResponse = await makeRequest(options);
  const secondRequestTime = Date.now() - secondStartTime;
  
  if (secondResponse.statusCode !== 200) {
    throw new Error(`第二次請求失敗: ${secondResponse.statusCode}`);
  }
  
  logInfo(`第一次請求耗時: ${firstRequestTime}ms`);
  logInfo(`第二次請求耗時: ${secondRequestTime}ms`);
  
  if (secondRequestTime < firstRequestTime * 0.8) {
    logInfo('快取機制運作良好');
  } else {
    logWarning('快取機制可能未正常運作或未被使用');
  }
}

// 主要測試函數
async function runAllTests() {
  log('\n🚀 開始 Dashboard API 整合測試', colors.bold);
  log(`測試目標: ${CONFIG.baseUrl}`);
  log(`組織 ID: ${CONFIG.organizationId}`);
  log(`用戶 ID: ${CONFIG.userId}\n`);
  
  // 基本 API 測試
  await runTest('Dashboard 指標 API', testDashboardMetrics);
  await runTest('Dashboard 趨勢 API', testDashboardTrends);
  await runTest('團隊狀態 API', testTeamStatus);
  await runTest('AI 分析 API', testAIAnalytics);
  
  // 即時連線測試
  await runTest('SSE 即時連線', testSSEConnection);
  
  // 效能測試
  await runTest('快取效能測試', testCachePerformance);
  
  // 顯示測試結果
  log('\n📊 測試結果統計:', colors.bold);
  log(`總測試數: ${testResults.total}`);
  logSuccess(`通過: ${testResults.passed}`);
  logError(`失敗: ${testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    log('\n❌ 失敗的測試:', colors.red);
    testResults.errors.forEach(({ testName, error }) => {
      log(`  • ${testName}: ${error}`);
    });
  }
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`\n成功率: ${successRate}%`, successRate >= 80 ? colors.green : colors.red);
  
  if (testResults.failed === 0) {
    logSuccess('\n🎉 所有測試通過！Dashboard API 整合測試成功。');
  } else {
    logError('\n⚠️  有測試失敗，請檢查上述錯誤訊息。');
  }
  
  // 返回結果狀態
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// 錯誤處理
process.on('unhandledRejection', (reason, promise) => {
  logError(`未處理的 Promise 拒絕: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`未捕獲的異常: ${error.message}`);
  process.exit(1);
});

// 如果直接執行此腳本
if (require.main === module) {
  // 檢查必要的依賴
  try {
    require('eventsource');
  } catch (error) {
    logError('缺少必要的依賴: eventsource');
    log('請執行: npm install eventsource');
    process.exit(1);
  }
  
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults,
  CONFIG,
};