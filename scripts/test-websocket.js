#!/usr/bin/env node

/**
 * WebSocket 連線和訊息傳遞測試腳本
 * 測試 WebSocket 伺服器和客戶端的功能
 */

const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');

// 測試配置
const CONFIG = {
  wsUrl: process.env.WS_URL || 'ws://localhost:3001',
  testTimeout: 30000,
  maxTestUsers: 5,
  messageInterval: 2000,
  organizationId: 'test-org-123',
  userId: 'test-user-456',
  authToken: process.env.TEST_AUTH_TOKEN || 'mock-auth-token',
};

// 測試結果統計
const testResults = {
  connections: {
    attempted: 0,
    successful: 0,
    failed: 0,
  },
  messages: {
    sent: 0,
    received: 0,
    errors: 0,
  },
  events: {
    heartbeats: 0,
    dataUpdates: 0,
    notifications: 0,
    errors: 0,
  },
  errors: [],
};

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString().substr(11, 8);
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
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

/**
 * WebSocket 伺服器啟動器
 */
class WebSocketServerManager {
  constructor() {
    this.serverProcess = null;
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      return;
    }

    logInfo('啟動 WebSocket 伺服器...');

    const serverPath = path.join(__dirname, '..', 'server', 'websocket-server.js');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', [serverPath], {
        env: {
          ...process.env,
          WS_PORT: '3001',
          NODE_ENV: 'development',
          JWT_SECRET: 'test-secret-key',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let startupOutput = '';

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        startupOutput += output;
        
        if (output.includes('WebSocket 服務器啟動在端口')) {
          this.isRunning = true;
          logSuccess('WebSocket 伺服器啟動成功');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        logError(`伺服器錯誤: ${data.toString()}`);
      });

      this.serverProcess.on('error', (error) => {
        logError(`啟動伺服器失敗: ${error.message}`);
        reject(error);
      });

      this.serverProcess.on('exit', (code) => {
        this.isRunning = false;
        if (code !== 0) {
          logError(`伺服器異常退出，代碼: ${code}`);
        }
      });

      // 等待啟動超時
      setTimeout(() => {
        if (!this.isRunning) {
          reject(new Error('伺服器啟動超時'));
        }
      }, 10000);
    });
  }

  stop() {
    if (this.serverProcess && this.isRunning) {
      logInfo('關閉 WebSocket 伺服器...');
      this.serverProcess.kill('SIGTERM');
      this.isRunning = false;
    }
  }
}

/**
 * WebSocket 測試客戶端
 */
class WebSocketTestClient {
  constructor(clientId, options = {}) {
    this.clientId = clientId;
    this.ws = null;
    this.isConnected = false;
    this.messageCount = 0;
    this.receivedMessages = [];
    this.options = options;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      testResults.connections.attempted++;

      const url = new URL(CONFIG.wsUrl);
      url.searchParams.set('userId', `${CONFIG.userId}-${this.clientId}`);
      url.searchParams.set('orgId', CONFIG.organizationId);
      url.searchParams.set('token', CONFIG.authToken);
      url.searchParams.set('events', 'dashboard_data_updated,metric_changed,notification_received');

      logInfo(`客戶端 ${this.clientId} 嘗試連線: ${url.toString()}`);

      this.ws = new WebSocket(url.toString());

      const timeout = setTimeout(() => {
        reject(new Error(`客戶端 ${this.clientId} 連線超時`));
      }, 5000);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        testResults.connections.successful++;
        logSuccess(`客戶端 ${this.clientId} 連線成功`);
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data);
      });

      this.ws.on('close', (code, reason) => {
        this.isConnected = false;
        logInfo(`客戶端 ${this.clientId} 連線關閉: ${code} ${reason}`);
      });

      this.ws.on('error', (error) => {
        clearTimeout(timeout);
        testResults.connections.failed++;
        testResults.errors.push(`客戶端 ${this.clientId} 連線錯誤: ${error.message}`);
        logError(`客戶端 ${this.clientId} 連線錯誤: ${error.message}`);
        reject(error);
      });
    });
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      this.receivedMessages.push(message);
      testResults.messages.received++;

      // 統計不同類型的事件
      switch (message.type) {
        case 'heartbeat':
          testResults.events.heartbeats++;
          this.sendHeartbeatResponse();
          break;
        case 'connection_established':
          logInfo(`客戶端 ${this.clientId} 收到歡迎訊息`);
          break;
        case 'dashboard_data_updated':
          testResults.events.dataUpdates++;
          logInfo(`客戶端 ${this.clientId} 收到資料更新`);
          break;
        case 'notification_received':
          testResults.events.notifications++;
          logInfo(`客戶端 ${this.clientId} 收到通知`);
          break;
        case 'error':
          testResults.events.errors++;
          logError(`客戶端 ${this.clientId} 收到錯誤: ${message.message}`);
          break;
        default:
          logInfo(`客戶端 ${this.clientId} 收到訊息: ${message.type}`);
      }
    } catch (error) {
      testResults.messages.errors++;
      logError(`客戶端 ${this.clientId} 訊息解析錯誤: ${error.message}`);
    }
  }

  sendMessage(message) {
    if (!this.isConnected || !this.ws) {
      logError(`客戶端 ${this.clientId} 未連線，無法發送訊息`);
      return false;
    }

    try {
      const messageWithTimestamp = {
        ...message,
        timestamp: new Date().toISOString(),
      };

      this.ws.send(JSON.stringify(messageWithTimestamp));
      testResults.messages.sent++;
      this.messageCount++;
      return true;
    } catch (error) {
      testResults.messages.errors++;
      logError(`客戶端 ${this.clientId} 發送訊息失敗: ${error.message}`);
      return false;
    }
  }

  sendHeartbeatResponse() {
    this.sendMessage({ type: 'heartbeat_response' });
  }

  sendTestMessage() {
    const testMessages = [
      {
        type: 'ping',
      },
      {
        type: 'subscribe',
        data: { events: ['test_event'] },
      },
      {
        type: 'broadcast',
        data: {
          organizationId: CONFIG.organizationId,
          message: `測試訊息來自客戶端 ${this.clientId}`,
        },
      },
    ];

    const message = testMessages[Math.floor(Math.random() * testMessages.length)];
    return this.sendMessage(message);
  }

  disconnect() {
    if (this.ws && this.isConnected) {
      this.ws.close(1000, 'Test completed');
      this.isConnected = false;
    }
  }

  getStats() {
    return {
      clientId: this.clientId,
      isConnected: this.isConnected,
      messagesSent: this.messageCount,
      messagesReceived: this.receivedMessages.length,
      lastMessage: this.receivedMessages[this.receivedMessages.length - 1],
    };
  }
}

/**
 * 單一客戶端測試
 */
async function testSingleClient() {
  logInfo('執行單一客戶端連線測試...');

  const client = new WebSocketTestClient('single');
  
  try {
    await client.connect();
    
    // 等待歡迎訊息
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 發送測試訊息
    for (let i = 0; i < 3; i++) {
      client.sendTestMessage();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 等待回應
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    client.disconnect();
    
    const stats = client.getStats();
    logSuccess(`單一客戶端測試完成: 發送 ${stats.messagesSent} 條訊息，接收 ${stats.messagesReceived} 條訊息`);
    
  } catch (error) {
    logError(`單一客戶端測試失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 多客戶端併發測試
 */
async function testMultipleClients() {
  logInfo(`執行多客戶端併發測試 (${CONFIG.maxTestUsers} 個客戶端)...`);

  const clients = [];
  const connectPromises = [];

  // 建立並連線所有客戶端
  for (let i = 0; i < CONFIG.maxTestUsers; i++) {
    const client = new WebSocketTestClient(`multi-${i}`);
    clients.push(client);
    connectPromises.push(client.connect());
  }

  try {
    // 等待所有客戶端連線
    await Promise.all(connectPromises);
    logSuccess(`所有 ${CONFIG.maxTestUsers} 個客戶端連線成功`);

    // 持續發送訊息測試
    const testDuration = 10000; // 10 秒
    const startTime = Date.now();

    const messageInterval = setInterval(() => {
      clients.forEach(client => {
        if (client.isConnected) {
          client.sendTestMessage();
        }
      });
    }, CONFIG.messageInterval);

    // 等待測試完成
    await new Promise(resolve => setTimeout(resolve, testDuration));
    clearInterval(messageInterval);

    // 收集統計資訊
    const stats = clients.map(client => client.getStats());
    const totalSent = stats.reduce((sum, stat) => sum + stat.messagesSent, 0);
    const totalReceived = stats.reduce((sum, stat) => sum + stat.messagesReceived, 0);

    logSuccess(`多客戶端測試完成:`);
    logInfo(`  總發送訊息: ${totalSent}`);
    logInfo(`  總接收訊息: ${totalReceived}`);
    logInfo(`  平均每客戶端發送: ${(totalSent / CONFIG.maxTestUsers).toFixed(1)}`);
    logInfo(`  平均每客戶端接收: ${(totalReceived / CONFIG.maxTestUsers).toFixed(1)}`);

    // 斷開所有連線
    clients.forEach(client => client.disconnect());

  } catch (error) {
    logError(`多客戶端測試失敗: ${error.message}`);
    clients.forEach(client => client.disconnect());
    throw error;
  }
}

/**
 * 重連測試
 */
async function testReconnection() {
  logInfo('執行重連功能測試...');

  const client = new WebSocketTestClient('reconnect');
  
  try {
    // 初始連線
    await client.connect();
    logInfo('初始連線建立成功');

    // 模擬連線中斷
    client.ws.close(1000, 'Connection lost');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 重新連線
    await client.connect();
    logSuccess('重連功能測試成功');

    client.disconnect();

  } catch (error) {
    logError(`重連測試失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 訊息格式測試
 */
async function testMessageFormats() {
  logInfo('執行訊息格式測試...');

  const client = new WebSocketTestClient('format');
  
  try {
    await client.connect();

    // 測試各種訊息格式
    const testMessages = [
      { type: 'ping' },
      { type: 'subscribe', data: { events: ['test'] } },
      { type: 'unsubscribe', data: { events: ['test'] } },
      { type: 'invalid_type' }, // 測試未知類型
    ];

    for (const message of testMessages) {
      client.sendMessage(message);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // 等待回應
    await new Promise(resolve => setTimeout(resolve, 2000));

    logSuccess('訊息格式測試完成');
    client.disconnect();

  } catch (error) {
    logError(`訊息格式測試失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 生成測試報告
 */
function generateTestReport() {
  console.log('\n' + '='.repeat(60));
  log('📊 WebSocket 測試報告', colors.bold);
  console.log('='.repeat(60));

  console.log('\n🔗 連線統計:');
  console.log(`  嘗試連線: ${testResults.connections.attempted}`);
  console.log(`  成功連線: ${testResults.connections.successful}`);
  console.log(`  失敗連線: ${testResults.connections.failed}`);
  
  const connectionRate = testResults.connections.attempted > 0 
    ? ((testResults.connections.successful / testResults.connections.attempted) * 100).toFixed(1)
    : '0';
  console.log(`  成功率: ${connectionRate}%`);

  console.log('\n💬 訊息統計:');
  console.log(`  發送訊息: ${testResults.messages.sent}`);
  console.log(`  接收訊息: ${testResults.messages.received}`);
  console.log(`  訊息錯誤: ${testResults.messages.errors}`);

  console.log('\n📡 事件統計:');
  console.log(`  心跳事件: ${testResults.events.heartbeats}`);
  console.log(`  資料更新: ${testResults.events.dataUpdates}`);
  console.log(`  通知事件: ${testResults.events.notifications}`);
  console.log(`  錯誤事件: ${testResults.events.errors}`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ 錯誤列表:');
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  // 評估結果
  console.log('\n🎯 測試結果評估:');
  const isSuccess = testResults.connections.failed === 0 && 
                   testResults.messages.errors === 0 && 
                   testResults.connections.successful > 0;

  if (isSuccess) {
    logSuccess('所有測試通過！WebSocket 功能正常運作。');
  } else {
    logError('測試發現問題，請檢查上述錯誤訊息。');
  }

  return isSuccess;
}

/**
 * 主要測試執行器
 */
async function runAllTests() {
  log('🚀 開始 WebSocket 功能測試', colors.bold + colors.cyan);
  log(`測試目標: ${CONFIG.wsUrl}`);
  log(`最大客戶端數: ${CONFIG.maxTestUsers}`);
  log(`測試超時: ${CONFIG.testTimeout}ms\n`);

  const serverManager = new WebSocketServerManager();
  let testsPassed = false;

  try {
    // 啟動 WebSocket 伺服器
    await serverManager.start();
    
    // 等待伺服器完全啟動
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 執行各項測試
    await testSingleClient();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testMultipleClients();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testReconnection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testMessageFormats();

    testsPassed = true;

  } catch (error) {
    logError(`測試執行失敗: ${error.message}`);
    testResults.errors.push(`測試執行錯誤: ${error.message}`);
  } finally {
    // 關閉伺服器
    serverManager.stop();
  }

  // 生成測試報告
  const allTestsPassed = generateTestReport() && testsPassed;
  
  // 返回結果
  process.exit(allTestsPassed ? 0 : 1);
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

// 優雅關閉
process.on('SIGINT', () => {
  logInfo('收到中斷信號，正在清理...');
  process.exit(0);
});

// 如果直接執行此腳本
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  WebSocketTestClient,
  WebSocketServerManager,
  testResults,
  CONFIG,
};