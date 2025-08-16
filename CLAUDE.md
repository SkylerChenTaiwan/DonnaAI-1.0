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

### 🔄 Project Awareness & Context
- **Check `INITIAL.md`** at the start of a new conversation for project overview and feature requirements.
- **Consult `ARCHITECTURE.md`** when:
  - Implementing new features that need technical specifications
  - Working with Firebase services (Auth, Firestore, Storage, Functions)
  - Setting up AI integrations or Cloud Functions
  - Implementing UI components following Notion style
  - Understanding the project structure and dependencies
- **Check `TASK.md`** before starting a new task. If the task isn't listed, add it with a brief description and today's date.
- **Consider whole project impact** before making changes - avoid tunnel vision.
- **Check version compatibility** in requirements.txt/package.json before updates.
- **Document significant architecture changes** in ARCHITECTURE.md.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `ARCHITECTURE.md`.
- **Use venv_linux** (the virtual environment) whenever executing Python commands, including for unit tests.

### 🧱 Code Structure & Modularity
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
  For agents this looks like:
    - `agent.py` - Main agent definition and execution logic 
    - `tools.py` - Tool functions used by the agent 
    - `prompts.py` - System prompts
- **Use clear, consistent imports** (prefer relative imports within packages).
- **Use clear, consistent imports** (prefer relative imports within packages).
- **Use python_dotenv and load_env()** for environment variables.

### 🧪 Testing & Reliability
- **Always create Pytest unit tests for new features** (functions, classes, routes, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live in a `/tests` folder** mirroring the main app structure.
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case

### ✅ Task Completion & Git Management
- **IMPORTANT: Create `TASK.md` if it doesn't exist** at the beginning of any development session.
- **Update `TASK.md` IMMEDIATELY** when:
  - Starting any new task (mark as 🔄 進行中)
  - Completing any task (mark as ✅ 完成)
  - Discovering new TODOs (add to ⏳ 待處理)
- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- **MANDATORY: Commit all code changes to Git** with descriptive messages:
  ```
  [type]: Brief description
  
  Reason: Why this change was made
  Effect: Expected outcome
  ```
- Add new sub-tasks or TODOs discovered during development to `TASK.md` under a "Discovered During Work" section.

### 📎 Style & Conventions
- **Use Python** as the primary language.
- **Follow PEP8**, use type hints, and format with `black`.
- **Use `pydantic` for data validation**.
- Use `FastAPI` for APIs and `SQLAlchemy` or `SQLModel` for ORM if applicable.
- Write **docstrings for every function** using the Google style:
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

### 📚 Documentation & Explainability
- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

### 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified Python packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `TASK.md`.

### 🎨 UI/UX 開發原則
- **避免重複的標題區塊** - 如果 Layout 元件已經提供 header 功能，不要在內容中再建立一個標題區塊
- **善用 Layout headerProps** - 使用 `headerProps` 屬性設定標題、返回按鈕、右側元件等
- **保持一致的導航體驗** - 不要在不同頁面使用不同的 header 樣式
- **避免重複實作導航元件** - 使用統一的 Layout 元件管理所有頁面的 header、返回按鈕等

### 🎨 顏色系統規範（重要！）
- **禁止使用** `color + 'XX'` 格式處理透明度 - 會導致 Web 平台 CSSStyleDeclaration 錯誤
- **必須使用** `withAlpha(color, alpha)` 函數處理顏色透明度
- **參考文件** `/docs/COLOR-SYSTEM-MIGRATION.md`
- **自動修復** 執行 `node scripts/fix-color-styles.js` 可自動修復所有問題

### 🌐 Web 平台樣式系統（重要！）
- **問題背景** - React Native Web 樣式經常被全域 CSS（如 NotionDatabaseV4.css）覆蓋
- **解決方案** - Web 平台使用原生 HTML 元素 + 內聯樣式
- **實作範例**：
  ```typescript
  if (Platform.OS === 'web') {
    // 使用原生 HTML + 內聯樣式（優先級最高）
    return <input style={{ padding: '12px 16px', border: '1px solid #E3E1DC' }} />;
  }
  // Native 平台使用 React Native 元件
  return <TextInput style={styles.input} />;
  ```
- **必讀文件**：
  - `/docs/WEB-STYLE-SYSTEM.md` - 詳細問題分析和解決方案
  - `/docs/STYLE-DEVELOPMENT-GUIDE.md` - 開發指南和檢查清單
- **開發前檢查**：
  1. 是否有全域 CSS 會影響？
  2. 是否需要為 Web 平台特殊處理？
  3. 內聯樣式是否完整？
- **部署前清理快取**：
  ```bash
  rm -rf .expo node_modules/.cache
  npm run web:build
  ```

### 🎯 Adaptive 元件使用規範（強制執行）
#### ⚠️ 重要：ESLint 和 Pre-commit 會自動檢查並阻擋違規程式碼

#### 📊 元件使用決策流程
```
需要 UI 元件？
    ↓
檢查 Adaptive 元件庫 (@/components/adaptive)
    ↓
┌─ 存在 → 使用 Adaptive 元件 ✅
│
└─ 不存在 → 使用頻率？
            ├─ 高頻(3+處) → 建立新 Adaptive 元件 → 加入元件庫
            └─ 低頻(1-2處) → Platform.OS？
                           ├─ Web → 原生 HTML + 內聯樣式
                           └─ Native → React Native 元件
```

#### 🚫 禁用元件黑名單（自動檢查）
| ❌ 絕對不要用 | ✅ 必須使用 | 原因 | VS Code 快捷鍵 |
|--------------|------------|------|---------------|
| Switch (react-native) | AdaptiveSwitch | 樣式被覆蓋 | `ias` |
| Picker | AdaptiveSelect | 背景透明問題 | `iase` |
| TextInput (直接) | AdaptiveInput | 樣式不一致 | `iai` |
| Modal (直接) | AdaptiveModal | 顯示問題 | `iam` |
| Button (直接) | AdaptiveButton | 顏色問題 | `iab` |

#### ✅ 可用 Adaptive 元件清單（20+ 元件已完成！）
```typescript
// 從 @/components/adaptive 匯入
import {
  // 基礎元件 (PRP-94)
  AdaptiveButton,    // ✅ 按鈕元件
  AdaptiveModal,     // ✅ 模態框 (PRP-107)
  AdaptiveSelect,    // ✅ 下拉選單
  AdaptiveInput,     // ✅ 輸入框
  AdaptiveText,      // ✅ 文字元件
  AdaptiveView,      // ✅ 容器元件
  AdaptiveImage,     // ✅ 圖片元件
  
  // 表單元件 (PRP-111, PRP-113)
  AdaptiveSwitch,    // ✅ 開關 (PRP-111)
  AdaptiveCheckbox,  // ✅ 複選框 (PRP-113)
  AdaptiveRadio,     // ✅ 單選按鈕 (PRP-113)
  AdaptiveRadioGroup,// ✅ 單選群組 (PRP-113)
  AdaptiveSearchBar, // ✅ 搜尋欄 (PRP-113)
  AdaptiveDatePicker,// ✅ 日期選擇器 (PRP-113)
  AdaptiveSlider,    // ✅ 滑動條 (PRP-113)
  
  // UI 容器元件 (PRP-113)
  AdaptiveCard,      // ✅ 卡片容器
  AdaptiveDivider,   // ✅ 分隔線
  AdaptiveAvatar,    // ✅ 頭像
  
  // 互動元件 (PRP-113)
  AdaptiveTabs,      // ✅ 標籤頁
} from '@/components/adaptive';
```

#### 🔍 開發前必須檢查清單
- [ ] 檢查 `/src/components/adaptive/core/` 是否有對應元件
- [ ] 會在 Web 平台使用嗎？
- [ ] 有樣式被覆蓋的風險嗎？
- [ ] 需要建立新的 Adaptive 元件嗎？

#### 🛠️ 建立新 Adaptive 元件 SOP
1. **建立目錄結構**
   ```
   src/components/adaptive/core/AdaptiveXXX/
   ├── index.tsx           # Platform.select 入口
   ├── AdaptiveXXX.web.tsx # Web 版本（內聯樣式）
   ├── AdaptiveXXX.native.tsx # Native 版本
   ├── AdaptiveXXX.types.ts # 類型定義
   └── __tests__/
       └── AdaptiveXXX.test.tsx
   ```

2. **實作 Web 版本重點**
   - 必須使用原生 HTML 元素
   - 必須使用內聯樣式（style 屬性）
   - 避免使用 className 或外部 CSS

3. **更新匯出**
   - 加入 `/src/components/adaptive/core/index.ts`
   - 更新此文件的元件清單

#### ⚠️ 常見錯誤和解決方案
| 症狀 | 原因 | 解決方案 | ESLint 提示 |
|------|------|----------|------------|
| 按鈕黑字黑底 | 全域 CSS 覆蓋 | 使用 AdaptiveButton | ❌ no-restricted-imports |
| Switch 軌道透明 | CSS 優先級問題 | 使用 AdaptiveSwitch | ❌ adaptive/use-adaptive-components |
| 下拉選單無背景 | Picker 不相容 | 使用 AdaptiveSelect | ❌ no-restricted-imports |
| Input 無內邊距 | 樣式被覆蓋 | 使用 AdaptiveInput | ⚠️ adaptive/check-adaptive-availability |

#### 🚀 VS Code 快捷鍵（已配置）
- `ias` - Import AdaptiveSwitch
- `iase` - Import AdaptiveSelect  
- `iam` - Import AdaptiveModal
- `iab` - Import AdaptiveButton
- `iai` - Import AdaptiveInput
- `iaall` - Import 所有 Adaptive 元件
- `platform` - Platform.OS 條件判斷模板

#### 📈 監控和報告
執行 `npm run adaptive:stats` 查看：
- Adaptive 元件使用覆蓋率
- 需要修正的檔案清單
- 建議新增的 Adaptive 元件

### 🔐 Firebase 安全規則管理
- **新增集合時必須同步更新 Firestore 規則** - 任何新的集合都需要在 `firestore.rules` 中定義相應的權限
- **開發時先在 Firebase 模擬器測試** - 使用 `firebase emulators:start` 在本地測試規則，避免部署後才發現權限問題
- **規則部署檢查清單**：
  1. 確認所有新集合都有對應的 match 規則
  2. 測試 Super Admin、組織管理員、一般用戶的權限
  3. 確保沒有過度開放的權限（避免 `allow read, write: if true`）
- **常見權限錯誤排查**：
  - `Missing or insufficient permissions` - 檢查是否有遺漏的集合規則
  - 確認用戶角色是否正確設定
  - 檢查規則中的函數邏輯是否正確

### 🚨 Error Analysis Protocol
- **NEVER fix errors immediately** - create an analysis report first at `/docs/error-reports/[date]-[error-description].md`
- **Error report must include**: root cause analysis, multiple solution options, impact assessment
- **Discuss the report with user** before implementing any fixes
- **Update TASK.md** with the chosen solution approach

### 📋 Change Planning Requirements
- **All significant changes require a plan document** before implementation:
  - New features: `/docs/plans/features/[feature-name].md`
  - Bug fixes: `/docs/plans/fixes/[issue-description].md`
  - Refactoring: `/docs/plans/refactoring/[component].md`
- **Get user approval** on the plan before proceeding
- **Link plan documents in TASK.md** when adding related tasks

### 📝 PRP 管理流程
- **PRP 檔案命名規則**：
  - 新建 PRP 檔案必須以編號開始：`01-feature-name.md`、`02-another-feature.md`
  - 編號從 01 開始，按建立順序遞增
  - 檔名使用英文，內容使用繁體中文
- **PRP 執行完成後的必要步驟**：
  1. **重新命名檔案**：在編號後加上 `v-`（例如：`01-feature.md` → `01v-feature.md`）
  2. **更新 PRPs/README.md**：
     - 將該 PRP 狀態改為 ✅ 已完成
     - 填入執行日期
     - 更新「下一個 PRP 編號」為新的編號
  3. **提交 Git 變更**：包含檔案重新命名和 README 更新
- **PRP 目錄管理**：
  - PRPs/README.md 是所有 PRP 的中央狀態追蹤檔案
  - 必須保持此檔案為最新狀態，方便追蹤專案進度
  - 未執行的 PRP 保持原編號：`02-another-feature.md`

### 🛠️ 自動化工作流程觸發器

#### 錯誤報告產生器
**觸發條件**: 當使用者說「產生錯誤報告」、「整理問題」、「幫我整理給工程師」或類似語句
**自動執行**:
1. 分析最近對話記錄（20-50則訊息）
2. 識別主要技術問題
3. 整理所有嘗試過的解決方案和結果
4. 收集相關程式碼片段和錯誤訊息
5. 產生結構化報告並儲存至 `/docs/error-reports/[日期]-[問題描述].md`
6. 使用以下模板格式：
   - 問題描述
   - 環境資訊
   - 問題時間軸
   - 嘗試過的解決方案（包含程式碼）
   - 當前狀況
   - 需要協助的具體問題
   - 相關資源連結

### 🤖 Contains Studio Agents 整合

#### Trouble-shooting 工作流程
當遇到錯誤或測試失敗時，使用以下 agents 組合：

**觸發方式**: `/錯誤` 或自動檢測到錯誤
**執行流程**:
1. **test-results-analyzer**: 分析錯誤模式和測試結果
   - 識別 flaky tests
   - 產生品質指標報告
   - 找出測試覆蓋率缺口
2. **bug-hunter**: 追蹤 bug 來源（需要時）
   - 使用二分搜尋找出引入 bug 的 commit
   - 快速定位問題根源
3. **test-writer-fixer**: 修復測試或程式碼
   - 區分測試問題和程式碼問題
   - 保持測試意圖不變
   - 系統性修復失敗
4. **code-reviewer**: 審查修復
   - 確保符合最佳實踐
   - 防止引入新問題
5. **workflow-optimizer**: 流程改進
   - 識別開發瓶頸
   - 提供自動化建議

#### PRP 管理工作流程
使用 agents 協作完成 PRP 的規劃、執行和發布：

**觸發方式**: 建立新 PRP 或 `/開發`
**執行階段**:

**規劃階段** (1-2天):
- **sprint-prioritizer**: 6天衝刺規劃和優先級排序
- **spec-writer**: 撰寫詳細技術規格
- **risk-assessor**: 評估技術和商業風險

**執行階段** (3-4天):
- **studio-producer**: 協調跨團隊合作
- **code-shipper**: 管理程式碼分支和合併
- **dependency-updater**: 處理依賴更新

**發布階段** (1天):
- **project-shipper**: 執行發布檢查清單
- **marketing-launcher**: 協調市場推廣（如需要）
- **support-hero**: 準備客服支援

#### 手動調用特定 Agent
- `/agent [agent-name]`: 直接調用特定 agent
- 例如：`/agent bug-hunter` 來追蹤特定 bug 的來源
- 可用 agents 列表請參考 [contains-studio/agents](https://github.com/contains-studio/agents)

### 🤖 自訂 Agents 整合

#### PRP 工作流程 Agents
當執行 `/generate-prp` 或 `/execute-prp` 時，以下 agents 會自動參與協作：

**📝 /generate-prp 規劃驗證 Agents**：
規劃階段自動啟動的 agents 組合：
- **spec-writer**: 撰寫技術規格（原有）
- **ux-flow-designer**: 設計完整用戶操作流程
  - 產出用戶流程圖和互動步驟定義
  - 標記關鍵決策點和用戶目標
- **ux-journey-analyzer**: 預先分析潛在 UX 問題
  - 驗證流程邏輯完整性
  - 識別可能的斷點和改進機會
- **typescript-type-guardian**: 建立型別架構
  - 根據需求定義介面和資料模型
  - 確保型別一致性和安全性
- **interaction-tester**: 規劃測試策略
  - 定義需要測試的互動點
  - 建立測試案例框架
- **risk-assessor**: 評估風險（原有）

PRP 文件將自動包含所有 agents 的產出，形成完整的規劃文件。

**🚀 /execute-prp 開發驗證 Agents**：
開發階段（第1-3天）持續協作：
- **backend-architect**: 後端架構設計（原有）
- **code-refactor-optimizer**: 持續程式碼優化
  - 每完成一個元件後自動檢查
  - 提供重構建議和最佳實踐
- **interaction-tester**: 增量測試
  - 為每個新功能產生測試
  - 驗證按鈕、表單等互動邏輯
- **typescript-type-guardian**: 型別安全保障
  - 即時修復型別錯誤
  - 維護型別定義完整性

整合測試階段（第4天）全面驗證：
- **interaction-tester**: 全面互動測試
  - 測試所有用戶路徑
  - 驗證錯誤處理和邊界條件
- **ui-visual-tester**: 視覺驗證
  - 截圖對比設計稿
  - 檢查響應式顯示和各種狀態
- **ux-journey-analyzer**: 流程完整性驗證
  - 確認實作符合設計
  - 驗證用戶可順利完成目標

發布準備階段（第5天）最終檢查：
- **typescript-type-guardian**: 最終型別檢查
- **code-refactor-optimizer**: 效能優化和程式碼清理
- **project-shipper**: 執行發布（原有）

#### Trouble-shooting Agents
當執行 `/trouble-shooting` 時，以下測試驗證 agents 會自動參與：

**🔍 問題重現階段**：
- **test-results-analyzer**: 分析測試結果（原有）
- **interaction-tester**: 重現問題步驟
  - 自動化重現用戶操作
  - 記錄問題發生條件
  - 產生最小重現案例
- **ux-journey-analyzer**: 分析問題脈絡
  - 追蹤用戶如何到達問題點
  - 識別相關的前置條件
  - 分析影響範圍

**🎯 問題定位階段**：
- **bug-hunter**: 追蹤 bug 來源（原有）
- **typescript-type-guardian**: 型別錯誤檢查
  - 檢查型別不匹配問題
  - 識別 any 類型濫用
  - 驗證資料流型別
- **ui-visual-tester**: 視覺差異分析
  - 對比正常與異常狀態
  - 截圖記錄問題現象
  - 檢查 CSS 覆蓋問題

**✅ 修復驗證階段**：
- **test-writer-fixer**: 修復測試（原有）
- **code-refactor-optimizer**: 提供優雅修復方案
  - 不只修復，還要優化
  - 防止類似問題再發生
  - 提供長期解決方案
- **interaction-tester**: 驗證修復效果
  - 確認問題已解決
  - 測試沒有引入新問題
  - 回歸測試相關功能
- **ux-journey-analyzer**: 確認流程恢復正常
  - 驗證用戶流程完整
  - 確認沒有破壞其他路徑

#### Agent 協作輸出
所有 agents 的產出會自動整合並儲存至：
- `/docs/agent-reports/` - Agent 分析報告
- `/docs/ux-flows/` - UX 流程設計文件
- `/docs/test-reports/` - 測試報告

### 🚀 PRP 執行時的 Agent 協作（強制執行）

#### 執行 PRP 時的自動觸發規則
當執行 `/execute-prp [prp-file]` 時，必須遵循以下 agent 協作流程：

**Phase 完成檢查點**：
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

**強制執行規則**：
- ❌ 不執行 agents 不能進入下一個 Phase
- ❌ Critical 問題不修復不能繼續
- ✅ 所有 agent 輸出必須保存到 `/docs/agent-reports/[date]-prp-[number]/`
- ✅ TodoWrite 必須包含 agent 檢查任務

**Agent 執行追蹤**：
```yaml
TodoWrite 格式:
- "Phase X: [開發任務]" 
- "Phase X Agent: Run [agent-name]"  # 必須緊跟在開發任務後
- "Phase X Agent Fix: [修復項目]"    # 根據 agent 建議的修復
```

**詳細流程文件**：
參考 `/workflows/commands/execute-prp-with-agents.md` 了解完整的 agent 協作流程。

## 🔧 錯誤報告產生器
  觸發關鍵字: `/error-report` 或 `/錯誤報告`
  自動執行:
  1. 分析當前對話中的技術問題
  2. 產生結構化錯誤報告
  3. 儲存至 ./docs/error-reports/[date]-[issue].md
  4. 提供報告摘要和分享建議

  2. 在專案 CLAUDE.md 中加入（專案設定）

  編輯當前專案的 CLAUDE.md，確保有文件目錄結構：

  ### 📁 文件目錄結構
  ./docs/
  ├── error-reports/      # 錯誤報告（/error-report 產生）
  ├── solutions/          # 解決方案文件
  └── guides/            # 開發指南

  使用方式

  設定完成後，你可以：
  - 輸入 /error-report - 產生標準錯誤報告
  - 輸入 /error-report brief - 產生簡短版本
  - 輸入 /error-report detailed - 產生詳細版本

  這個指令會自動：
  1. 分析對話記錄
  2. 識別問題和解決嘗試
  3. 整理程式碼範例
  4. 產生結構化報告
  5. 儲存到 /docs/error-reports/ 目錄