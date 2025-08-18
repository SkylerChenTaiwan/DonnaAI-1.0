# PRP 自動化系統

PRP (Product Requirements Prompt) 自動化管理工具，提供完整的 PRP 生命週期管理。

## 🚀 快速開始

```bash
# 檢查所有 PRP 狀態
./scripts/prp-automation/prp status

# 完成指定 PRP
./scripts/prp-automation/prp complete 122

# 同步 README 狀態
./scripts/prp-automation/prp sync
```

## 📁 工具結構

```
scripts/prp-automation/
├── prp                    # 主要命令行工具
├── complete-prp.js        # PRP 自動完成腳本
├── check-prp-status.js    # PRP 狀態檢查器
├── sync-readme.js         # README 同步器
└── README.md             # 本說明文件
```

## 🛠 功能特色

### ✅ 自動完成檢測
- 分析 Success Criteria 完成度
- 檢查 Agent 測試完成狀態
- 計算整體進度百分比
- 智能判斷是否可以標記為完成

### 📋 狀態管理
- 自動重新命名檔案（加上 `v` 標記）
- 同步更新 README.md 狀態表
- 產生詳細完成報告
- 自動提交 git 變更

### 🔍 批量檢查
- 掃描所有 PRP 檔案狀態
- 識別檔案與 README 的不一致
- 找出準備完成的 PRP
- 生成詳細狀態報告

## 📝 使用指南

### 1. 檢查 PRP 狀態

```bash
# 檢查所有 PRP 的狀態
./prp status
```

輸出範例：
```
📊 PRP 狀態摘要:
   總數: 125
   ✅ 正確完成: 120
   📋 正確未完成: 3
   🚀 準備完成: 2
   ⚠️ 錯誤標記: 0
   ❌ 檢查錯誤: 0
   🔍 狀態不一致: 0

🚀 可以立即完成的 PRP:
   node scripts/prp-automation/complete-prp.js 122
   node scripts/prp-automation/complete-prp.js 123
```

### 2. 自動完成 PRP

```bash
# 自動完成 PRP-122
./prp complete 122

# 強制完成（忽略完成度檢查）
./prp complete 122 --force
```

完成流程：
1. ✅ 檢查 PRP 完成狀態（Success Criteria + Agent 測試）
2. 📝 重新命名檔案（`122-xxx.md` → `122v-xxx.md`）
3. 📄 更新 README.md 狀態
4. 📋 產生完成報告
5. 📤 自動提交 git

### 3. 同步 README 狀態

```bash
# 同步 README（不提交）
./prp sync

# 同步並自動提交
./prp sync --commit
```

### 4. 列出所有 PRP

```bash
./prp list
```

### 5. 查看準備完成的 PRP

```bash
./prp ready
```

## 🎯 完成標準

PRP 必須滿足以下條件才能自動標記為完成：

### 基本要求
- **Success Criteria 完成率 ≥ 80%**
- **Agent 測試完成率 ≥ 80%**  
- **整體進度 ≥ 80%**

### Success Criteria 格式
```markdown
### Success Criteria
Backend:
- [x] 功能 A 實作完成 ✅
- [x] 功能 B 測試通過 ✅
- [ ] 功能 C 部署完成

Frontend:
- [x] UI 元件開發完成 ✅
- [x] 響應式設計實作 ✅
```

### Agent 測試格式
```markdown
### Agent 測試要求
- [x] **interaction-tester**: 互動功能測試 ✅
- [x] **ui-visual-tester**: 視覺一致性驗證 ✅
- [ ] **ux-journey-analyzer**: 用戶流程驗證
```

## 📊 報告輸出

### 完成報告
位置: `/docs/prp-completion-reports/prp-{編號}-completion-{日期}.md`

包含：
- 完成狀態概覽
- Success Criteria 統計
- Agent 測試結果
- 功能描述
- 未完成項目（如有）

### 狀態報告  
位置: `/docs/prp-status-reports/prp-status-{日期}.md`

包含：
- 所有 PRP 的狀態分類
- 不一致問題識別
- 建議行動清單
- 可自動完成的 PRP 列表

## ⚙️ 高級配置

### 修改完成標準

編輯 `complete-prp.js` 中的 CONFIG：

```javascript
const CONFIG = {
  minCompletionPercentage: 80,     // 最低完成度要求
  requiredSuccessCriteria: 0.8,    // Success Criteria 必須完成比例
  // ...
};
```

### 自訂檢查規則

可以在 `checkPrpCompletion` 函數中加入自訂的檢查邏輯：

```javascript
// 檢查特定關鍵字
if (content.includes('CRITICAL')) {
  // 加入特殊處理
}
```

## 🔧 故障排除

### 常見問題

**1. 無法找到 PRP 檔案**
```bash
❌ 找不到 PRP-122 檔案
```
- 檢查 PRP 編號是否正確
- 確認檔案在 `/PRPs/` 目錄中
- 檢查檔名格式：`122-功能名稱.md`

**2. Git 提交失敗**
```bash
⚠️ Git 提交失敗: ...
```
- 檢查 git 狀態和權限
- 確認沒有衝突的變更
- 手動檢查並修復 git 狀態

**3. 完成度檢查錯誤**
```bash
❌ 檢查錯誤: Cannot read property...
```
- 檢查 PRP 檔案格式是否正確
- 確認 Markdown 語法無誤
- 使用 `--force` 參數跳過檢查

### 手動修復

如果自動化腳本出現問題，可以手動執行：

```bash
# 1. 重新命名檔案
mv PRPs/122-feature.md PRPs/122v-feature.md

# 2. 手動更新 README.md
# 找到對應行並更新狀態為 ✅ 已完成

# 3. 提交變更
git add .
git commit -m "feat: 手動完成 PRP-122"
```

## 🎯 最佳實踐

### 開發期間
1. 定期運行 `./prp status` 檢查進度
2. 完成功能後立即更新 Success Criteria
3. 執行相關 Agent 測試並標記結果
4. 達到標準後立即使用 `./prp complete` 

### 專案管理
1. 每日檢查 `./prp ready` 查看可完成的 PRP
2. 定期運行 `./prp sync` 保持狀態同步  
3. 使用狀態報告追蹤專案進度
4. 建立自動化 CI 檢查（可選）

## 🔗 相關文件

- [PRP 執行流程](/docs/workflows/PRP-EXECUTION.md)
- [Agent 協作流程](/workflows/commands/execute-prp-with-agents.md)
- [個人工作流程](/workflows/personal/)

---

**提示**: 使用 `./prp help` 可以隨時查看命令說明。