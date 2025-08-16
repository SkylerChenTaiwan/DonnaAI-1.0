# Execute PRP with Agents - 執行 PRP 時的 Agent 協作流程

## Command: `/execute-prp [prp-file-path]`

## Purpose
確保在執行 PRP 時正確使用 agents 進行程式碼品質檢查、型別驗證和測試生成。

## 核心原則
1. **每個 Phase 完成後必須執行對應的 agents**
2. **每個元件/服務完成後立即檢查**
3. **Agent 建議必須實施後才能繼續**
4. **所有 agent 輸出必須記錄在專案中**

## 執行流程

### 🚀 Phase 0: 初始化
```yaml
開始執行 PRP 時:
  1. 建立 agent 追蹤清單到 TodoWrite
  2. 建立 /docs/agent-reports/[date]/ 目錄
  3. 確認所有必要的 agents 可用
```

### 📝 Phase 1: 類型定義與分析器 (Backend Foundation)
```yaml
完成項目:
  - TypeScript 類型定義
  - 分析器服務
  - 核心工具函數

必須執行的 Agents:
  - typescript-type-guardian:
      prompt: |
        檢查以下檔案的型別安全性：
        - src/types/dynamic-field-mapping.ts
        - src/services/dynamic-fields/*.ts
        重點檢查：
        1. Type guards 是否完整
        2. 是否有 any 類型濫用
        3. 介面定義是否一致
        4. 必要的型別匯出
      output: /docs/agent-reports/phase1-type-check.md
      
  - code-refactor-optimizer:
      prompt: |
        分析 DynamicFieldAnalyzer 服務的程式碼品質：
        1. 是否有重複程式碼可以抽取
        2. 效能瓶頸（特別是大資料處理）
        3. 錯誤處理是否完善
        4. 是否遵循 SOLID 原則
      output: /docs/agent-reports/phase1-refactor.md

驗證標準:
  - [ ] 無 TypeScript 編譯錯誤
  - [ ] 無 any 類型警告
  - [ ] 程式碼複雜度 < 10
  - [ ] 測試覆蓋率 > 80%
```

### 🔧 Phase 2: 後端服務實作
```yaml
每個服務完成後執行:
  服務清單:
    - CSVAnalysisService
    - DynamicFieldService
    - ShardingService
    - HybridQueryEngine

  對每個服務執行:
    typescript-type-guardian:
      prompt: |
        檢查 [服務名稱] 的型別安全：
        - 參數和返回值型別
        - 錯誤處理的型別
        - 與其他服務的介面一致性
      
    code-refactor-optimizer:
      prompt: |
        優化 [服務名稱]：
        - 記憶體使用（特別是 streaming 和 sharding）
        - 非同步操作優化
        - 錯誤恢復機制
        - 程式碼可讀性
    
    interaction-tester:
      prompt: |
        為 [服務名稱] 產生單元測試：
        - 正常情況測試
        - 邊界條件（100+ 欄位、1MB 限制）
        - 錯誤處理測試
        - 效能測試

  整合測試（所有服務完成後）:
    interaction-tester:
      prompt: |
        產生整合測試：
        - 服務間互動測試
        - 端對端資料流測試
        - 併發和競態條件測試
```

### 🎨 Phase 3: 前端元件開發
```yaml
每個元件完成後執行:
  元件清單:
    - FileUploader (拖放上傳)
    - DynamicFieldList (虛擬滾動)
    - FieldConfigurator (欄位設定)
    - DataPreviewTable (預覽表格)
    - ImportProgressPanel (進度面板)

  對每個元件執行:
    ui-visual-tester:
      prompt: |
        驗證 [元件名稱] 的視覺呈現：
        - 截圖所有狀態（空狀態、載入中、錯誤、成功）
        - 檢查響應式設計（Mobile/Tablet/Desktop）
        - 驗證與設計稿的一致性
        - 檢查無障礙標準（WCAG 2.1）
      
    interaction-tester:
      prompt: |
        測試 [元件名稱] 的互動邏輯：
        - 所有按鈕和輸入的事件處理
        - 拖放功能（如適用）
        - 鍵盤導航
        - 觸控手勢（Mobile）
        - 錯誤狀態處理
    
    ux-journey-analyzer:
      prompt: |
        分析 [元件名稱] 的用戶體驗：
        - 操作流程是否直覺
        - 回饋是否即時清晰
        - 錯誤訊息是否有幫助
        - 是否有不必要的步驟
    
    code-refactor-optimizer:
      prompt: |
        優化 [元件名稱] 的實作：
        - 檢查是否使用正確的 Adaptive 元件
        - 虛擬滾動效能（如適用）
        - 狀態管理優化
        - 重新渲染次數
        - Bundle size 影響

  Platform 測試（所有元件完成後）:
    ui-visual-tester:
      prompt: |
        跨平台視覺驗證：
        - Web (Chrome/Safari/Firefox)
        - iOS (iPhone/iPad)
        - Android (Phone/Tablet)
        記錄所有平台差異
```

### 🔗 Phase 4: 整合與連接
```yaml
整合任務完成後:
  typescript-type-guardian:
    prompt: |
      驗證前後端介面一致性：
      - API 請求/回應型別
      - 錯誤格式一致性
      - 資料轉換正確性
  
  ux-journey-analyzer:
    prompt: |
      驗證完整用戶流程：
      1. 上傳 CSV
      2. 分析欄位
      3. 配置映射
      4. 預覽資料
      5. 執行匯入
      6. 查看結果
      檢查每個步驟的轉換是否順暢
  
  interaction-tester:
    prompt: |
      端對端測試：
      - 完整匯入流程
      - 錯誤恢復測試
      - 大檔案測試（100+ 欄位）
      - 併發匯入測試
```

### ✅ Phase 5: 最終驗證
```yaml
全部完成後:
  code-refactor-optimizer:
    prompt: |
      整體程式碼審查：
      - 找出重複程式碼
      - 效能優化機會
      - 安全性檢查
      - 最佳實踐遵循度
  
  typescript-type-guardian:
    prompt: |
      全專案型別檢查：
      - 執行 strict mode 檢查
      - 檢查未使用的型別
      - 驗證型別覆蓋率
  
  ui-visual-tester:
    prompt: |
      視覺回歸測試：
      - 對比實作與設計稿
      - 檢查所有狀態組合
      - 驗證動畫流暢度
```

## Agent 輸出整合

### 輸出目錄結構
```
/docs/agent-reports/
├── [date]-prp-[number]/
│   ├── phase1/
│   │   ├── type-check.md
│   │   └── refactor-suggestions.md
│   ├── phase2/
│   │   ├── [service]-analysis.md
│   │   └── [service]-tests.ts
│   ├── phase3/
│   │   ├── [component]-visual.md
│   │   ├── [component]-interaction.md
│   │   └── screenshots/
│   ├── phase4/
│   │   └── integration-report.md
│   └── summary.md
```

### Agent 建議實施流程
```yaml
收到 Agent 建議後:
  1. 評估優先級:
     - 🔴 Critical: 必須立即修復（型別錯誤、安全問題）
     - 🟡 Important: 應該修復（效能、UX 問題）
     - 🟢 Nice-to-have: 可以延後（程式碼風格、小優化）
  
  2. 更新 TodoWrite:
     - 將 Critical 建議加入當前 Phase
     - Important 建議加入下個 Phase
     - Nice-to-have 記錄在 backlog
  
  3. 實施修改:
     - 一次處理一個建議
     - 修改後重新執行相關 agent 驗證
     - 記錄修改內容和結果
  
  4. 驗證通過標準:
     - 所有 Critical 問題已解決
     - 80% 以上 Important 問題已解決
     - 測試通過率 > 95%
```

## 常見問題處理

### Agent 執行失敗
```yaml
如果 agent 執行失敗:
  1. 檢查 prompt 是否明確
  2. 確認檔案路徑正確
  3. 縮小檢查範圍後重試
  4. 使用 general-purpose agent 替代
```

### Agent 建議衝突
```yaml
如果不同 agent 建議衝突:
  1. 優先考慮 typescript-type-guardian（型別安全）
  2. 其次是 interaction-tester（功能正確）
  3. 然後是 ux-journey-analyzer（用戶體驗）
  4. 最後是 code-refactor-optimizer（程式碼品質）
```

### 時間壓力下的取捨
```yaml
時間有限時的最小集合:
  Phase 1: typescript-type-guardian（必須）
  Phase 2: 每個服務的 typescript-type-guardian
  Phase 3: 關鍵元件的 interaction-tester
  Phase 4: 端對端 interaction-tester
  Phase 5: 可延後
```

## 成功指標

### 量化指標
- Agent 執行覆蓋率: > 90%
- Critical 問題修復率: 100%
- 型別安全覆蓋率: > 95%
- 測試覆蓋率: > 80%
- 效能改善: > 20%

### 質化指標
- 程式碼可維護性提升
- 減少 bug 數量
- 開發速度提升（長期）
- 團隊滿意度提升

## 範例：Phase 1 Agent 執行

```bash
# 1. 完成 Phase 1 開發
✅ Created TypeScript definitions
✅ Created DynamicFieldAnalyzer

# 2. 執行 typescript-type-guardian
Task: typescript-type-guardian
Prompt: "檢查 src/types/dynamic-field-mapping.ts 和 src/services/dynamic-fields/ 的型別安全性"
Output: 發現 3 個 any 類型，2 個未匯出的介面

# 3. 執行 code-refactor-optimizer  
Task: code-refactor-optimizer
Prompt: "分析 DynamicFieldAnalyzer 的程式碼品質和效能"
Output: 建議抽取重複的驗證邏輯，優化大資料集處理

# 4. 實施建議
✅ 移除 any 類型
✅ 匯出必要介面
✅ 抽取驗證函數
✅ 加入串流處理

# 5. 重新驗證
Task: typescript-type-guardian
Result: ✅ 所有檢查通過

# 6. 提交變更
git commit -m "refactor: 根據 agent 建議優化 Phase 1"
```

---

**注意事項**：
1. 這個流程是**強制性的**，不是可選的
2. 每個 agent 的輸出都要保存和追蹤
3. 不實施 Critical 建議不能繼續下一階段
4. 定期回顧 agent 建議的準確性，優化 prompt

這個流程確保了程式碼品質、型別安全、良好的用戶體驗，並且透過 agents 的協作大幅提升開發效率和品質。