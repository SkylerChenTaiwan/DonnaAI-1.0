# PRP-92: 修復資料分配功能整合問題

## 執行狀態
- 開始日期: 2024-08-11
- 預估時間: 2 小時
- 實際耗時: -
- 狀態: 待執行
- 信心分數: 9/10

## 背景說明

PRP-90 已完成資料分配功能的基礎實作，包含服務層和 UI 元件。但經過測試發現存在以下整合問題需要修復：

1. **Firebase 配置路徑錯誤** - 服務檔案引用了錯誤的 Firebase 配置路徑
2. **測試無法執行** - 測試需要修正 mock 設定才能正常運行
3. **整合驗證** - 需要確認整個分配流程端到端運作正常

## 需要修復的問題清單

### 1. Firebase 配置路徑問題
**現況分析**：
- 錯誤路徑：`@/config/firebase` (不存在)
- 正確路徑：`@/services/firebase/config`

**受影響檔案**：
- `/src/services/import/AssignmentEngine.ts`
- `/src/services/import/UserMatcher.ts`
- `/src/components/import/assignment/UserSelector.tsx`
- 其他可能的相關檔案

### 2. 測試 Mock 設定問題
**問題描述**：
- 測試檔案無法正確載入服務
- Mock 設定與實際路徑不符
- Firebase 函數 mock 需要調整

### 3. 整合驗證需求
**需驗證項目**：
- ImportWizard 第四階段流程
- 資料分配預覽功能
- 分配執行與歷史記錄
- 權限檢查

## 技術架構確認

### 現有正確的檔案結構
```
src/
├── services/
│   ├── firebase/
│   │   ├── config.ts                    ✅ 存在
│   │   ├── assignmentHistory.ts         ✅ 存在
│   │   └── admin/
│   │       └── dataImportService.ts     ✅ 存在 (含分配功能)
│   └── import/
│       ├── AssignmentEngine.ts          ✅ 存在 (路徑錯誤)
│       └── UserMatcher.ts               ✅ 存在 (路徑錯誤)
├── components/
│   └── import/
│       ├── ImportWizard.tsx             ✅ 存在 (含 Stage 4)
│       ├── stages/
│       │   └── DataAssignmentStep.tsx   ✅ 存在
│       └── assignment/
│           ├── UserSelector.tsx         ✅ 存在 (路徑錯誤)
│           ├── AssignmentPreview.tsx    ✅ 存在
│           └── AssignmentStrategySelector.tsx ✅ 存在
└── types/
    └── assignment.ts                     ✅ 存在
```

## 實作計劃

### Task 1: 修正 Firebase 配置路徑 (15分鐘)
1. 修正 AssignmentEngine.ts 的 import
2. 修正 UserMatcher.ts 的 import  
3. 修正 UserSelector.tsx 的 import
4. 搜尋並修正其他相關檔案

### Task 2: 調整測試 Mock 設定 (30分鐘)
1. 修正測試檔案的 mock 路徑
2. 建立正確的 Firebase mock helper
3. 確保所有測試可以載入

### Task 3: 執行測試驗證 (20分鐘)
1. 執行服務層測試
2. 執行 UI 元件測試
3. 修正發現的問題

### Task 4: 整合測試 (30分鐘)
1. 測試 ImportWizard 完整流程
2. 驗證資料分配預覽
3. 驗證分配執行
4. 確認歷史記錄儲存

### Task 5: 權限與錯誤處理 (15分鐘)
1. 確認權限檢查正確
2. 測試錯誤情況處理
3. 確認 UI 回饋訊息

### Task 6: 文件更新 (10分鐘)
1. 更新使用說明
2. 記錄已知限制
3. 提供範例配置

## 驗證檢查點

### 1. 路徑修正驗證
```bash
# 確認沒有錯誤的 import
grep -r "@/config/firebase" src/ --include="*.ts" --include="*.tsx"
# 應該返回空結果
```

### 2. 測試執行驗證
```bash
# 執行服務測試
npm run test -- src/tests/services/import/ --run

# 執行元件測試  
npm run test -- src/tests/components/import/ --run

# 執行整合測試
npm run test -- src/tests/services/firebase/assignmentHistory.test.ts --run
```

### 3. 功能驗證檢查表
- [ ] ImportWizard 可以進入第四階段
- [ ] 可以選擇分配策略
- [ ] 可以預覽分配結果
- [ ] 可以執行分配
- [ ] 可以跳過分配
- [ ] 分配歷史正確記錄
- [ ] 權限檢查正常運作

### 4. UI 互動驗證
```typescript
// 在瀏覽器 console 測試
// 1. 進入匯入精靈
// 2. 完成前三個步驟
// 3. 進入資料分配階段
// 4. 測試各種分配策略
```

## 參考資源

### Firebase 配置正確用法
```typescript
// ❌ 錯誤
import { getFirebaseDb } from '@/config/firebase';

// ✅ 正確
import { getFirebaseDb } from '@/services/firebase/config';
```

### Mock 設定範例
```typescript
// 測試檔案中的正確 mock
vi.mock('@/services/firebase/config', () => ({
  getFirebaseDb: vi.fn(() => mockDb),
  getFirebaseAuth: vi.fn(() => mockAuth)
}));
```

### 相關檔案連結
- Firebase 配置：`src/services/firebase/config.ts`
- 匯入服務：`src/services/firebase/admin/dataImportService.ts` (第 725, 945 行)
- ImportWizard：`src/components/import/ImportWizard.tsx` (第 164, 591 行)
- 類型定義：`src/types/assignment.ts`

## 錯誤處理策略

### 常見錯誤情況
1. **無可用用戶** - 顯示提示訊息，允許跳過
2. **分配失敗** - 記錄錯誤，提供重試選項
3. **權限不足** - 顯示權限錯誤，引導至設定
4. **網路錯誤** - 顯示重試按鈕

### 錯誤訊息範例
```typescript
const ERROR_MESSAGES = {
  NO_USERS: '沒有可用的用戶進行分配',
  ASSIGNMENT_FAILED: '分配執行失敗，請重試',
  PERMISSION_DENIED: '您沒有權限執行此操作',
  NETWORK_ERROR: '網路連線失敗，請檢查連線'
};
```

## 執行指令

```bash
# 1. 修正路徑
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/config/firebase|@/services/firebase/config|g' {} +

# 2. 執行測試
npm run test -- --run

# 3. 檢查 TypeScript
npm run type-check

# 4. 執行開發模式測試
npm run web
```

## 預期成果

1. **所有測試通過** - 服務和元件測試全部綠燈
2. **功能正常運作** - 匯入精靈第四階段完整可用
3. **錯誤處理完善** - 各種異常情況都有適當處理
4. **文件完整** - 使用說明和範例清楚

## 成功指標

- ✅ 0 個 import 路徑錯誤
- ✅ 測試覆蓋率 > 80%
- ✅ 端到端流程測試通過
- ✅ 無 TypeScript 錯誤
- ✅ UI 互動順暢無錯誤

## 注意事項

1. **保持向後相容** - 不要破壞現有功能
2. **測試優先** - 修改後立即執行測試
3. **增量提交** - 每個 task 完成後提交
4. **記錄變更** - 在 TASK.md 中記錄進度

## 後續優化建議

1. **效能優化** - 大量資料分配時的效能
2. **批次處理** - 支援批次分配操作
3. **分配模板** - 儲存常用分配配置
4. **智慧建議** - 基於歷史資料的分配建議
5. **分配報表** - 更詳細的分配統計報表

---

*信心分數: 9/10 - 問題明確，解決方案清晰，預期可以一次性完成所有修復*