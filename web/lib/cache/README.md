# DonnaAI Dashboard 快取系統

本文件說明 DonnaAI 儀表板快取系統的架構、使用方法和配置選項。

## 系統架構

快取系統採用分層架構設計，支援多種快取後端：

```
Application Layer
├── Dashboard APIs
└── Cache Manager
    ├── Cache Interface (抽象層)
    ├── Redis Cache (生產環境)
    ├── Memory Cache (開發環境)
    └── Cache Factory (工廠模式)
```

## 核心元件

### 1. 快取介面 (`cache-interface.ts`)
- 定義統一的快取操作抽象層
- 支援基本 CRUD 操作和高級功能
- 包含統計資訊和健康檢查介面

### 2. Redis 快取 (`redis-cache.ts`)
- 生產環境使用的高效能快取
- 支援連接池、自動重連、錯誤處理
- 包含序列化/反序列化和統計追蹤

### 3. 記憶體快取 (`memory-cache.ts`)
- 開發環境或備用方案
- 基於 NodeCache 實作
- 支援 TTL 和記憶體限制

### 4. 快取工廠 (`cache-factory.ts`)
- 根據配置建立適當的快取實例
- 支援多實例管理和故障回退
- 提供配置建構器和預設配置

### 5. 儀表板快取管理器 (`dashboard-cache-manager.ts`)
- 專門針對儀表板資料的快取策略
- 支援智能快取更新和失效策略
- 包含快取預熱和清理功能

## 使用方法

### 基本使用

```typescript
import { dashboardCacheManager } from '@/lib/cache/dashboard-cache-manager';

// 快取組織指標
await dashboardCacheManager.cacheOrganizationMetrics(orgId, metrics);

// 獲取快取資料
const metrics = await dashboardCacheManager.getOrganizationMetrics(orgId);

// 使無效快取
await dashboardCacheManager.invalidateOrganizationCache(orgId);
```

### 進階使用

```typescript
import { CacheFactory, CacheConfigBuilder } from '@/lib/cache/cache-factory';

// 建立自定義快取實例
const config = CacheConfigBuilder.create()
  .type('redis')
  .keyPrefix('custom:')
  .defaultTTL(3600)
  .redis({
    host: 'localhost',
    port: 6379,
    password: 'your-password'
  })
  .build();

const cache = CacheFactory.createCache(config, 'custom-instance');
```

## 配置選項

### 環境變數

在 `.env` 檔案中設定以下變數：

```bash
# Redis 配置（生產環境）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# 快取配置
CACHE_TYPE=memory
CACHE_DEFAULT_TTL=3600
CACHE_KEY_PREFIX=dashboard:
```

### TTL 配置

不同類型的資料使用不同的快取時間：

- **即時資料**: 60 秒
- **統計指標**: 300 秒 (5 分鐘)
- **趨勢資料**: 1800 秒 (30 分鐘)
- **團隊狀態**: 120 秒 (2 分鐘)
- **AI 查詢結果**: 3600 秒 (1 小時)
- **使用者偏好**: 86400 秒 (24 小時)

## API 整合

### 儀表板指標 API

```typescript
// GET /api/dashboard/metrics
import { dashboardCacheManager } from '@/lib/cache/dashboard-cache-manager';

// 檢查快取
let metrics = await dashboardCacheManager.getOrganizationMetrics(orgId);

if (!metrics) {
  // 從資料庫獲取
  metrics = await getDashboardMetrics(params);
  
  // 存入快取
  await dashboardCacheManager.cacheOrganizationMetrics(orgId, metrics);
}
```

### 智能快取更新

```typescript
// 當資料變更時觸發快取更新
await dashboardCacheManager.smartCacheUpdate(
  organizationId,
  'customer', // 更新類型
  customerData
);
```

## 監控與健康檢查

### 健康檢查 API

```
GET /api/health/cache
```

檢查項目：
- 連接狀態
- 效能測試
- 記憶體使用
- 操作功能

### 快取統計

```typescript
const stats = await dashboardCacheManager.getCacheStats();
console.log('快取統計:', stats);
```

統計資訊包含：
- 總鍵數量
- 命中率
- 記憶體使用量
- 連接數（Redis）

## 最佳實踐

### 1. 快取策略

- **熱資料**: 使用短 TTL，頻繁更新
- **冷資料**: 使用長 TTL，減少資料庫負載
- **使用者特定資料**: 使用中等 TTL，平衡一致性和效能

### 2. 失效策略

- **主動失效**: 資料變更時立即失效相關快取
- **被動失效**: 依靠 TTL 自動過期
- **批次失效**: 使用模式匹配批次清理

### 3. 錯誤處理

- **優雅降級**: 快取失效時回退到資料庫
- **重試機制**: Redis 連接失敗時自動重試
- **監控告警**: 監控快取命中率和錯誤率

### 4. 效能優化

- **序列化優化**: 使用高效的序列化格式
- **連接池**: 複用 Redis 連接
- **批次操作**: 減少網路往返次數

## 故障排除

### 常見問題

1. **Redis 連接失敗**
   - 檢查 Redis 伺服器狀態
   - 驗證連接配置
   - 檢查防火牆設定

2. **快取命中率低**
   - 檢查 TTL 設定
   - 分析資料存取模式
   - 優化快取鍵設計

3. **記憶體使用過高**
   - 設定適當的記憶體限制
   - 實作快取清理策略
   - 使用快取統計監控

### 除錯工具

```typescript
// 啟用除錯模式
process.env.DEBUG = 'cache:*';

// 檢查快取狀態
const status = await CacheFactory.getAllInstancesStatus();
console.log('快取實例狀態:', status);
```

## 部署建議

### 開發環境
- 使用記憶體快取
- 設定較短的 TTL
- 啟用除錯日誌

### 測試環境
- 使用記憶體快取或輕量 Redis
- 模擬生產環境配置
- 執行快取效能測試

### 生產環境
- 使用 Redis 集群
- 設定適當的記憶體限制
- 啟用監控和告警
- 定期備份快取配置

## 擴展指南

### 新增快取類型

1. 實作 `CacheInterface` 介面
2. 在 `CacheFactory` 中註冊新類型
3. 更新配置選項
4. 新增對應的測試

### 自定義快取策略

1. 擴展 `DashboardCacheManager`
2. 新增特定的快取方法
3. 定義適當的 TTL 配置
4. 實作失效策略

---

更多詳細資訊請參考各個檔案的 JSDoc 註釋和內聯說明。