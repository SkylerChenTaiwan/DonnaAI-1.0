# PRP-99: 跨平台測試框架完整建立

## Goal
建立完整的跨平台測試框架，整合前五個 PRP 的測試需求，實現自動化的單元測試、整合測試、視覺回歸測試和 E2E 測試，確保整個架構重構的品質和穩定性。

## Why
- **測試覆蓋不足**: 當前測試覆蓋率不均，大型元件缺乏充分的測試保護
- **跨平台一致性風險**: Web 和 Mobile 平台行為差異可能導致未預期的 bug
- **重構風險控制**: 大規模架構重構需要完整的測試護欄確保不引入回歸
- **CI/CD 管道缺失**: 缺乏自動化測試管道，無法及早發現問題
- **視覺回歸檢測**: 樣式系統重構後需要自動化視覺一致性檢查
- **效能監控缺失**: 大型元件重構後的效能影響需要量化追蹤

## What
建立完整的測試生態系統，涵蓋開發到部署的全生命週期：

1. **統一測試框架** - 整合 Vitest、Testing Library、Storybook 的完整方案
2. **跨平台一致性測試** - Web/Mobile 行為對等性自動驗證
3. **視覺回歸測試系統** - 自動化 UI 變更檢測和審查
4. **效能基準測試** - 重構前後效能對比和監控
5. **E2E 測試管道** - 關鍵使用者流程的自動化測試
6. **CI/CD 整合** - 完整的持續整合和部署測試管道

### Success Criteria
- [ ] 整體測試覆蓋率達到 90%+，關鍵路徑 100%
- [ ] 跨平台一致性測試套件涵蓋所有 Adaptive Components
- [ ] 視覺回歸測試自動化運行，誤報率 <2%
- [ ] E2E 測試涵蓋 5 個關鍵使用者流程
- [ ] 效能基準測試建立，重構前後對比報告自動生成
- [ ] CI/CD 管道建立，測試失敗自動阻止部署
- [ ] 測試執行時間最佳化，全套測試 <10 分鐘

## All Needed Context

### Documentation & References
```yaml
- url: https://vitest.dev/guide/testing-library.html
  why: Vitest 與 Testing Library 整合的最佳實踐

- url: https://playwright.dev/docs/test-components
  why: 元件級別 E2E 測試和視覺測試方案

- url: https://storybook.js.org/docs/writing-tests/visual-testing
  why: Storybook 視覺測試整合方案

- url: https://github.com/callstack/react-native-testing-library
  why: React Native 測試的標準實現

- url: https://docs.github.com/en/actions/automating-builds-and-tests
  why: GitHub Actions CI/CD 設定參考

- file: /vitest.config.ts
  why: 現有測試配置，需要大幅擴展

- file: /src/tests/services/import/AssignmentEngine.test.ts
  why: 現有測試模式參考，vi.mock 和測試資料準備

- file: /src/components/users/stages/UserFileUploader.tsx
  why: 大型元件測試挑戰的典型案例

- file: /.github/workflows/ (if exists)
  why: 現有 CI/CD 配置，需要整合測試管道
```

### Current Testing Landscape
```bash
src/
├── tests/
│   └── services/import/
│       └── AssignmentEngine.test.ts    # 現有測試範例
├── vitest.config.ts                    # 基本 Vitest 配置
└── package.json                        # 測試相關依賴
```

### Desired Testing Architecture
```bash
src/
├── tests/
│   ├── unit/                           # 🆕 單元測試
│   │   ├── components/                 # 元件單元測試
│   │   │   ├── adaptive/               # Adaptive Components 測試
│   │   │   ├── forms/                  # 表單系統測試
│   │   │   ├── database/               # 資料庫元件測試
│   │   │   └── file-upload/            # 檔案上傳測試
│   │   ├── hooks/                      # Custom Hooks 測試
│   │   ├── services/                   # 服務層測試
│   │   └── utils/                      # 工具函數測試
│   ├── integration/                    # 🆕 整合測試
│   │   ├── user-flows/                 # 使用者流程測試
│   │   ├── api-integration/            # API 整合測試
│   │   └── cross-platform/             # 跨平台整合測試
│   ├── visual/                         # 🆕 視覺回歸測試
│   │   ├── components/                 # 元件視覺測試
│   │   ├── pages/                      # 頁面視覺測試
│   │   ├── themes/                     # 主題視覺測試
│   │   └── responsive/                 # 響應式視覺測試
│   ├── e2e/                            # 🆕 E2E 測試
│   │   ├── user-journeys/              # 完整使用者旅程
│   │   ├── cross-browser/              # 跨瀏覽器測試
│   │   └── performance/                # 效能 E2E 測試
│   ├── performance/                    # 🆕 效能測試
│   │   ├── benchmarks/                 # 基準測試
│   │   ├── load-testing/               # 負載測試
│   │   └── memory-profiling/           # 記憶體分析
│   ├── fixtures/                       # 🆕 測試資料和 Mock
│   │   ├── api-responses/              # API 回應 Mock
│   │   ├── test-data/                  # 測試資料集
│   │   └── screenshots/                # 基準截圖
│   └── utils/                          # 🆕 測試工具
│       ├── test-helpers.ts             # 測試輔助函數
│       ├── mock-factories.ts           # Mock 工廠
│       └── setup-files/                # 測試設定檔案
├── .storybook/                         # 🆕 Storybook 配置
│   ├── main.ts                         # Storybook 主配置
│   ├── preview.ts                      # 全域設定和裝飾器
│   └── test-runner.ts                  # 視覺測試配置
├── playwright.config.ts                # 🆕 Playwright 配置
├── .github/workflows/                  # 🆕 CI/CD 工作流程
│   ├── test-pr.yml                     # PR 測試工作流程
│   ├── visual-regression.yml           # 視覺回歸測試
│   └── performance-monitoring.yml      # 效能監控
└── scripts/                            # 🆕 測試腳本
    ├── test-setup.sh                   # 測試環境設定
    ├── visual-test-update.sh           # 視覺測試更新
    └── performance-report.sh           # 效能報告生成
```

### Known Testing Challenges
```typescript
// CRITICAL: React Native 測試環境設定複雜
// @testing-library/react-native 需要特殊的 Jest 變換器
// 需要 Mock React Native 特定的 API (Platform, Dimensions 等)

// CRITICAL: Firebase 模擬器整合
// 測試需要 Firebase 模擬器或完整的 Mock 策略
// vi.hoisted() 必須正確處理 Firebase 初始化順序

// CRITICAL: 視覺測試的穩定性
// 截圖測試容易因為字體、渲染差異產生假性失敗
// 需要合理的相似度閾值和重試機制

// CRITICAL: 跨平台測試執行
// Web 測試需要 jsdom 環境
// React Native 測試需要 react-native-testing-library
// 需要條件式測試執行

// CRITICAL: 非同步測試的複雜性
// 檔案上傳、API 呼叫、動畫等非同步操作測試
// 需要適當的 waitFor 和超時處理

// CRITICAL: 效能測試的可重複性
// 效能測試受環境影響很大
// 需要標準化的測試環境和基準線
```

## Implementation Blueprint

### Data models and structure
建立完整的測試配置和工具型別定義。

```typescript
// 測試配置型別
interface TestConfig {
  unit: UnitTestConfig;
  integration: IntegrationTestConfig;
  visual: VisualTestConfig;
  e2e: E2ETestConfig;
  performance: PerformanceTestConfig;
}

// 視覺測試配置
interface VisualTestConfig {
  threshold: number;
  browsers: string[];
  viewports: ViewportConfig[];
  updateSnapshots: boolean;
}

// 效能測試基準
interface PerformanceBenchmark {
  component: string;
  metrics: PerformanceMetrics;
  thresholds: PerformanceThresholds;
}
```

### List of tasks to be completed to fulfill the PRP in the order they should be completed

```yaml
Task 1: 建立測試基礎設施和配置
CREATE vitest.config.ts (擴展現有):
  - EXTEND 現有配置支援多種測試類型
  - ADD 跨平台測試環境設定
  - CONFIGURE coverage 報告和閾值
  - SETUP 測試資料庫和 Mock 系統

CREATE playwright.config.ts:
  - CONFIGURE 跨瀏覽器 E2E 測試
  - SETUP 視覺回歸測試配置
  - ADD 效能監控配置
  - INTEGRATE 與 Storybook 的連接

CREATE .storybook/:
  - SETUP Storybook 6/7 配置
  - ADD React Native Web 支援
  - CONFIGURE 視覺測試執行器
  - SETUP 全域裝飾器和主題

CREATE jest.config.js (React Native 測試):
  - CONFIGURE React Native 測試環境
  - SETUP 正確的變換器和 Mock
  - ADD 跨平台測試支援
  - INTEGRATE 與 Vitest 的並行執行

Task 2: 建立測試工具和輔助函數
CREATE src/tests/utils/test-helpers.ts:
  - IMPLEMENT 跨平台渲染輔助函數
  - PROVIDE 常用的測試工具和斷言
  - ADD Firebase Mock 工廠
  - CREATE 測試資料生成器

CREATE src/tests/utils/mock-factories.ts:
  - IMPLEMENT 系統化的 Mock 工廠
  - CREATE API 回應 Mock 生成器
  - ADD 用戶資料 Mock 工廠
  - PROVIDE 檔案上傳 Mock 工具

CREATE src/tests/fixtures/:
  - ORGANIZE 測試資料到結構化目錄
  - CREATE 各種場景的測試資料集
  - ADD API 回應的標準 Mock
  - SETUP 視覺測試基準截圖

CREATE src/tests/utils/setup-files/:
  - CREATE setupTests.ts 全域測試設定
  - ADD Firebase 模擬器設定
  - SETUP 全域 Mock 和變數
  - CONFIGURE 測試環境初始化

Task 3: 建立跨平台元件測試套件
CREATE src/tests/unit/components/adaptive/:
  - TEST 所有 Adaptive Components (PRP-94)
  - VERIFY 跨平台行為一致性
  - COVER props 驗證和錯誤處理
  - INCLUDE accessibility 測試

CREATE src/tests/integration/cross-platform/:
  - IMPLEMENT 平台對等性測試
  - VERIFY 相同功能在不同平台的行為
  - TEST 樣式系統跨平台一致性
  - VALIDATE 事件處理跨平台相容性

CREATE src/tests/unit/components/forms/:
  - TEST PRP-98 的表單系統元件
  - VERIFY 複雜表單邏輯正確性
  - TEST 驗證和錯誤處理
  - INCLUDE 非同步提交測試

CREATE src/tests/unit/components/database/:
  - TEST PRP-97 的資料庫元件
  - VERIFY 虛擬化和效能最佳化
  - TEST 大量資料處理
  - INCLUDE 即時更新測試

CREATE src/tests/unit/components/file-upload/:
  - TEST PRP-96 的檔案上傳系統
  - VERIFY 檔案處理和驗證邏輯
  - TEST 拖拽功能和進度追蹤
  - INCLUDE 錯誤恢復測試

Task 4: 建立視覺回歸測試系統
CREATE src/tests/visual/components/:
  - GENERATE 所有重構元件的視覺測試
  - COVER 不同狀態和 props 組合
  - INCLUDE 響應式斷點測試
  - ADD 主題切換視覺驗證

CREATE src/tests/visual/themes/:
  - TEST PRP-95 樣式系統的視覺一致性
  - VERIFY 主題切換效果
  - VALIDATE 設計 token 應用
  - COMPARE 重構前後視覺差異

CREATE .storybook/test-runner.ts:
  - CONFIGURE 自動化視覺測試執行
  - SETUP 跨瀏覽器截圖對比
  - ADD 失敗截圖差異報告
  - INTEGRATE CI/CD 管道

CREATE scripts/visual-test-update.sh:
  - AUTOMATE 基準截圖更新流程
  - PROVIDE 批量截圖審查工具
  - ADD 視覺變更報告生成
  - INTEGRATE Git 工作流程

Task 5: 建立效能測試和監控
CREATE src/tests/performance/benchmarks/:
  - IMPLEMENT 元件渲染效能測試
  - BENCHMARK 大型元件重構前後對比
  - TEST 記憶體使用和洩漏檢測
  - MEASURE 互動響應時間

CREATE src/tests/performance/load-testing/:
  - TEST 大量資料處理效能
  - BENCHMARK 虛擬化元件效能
  - VERIFY 檔案上傳效能限制
  - TEST 併發使用者模擬

CREATE scripts/performance-report.sh:
  - GENERATE 詳細效能報告
  - COMPARE 重構前後效能指標
  - PROVIDE 效能回歸警告
  - INTEGRATE 監控儀表板

CREATE src/tests/e2e/performance/:
  - TEST 真實場景下的效能表現
  - MEASURE Core Web Vitals
  - VERIFY 載入時間和互動性
  - MONITOR 長期效能趨勢

Task 6: 建立 E2E 測試管道
CREATE src/tests/e2e/user-journeys/:
  - TEST 完整的使用者註冊和登入流程
  - VERIFY 檔案匯入和處理端到端流程
  - TEST 資料庫操作和編輯流程
  - VALIDATE 權限和安全流程

CREATE src/tests/e2e/cross-browser/:
  - TEST Chrome、Firefox、Safari 相容性
  - VERIFY 移動瀏覽器支援
  - TEST 不同螢幕尺寸適配
  - VALIDATE 觸控和鍵盤互動

CREATE playwright-utils/:
  - CREATE 可重用的 page objects
  - IMPLEMENT 常用的測試動作
  - ADD 等待和重試邏輯
  - PROVIDE 截圖和錄影工具

Task 7: 建立 CI/CD 測試管道
CREATE .github/workflows/test-pr.yml:
  - RUN 所有單元和整合測試
  - EXECUTE 視覺回歸測試
  - PERFORM 跨平台相容性檢查
  - GENERATE 測試覆蓋率報告

CREATE .github/workflows/visual-regression.yml:
  - TRIGGER 視覺測試在 PR 變更時
  - COMPARE 基準截圖差異
  - REQUIRE 人工審查視覺變更
  - UPDATE 基準截圖在 main 分支

CREATE .github/workflows/performance-monitoring.yml:
  - RUN 效能基準測試
  - MONITOR 效能回歸趨勢
  - ALERT 效能閾值超標
  - STORE 歷史效能資料

CREATE .github/workflows/e2e-nightly.yml:
  - SCHEDULE 完整 E2E 測試套件
  - TEST 生產環境功能
  - MONITOR 服務可用性
  - REPORT 測試結果到監控系統

Task 8: 最佳化測試執行和維護
OPTIMIZE test execution performance:
  - IMPLEMENT 測試並行執行
  - ADD 智能測試選擇（只測試變更影響的部分）
  - CACHE 依賴和建構產物
  - REDUCE 測試套件總執行時間

CREATE test maintenance tools:
  - IMPLEMENT 過時測試清理工具
  - ADD 測試覆蓋率追蹤
  - CREATE 測試失敗分析工具
  - PROVIDE 測試維護報告

INTEGRATE monitoring and alerting:
  - SETUP 測試失敗警報
  - MONITOR 測試執行時間趨勢
  - TRACK 測試穩定性指標
  - PROVIDE 測試健康儀表板

DOCUMENTATION and training:
  - CREATE 測試撰寫指南
  - DOCUMENT 測試最佳實踐
  - PROVIDE 疑難排解手冊
  - TRAIN 團隊測試標準
```

### Per task pseudocode as needed added to each task

```typescript
// Task 1: 測試配置擴展偽代碼
// vitest.config.ts 擴展
export default defineConfig({
  test: {
    // CRITICAL: 跨平台環境設定
    environment: 'jsdom',
    setupFiles: ['./src/tests/utils/setup-files/setupTests.ts'],
    
    // 覆蓋率設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    
    // 測試環境變數
    env: {
      NODE_ENV: 'test',
      VITE_FIREBASE_USE_EMULATOR: 'true'
    }
  }
});

// Task 2: 測試輔助函數偽代碼
// test-helpers.ts
export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderOptions = {}
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={testTheme}>
      <DatabaseProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
  
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Mock 工廠偽代碼
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  ...overrides
});

// Task 4: 視覺回歸測試偽代碼
// Storybook 視覺測試
import { test, expect } from '@playwright/experimental-ct-react';

test('AdaptiveButton visual regression', async ({ mount, page }) => {
  const component = await mount(
    <AdaptiveButton variant="primary">Test Button</AdaptiveButton>
  );
  
  // CRITICAL: 等待字體載入避免截圖差異
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(100);
  
  await expect(component).toHaveScreenshot('adaptive-button-primary.png', {
    threshold: 0.02,
    animations: 'disabled'
  });
});

// Task 5: 效能測試偽代碼
// performance benchmark
describe('Component Performance', () => {
  it('should render large dataset efficiently', async () => {
    const startTime = performance.now();
    
    render(<DatabaseTable data={largeMockDataset} />);
    
    // 等待渲染完成
    await waitFor(() => {
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // BENCHMARK: 大型資料集渲染應在 100ms 內完成
    expect(renderTime).toBeLessThan(100);
    
    // 記憶體使用檢查
    const memoryUsage = (performance as any).memory?.usedJSHeapSize;
    expect(memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});

// Task 6: E2E 測試偽代碼
// user-journey.spec.ts
test('complete file upload and processing flow', async ({ page }) => {
  await page.goto('/import');
  
  // 檔案上傳
  const fileInput = page.getByTestId('file-input');
  await fileInput.setInputFiles('./test-fixtures/sample.csv');
  
  // 等待檔案處理
  await expect(page.getByText('處理完成')).toBeVisible({ timeout: 10000 });
  
  // 欄位映射設定
  await page.getByTestId('field-mapper').click();
  await page.getByRole('button', { name: '確認映射' }).click();
  
  // 驗證結果
  await expect(page.getByTestId('import-success')).toBeVisible();
  
  // 截圖記錄
  await page.screenshot({ path: 'e2e-results/import-flow-complete.png' });
});
```

### Integration Points
```yaml
EXISTING_TESTS:
  - extend: src/tests/services/import/AssignmentEngine.test.ts patterns
  - migrate: existing test utilities and mocks
  - maintain: current testing practices where effective

CI_CD:
  - integrate: GitHub Actions workflows
  - extend: existing build and deployment processes
  - add: comprehensive testing gates

MONITORING:
  - connect: performance metrics to monitoring systems
  - integrate: error tracking and alerting
  - provide: testing health dashboards

DEVELOPMENT_WORKFLOW:
  - integrate: pre-commit testing hooks
  - add: local testing optimization
  - provide: developer testing tools
```

## Validation Loop

### Level 1: Test Infrastructure Validation
```bash
# 驗證測試環境設定
npm run test:config-check

# 執行基礎測試確保框架運作
npm run test -- --run --reporter=verbose

# 檢查測試覆蓋率基準
npm run test:coverage

# 預期: 測試框架正常運行，基礎配置正確
```

### Level 2: 跨平台測試驗證
```bash
# 執行跨平台一致性測試
npm run test:cross-platform

# 執行 Adaptive Components 測試套件
npm run test:adaptive-components

# 驗證 React Native 測試環境
npm run test:react-native

# 預期: 跨平台測試通過，元件行為一致
```

### Level 3: 視覺和效能測試
```bash
# 執行視覺回歸測試
npm run test:visual

# 執行效能基準測試
npm run test:performance

# 生成測試報告
npm run test:report

# 預期: 視覺測試穩定，效能符合基準
```

### Level 4: E2E 和 CI 整合測試
```bash
# 執行 E2E 測試套件
npm run test:e2e

# 模擬 CI 環境測試
npm run test:ci-simulation

# 驗證測試管道完整性
npm run test:pipeline-validation

# 預期: E2E 測試通過，CI/CD 管道運作正常
```

## Final validation Checklist
- [ ] 整體測試覆蓋率達到 90%+
- [ ] 所有 Adaptive Components 通過跨平台一致性測試
- [ ] 視覺回歸測試穩定運行，誤報率 <2%
- [ ] 5 個關鍵使用者流程 E2E 測試完整
- [ ] 效能基準測試建立，回歸檢測正常
- [ ] CI/CD 測試管道運作，自動阻止有問題的部署
- [ ] 測試執行時間最佳化，全套測試 <10 分鐘
- [ ] 測試文檔完整，團隊能夠遵循測試標準
- [ ] 監控和警報系統整合，測試健康狀況可視化

---

## Anti-Patterns to Avoid
- ❌ 不要為了提高覆蓋率而寫無意義的測試
- ❌ 不要忽略測試的維護成本，過度複雜的測試難以維護
- ❌ 不要讓視覺測試過於敏感，避免頻繁的假性失敗
- ❌ 不要跳過效能測試基準建立，回歸問題難以察覺
- ❌ 不要讓 E2E 測試過於脆弱，環境依賴要最小化
- ❌ 不要忽略測試執行時間，緩慢的測試會阻礙開發效率

**Confidence Score: 9/10** - 基於完整的測試策略和現有程式碼分析。測試框架設計全面，涵蓋了重構過程中的所有風險點。採用業界標準工具和實踐，風險可控。測試自動化程度高，能有效支撑大規模架構重構。