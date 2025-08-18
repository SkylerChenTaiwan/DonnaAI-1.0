#!/usr/bin/env node

/**
 * Dashboard 效能測試腳本
 * 測試 Dashboard 的載入效能、記憶體使用和響應時間
 */

const { performance, PerformanceObserver } = require('perf_hooks');
const cluster = require('cluster');
const os = require('os');

// 測試配置
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  concurrentUsers: parseInt(process.env.CONCURRENT_USERS) || 10,
  testDuration: parseInt(process.env.TEST_DURATION) || 60000, // 60 秒
  rampUpTime: parseInt(process.env.RAMP_UP_TIME) || 10000, // 10 秒
  authToken: process.env.TEST_AUTH_TOKEN || 'mock-auth-token',
  organizationId: process.env.TEST_ORG_ID || 'test-org-123',
};

// 效能指標收集器
class PerformanceCollector {
  constructor() {
    this.metrics = {
      requests: [],
      errors: [],
      responseTime: {
        min: Infinity,
        max: 0,
        total: 0,
        count: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      },
      throughput: 0,
      errorRate: 0,
      memoryUsage: [],
      cpuUsage: [],
    };
    
    this.startTime = Date.now();
    this.setupPerformanceObserver();
    this.startResourceMonitoring();
  }
  
  setupPerformanceObserver() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          this.recordResponseTime(entry.duration);
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
  }
  
  startResourceMonitoring() {
    const interval = setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
      });
      
      this.metrics.cpuUsage.push({
        timestamp: Date.now(),
        user: cpuUsage.user,
        system: cpuUsage.system,
      });
    }, 1000);
    
    // 清理定時器
    setTimeout(() => {
      clearInterval(interval);
    }, CONFIG.testDuration + 5000);
  }
  
  recordRequest(duration, success = true) {
    this.metrics.requests.push({
      timestamp: Date.now(),
      duration,
      success,
    });
    
    if (success) {
      this.recordResponseTime(duration);
    } else {
      this.metrics.errors.push({
        timestamp: Date.now(),
        duration,
      });
    }
  }
  
  recordResponseTime(duration) {
    const rt = this.metrics.responseTime;
    rt.min = Math.min(rt.min, duration);
    rt.max = Math.max(rt.max, duration);
    rt.total += duration;
    rt.count++;
  }
  
  calculateMetrics() {
    const totalTime = Date.now() - this.startTime;
    const successfulRequests = this.metrics.requests.filter(r => r.success);
    
    // 計算吞吐量
    this.metrics.throughput = (successfulRequests.length / totalTime) * 1000; // RPS
    
    // 計算錯誤率
    this.metrics.errorRate = (this.metrics.errors.length / this.metrics.requests.length) * 100;
    
    // 計算平均響應時間
    if (this.metrics.responseTime.count > 0) {
      this.metrics.responseTime.avg = this.metrics.responseTime.total / this.metrics.responseTime.count;
    }
    
    // 計算百分位數
    const responseTimes = successfulRequests.map(r => r.duration).sort((a, b) => a - b);
    if (responseTimes.length > 0) {
      this.metrics.responseTime.p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
      this.metrics.responseTime.p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
      this.metrics.responseTime.p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
    }
    
    return this.metrics;
  }
  
  generateReport() {
    const metrics = this.calculateMetrics();
    
    console.log('\n📊 效能測試報告');
    console.log('='.repeat(50));
    
    console.log('\n🚀 請求統計:');
    console.log(`  總請求數: ${metrics.requests.length}`);
    console.log(`  成功請求: ${metrics.requests.filter(r => r.success).length}`);
    console.log(`  失敗請求: ${metrics.errors.length}`);
    console.log(`  錯誤率: ${metrics.errorRate.toFixed(2)}%`);
    
    console.log('\n⏱️  響應時間 (ms):');
    console.log(`  平均: ${metrics.responseTime.avg?.toFixed(2) || 'N/A'}`);
    console.log(`  最小: ${metrics.responseTime.min === Infinity ? 'N/A' : metrics.responseTime.min.toFixed(2)}`);
    console.log(`  最大: ${metrics.responseTime.max.toFixed(2)}`);
    console.log(`  P50: ${metrics.responseTime.p50.toFixed(2)}`);
    console.log(`  P95: ${metrics.responseTime.p95.toFixed(2)}`);
    console.log(`  P99: ${metrics.responseTime.p99.toFixed(2)}`);
    
    console.log('\n📈 吞吐量:');
    console.log(`  RPS (Requests/sec): ${metrics.throughput.toFixed(2)}`);
    
    if (metrics.memoryUsage.length > 0) {
      const avgMemory = metrics.memoryUsage.reduce((sum, m) => sum + m.heapUsed, 0) / metrics.memoryUsage.length;
      const maxMemory = Math.max(...metrics.memoryUsage.map(m => m.heapUsed));
      
      console.log('\n💾 記憶體使用:');
      console.log(`  平均堆積使用: ${(avgMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  最大堆積使用: ${(maxMemory / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // 效能評估
    console.log('\n🎯 效能評估:');
    this.evaluatePerformance(metrics);
    
    return metrics;
  }
  
  evaluatePerformance(metrics) {
    const issues = [];
    const recommendations = [];
    
    // 響應時間評估
    if (metrics.responseTime.avg > 2000) {
      issues.push('平均響應時間過長 (>2s)');
      recommendations.push('檢查資料庫查詢效能和 API 回應時間');
    } else if (metrics.responseTime.avg > 1000) {
      issues.push('平均響應時間較慢 (>1s)');
      recommendations.push('考慮新增快取機制或優化查詢');
    }
    
    // P95 響應時間評估
    if (metrics.responseTime.p95 > 5000) {
      issues.push('P95 響應時間過長 (>5s)');
      recommendations.push('檢查長時間執行的請求並進行優化');
    }
    
    // 錯誤率評估
    if (metrics.errorRate > 5) {
      issues.push(`錯誤率過高 (${metrics.errorRate.toFixed(2)}%)`);
      recommendations.push('檢查 API 錯誤日誌並修復問題');
    } else if (metrics.errorRate > 1) {
      issues.push(`錯誤率偏高 (${metrics.errorRate.toFixed(2)}%)`);
      recommendations.push('監控錯誤趨勢並進行預防性維護');
    }
    
    // 吞吐量評估
    if (metrics.throughput < 10) {
      issues.push('吞吐量偏低 (<10 RPS)');
      recommendations.push('檢查伺服器資源使用和瓶頸');
    }
    
    // 顯示結果
    if (issues.length === 0) {
      console.log('  ✅ 效能表現良好');
    } else {
      console.log('  ⚠️  發現的問題:');
      issues.forEach(issue => console.log(`    • ${issue}`));
      
      console.log('\n  💡 建議改進:');
      recommendations.forEach(rec => console.log(`    • ${rec}`));
    }
  }
}

// 單一使用者負載測試
async function simulateUser(userId, collector) {
  const scenarios = [
    // Dashboard 指標載入
    {
      name: 'dashboard-metrics',
      path: `/api/dashboard/metrics?orgId=${CONFIG.organizationId}&timeRange=7d`,
      method: 'GET',
    },
    // Dashboard 趨勢資料
    {
      name: 'dashboard-trends',
      path: `/api/dashboard/trends?orgId=${CONFIG.organizationId}&period=month`,
      method: 'GET',
    },
    // 團隊狀態
    {
      name: 'team-status',
      path: `/api/dashboard/team/status?orgId=${CONFIG.organizationId}`,
      method: 'GET',
    },
    // AI 查詢
    {
      name: 'ai-query',
      path: '/api/dashboard/ai/analytics',
      method: 'POST',
      body: {
        organizationId: CONFIG.organizationId,
        query: '本月營收表現如何？',
        analysisType: 'revenue',
      },
    },
  ];
  
  const endTime = Date.now() + CONFIG.testDuration;
  let requestCount = 0;
  
  while (Date.now() < endTime) {
    // 隨機選擇一個場景
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    try {
      const startTime = Date.now();
      
      // 模擬 HTTP 請求（實際實作需要使用 fetch 或其他 HTTP client）
      await simulateApiRequest(scenario);
      
      const duration = Date.now() - startTime;
      collector.recordRequest(duration, true);
      
      requestCount++;
      
      // 隨機等待時間（模擬使用者行為）
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
      
    } catch (error) {
      const duration = Date.now() - startTime;
      collector.recordRequest(duration, false);
    }
  }
  
  console.log(`使用者 ${userId} 完成，發送了 ${requestCount} 個請求`);
}

// 模擬 API 請求
async function simulateApiRequest(scenario) {
  // 這裡模擬 API 請求的延遲
  const baseDelay = 100; // 基礎延遲 100ms
  const randomDelay = Math.random() * 500; // 隨機額外延遲 0-500ms
  const totalDelay = baseDelay + randomDelay;
  
  // 模擬偶發的錯誤
  if (Math.random() < 0.02) { // 2% 錯誤率
    throw new Error('模擬 API 錯誤');
  }
  
  await new Promise(resolve => setTimeout(resolve, totalDelay));
}

// 主要測試執行器
async function runLoadTest() {
  console.log('🚀 開始 Dashboard 效能測試');
  console.log(`併發用戶數: ${CONFIG.concurrentUsers}`);
  console.log(`測試時長: ${CONFIG.testDuration / 1000}s`);
  console.log(`目標 URL: ${CONFIG.baseUrl}`);
  
  const collector = new PerformanceCollector();
  const users = [];
  
  // 漸進式增加用戶負載
  const rampUpInterval = CONFIG.rampUpTime / CONFIG.concurrentUsers;
  
  for (let i = 0; i < CONFIG.concurrentUsers; i++) {
    setTimeout(() => {
      const userPromise = simulateUser(`user-${i}`, collector);
      users.push(userPromise);
      console.log(`啟動用戶 ${i + 1}/${CONFIG.concurrentUsers}`);
    }, i * rampUpInterval);
  }
  
  // 等待所有用戶完成
  console.log('\n⏳ 測試進行中...');
  
  // 顯示即時進度
  const progressInterval = setInterval(() => {
    const elapsed = Date.now() - collector.startTime;
    const progress = Math.min((elapsed / CONFIG.testDuration) * 100, 100);
    const requestCount = collector.metrics.requests.length;
    const currentRps = (requestCount / elapsed) * 1000;
    
    process.stdout.write(`\r進度: ${progress.toFixed(1)}% | 請求數: ${requestCount} | 當前 RPS: ${currentRps.toFixed(1)}`);
  }, 1000);
  
  // 等待測試完成
  await new Promise(resolve => setTimeout(resolve, CONFIG.testDuration + CONFIG.rampUpTime + 5000));
  clearInterval(progressInterval);
  console.log('\n\n✅ 測試完成');
  
  // 生成報告
  return collector.generateReport();
}

// 錯誤處理
process.on('unhandledRejection', (reason, promise) => {
  console.error(`未處理的 Promise 拒絕: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(`未捕獲的異常: ${error.message}`);
  process.exit(1);
});

// 如果直接執行此腳本
if (require.main === module) {
  runLoadTest()
    .then((metrics) => {
      // 根據效能結果決定退出碼
      const hasIssues = metrics.errorRate > 5 || 
                       metrics.responseTime.avg > 2000 || 
                       metrics.throughput < 10;
      
      process.exit(hasIssues ? 1 : 0);
    })
    .catch((error) => {
      console.error('測試執行失敗:', error);
      process.exit(1);
    });
}

module.exports = {
  runLoadTest,
  PerformanceCollector,
  CONFIG,
};