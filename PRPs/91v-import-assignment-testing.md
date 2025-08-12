# PRP-91: 資料匯入分配系統完整測試計劃

## Executive Summary
為 PRP-90 實作的資料匯入分配系統建立完整的測試覆蓋，包含單元測試、整合測試、UI測試、效能測試和安全性測試，確保系統的可靠性、效能和安全性。

## Background & Context

### 已實作功能 (PRP-90)
- **核心服務**: AssignmentEngine、UserMatcher、assignmentHistory
- **UI 元件**: DataAssignmentStep、UserSelector、AssignmentPreview、AssignmentStrategySelector
- **整合點**: ImportWizard (第4階段)、SmartDataImporter、權限系統、Firestore規則
- **分配策略**: single_user、round_robin、csv_column、department_rule、manual_mapping

### 測試環境設定
- **框架**: Vitest + React Testing Library
- **配置檔**: `vitest.config.ts` (已存在)
- **Mock設定**: `src/tests/setup.ts` (Firebase mocks已配置)
- **執行指令**: `npm run test`, `npm run test:coverage`

## Detailed Requirements

### 1. 單元測試覆蓋 (Unit Tests)

#### 1.1 服務層測試
```typescript
// 需要測試的服務
- AssignmentEngine (/src/services/import/AssignmentEngine.ts)
  - initialize() - 初始化與用戶載入
  - generatePreview() - 預覽生成邏輯
  - executeAssignment() - 各策略執行
  - 邊界情況處理
  
- UserMatcher (/src/services/import/UserMatcher.ts)
  - findBestMatch() - 最佳匹配算法
  - levenshteinDistance() - 距離計算
  - normalizeString() - 字串正規化
  - 多語言支援 (中文名稱匹配)
  
- assignmentHistory (/src/services/firebase/assignmentHistory.ts)
  - createAssignmentHistory() - 建立記錄
  - createBatchAssignmentHistory() - 批量建立
  - getAssignmentHistory() - 權限檢查
  - generateAssignmentReport() - 報告生成
```

#### 1.2 元件測試
```typescript
// UI元件測試
- AssignmentStrategySelector
  - 策略選擇交互
  - 推薦邏輯顯示
  - 資料數量提示
  
- UserSelector
  - 用戶搜尋功能
  - 部門篩選
  - 多選/單選模式
  - 無限滾動載入
  
- AssignmentPreview
  - 圖表/列表切換
  - 工作負載視覺化
  - 展開/收合互動
```

### 2. 整合測試 (Integration Tests)

#### 2.1 ImportWizard 流程測試
```typescript
describe('ImportWizard with Assignment', () => {
  it('應該正確顯示第4階段', async () => {
    // 測試階段導航
    // 測試資料傳遞
    // 測試狀態管理
  });
  
  it('應該在跳過分配時正確處理', async () => {
    // 測試跳過邏輯
    // 確認 assignmentConfig 為 null
  });
});
```

#### 2.2 資料流測試
```typescript
describe('Data Assignment Flow', () => {
  it('應該從CSV到分配完成的完整流程', async () => {
    // 1. 上傳CSV
    // 2. 欄位映射
    // 3. 選擇分配策略
    // 4. 預覽分配
    // 5. 執行匯入
    // 6. 驗證 assignedTo 欄位
  });
});
```

### 3. 效能測試 (Performance Tests)

#### 3.1 大量資料測試
```typescript
describe('Performance Tests', () => {
  it('應該在10秒內處理10000筆資料分配', async () => {
    const largeDataset = generateTestData(10000);
    const startTime = performance.now();
    
    const result = await assignmentEngine.executeAssignment(
      largeDataset,
      { strategy: 'round_robin', assigneeIds: [...] }
    );
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(10000);
  });
  
  it('UserMatcher應該高效處理1000個用戶', async () => {
    // 測試搜尋效能
    // 測試匹配算法效能
  });
});
```

### 4. 安全性測試 (Security Tests)

#### 4.1 權限測試
```typescript
describe('Permission Tests', () => {
  it('非管理員不能執行分配', async () => {
    // Mock 一般用戶
    // 測試權限拒絕
  });
  
  it('不能分配給其他組織的用戶', async () => {
    // 測試跨組織限制
  });
  
  it('分配歷史只能被授權用戶查看', async () => {
    // 測試歷史記錄權限
  });
});
```

### 5. 邊界情況測試 (Edge Cases)

```typescript
describe('Edge Cases', () => {
  const testCases = [
    { name: '空資料集', data: [] },
    { name: '無有效用戶', users: [] },
    { name: 'CSV欄位不存在', csvColumn: 'non_existent' },
    { name: '所有用戶都無權限', users: unauthorizedUsers },
    { name: '混合語言名稱', data: mixedLanguageData },
    { name: '特殊字元處理', data: specialCharData },
    { name: '重複用戶名稱', users: duplicateUsers }
  ];
  
  testCases.forEach(testCase => {
    it(`應該正確處理: ${testCase.name}`, async () => {
      // 測試邊界情況
    });
  });
});
```

## Technical Implementation

### 測試檔案結構
```
src/
├── tests/
│   ├── services/
│   │   ├── import/
│   │   │   ├── AssignmentEngine.test.ts
│   │   │   └── UserMatcher.test.ts
│   │   └── firebase/
│   │       └── assignmentHistory.test.ts
│   ├── components/
│   │   └── import/
│   │       ├── assignment/
│   │       │   ├── UserSelector.test.tsx
│   │       │   ├── AssignmentPreview.test.tsx
│   │       │   └── AssignmentStrategySelector.test.tsx
│   │       └── stages/
│   │           └── DataAssignmentStep.test.tsx
│   └── integration/
│       ├── ImportWizardFlow.test.tsx
│       └── AssignmentEndToEnd.test.ts
```

### Mock 工具函數
```typescript
// src/tests/utils/assignmentMocks.ts
export const mockUsers = [
  { id: 'user1', name: '張三', email: 'zhang@test.com', role: 'salesperson' },
  { id: 'user2', name: '李四', email: 'li@test.com', role: 'salesperson' },
  { id: 'user3', name: 'John Doe', email: 'john@test.com', role: 'manager' }
];

export const mockCSVData = [
  { name: '客戶A', company: '公司A', assignee: '張三' },
  { name: '客戶B', company: '公司B', assignee: 'zhang@test.com' },
  { name: '客戶C', company: '公司C', assignee: 'John' }
];

export const createMockAssignmentEngine = () => ({
  initialize: vi.fn(),
  generatePreview: vi.fn(),
  executeAssignment: vi.fn()
});
```

### 測試資料生成器
```typescript
// src/tests/utils/testDataGenerator.ts
export function generateTestData(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    name: `客戶${i}`,
    company: `公司${i}`,
    email: `customer${i}@test.com`,
    phone: `0900${String(i).padStart(6, '0')}`
  }));
}

export function generateTestUsers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `user${i}`,
    name: `用戶${i}`,
    email: `user${i}@test.com`,
    role: i % 3 === 0 ? 'manager' : 'salesperson',
    organizationId: 'test-org'
  }));
}
```

## Implementation Tasks

### 階段一：單元測試 (2天)
1. **Task 1**: 建立測試檔案結構和 mock 工具
2. **Task 2**: 實作 AssignmentEngine 單元測試
3. **Task 3**: 實作 UserMatcher 單元測試
4. **Task 4**: 實作 assignmentHistory 單元測試
5. **Task 5**: 實作 UI 元件單元測試

### 階段二：整合測試 (1天)
6. **Task 6**: 實作 ImportWizard 整合測試
7. **Task 7**: 實作端到端資料流測試
8. **Task 8**: 實作權限整合測試

### 階段三：特殊測試 (1天)
9. **Task 9**: 實作效能測試套件
10. **Task 10**: 實作安全性測試
11. **Task 11**: 實作邊界情況測試

### 階段四：測試優化 (1天)
12. **Task 12**: 達成 80% 測試覆蓋率
13. **Task 13**: 優化測試執行時間
14. **Task 14**: 建立 CI/CD 測試流程

## Validation Gates

### 本地測試驗證
```bash
# 執行所有測試
npm run test

# 執行特定測試檔案
npm run test src/tests/services/import/AssignmentEngine.test.ts

# 執行覆蓋率報告
npm run test:coverage

# 執行效能測試
npm run test -- --testNamePattern="Performance Tests"

# 類型檢查
npm run type-check

# Linting
npm run lint
```

### 測試通過標準
- ✅ 所有單元測試通過
- ✅ 整合測試無錯誤
- ✅ 測試覆蓋率 > 80%
- ✅ 效能測試符合標準 (< 10秒處理10000筆)
- ✅ 無 TypeScript 錯誤
- ✅ 無 ESLint 錯誤

### 預期測試結果
```
Test Suites: 14 passed, 14 total
Tests:       156 passed, 156 total
Coverage:    85% statements, 82% branches, 88% functions, 84% lines
Time:        12.5s
```

## External Resources

### 測試框架文件
- [Vitest 官方文件](https://vitest.dev/guide/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing React Native Apps](https://reactnative.dev/docs/testing-overview)

### Mock 策略參考
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking)
- [Firebase Testing Guide](https://firebase.google.com/docs/rules/unit-tests)
- [Mock Service Worker](https://mswjs.io/)

### 效能測試工具
- [React DevTools Profiler](https://react.dev/reference/react/Profiler)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## Success Metrics

### 量化指標
- **程式碼覆蓋率**: > 80%
- **測試執行時間**: < 30秒 (全部測試)
- **效能基準**: 10000筆資料 < 10秒
- **Bug 發現率**: 預期發現 10-15 個潛在問題

### 質化指標
- 開發者信心度提升
- 部署風險降低
- 維護成本下降
- 使用者體驗改善

## Risk Mitigation

### 潛在風險
1. **Mock 複雜度**: Firebase 服務 mock 可能過於複雜
   - **緩解**: 使用 MSW 進行網路層級 mock
   
2. **測試維護成本**: 測試程式碼可能難以維護
   - **緩解**: 建立可重用的測試工具函數
   
3. **效能測試不穩定**: 效能測試可能因環境而異
   - **緩解**: 設定合理的容差範圍

4. **非同步測試問題**: React Native 非同步操作測試困難
   - **緩解**: 使用 waitFor 和 act 正確處理

## Implementation Notes

### 測試最佳實踐
1. **AAA 模式**: Arrange-Act-Assert
2. **獨立性**: 每個測試應該獨立執行
3. **可讀性**: 測試即文件
4. **速度**: 優先單元測試，少量整合測試
5. **覆蓋率**: 關注關鍵路徑，而非 100%

### 特殊考量
- React Native 元件需要特殊的 mock 設定
- Firebase 時間戳需要 mock 處理
- 中文字元匹配需要特殊測試案例
- 權限測試需要多角色 mock

## PRP Confidence Score: 9/10

### 評分理由
- ✅ 完整的測試覆蓋計劃
- ✅ 詳細的實作指南
- ✅ 現有測試框架整合
- ✅ 清晰的驗證標準
- ✅ 實用的測試工具函數
- ⚠️ 扣分項: Firebase mock 複雜度可能需要調整

這個 PRP 提供了完整的測試實作路線圖，涵蓋所有關鍵功能點，並包含實際可執行的測試程式碼範例。透過這個測試計劃，可以確保資料匯入分配系統的可靠性和穩定性。