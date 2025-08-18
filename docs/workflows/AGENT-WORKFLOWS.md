# Agent 自動觸發工作流程

## 📝 開發完成後自動觸發

### UI 元件修改後
**觸發條件**: 修改任何 UI 元件、頁面佈局、樣式
**自動執行**:
1. `ui-visual-tester` - 視覺截圖驗證
2. `code-refactor-optimizer` - 程式碼品質檢查

### 新功能開發完成後
**觸發條件**: 實作新功能、新頁面、新元件
**自動執行**:
1. `interaction-tester` - 互動邏輯測試
2. `typescript-type-guardian` - 型別安全檢查

### 程式碼重構後
**觸發條件**: 重構現有程式碼、優化效能
**自動執行**:
1. `code-refactor-optimizer` - 程式碼品質和最佳實踐審查

## 🚨 問題發生時自動觸發

### TypeScript 編譯錯誤
**觸發條件**: 編譯失敗、型別錯誤
**自動執行**:
1. `typescript-type-guardian` - 型別錯誤分析和修復

### 測試失敗
**觸發條件**: 單元測試、整合測試失敗
**自動執行**:
1. `test-results-analyzer` - 測試結果分析
2. `interaction-tester` - 重新驗證互動邏輯

### UI 顯示異常
**觸發條件**: UI 佈局錯誤、樣式問題
**自動執行**:
1. `ui-visual-tester` - 視覺問題分析
2. `ux-journey-analyzer` - 用戶流程影響評估

## 🎯 特定任務自動觸發

### 新功能開發
**觸發條件**: 開始新功能開發
**執行流程**:
1. `ux-flow-designer` - 用戶流程設計和規劃
2. 開發階段 - 實作功能
3. `interaction-tester` - 功能驗證和測試

### Bug 修復
**觸發條件**: 發現並開始修復 Bug
**執行流程**:
1. `bug-hunter` - Bug 來源分析和定位
2. 修復階段 - 實作修復
3. `test-results-analyzer` - 驗證修復效果

## 🔧 Agent 控制選項

### 跳過自動觸發
說明「不用檢查」或「跳過 Agent」即可跳過自動觸發

### 指定特定 Agent
說明「用 [agent-name] 檢查」來覆蓋預設的 Agent 選擇

### 手動觸發 Agent
可隨時說明「請用 [agent-name] 分析」來手動觸發特定 Agent

## 📊 Agent 協作模式

### 順序執行
某些 Agent 會按順序執行，如：
1. 問題分析 Agent → 2. 修復 Agent → 3. 驗證 Agent

### 並行執行
某些檢查可以同時進行，如：
- `ui-visual-tester` + `code-refactor-optimizer`

### 條件觸發
根據前一個 Agent 的結果決定是否觸發下一個 Agent

## 🎯 PRP 執行時的 Agent 協作

### Phase 完成檢查點
每完成一個 Phase，自動執行對應的 agents：

1. **Phase 1 完成後（類型定義與分析器）**：
   - `typescript-type-guardian`: 檢查型別安全性
   - `code-refactor-optimizer`: 程式碼品質分析

2. **Phase 2 每個服務完成後（後端服務）**：
   - `typescript-type-guardian`: 服務介面驗證
   - `code-refactor-optimizer`: 效能和程式碼優化
   - `interaction-tester`: 產生單元測試

3. **Phase 3 每個元件完成後（前端元件）**：
   - `ui-visual-tester`: 視覺驗證和截圖
   - `interaction-tester`: 互動邏輯測試
   - `ux-journey-analyzer`: UX 流程分析
   - `code-refactor-optimizer`: 元件優化

4. **Phase 4 完成後（整合）**：
   - `typescript-type-guardian`: 前後端介面一致性
   - `ux-journey-analyzer`: 端對端流程驗證
   - `interaction-tester`: 整合測試

5. **Phase 5 完成後（最終驗證）**：
   - 全面執行所有相關 agents 進行最終檢查

### 強制執行規則
- ❌ 不執行 agents 不能進入下一個 Phase
- ❌ Critical 問題不修復不能繼續
- ✅ 所有 agent 輸出必須保存到 `/docs/agent-reports/[date]-prp-[number]/`
- ✅ TodoWrite 必須包含 agent 檢查任務