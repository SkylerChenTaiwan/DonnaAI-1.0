# 錯誤解決流程 v2.0 (整合 Contains Studio Agents)

## 觸發方式
- **關鍵字**: `/錯誤`
- **自動執行**: 此工作流程
- **使用 Agents**: test-results-analyzer, bug-hunter, test-writer-fixer, code-reviewer, workflow-optimizer

## 🔍 Phase 1: 錯誤分析階段

### 步驟 1: 啟動 test-results-analyzer Agent
```
自動分析當前對話中的錯誤情況：
- 識別錯誤類型和嚴重程度
- 分析錯誤影響範圍
- 生成初步分析報告
```

### 步驟 2: 啟動 bug-hunter Agent
```
深度錯誤定位和根本原因分析：
- 尋找錯誤源頭
- 分析相關程式碼
- 識別潛在的相關問題
```

## 🛠 Phase 2: 解決方案階段

### 步驟 3: 制定解決計劃
```
基於 Agents 分析結果：
1. 列出可能的解決方案選項
2. 評估每個選項的風險和影響
3. 選擇最佳解決方案
4. 建立實施時間線
```

### 步驟 4: 啟動 test-writer-fixer Agent
```
建立測試和驗證機制：
- 撰寫錯誤重現測試
- 建立修復驗證測試
- 設計回歸測試
```

## ✅ Phase 3: 實施和驗證階段

### 步驟 5: 實施修復
```
根據解決計劃執行：
1. 實作程式碼修復
2. 執行測試驗證
3. 檢查是否產生新問題
```

### 步驟 6: 啟動 code-reviewer Agent
```
程式碼品質檢查：
- 檢查修復程式碼品質
- 確保符合專案標準
- 驗證修復完整性
```

### 步驟 7: 啟動 workflow-optimizer Agent
```
流程最佳化：
- 分析此次錯誤解決流程
- 識別可改進之處
- 更新錯誤預防機制
```

## 📋 Phase 4: 文件和總結階段

### 步驟 8: 生成錯誤報告
```
建立結構化錯誤報告：
- 錯誤描述和分析
- 解決方案和實施過程
- 測試結果和驗證
- 預防措施建議
- 儲存至: /docs/error-reports/[date]-[error-description].md
```

### 步驟 9: 更新 TASK.md
```
記錄任務完成狀態：
- 標記相關任務為完成
- 新增任何後續任務
- 更新專案狀態
```

## 🔧 Agent 協作模式

### 自動觸發順序
1. `test-results-analyzer` → 分析錯誤
2. `bug-hunter` → 定位根本原因
3. `test-writer-fixer` → 建立測試機制
4. `code-reviewer` → 檢查修復品質
5. `workflow-optimizer` → 最佳化流程

### Agent 輸出要求
- 所有 Agent 報告儲存至 `/docs/agent-reports/[date]-error-resolution/`
- 使用結構化格式便於追蹤
- 包含可執行的建議和下一步行動

## ⚠️ 緊急錯誤處理

### Critical 錯誤 (立即處理)
- 系統無法啟動
- 資料丟失風險
- 安全性漏洞
- 生產環境故障

### 快速修復流程
1. 立即隔離問題
2. 實施臨時解決方案
3. 通知相關人員
4. 執行完整分析流程

---

**注意**: 此流程會自動在使用 `/錯誤` 關鍵字時觸發，無需手動執行。