# Contains Studio Agents 整合對應表

## Trouble-shooting 工作流程

### 適用的 Contains Studio Agents 組合

#### 1. 錯誤分析階段
**主要 Agent**: `test-results-analyzer` (testing部門)
- 分析測試結果和錯誤模式
- 識別 flaky tests 和覆蓋率問題
- 產生品質指標報告

**協作 Agent**: `bug-hunter` (engineering部門) 
- 使用二分搜尋找出引入 bug 的 commit
- 快速定位問題根源

#### 2. 錯誤修復階段
**主要 Agent**: `test-writer-fixer` (engineering部門)
- 修復失敗的測試
- 區分測試問題和程式碼問題
- 確保測試意圖不變

**協作 Agent**: `code-reviewer` (engineering部門)
- 審查修復的程式碼
- 確保符合最佳實踐
- 防止引入新問題

#### 3. 工作流程優化
**主要 Agent**: `workflow-optimizer` (testing部門)
- 識別開發流程瓶頸
- 優化人機協作
- 減少重複性工作

### 觸發流程
```yaml
使用者輸入 "/錯誤":
  1. test-results-analyzer 開始分析
  2. 如果需要追蹤歷史 → bug-hunter 介入
  3. test-writer-fixer 修復問題
  4. code-reviewer 審查變更
  5. workflow-optimizer 提供流程改進建議
```

## PRP 管理工作流程

### 適用的 Contains Studio Agents 組合

#### 1. PRP 規劃階段
**主要 Agent**: `sprint-prioritizer` (product部門)
- 6天衝刺規劃
- 優先級排序
- 價值最大化

**協作 Agents**:
- `spec-writer` (product部門): 撰寫詳細規格
- `risk-assessor` (product部門): 評估技術風險

#### 2. 開發執行階段
**主要 Agent**: `studio-producer` (project-management部門)
- 協調跨團隊合作
- 管理依賴關係
- 確保持續交付

**協作 Agents**:
- `code-shipper` (engineering部門): 管理程式碼發布
- `dependency-updater` (engineering部門): 處理依賴更新

#### 3. 發布管理階段
**主要 Agent**: `project-shipper` (project-management部門)
- 6週發布週期管理
- 上線檢查清單
- 風險評估和緩解

**協作 Agents**:
- `marketing-launcher` (marketing部門): 協調市場推廣
- `support-hero` (studio-operations部門): 準備客服支援

### 觸發流程
```yaml
建立新 PRP:
  1. sprint-prioritizer 分析並排序任務
  2. spec-writer 完善技術規格
  3. risk-assessor 評估風險
  4. studio-producer 制定執行計劃
  5. 開發過程中各 agents 協同工作
  6. project-shipper 管理最終發布
```

## 整合實作方案

### 1. Agent 調用機制
```python
# 在 CLAUDE.md 中定義觸發規則
class AgentOrchestrator:
    def __init__(self):
        self.agent_mappings = {
            "錯誤分析": ["test-results-analyzer", "bug-hunter"],
            "錯誤修復": ["test-writer-fixer", "code-reviewer"],
            "PRP規劃": ["sprint-prioritizer", "spec-writer", "risk-assessor"],
            "PRP執行": ["studio-producer", "code-shipper"],
            "PRP發布": ["project-shipper", "marketing-launcher"]
        }
    
    def handle_command(self, command, context):
        if command == "/錯誤":
            return self.run_troubleshooting_workflow(context)
        elif command == "/PRP" or command == "/開發":
            return self.run_prp_workflow(context)
```

### 2. 工作流程定義
```yaml
troubleshooting_workflow:
  name: "錯誤診斷與修復"
  agents:
    - test-results-analyzer:
        role: "主導分析"
        output: "錯誤模式報告"
    - bug-hunter:
        role: "歷史追蹤"
        trigger: "當需要找出問題來源時"
    - test-writer-fixer:
        role: "修復執行"
        input: "錯誤分析報告"
    - code-reviewer:
        role: "品質把關"
        input: "修復後的程式碼"
    - workflow-optimizer:
        role: "流程改進"
        output: "優化建議"

prp_workflow:
  name: "PRP 全生命週期管理"
  phases:
    planning:
      agents: [sprint-prioritizer, spec-writer, risk-assessor]
      duration: "1-2 天"
    execution:
      agents: [studio-producer, code-shipper, dependency-updater]
      duration: "3-4 天"
    release:
      agents: [project-shipper, marketing-launcher, support-hero]
      duration: "1 天"
```

### 3. 整合到現有系統

#### 修改 CLAUDE.md
```markdown
## Contains Studio Agents 整合

### 自動觸發 Agents
當遇到以下情況時，會自動調用相應的 agents 組合：

#### 錯誤處理流程
- 觸發詞：`/錯誤` 或檢測到錯誤
- 執行順序：
  1. `test-results-analyzer`: 分析錯誤模式
  2. `bug-hunter`: 追蹤問題來源（如需要）
  3. `test-writer-fixer`: 修復測試或程式碼
  4. `code-reviewer`: 審查修復
  5. `workflow-optimizer`: 提供改進建議

#### PRP 管理流程
- 觸發詞：`/PRP` 或 `/開發`
- 執行階段：
  1. **規劃期**：`sprint-prioritizer` + `spec-writer` + `risk-assessor`
  2. **執行期**：`studio-producer` + `code-shipper`
  3. **發布期**：`project-shipper` + 相關支援 agents

### 手動調用特定 Agent
- `/agent [agent-name]`: 直接調用特定 agent
- 例如：`/agent bug-hunter` 來追蹤特定 bug 的來源
```

### 4. 實際使用範例

#### Trouble-shooting 範例
```markdown
使用者：我遇到了 TypeScript 編譯錯誤，請幫我分析
助理：我會調用 trouble-shooting agents 來協助你：

1. **test-results-analyzer** 正在分析錯誤...
   - 錯誤類型：型別不匹配
   - 影響範圍：3 個檔案
   - 嚴重程度：中

2. **bug-hunter** 正在追蹤問題來源...
   - 找到引入問題的 commit: abc123
   - 變更內容：更新了介面定義

3. **test-writer-fixer** 正在修復...
   - 更新了 3 個檔案的型別定義
   - 修復了相關測試

4. **code-reviewer** 審查結果：
   - 修復符合 TypeScript 最佳實踐
   - 沒有引入新的問題

5. **workflow-optimizer** 建議：
   - 建議在 CI 中加入更嚴格的型別檢查
   - 可以使用 pre-commit hook 預防類似問題
```

#### PRP 管理範例
```markdown
使用者：我要開發一個新的使用者通知功能
助理：我會協調 PRP agents 來規劃和執行：

**規劃階段** (Day 1-2):
- **sprint-prioritizer**: 
  - 優先級：高
  - 預估工作量：4 天
  - 建議分解為 3 個子任務

- **spec-writer**:
  - 已生成詳細技術規格
  - 定義了 API 介面和資料模型

- **risk-assessor**:
  - 技術風險：中（需要整合第三方服務）
  - 建議：先實作 MVP 版本

**執行階段** (Day 3-4):
- **studio-producer** 協調開發
- **code-shipper** 管理分支和合併

**發布階段** (Day 5-6):
- **project-shipper** 執行發布檢查清單
- 協調相關團隊準備上線
```

## 下一步行動

1. 確認這個整合對應方案
2. 更新 CLAUDE.md 加入 agents 調用規則
3. 建立 agents 協作腳本
4. 測試整合效果