# PRP 執行流程

## 📝 PRP 檔案命名規則

### 新建 PRP 檔案
- 必須以編號開始：`01-feature-name.md`、`02-another-feature.md`
- 編號從 01 開始，按建立順序遞增
- 檔名使用英文，內容使用繁體中文

### PRP 執行完成後的必要步驟
1. **重新命名檔案**：在編號後加上 `v-`（例如：`01-feature.md` → `01v-feature.md`）
2. **更新 PRPs/README.md**：
   - 將該 PRP 狀態改為 ✅ 已完成
   - 填入執行日期
   - 更新「下一個 PRP 編號」為新的編號
3. **提交 Git 變更**：包含檔案重新命名和 README 更新

## 📋 PRP 目錄管理

### 中央狀態追蹤
- PRPs/README.md 是所有 PRP 的中央狀態追蹤檔案
- 必須保持此檔案為最新狀態，方便追蹤專案進度
- 未執行的 PRP 保持原編號：`02-another-feature.md`

## 🔄 執行階段管理

### 5 個標準階段
1. **Phase 1**: 類型定義與分析器
2. **Phase 2**: 後端服務實作
3. **Phase 3**: 前端元件實作
4. **Phase 4**: 系統整合
5. **Phase 5**: 測試與驗證

### 每個階段的檢查點
- 完成開發任務
- 執行對應的 Agent 檢查
- 修復所有 Critical 問題
- 更新 TodoWrite 狀態

## 📊 品質閥門

### Agent 檢查必須通過
- 不執行 Agent 不能進入下一個 Phase
- Critical 問題必須修復才能繼續
- 所有檢查結果必須文件化

### 文件化要求
- Agent 報告保存至 `/docs/agent-reports/[date]-prp-[number]/`
- TodoWrite 包含所有 Agent 檢查任務
- 階段完成總結