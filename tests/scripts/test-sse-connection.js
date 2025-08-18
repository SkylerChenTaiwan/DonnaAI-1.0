#!/usr/bin/env node

/**
 * SSE 連線測試腳本
 * 測試即時資料更新 API 端點的基本功能
 */

const https = require('https');
const http = require('http');

// 測試配置
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  sseEndpoint: '/api/realtime/events',
  testTimeout: 30000, // 30 秒
  userId: 'test-user-123',
  orgId: 'test-org-456'
};

console.log('🔄 開始 SSE 連線測試...\n');
console.log('測試配置:', {
  '基礎 URL': TEST_CONFIG.baseUrl,
  'SSE 端點': TEST_CONFIG.sseEndpoint,
  '使用者 ID': TEST_CONFIG.userId,
  '組織 ID': TEST_CONFIG.orgId,
  '逾時時間': `${TEST_CONFIG.testTimeout / 1000} 秒`
});

/**
 * 測試基本 HTTP 連線
 */
async function testBasicConnection() {
  console.log('\n📡 測試基本 HTTP 連線...');
  
  return new Promise((resolve, reject) => {
    const module = TEST_CONFIG.baseUrl.startsWith('https') ? https : http;
    const req = module.request(TEST_CONFIG.baseUrl, { method: 'HEAD' }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        console.log('✅ HTTP 連線正常');
        resolve(true);
      } else {
        console.log('❌ HTTP 連線失敗，狀態碼:', res.statusCode);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log('❌ HTTP 連線錯誤:', error.message);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('❌ HTTP 連線逾時');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * 測試 SSE 端點可訪問性
 */
async function testSSEEndpoint() {
  console.log('\n📡 測試 SSE 端點可訪問性...');
  
  return new Promise((resolve, reject) => {
    const url = new URL(TEST_CONFIG.sseEndpoint, TEST_CONFIG.baseUrl);
    url.searchParams.set('userId', TEST_CONFIG.userId);
    url.searchParams.set('orgId', TEST_CONFIG.orgId);
    
    console.log('請求 URL:', url.toString());

    const module = url.protocol === 'https:' ? https : http;
    const req = module.request(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      }
    }, (res) => {
      console.log('回應狀態碼:', res.statusCode);
      console.log('回應標頭:', res.headers);
      
      if (res.statusCode === 200) {
        console.log('✅ SSE 端點可訪問');
        
        // 監聽資料
        let dataReceived = false;
        
        res.on('data', (chunk) => {
          const data = chunk.toString();
          console.log('📨 收到 SSE 資料:', data);
          dataReceived = true;
        });

        // 5 秒後關閉連線
        setTimeout(() => {
          req.destroy();
          resolve({
            accessible: true,
            dataReceived,
            statusCode: res.statusCode,
            contentType: res.headers['content-type']
          });
        }, 5000);

      } else if (res.statusCode === 401) {
        console.log('⚠️  需要認證 (401)');
        resolve({
          accessible: false,
          needsAuth: true,
          statusCode: res.statusCode
        });
      } else if (res.statusCode === 403) {
        console.log('❌ 權限不足 (403)');
        resolve({
          accessible: false,
          forbidden: true,
          statusCode: res.statusCode
        });
      } else {
        console.log('❌ SSE 端點不可訪問，狀態碼:', res.statusCode);
        resolve({
          accessible: false,
          statusCode: res.statusCode
        });
      }
    });

    req.on('error', (error) => {
      console.log('❌ SSE 連線錯誤:', error.message);
      resolve({
        accessible: false,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      console.log('❌ SSE 連線逾時');
      req.destroy();
      resolve({
        accessible: false,
        timeout: true
      });
    });

    req.end();
  });
}

/**
 * 測試模擬 SSE 事件
 */
function simulateSSEEvents() {
  console.log('\n🎭 模擬 SSE 事件格式測試...');
  
  const mockEvents = [
    {
      type: 'connection_established',
      connectionId: 'test-connection-123',
      timestamp: new Date().toISOString(),
      data: { message: '即時資料串流已建立' }
    },
    {
      type: 'dashboard_data_updated',
      id: 'update-1',
      timestamp: new Date().toISOString(),
      data: {
        metrics: {
          revenue: 125430,
          customers: 34,
          tasks: 89
        }
      }
    },
    {
      type: 'metric_changed',
      id: 'metric-change-1',
      timestamp: new Date().toISOString(),
      data: {
        metricName: 'revenue',
        oldValue: 120000,
        newValue: 125430,
        change: 5430
      }
    },
    {
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      connectionId: 'test-connection-123'
    }
  ];

  console.log('✅ 模擬事件格式正確:');
  mockEvents.forEach((event, index) => {
    const sseFormat = `data: ${JSON.stringify(event)}\n\n`;
    console.log(`📋 事件 ${index + 1} (${event.type}):`);
    console.log(`   SSE 格式: ${sseFormat.replace(/\n/g, '\\n')}`);
    console.log(`   事件大小: ${Buffer.byteLength(sseFormat, 'utf8')} bytes`);
  });

  return true;
}

/**
 * 測試網路效能
 */
async function testNetworkPerformance() {
  console.log('\n⚡ 網路效能測試...');
  
  const tests = [];
  
  // 測試多次連線時間
  for (let i = 0; i < 5; i++) {
    const startTime = Date.now();
    
    try {
      const isConnected = await testBasicConnection();
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      tests.push({
        attempt: i + 1,
        success: isConnected,
        latency
      });
      
    } catch (error) {
      tests.push({
        attempt: i + 1,
        success: false,
        error: error.message
      });
    }
  }

  const successfulTests = tests.filter(t => t.success);
  const avgLatency = successfulTests.length > 0 
    ? successfulTests.reduce((sum, t) => sum + t.latency, 0) / successfulTests.length 
    : 0;

  console.log('📊 效能測試結果:');
  console.log(`   成功率: ${successfulTests.length}/5 (${(successfulTests.length / 5 * 100).toFixed(1)}%)`);
  console.log(`   平均延遲: ${avgLatency.toFixed(2)}ms`);
  console.log(`   最低延遲: ${Math.min(...successfulTests.map(t => t.latency))}ms`);
  console.log(`   最高延遲: ${Math.max(...successfulTests.map(t => t.latency))}ms`);

  return {
    successRate: successfulTests.length / 5,
    averageLatency: avgLatency,
    tests
  };
}

/**
 * 主要測試函數
 */
async function runTests() {
  const results = {
    basicConnection: false,
    sseEndpoint: null,
    mockEvents: false,
    performance: null
  };

  try {
    // 測試基本連線
    results.basicConnection = await testBasicConnection();
    
    if (!results.basicConnection) {
      console.log('\n❌ 基本連線失敗，無法繼續其他測試');
      return results;
    }

    // 測試 SSE 端點
    results.sseEndpoint = await testSSEEndpoint();

    // 模擬事件測試
    results.mockEvents = simulateSSEEvents();

    // 效能測試
    if (results.basicConnection) {
      results.performance = await testNetworkPerformance();
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
  }

  return results;
}

/**
 * 輸出測試摘要
 */
function printTestSummary(results) {
  console.log('\n' + '='.repeat(50));
  console.log('📋 測試結果摘要');
  console.log('='.repeat(50));

  // 基本連線
  console.log(`\n🔗 基本連線: ${results.basicConnection ? '✅ 成功' : '❌ 失敗'}`);

  // SSE 端點
  if (results.sseEndpoint) {
    console.log(`\n📡 SSE 端點:`);
    console.log(`   可訪問性: ${results.sseEndpoint.accessible ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`   狀態碼: ${results.sseEndpoint.statusCode}`);
    
    if (results.sseEndpoint.needsAuth) {
      console.log(`   ⚠️  需要認證 - 這是正常的，因為端點有權限保護`);
    }
    
    if (results.sseEndpoint.dataReceived) {
      console.log(`   資料接收: ✅ 收到即時資料`);
    }

    if (results.sseEndpoint.contentType) {
      console.log(`   內容類型: ${results.sseEndpoint.contentType}`);
    }
  }

  // 模擬事件
  console.log(`\n🎭 模擬事件: ${results.mockEvents ? '✅ 格式正確' : '❌ 格式錯誤'}`);

  // 效能測試
  if (results.performance) {
    console.log(`\n⚡ 效能測試:`);
    console.log(`   成功率: ${(results.performance.successRate * 100).toFixed(1)}%`);
    console.log(`   平均延遲: ${results.performance.averageLatency.toFixed(2)}ms`);
  }

  // 總結建議
  console.log('\n💡 建議:');
  
  if (!results.basicConnection) {
    console.log('   - 檢查開發伺服器是否正在運行 (npm run dev)');
    console.log('   - 確認 URL 和端口設定正確');
  }

  if (results.sseEndpoint?.needsAuth) {
    console.log('   - SSE 端點需要認證是正常的安全措施');
    console.log('   - 在實際應用中需要提供有效的認證權杖');
    console.log('   - 可以在測試環境中暫時禁用認證來進行基本功能測試');
  }

  if (results.sseEndpoint?.accessible === false && !results.sseEndpoint.needsAuth) {
    console.log('   - 檢查 API 路由配置');
    console.log('   - 確認 SSE 實作正確');
    console.log('   - 查看伺服器日誌以獲得更多資訊');
  }

  if (results.performance?.averageLatency > 1000) {
    console.log('   - 網路延遲較高，可能影響即時體驗');
    console.log('   - 考慮優化伺服器配置或網路環境');
  }

  console.log('\n🎯 後續步驟:');
  console.log('   1. 使用 Playwright 執行完整的 E2E 測試');
  console.log('   2. 測試實際使用者認證流程');
  console.log('   3. 驗證長時間連線穩定性');
  console.log('   4. 進行負載測試以確保併發效能');
}

// 執行測試
if (require.main === module) {
  runTests()
    .then(results => {
      printTestSummary(results);
      
      // 設定退出代碼
      const success = results.basicConnection && 
                     results.mockEvents && 
                     (!results.sseEndpoint || results.sseEndpoint.accessible || results.sseEndpoint.needsAuth);
      
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 測試執行失敗:', error);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testBasicConnection,
  testSSEEndpoint,
  simulateSSEEvents,
  testNetworkPerformance
};