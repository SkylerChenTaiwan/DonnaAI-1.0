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