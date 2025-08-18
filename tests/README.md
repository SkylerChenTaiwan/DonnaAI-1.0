# Dashboard 即時資料更新功能測試套件

本測試套件針對 Dashboard 即時資料更新功能進行全面的測試，包含以下測試類型：

## 🧪 測試類型

### 1. End-to-End (E2E) 測試
- **檔案**: `e2e/dashboard-realtime.test.ts`
- **工具**: Playwright
- **涵蓋範圍**:
  - 即時連線建立和維護
  - SSE 串流和 WebSocket 連線測試
  - Dashboard 互動功能（拖拽、編輯、佈局）
  - 圖表容器互動和配置
  - AI 查詢介面（文字和語音輸入）
  - 整體 UX 流程和錯誤處理
  - 響應式設計和效能測試

### 2. 整合測試
- **檔案**: `integration/realtime-connection.test.ts`
- **工具**: Jest + Mock SSE Server
- **涵蓋範圍**:
  - SSE 連線建立和心跳機制
  - 多個併發連線管理
  - 事件廣播和訊息處理
  - 連線穩定性和錯誤恢復
  - 網路中斷和重連機制

### 3. 單元測試
- **檔案**: `unit/dashboard-hooks.test.ts`
- **工具**: Jest + React Testing Library
- **涵蓋範圍**:
  - `useRealTimeData` hook 功能
  - 事件處理和訂閱機制
  - 重連邏輯和錯誤處理
  - 心跳和訊息發送
  - 專用 hooks（metrics、notifications）

### 4. 效能測試
- **檔案**: `performance/dashboard-performance.test.ts`
- **工具**: Puppeteer + Performance APIs
- **涵蓋範圍**:
  - 頁面載入時間和記憶體使用
  - 互動響應時間測試
  - 即時連線和資料更新效能
  - 記憶體洩漏檢測
  - 大量事件處理壓力測試

## 🚀 執行測試

### 前置準備

```bash
# 安裝依賴
npm install

# 安裝 Playwright browsers（僅 E2E 測試需要）
npx playwright install
```

### 執行全部測試

```bash
# 執行所有測試
npm test

# 執行特定類型的測試
npm run test:unit      # 單元測試
npm run test:integration  # 整合測試
npm run test:e2e       # E2E 測試
npm run test:performance  # 效能測試
```

### 執行單個測試檔案

```bash
# 執行特定測試檔案
npx jest tests/unit/dashboard-hooks.test.ts

# 執行 E2E 測試
npx playwright test tests/e2e/dashboard-realtime.test.ts

# 執行效能測試
npx jest tests/performance/dashboard-performance.test.ts
```

### 開發模式執行

```bash
# Watch 模式執行單元測試
npm run test:unit -- --watch

# 以 headed 模式執行 E2E 測試（可視化）
npx playwright test --headed
```

## 📊 測試報告

### 測試覆蓋率報告

```bash
# 生成覆蓋率報告
npm run test:coverage

# 檢視覆蓋率報告（自動開啟瀏覽器）
npm run test:coverage:open
```

### E2E 測試報告

```bash
# 生成 Playwright 測試報告
npx playwright show-report
```

### 效能基準測試

```bash
# 執行完整的效能基準測試
npm run test:benchmark
```

## 🎯 測試重點功能

### 即時連線測試
- ✅ SSE 連線建立和維護
- ✅ WebSocket 備援機制
- ✅ 心跳檢測和自動重連
- ✅ 連線狀態指示和錯誤處理

### Dashboard 互動測試
- ✅ 小工具拖拽和重新排列
- ✅ 佈局模式切換（檢視/編輯）
- ✅ 小工具鎖定和全螢幕功能
- ✅ 響應式網格系統

### 圖表互動測試
- ✅ 圖表類型動態切換
- ✅ 時間範圍選擇和篩選
- ✅ 即時資料更新顯示
- ✅ 圖表配置面板操作

### AI 查詢介面測試
- ✅ 文字查詢輸入和處理
- ✅ 語音輸入功能（如果支援）
- ✅ 快速查詢按鈕
- ✅ 查詢回應互動和反饋

### 效能和穩定性測試
- ✅ 頁面載入時間優化
- ✅ 記憶體洩漏檢測
- ✅ 大量即時事件處理
- ✅ 長時間連線穩定性

## 🛠️ 測試配置

### Jest 配置
測試配置位於 `jest.config.js`：

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx'
  ],
  collectCoverageFrom: [
    'web/**/*.{ts,tsx}',
    '!web/**/*.d.ts',
    '!web/node_modules/**'
  ]
};
```

### Playwright 配置
E2E 測試配置位於 `playwright.config.ts`：

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  }
});
```

## 🔍 測試資料和模擬

### Mock 資料
測試使用模擬資料來確保一致性：

```typescript
const mockDashboardData = {
  metrics: [
    { name: '本月營收', value: '$125,430', change: 12.5 },
    { name: '新增客戶', value: '34', change: 8.3 }
  ],
  realTimeEvents: [
    { type: 'dashboard_data_updated', data: { ... } },
    { type: 'metric_changed', data: { ... } }
  ]
};
```

### 環境變數
測試環境變數設定：

```bash
# .env.test
TEST_DASHBOARD_URL=http://localhost:3000/dashboard
TEST_SSE_ENDPOINT=http://localhost:3000/api/realtime/events
TEST_TIMEOUT=30000
```

## 🐛 常見問題和解決方案

### 1. E2E 測試逾時
```bash
# 增加逾時時間
npx playwright test --timeout=60000
```

### 2. SSE 連線失敗
檢查伺服器是否正在運行：
```bash
npm run dev  # 啟動開發伺服器
```

### 3. 記憶體測試不穩定
確保測試環境有足夠的記憶體：
```bash
node --max-old-space-size=4096 node_modules/.bin/jest
```

### 4. 語音測試失敗
語音輸入測試需要瀏覽器支援：
```typescript
// 檢查語音 API 是否可用
if ('webkitSpeechRecognition' in window) {
  // 執行語音測試
} else {
  test.skip(); // 跳過不支援的瀏覽器
}
```

## 📈 持續改進

### 測試指標目標
- **單元測試覆蓋率**: > 90%
- **E2E 測試覆蓋率**: > 80%
- **頁面載入時間**: < 3 秒
- **互動響應時間**: < 200ms
- **記憶體增長**: < 50%

### 新增測試案例
當添加新功能時，請確保：
1. 編寫對應的單元測試
2. 更新 E2E 測試腳本
3. 考慮效能影響
4. 更新測試文檔

### 測試自動化
建議將測試整合到 CI/CD 流程：

```yaml
# .github/workflows/test.yml
name: Test Dashboard
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run test:performance
```

## 💡 最佳實踐

1. **保持測試獨立**: 每個測試應該能夠獨立運行
2. **使用描述性測試名稱**: 清楚描述測試的目的和預期結果
3. **適當使用 Mock**: 隔離被測試的功能
4. **定期更新測試**: 隨著功能更新同步更新測試
5. **監控測試效能**: 避免測試本身成為瓶頸

---

如有任何測試相關問題或建議，請聯繫開發團隊或提交 Issue。