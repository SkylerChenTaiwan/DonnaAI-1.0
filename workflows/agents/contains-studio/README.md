# Contains Studio Agents

這個目錄包含了從 [contains-studio/agents](https://github.com/contains-studio/agents) 下載的專業 AI agent 定義檔案，用於提升開發團隊的工作效率和品質。

## 目錄結構

### Engineering (工程)
- **ai-engineer.md** - AI/ML 功能實作、語言模型整合、推薦系統建置專家
- **backend-architect.md** - API 設計、伺服器端邏輯、資料庫架構專家
- **bug-hunter.md** - 錯誤調查、除錯、根因分析專家
- **code-reviewer.md** - 程式碼審查、品質保證、架構評估專家
- **test-writer-fixer.md** - 測試撰寫、測試修復、測試覆蓋率提升專家

### Testing (測試)
- **test-results-analyzer.md** - 測試結果分析、品質指標報告、趨勢識別專家
- **workflow-optimizer.md** - 工作流程優化、人機協作效率分析專家

### Product (產品)
- **feedback-synthesizer.md** - 用戶反饋分析、意見綜合、產品洞察專家
- **risk-assessor.md** - 風險評估、失效模式分析、風險緩解策略專家
- **spec-writer.md** - 產品規格撰寫、技術需求文件、用戶故事專家
- **sprint-prioritizer.md** - 衝刺規劃、功能優先排序、6天開發週期專家

### Project Management (專案管理)
- **project-shipper.md** - 產品發布協調、上市策略、發布流程管理專家
- **studio-producer.md** - 跨團隊協調、資源配置、工作流程優化專家

## 使用方式

這些 agent 檔案定義了各種專業角色的職責、專長和工作方法。每個檔案包含：

### YAML Frontmatter
```yaml
---
name: agent-name
description: 使用情境和範例說明
color: 顏色標識
tools: 可用工具列表
---
```

### Markdown 內容
- **核心職責**：該 agent 的主要責任範圍
- **專業技能**：具體的技術和方法論專長
- **工作流程**：標準化的工作程序和最佳實踐
- **品質標準**：品質要求和成功指標
- **工具整合**：相關工具和技術的使用方法

## 整合到專案中

這些 agent 定義可以用於：

1. **團隊指導**：為團隊成員提供角色期望和最佳實踐指引
2. **流程標準化**：建立一致的工作流程和品質標準
3. **AI 輔助開發**：作為 AI 助手的專業知識庫和行為模式
4. **培訓資源**：新團隊成員的培訓材料和學習指南
5. **品質保證**：確保各個環節的專業品質和一致性

## 6天開發週期整合

這些 agent 特別針對快速開發週期進行了優化：

- **Day 1-2**: 使用 sprint-prioritizer 和 spec-writer 進行規劃
- **Day 3-4**: 使用 engineering agents 進行開發和測試
- **Day 5-6**: 使用 testing agents 和 project-shipper 進行品質保證和發布

## 自訂和擴展

可以根據專案需求自訂這些 agent 定義：

1. 調整工具列表以符合專案技術棧
2. 增加專案特定的工作流程和標準
3. 整合現有的開發工具和平台
4. 根據團隊經驗調整複雜度和深度

## 版本控制

- 原始檔案來源：https://github.com/contains-studio/agents
- 本地自訂版本：根據 DonnaAI 專案需求進行調整
- 定期更新：建議定期檢查原始 repository 的更新

## 使用許可

請參考原始 repository 的許可條款：https://github.com/contains-studio/agents/blob/main/LICENSE