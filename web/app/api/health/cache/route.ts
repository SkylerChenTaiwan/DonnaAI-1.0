/**
 * 快取健康檢查 API
 * GET /api/health/cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { dashboardCacheManager } from '@/lib/cache/dashboard-cache-manager';
import { CacheFactory } from '@/lib/cache/cache-factory';

export async function GET(request: NextRequest) {
  try {
    // 驗證使用者身份（可選，根據需求決定）
    const session = await getServerSession(authOptions);
    
    // 如果需要限制存取權限
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: '未授權存取' } 
        },
        { status: 401 }
      );
    }

    const startTime = Date.now();

    // 執行健康檢查
    const healthStatus = await performCacheHealthCheck();
    const processingTime = Date.now() - startTime;

    const response = {
      success: true,
      data: {
        status: healthStatus.overall,
        checks: healthStatus.checks,
        performance: {
          responseTime: processingTime,
          timestamp: new Date().toISOString()
        },
        recommendations: healthStatus.recommendations
      },
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date(),
        processingTime,
        version: '1.0.0'
      }
    };

    const statusCode = healthStatus.overall === 'healthy' ? 200 : 503;
    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('Cache health check API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '健康檢查失敗',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      },
      { status: 500 }
    );
  }
}

/**
 * 執行快取健康檢查
 */
async function performCacheHealthCheck() {
  const checks = {
    connection: { status: 'unknown', message: '', responseTime: 0 },
    performance: { status: 'unknown', message: '', responseTime: 0 },
    memory: { status: 'unknown', message: '', responseTime: 0 },
    operations: { status: 'unknown', message: '', responseTime: 0 }
  };

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  const recommendations: string[] = [];

  try {
    // 1. 連接檢查
    const connectionStart = Date.now();
    const isHealthy = await dashboardCacheManager.healthCheck();
    checks.connection.responseTime = Date.now() - connectionStart;
    
    if (isHealthy) {
      checks.connection.status = 'healthy';
      checks.connection.message = '快取連接正常';
    } else {
      checks.connection.status = 'unhealthy';
      checks.connection.message = '快取連接失敗';
      overallStatus = 'unhealthy';
      recommendations.push('檢查快取伺服器連接');
    }

    // 2. 效能檢查
    const perfStart = Date.now();
    await performPerformanceCheck();
    checks.performance.responseTime = Date.now() - perfStart;
    
    if (checks.performance.responseTime < 100) {
      checks.performance.status = 'healthy';
      checks.performance.message = `回應時間正常 (${checks.performance.responseTime}ms)`;
    } else if (checks.performance.responseTime < 500) {
      checks.performance.status = 'degraded';
      checks.performance.message = `回應時間較慢 (${checks.performance.responseTime}ms)`;
      if (overallStatus === 'healthy') overallStatus = 'degraded';
      recommendations.push('檢查快取伺服器負載');
    } else {
      checks.performance.status = 'unhealthy';
      checks.performance.message = `回應時間過慢 (${checks.performance.responseTime}ms)`;
      overallStatus = 'unhealthy';
      recommendations.push('快取伺服器回應過慢，需要立即檢查');
    }

    // 3. 記憶體使用檢查
    const memoryStart = Date.now();
    const stats = await dashboardCacheManager.getCacheStats();
    checks.memory.responseTime = Date.now() - memoryStart;

    if (stats.memoryUsage < 512 * 1024 * 1024) { // 512MB
      checks.memory.status = 'healthy';
      checks.memory.message = `記憶體使用正常 (${Math.round(stats.memoryUsage / 1024 / 1024)}MB)`;
    } else if (stats.memoryUsage < 1024 * 1024 * 1024) { // 1GB
      checks.memory.status = 'degraded';
      checks.memory.message = `記憶體使用偏高 (${Math.round(stats.memoryUsage / 1024 / 1024)}MB)`;
      if (overallStatus === 'healthy') overallStatus = 'degraded';
      recommendations.push('考慮清理過期快取');
    } else {
      checks.memory.status = 'unhealthy';
      checks.memory.message = `記憶體使用過高 (${Math.round(stats.memoryUsage / 1024 / 1024)}MB)`;
      overallStatus = 'unhealthy';
      recommendations.push('記憶體使用過高，需要立即處理');
    }

    // 4. 操作檢查
    const opsStart = Date.now();
    await performOperationsCheck();
    checks.operations.responseTime = Date.now() - opsStart;
    
    checks.operations.status = 'healthy';
    checks.operations.message = '快取操作正常';

  } catch (error) {
    console.error('Health check error:', error);
    overallStatus = 'unhealthy';
    recommendations.push(`健康檢查過程中發生錯誤: ${error.message}`);
    
    // 標記所有未檢查的項目為異常
    Object.keys(checks).forEach(key => {
      if (checks[key].status === 'unknown') {
        checks[key].status = 'unhealthy';
        checks[key].message = '檢查失敗';
      }
    });
  }

  return {
    overall: overallStatus,
    checks,
    recommendations
  };
}

/**
 * 效能檢查
 */
async function performPerformanceCheck(): Promise<void> {
  const testKey = `health:perf:test:${Date.now()}`;
  const testData = { timestamp: Date.now(), test: 'performance' };
  
  // 測試寫入
  await dashboardCacheManager.cacheRealtimeStats('test-org', testData, 10);
  
  // 測試讀取
  const retrieved = await dashboardCacheManager.getRealtimeStats('test-org');
  
  if (!retrieved || retrieved.timestamp !== testData.timestamp) {
    throw new Error('快取讀寫測試失敗');
  }
  
  // 清理測試資料
  await dashboardCacheManager.invalidateOrganizationCache('test-org');
}

/**
 * 操作檢查
 */
async function performOperationsCheck(): Promise<void> {
  const testOrgId = `test:health:${Date.now()}`;
  
  try {
    // 測試各種操作
    await dashboardCacheManager.cacheRealtimeStats(testOrgId, { test: true }, 5);
    
    const exists = await dashboardCacheManager.getRealtimeStats(testOrgId);
    if (!exists) {
      throw new Error('快取存取測試失敗');
    }
    
    // 測試快取失效
    await dashboardCacheManager.invalidateOrganizationCache(testOrgId);
    
    const afterInvalidate = await dashboardCacheManager.getRealtimeStats(testOrgId);
    if (afterInvalidate !== null) {
      throw new Error('快取失效測試失敗');
    }
    
  } catch (error) {
    throw new Error(`操作測試失敗: ${error.message}`);
  }
}

/**
 * 快取統計資訊 API
 * GET /api/health/cache?stats=true
 */
export async function OPTIONS(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const includeStats = searchParams.get('stats') === 'true';
  
  if (!includeStats) {
    return NextResponse.json({ message: 'Use GET for health check' });
  }

  try {
    const stats = await dashboardCacheManager.getCacheStats();
    const instances = await CacheFactory.getAllInstancesStatus();

    return NextResponse.json({
      success: true,
      data: {
        global: stats,
        instances,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'STATS_ERROR', message: '無法獲取快取統計' }
      },
      { status: 500 }
    );
  }
}