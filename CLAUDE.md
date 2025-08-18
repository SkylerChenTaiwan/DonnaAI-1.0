### 🌐 語言要求
- **所有溝通必須使用繁體中文**：
  - 與使用者的對話
  - 程式碼註解
  - 文件內容（.md 檔案）
  - PRP 文件
  - Git commit 訊息
  - 錯誤訊息和日誌
- **例外情況**：
  - 程式碼本身（變數名、函數名等）
  - 技術專有名詞（如 Firebase、TypeScript）
  - 引用的外部文件連結

### 🔄 專案基礎
- **檢查 `INITIAL.md`** 開始新對話時了解專案概覽和功能需求
- **參考 `ARCHITECTURE.md`** 實作新功能、使用 Firebase 服務、設定 AI 整合時
- **檢查 `TASK.md`** 開始新任務前，如果任務不在列表中則新增
- **🚨 執行 PRP 必須嚴格遵循** `/docs/workflows/PRP-EXECUTION-STANDARD.md` 的所有階段和檢查點
- **考慮整個專案影響** 避免局部思維
- **使用 venv_linux** 執行所有 Python 指令，包括單元測試

### 🧱 開發標準
- **檔案不超過 500 行**，接近此限制時重構成模組或輔助檔案
- **模組化組織**，按功能或責任分組：
  ```
  - agent.py - 主要 agent 定義和執行邏輯
  - tools.py - agent 使用的工具函數
  - prompts.py - 系統提示詞
  ```
- **一致的匯入** 優先使用相對匯入
- **使用 python_dotenv 和 load_env()** 處理環境變數

### 🧪 測試與可靠性
- **新功能必須建立 Pytest 單元測試**
- **更新邏輯後檢查測試** 需要時更新現有測試
- **測試放在 `/tests` 資料夾** 鏡像主程式結構，包含：
  - 1 個預期使用測試
  - 1 個邊界條件測試
  - 1 個失敗情況測試

### ✅ Git 管理（強制執行）
- **強制提交所有程式碼變更** 使用描述性訊息：
  ```
  [type]: Brief description
  
  Reason: Why this change was made
  Effect: Expected outcome
  ```
- **立即更新 `TASK.md`**：
  - 開始任務時標記 🔄 進行中
  - 完成任務時標記 ✅ 完成
  - 發現新 TODO 時加入 ⏳ 待處理

### 📎 程式碼風格
- **使用 Python** 作為主要語言
- **遵循 PEP8**，使用型別提示，用 `black` 格式化
- **使用 `pydantic` 進行資料驗證**
- **每個函數寫 docstring** 使用 Google 風格：
  ```python
  def example():
      """
      Brief summary.

      Args:
          param1 (type): Description.

      Returns:
          type: Description.
      """
  ```

### 🤖 Agent 自動觸發規則

#### 📝 開發完成後自動觸發
- **修改 UI 元件後** → 自動啟動 `ui-visual-tester` + `code-refactor-optimizer`
- **寫完新功能後** → 自動啟動 `interaction-tester` + `typescript-type-guardian`
- **重構程式碼後** → 自動啟動 `code-refactor-optimizer`

#### 🚨 問題發生時自動觸發
- **TypeScript 編譯錯誤** → 自動啟動 `typescript-type-guardian`
- **測試失敗** → 自動啟動 `test-results-analyzer` → `interaction-tester`
- **UI 顯示異常** → 自動啟動 `ui-visual-tester` → `ux-journey-analyzer`

#### 🎯 特定任務自動觸發
- **新功能開發** → 自動啟動 `ux-flow-designer` (規劃) → `interaction-tester` (驗證)
- **Bug 修復** → 自動啟動 `bug-hunter` (分析) → `test-results-analyzer` (驗證)

#### 🔧 Agent 控制選項
- **跳過 Agent**: 說「不用檢查」就跳過自動觸發
- **指定 Agent**: 說「用 [agent-name] 檢查」來覆蓋預設
- **手動觸發**: 隨時說「請用 [agent-name] 分析」

### 🧠 AI 行為規則
- **不假設遺漏的脈絡**，不確定時提問
- **不虛構函式庫或函數**，只使用已知的 Python 套件
- **確認檔案路徑和模組名稱** 引用前先確認存在
- **不刪除或覆寫現有程式碼** 除非明確指示或來自 `TASK.md` 任務

### 🚨 錯誤分析協定
- **不立即修復錯誤** 先建立分析報告至 `/docs/error-reports/[date]-[error-description].md`
- **錯誤報告必須包含** 根本原因分析、多個解決方案選項、影響評估
- **與使用者討論報告** 實作修復前
- **更新 TASK.md** 記錄選擇的解決方案

### 📋 變更規劃要求
- **所有重要變更需要規劃文件** 實作前：
  - 新功能：`/docs/plans/features/[feature-name].md`
  - Bug 修復：`/docs/plans/fixes/[issue-description].md`
  - 重構：`/docs/plans/refactoring/[component].md`
- **獲得使用者批准** 規劃後才繼續
- **連結規劃文件** 在 TASK.md 中加入相關任務時

### 🛠️ 錯誤報告產生器
**觸發關鍵字**: `/error-report` 或 `/錯誤報告`
**自動執行**:
1. 分析當前對話中的技術問題
2. 產生結構化錯誤報告
3. 儲存至 `./docs/error-reports/[date]-[issue].md`
4. 提供報告摘要和分享建議

### 📚 詳細規範參考
- **Web 平台開發 (Next.js + Radix UI)** → `/docs/development/WEB-ADAPTIVE-GUIDE.md`
- **Firebase 開發指南** → `/docs/development/FIREBASE-GUIDE.md`  
- **Agent 工作流程** → `/docs/workflows/AGENT-WORKFLOWS.md`
- **🚨 PRP 執行標準規範（強制遵循）** → `/docs/workflows/PRP-EXECUTION-STANDARD.md`

---

### 📁 文件目錄結構
```
./docs/
├── development/           # 開發規範和指南
│   ├── WEB-ADAPTIVE-GUIDE.md
│   └── FIREBASE-GUIDE.md
├── workflows/            # 工作流程文件
│   ├── AGENT-WORKFLOWS.md
│   └── PRP-EXECUTION.md
├── error-reports/        # 錯誤報告
├── agent-reports/        # Agent 分析報告
└── plans/               # 變更規劃文件
```